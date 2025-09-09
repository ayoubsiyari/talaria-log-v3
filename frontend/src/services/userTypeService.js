/**
 * User Type Detection Service
 * Handles proper distinction between Admin Users and Regular Users
 */

class UserTypeService {
  constructor() {
    this.userType = null;
    this.userData = null;
  }

  /**
   * Determine user type based on authentication data
   * @param {Object} userData - User data from authentication
   * @returns {Object} User type information
   */
  determineUserType(userData) {
    if (!userData) {
      return { type: 'unknown', isAdmin: false, isRegular: false };
    }

    // Store user data for reference
    this.userData = userData;

    // Check for explicit account_type field (most reliable)
    if (userData.account_type === 'admin') {
      this.userType = 'admin';
      return { type: 'admin', isAdmin: true, isRegular: false };
    }

    if (userData.account_type === 'regular' || userData.account_type === 'user') {
      this.userType = 'regular';
      return { type: 'regular', isAdmin: false, isRegular: true };
    }

    // Check for admin indicators
    const adminIndicators = [
      userData.is_admin === true,
      userData.is_admin === 'true',
      userData.is_admin === 1,
      userData.is_super_admin === true,
      userData.user_type === 'admin',
      // Check nested user object
      userData.user?.is_admin === true,
      userData.user?.account_type === 'admin'
    ];

    if (adminIndicators.some(indicator => indicator === true)) {
      this.userType = 'admin';
      return { type: 'admin', isAdmin: true, isRegular: false };
    }

    // Check if user has admin-specific fields (AdminUser model fields)
    const hasAdminFields = userData.is_super_admin !== undefined || 
                          userData.failed_login_attempts !== undefined ||
                          userData.locked_until !== undefined;

    if (hasAdminFields) {
      this.userType = 'admin';
      return { type: 'admin', isAdmin: true, isRegular: false };
    }

    // Check if user has regular user fields (User model fields)
    const hasRegularUserFields = userData.subscription_status !== undefined ||
                                userData.is_verified !== undefined;

    if (hasRegularUserFields) {
      this.userType = 'regular';
      return { type: 'regular', isAdmin: false, isRegular: true };
    }

    // Default to regular user if no clear indicators
    this.userType = 'regular';
    return { type: 'regular', isAdmin: false, isRegular: true };
  }

  /**
   * Get current user type
   */
  getCurrentUserType() {
    return this.userType;
  }

  /**
   * Check if current user is admin
   */
  isAdmin() {
    return this.userType === 'admin';
  }

  /**
   * Check if current user is regular user
   */
  isRegular() {
    return this.userType === 'regular';
  }

  /**
   * Get user ID based on user type
   */
  getUserId() {
    if (!this.userData) return null;

    // Try direct id first
    if (this.userData.id) {
      return String(this.userData.id);
    }

    // Try nested user object
    if (this.userData.user?.id) {
      return String(this.userData.user.id);
    }

    return null;
  }

  /**
   * Get user email
   */
  getUserEmail() {
    if (!this.userData) return null;

    if (this.userData.email) {
      return this.userData.email.toLowerCase();
    }

    if (this.userData.user?.email) {
      return this.userData.user.email.toLowerCase();
    }

    return null;
  }

  /**
   * Get display name for user
   */
  getDisplayName() {
    if (!this.userData) return 'User';

    // Try various name fields
    const nameFields = [
      this.userData.display_name,
      this.userData.full_name,
      this.userData.name,
      this.userData.username,
      this.userData.user?.display_name,
      this.userData.user?.full_name,
      this.userData.user?.name,
      this.userData.user?.username
    ];

    for (const field of nameFields) {
      if (field && typeof field === 'string' && field.trim()) {
        return field.trim();
      }
    }

    // Construct from first/last name
    const firstName = this.userData.first_name || this.userData.user?.first_name;
    const lastName = this.userData.last_name || this.userData.user?.last_name;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) return firstName;
    if (lastName) return lastName;

    return 'User';
  }

  /**
   * Clear stored user type data
   */
  clear() {
    this.userType = null;
    this.userData = null;
  }

  /**
   * Get appropriate dashboard route for user type
   */
  getDashboardRoute() {
    return this.isAdmin() ? '/dashboard' : '/user-dashboard';
  }

  /**
   * Check if user should have access to admin features
   */
  hasAdminAccess() {
    return this.isAdmin();
  }

  /**
   * Get user context for API calls
   */
  getUserContext() {
    return {
      id: this.getUserId(),
      email: this.getUserEmail(),
      type: this.getCurrentUserType(),
      isAdmin: this.isAdmin(),
      isRegular: this.isRegular()
    };
  }
}

export default new UserTypeService();
