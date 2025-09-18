/**
 * Security Service for Frontend
 * Handles CSRF tokens, input validation, and security utilities
 */

import { API_BASE_URL } from '@/config/config';

class SecurityService {
  constructor() {
    this.csrfToken = null;
    this.tokenExpiry = null;
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get CSRF token for payment forms
   */
  async getCSRFToken() {
    try {
      // Check if we have a valid token
      if (this.csrfToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.csrfToken;
      }

      // Fetch new token
      const response = await fetch(`${this.baseURL}/payments/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrf_token;
        this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
        return this.csrfToken;
      } else {
        throw new Error('Failed to get CSRF token');
      }
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validate customer name
   */
  validateName(name) {
    if (!name || name.trim().length < 2) {
      return false;
    }
    if (name.length > 100) {
      return false;
    }
    // Check for suspicious characters
    if (/[<>"']/.test(name)) {
      return false;
    }
    return true;
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount) {
    // Handle null, undefined, or empty values
    if (amount === null || amount === undefined || amount === '') {
      return false;
    }
    
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0.01 || num > 10000) {
      console.warn(`Invalid amount: ${amount} (parsed as: ${num})`);
      return false;
    }
    return true;
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate payment data before submission
   */
  validatePaymentData(data) {
    const errors = [];

    // Validate email
    if (!data.customer_email || !this.validateEmail(data.customer_email)) {
      errors.push('Invalid email address');
    }

    // Validate customer name
    if (!data.customer_name || !this.validateName(data.customer_name)) {
      errors.push('Invalid customer name');
    }

    // Validate items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Order must contain at least one item');
    } else {
      data.items.forEach((item, index) => {
        if (!item.name || item.name.trim().length === 0) {
          errors.push(`Item ${index + 1}: Name is required`);
        }
        if (!item.price || !this.validateAmount(item.price)) {
          errors.push(`Item ${index + 1}: Invalid price (${item.price})`);
        }
        if (!item.quantity || parseInt(item.quantity) < 1 || parseInt(item.quantity) > 100) {
          errors.push(`Item ${index + 1}: Invalid quantity`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Generate HMAC signature for request signing
   */
  async generateSignature(data, timestamp) {
    try {
      // Get the secret key from backend config - must match backend SECRET_KEY
      const secretKey = 'your-secret-key-here'; // This matches the .env SECRET_KEY
      
      // Create payload with timestamp
      const payload = `${timestamp}:${data}`;
      
      // Check if Web Crypto API is available (HTTPS context)
      if (window.crypto && window.crypto.subtle && window.isSecureContext) {
        console.log('🔐 Using Web Crypto API for signature generation');
        
        // Generate HMAC signature using Web Crypto API
        const encoder = new TextEncoder();
        const key = await window.crypto.subtle.importKey(
          'raw',
          encoder.encode(secretKey),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await window.crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(payload)
        );
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
      } else {
        // Fallback for HTTP contexts (development)
        console.warn('⚠️ Web Crypto API not available, using fallback signature generation');
        console.warn('⚠️ This is only suitable for development environments');
        
        // Simple fallback - create a deterministic hash-like signature
        // This is NOT cryptographically secure but works for development
        let hash = 0;
        const fullPayload = secretKey + payload;
        for (let i = 0; i < fullPayload.length; i++) {
          const char = fullPayload.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to positive hex string
        const fallbackSignature = Math.abs(hash).toString(16).padStart(8, '0') + 
                                   Date.now().toString(16).slice(-8);
        
        console.log('🔧 Generated fallback signature for development:', fallbackSignature.substring(0, 16) + '...');
        return fallbackSignature;
      }
    } catch (error) {
      console.error('Failed to generate signature:', error);
      // Final fallback: return a deterministic but simple signature
      const simpleHash = btoa(secretKey + timestamp + data).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 32);
      console.warn('🚨 Using emergency fallback signature:', simpleHash.substring(0, 16) + '...');
      return simpleHash;
    }
  }

  /**
   * Create secure payment request with proper request signing
   */
  async createSecurePaymentRequest(endpoint, data) {
    try {
      // Check if this is a payment success request (different validation)
      if (endpoint === '/payments/payment-success' || endpoint.endsWith('/payment-success')) {
        // For payment success, only validate required fields
        if (!data.order_id || !data.payment_intent_id || !data.customer_email) {
          throw new Error('Validation failed: Missing required fields for payment success');
        }
        
        // Validate email format even for payment success
        if (!this.validateEmail(data.customer_email)) {
          throw new Error('Validation failed: Invalid email format');
        }
        
        // Sanitize payment success data
        const sanitizedData = {
          ...data,
          customer_email: this.sanitizeInput(data.customer_email),
          order_id: this.sanitizeInput(data.order_id),
          payment_intent_id: this.sanitizeInput(data.payment_intent_id)
        };
        
        // Get CSRF token for security
        try {
          const csrfToken = await this.getCSRFToken();
          sanitizedData.csrf_token = csrfToken;
        } catch (csrfError) {
          console.warn('⚠️ CSRF token not available for payment success:', csrfError.message);
        }
        
        // Check if we're in development mode
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             import.meta.env?.MODE === 'development';
        
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add authentication if available
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        if (isDevelopment) {
          console.log('🔧 Development mode: Skipping request signing for payment success');
          console.log('🔧 Backend will accept unsigned requests in development mode');
        } else {
          // Production mode: Generate request signature
          console.log('🔐 Production mode: Generating request signature');
          
          const timestamp = Math.floor(Date.now() / 1000);
          // Match backend JSON format: sort_keys=True, separators=(',', ':')
          const sortedKeys = Object.keys(sanitizedData).sort();
          const sortedData = {};
          sortedKeys.forEach(key => {
            sortedData[key] = sanitizedData[key];
          });
          const dataString = JSON.stringify(sortedData).replace(/\s/g, '');
          
          try {
            const signature = await this.generateSignature(dataString, timestamp);
            headers['X-Request-Signature'] = signature;
            headers['X-Request-Timestamp'] = timestamp.toString();
            console.log('✅ Request signature generated for payment success');
          } catch (sigError) {
            console.error('❌ Signature generation failed in production:', sigError.message);
            throw new Error('Failed to generate request signature in production mode');
          }
        }
        
        // Make request
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          headers: headers,
          body: JSON.stringify(sanitizedData)
        });

        return response;
      }

      // For regular payment data, use full validation
      const validation = this.validatePaymentData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize data
      const sanitizedData = {
        ...data,
        customer_email: this.sanitizeInput(data.customer_email),
        customer_name: this.sanitizeInput(data.customer_name),
        items: data.items ? data.items.map(item => ({
          ...item,
          name: this.sanitizeInput(item.name)
        })) : []
      };

      // Try to get CSRF token (optional in development)
      try {
        const csrfToken = await this.getCSRFToken();
        sanitizedData.csrf_token = csrfToken;
        console.log('✅ CSRF token obtained:', csrfToken);
      } catch (csrfError) {
        console.warn('⚠️ CSRF token not available, proceeding without it:', csrfError.message);
        // Continue without CSRF token in development
      }

      // Make request (regular endpoints don't require signing)
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(sanitizedData)
      });

      return response;
    } catch (error) {
      console.error('Secure payment request error:', error);
      throw error;
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      event: event,
      details: details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Security Event:', logData);
    
    // In production, you might want to send this to a security monitoring service
    // this.sendToSecurityService(logData);
  }

  /**
   * Check for suspicious activity
   */
  detectSuspiciousActivity() {
    // Check for rapid form submissions
    const now = Date.now();
    const lastSubmission = localStorage.getItem('lastPaymentSubmission');
    
    if (lastSubmission) {
      const timeDiff = now - parseInt(lastSubmission);
      if (timeDiff < 5000) { // Less than 5 seconds
        this.logSecurityEvent('rapid_submission', { timeDiff });
        return true;
      }
    }
    
    localStorage.setItem('lastPaymentSubmission', now.toString());
    return false;
  }

  /**
   * Clear sensitive data
   */
  clearSensitiveData() {
    this.csrfToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('lastPaymentSubmission');
  }
}

// Create and export singleton instance
const securityService = new SecurityService();
export default securityService;
