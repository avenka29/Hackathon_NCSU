"""
ElevenLabs text-to-speech service for generating scammer audio.
"""

import os
from typing import Optional
from elevenlabs.client import ElevenLabs
from elevenlabs import save
from app.config import get_settings

settings = get_settings()


class ElevenLabsService:
    def __init__(self):
        self.client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        self.voice_id = settings.elevenlabs_voice_id
        self.audio_dir = "static/audio"
        os.makedirs(self.audio_dir, exist_ok=True)

    def generate_audio(
        self,
        text: str,
        scenario_id: str,
        turn: int,
        voice_id: Optional[str] = None
    ) -> str:
        """
        Generate audio for a scenario line and save to file.
        Returns the file path.
        """
        voice = voice_id or self.voice_id

        # Generate unique filename
        filename = f"{scenario_id}_turn_{turn}.mp3"
        filepath = os.path.join(self.audio_dir, filename)

        # Skip if already exists
        if os.path.exists(filepath):
            print(f"Audio already exists: {filepath}")
            return filepath

        # Generate audio
        print(f"Generating audio for {scenario_id} turn {turn}...")
        audio = self.client.generate(
            text=text,
            voice=voice,
            model="eleven_turbo_v2_5"  # Free tier compatible model
        )

        # Save to file
        save(audio, filepath)
        print(f"Saved audio to: {filepath}")

        return filepath

    def get_audio_url(self, scenario_id: str, turn: int) -> str:
        """
        Get the public URL for a generated audio file.
        Assumes files are served from /static/audio/
        """
        filename = f"{scenario_id}_turn_{turn}.mp3"
        return f"{settings.base_url}/static/audio/{filename}"


# Singleton instance
_elevenlabs_service: Optional[ElevenLabsService] = None


def get_elevenlabs_service() -> ElevenLabsService:
    global _elevenlabs_service
    if _elevenlabs_service is None:
        _elevenlabs_service = ElevenLabsService()
    return _elevenlabs_service
