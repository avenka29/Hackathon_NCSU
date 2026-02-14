# routers/generate_email.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import os
import json
import re

router = APIRouter(prefix="/api", tags=["generate-email"])

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class CurrentEmail(BaseModel):
    subject: str
    body: str
    senderName: str
    senderEmail: str


class GenerateRequest(BaseModel):
    messages: list[Message]
    currentEmail: Optional[CurrentEmail] = None


@router.post("/generate-email")
async def generate_email(req: GenerateRequest):
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        system = (
            "You are a phishing awareness training assistant. Generate realistic phishing email "
            "content for employee training only. Respond with valid JSON only, no markdown: "
            '{"subject":"...","body":"...","senderName":"...","senderEmail":"..."} '
            "If the user asks for changes, use the current email as base and modify it."
        )
        last = req.messages[-1].content if req.messages else ""
        if req.currentEmail:
            user_prompt = f"Current email: {req.currentEmail.model_dump_json()}. User request: {last}. Return updated JSON only."
        else:
            user_prompt = last

        # Build history for multi-turn
        history = []
        for m in req.messages[:-1]:
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

        chat = model.start_chat(history=history)
        response = chat.send_message(f"{system}\n\n{user_prompt}")
        text = response.text
        text = re.sub(r"n?|```", "", text).strip()
        data = json.loads(text)

        return {
            "subject": data.get("subject", ""),
            "body": data.get("body", ""),
            "senderName": data.get("senderName", ""),
            "senderEmail": data.get("senderEmail", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate email")