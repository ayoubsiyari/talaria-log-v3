"""
Payment Gateway Configuration
Supports multiple payment providers with Stripe as primary
"""

import os
from typing import Dict, Any

# Stripe Configuration
STRIPE_CONFIG = {
    'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', 'pk_test_your_stripe_publishable_key'),
    'secret_key': os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key'),
    'webhook_secret': os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret'),
    'currency': 'usd',
    'api_version': '2023-10-16'
}

# PayPal Configuration (Alternative)
PAYPAL_CONFIG = {
    'client_id': os.getenv('PAYPAL_CLIENT_ID', 'your_paypal_client_id'),
    'client_secret': os.getenv('PAYPAL_CLIENT_SECRET', 'your_paypal_client_secret'),
    'mode': 'sandbox',  # or 'live'
    'currency': 'USD'
}

# Payment Settings
PAYMENT_SETTINGS = {
    'default_provider': 'stripe',
    'supported_currencies': ['usd', 'eur', 'gbp'],
    'tax_rate': 0.08,  # 8% tax rate
    'minimum_amount': 1.00,  # Minimum order amount
    'maximum_amount': 10000.00,  # Maximum order amount
}

# Webhook Events to Handle
WEBHOOK_EVENTS = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
]

def get_payment_config(provider: str = 'stripe') -> Dict[str, Any]:
    """Get payment configuration for specified provider"""
    configs = {
        'stripe': STRIPE_CONFIG,
        'paypal': PAYPAL_CONFIG
    }
    return configs.get(provider, STRIPE_CONFIG)

def validate_payment_config() -> bool:
    """Validate that payment configuration is properly set"""
    stripe_config = get_payment_config('stripe')
    
    # Check if keys are set (not default placeholder values)
    if (stripe_config['publishable_key'].startswith('pk_test_') and 
        stripe_config['secret_key'].startswith('sk_test_')):
        return True
    
    return False

def get_stripe_config() -> Dict[str, Any]:
    """Get Stripe configuration"""
    return STRIPE_CONFIG
