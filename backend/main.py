"""
ScamFlight - Phishing Training Phone Call Simulator
FastAPI Backend Server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import twilio_router, scenarios_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="ScamFlight API",
    description="Phone-based phishing training simulator",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for audio
static_dir = "static"
os.makedirs(static_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, "audio"), exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(twilio_router.router)
app.include_router(scenarios_router.router)


@app.get("/")
async def root():
    return {
        "name": "ScamFlight API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
