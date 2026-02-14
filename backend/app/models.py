from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    INITIATED = "initiated"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    BUSY = "busy"


class EventType(str, Enum):
    CALL_INITIATED = "call_initiated"
    CALL_ANSWERED = "call_answered"
    SCAMMER_SPOKE = "scammer_spoke"
    USER_SPOKE = "user_spoke"
    SENSITIVE_DATA_DETECTED = "sensitive_data_detected"
    CALL_ENDED = "call_ended"


class ScenarioLine(BaseModel):
    turn: int
    speaker: str  # "scammer" or "user"
    text: str
    audio_url: Optional[str] = None  # For scammer lines only


class Scenario(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str  # "easy", "medium", "hard"
    lines: List[ScenarioLine]


class CallInitiateRequest(BaseModel):
    phone_number: str = Field(..., pattern=r'^\+?1?\d{10,15}$')
    scenario_id: str = "bank_fraud"


class CallInitiateResponse(BaseModel):
    call_sid: str
    status: CallStatus
    message: str


class CallEvent(BaseModel):
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(default_factory=dict)


class SensitiveDataMatch(BaseModel):
    type: str  # "account_number", "ssn", "otp", "password", etc.
    value: str
    confidence: float
    position: int  # Character position in transcript
