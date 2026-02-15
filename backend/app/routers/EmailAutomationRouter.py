import os
import uvicorn
import logging
import csv
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from postmarker.core import PostmarkClient
from fastapi import FastAPI, Request, Header, HTTPException, Form
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Setup & Environment
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("PhishingRouter")

app = FastAPI(title="Cybersecurity Awareness Router")
postmark = PostmarkClient(server_token=os.getenv("POSTMARK_API_KEY"))

# CORS for React frontend
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "ncsu_secure_2026")
LOG_FILE = os.path.join(CURRENT_DIR, "campaign_results.csv")
LANDING_PAGE_PATH = os.path.join(CURRENT_DIR, "LandingPage.html")

# UPDATE THIS WITH YOUR NGROK URL EACH TIME YOU RESTART NGROK
NGROK_URL = "https://jayda-nondefunct-teasingly.ngrok-free.dev"

# --- Pydantic Models ---
class Person(BaseModel):
    id: str
    name: str
    role: str
    email: str

class BatchRequest(BaseModel):
    recipients: List[Person]
    description: str

# --- HELPER: CSV Logging ---
def log_event(uid: str, event_type: str, details: str = ""):
    """Appends an event to the local CSV database."""
    file_exists = os.path.isfile(LOG_FILE)
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "User_ID", "Event", "Details"])
        
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            uid,
            event_type,
            details
        ])

# --- ENDPOINTS: Landing Page (Phishing Simulation) ---

@app.get("/verify", response_class=HTMLResponse)
async def serve_landing_page(uid: str):
    """Serves your existing LandingPage.html and logs the arrival."""
    logger.info(f"🚨 [LANDING PAGE LOADED] User: {uid}")
    log_event(uid, "LANDING_PAGE_LOADED")
    
    # Check if LandingPage.html exists
    if not os.path.exists(LANDING_PAGE_PATH):
        logger.error(f"❌ LandingPage.html not found at: {LANDING_PAGE_PATH}")
        return HTMLResponse(
            f"<h1>Error: LandingPage.html not found</h1><p>Expected location: {LANDING_PAGE_PATH}</p>", 
            status_code=404
        )
    
    # Serve your existing landing page
    with open(LANDING_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    logger.info(f"✅ Served landing page to user: {uid}")
    return HTMLResponse(content=content)

@app.post("/submit-credentials")
async def handle_submission(username: str = Form(...), password: str = Form(...), uid: str = Form(None)):
    """Captures credentials when user submits the form on your landing page."""
    logger.warning(f"⚠️ [COMPROMISED] User {uid} submitted credentials - Username: {username}")
    log_event(uid, "COMPROMISED", f"Username: {username}")
    
    # Return success message
    return HTMLResponse("""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: "RedHatDisplay", Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            }
            .message {
                background: white;
                padding: 50px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                text-align: center;
                max-width: 500px;
            }
            .checkmark {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #4caf50;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
            }
            .checkmark svg {
                width: 30px;
                height: 30px;
                stroke: white;
                stroke-width: 3;
                fill: none;
            }
            h2 { color: #151515; margin-bottom: 16px; font-size: 24px; }
            p { color: #6a6e73; line-height: 1.6; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="message">
            <div class="checkmark">
                <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h2>Verification Complete</h2>
            <p>Your Red Hat account has been successfully verified.</p>
            <p style="font-size: 14px;">You may now close this window.</p>
        </div>
    </body>
    </html>
    """)

@app.post("/webhooks/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """Receives real-time click tracking data from Postmark."""
    if x_postmark_secret != WEBHOOK_SECRET:
        logger.warning("⚠️ Invalid webhook secret")
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    
    data = await request.json()
    if data.get("RecordType") == "Click":
        uid = data.get("Metadata", {}).get("user_uid")
        logger.info(f"🖱️ [EMAIL CLICK] User {uid} clicked the phishing link.")
        log_event(uid, "EMAIL_CLICK")
    return {"status": "ok"}

# --- ENDPOINTS: Batch Campaign ---

@app.post("/send-email")
async def run_campaign():
    """Trigger the phishing email send."""
    # Update this to your public NGROK URL before running!
    base_url = "https://jayda-nondefunct-teasingly.ngrok-free.dev" 
    user = {"email": "fhbhatti@ncsu.edu", "uid": "student_01"}
    
    logger.info(f"📧 Starting batch campaign with {len(request.recipients)} recipients")
    logger.info(f"📝 Description: {request.description}")
    
    recipients = request.recipients
    description = request.description

    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")

    sent_count = 0
    failed_count = 0
    
    for person in recipients:
        # Create unique user ID for tracking
        uid = f"batch_{person.id}_{int(datetime.now().timestamp())}"
        
        logger.info(f"👤 Processing: {person.name} ({person.email}) - UID: {uid}")
        
        if not person.email:
            logger.warning(f"⚠️ Skipping {person.name}, no email provided")
            failed_count += 1
            continue

        try:
            # Send phishing email with link to your existing landing page
            postmark.emails.send(
                From="pkengso@ncsu.edu",
                To=person.email,
                Subject="Red Hat Account Security Alert - Action Required",
                HtmlBody=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ font-family: "RedHatDisplay", Arial, sans-serif; color: #151515; margin: 0; padding: 0; background: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                        .header {{ background: linear-gradient(90deg, #ee0000 0%, #a60000 100%); padding: 30px 20px; text-align: center; }}
                        .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 500; }}
                        .content {{ padding: 40px 30px; }}
                        .content h2 {{ color: #ee0000; margin-bottom: 20px; font-size: 22px; }}
                        .content p {{ line-height: 1.6; margin-bottom: 15px; color: #151515; }}
                        .alert-box {{ background: #fef6e6; border-left: 4px solid #f0ad4e; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                        .button {{ display: inline-block; background: #ee0000; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 25px 0; box-shadow: 0 2px 4px rgba(238,0,0,0.2); }}
                        .footer {{ padding: 30px; text-align: center; font-size: 12px; color: #6a6e73; background: #f5f5f5; border-top: 1px solid #e8e8e8; }}
                        .footer p {{ margin: 5px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>RED HAT</h1>
                        </div>
                        <div class="content">
                            <h2>🔒 Security Verification Required</h2>
                            <p>Dear {person.name},</p>
                            <p>{description}</p>
                            <div class="alert-box">
                                <strong>⚠️ Immediate Action Required:</strong> We've detected unusual activity on your Red Hat account. To protect your data and maintain access to Red Hat services, you must verify your credentials immediately.
                            </div>
                            <p>Click the button below to complete the security verification process:</p>
                            <p style="text-align: center;">
                                <a href="{NGROK_URL}/verify?uid={uid}" class="button">Verify My Account Now</a>
                            </p>
                            <p style="color: #6a6e73; font-size: 14px; margin-top: 30px;">
                                <strong>⏰ Time-Sensitive:</strong> This security verification must be completed within 24 hours. Failure to verify may result in temporary account suspension.
                            </p>
                            <p style="color: #6a6e73; font-size: 13px;">
                                If you did not request this verification, please contact Red Hat support immediately.
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>&copy; 2025 Red Hat, Inc.</strong> All rights reserved.</p>
                            <p>This email was sent to: {person.email}</p>
                            <p><a href="#" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #0066cc; text-decoration: none;">Terms of Use</a> | <a href="#" style="color: #0066cc; text-decoration: none;">Support</a></p>
                        </div>
                    </div>
                </body>
                </html>
                """,
                TrackLinks='HtmlAndText',
                Metadata={
                    "user_uid": uid, 
                    "person_name": person.name, 
                    "role": person.role,
                    "campaign_type": "batch"
                }
            )
            
            logger.info(f"✅ Email sent to {person.email}")
            logger.info(f"🔗 Landing page link: {NGROK_URL}/verify?uid={uid}")
            log_event(uid, "EMAIL_SENT", f"Batch: {person.name} ({person.role})")
            sent_count += 1
            
        except Exception as e:
            logger.error(f"❌ Failed to send to {person.email}: {str(e)}")
            log_event(uid, "EMAIL_FAILED", f"Error: {str(e)}")
            failed_count += 1

    # Log campaign summary
    logger.info(f"📊 Campaign Complete: {sent_count} sent, {failed_count} failed")
    
    return {
        "success": True,
        "count": sent_count,
        "failed": failed_count,
        "total": len(recipients),
        "message": f"Successfully sent {sent_count} out of {len(recipients)} phishing emails",
        "landing_page_url": f"{NGROK_URL}/verify"
    }

# --- Health & Status Endpoints ---

@app.get("/")
async def root():
    """API status and information"""
    landing_exists = os.path.exists(LANDING_PAGE_PATH)
    
    return {
        "status": "online", 
        "service": "Cybersecurity Awareness Phishing Simulation",
        "ngrok_url": NGROK_URL,
        "landing_page_exists": landing_exists,
        "landing_page_path": LANDING_PAGE_PATH,
        "endpoints": {
            "landing_page": f"{NGROK_URL}/verify?uid=<user_id>",
            "batch_campaign": "POST /campaign/batch",
            "submit_credentials": "POST /submit-credentials",
            "webhook": "POST /webhooks/postmark",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    landing_exists = os.path.exists(LANDING_PAGE_PATH)
    
    return {
        "status": "healthy",
        "ngrok_url": NGROK_URL,
        "landing_page": "ready" if landing_exists else "missing",
        "log_file": LOG_FILE
    }

# --- Manual Campaign Tool ---

def run_single_campaign():
    """Send a single test phishing email (for manual testing)"""
    user = {"email": "fhbhatti@ncsu.edu", "uid": "test_manual"}
    
    print(f"🚀 Sending test campaign to {user['email']}...")
    
    try:
        postmark.emails.send(
            From='pkengso@ncsu.edu', 
            To=user['email'],
            Subject='Red Hat: Urgent Security Verification Required',
            HtmlBody=f'''
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h2 style="color: #ee0000;">Security Alert</h2>
                <p>Please verify your Red Hat account immediately.</p>
                <p><a href="{NGROK_URL}/verify?uid={user["uid"]}" 
                      style="background: #ee0000; color: white; padding: 12px 24px; 
                             text-decoration: none; border-radius: 4px; display: inline-block;">
                    Verify Account Now
                </a></p>
            </body>
            </html>
            ''',
            TrackLinks='HtmlAndText',
            Metadata={"user_uid": user['uid'], "campaign_type": "manual"}
        )
        print(f"✅ Test email sent successfully!")
        print(f"🔗 Landing page: {NGROK_URL}/verify?uid={user['uid']}")
        
    except Exception as e:
        print(f"❌ Failed to send: {e}")

# --- EXECUTION ---

if __name__ == "__main__":
    # Check if landing page exists on startup
    if not os.path.exists(LANDING_PAGE_PATH):
        print(f"⚠️  WARNING: LandingPage.html not found at {LANDING_PAGE_PATH}")
        print(f"📁 Make sure LandingPage.html is in the same folder as this script")
    
    # Command: python EmailAutomationRouter.py send
    if len(sys.argv) > 1 and sys.argv[1].lower() == "send":
        run_single_campaign()
    # Command: python EmailAutomationRouter.py
    else:
        print(f"")
        print(f"╔═══════════════════════════════════════════════════════════╗")
        print(f"║  🎯 Cybersecurity Awareness Phishing Simulation          ║")
        print(f"╚═══════════════════════════════════════════════════════════╝")
        print(f"")
        print(f"📡 Server running at: http://localhost:8000")
        print(f"🌐 Public URL: {NGROK_URL}")
        print(f"📄 Landing page: {NGROK_URL}/verify?uid=<user_id>")
        print(f"📊 Logs saved to: {LOG_FILE}")
        print(f"")
        print(f"✅ Your existing LandingPage.html will be served")
        print(f"")
        uvicorn.run(app, host="0.0.0.0", port=8000)