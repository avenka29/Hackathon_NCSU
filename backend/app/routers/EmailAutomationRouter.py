import os
import uvicorn
import logging
import csv
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from postmarker.core import PostmarkClient
from fastapi import FastAPI, Request, Header, HTTPException, Form
from fastapi.responses import HTMLResponse

# 1. Setup & Environment
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("PhishingRouter")

app = FastAPI(title="Cybersecurity Awareness Router")
postmark = PostmarkClient(server_token=os.getenv("POSTMARK_API_KEY"))

# Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "ncsu_secure_2026")
LOG_FILE = "campaign_results.csv"

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

# --- ENDPOINTS (The Listener) ---

@app.get("/verify", response_class=HTMLResponse)
async def serve_landing_page(uid: str):
    """PHASE 2: Serves LandingPage.html and logs the arrival."""
    logger.info(f"🚨 [LANDING PAGE LOADED] User: {uid}")
    log_event(uid, "LANDING_PAGE_LOADED")
    
    html_path = os.path.join(CURRENT_DIR, "LandingPage.html")
    if not os.path.exists(html_path):
        return HTMLResponse(f"<h1>Error: {html_path} not found</h1>", status_code=404)
        
    # Fixed with utf-8 for Windows compatibility
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)

@app.post("/submit-credentials")
async def handle_submission(username: str = Form(...), password: str = Form(...), uid: str = Form(None)):
    """PHASE 3: Captures the 'Compromise' event."""
    logger.warning(f"⚠️ [COMPROMISED] User {uid} submitted credentials.")
    log_event(uid, "COMPROMISED", f"Username: {username}")
    return HTMLResponse("<h2>Security Sync Complete.</h2><p>Your results have been recorded for audit.</p>")

@app.post("/webhooks/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """PHASE 1: Receives real-time click data from Postmark."""
    if x_postmark_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401)
    
    data = await request.json()
    if data.get("RecordType") == "Click":
        uid = data.get("Metadata", {}).get("user_uid")
        logger.info(f"🖱️ [EMAIL CLICK] User {uid} clicked the link.")
        log_event(uid, "EMAIL_CLICK")
    return {"status": "ok"}

# --- CAMPAIGN TOOL (The Sender) ---

def run_campaign():
    """Trigger the phishing email send."""
    # Update this to your NGROK URL for live testing
    base_url = "https://jayda-nondefunct-teasingly.ngrok-free.dev" 
    user = {"email": "fhbhatti@ncsu.edu", "uid": "student_01"}
    
    print(f"🚀 Sending Campaign to {user['email']}...")
    postmark.emails.send(
        From='pkengso@ncsu.edu', 
        To=user['email'],
        Subject='Action Required: Unusual Account Activity',
        HtmlBody=f'Please <a href="{base_url}/verify?uid={user["uid"]}">verify your identity here</a>.',
        TrackLinks='HtmlAndText',
        Metadata={"user_uid": user['uid']}
    )
    print("✅ Email Sent successfully.")

# --- EXECUTION ---

if __name__ == "__main__":
    # Start Sender: python EmailAutomationRouter.py send
    if len(sys.argv) > 1 and sys.argv[1].lower() == "send":
        run_campaign()
    # Start Listener: python EmailAutomationRouter.py
    else:
        print(f"📡 Listener live at http://localhost:8000")
        uvicorn.run(app, host="0.0.0.0", port=8000)