import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/config';
import { getAuthToken } from '@/utils/tokenUtils';

/**
 * Simple, reliable hook for subscription sidebar components
 * This version focuses on simplicity and reliability over complexity
 */
export const useSimpleSubscriptionSidebar = () => {
  const [sidebarComponents, setSidebarComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [planName, setPlanName] = useState(null);
  const [subscriptionLevel, setSubscriptionLevel] = useState(null);
  
  // Default components that are always available (Basic plan components)
  const defaultComponents = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      group: 'Main',
      description: 'Your personal dashboard',
      required: true
    },
    {
      id: 'journal',
      label: 'Trading Journal',
      group: 'Trading',
      description: 'Track your trades and performance',
      required: false
    },
    {
      id: 'subscription',
      label: 'My Subscription',
      group: 'Account',
      description: 'Manage your plan',
      required: true
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      group: 'Account',
      description: 'Update your profile',
      required: true
    },
    {
      id: 'help-support',
      label: 'Help & Support',
      group: 'Support',
      description: 'Get help and support',
      required: true
    }
  ];

  /**
   * Fetch user's available sidebar components from the API
   */
  const fetchSidebarComponents = useCallback(async () => {
    console.log('🔄 useSimpleSubscriptionSidebar - Fetching components...');
    
    try {
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        console.log('⚠️ No token, using default components');
        setSidebarComponents(defaultComponents);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/subscription/sidebar/user-components`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        // Extract plan information
        setPlanName(data.plan_name || 'Basic');
        setSubscriptionLevel(data.subscription_level || 'basic');
        
        if (data.components && data.components.length > 0) {
          console.log('✅ Using API components:', data.components.map(c => c.id));
          setSidebarComponents(data.components);
        } else {
          console.log('⚠️ No components from API, using defaults');
          setSidebarComponents(defaultComponents);
        }
      } else {
        console.log('⚠️ API error, using default components');
        setSidebarComponents(defaultComponents);
        setPlanName('Basic');
        setSubscriptionLevel('basic');
      }
      
      setLoading(false);
      setLastFetch(Date.now());
      
    } catch (err) {
      console.error('❌ Error fetching components:', err);
      setError(err.message);
      setSidebarComponents(defaultComponents);
      setPlanName('Basic');
      setSubscriptionLevel('basic');
      setLoading(false);
    }
  }, []);

  /**
   * Refresh components (for real-time updates)
   */
  const refreshComponents = useCallback(() => {
    console.log('🔄 Refreshing components...');
    fetchSidebarComponents();
  }, [fetchSidebarComponents]);

  // Initial fetch
  useEffect(() => {
    // Always use default components for now to fix sidebar
    console.log('🔧 Using default components to fix sidebar');
    setSidebarComponents(defaultComponents);
    setPlanName('Basic');
    setSubscriptionLevel('basic');
    setLoading(false);
    setLastFetch(Date.now());
    
    // Try to fetch from API but don't wait for it
    fetchSidebarComponents();
  }, [fetchSidebarComponents]);

  // Set up periodic refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh...');
      fetchSidebarComponents();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [fetchSidebarComponents]);

  /**
   * Get components grouped by their group property
   */
  const getGroupedComponents = useCallback(() => {
    const grouped = {};
    
    sidebarComponents.forEach(component => {
      const group = component.group || 'Other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(component);
    });

    return grouped;
  }, [sidebarComponents]);

  return {
    sidebarComponents,
    loading,
    error,
    refreshComponents,
    getGroupedComponents,
    lastFetch,
    planName,
    subscriptionLevel,
    // Helper methods
    hasComponent: (componentId) => sidebarComponents.some(comp => comp.id === componentId),
    getComponentById: (componentId) => sidebarComponents.find(comp => comp.id === componentId),
  };
};

export default useSimpleSubscriptionSidebar;
