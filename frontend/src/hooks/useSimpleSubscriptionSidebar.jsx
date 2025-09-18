import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/config';
import { getAuthToken, hasAuthToken } from '@/utils/tokenUtils';

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
  const [isFetching, setIsFetching] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const isFetchingRef = useRef(false);
  
  // Track token availability
  useEffect(() => {
    const checkToken = () => {
      const tokenExists = hasAuthToken();
      setHasToken(tokenExists);
      if (import.meta.env.MODE === 'development') {
        console.log('🔍 Token availability changed:', tokenExists);
      }
    };
    
    // Check initial token state
    checkToken();
    
    // Listen for token changes in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        checkToken();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Debug sidebar components changes (development only)
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔍 Sidebar components count:', sidebarComponents.length);
      console.log('🔍 Loading state:', loading);
      console.log('🔍 Error state:', error);
      console.log('🔍 Has token:', hasToken);
    }
  }, [sidebarComponents, loading, error, hasToken]);
  
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
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Fetching sidebar components...');
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      if (import.meta.env.MODE === 'development') {
        console.log('⚠️ Already fetching, skipping...');
      }
      return;
    }
    
    isFetchingRef.current = true;
    setIsFetching(true);
    
    try {
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        if (import.meta.env.MODE === 'development') {
          console.log('⚠️ No token, using default components');
        }
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
        
        if (import.meta.env.MODE === 'development') {
          console.log('✅ API components count:', data.components?.length || 0);
        }
        
        // Extract plan information
        setPlanName(data.plan_name || 'Basic');
        setSubscriptionLevel(data.subscription_level || 'basic');
        
        if (data.components && data.components.length > 0) {
          setSidebarComponents(data.components);
        } else {
          if (import.meta.env.MODE === 'development') {
            console.log('⚠️ No components from API, using defaults');
          }
          setSidebarComponents(defaultComponents);
        }
      } else {
        if (import.meta.env.MODE === 'development') {
          console.log('⚠️ API error, using default components');
        }
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
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  }, []);

  /**
   * Refresh components (for real-time updates)
   */
  const refreshComponents = useCallback(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Manual refresh triggered...');
    }
    fetchSidebarComponents();
  }, [fetchSidebarComponents]);
  
  /**
   * Force refresh components (for immediate updates)
   */
  const forceRefreshComponents = useCallback(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Force refresh triggered...');
    }
    setLoading(true);
    fetchSidebarComponents();
  }, [fetchSidebarComponents]);

  /**
   * Manual refresh function (can be called from parent components)
   */
  const manualRefresh = useCallback(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Manual refresh called from parent component...');
    }
    forceRefreshComponents();
  }, [forceRefreshComponents]);

  // Initial fetch - only when token is available
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Starting sidebar component fetch...', 'hasToken:', hasToken);
    }
    
    // Only fetch if we have a token, otherwise use default components
    if (hasToken) {
      fetchSidebarComponents();
    } else {
      // No token available, use default components immediately
      if (import.meta.env.MODE === 'development') {
        console.log('⚠️ No token available, using default components');
      }
      setSidebarComponents(defaultComponents);
      setLoading(false);
    }
  }, [hasToken, fetchSidebarComponents]);


  // Listen for token changes and refresh components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        if (import.meta.env.MODE === 'development') {
          console.log('🔄 Token updated, refreshing sidebar components...');
        }
        // Token state change will trigger the main fetch effect above
        // No need for setTimeout or direct fetch call here
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Removed experimental force-refresh and focus/hashchange handlers — initial fetch is sufficient; VCS retains history

  // DISABLED: Real-time updates to prevent sidebar resets
  // Set up periodic refresh only
  useEffect(() => {
    let updateInterval;
    
    if (import.meta.env.MODE === 'development') {
      console.log('🔄 Real-time updates completely disabled to prevent sidebar resets');
    }
    
    // Less frequent refresh to prevent sidebar resets (every 2 minutes)
    updateInterval = setInterval(() => {
      if (import.meta.env.MODE === 'development') {
        console.log('🔄 Periodic refresh to check for subscription changes...');
      }
      fetchSidebarComponents();
    }, 120000); // 2 minutes
    
    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
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
    forceRefreshComponents,
    manualRefresh,
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
