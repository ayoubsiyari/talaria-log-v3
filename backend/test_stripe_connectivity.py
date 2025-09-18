#!/usr/bin/env python3
"""
Test Stripe API connectivity
"""

from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

try:
    import stripe
    print("✓ Stripe library imported successfully")
except ImportError as e:
    print(f"✗ Failed to import Stripe: {e}")
    sys.exit(1)

# Set up Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

print("Testing Stripe API connectivity...")
print(f"Using API key: {stripe.api_key[:7]}...")

try:
    # Test API connection
    account = stripe.Account.retrieve()
    print("✓ Stripe API connection successful!")
    print(f"Account ID: {account.id}")
    print(f"Account type: {account.type}")
    print(f"Country: {account.country}")
    
    # Test creating a payment intent
    payment_intent = stripe.PaymentIntent.create(
        amount=1000,  # $10.00
        currency='usd',
        metadata={'test': 'connectivity_test'}
    )
    print("✓ Payment Intent creation successful!")
    print(f"Payment Intent ID: {payment_intent.id}")
    print(f"Status: {payment_intent.status}")
    
except Exception as e:
    print(f"✗ Stripe API connection failed: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    sys.exit(1)

print("\n🎉 All Stripe tests passed!")