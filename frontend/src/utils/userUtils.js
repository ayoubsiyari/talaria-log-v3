/**
 * User Utility Functions
 * Handles user data retrieval and management
 */

/**
 * Get user data from localStorage
 * @returns {Object|null} User data object or null if not found
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Get user email from localStorage
 * @returns {string|null} User email or null if not found
 */
export const getUserEmail = () => {
  try {
    const userData = getUserData();
    return userData?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

/**
 * Get user ID from localStorage
 * @returns {number|null} User ID or null if not found
 */
export const getUserId = () => {
  try {
    const userData = getUserData();
    return userData?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Get user name from localStorage
 * @returns {string|null} User name or null if not found
 */
export const getUserName = () => {
  try {
    const userData = getUserData();
    return userData?.username || userData?.first_name || userData?.last_name || null;
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
};

/**
 * Get user subscription status from localStorage
 * @returns {string|null} Subscription status or null if not found
 */
export const getUserSubscriptionStatus = () => {
  try {
    const userData = getUserData();
    return userData?.subscription_status || null;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export const isUserAuthenticated = () => {
  try {
    const token = localStorage.getItem('access_token');
    const userData = getUserData();
    return !!(token && userData);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Check if user has active subscription
 * @returns {boolean} True if user has active subscription
 */
export const hasActiveSubscription = () => {
  try {
    const userData = getUserData();
    return userData?.subscription_status === 'active' && userData?.is_active === true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

/**
 * Get user's full name
 * @returns {string} User's full name or username
 */
export const getUserFullName = () => {
  try {
    const userData = getUserData();
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    return userData?.username || userData?.first_name || userData?.last_name || 'User';
  } catch (error) {
    console.error('Error getting full name:', error);
    return 'User';
  }
};

/**
 * Get user's display name (for UI)
 * @returns {string} User's display name
 */
export const getUserDisplayName = () => {
  try {
    const userData = getUserData();
    return userData?.display_name || userData?.username || userData?.first_name || 'User';
  } catch (error) {
    console.error('Error getting display name:', error);
    return 'User';
  }
};

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
export const isUserAdmin = () => {
  try {
    const userData = getUserData();
    return userData?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get user's subscription plan
 * @returns {string|null} Subscription plan or null
 */
export const getUserSubscriptionPlan = () => {
  try {
    const userData = getUserData();
    return userData?.subscription_plan || null;
  } catch (error) {
    console.error('Error getting subscription plan:', error);
    return null;
  }
};

/**
 * Clear user data from localStorage
 */
export const clearUserData = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log('User data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Update user data in localStorage
 * @param {Object} updatedData - Updated user data
 */
export const updateUserData = (updatedData) => {
  try {
    const currentUserData = getUserData();
    if (currentUserData) {
      const newUserData = { ...currentUserData, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUserData));
      console.log('User data updated in localStorage');
    }
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

/**
 * Get user's avatar URL
 * @returns {string|null} Avatar URL or null
 */
export const getUserAvatar = () => {
  try {
    const userData = getUserData();
    return userData?.avatar_url || userData?.profile_picture || null;
  } catch (error) {
    console.error('Error getting user avatar:', error);
    return null;
  }
};

/**
 * Get user's role
 * @returns {string|null} User role or null
 */
export const getUserRole = () => {
  try {
    const userData = getUserData();
    return userData?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasUserPermission = (permission) => {
  try {
    const userData = getUserData();
    const permissions = userData?.permissions || [];
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

/**
 * Get user's last login date
 * @returns {string|null} Last login date or null
 */
export const getUserLastLogin = () => {
  try {
    const userData = getUserData();
    return userData?.last_login || null;
  } catch (error) {
    console.error('Error getting last login:', error);
    return null;
  }
};

/**
 * Get user's account creation date
 * @returns {string|null} Account creation date or null
 */
export const getUserCreatedAt = () => {
  try {
    const userData = getUserData();
    return userData?.created_at || null;
  } catch (error) {
    console.error('Error getting created at:', error);
    return null;
  }
};

/**
 * Get user's timezone
 * @returns {string|null} User timezone or null
 */
export const getUserTimezone = () => {
  try {
    const userData = getUserData();
    return userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting timezone:', error);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
};

/**
 * Get user's language preference
 * @returns {string} User language preference
 */
export const getUserLanguage = () => {
  try {
    const userData = getUserData();
    return userData?.language || navigator.language || 'en';
  } catch (error) {
    console.error('Error getting language:', error);
    return 'en';
  }
};

/**
 * Get user's theme preference
 * @returns {string} User theme preference
 */
export const getUserTheme = () => {
  try {
    const userData = getUserData();
    return userData?.theme || 'light';
  } catch (error) {
    console.error('Error getting theme:', error);
    return 'light';
  }
};

/**
 * Get user's notification preferences
 * @returns {Object} User notification preferences
 */
export const getUserNotificationPreferences = () => {
  try {
    const userData = getUserData();
    return userData?.notification_preferences || {
      email: true,
      push: true,
      sms: false
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      email: true,
      push: true,
      sms: false
    };
  }
};

/**
 * Get user's complete profile
 * @returns {Object} Complete user profile
 */
export const getUserProfile = () => {
  try {
    const userData = getUserData();
    if (!userData) return null;

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
      fullName: getUserFullName(),
      displayName: getUserDisplayName(),
      avatar: getUserAvatar(),
      role: getUserRole(),
      isAdmin: isUserAdmin(),
      subscriptionStatus: getUserSubscriptionStatus(),
      subscriptionPlan: getUserSubscriptionPlan(),
      hasActiveSubscription: hasActiveSubscription(),
      isAuthenticated: isUserAuthenticated(),
      lastLogin: getUserLastLogin(),
      createdAt: getUserCreatedAt(),
      timezone: getUserTimezone(),
      language: getUserLanguage(),
      theme: getUserTheme(),
      notificationPreferences: getUserNotificationPreferences()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export default {
  getUserData,
  getUserEmail,
  getUserId,
  getUserName,
  getUserSubscriptionStatus,
  isUserAuthenticated,
  hasActiveSubscription,
  getUserFullName,
  getUserDisplayName,
  isUserAdmin,
  getUserSubscriptionPlan,
  clearUserData,
  updateUserData,
  getUserAvatar,
  getUserRole,
  hasUserPermission,
  getUserLastLogin,
  getUserCreatedAt,
  getUserTimezone,
  getUserLanguage,
  getUserTheme,
  getUserNotificationPreferences,
  getUserProfile
};
