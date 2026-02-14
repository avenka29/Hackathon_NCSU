import os
import uvicorn
import logging
import sys
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

# Important: Point directly to the current directory since landing.html is in the same folder
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "ncsu_secure_2026")

# --- ENDPOINTS ---

@app.get("/verify", response_class=HTMLResponse)
async def serve_landing_page(uid: str):
    """PHASE 2: Serves LandingPage.html from the local folder."""
    logger.info(f"🚨 [LANDING PAGE LOADED] User: {uid}")
    
    # Updated filename to match your file: LandingPage.html
    html_path = os.path.join(CURRENT_DIR, "LandingPage.html")
    
    if not os.path.exists(html_path):
        logger.error(f"File not found at: {html_path}")
        return HTMLResponse(f"<h1>Error: {html_path} not found</h1>", status_code=404)
        
    # Explicitly using utf-8 to prevent the UnicodeDecodeError you saw
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    return HTMLResponse(content=content)

@app.post("/submit-credentials")
async def handle_submission(username: str = Form(...), password: str = Form(...), uid: str = Form(None)):
    """PHASE 3: Captures the 'Compromise' event when user submits the form."""
    logger.warning(f"⚠️ [COMPROMISED] User {uid} submitted credentials. Username: {username}")
    return HTMLResponse("<h2>Security Sync Complete.</h2><p>Your identity has been verified. You may close this window.</p>")

@app.post("/webhooks/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """PHASE 1: Receives real-time click data pushed from Postmark."""
    if x_postmark_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401)
    
    data = await request.json()
    if data.get("RecordType") == "Click":
        uid = data.get("Metadata", {}).get("user_uid")
        logger.info(f"毫 [EMAIL CLICK] User {uid} clicked the link.")
    return {"status": "ok"}

# --- CAMPAIGN TOOL ---

def run_campaign():
    """Trigger the phishing email send."""
    # Update this to your public NGROK URL before running!
    base_url = "https://jayda-nondefunct-teasingly.ngrok-free.dev" 
    user = {"email": "fhbhatti@ncsu.edu", "uid": "student_01"}
    
    print(f"Sending campaign to {user['email']}...")
    postmark.emails.send(
        From='pkengso@ncsu.edu',
        To=user['email'],
        Subject='Security Notice: Action Required',
        HtmlBody=f'Please <a href="{base_url}/verify?uid={user["uid"]}">sync your account here</a>.',
        TrackLinks='HtmlAndText',
        Metadata={"user_uid": user['uid']}
    )
    print("✅ Email Sent successfully.")

# --- EXECUTION ---

if __name__ == "__main__":
    # Run 'python EmailAutomationRouter.py send' to trigger email
    if len(sys.argv) > 1 and sys.argv[1] == "send":
        run_campaign()
    # Run 'python EmailAutomationRouter.py' to start listener
    else:
        print(f"📡 Server starting on port 8000...")
        print(f"📁 Serving landing page from: {CURRENT_DIR}")
        uvicorn.run(app, host="0.0.0.0", port=8000)