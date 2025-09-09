import { API_BASE_URL } from '@/config/config';

class SecureApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.timeout = 30000; // 30 seconds
    this.csrfToken = null;
  }

  // Generate CSRF token
  generateCSRFToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Get CSRF token
  getCSRFToken() {
    if (!this.csrfToken) {
      this.csrfToken = this.generateCSRFToken();
    }
    return this.csrfToken;
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.getCSRFToken(),
      'X-Client-Version': '1.0.0',
      'X-Client-Timestamp': Date.now().toString()
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Create timeout promise
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  // Enhanced fetch with timeout and retry logic
  async fetchWithTimeout(url, options, timeout = this.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Retry logic with exponential backoff
  async fetchWithRetry(url, options, retries = this.retryAttempts) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        
        // Handle different HTTP status codes
        if (response.status === 401) {
          // Unauthorized - clear auth data and redirect
          this.clearAuthData();
          throw new Error('Authentication expired. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After') || 60;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (response.status >= 500) {
          // Server error - retry with exponential backoff
          if (i < retries - 1) {
            const delay = this.retryDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait before retrying
        const delay = this.retryDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Validate response data
  validateResponse(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }

  // Parse JSON response with error handling
  async parseJsonResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to parse response data');
    }
  }

  // Generic GET request
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await this.fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    this.validateResponse(response);
    return await this.parseJsonResponse(response);
  }

  // Generic POST request
  async post(endpoint, data = {}) {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    this.validateResponse(response, 201);
    return await this.parseJsonResponse(response);
  }

  // Generic PUT request
  async put(endpoint, data = {}) {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    this.validateResponse(response);
    return await this.parseJsonResponse(response);
  }

  // Generic PATCH request
  async patch(endpoint, data = {}) {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    this.validateResponse(response);
    return await this.parseJsonResponse(response);
  }

  // Generic DELETE request
  async delete(endpoint) {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    this.validateResponse(response);
    return await this.parseJsonResponse(response);
  }

  // Upload file with progress tracking
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth header
      const token = localStorage.getItem('access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.setRequestHeader('X-CSRF-Token', this.getCSRFToken());
      xhr.timeout = this.timeout;
      
      xhr.send(formData);
    });
  }

  // Health check endpoint
  async healthCheck() {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 5000); // 5 second timeout for health check

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.csrfToken = null;
  }

  // Refresh authentication token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.fetchWithRetry(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (response.ok) {
        const data = await this.parseJsonResponse(response);
        
        // Update tokens
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        return true;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Batch requests
  async batchRequests(requests) {
    const promises = requests.map(async (request) => {
      try {
        return await this[request.method](request.endpoint, request.data);
      } catch (error) {
        return { error: error.message };
      }
    });

    return Promise.all(promises);
  }

  // Get request statistics
  getRequestStats() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      csrfToken: this.csrfToken ? 'Set' : 'Not set'
    };
  }
}

// Create singleton instance
const secureApiService = new SecureApiService();

export default secureApiService;
