/**
 * Centralized logging utility with sensitive data filtering
 */

// Sensitive data patterns to filter out
const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
];

// PII patterns to filter out
const PII_PATTERNS = [
  /email/i,
  /phone/i,
  /ssn/i,
  /social.security/i,
  /address/i,
];

/**
 * Recursively sanitize an object to remove sensitive data
 */
function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) return '[Circular Reference]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string contains sensitive patterns
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(obj));
    const isPII = PII_PATTERNS.some(pattern => pattern.test(obj));
    
    if (isSensitive || isPII) {
      return '[FILTERED]';
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitiveKey) {
        sanitized[key] = '[FILTERED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return [prefix, message, sanitizeObject(data)];
  }
  return [prefix, message];
}

const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (message, data = null) => {
    if (import.meta.env.MODE !== 'production') {
      const logData = formatLogMessage('debug', message, data);
      console.log(...logData);
    }
  },

  /**
   * Info logs - shown in all environments
   */
  info: (message, data = null) => {
    const logData = formatLogMessage('info', message, data);
    console.log(...logData);
    
    // In production, you would send to your logging service here
    if (import.meta.env.MODE === 'production') {
      // Example: send to external logging service
      // loggingService.info(message, data);
    }
  },

  /**
   * Error logs - shown in all environments
   */
  error: (message, error = null) => {
    const logData = formatLogMessage('error', message, error);
    console.error(...logData);
    
    // In production, you would send to your error tracking service here
    if (import.meta.env.MODE === 'production') {
      // Example: send to external error tracking service
      // errorTrackingService.captureError(error || message);
    }
  },

  /**
   * Warn logs - shown in all environments
   */
  warn: (message, data = null) => {
    const logData = formatLogMessage('warn', message, data);
    console.warn(...logData);
    
    // In production, you would send to your logging service here
    if (import.meta.env.MODE === 'production') {
      // loggingService.warn(message, data);
    }
  }
};

export default logger;