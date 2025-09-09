"""
Placeholder Configuration File
=============================

This file contains placeholders for all third-party integrations and API keys.
Replace the placeholder values with your actual API keys and credentials when ready.

IMPORTANT: Never commit real API keys to version control!
Add this file to .gitignore or use environment variables in production.

Usage:
1. Replace the placeholder values with your actual API keys
2. For production, use environment variables instead of hardcoded values
3. Keep this file updated as new integrations are added
"""

# =============================================================================
# PAYMENT PROCESSING
# =============================================================================

# Stripe Configuration
STRIPE_CONFIG = {
    "publishable_key": "pk_test_your_stripe_publishable_key_here",
    "secret_key": "sk_test_your_stripe_secret_key_here",
    "webhook_secret": "whsec_your_stripe_webhook_secret_here",
    "currency": "usd",
    "enabled": True
}

# PayPal Configuration
PAYPAL_CONFIG = {
    "client_id": "your_paypal_client_id_here",
    "client_secret": "your_paypal_client_secret_here",
    "mode": "sandbox",  # or "live"
    "currency": "USD",
    "enabled": False
}

# Square Configuration
SQUARE_CONFIG = {
    "application_id": "your_square_application_id_here",
    "access_token": "your_square_access_token_here",
    "location_id": "your_square_location_id_here",
    "environment": "sandbox",  # or "production"
    "enabled": False
}

# =============================================================================
# EMAIL SERVICES
# =============================================================================

# SendGrid Configuration
SENDGRID_CONFIG = {
    "api_key": "SG.your_sendgrid_api_key_here",
    "from_email": "noreply@yourdomain.com",
    "from_name": "Your Company Name",
    "enabled": True
}

# Mailgun Configuration
MAILGUN_CONFIG = {
    "api_key": "key-your_mailgun_api_key_here",
    "domain": "your_domain.mailgun.org",
    "from_email": "noreply@yourdomain.com",
    "enabled": False
}

# AWS SES Configuration
AWS_SES_CONFIG = {
    "access_key_id": "your_aws_access_key_id_here",
    "secret_access_key": "your_aws_secret_access_key_here",
    "region": "us-east-1",
    "from_email": "noreply@yourdomain.com",
    "enabled": False
}

# =============================================================================
# SMS SERVICES
# =============================================================================

# Twilio Configuration
TWILIO_CONFIG = {
    "account_sid": "your_twilio_account_sid_here",
    "auth_token": "your_twilio_auth_token_here",
    "phone_number": "+1234567890",
    "enabled": False
}

# AWS SNS Configuration
AWS_SNS_CONFIG = {
    "access_key_id": "your_aws_access_key_id_here",
    "secret_access_key": "your_aws_secret_access_key_here",
    "region": "us-east-1",
    "enabled": False
}

# =============================================================================
# ANALYTICS & TRACKING
# =============================================================================

# Google Analytics
GOOGLE_ANALYTICS_CONFIG = {
    "tracking_id": "GA-XXXXXXXXX-X",
    "enabled": True
}

# Google Tag Manager
GOOGLE_TAG_MANAGER_CONFIG = {
    "container_id": "GTM-XXXXXXX",
    "enabled": False
}

# Facebook Pixel
FACEBOOK_PIXEL_CONFIG = {
    "pixel_id": "your_facebook_pixel_id_here",
    "enabled": False
}

# =============================================================================
# CLOUD STORAGE
# =============================================================================

# AWS S3 Configuration
AWS_S3_CONFIG = {
    "access_key_id": "your_aws_access_key_id_here",
    "secret_access_key": "your_aws_secret_access_key_here",
    "bucket_name": "your-s3-bucket-name",
    "region": "us-east-1",
    "enabled": False
}

# Google Cloud Storage
GOOGLE_CLOUD_STORAGE_CONFIG = {
    "project_id": "your_google_cloud_project_id",
    "bucket_name": "your-gcs-bucket-name",
    "credentials_file": "path/to/service-account-key.json",
    "enabled": False
}

# Cloudinary Configuration
CLOUDINARY_CONFIG = {
    "cloud_name": "your_cloudinary_cloud_name",
    "api_key": "your_cloudinary_api_key",
    "api_secret": "your_cloudinary_api_secret",
    "enabled": False
}

# =============================================================================
# DATABASE & CACHING
# =============================================================================

# Redis Configuration
REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "password": "your_redis_password_here",
    "db": 0,
    "enabled": True
}

# MongoDB Configuration (if needed)
MONGODB_CONFIG = {
    "uri": "mongodb://localhost:27017/your_database",
    "database": "your_database_name",
    "enabled": False
}

# =============================================================================
# SOCIAL MEDIA INTEGRATIONS
# =============================================================================

# Facebook Configuration
FACEBOOK_CONFIG = {
    "app_id": "your_facebook_app_id_here",
    "app_secret": "your_facebook_app_secret_here",
    "enabled": False
}

# Google OAuth
GOOGLE_OAUTH_CONFIG = {
    "client_id": "your_google_client_id_here",
    "client_secret": "your_google_client_secret_here",
    "enabled": False
}

# Twitter Configuration
TWITTER_CONFIG = {
    "api_key": "your_twitter_api_key_here",
    "api_secret": "your_twitter_api_secret_here",
    "access_token": "your_twitter_access_token_here",
    "access_token_secret": "your_twitter_access_token_secret_here",
    "enabled": False
}

# LinkedIn Configuration
LINKEDIN_CONFIG = {
    "client_id": "your_linkedin_client_id_here",
    "client_secret": "your_linkedin_client_secret_here",
    "enabled": False
}

# =============================================================================
# NOTIFICATION SERVICES
# =============================================================================

# Push Notifications (Firebase)
FIREBASE_CONFIG = {
    "project_id": "your_firebase_project_id",
    "private_key_id": "your_private_key_id",
    "private_key": "-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
    "client_id": "your_client_id",
    "enabled": False
}

# OneSignal Configuration
ONESIGNAL_CONFIG = {
    "app_id": "your_onesignal_app_id_here",
    "rest_api_key": "your_onesignal_rest_api_key_here",
    "enabled": False
}

# =============================================================================
# MONITORING & LOGGING
# =============================================================================

# Sentry Configuration
SENTRY_CONFIG = {
    "dsn": "https://your_sentry_dsn_here@sentry.io/project_id",
    "environment": "development",  # or "production"
    "enabled": False
}

# LogRocket Configuration
LOGROCKET_CONFIG = {
    "app_id": "your_logrocket_app_id_here",
    "enabled": False
}

# New Relic Configuration
NEW_RELIC_CONFIG = {
    "license_key": "your_new_relic_license_key_here",
    "app_name": "Your App Name",
    "enabled": False
}

# =============================================================================
# AI & MACHINE LEARNING
# =============================================================================

# OpenAI Configuration
OPENAI_CONFIG = {
    "api_key": "sk-your_openai_api_key_here",
    "organization": "your_openai_organization_id",
    "enabled": False
}

# Google AI (Gemini) Configuration
GOOGLE_AI_CONFIG = {
    "api_key": "your_google_ai_api_key_here",
    "enabled": False
}

# Anthropic Configuration
ANTHROPIC_CONFIG = {
    "api_key": "sk-ant-your_anthropic_api_key_here",
    "enabled": False
}

# =============================================================================
# MAPS & LOCATION SERVICES
# =============================================================================

# Google Maps Configuration
GOOGLE_MAPS_CONFIG = {
    "api_key": "your_google_maps_api_key_here",
    "enabled": False
}

# Mapbox Configuration
MAPBOX_CONFIG = {
    "access_token": "your_mapbox_access_token_here",
    "enabled": False
}

# =============================================================================
# WEATHER SERVICES
# =============================================================================

# OpenWeatherMap Configuration
OPENWEATHER_CONFIG = {
    "api_key": "your_openweather_api_key_here",
    "enabled": False
}

# WeatherAPI Configuration
WEATHERAPI_CONFIG = {
    "api_key": "your_weatherapi_key_here",
    "enabled": False
}

# =============================================================================
# TRANSLATION SERVICES
# =============================================================================

# Google Translate Configuration
GOOGLE_TRANSLATE_CONFIG = {
    "api_key": "your_google_translate_api_key_here",
    "enabled": False
}

# DeepL Configuration
DEEPL_CONFIG = {
    "api_key": "your_deepl_api_key_here",
    "enabled": False
}

# =============================================================================
# FILE PROCESSING
# =============================================================================

# PDF Processing (PDFTron)
PDFTRON_CONFIG = {
    "license_key": "your_pdftron_license_key_here",
    "enabled": False
}

# Image Processing (Cloudinary)
IMAGE_PROCESSING_CONFIG = {
    "cloudinary": CLOUDINARY_CONFIG,
    "enabled": False
}

# =============================================================================
# SECURITY & AUTHENTICATION
# =============================================================================

# JWT Configuration
JWT_CONFIG = {
    "secret_key": "your_jwt_secret_key_here_change_this_in_production",
    "algorithm": "HS256",
    "expiration_hours": 24
}

# Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    "default": "100 per minute",
    "login": "5 per minute",
    "register": "3 per hour",
    "enabled": True
}

# =============================================================================
# DEVELOPMENT & TESTING
# =============================================================================

# Test Configuration
TEST_CONFIG = {
    "stripe_test_key": "sk_test_your_stripe_test_key_here",
    "test_email": "test@example.com",
    "test_phone": "+1234567890"
}

# =============================================================================
# ENVIRONMENT VARIABLES MAPPING
# =============================================================================

# Map configuration keys to environment variable names
ENV_VAR_MAPPING = {
    "STRIPE_SECRET_KEY": "STRIPE_CONFIG.secret_key",
    "STRIPE_PUBLISHABLE_KEY": "STRIPE_CONFIG.publishable_key",
    "SENDGRID_API_KEY": "SENDGRID_CONFIG.api_key",
    "TWILIO_ACCOUNT_SID": "TWILIO_CONFIG.account_sid",
    "TWILIO_AUTH_TOKEN": "TWILIO_CONFIG.auth_token",
    "AWS_ACCESS_KEY_ID": "AWS_S3_CONFIG.access_key_id",
    "AWS_SECRET_ACCESS_KEY": "AWS_S3_CONFIG.secret_access_key",
    "GOOGLE_ANALYTICS_ID": "GOOGLE_ANALYTICS_CONFIG.tracking_id",
    "OPENAI_API_KEY": "OPENAI_CONFIG.api_key",
    "JWT_SECRET_KEY": "JWT_CONFIG.secret_key",
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_config_value(config_path):
    """
    Get configuration value from nested dictionary using dot notation.
    
    Args:
        config_path (str): Path to config value (e.g., 'STRIPE_CONFIG.secret_key')
    
    Returns:
        The configuration value or None if not found
    """
    try:
        keys = config_path.split('.')
        value = globals()[keys[0]]
        for key in keys[1:]:
            value = value[key]
        return value
    except (KeyError, TypeError):
        return None

def is_integration_enabled(integration_name):
    """
    Check if a specific integration is enabled.
    
    Args:
        integration_name (str): Name of the integration (e.g., 'STRIPE_CONFIG')
    
    Returns:
        bool: True if enabled, False otherwise
    """
    config = globals().get(integration_name, {})
    return config.get('enabled', False)

def get_all_enabled_integrations():
    """
    Get a list of all enabled integrations.
    
    Returns:
        list: List of enabled integration names
    """
    enabled = []
    for key, value in globals().items():
        if key.endswith('_CONFIG') and isinstance(value, dict) and value.get('enabled', False):
            enabled.append(key)
    return enabled

def validate_required_keys(config_name, required_keys):
    """
    Validate that all required keys are present in a configuration.
    
    Args:
        config_name (str): Name of the configuration
        required_keys (list): List of required keys
    
    Returns:
        dict: Dictionary with validation results
    """
    config = globals().get(config_name, {})
    missing_keys = []
    present_keys = []
    
    for key in required_keys:
        if key not in config or not config[key] or config[key].startswith('your_'):
            missing_keys.append(key)
        else:
            present_keys.append(key)
    
    return {
        'valid': len(missing_keys) == 0,
        'missing_keys': missing_keys,
        'present_keys': present_keys,
        'total_required': len(required_keys)
    }

# =============================================================================
# USAGE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    # Example: Check if Stripe is configured
    stripe_validation = validate_required_keys('STRIPE_CONFIG', ['secret_key', 'publishable_key'])
    print(f"Stripe Configuration Valid: {stripe_validation['valid']}")
    print(f"Missing Keys: {stripe_validation['missing_keys']}")
    
    # Example: Get all enabled integrations
    enabled_integrations = get_all_enabled_integrations()
    print(f"Enabled Integrations: {enabled_integrations}")
    
    # Example: Get specific config value
    stripe_key = get_config_value('STRIPE_CONFIG.secret_key')
    print(f"Stripe Key: {stripe_key[:10]}..." if stripe_key else "Not configured")
