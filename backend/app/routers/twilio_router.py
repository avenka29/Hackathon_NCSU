"""
Twilio call management router.
Handles call initiation and webhook callbacks.
"""

from fastapi import APIRouter, HTTPException, Form, Request
from fastapi.responses import Response
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from datetime import datetime

from app.config import get_settings
from app.models import (
    CallInitiateRequest,
    CallInitiateResponse,
    CallStatus,
    CallEvent,
    EventType
)
from app.scenarios import get_scenario
from app.services.valkey_service import get_valkey_service
from app.services.detection_service import get_detection_service

router = APIRouter(prefix="/api/call", tags=["calls"])
settings = get_settings()

# Initialize Twilio client
twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)


@router.post("/initiate", response_model=CallInitiateResponse)
async def initiate_call(request: CallInitiateRequest):
    """
    Initiate a phone call to the user with the selected scenario.
    """
    valkey = get_valkey_service()

    try:
        # Validate scenario exists
        scenario = get_scenario(request.scenario_id)

        # Store scenario in Valkey keyed by phone number so webhook can look it up
        # This is needed because the webhook fires before we know the call SID
        valkey.client.setex(
            f"pending_call:{request.phone_number}",
            300,  # 5 min TTL
            request.scenario_id
        )

        # Initiate the call via Twilio
        call = twilio_client.calls.create(
            to=request.phone_number,
            from_=settings.twilio_phone_number,
            url=f"{settings.base_url}/api/call/webhook/start",
            status_callback=f"{settings.base_url}/api/call/webhook/status",
            method="POST"
        )

        # Create call session in Valkey
        valkey.create_call_session(
            call_sid=call.sid,
            phone_number=request.phone_number,
            scenario_id=request.scenario_id
        )

        # Log initial event
        valkey.log_event(call.sid, CallEvent(
            event_type=EventType.CALL_INITIATED,
            data={
                "phone_number": request.phone_number,
                "scenario_id": request.scenario_id,
                "scenario_name": scenario.name
            }
        ))

        return CallInitiateResponse(
            call_sid=call.sid,
            status=CallStatus.INITIATED,
            message=f"Call initiated to {request.phone_number}"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"ERROR in initiate_call: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")


@router.post("/webhook/start")
async def webhook_call_start(request: Request):
    """
    Webhook called when call is answered.
    Plays the first scammer line and starts gathering user input.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    called_number = form_data.get("To")

    valkey = get_valkey_service()
    session = valkey.get_call_session(call_sid)

    if not session:
        # Race condition: webhook fired before session was created.
        # Look up scenario by phone number from the pending call key.
        # Try multiple formats (Twilio may send To with/without +).
        scenario_id = None
        if called_number:
            scenario_id = (
                valkey.client.get(f"pending_call:{called_number}")
                or valkey.client.get(f"pending_call:+{called_number.lstrip('+')}")
                or valkey.client.get(f"pending_call:{called_number.lstrip('+')}")
            )
        if scenario_id:
            # Create the session now
            valkey.create_call_session(
                call_sid=call_sid,
                phone_number=called_number,
                scenario_id=scenario_id
            )
            session = valkey.get_call_session(call_sid)

    if not session:
        # Return error TwiML
        response = VoiceResponse()
        response.say("Sorry, there was an error. Goodbye.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    # Load scenario
    scenario = get_scenario(session["scenario_id"])

    # Update status
    valkey.update_call_status(call_sid, CallStatus.IN_PROGRESS)
    valkey.log_event(call_sid, CallEvent(
        event_type=EventType.CALL_ANSWERED,
        data={"call_sid": call_sid}
    ))

    # Get first scammer line (turn 1)
    first_line = next((line for line in scenario.lines if line.turn == 1), None)

    if not first_line:
        response = VoiceResponse()
        response.say("Sorry, scenario not configured properly.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    # Build TwiML response
    response = VoiceResponse()

    # Get cached audio URL from Valkey
    audio_url = valkey.get_cached_audio_url(session["scenario_id"], 1)

    # Play first scammer line
    if audio_url:
        response.play(audio_url)
    else:
        response.say(first_line.text)

    # Log scammer speech
    valkey.log_event(call_sid, CallEvent(
        event_type=EventType.SCAMMER_SPOKE,
        data={
            "turn": 1,
            "text": first_line.text
        }
    ))
    valkey.add_transcript_entry(call_sid, 1, "scammer", first_line.text)

    # Gather user response
    gather = Gather(
        input="speech",
        action=f"{settings.base_url}/api/call/webhook/gather",
        method="POST",
        timeout=8,
        speech_timeout="auto"
    )
    response.append(gather)

    # If no input, redirect back to re-prompt
    response.redirect(f"{settings.base_url}/api/call/webhook/gather")

    return Response(content=str(response), media_type="application/xml")


@router.post("/webhook/gather")
async def webhook_gather_speech(request: Request):
    """
    Webhook called after gathering user speech.
    Analyzes what they said, detects sensitive data, plays next scammer line.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    speech_result = form_data.get("SpeechResult", "")
    called_number = form_data.get("To")

    valkey = get_valkey_service()
    detector = get_detection_service()
    session = valkey.get_call_session(call_sid)

    # If session missing (e.g. race or restart), try to restore from pending_call
    if not session and called_number:
        scenario_id = (
            valkey.client.get(f"pending_call:{called_number}")
            or valkey.client.get(f"pending_call:+{called_number.lstrip('+')}")
            or valkey.client.get(f"pending_call:{called_number.lstrip('+')}")
        )
        if scenario_id:
            valkey.create_call_session(
                call_sid=call_sid,
                phone_number=called_number,
                scenario_id=scenario_id
            )
            session = valkey.get_call_session(call_sid)

    if not session:
        response = VoiceResponse()
        response.say("Error occurred. Goodbye.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    # current_turn tracks the last scammer turn that was played (odd numbers: 1, 3, 5, ...)
    current_turn = session["current_turn"]

    # If no speech was captured (timeout/redirect), re-prompt without advancing
    if not speech_result:
        scenario = get_scenario(session["scenario_id"])
        response = VoiceResponse()

        # Replay the current scammer line to re-prompt
        audio_url = valkey.get_cached_audio_url(session["scenario_id"], current_turn)
        current_line = next(
            (line for line in scenario.lines if line.turn == current_turn and line.speaker == "scammer"),
            None
        )
        if audio_url:
            response.play(audio_url)
        elif current_line:
            response.say(current_line.text)

        gather = Gather(
            input="speech",
            action=f"{settings.base_url}/api/call/webhook/gather",
            method="POST",
            timeout=8,
            speech_timeout="auto"
        )
        response.append(gather)
        response.redirect(f"{settings.base_url}/api/call/webhook/gather")
        return Response(content=str(response), media_type="application/xml")

    # Log user speech
    user_turn = current_turn + 1
    valkey.log_event(call_sid, CallEvent(
        event_type=EventType.USER_SPOKE,
        data={
            "turn": user_turn,
            "text": speech_result
        }
    ))
    valkey.add_transcript_entry(call_sid, user_turn, "user", speech_result)

    # Detect sensitive information
    sensitive_matches = detector.detect_sensitive_data(speech_result)
    if sensitive_matches:
        valkey.log_event(call_sid, CallEvent(
            event_type=EventType.SENSITIVE_DATA_DETECTED,
            data={
                "turn": user_turn,
                "matches": [match.dict() for match in sensitive_matches]
            }
        ))

    # Load scenario and get next scammer line
    scenario = get_scenario(session["scenario_id"])
    next_scammer_turn = current_turn + 2  # Next scammer turn (1->3, 3->5, 5->7, ...)
    next_line = next(
        (line for line in scenario.lines if line.turn == next_scammer_turn and line.speaker == "scammer"),
        None
    )

    response = VoiceResponse()

    if next_line:
        # Get cached audio URL from Valkey
        audio_url = valkey.get_cached_audio_url(session["scenario_id"], next_scammer_turn)

        # Continue conversation
        if audio_url:
            response.play(audio_url)
        else:
            response.say(next_line.text)

        # Log scammer speech
        valkey.log_event(call_sid, CallEvent(
            event_type=EventType.SCAMMER_SPOKE,
            data={
                "turn": next_scammer_turn,
                "text": next_line.text
            }
        ))
        valkey.add_transcript_entry(call_sid, next_scammer_turn, "scammer", next_line.text)

        # Advance current_turn to the scammer turn we just played (skip by 2)
        valkey.client.hset(f"call:{call_sid}", "current_turn", next_scammer_turn)

        # Check if there are more user turns after this scammer line
        has_more_user_turns = any(
            line.turn > next_scammer_turn and line.speaker == "user"
            for line in scenario.lines
        )

        if has_more_user_turns:
            # Gather next user response
            gather = Gather(
                input="speech",
                action=f"{settings.base_url}/api/call/webhook/gather",
                method="POST",
                timeout=8,
                speech_timeout="auto"
            )
            response.append(gather)
            response.redirect(f"{settings.base_url}/api/call/webhook/gather")
        else:
            # End call after this line
            response.pause(length=1)
            response.hangup()
    else:
        # No more lines, end call
        response.say("Thank you. Goodbye.")
        response.hangup()

    return Response(content=str(response), media_type="application/xml")


@router.post("/webhook/status")
async def webhook_status_update(request: Request):
    """
    Webhook for call status updates.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")

    valkey = get_valkey_service()

    # Map Twilio status to our enum
    status_mapping = {
        "initiated": CallStatus.INITIATED,
        "ringing": CallStatus.RINGING,
        "in-progress": CallStatus.IN_PROGRESS,
        "completed": CallStatus.COMPLETED,
        "busy": CallStatus.BUSY,
        "no-answer": CallStatus.NO_ANSWER,
        "failed": CallStatus.FAILED,
    }

    status = status_mapping.get(call_status, CallStatus.FAILED)
    valkey.update_call_status(call_sid, status)

    if status == CallStatus.COMPLETED:
        valkey.log_event(call_sid, CallEvent(
            event_type=EventType.CALL_ENDED,
            data={
                "call_status": call_status,
                "duration": form_data.get("CallDuration")
            }
        ))

    return {"status": "ok"}


@router.get("/audit/list")
async def list_calls_audit(phone_number: str = None):
    """
    List all calls for the audit page, or filter by phone_number for a person.
    Returns session summary for each call.
    """
    valkey = get_valkey_service()
    if phone_number:
        calls = valkey.list_calls_by_phone(phone_number)
    else:
        calls = valkey.list_calls()
    return {"calls": calls}


@router.get("/audit/{call_sid}")
async def get_call_audit(call_sid: str):
    """
    Get full audit data for one call: session, transcript, events, and derived vulnerabilities.
    """
    valkey = get_valkey_service()
    session = valkey.get_call_session(call_sid)
    if not session:
        raise HTTPException(status_code=404, detail="Call not found")
    transcript = valkey.get_transcript(call_sid)
    events = valkey.get_events(call_sid)
    vulnerabilities = [
        e for e in events
        if e.get("event_type") == EventType.SENSITIVE_DATA_DETECTED.value
    ]
    return {
        "call_sid": call_sid,
        "session": session,
        "transcript": transcript,
        "events": events,
        "vulnerabilities": vulnerabilities,
    }


@router.get("/{call_sid}/status")
async def get_call_status(call_sid: str):
    """
    Get current status of a call.
    """
    valkey = get_valkey_service()
    session = valkey.get_call_session(call_sid)

    if not session:
        raise HTTPException(status_code=404, detail="Call not found")

    return session


@router.get("/{call_sid}/events")
async def get_call_events(call_sid: str):
    """
    Get all events for a call.
    """
    valkey = get_valkey_service()
    events = valkey.get_events(call_sid)

    return {"call_sid": call_sid, "events": events}


@router.get("/{call_sid}/transcript")
async def get_call_transcript(call_sid: str):
    """
    Get full transcript for a call.
    """
    valkey = get_valkey_service()
    transcript = valkey.get_transcript(call_sid)

    return {"call_sid": call_sid, "transcript": transcript}


@router.get("/{call_sid}/feedback")
async def get_call_feedback(call_sid: str):
    """
    Get AI-generated feedback for a call: what the user did wrong and suggestions to improve.
    Uses the call transcript and Gemini.
    """
    import google.generativeai as genai
    valkey = get_valkey_service()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Add gemini_api_key to .env for feedback."
        )
    transcript_list = valkey.get_transcript(call_sid)
    if not transcript_list:
        raise HTTPException(
            status_code=404,
            detail="No transcript found for this call. The call may still be in progress or transcript expired."
        )
    # Build a single transcript string for the prompt
    lines = []
    for entry in sorted(transcript_list, key=lambda e: (e.get("turn", 0), e.get("timestamp", ""))):
        speaker = entry.get("speaker", "unknown")
        text = entry.get("text", "").strip()
        if text and text != "[User response expected]":
            lines.append(f"{speaker.capitalize()}: {text}")
    transcript_text = "\n".join(lines) if lines else "No conversation captured."
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = (
        "You are a security coach. Below is the transcript of a phishing simulation phone call. "
        "The 'scammer' is the simulated attacker; the 'user' is the person being trained.\n\n"
        "Transcript:\n" + transcript_text + "\n\n"
        "Write one short paragraph that: (1) summarizes what the user did wrong or where they were at risk, "
        "and (2) gives 2–3 brief, actionable suggestions to improve (e.g. don't read verification codes over the phone, "
        "don't confirm account numbers to callers, hang up and call the number on the back of the card). "
        "Keep the tone constructive and educational. Output only the paragraph, no headings or bullet lists."
    )
    try:
        response = model.generate_content(prompt)
        feedback = response.text.strip() if response.text else "Unable to generate feedback."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")
    return {"call_sid": call_sid, "feedback": feedback}
