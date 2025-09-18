/**
 * Frontend Placeholder Configuration File
 * =======================================
 * 
 * This file contains placeholders for all third-party integrations and API keys
 * that will be used in the frontend. Replace the placeholder values with your 
 * actual API keys and credentials when ready.
 * 
 * IMPORTANT: Never commit real API keys to version control!
 * Add this file to .gitignore or use environment variables in production.
 * 
 * Usage:
 * 1. Replace the placeholder values with your actual API keys
 * 2. For production, use environment variables instead of hardcoded values
 * 3. Keep this file updated as new integrations are added
 */

// =============================================================================
// PAYMENT PROCESSING
// =============================================================================

// Stripe Configuration (Frontend - Public Keys Only)
export const STRIPE_CONFIG = {
  publishableKey: "pk_test_your_stripe_publishable_key_here",
  currency: "usd",
  enabled: true
};

// PayPal Configuration (Frontend)
export const PAYPAL_CONFIG = {
  clientId: "your_paypal_client_id_here",
  currency: "USD",
  environment: "sandbox", // or "production"
  enabled: false
};

// Square Configuration (Frontend)
export const SQUARE_CONFIG = {
  applicationId: "your_square_application_id_here",
  locationId: "your_square_location_id_here",
  environment: "sandbox", // or "production"
  enabled: false
};

// =============================================================================
// ANALYTICS & TRACKING
// =============================================================================

// Google Analytics
export const GOOGLE_ANALYTICS_CONFIG = {
  trackingId: "GA-XXXXXXXXX-X",
  enabled: true
};

// Google Tag Manager
export const GOOGLE_TAG_MANAGER_CONFIG = {
  containerId: "GTM-XXXXXXX",
  enabled: false
};

// Facebook Pixel
export const FACEBOOK_PIXEL_CONFIG = {
  pixelId: "your_facebook_pixel_id_here",
  enabled: false
};

// Hotjar Configuration
export const HOTJAR_CONFIG = {
  siteId: "your_hotjar_site_id_here",
  enabled: false
};

// Mixpanel Configuration
export const MIXPANEL_CONFIG = {
  token: "your_mixpanel_token_here",
  enabled: false
};

// =============================================================================
// MAPS & LOCATION SERVICES
// =============================================================================

// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: "your_google_maps_api_key_here",
  enabled: false
};

// Mapbox Configuration
export const MAPBOX_CONFIG = {
  accessToken: "your_mapbox_access_token_here",
  enabled: false
};

// =============================================================================
// SOCIAL MEDIA INTEGRATIONS
// =============================================================================

// Facebook Configuration
export const FACEBOOK_CONFIG = {
  appId: "your_facebook_app_id_here",
  enabled: false
};

// Google OAuth
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "your_google_client_id_here",
  enabled: false
};

// Twitter Configuration
export const TWITTER_CONFIG = {
  apiKey: "your_twitter_api_key_here",
  enabled: false
};

// LinkedIn Configuration
export const LINKEDIN_CONFIG = {
  clientId: "your_linkedin_client_id_here",
  enabled: false
};

// =============================================================================
// NOTIFICATION SERVICES
// =============================================================================

// Push Notifications (Firebase)
export const FIREBASE_CONFIG = {
  apiKey: "your_firebase_api_key_here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your_firebase_project_id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_firebase_app_id",
  enabled: false
};

// OneSignal Configuration
export const ONESIGNAL_CONFIG = {
  appId: "your_onesignal_app_id_here",
  enabled: false
};

// =============================================================================
// MONITORING & LOGGING
// =============================================================================

// Sentry Configuration
export const SENTRY_CONFIG = {
  dsn: "https://your_sentry_dsn_here@sentry.io/project_id",
  environment: "development", // or "production"
  enabled: false
};

// LogRocket Configuration
export const LOGROCKET_CONFIG = {
  appId: "your_logrocket_app_id_here",
  enabled: false
};

// =============================================================================
// AI & MACHINE LEARNING
// =============================================================================

// OpenAI Configuration (Frontend - Limited)
export const OPENAI_CONFIG = {
  organization: "your_openai_organization_id",
  enabled: false
};

// Google AI (Gemini) Configuration
export const GOOGLE_AI_CONFIG = {
  apiKey: "your_google_ai_api_key_here",
  enabled: false
};

// =============================================================================
// CLOUD STORAGE
// =============================================================================

// Cloudinary Configuration (Frontend)
export const CLOUDINARY_CONFIG = {
  cloudName: "your_cloudinary_cloud_name",
  uploadPreset: "your_upload_preset_here",
  enabled: false
};

// AWS S3 Configuration (Frontend - Limited)
export const AWS_S3_CONFIG = {
  region: "us-east-1",
  bucketName: "your-s3-bucket-name",
  enabled: false
};

// =============================================================================
// WEATHER SERVICES
// =============================================================================

// OpenWeatherMap Configuration
export const OPENWEATHER_CONFIG = {
  apiKey: "your_openweather_api_key_here",
  enabled: false
};

// WeatherAPI Configuration
export const WEATHERAPI_CONFIG = {
  apiKey: "your_weatherapi_key_here",
  enabled: false
};

// =============================================================================
// TRANSLATION SERVICES
// =============================================================================

// Google Translate Configuration
export const GOOGLE_TRANSLATE_CONFIG = {
  apiKey: "your_google_translate_api_key_here",
  enabled: false
};

// DeepL Configuration
export const DEEPL_CONFIG = {
  apiKey: "your_deepl_api_key_here",
  enabled: false
};

// =============================================================================
// FILE PROCESSING
// =============================================================================

// PDF Processing (PDF.js)
export const PDF_CONFIG = {
  workerSrc: "/pdf.worker.min.js",
  enabled: true
};

// Image Processing (Frontend)
export const IMAGE_PROCESSING_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  enabled: true
};

// =============================================================================
// SECURITY & AUTHENTICATION
// =============================================================================

// JWT Configuration (Frontend - Limited)
export const JWT_CONFIG = {
  storageKey: "access_token",
  refreshKey: "refresh_token",
  expirationCheck: true
};

// Rate Limiting Configuration (Frontend)
export const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  timeWindow: 60000, // 1 minute
  enabled: true
};

// =============================================================================
// DEVELOPMENT & TESTING
// =============================================================================

// Test Configuration
export const TEST_CONFIG = {
  testEmail: "test@example.com",
  testPhone: "+1234567890",
  mockApiEnabled: false
};

// =============================================================================
// ENVIRONMENT VARIABLES MAPPING
// =============================================================================

// Map configuration keys to environment variable names
export const ENV_VAR_MAPPING = {
  STRIPE_PUBLISHABLE_KEY: "STRIPE_CONFIG.publishableKey",
  GOOGLE_ANALYTICS_ID: "GOOGLE_ANALYTICS_CONFIG.trackingId",
  FACEBOOK_PIXEL_ID: "FACEBOOK_PIXEL_CONFIG.pixelId",
  GOOGLE_MAPS_API_KEY: "GOOGLE_MAPS_CONFIG.apiKey",
  FIREBASE_API_KEY: "FIREBASE_CONFIG.apiKey",
  SENTRY_DSN: "SENTRY_CONFIG.dsn",
  CLOUDINARY_CLOUD_NAME: "CLOUDINARY_CONFIG.cloudName",
  OPENWEATHER_API_KEY: "OPENWEATHER_CONFIG.apiKey",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get configuration value from nested object using dot notation.
 * @param {string} configPath - Path to config value (e.g., 'STRIPE_CONFIG.publishableKey')
 * @returns {*} The configuration value or null if not found
 */
export const getConfigValue = (configPath) => {
  try {
    const keys = configPath.split('.');
    let value = window[keys[0]] || exports[keys[0]];
    for (let i = 1; i < keys.length; i++) {
      value = value[keys[i]];
    }
    return value;
  } catch (error) {
    console.warn(`Configuration path not found: ${configPath}`);
    return null;
  }
};

/**
 * Check if a specific integration is enabled.
 * @param {string} integrationName - Name of the integration (e.g., 'STRIPE_CONFIG')
 * @returns {boolean} True if enabled, false otherwise
 */
export const isIntegrationEnabled = (integrationName) => {
  const config = exports[integrationName] || {};
  return config.enabled === true;
};

/**
 * Get a list of all enabled integrations.
 * @returns {string[]} List of enabled integration names
 */
export const getAllEnabledIntegrations = () => {
  const enabled = [];
  Object.keys(exports).forEach(key => {
    if (key.endsWith('_CONFIG') && exports[key]?.enabled === true) {
      enabled.push(key);
    }
  });
  return enabled;
};

/**
 * Validate that all required keys are present in a configuration.
 * @param {string} configName - Name of the configuration
 * @param {string[]} requiredKeys - List of required keys
 * @returns {Object} Dictionary with validation results
 */
export const validateRequiredKeys = (configName, requiredKeys) => {
  const config = exports[configName] || {};
  const missingKeys = [];
  const presentKeys = [];
  
  requiredKeys.forEach(key => {
    if (!config[key] || config[key].toString().includes('your_')) {
      missingKeys.push(key);
    } else {
      presentKeys.push(key);
    }
  });
  
  return {
    valid: missingKeys.length === 0,
    missingKeys,
    presentKeys,
    totalRequired: requiredKeys.length
  };
};

/**
 * Load configuration from environment variables.
 * @returns {Object} Configuration object with environment variables
 */
export const loadEnvConfig = () => {
  const envConfig = {};
  
  Object.entries(ENV_VAR_MAPPING).forEach(([envVar, configPath]) => {
    const value = import.meta.env[`VITE_${envVar}`];
    if (value) {
      const keys = configPath.split('.');
      let current = envConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    }
  });
  
  return envConfig;
};

/**
 * Get all configurations that need API keys.
 * @returns {Object} Object with integration names and their required keys
 */
export const getRequiredApiKeys = () => {
  return {
    STRIPE_CONFIG: ['publishableKey'],
    PAYPAL_CONFIG: ['clientId'],
    GOOGLE_ANALYTICS_CONFIG: ['trackingId'],
    FACEBOOK_PIXEL_CONFIG: ['pixelId'],
    GOOGLE_MAPS_CONFIG: ['apiKey'],
    FIREBASE_CONFIG: ['apiKey', 'projectId'],
    SENTRY_CONFIG: ['dsn'],
    CLOUDINARY_CONFIG: ['cloudName'],
    OPENWEATHER_CONFIG: ['apiKey'],
    GOOGLE_AI_CONFIG: ['apiKey']
  };
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// Example usage in components:
/*
import { 
  STRIPE_CONFIG, 
  isIntegrationEnabled, 
  getConfigValue 
} from '@/config/placeholders';

// Check if Stripe is enabled
if (isIntegrationEnabled('STRIPE_CONFIG')) {
  // Initialize Stripe
  const stripe = Stripe(STRIPE_CONFIG.publishableKey);
}

// Get specific config value
const analyticsId = getConfigValue('GOOGLE_ANALYTICS_CONFIG.trackingId');
*/

// Export all configurations as default
export default {
  STRIPE_CONFIG,
  PAYPAL_CONFIG,
  SQUARE_CONFIG,
  GOOGLE_ANALYTICS_CONFIG,
  GOOGLE_TAG_MANAGER_CONFIG,
  FACEBOOK_PIXEL_CONFIG,
  HOTJAR_CONFIG,
  MIXPANEL_CONFIG,
  GOOGLE_MAPS_CONFIG,
  MAPBOX_CONFIG,
  FACEBOOK_CONFIG,
  GOOGLE_OAUTH_CONFIG,
  TWITTER_CONFIG,
  LINKEDIN_CONFIG,
  FIREBASE_CONFIG,
  ONESIGNAL_CONFIG,
  SENTRY_CONFIG,
  LOGROCKET_CONFIG,
  OPENAI_CONFIG,
  GOOGLE_AI_CONFIG,
  CLOUDINARY_CONFIG,
  AWS_S3_CONFIG,
  OPENWEATHER_CONFIG,
  WEATHERAPI_CONFIG,
  GOOGLE_TRANSLATE_CONFIG,
  DEEPL_CONFIG,
  PDF_CONFIG,
  IMAGE_PROCESSING_CONFIG,
  JWT_CONFIG,
  RATE_LIMIT_CONFIG,
  TEST_CONFIG,
  // Helper functions
  getConfigValue,
  isIntegrationEnabled,
  getAllEnabledIntegrations,
  validateRequiredKeys,
  loadEnvConfig,
  getRequiredApiKeys
};
