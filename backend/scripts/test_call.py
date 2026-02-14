#!/usr/bin/env python3
"""
Test script to initiate a call.

Usage:
    python scripts/test_call.py +15551234567 bank_fraud
"""

import sys
import requests


def test_call(phone_number: str, scenario_id: str = "bank_fraud"):
    """Initiate a test call"""

    url = "http://localhost:8000/api/call/initiate"

    payload = {
        "phone_number": phone_number,
        "scenario_id": scenario_id
    }

    print(f"Initiating call to {phone_number} with scenario '{scenario_id}'...")
    print(f"POST {url}")
    print(f"Payload: {payload}\n")

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        data = response.json()

        print("✓ Call initiated successfully!")
        print(f"  Call SID: {data['call_sid']}")
        print(f"  Status: {data['status']}")
        print(f"  Message: {data['message']}")
        print(f"\nPhone should ring shortly...")
        print(f"\nTo check status:")
        print(f"  GET http://localhost:8000/api/call/{data['call_sid']}/status")
        print(f"\nTo view transcript after call:")
        print(f"  GET http://localhost:8000/api/call/{data['call_sid']}/transcript")

    except requests.exceptions.RequestException as e:
        print(f"✗ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_call.py <phone_number> [scenario_id]")
        print("\nExample:")
        print("  python scripts/test_call.py +15551234567 bank_fraud")
        print("\nAvailable scenarios:")
        print("  - bank_fraud (default)")
        print("  - tech_support")
        print("  - irs_tax")
        sys.exit(1)

    phone = sys.argv[1]
    scenario = sys.argv[2] if len(sys.argv) > 2 else "bank_fraud"

    test_call(phone, scenario)
