# Testing Your ScamFlight System

## ✅ Current Status

All systems are **operational**:
- ✅ Server running on http://localhost:8000
- ✅ Valkey/Redis connected (PONG)
- ✅ 15 audio files generated (2.1 MB total)
- ✅ API endpoints responding
- ✅ Twilio credentials configured
- ✅ ElevenLabs working (turbo_v2_5 model)

## 🚀 Next Step: Test a Real Call

### Setup ngrok (Required for Twilio Webhooks)

**Option 1: Install ngrok**
```bash
# Install
brew install ngrok

# Start on port 8000
ngrok http 8000
```

**Option 2: Use Twilio's Built-in Tool**
```bash
# If you have Twilio CLI
twilio phone-numbers:update +13527686030 --voice-url="http://YOUR_NGROK_URL/api/call/webhook/start"
```

### Update BASE_URL

Once ngrok is running, you'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

**Copy that HTTPS URL** and update your `.env`:
```bash
BASE_URL=https://abc123.ngrok-free.app
```

**Restart the server:**
```bash
# Stop current server (Ctrl+C or kill process)
pkill -f uvicorn

# Start again
cd /Users/farhadbhatti/Cybersecurity-Awareness/backend
uvicorn main:app --reload --port 8000
```

### Make Your First Test Call

```bash
python3 scripts/test_call.py +YOUR_PHONE_NUMBER bank_fraud
```

Replace `+YOUR_PHONE_NUMBER` with your actual phone (must be in E.164 format like `+15551234567`).

**Your phone should ring within 5-10 seconds!** 📞

## 🧪 Test Without Making a Real Call

If you're not ready to test a real call yet, you can test the system components:

### 1. Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# List scenarios
curl http://localhost:8000/api/scenarios/

# Get specific scenario
curl http://localhost:8000/api/scenarios/bank_fraud | python3 -m json.tool

# Test audio access
curl -I http://localhost:8000/static/audio/bank_fraud_turn_1.mp3
```

### 2. Test Valkey/Redis

```bash
redis-cli
> KEYS *
> PING
> exit
```

### 3. Listen to Generated Audio

```bash
# Play an audio file (macOS)
afplay static/audio/bank_fraud_turn_1.mp3

# Or open in browser
open http://localhost:8000/static/audio/bank_fraud_turn_1.mp3
```

### 4. Test Call Initiation (without completing)

This will initiate a call but you can hang up immediately:

```bash
curl -X POST http://localhost:8000/api/call/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15551234567",
    "scenario_id": "bank_fraud"
  }'
```

## 📊 After a Test Call

Once you've completed a test call, retrieve the data:

```bash
# Get call SID from the test output, then:

# View call status
curl http://localhost:8000/api/call/CA1234567890/status | python3 -m json.tool

# View transcript
curl http://localhost:8000/api/call/CA1234567890/transcript | python3 -m json.tool

# View all events
curl http://localhost:8000/api/call/CA1234567890/events | python3 -m json.tool
```

## 🎯 What to Test During the Call

Try saying these things to trigger sensitive data detection:

1. **Account Numbers**: "My account number is 123456789"
2. **SSN**: "My social security number is 123-45-6789"
3. **OTP Codes**: "The code is 456789"
4. **Credit Card**: "My card number is 4532-1234-5678-9010"
5. **Keywords**: "Here's my password", "verification code"

## 🐛 Troubleshooting

### Call Doesn't Connect
```bash
# Check Twilio debugger
open https://console.twilio.com/debugger

# Verify credentials
grep TWILIO .env

# Check server logs
# Look at the terminal running uvicorn
```

### Audio Doesn't Play
```bash
# Verify files exist
ls -lh static/audio/

# Test one file in browser
open http://localhost:8000/static/audio/bank_fraud_turn_1.mp3

# Check BASE_URL is correct
grep BASE_URL .env
```

### Webhooks Fail
```bash
# Verify ngrok is running
curl https://YOUR_NGROK_URL/health

# Check that BASE_URL matches ngrok
echo $BASE_URL

# Restart server after changing BASE_URL
pkill -f uvicorn && uvicorn main:app --reload
```

### Detection Not Working
```bash
# Check events after call
curl http://localhost:8000/api/call/CA123/events | grep -i sensitive

# Detection is intentionally loose - try:
# "my account number is 123456789"
# "the code is 456789"
```

## 📈 Success Criteria

You'll know everything works when:

1. ✅ Phone rings when you initiate a call
2. ✅ AI voice speaks the scammer script
3. ✅ Your voice is captured and transcribed
4. ✅ Call follows the conversation flow
5. ✅ Transcript available after call
6. ✅ Sensitive data detected in events

## 🔥 Quick Commands Cheat Sheet

```bash
# Start everything
brew services start valkey
ngrok http 8000  # Terminal 1
uvicorn main:app --reload  # Terminal 2

# Make test call
python3 scripts/test_call.py +15551234567 bank_fraud

# Check results
curl http://localhost:8000/api/call/CALL_SID/transcript

# Restart server
pkill -f uvicorn && uvicorn main:app --reload

# Regenerate audio
python3 scripts/generate_audio.py

# View logs
# Just watch Terminal 2 (uvicorn)
```

## 🎉 Next Steps

Once calling works:
1. Test all 3 scenarios (bank_fraud, tech_support, irs_tax)
2. Review transcripts and detection accuracy
3. Build the frontend React app
4. Add Backboard AI for post-call analysis
5. Customize scenarios for your use case

---

**Current Configuration:**
- Server: http://localhost:8000
- Twilio Number: +13527686030
- Redis: localhost:6379
- Audio Files: 15 files, 2.1 MB
- Models: ElevenLabs turbo_v2_5, Twilio speech-to-text
