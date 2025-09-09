#!/usr/bin/env python3
"""
Integration Checker Script
==========================

This script checks which integrations are configured and which ones need API keys.
Run this script to see the status of all your third-party integrations.

Usage:
    python scripts/check_integrations.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the placeholders module
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config'))
from placeholders import (
    get_all_enabled_integrations,
    validate_required_keys,
    get_config_value,
    STRIPE_CONFIG,
    SENDGRID_CONFIG,
    TWILIO_CONFIG,
    GOOGLE_ANALYTICS_CONFIG,
    FACEBOOK_PIXEL_CONFIG,
    AWS_S3_CONFIG,
    CLOUDINARY_CONFIG,
    FIREBASE_CONFIG,
    GOOGLE_MAPS_CONFIG,
    OPENAI_CONFIG,
    SENTRY_CONFIG,
    JWT_CONFIG
)

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_section(title):
    """Print a formatted section"""
    print(f"\n{'-'*40}")
    print(f"  {title}")
    print(f"{'-'*40}")

def check_integration(name, config, required_keys):
    """Check a specific integration"""
    print(f"\n🔍 {name}")
    
    # Check if enabled
    enabled = config.get('enabled', False)
    status = "✅ ENABLED" if enabled else "❌ DISABLED"
    print(f"   Status: {status}")
    
    if not enabled:
        print(f"   ⚠️  Integration is disabled. Set 'enabled: True' to use it.")
        return
    
    # Validate required keys
    validation = validate_required_keys(name, required_keys)
    
    if validation['valid']:
        print(f"   ✅ Configuration: VALID")
        print(f"   📋 Keys configured: {', '.join(validation['present_keys'])}")
    else:
        print(f"   ❌ Configuration: INVALID")
        print(f"   🚨 Missing keys: {', '.join(validation['missing_keys'])}")
        print(f"   📋 Present keys: {', '.join(validation['present_keys'])}")
        print(f"   💡 Update the placeholder values in config/placeholders.py")

def main():
    """Main function to check all integrations"""
    print_header("TALARIA ADMIN DASHBOARD - INTEGRATION CHECKER")
    
    print("\nThis script checks the status of all third-party integrations.")
    print("Update the configuration in 'backend/config/placeholders.py' to enable integrations.")
    
    # Payment Processing
    print_section("PAYMENT PROCESSING")
    check_integration('STRIPE_CONFIG', STRIPE_CONFIG, ['secret_key', 'publishable_key'])
    check_integration('PAYPAL_CONFIG', globals().get('PAYPAL_CONFIG', {}), ['client_id', 'client_secret'])
    check_integration('SQUARE_CONFIG', globals().get('SQUARE_CONFIG', {}), ['application_id', 'access_token'])
    
    # Email Services
    print_section("EMAIL SERVICES")
    check_integration('SENDGRID_CONFIG', SENDGRID_CONFIG, ['api_key', 'from_email'])
    check_integration('MAILGUN_CONFIG', globals().get('MAILGUN_CONFIG', {}), ['api_key', 'domain'])
    check_integration('AWS_SES_CONFIG', globals().get('AWS_SES_CONFIG', {}), ['access_key_id', 'secret_access_key'])
    
    # SMS Services
    print_section("SMS SERVICES")
    check_integration('TWILIO_CONFIG', TWILIO_CONFIG, ['account_sid', 'auth_token'])
    check_integration('AWS_SNS_CONFIG', globals().get('AWS_SNS_CONFIG', {}), ['access_key_id', 'secret_access_key'])
    
    # Analytics & Tracking
    print_section("ANALYTICS & TRACKING")
    check_integration('GOOGLE_ANALYTICS_CONFIG', GOOGLE_ANALYTICS_CONFIG, ['tracking_id'])
    check_integration('GOOGLE_TAG_MANAGER_CONFIG', globals().get('GOOGLE_TAG_MANAGER_CONFIG', {}), ['container_id'])
    check_integration('FACEBOOK_PIXEL_CONFIG', FACEBOOK_PIXEL_CONFIG, ['pixel_id'])
    
    # Cloud Storage
    print_section("CLOUD STORAGE")
    check_integration('AWS_S3_CONFIG', AWS_S3_CONFIG, ['access_key_id', 'secret_access_key', 'bucket_name'])
    check_integration('CLOUDINARY_CONFIG', CLOUDINARY_CONFIG, ['cloud_name', 'api_key', 'api_secret'])
    check_integration('GOOGLE_CLOUD_STORAGE_CONFIG', globals().get('GOOGLE_CLOUD_STORAGE_CONFIG', {}), ['project_id', 'bucket_name'])
    
    # Social Media
    print_section("SOCIAL MEDIA INTEGRATIONS")
    check_integration('FACEBOOK_CONFIG', globals().get('FACEBOOK_CONFIG', {}), ['app_id', 'app_secret'])
    check_integration('GOOGLE_OAUTH_CONFIG', globals().get('GOOGLE_OAUTH_CONFIG', {}), ['client_id', 'client_secret'])
    check_integration('TWITTER_CONFIG', globals().get('TWITTER_CONFIG', {}), ['api_key', 'api_secret'])
    check_integration('LINKEDIN_CONFIG', globals().get('LINKEDIN_CONFIG', {}), ['client_id', 'client_secret'])
    
    # Notifications
    print_section("NOTIFICATION SERVICES")
    check_integration('FIREBASE_CONFIG', FIREBASE_CONFIG, ['project_id', 'private_key', 'client_email'])
    check_integration('ONESIGNAL_CONFIG', globals().get('ONESIGNAL_CONFIG', {}), ['app_id', 'rest_api_key'])
    
    # Monitoring & Logging
    print_section("MONITORING & LOGGING")
    check_integration('SENTRY_CONFIG', SENTRY_CONFIG, ['dsn'])
    check_integration('LOGROCKET_CONFIG', globals().get('LOGROCKET_CONFIG', {}), ['app_id'])
    check_integration('NEW_RELIC_CONFIG', globals().get('NEW_RELIC_CONFIG', {}), ['license_key'])
    
    # AI & Machine Learning
    print_section("AI & MACHINE LEARNING")
    check_integration('OPENAI_CONFIG', OPENAI_CONFIG, ['api_key'])
    check_integration('GOOGLE_AI_CONFIG', globals().get('GOOGLE_AI_CONFIG', {}), ['api_key'])
    check_integration('ANTHROPIC_CONFIG', globals().get('ANTHROPIC_CONFIG', {}), ['api_key'])
    
    # Maps & Location
    print_section("MAPS & LOCATION SERVICES")
    check_integration('GOOGLE_MAPS_CONFIG', GOOGLE_MAPS_CONFIG, ['api_key'])
    check_integration('MAPBOX_CONFIG', globals().get('MAPBOX_CONFIG', {}), ['access_token'])
    
    # Weather Services
    print_section("WEATHER SERVICES")
    check_integration('OPENWEATHER_CONFIG', globals().get('OPENWEATHER_CONFIG', {}), ['api_key'])
    check_integration('WEATHERAPI_CONFIG', globals().get('WEATHERAPI_CONFIG', {}), ['api_key'])
    
    # Translation Services
    print_section("TRANSLATION SERVICES")
    check_integration('GOOGLE_TRANSLATE_CONFIG', globals().get('GOOGLE_TRANSLATE_CONFIG', {}), ['api_key'])
    check_integration('DEEPL_CONFIG', globals().get('DEEPL_CONFIG', {}), ['api_key'])
    
    # File Processing
    print_section("FILE PROCESSING")
    check_integration('PDFTRON_CONFIG', globals().get('PDFTRON_CONFIG', {}), ['license_key'])
    
    # Security
    print_section("SECURITY & AUTHENTICATION")
    check_integration('JWT_CONFIG', JWT_CONFIG, ['secret_key'])
    check_integration('RATE_LIMIT_CONFIG', globals().get('RATE_LIMIT_CONFIG', {}), [])
    
    # Database & Caching
    print_section("DATABASE & CACHING")
    check_integration('REDIS_CONFIG', globals().get('REDIS_CONFIG', {}), ['host', 'port'])
    check_integration('MONGODB_CONFIG', globals().get('MONGODB_CONFIG', {}), ['uri'])
    
    # Summary
    print_header("SUMMARY")
    
    enabled_integrations = get_all_enabled_integrations()
    print(f"\n📊 Total enabled integrations: {len(enabled_integrations)}")
    
    if enabled_integrations:
        print("\n✅ Enabled integrations:")
        for integration in enabled_integrations:
            print(f"   • {integration}")
    else:
        print("\n⚠️  No integrations are currently enabled.")
        print("   Edit 'backend/config/placeholders.py' and set 'enabled: True' for integrations you want to use.")
    
    print("\n📝 Next Steps:")
    print("1. Edit 'backend/config/placeholders.py' to add your API keys")
    print("2. Set 'enabled: True' for integrations you want to use")
    print("3. Run this script again to verify your configuration")
    print("4. Check 'SETUP_GUIDE.md' for detailed setup instructions")
    
    print_header("END OF CHECK")

if __name__ == "__main__":
    main()
