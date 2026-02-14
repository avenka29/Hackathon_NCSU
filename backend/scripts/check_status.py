#!/usr/bin/env python3
"""
Quick status check for ScamFlight system.
Verifies all components are working.
"""

import requests
import subprocess
import os
import sys

def check_component(name, check_func):
    """Run a check and print result"""
    try:
        result = check_func()
        print(f"✅ {name}: {result}")
        return True
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

def check_server():
    """Check if server is running"""
    r = requests.get("http://localhost:8000/health", timeout=3)
    return "Running" if r.status_code == 200 else "Not responding"

def check_redis():
    """Check if Redis/Valkey is running"""
    result = subprocess.run(["redis-cli", "ping"], capture_output=True, text=True, timeout=2)
    return "Connected" if "PONG" in result.stdout else "Not connected"

def check_audio_files():
    """Check if audio files exist"""
    audio_dir = "static/audio"
    if not os.path.exists(audio_dir):
        return "Directory missing"
    files = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')]
    return f"{len(files)} files generated"

def check_scenarios():
    """Check scenarios endpoint"""
    r = requests.get("http://localhost:8000/api/scenarios/", timeout=3)
    data = r.json()
    return f"{len(data)} scenarios available"

def check_env():
    """Check if .env is configured"""
    if not os.path.exists(".env"):
        return "Missing"

    with open(".env") as f:
        content = f.read()

    issues = []
    if "your_account_sid_here" in content:
        issues.append("Twilio SID")
    if "your_auth_token_here" in content:
        issues.append("Twilio Token")
    if "your_elevenlabs_api_key_here" in content:
        issues.append("ElevenLabs Key")

    if issues:
        return f"Not configured: {', '.join(issues)}"
    return "Configured ✓"

def main():
    print("=" * 60)
    print("ScamFlight System Status Check")
    print("=" * 60)
    print()

    checks = [
        ("Environment Config", check_env),
        ("FastAPI Server", check_server),
        ("Redis/Valkey", check_redis),
        ("Audio Files", check_audio_files),
        ("Scenarios API", check_scenarios),
    ]

    results = []
    for name, check_func in checks:
        results.append(check_component(name, check_func))

    print()
    print("=" * 60)

    if all(results):
        print("✅ All systems operational!")
        print()
        print("Ready to make test calls:")
        print("  python3 scripts/test_call.py +15551234567 bank_fraud")
        print()
        print("⚠️  Don't forget to:")
        print("  1. Start ngrok: ngrok http 8000")
        print("  2. Update BASE_URL in .env with ngrok URL")
        print("  3. Restart server after updating BASE_URL")
    else:
        print("❌ Some components need attention")
        print()
        print("See TEST_GUIDE.md for troubleshooting")

    print("=" * 60)

if __name__ == "__main__":
    main()
