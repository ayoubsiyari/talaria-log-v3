import { API_BASE_URL } from '../config/config';

class UserService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/admin/users`;
    this.token = localStorage.getItem('access_token');
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get users list with pagination and filtering
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      
      // Add filtering parameters
      if (params.status) queryParams.append('status', params.status);
      if (params.subscription_status) queryParams.append('subscription_status', params.subscription_status);
      if (params.is_verified) queryParams.append('is_verified', params.is_verified);
      if (params.is_admin) queryParams.append('is_admin', params.is_admin);
      if (params.created_after) queryParams.append('created_after', params.created_after);
      if (params.created_before) queryParams.append('created_before', params.created_before);
      if (params.last_login_after) queryParams.append('last_login_after', params.last_login_after);
      if (params.last_login_before) queryParams.append('last_login_before', params.last_login_before);
      
      // Add sorting parameters
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const response = await fetch(`${this.baseURL}?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, params = {}) {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      
      // Add additional parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/search?${searchParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Get user details
  async getUserDetails(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Reset user password
  async resetUserPassword(userId, tempPassword) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ temp_password: tempPassword })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }

  // Get user login history
  async getUserLoginHistory(userId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const response = await fetch(`${this.baseURL}/${userId}/login-history?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user login history:', error);
      throw error;
    }
  }

  // Export users data
  async exportUsers(format = 'json', params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/export?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  // Helper methods for data formatting
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getSubscriptionColor(subscription) {
    switch (subscription?.toLowerCase()) {
      case 'pro':
      case 'premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'basic':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getActivityLevelColor(level) {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Transform user data for frontend display
  transformUserData(user) {
    // Determine status based on is_active field
    let status = 'inactive';
    if (user.is_active === true) {
      status = 'active';
    } else if (user.is_active === false) {
      status = 'suspended';
    }

    // Determine role based on is_admin field
    const role = user.is_admin ? 'Admin' : 'User';

    // Get subscription info from active_subscription or subscription_status
    let subscription = 'Free';
    if (user.active_subscription) {
      subscription = user.active_subscription.plan_name || 'Free';
    } else if (user.subscription_status) {
      subscription = user.subscription_status.charAt(0).toUpperCase() + user.subscription_status.slice(1);
    }

    // Get journal count
    const journalsCount = user.journal_count || 0;

    const transformedUser = {
      id: user.id,
      name: user.full_name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name) || user.username || 'N/A',
      email: user.email,
      avatar: user.avatar || null,
      status: status,
      subscription: subscription,
      role: role,
      registrationDate: this.formatDate(user.created_at),
      lastLogin: user.last_login ? this.formatDateTime(user.last_login) : 'Never logged in',
      journalsCount: journalsCount,
      activityLevel: user.activity_level || 'low',
      isVerified: user.is_verified || false,
      isAdmin: user.is_admin || false,
      subscriptionStatus: user.subscription_status || 'inactive',
      subscriptionEndDate: this.formatDate(user.active_subscription?.end_date),
      profile: user.profile || {}
    };
    
    return transformedUser;
  }

  // Transform users list data
  transformUsersList(data) {
    if (!data) return { users: [], pagination: {} };
    
    // Handle both 'users' and 'items' response formats
    const usersArray = data.users || data.items || [];
    
    return {
      users: usersArray.map(user => this.transformUserData(user)),
      pagination: data.pagination || {},
      total: data.total || 0
    };
  }

  // Get dashboard stats from user data
  getDashboardStats(usersData) {
    if (!usersData || !usersData.users) return null;

    const users = usersData.users;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const adminUsers = users.filter(u => u.isAdmin).length;
    const proUsers = users.filter(u => u.subscription === 'Pro').length;

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
      proUsers,
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0,
      verifiedPercentage: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0
    };
  }
}

const userService = new UserService();
export default userService;

