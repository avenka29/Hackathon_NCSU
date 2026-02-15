<h1>SecureMe</h1>

A comprehensive cybersecurity awareness training platform that simulates phishing attacks through email campaigns and phone calls to educate employees about social engineering tactics.

Features

Batch Email Campaigns: Send realistic phishing emails to multiple recipients
SSO Landing Page: Professional, authentic-looking login page
Credential Capture: Track who falls for phishing attempts
Real-time Analytics: Monitor email opens, clicks, and submissions
CSV Logging: Comprehensive event tracking for reporting

Phone Call Simulation

AI-Powered Voice Calls: Realistic phishing scenarios via Twilio and ElevenLabs
Multiple Scenarios: Pre-built social engineering scripts
Interactive Responses: Track user reactions during calls
Audio Recording: Review calls for training purposes

Management Dashboard

People Management: Select employees for training campaigns
Campaign Analytics: View success rates and vulnerabilities
Scenario Library: Browse and customize phishing scenarios

🚀 Quick Start
Prerequisites

Python 3.8+
Node.js 18+
Postmark Account (for email automation)
Twilio Account (for phone calls)
ngrok (for public URL tunneling)
ElevenLabs (for voice AI)
Valkey (for database storage)
Google Gemini API (for transcript analysis) 

Installation
1. Clone the repository:
bash git clone <your-repo-url>
cd Hackathon_NCSU
2. Backend Setup:
bash cd backend 

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
POSTMARK_API_KEY=your_postmark_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
BASE_URL=https://your-ngrok-url.ngrok-free.dev
EOL
3. Frontend Setup:
bash cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
4. Start ngrok (for public URL):
bash ngrok http 8000
Copy the ngrok URL and update BASE_URL in your .env file.
5. Start the backend:
bash cd backend
python main.py
```

## 📁 Project Structure
```
Hackathon_NCSU/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── EmailAutomationRouter.py  # Email campaign logic
│   │   │   ├── twilio_router.py          # Phone call handling
│   │   │   ├── scenarios_router.py       # Scenario management
│   │   │   ├── generateEmail.py          # Email generation
│   │   │   └── LandingPage.html          # Phishing landing page
│   │   ├── config.py                     # Configuration management
│   │   └── main.py                       # FastAPI application
│   ├── static/                           # Static files (audio)
│   ├── campaign_results.csv              # Event logs
│   └── .env                              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PeoplePage.tsx            # Employee selection
│   │   │   └── BatchPage.tsx             # Batch campaign interface
│   │   └── App.tsx
│   └── package.json
└── README.md
🔧 Configuration
Environment Variables
Create a .env file in the backend directory:
env# Postmark (Email Service)
POSTMARK_API_KEY=your_postmark_server_token

# Twilio (Phone Service)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application
BASE_URL=https://your-ngrok-url.ngrok-free.dev

# Optional
PORT=8000
Postmark Setup

Sign up at Postmark
Verify your sender email address
Get your Server API Token
Configure webhook at: {BASE_URL}/webhooks/postmark

Add header: X-Postmark-Secret: {WEBHOOK_SECRET}

Twilio Setup

Sign up at Twilio
Get a phone number with voice capabilities
Configure webhook: {BASE_URL}/api/calls/webhook

🎯 Usage
Running an Email Campaign

Start the servers:

Backend: python main.py
Frontend: npm run dev
ngrok: ngrok http 8000


Select recipients:

Navigate to "People" page
Select employees for training
Click "Batch"


Configure campaign:

Enter phishing email description
Review selected recipients
Click "Send"


Monitor results:

Check campaign_results.csv for events
Track: EMAIL_SENT → EMAIL_CLICK → LANDING_PAGE_LOADED → COMPROMISED

Running a Phone Campaign

Select scenario from the scenarios library
Enter target phone number
Initiate call - AI will handle the conversation
Review results in the dashboard

📊 Analytics & Reporting
Campaign results are logged to campaign_results.csv:
csvTimestamp,User_ID,Event,Details
2025-02-15 10:30:00,batch_1_1739587800,EMAIL_SENT,Batch: Alice Chen (Engineering)
2025-02-15 10:32:15,batch_1_1739587800,EMAIL_CLICK,
2025-02-15 10:32:45,batch_1_1739587800,LANDING_PAGE_LOADED,
2025-02-15 10:33:20,batch_1_1739587800,COMPROMISED,Username: alice.chen@company.com
Event Types:

EMAIL_SENT - Email successfully delivered
EMAIL_CLICK - Recipient clicked the phishing link
LANDING_PAGE_LOADED - Victim viewed the fake login page
COMPROMISED - Credentials were submitted
EMAIL_FAILED - Email delivery failed

🛡️ Security Considerations
This is a training tool for authorized use only.

✅ Only use with explicit permission from organization
✅ Clearly debrief participants after training
✅ Store credentials securely (hashed in production)
✅ Use unique UIDs to track participants anonymously
✅ Provide educational resources post-simulation

Never use this tool for:

❌ Actual phishing attacks
❌ Unauthorized social engineering
❌ Malicious credential harvesting

🐛 Troubleshooting
Email not sending

Verify Postmark API key in .env
Check sender email is verified in Postmark
Review backend logs for errors

Landing page not loading

Ensure LandingPage.html is in backend/app/routers/
Verify ngrok URL is updated in .env
Check ngrok tunnel is active

404 on /campaign/batch

Confirm backend server is running
Check CORS settings allow your frontend origin
Verify FastAPI router is included in main.py

Phone calls not working

Verify Twilio credentials
Check phone number has voice capabilities
Ensure webhook URL is publicly accessible

📝 License
This project is for educational purposes only. Use responsibly and ethically.
👥 Team
Built for NCSU Hackathon 2025
📧 Support
For issues or questions, please open a GitHub issue or contact the development team.

⚠️ Disclaimer: This tool is designed for authorized cybersecurity training only. Misuse of this software for malicious purposes is illegal and unethical. Always obtain proper authorization before conducting phishing simulations.
