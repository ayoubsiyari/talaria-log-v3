import { API_BASE_URL } from '@/config/config';

class SubscriptionService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/users`;
    this.cache = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastFetch = null;
  }

  /**
   * Check if user has active subscription
   */
  async checkSubscriptionStatus(forceRefresh = false) {
    try {
      // Check cache validity
      if (!forceRefresh && this.cache && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheExpiry) {
        console.log('✅ Using cached subscription status');
        return this.cache;
      }

      console.log('🔄 Fetching fresh subscription status...');
      
      // Get user data and token
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('access_token');
      
      if (!token || !userData.id) {
        console.log('❌ No authentication token or user data found');
        return { hasActiveSubscription: false, subscription: null };
      }

      console.log('👤 Checking subscription for user:', { id: userData.id, email: userData.email });
      
      // Make API call to check subscription status
      const response = await fetch(`${this.baseURL}/me/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const subscriptionStatus = {
          hasActiveSubscription: data.subscription_status === 'active',
          subscription: data,
          status: data.subscription_status,
          plan: data.subscription_plan
        };
        
        // Cache the result
        this.cache = subscriptionStatus;
        this.lastFetch = Date.now();
        
        console.log('✅ Subscription status fetched:', subscriptionStatus);
        return subscriptionStatus;
      } else if (response.status === 404) {
        // User has no subscription
        const subscriptionStatus = {
          hasActiveSubscription: false,
          subscription: null,
          status: 'free',
          plan: null
        };
        
        this.cache = subscriptionStatus;
        this.lastFetch = Date.now();
        
        console.log('✅ No subscription found for user');
        return subscriptionStatus;
      } else {
        console.error('❌ Failed to fetch subscription status:', response.status);
        throw new Error(`Failed to fetch subscription status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      
      // Fallback: check localStorage user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const hasActiveSubscription = userData.subscription_status === 'active' || userData.is_active === true;
      
      const fallbackStatus = {
        hasActiveSubscription,
        subscription: null,
        status: userData.subscription_status || 'free',
        plan: userData.subscription_plan || null
      };
      
      console.log('⚠️ Using fallback subscription status:', fallbackStatus);
      console.log('⚠️ User data from localStorage:', userData);
      return fallbackStatus;
    }
  }

  /**
   * Check if user needs to subscribe (redirect to subscription page)
   */
  async requiresSubscription() {
    const subscriptionStatus = await this.checkSubscriptionStatus();
    return !subscriptionStatus.hasActiveSubscription;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.lastFetch = null;
  }

  /**
   * Update subscription status after payment
   */
  async updateSubscriptionStatus() {
    this.clearCache();
    return await this.checkSubscriptionStatus(true);
  }
}

// Create and export a singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;