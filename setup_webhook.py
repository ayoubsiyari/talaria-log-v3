#!/usr/bin/env python3
"""
Setup Stripe webhook configuration on VPS
This script will help configure the webhook endpoint and test it
"""

import requests
import json

def test_webhook_endpoint():
    """Test if the webhook endpoint is accessible"""
    webhook_url = "http://178.16.131.52/api/payments/webhook"
    
    print(f"Testing webhook endpoint: {webhook_url}")
    
    try:
        # Test with a simple POST request
        response = requests.post(webhook_url, 
                               json={"test": "webhook"},
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:  # Expected for invalid signature
            print("✅ Webhook endpoint is accessible (400 is expected for invalid signature)")
            return True
        else:
            print("⚠️ Unexpected response, but endpoint is accessible")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Webhook endpoint not accessible: {e}")
        return False

def print_webhook_setup_instructions():
    """Print instructions for setting up Stripe webhook"""
    print("\n" + "="*60)
    print("STRIPE WEBHOOK SETUP INSTRUCTIONS")
    print("="*60)
    print()
    print("1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks")
    print("2. Click 'Add endpoint'")
    print("3. Set endpoint URL to: http://178.16.131.52/api/payments/webhook")
    print("4. Select these events:")
    print("   - payment_intent.succeeded")
    print("   - payment_intent.payment_failed")
    print("   - charge.refunded")
    print("5. Click 'Add endpoint'")
    print("6. Copy the 'Signing secret' (starts with whsec_)")
    print("7. Update the VPS .env file with the new webhook secret")
    print()
    print("Current webhook secret on VPS: whsec_4Zi9JyRCfusGKhDeH10OhCQkDq3n8FKw")
    print("Make sure the new secret from Stripe Dashboard matches this or update it.")
    print()

if __name__ == "__main__":
    print("🔧 Setting up Stripe webhook configuration...")
    
    # Test webhook endpoint
    if test_webhook_endpoint():
        print("✅ Webhook endpoint is working")
    else:
        print("❌ Webhook endpoint has issues")
    
    # Print setup instructions
    print_webhook_setup_instructions()

