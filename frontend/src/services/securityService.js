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
   * Create secure payment request
   */
  async createSecurePaymentRequest(endpoint, data) {
    try {
      // Validate data
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

      // Make request
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
