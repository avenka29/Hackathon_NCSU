"""
Real-time detection of sensitive information in user speech.
Uses regex patterns to identify account numbers, SSNs, OTPs, etc.
"""

import re
from typing import List
from app.models import SensitiveDataMatch


class DetectionService:
    def __init__(self):
        # Regex patterns for common sensitive data
        self.patterns = {
            "account_number": r'\b\d{8,16}\b',  # 8-16 digit account numbers
            "ssn": r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',  # SSN format
            "otp": r'\b\d{4,8}\b',  # 4-8 digit OTP codes
            "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card
            "phone_number": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone number
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            "routing_number": r'\b\d{9}\b',  # 9-digit routing number
        }

        # Keywords that indicate sensitive info sharing
        self.keywords = {
            "password": ["password", "passcode", "pin", "secret"],
            "personal_info": ["social security", "date of birth", "birthday", "mother's maiden"],
            "verification": ["verification code", "confirm", "authenticate"]
        }

    def detect_sensitive_data(self, text: str) -> List[SensitiveDataMatch]:
        """
        Analyze text for sensitive information.
        Returns list of matches with type, value, confidence, and position.
        """
        matches = []
        text_lower = text.lower()

        # Pattern matching
        for data_type, pattern in self.patterns.items():
            for match in re.finditer(pattern, text):
                # Calculate confidence based on context
                confidence = self._calculate_confidence(text_lower, match.group(), data_type)

                matches.append(SensitiveDataMatch(
                    type=data_type,
                    value=match.group(),
                    confidence=confidence,
                    position=match.start()
                ))

        # Keyword matching
        for category, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    matches.append(SensitiveDataMatch(
                        type=category,
                        value=keyword,
                        confidence=0.9,
                        position=text_lower.index(keyword)
                    ))

        return matches

    def _calculate_confidence(self, text: str, value: str, data_type: str) -> float:
        """
        Calculate confidence score based on context clues.
        Higher confidence if text contains related keywords.
        """
        base_confidence = 0.7

        # Context keywords that increase confidence
        context_clues = {
            "account_number": ["account", "number", "account number"],
            "ssn": ["social", "security", "ssn"],
            "otp": ["code", "verification", "confirm", "sent you"],
            "credit_card": ["card", "credit", "debit"],
            "routing_number": ["routing", "transit"],
        }

        if data_type in context_clues:
            for clue in context_clues[data_type]:
                if clue in text:
                    base_confidence = min(0.95, base_confidence + 0.15)

        return base_confidence

    def has_sensitive_data(self, text: str) -> bool:
        """Quick check if text contains any sensitive data"""
        return len(self.detect_sensitive_data(text)) > 0


# Singleton instance
_detection_service = None


def get_detection_service() -> DetectionService:
    global _detection_service
    if _detection_service is None:
        _detection_service = DetectionService()
    return _detection_service
