// API Configuration
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// Stripe Configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51S2pYM1KM2bTDpXulaa2pz4T2YXMjMBZqybCwTRiatcxPJbVjxEuIU0dvmZPbmf3ubiYToBFvCB6UvSM5lpRntK800f7gYMuKH',
  CURRENCY: 'usd',
  COUNTRY: 'US'
};

// Environment Configuration
export const ENV = {
  development: import.meta.env?.MODE === 'development',
  production: import.meta.env?.MODE === 'production',
  test: import.meta.env?.MODE === 'test'
};

// Feature Flags
export const FEATURES = {
  SUBSCRIPTION_ANALYTICS: true,
  REAL_TIME_UPDATES: true,
  EXPORT_FUNCTIONALITY: true,
  ADVANCED_FILTERING: true,
  CHART_ANIMATIONS: true
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify'
  },
  
  // User Management
  USERS: {
    LIST: '/admin/users',
    DETAILS: '/admin/users',
    SEARCH: '/admin/users/search',
    STATS: '/admin/users/stats',
    PROFILE: '/admin/users',
    LOGIN_HISTORY: '/admin/users'
  },
  
  // Admin User Management
  ADMIN_USERS: {
    LIST: '/admin/admin-users',
    DETAILS: '/admin/admin-users',
    SEARCH: '/admin/admin-users/search',
    STATS: '/admin/admin-users/stats',
    CREATE: '/admin/admin-users',
    UPDATE: '/admin/admin-users',
    DELETE: '/admin/admin-users'
  },
  
  // Subscription Management
  SUBSCRIPTIONS: {
    OVERVIEW: '/admin/subscriptions/overview',
    ANALYTICS: '/admin/subscriptions/analytics',
    METRICS: '/admin/subscriptions/metrics',
    EVENTS: '/admin/subscriptions/events',
    PLANS: '/admin/subscriptions/plans',
    CHURN: '/admin/subscriptions/churn',
    EXPORT: '/admin/subscriptions/export',
    CALCULATE_METRICS: '/admin/subscriptions/calculate-metrics',
    ANALYZE_CHURN: '/admin/subscriptions/analyze-churn'
  },
  
  // Revenue
  REVENUE: {
    MRR_ARR: '/admin/revenue/mrr-arr'
  },
  
  // Activity Logs
  ACTIVITY: {
    LOGS: '/admin/activity/logs',
    SEARCH: '/admin/activity/search',
    ANALYTICS: '/admin/activity/analytics',
    EXPORT: '/admin/activity/export'
  },
  
  // Communication
  COMMUNICATION: {
    NOTIFICATIONS: '/admin/notifications',
    TEMPLATES: '/admin/notification-templates',
    ANNOUNCEMENTS: '/admin/announcements',
    MESSAGES: '/admin/messages',
    PREFERENCES: '/admin/communication-preferences',
    STATISTICS: '/admin/communication/statistics'
  },
  
  // RBAC
  RBAC: {
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    ASSIGNMENTS: '/admin/role-assignments'
  },
  
  // Health
  HEALTH: {
    STATUS: '/health',
    READINESS: '/health/ready',
    LIVENESS: '/health/live'
  }
};

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f8fafc',
    dark: '#1e293b'
  },
  
  GRADIENTS: {
    primary: ['#3b82f6', '#1d4ed8'],
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    danger: ['#ef4444', '#dc2626']
  },
  
  ANIMATION: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
};

// Table Configuration
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  DEFAULT_SORT_FIELD: 'created_at',
  DEFAULT_SORT_ORDER: 'desc'
};

// Date Format Configuration
export const DATE_CONFIG = {
  DISPLAY_FORMAT: 'MMM dd, yyyy',
  DISPLAY_FORMAT_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API_FORMAT: 'yyyy-MM-dd',
  API_FORMAT_WITH_TIME: 'yyyy-MM-ddTHH:mm:ss.SSSZ',
  RELATIVE_THRESHOLD: 7 // days
};

// Currency Configuration
export const CURRENCY_CONFIG = {
  DEFAULT: 'USD',
  SUPPORTED: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  FORMAT_OPTIONS: {
    USD: { style: 'currency', currency: 'USD' },
    EUR: { style: 'currency', currency: 'EUR' },
    GBP: { style: 'currency', currency: 'GBP' },
    CAD: { style: 'currency', currency: 'CAD' },
    AUD: { style: 'currency', currency: 'AUD' }
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You don\'t have permission to view this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  DEFAULT: 'Something went wrong. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Data loaded successfully.',
  DATA_SAVED: 'Data saved successfully.',
  DATA_DELETED: 'Data deleted successfully.',
  OPERATION_COMPLETED: 'Operation completed successfully.',
  EXPORT_COMPLETED: 'Export completed successfully.',
  METRICS_CALCULATED: 'Metrics calculated successfully.',
  CHURN_ANALYZED: 'Churn analysis completed successfully.'
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Subscription Status Colors
export const SUBSCRIPTION_STATUS_COLORS = {
  active: '#10b981',
  cancelled: '#ef4444',
  past_due: '#f59e0b',
  trial: '#3b82f6',
  suspended: '#64748b',
  expired: '#dc2626'
};

// Event Type Icons
export const EVENT_TYPE_ICONS = {
  subscription_created: 'Plus',
  subscription_renewed: 'RefreshCw',
  subscription_cancelled: 'X',
  subscription_upgraded: 'TrendingUp',
  subscription_downgraded: 'TrendingDown',
  payment_failed: 'AlertTriangle',
  payment_succeeded: 'CheckCircle',
  trial_started: 'Clock',
  trial_ended: 'AlertCircle',
  plan_changed: 'Settings'
};

// Time Range Options
export const TIME_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom range' }
];

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'csv', label: 'CSV', extension: '.csv' }
];

// Default Dashboard Configuration
export const DASHBOARD_CONFIG = {
  DEFAULT_TIME_RANGE: '30d',
  AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
  MAX_CHART_POINTS: 100,
  DEFAULT_METRICS: ['mrr', 'churn_rate', 'growth_rate', 'active_subscriptions']
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  DASHBOARD_PREFERENCES: 'dashboard_preferences',
  TABLE_PREFERENCES: 'table_preferences'
};

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Language Configuration
export const LANGUAGE_CONFIG = {
  DEFAULT: 'en',
  SUPPORTED: ['en', 'es', 'fr', 'de', 'pt']
};

export default {
  API_BASE_URL,
  ENV,
  FEATURES,
  ENDPOINTS,
  CHART_CONFIG,
  TABLE_CONFIG,
  DATE_CONFIG,
  CURRENCY_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  SUBSCRIPTION_STATUS_COLORS,
  EVENT_TYPE_ICONS,
  TIME_RANGE_OPTIONS,
  EXPORT_FORMATS,
  DASHBOARD_CONFIG,
  STORAGE_KEYS,
  THEME_CONFIG,
  LANGUAGE_CONFIG
};
