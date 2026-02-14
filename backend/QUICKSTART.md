# ScamFlight Quick Start Guide

Get your phone-based phishing trainer running in 10 minutes.

## Prerequisites

- Python 3.9+
- Twilio account (with phone number)
- ElevenLabs API key
- Redis/Valkey installed
- ngrok (for webhooks)

## Step-by-Step Setup

### 1. Run Setup Script

```bash
cd backend
./setup.sh
```

This will:
- Create virtual environment
- Install dependencies
- Create `.env` from template
- Create static directories

### 2. Get API Keys

**Twilio:**
1. Sign up at https://console.twilio.com
2. Get a phone number (Trial account works!)
3. Copy Account SID and Auth Token
4. Note: Trial accounts can only call verified numbers

**ElevenLabs:**
1. Sign up at https://elevenlabs.io
2. Go to Profile → API Key
3. Copy your API key

### 3. Configure Environment

Edit `backend/.env`:

```bash
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567  # Your Twilio number

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel (default)

# Valkey/Redis
VALKEY_HOST=localhost
VALKEY_PORT=6379

# Leave this for now, we'll update it next
BASE_URL=http://localhost:8000
```

### 4. Start Services

**Terminal 1 - Valkey/Redis:**
```bash
# macOS
brew services start valkey

# OR Docker
docker run -d -p 6379:6379 valkey/valkey

# Verify it's running
redis-cli ping  # Should return "PONG"
```

**Terminal 2 - ngrok (for webhooks):**
```bash
ngrok http 8000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update `BASE_URL` in `.env`:
```bash
BASE_URL=https://abc123.ngrok.io
```

**Terminal 3 - Backend server:**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 5. Generate Audio Files

**Terminal 4:**
```bash
cd backend
source .venv/bin/activate
python scripts/generate_audio.py
```

This will generate ~20 MP3 files (one for each scammer line). Takes ~2 minutes.

### 6. Test It!

Make a test call to yourself:

```bash
python scripts/test_call.py +15551234567 bank_fraud
```

Replace `+15551234567` with your actual phone number.

Your phone should ring within 5-10 seconds! 📞

## What to Expect

1. Phone rings
2. You answer
3. AI scammer says: "Hello, this is David from the fraud department at your bank..."
4. You respond (say anything)
5. Scammer continues the script
6. Try giving fake account numbers or codes
7. Call ends after ~5 exchanges

## View Results

After the call, check the transcript:

```bash
# Get your call SID from the test_call.py output
curl http://localhost:8000/api/call/{CALL_SID}/transcript
```

Or view all events:

```bash
curl http://localhost:8000/api/call/{CALL_SID}/events
```

## Available API Endpoints

**Interactive Docs:**
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

**Key Endpoints:**
- `POST /api/call/initiate` - Start a call
- `GET /api/call/{call_sid}/status` - Check call status
- `GET /api/call/{call_sid}/transcript` - Get full transcript
- `GET /api/call/{call_sid}/events` - Get all events
- `GET /api/scenarios` - List available scenarios

## Three Scenarios Included

1. **bank_fraud** (Medium) - Fake bank fraud department
2. **tech_support** (Easy) - Microsoft virus scam
3. **irs_tax** (Hard) - IRS arrest warrant scam

## Troubleshooting

**Call doesn't connect:**
- Check phone number format: must be `+1XXXXXXXXXX` (E.164)
- Verify Twilio credentials are correct
- Check ngrok is running and BASE_URL matches
- Look at Twilio Debugger: https://console.twilio.com/debugger

**Audio doesn't play:**
- Run `python scripts/generate_audio.py`
- Check `static/audio/` directory has MP3 files
- Visit http://localhost:8000/static/audio/bank_fraud_turn_1.mp3

**Webhooks fail:**
- Verify BASE_URL in `.env` is your ngrok HTTPS URL
- ngrok URLs expire after 2 hours on free tier
- Check FastAPI logs for errors

**"Sensitive data" not detected:**
- This is expected! Detection is intentionally loose for demo
- Say things like "my account number is 123456789"
- Check events endpoint to see what was detected

## Next Steps

Once the basic call flow works:

1. **Add more scenarios** - Edit `app/scenarios.py`
2. **Improve detection** - Enhance `app/services/detection_service.py`
3. **Add analysis** - Integrate Backboard AI for post-call coaching
4. **Build frontend** - Create React UI for initiating calls

## Cost Estimate (for testing)

- **Twilio**: ~$0.01/minute for calls (Trial: FREE for verified numbers)
- **ElevenLabs**: ~10,000 characters free/month (20+ full demos)
- **Valkey**: Free (self-hosted)
- **ngrok**: Free tier works fine

A single test call costs ~$0.05-0.10 (after trial credits).

## Need Help?

Check the logs:
```bash
# FastAPI logs
tail -f logs from Terminal 3

# Twilio debugger
https://console.twilio.com/debugger

# Valkey data
redis-cli
> KEYS *
> GET call:CA1234567890
```

Happy phishing training! 🎣
