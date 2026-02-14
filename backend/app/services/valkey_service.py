"""
Valkey (Redis) service for managing call state and events.
"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime
import valkey
from app.config import get_settings
from app.models import CallEvent, CallStatus

settings = get_settings()


class ValkeyService:
    def __init__(self):
        self.client = valkey.Valkey(
            host=settings.valkey_host,
            port=settings.valkey_port,
            db=settings.valkey_db,
            decode_responses=True
        )

    # Call State Management
    def create_call_session(self, call_sid: str, phone_number: str, scenario_id: str) -> None:
        """Initialize a new call session"""
        session_data = {
            "call_sid": call_sid,
            "phone_number": phone_number,
            "scenario_id": scenario_id,
            "status": CallStatus.INITIATED.value,
            "current_turn": 1,
            "started_at": datetime.utcnow().isoformat(),
            "ended_at": ""  # Use empty string instead of None
        }
        self.client.hset(f"call:{call_sid}", mapping=session_data)
        self.client.expire(f"call:{call_sid}", 7200)  # 2 hour TTL

    def get_call_session(self, call_sid: str) -> Optional[Dict[str, Any]]:
        """Retrieve call session data"""
        data = self.client.hgetall(f"call:{call_sid}")
        if not data:
            return None
        # Convert turn to int
        if "current_turn" in data:
            data["current_turn"] = int(data["current_turn"])
        return data

    def update_call_status(self, call_sid: str, status: CallStatus) -> None:
        """Update call status"""
        self.client.hset(f"call:{call_sid}", "status", status.value)
        if status in [CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.NO_ANSWER]:
            self.client.hset(f"call:{call_sid}", "ended_at", datetime.utcnow().isoformat())

    def increment_turn(self, call_sid: str) -> int:
        """Increment current turn and return new value"""
        new_turn = self.client.hincrby(f"call:{call_sid}", "current_turn", 1)
        return int(new_turn)

    def get_current_turn(self, call_sid: str) -> int:
        """Get current turn number"""
        turn = self.client.hget(f"call:{call_sid}", "current_turn")
        return int(turn) if turn else 1

    # Event Logging
    def log_event(self, call_sid: str, event: CallEvent) -> None:
        """Log a call event"""
        event_data = {
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "data": json.dumps(event.data)
        }
        self.client.rpush(f"events:{call_sid}", json.dumps(event_data))
        self.client.expire(f"events:{call_sid}", 7200)  # 2 hour TTL

    def get_events(self, call_sid: str) -> List[Dict[str, Any]]:
        """Retrieve all events for a call"""
        events_raw = self.client.lrange(f"events:{call_sid}", 0, -1)
        events = []
        for event_str in events_raw:
            event_dict = json.loads(event_str)
            event_dict["data"] = json.loads(event_dict["data"])
            events.append(event_dict)
        return events

    # Audio URL Caching
    def cache_audio_url(self, scenario_id: str, turn: int, audio_url: str) -> None:
        """Cache generated audio URL for a scenario line"""
        key = f"audio:{scenario_id}:{turn}"
        self.client.set(key, audio_url)
        self.client.expire(key, 86400)  # 24 hour TTL

    def get_cached_audio_url(self, scenario_id: str, turn: int) -> Optional[str]:
        """Retrieve cached audio URL"""
        return self.client.get(f"audio:{scenario_id}:{turn}")

    # Transcript Storage
    def add_transcript_entry(self, call_sid: str, turn: int, speaker: str, text: str) -> None:
        """Add an entry to the call transcript"""
        entry = {
            "turn": turn,
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.client.rpush(f"transcript:{call_sid}", json.dumps(entry))
        self.client.expire(f"transcript:{call_sid}", 7200)

    def get_transcript(self, call_sid: str) -> List[Dict[str, Any]]:
        """Retrieve full transcript for a call"""
        entries_raw = self.client.lrange(f"transcript:{call_sid}", 0, -1)
        return [json.loads(entry) for entry in entries_raw]


# Singleton instance
_valkey_service: Optional[ValkeyService] = None


def get_valkey_service() -> ValkeyService:
    global _valkey_service
    if _valkey_service is None:
        _valkey_service = ValkeyService()
    return _valkey_service
