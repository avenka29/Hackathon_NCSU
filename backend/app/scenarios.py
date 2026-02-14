"""
Pre-written phishing scenarios.
Each scenario is a scripted conversation with 4-6 exchanges.
"""

from app.models import Scenario, ScenarioLine

SCENARIOS = {
    "bank_fraud": Scenario(
        id="bank_fraud",
        name="Bank Fraud Department",
        description="Scammer pretends to be from the bank's fraud department warning about suspicious activity",
        difficulty="medium",
        lines=[
            ScenarioLine(
                turn=1,
                speaker="scammer",
                text="Hello, this is David from the fraud department at your bank. We've detected some suspicious activity on your account ending in 4567. Are you available to verify some information?",
                audio_url=None  # Will be populated after generation
            ),
            ScenarioLine(
                turn=2,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=3,
                speaker="scammer",
                text="We're showing a charge of $2,500 attempting to process from an online retailer in California. Did you authorize this transaction?",
                audio_url=None
            ),
            ScenarioLine(
                turn=4,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=5,
                speaker="scammer",
                text="I understand. For security purposes, I need to verify your identity. Can you please confirm the full account number on the card?",
                audio_url=None
            ),
            ScenarioLine(
                turn=6,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=7,
                speaker="scammer",
                text="Thank you. I'm sending a verification code to your phone right now. When you receive it, please read me that 6-digit code so I can cancel this fraudulent transaction immediately.",
                audio_url=None
            ),
            ScenarioLine(
                turn=8,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=9,
                speaker="scammer",
                text="Perfect. Your account is now secured and the fraudulent charge has been blocked. You should see a confirmation email within 24 hours. Is there anything else I can help you with today?",
                audio_url=None
            ),
            ScenarioLine(
                turn=10,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=11,
                speaker="scammer",
                text="Thank you for your time. Have a great day and remember to monitor your account regularly.",
                audio_url=None
            )
        ]
    ),

    "tech_support": Scenario(
        id="tech_support",
        name="Tech Support Scam",
        description="Scammer claims to be from Microsoft warning about a virus on the computer",
        difficulty="easy",
        lines=[
            ScenarioLine(
                turn=1,
                speaker="scammer",
                text="Hello, this is Michael from Microsoft Technical Support. We've detected malicious software on your computer that's sending your personal data to hackers. Is this a good time to help you remove it?",
                audio_url=None
            ),
            ScenarioLine(
                turn=2,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=3,
                speaker="scammer",
                text="I need you to go to your computer right now. Can you tell me what you see on your screen? Are there any error messages or pop-ups?",
                audio_url=None
            ),
            ScenarioLine(
                turn=4,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=5,
                speaker="scammer",
                text="Okay, I'm going to give you a website to visit so I can remote into your computer and remove the virus. Please write this down: support-dot-microsoft-dash-secure.com. Can you open that in your browser?",
                audio_url=None
            ),
            ScenarioLine(
                turn=6,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=7,
                speaker="scammer",
                text="Great. Now you should see a download button. Click that and tell me the 6-digit access code that appears on your screen.",
                audio_url=None
            ),
            ScenarioLine(
                turn=8,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=9,
                speaker="scammer",
                text="Perfect. I'm connecting now to scan your system. This will take about 30 seconds.",
                audio_url=None
            )
        ]
    ),

    "irs_tax": Scenario(
        id="irs_tax",
        name="IRS Tax Warrant",
        description="Scammer impersonates IRS agent threatening arrest for unpaid taxes",
        difficulty="hard",
        lines=[
            ScenarioLine(
                turn=1,
                speaker="scammer",
                text="This is Officer Jenkins from the Internal Revenue Service. We have issued a warrant for your arrest due to unpaid taxes from 2022 and 2023 totaling $8,450. This is your final notice before we dispatch local law enforcement. Do you understand the severity of this situation?",
                audio_url=None
            ),
            ScenarioLine(
                turn=2,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=3,
                speaker="scammer",
                text="You can avoid arrest if you settle this debt immediately. I'm authorized to accept payment over the phone right now. Do you have access to your bank account or a credit card?",
                audio_url=None
            ),
            ScenarioLine(
                turn=4,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=5,
                speaker="scammer",
                text="Time is critical here. I can only hold this warrant for the next 15 minutes. Please provide your social security number so I can verify your identity and process the payment to clear this warrant.",
                audio_url=None
            ),
            ScenarioLine(
                turn=6,
                speaker="user",
                text="[User response expected]"
            ),
            ScenarioLine(
                turn=7,
                speaker="scammer",
                text="I need the payment immediately. You can pay using gift cards from any major retailer. Purchase $8,450 in iTunes or Google Play cards and read me the codes. This is the only way to stop the arrest warrant.",
                audio_url=None
            )
        ]
    ),

    "adith_venkatesh": Scenario(
        id="adith_venkatesh",
        name="adith ven",
        description="Scammer pretends to be a friend asking for money",
        difficulty="easy",
        lines=[
            ScenarioLine(
                turn=1,
                speaker="scammer",
                text="Yo adi please fade the date and come to work on the hackathon with USSSSSS, PLease bro we need you also isn't this hella cool after say youre respose so we can store it in a json",
                audio_url=None
            ),
            ScenarioLine(
                turn=2,
                speaker="user",
                text="[User response expected]"
            ),
        ]
    ),
}


def get_scenario(scenario_id: str) -> Scenario:
    """Retrieve a scenario by ID"""
    if scenario_id not in SCENARIOS:
        raise ValueError(f"Scenario '{scenario_id}' not found")
    return SCENARIOS[scenario_id]


def list_scenarios() -> list[Scenario]:
    """List all available scenarios"""
    return list(SCENARIOS.values())
