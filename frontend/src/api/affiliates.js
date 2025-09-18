/**
 * API service for affiliate operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Create headers with authentication
 */
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Handle API response errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${response.status}`);
  }
  return response.json();
};

/**
 * Fetch all affiliates with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.q - Search query
 * @param {string} params.status - Status filter (all, active, pending, suspended)
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 * @returns {Promise<Object>} Response with affiliates data and pagination info
 */
export const listAffiliates = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value);
    }
  });

  const url = `${API_BASE_URL}/admin/affiliates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get a specific affiliate by ID
 * @param {number} id - Affiliate ID
 * @returns {Promise<Object>} Affiliate data
 */
export const getAffiliate = async (id) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/${id}`, {
    method: 'GET',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Create a new affiliate
 * @param {Object} affiliateData - Affiliate data
 * @returns {Promise<Object>} Created affiliate data
 */
export const createAffiliate = async (affiliateData) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(affiliateData),
  });
  
  return handleResponse(response);
};

/**
 * Update an existing affiliate
 * @param {number} id - Affiliate ID
 * @param {Object} affiliateData - Updated affiliate data
 * @returns {Promise<Object>} Updated affiliate data
 */
export const updateAffiliate = async (id, affiliateData) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/${id}`, {
    method: 'PUT',
    headers: createHeaders(),
    body: JSON.stringify(affiliateData),
  });
  
  return handleResponse(response);
};

/**
 * Delete an affiliate
 * @param {number} id - Affiliate ID
 * @returns {Promise<Object>} Success response
 */
export const deleteAffiliate = async (id) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/${id}`, {
    method: 'DELETE',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Approve a pending affiliate
 * @param {number} id - Affiliate ID
 * @returns {Promise<Object>} Updated affiliate data
 */
export const approveAffiliate = async (id) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/${id}/approve`, {
    method: 'POST',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Suspend an active affiliate
 * @param {number} id - Affiliate ID
 * @returns {Promise<Object>} Updated affiliate data
 */
export const suspendAffiliate = async (id) => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/${id}/suspend`, {
    method: 'POST',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get affiliate analytics data
 * @param {string} range - Time range (7d, 30d, 90d, 1y)
 * @returns {Promise<Object>} Analytics data
 */
export const getAffiliateAnalytics = async (range = '30d') => {
  const response = await fetch(`${API_BASE_URL}/admin/affiliates/analytics?range=${range}`, {
    method: 'GET',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

/**
 * Get referrals for a specific affiliate
 * @param {number} id - Affiliate ID
 * @param {Object} params - Query parameters
 * @param {string} params.status - Status filter (all, referred, registered, converted)
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 * @returns {Promise<Object>} Referrals data with pagination info
 */
export const getAffiliateReferrals = async (id, params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value);
    }
  });

  const url = `${API_BASE_URL}/admin/affiliates/${id}/referrals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(),
  });
  
  return handleResponse(response);
};

// Export all functions as default for convenience
export default {
  listAffiliates,
  getAffiliate,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  approveAffiliate,
  suspendAffiliate,
  getAffiliateAnalytics,
  getAffiliateReferrals,
};
