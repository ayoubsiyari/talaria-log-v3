/**
 * Authentication Service for Cookie-Based Authentication
 * Handles session validation, token refresh, and secure API calls
 */

import { toast } from 'sonner';

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '';
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Check if user has a valid session
   */
  async validateSession() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/validate-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: true,
          user: data.user,
          expiresAt: data.expires_at
        };
      } else if (response.status === 401) {
        return { isValid: false, reason: 'unauthorized' };
      } else {
        return { isValid: false, reason: 'error' };
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return { isValid: false, reason: 'network_error' };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to perform token refresh
   */
  async _performTokenRefresh() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Session refreshed successfully');
        return { success: true, user: data.user };
      } else {
        // Refresh failed, redirect to login
        this.handleAuthFailure();
        return { success: false, reason: 'refresh_failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.handleAuthFailure();
      return { success: false, reason: 'network_error' };
    }
  }

  /**
   * Handle authentication failure
   */
  handleAuthFailure() {
    // Clear any stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'token_refresh_failed' }
    }));

    // Show notification
    toast.error('Session expired. Please log in again.');

    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async authenticatedRequest(url, options = {}) {
    // Ensure credentials are included
    const requestOptions = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      // First, validate session
      const sessionValidation = await this.validateSession();
      if (!sessionValidation.isValid) {
        if (sessionValidation.reason === 'unauthorized') {
          // Try to refresh token
          const refreshResult = await this.refreshToken();
          if (!refreshResult.success) {
            throw new Error('Authentication failed');
          }
        } else {
          throw new Error('Session validation failed');
        }
      }

      // Make the request
      const response = await fetch(url, requestOptions);

      // Handle 401 responses with token refresh
      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');
        
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          // Retry the original request
          return await fetch(url, requestOptions);
        } else {
          throw new Error('Authentication failed after token refresh');
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }

  /**
   * Make payment request with enhanced security
   */
  async makePaymentRequest(paymentData) {
    try {
      // Validate session before payment
      const sessionValidation = await this.validateSession();
      if (!sessionValidation.isValid) {
        throw new Error('Invalid session. Please log in again.');
      }

      // Get CSRF token for additional security
      let csrfToken = null;
      try {
        const csrfResponse = await fetch(`${this.baseURL}/api/payments/csrf-token`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrf_token;
        }
      } catch (csrfError) {
        console.warn('CSRF token not available:', csrfError);
      }

      // Add CSRF token to payment data
      const securePaymentData = {
        ...paymentData,
        ...(csrfToken && { csrf_token: csrfToken })
      };

      // Make authenticated payment request
      const response = await this.authenticatedRequest(`${this.baseURL}/api/payments/create-order`, {
        method: 'POST',
        body: JSON.stringify(securePaymentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Payment failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment request error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await fetch(`${this.baseURL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API response
      this.handleAuthFailure();
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
