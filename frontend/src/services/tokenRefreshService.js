/**
 * Token Refresh Service
 * Handles automatic token refresh when access token expires
 */

import { getAuthToken, getRefreshToken, setAuthToken, clearTokens } from '../utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TokenRefreshService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.setupAxiosInterceptors();
  }

  /**
   * Setup axios interceptors for automatic token refresh
   */
  setupAxiosInterceptors() {
    // Request interceptor to add token
    if (window.axios) {
      window.axios.interceptors.request.use(
        (config) => {
          const token = getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor to handle token refresh
      window.axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            if (this.isRefreshing) {
              // If already refreshing, queue the request
              return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return window.axios(originalRequest);
              }).catch(err => {
                return Promise.reject(err);
              });
            }

            originalRequest._retry = true;
            this.isRefreshing = true;

            try {
              const newToken = await this.refreshAccessToken();
              this.processQueue(null, newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return window.axios(originalRequest);
            } catch (refreshError) {
              this.processQueue(refreshError, null);
              this.handleRefreshFailure();
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }

          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      // Update stored token
      setAuthToken(newAccessToken);

      console.log('✅ Token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Process queued requests after token refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Handle refresh failure - redirect to login
   */
  handleRefreshFailure() {
    console.log('🔄 Refresh token expired, redirecting to login');
    clearTokens();
    
    // Dispatch custom event for components to handle
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'token_expired' }
    }));
  }

  /**
   * Manual token refresh (for components that need it)
   */
  async refreshToken() {
    try {
      const newToken = await this.refreshAccessToken();
      return newToken;
    } catch (error) {
      this.handleRefreshFailure();
      throw error;
    }
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   */
  shouldRefreshToken() {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if token expires within 5 minutes
      return timeUntilExpiry < 300;
    } catch (error) {
      return true; // If we can't parse, assume it needs refresh
    }
  }

  /**
   * Proactive token refresh (call this periodically)
   */
  async proactiveRefresh() {
    if (this.shouldRefreshToken() && !this.isRefreshing) {
      try {
        await this.refreshToken();
        console.log('🔄 Proactive token refresh completed');
      } catch (error) {
        console.error('❌ Proactive token refresh failed:', error);
      }
    }
  }
}

// Create singleton instance
const tokenRefreshService = new TokenRefreshService();

// Start proactive refresh every 30 minutes
setInterval(() => {
  tokenRefreshService.proactiveRefresh();
}, 30 * 60 * 1000); // 30 minutes

export default tokenRefreshService;
