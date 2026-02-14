#!/bin/bash
# ScamFlight Backend Setup Script

echo "========================================="
echo "ScamFlight Backend Setup"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version
echo ""

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   - TWILIO_ACCOUNT_SID"
    echo "   - TWILIO_AUTH_TOKEN"
    echo "   - TWILIO_PHONE_NUMBER"
    echo "   - ELEVENLABS_API_KEY"
    echo "   - BASE_URL (your ngrok URL)"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Create static directories
echo "Creating static directories..."
mkdir -p static/audio
echo "✓ Static directories created"
echo ""

# Check if Valkey/Redis is running
echo "Checking Valkey/Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✓ Valkey/Redis is running"
else
    echo "⚠️  Valkey/Redis is not running"
    echo "   Start it with: brew services start valkey"
    echo "   Or: docker run -d -p 6379:6379 valkey/valkey"
fi
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Start ngrok: ngrok http 8000"
echo "3. Update BASE_URL in .env with ngrok URL"
echo "4. Generate audio: python scripts/generate_audio.py"
echo "5. Start server: uvicorn main:app --reload"
echo ""
