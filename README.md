# SecureMe - Phishing Training Simulator

This is the fullstack application for SecureMe, a phishing training simulator. It manages scenarios, generate emails, simulate phishing calls, and batch send training emails.

---

## Table of Contents

- [Features](#features)  
- [Requirements](#requirements)  
- [Installation](#installation)  
- [Running the Server](#running-the-server)   
- [Project Structure](#project-structure)  
- [CORS & Frontend Integration](#cors--frontend-integration)  
- [Environment Variables](#environment-variables)  
- [Getting Started with Full Stack](#getting-started-with-full-stack)  
- [Troubleshooting](#troubleshooting)  

---

## Features

- 📞 Simulate phishing phone calls for training purposes  
- 📧 Generate phishing-style emails for employees  
- 📨 Batch email sending using Postmark API  
- 🎭 Scenario management via REST endpoints  
- 🔊 Static file hosting for audio prompts  
- 📊 Track and log phishing simulation results  
- 🎯 Realistic SSO landing page for credential capture  

---

## Requirements

- Python 3.11+  
- FastAPI  
- Uvicorn  
- Postmark API (for sending emails)  
- Twilio (for call simulations)  
- ngrok (for public URL tunneling)  
- Other dependencies listed in `requirements.txt`  

---

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Hackathon_NCSU.git
cd Hackathon_NCSU/backend
```

### 2. Create a virtual environment
```bash
python -m venv venv
```

### 3. Activate the virtual environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install manually:
```bash
pip install fastapi uvicorn python-dotenv postmarker twilio pydantic
```

### 5. Set environment variables

Create a `.env` file in the `backend` directory:
```env
# Postmark (Email Service)
POSTMARK_API_KEY=your_postmark_server_token

# Twilio (Phone Service)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application
BASE_URL=https://your-ngrok-url.ngrok-free.dev

# Optional
PORT=8000
```

---

## Running the Server

### Start the FastAPI server using Uvicorn:
```bash
python main.py
```
---

## Project Structure
```
backend/
├── app/
│   ├── routers/
│   │   ├── EmailAutomationRouter.py    # Email campaign logic
│   │   ├── twilio_router.py            # Phone call handling
│   │   ├── scenarios_router.py         # Scenario management
│   │   ├── generateEmail.py            # Email generation
│   │   └── LandingPage.html            # Phishing landing page
│   ├── config.py                       # Configuration management
│   └── main.py                         # FastAPI application
├── static/
│   └── audio/                          # Audio files for calls
├── campaign_results.csv                # Event logs
├── .env                                # Environment variables (not in git)
├── requirements.txt                    # Python dependencies
└── README.md                           # This file
```

---

## CORS & Frontend Integration

CORS is configured to allow all origins for development. For production, specify allowed origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Frontend Integration:**
- React frontend should be running on `http://localhost:5173`
- Update `BASE_URL` in `.env` with your ngrok URL for email links
- Ensure CORS origins match your frontend URL

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTMARK_API_KEY` | Postmark server token for sending emails | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | Yes |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Yes |
| `BASE_URL` | Public URL for webhooks (ngrok) | Yes |
| `PORT` | Server port (default: 8000) | No |

---

## Getting Started with Full Stack

### 1. Start ngrok (for public URL)
```bash
ngrok http 8000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok-free.dev`) and update `BASE_URL` in `.env`

### 2. Start the backend server
```bash
cd backend
python main.py
```

### 3. Start the React frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Configure Postmark Webhook

1. Go to Postmark dashboard
2. Add webhook URL: `https://your-ngrok-url.ngrok-free.dev/webhooks/postmark`
4. Enable "Click" tracking

### 5. Test the application

1. Navigate to `http://localhost:5173`
2. Select people from the People page
3. Click "Batch" to send phishing emails
4. Monitor `campaign_results.csv` for results

---

## Troubleshooting

### Server won't start

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`  
**Solution:** Install dependencies: `pip install -r requirements.txt`

**Problem:** Port 8000 already in use  
**Solution:** Change port in `main.py` or kill the process using port 8000

### Emails not sending

**Problem:** Postmark returns 401 Unauthorized  
**Solution:** Verify `POSTMARK_API_KEY` in `.env` is correct

**Problem:** Sender email not verified  
**Solution:** Verify sender email in Postmark dashboard

### Landing page not loading

**Problem:** 404 error on `/verify`  
**Solution:** Ensure `LandingPage.html` is in `backend/app/routers/`

**Problem:** ngrok URL not working  
**Solution:** Update `BASE_URL` in `.env` with current ngrok URL

### CORS errors

**Problem:** Frontend can't reach backend  
**Solution:** Verify frontend URL is in `allow_origins` in `main.py`

### 404 on `/campaign/batch`

**Problem:** Endpoint not found  
**Solution:** Ensure `EmailAutomationRouter.router` is included in `main.py`

---

## Development

### Running tests
```bash
pytest
```

### Code formatting
```bash
black app/
```

### Linting
```bash
flake8 app/
```

---

## Security Considerations

⚠️ **This is a training tool for authorized use only.**

- ✅ Only use with explicit permission from organization
- ✅ Clearly debrief participants after training
- ✅ Store credentials securely (never log passwords in production)
- ✅ Use unique UIDs to track participants anonymously
- ✅ Delete sensitive data after training sessions

**Never use this tool for:**
- ❌ Actual phishing attacks
- ❌ Unauthorized social engineering
- ❌ Malicious credential harvesting

---


## License

This project is for educational purposes only. Use responsibly and ethically.

---


**⚠️ Disclaimer**: This tool is designed for authorized cybersecurity training only. Misuse of this software for malicious purposes is illegal and unethical. Always obtain proper authorization before conducting phishing simulations.

---

**Built for NCSU Hackathon 2025** 🎓
