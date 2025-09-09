/**
 * Protected Content Service
 * Handles secure access to subscription-protected content
 */

import api from '../config/api';

class ProtectedContentService {
  constructor() {
    this.baseURL = '/api/protected';
  }

  /**
   * Get analytics data (requires Professional/Enterprise plan)
   */
  async getAnalyticsData() {
    try {
      const response = await api.get(`${this.baseURL}/analytics`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Analytics requires Professional or Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Professional'
        };
      }
      throw error;
    }
  }

  /**
   * Get chart data (requires Professional/Enterprise plan)
   */
  async getChartData() {
    try {
      const response = await api.get(`${this.baseURL}/chart`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Charts require Professional or Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Professional'
        };
      }
      throw error;
    }
  }

  /**
   * Get portfolio data (requires Professional/Enterprise plan)
   */
  async getPortfolioData() {
    try {
      const response = await api.get(`${this.baseURL}/portfolio`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Portfolio requires Professional or Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Professional'
        };
      }
      throw error;
    }
  }

  /**
   * Get advanced analytics data (requires Enterprise plan)
   */
  async getAdvancedAnalyticsData() {
    try {
      const response = await api.get(`${this.baseURL}/advanced-analytics`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Advanced Analytics requires Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Enterprise'
        };
      }
      throw error;
    }
  }

  /**
   * Get API access information (requires Enterprise plan)
   */
  async getApiAccessInfo() {
    try {
      const response = await api.get(`${this.baseURL}/api-access`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'API Access requires Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Enterprise'
        };
      }
      throw error;
    }
  }

  /**
   * Get priority support information (requires Enterprise plan)
   */
  async getPrioritySupportInfo() {
    try {
      const response = await api.get(`${this.baseURL}/priority-support`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Priority Support requires Enterprise subscription',
          subscription_required: true,
          upgrade_required: true,
          current_plan: error.response.data?.current_plan,
          required_plan: 'Enterprise'
        };
      }
      throw error;
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus() {
    try {
      const response = await api.get(`${this.baseURL}/subscription-status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has access to a specific component
   */
  async checkComponentAccess(componentId) {
    try {
      const response = await api.get(`${this.baseURL}/subscription-status`);
      const data = response.data;
      
      if (!data.has_subscription || !data.is_active) {
        return {
          hasAccess: false,
          reason: 'No active subscription',
          subscription_required: true
        };
      }

      const hasAccess = data.components.includes(componentId);
      
      return {
        hasAccess,
        reason: hasAccess ? 'Access granted' : 'Component not included in current plan',
        subscription_required: !hasAccess,
        current_plan: data.plan_name,
        components: data.components
      };
    } catch (error) {
      return {
        hasAccess: false,
        reason: 'Error checking access',
        subscription_required: true
      };
    }
  }
}

export default new ProtectedContentService();
