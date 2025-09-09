/**
 * Token Utility Functions
 * Handles authentication token management
 */

/**
 * Get authentication token from localStorage
 * @returns {string|null} Auth token or null if not found
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} Refresh token or null if not found
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Set authentication token in localStorage
 * @param {string} token - Auth token to store
 */
export const setAuthToken = (token) => {
  try {
    localStorage.setItem('access_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Set refresh token in localStorage
 * @param {string} token - Refresh token to store
 */
export const setRefreshToken = (token) => {
  try {
    localStorage.setItem('refresh_token', token);
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = () => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Check if user has a valid auth token
 * @returns {boolean} True if token exists
 */
export const hasAuthToken = () => {
  try {
    const token = getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Error checking auth token:', error);
    return false;
  }
};

/**
 * Check if token is expired (basic check)
 * @param {string} token - Token to check
 * @returns {boolean} True if token appears to be expired
 */
export const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    
    // Basic JWT token expiration check
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get token payload (decoded JWT)
 * @param {string} token - Token to decode
 * @returns {Object|null} Decoded payload or null
 */
export const getTokenPayload = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Error decoding token payload:', error);
    return null;
  }
};

/**
 * Check if current token is valid and not expired
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = () => {
  try {
    const token = getAuthToken();
    if (!token) return false;
    
    return !isTokenExpired(token);
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export default {
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  clearTokens,
  hasAuthToken,
  isTokenExpired,
  getTokenPayload,
  isTokenValid
};

