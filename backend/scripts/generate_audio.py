#!/usr/bin/env python3
"""
Pre-generate audio files for all scenario lines using ElevenLabs.
Run this script before starting the demo to cache all audio.

Usage:
    python scripts/generate_audio.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.scenarios import list_scenarios
from app.services.elevenlabs_service import get_elevenlabs_service
from app.services.valkey_service import get_valkey_service


def generate_all_audio():
    """Generate audio for all scammer lines in all scenarios"""
    elevenlabs = get_elevenlabs_service()
    valkey = get_valkey_service()
    scenarios = list_scenarios()

    print(f"Found {len(scenarios)} scenarios to process\n")

    total_generated = 0
    total_cached = 0

    for scenario in scenarios:
        print(f"Processing scenario: {scenario.name} ({scenario.id})")
        print(f"Difficulty: {scenario.difficulty}")
        print("-" * 60)

        # Filter scammer lines only
        scammer_lines = [line for line in scenario.lines if line.speaker == "scammer"]

        for line in scammer_lines:
            print(f"  Turn {line.turn}: {line.text[:50]}...")

            # Check if already cached
            cached_url = valkey.get_cached_audio_url(scenario.id, line.turn)
            if cached_url:
                print(f"    ✓ Already cached: {cached_url}")
                total_cached += 1
                continue

            # Generate audio
            try:
                filepath = elevenlabs.generate_audio(
                    text=line.text,
                    scenario_id=scenario.id,
                    turn=line.turn
                )

                # Get public URL
                audio_url = elevenlabs.get_audio_url(scenario.id, line.turn)

                # Cache URL in Valkey
                valkey.cache_audio_url(scenario.id, line.turn, audio_url)

                print(f"    ✓ Generated and cached: {audio_url}")
                total_generated += 1

            except Exception as e:
                print(f"    ✗ Error: {str(e)}")

        print()

    print("=" * 60)
    print(f"Summary:")
    print(f"  Generated: {total_generated}")
    print(f"  Cached: {total_cached}")
    print(f"  Total: {total_generated + total_cached}")
    print("=" * 60)


if __name__ == "__main__":
    print("ScamFlight Audio Generation")
    print("=" * 60)
    print()

    try:
        generate_all_audio()
        print("\n✓ Audio generation complete!")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        sys.exit(1)
