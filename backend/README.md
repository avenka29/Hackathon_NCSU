# ScamFlight Backend

Phone-based phishing training simulator using Twilio, ElevenLabs, and Valkey.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install and Start Valkey (Redis)

**macOS (using Homebrew):**
```bash
brew install valkey
brew services start valkey
```

**Linux:**
```bash
# Follow instructions at https://valkey.io/
```

**Docker:**
```bash
docker run -d -p 6379:6379 valkey/valkey
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- **Twilio**: Get from https://console.twilio.com
  - Account SID
  - Auth Token
  - Phone Number (must be a Twilio number)
- **ElevenLabs**: Get API key from https://elevenlabs.io
- **BASE_URL**: Your server's public URL (for webhooks)

### 4. Expose Server to Internet (for Twilio webhooks)

Twilio needs to reach your server via webhooks. Use ngrok:

```bash
# Install ngrok
brew install ngrok

# Start ngrok on port 8000
ngrok http 8000
```

Copy the ngrok HTTPS URL and update `BASE_URL` in `.env`:
```
BASE_URL=https://abc123.ngrok.io
```

### 5. Pre-generate Audio Files

```bash
python scripts/generate_audio.py
```

This will:
- Generate audio for all scammer lines using ElevenLabs
- Save MP3 files to `static/audio/`
- Cache URLs in Valkey

### 6. Start the Server

```bash
uvicorn main:app --reload --port 8000
```

Server will be available at `http://localhost:8000`

## API Endpoints

### Initiate Call
```bash
POST /api/call/initiate
{
  "phone_number": "+15551234567",
  "scenario_id": "bank_fraud"
}
```

### Get Call Status
```bash
GET /api/call/{call_sid}/status
```

### Get Call Events
```bash
GET /api/call/{call_sid}/events
```

### Get Transcript
```bash
GET /api/call/{call_sid}/transcript
```

## Available Scenarios

- `bank_fraud` - Bank fraud department scam (medium difficulty)
- `tech_support` - Microsoft tech support scam (easy difficulty)
- `irs_tax` - IRS tax warrant scam (hard difficulty)

## Testing

Test a call:
```bash
curl -X POST http://localhost:8000/api/call/initiate \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567", "scenario_id": "bank_fraud"}'
```

## Architecture

- **FastAPI** - Web framework
- **Twilio** - Phone call handling
- **ElevenLabs** - Text-to-speech for scammer voice
- **Valkey** - Session state and event logging
- **Detection Service** - Real-time sensitive data detection

## Webhook Flow

1. User initiates call via `/api/call/initiate`
2. Twilio calls user's phone
3. When answered, Twilio requests instructions from `/api/call/webhook/start`
4. Server responds with TwiML to play scammer audio
5. User speaks, Twilio sends speech to `/api/call/webhook/gather`
6. Server analyzes speech, detects sensitive data, sends next scammer line
7. Loop continues until scenario completes
8. Status updates sent to `/api/call/webhook/status`

## Troubleshooting

**Call not connecting:**
- Verify Twilio credentials are correct
- Check that phone number is in E.164 format (+1XXXXXXXXXX)
- Ensure ngrok is running and BASE_URL is updated

**Audio not playing:**
- Run `python scripts/generate_audio.py` first
- Check `static/audio/` directory has MP3 files
- Verify audio URLs are accessible via browser

**Webhooks failing:**
- Check ngrok is running and not expired
- Verify BASE_URL in .env matches ngrok URL
- Check Twilio debugger: https://console.twilio.com/debugger
