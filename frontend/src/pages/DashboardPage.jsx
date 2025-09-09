import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RoleBasedSidebar from "../components/Layout/RoleBasedSidebar";
import DynamicUserSidebar from "../components/Layout/DynamicUserSidebar";
import Header from "../components/Layout/Header";
import Breadcrumb from "../components/Layout/Breadcrumb";
import RoleBasedDashboard from "../components/Dashboard/RoleBasedDashboard";
import ChartBasedDashboard from "../components/Dashboard/ChartBasedDashboard";
import NewEnhancedUserManagement from '../components/UserManagement/NewEnhancedUserManagement'
import AdminUserManagement from '../components/Users/AdminUserManagement'
import AdminUserManagementPage from './AdminUserManagement'
import NewSubscriptionManagement from '../components/Subscriptions/NewSubscriptionManagement'
import SubscriptionPlanManagement from './SubscriptionManagement'
import EnhancedSubscriptionManagement from '../components/Subscriptions/EnhancedSubscriptionManagement'

import TradingJournal from '../components/Pages/TradingJournal'
import Analytics from '../components/Pages/Analytics'
import Portfolio from '../components/Pages/Portfolio'

import PromotionsManagement from '../components/Promotions/PromotionsManagement'
import AnalyticsReporting from '../components/Analytics/AnalyticsReporting'
import Settings from '../components/Settings/Settings'
import NewRoleManagement from '../components/RoleManagement/NewRoleManagement'
import UserRoleAssignment from '../components/RBAC/UserRoleAssignment'
import RBACOverview from '../components/RBAC/RBACOverview'
import PermissionManagement from '../components/RBAC/PermissionManagement'
import PermissionsOverview from '../components/Permissions/PermissionsOverview'
import UserManagementPermissions from '../components/Permissions/UserManagementPermissions'
import RBACManagementPermissions from '../components/Permissions/RBACManagementPermissions'
import SystemAdminPermissions from '../components/Permissions/SystemAdminPermissions'
import ContentManagementPermissions from '../components/Permissions/ContentManagementPermissions'
import AnalyticsPermissions from '../components/Permissions/AnalyticsPermissions'
import SubscriptionManagementPermissions from '../components/Permissions/SubscriptionManagementPermissions'
import CommunicationPermissions from '../components/Permissions/CommunicationPermissions'
import SecurityPermissions from '../components/Permissions/SecurityPermissions'
import PromotionsPermissions from '../components/Permissions/PromotionsPermissions'
import DatabasePermissions from '../components/Permissions/DatabasePermissions'
import PermissionTemplates from '../components/Permissions/PermissionTemplates'
import SupportTickets from '../components/Support/SupportTickets'
import UserSupportTickets from '../components/Support/UserSupportTickets'
import AdminTicketOverview from '../components/Support/AdminTicketOverview'
import HelpSupportPage from '../components/Support/HelpSupportPage'
import SupportAgentPerformance from './SupportAgentPerformance'
import StaffLog from '../components/Support/StaffLog'
import RBACTest from '../components/Testing/RBACTest'
import AdminTest from '../components/Test/AdminTest';
import ApiTest from '../components/Test/ApiTest';
import UserCreationTest from '../components/Test/UserCreationTest';
import Affiliates from './Affiliates';
import FinancialReports from './FinancialReports';
import Invoices from './Invoices';
import Notifications from './Notifications';
import Payments from './Payments';
import ProcessPayments from './ProcessPayments';
import PaymentDisputes from './PaymentDisputes';
import Reports from './Reports';
import RevenueAnalytics from './RevenueAnalytics';
import Subscription from './Subscription';
import Subscriptions from './Subscriptions';
import MarketingSubscriptionManagement from '../components/Marketing/MarketingSubscriptionManagement';
import MarketingReports from '../components/Marketing/MarketingReports';
import SupportUserManagement from '../components/Support/SupportUserManagement';
import SupportUserManagementPage from './SupportUserManagement';
import SupportDashboard from '../components/Support/SupportDashboard';
import MyAssignedTickets from '../components/Support/MyAssignedTickets';
import Profile from './Profile';
import { usePermissions } from '../hooks/usePermissions';

function DashboardPage({ onLogout }) {
  const { hasRole, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard')
  
  // Determine user type for sidebar selection
  const getUserType = () => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    
    console.log('getUserType - storedUser:', parsedUser)
    console.log('getUserType - is_admin:', parsedUser?.is_admin)
    
    // Simple user type detection - only check is_admin field
    // Regular users have is_admin: false or undefined
    if (parsedUser?.is_admin === true) {
      console.log('getUserType - returning admin')
      return 'admin';
    }
    
    console.log('getUserType - returning regular')
    return 'regular';
  };
  
  const userType = getUserType();
  console.log('DashboardPage - User type:', userType)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [useChartDashboard, setUseChartDashboard] = useState(true)
  
  // Shared dashboard data state to persist across navigation
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
      churnRate: 0
    },
    recentActivities: [],
    subscriptionBreakdown: [],
    lastFetched: null
  })

  // 🚀 PERFORMANCE: Memoized route permission validation
  const checkRoutePermission = useCallback((route) => {
    // System Administrator - can access everything
    if (isSuperAdmin() || hasRole('system_administrator')) {
      return true;
    }
    
    // Finance Team permissions
    if (hasRole('finance_team')) {
      const financeRoutes = ['view-payment', 'create-invoices', 'generate-financial-reports', 'view-revenue-analytics', 'payments', 'invoices', 'financial-reports', 'revenue-analytics'];
      return financeRoutes.includes(route);
    }
    
    // Marketing Team permissions
    if (hasRole('marketing_team')) {
      const marketingRoutes = ['promotions', 'subscription-management', 'marketing-subscription-management', 'subscription-plan-manager', 'marketing-reports', 'affiliates'];
      return marketingRoutes.includes(route);
    }
    
    // Support Team permissions
    if (hasRole('support_team')) {
      const supportRoutes = ['support-user-management', 'support-agent-performance', 'support-dashboard', 'my-assigned-tickets', 'admin-user-management', 'send-notifications', 'support-tickets', 'my-tickets', 'ticket-overview', 'staff-log', 'help-support'];
      return supportRoutes.includes(route);
    }
    
    // Regular users - limited access
    const regularUserRoutes = ['dashboard', 'profile', 'settings', 'journal', 'portfolio', 'analytics', 'chart', 'api-access', 'priority-support', 'advanced-analytics', 'my-tickets', 'help-support'];
    return regularUserRoutes.includes(route);
  }, [isSuperAdmin, hasRole]);

  // 🛡️ SECURITY: Get default active item based on role
  const getDefaultActiveItem = useCallback(() => {
    // System Administrator - can access dashboard
    if (isSuperAdmin() || hasRole('system_administrator')) {
      return 'dashboard';
    }
    
    // Finance Team - redirect to finance section
    if (hasRole('finance_team')) {
      return 'view-payment';
    }
    
    // Marketing Team - redirect to marketing section
    if (hasRole('marketing_team')) {
      return 'promotions';
    }
    
    // Support Team - redirect to support section
    if (hasRole('support_team')) {
      return 'support-user-management';
    }
    
    // Default fallback
    return 'dashboard';
  }, [isSuperAdmin, hasRole]);

  // 🛡️ COMPREHENSIVE SECURITY & URL DETECTION
  // This implements all best practices for secure URL-based navigation
  useEffect(() => {
    // Get the current URL path
    const currentPath = location.pathname;
    console.log('🔍 URL Detection - Current path:', currentPath);
    
    // Extract the section from URL (e.g., /dashboard/users -> users)
    const pathSections = currentPath.split('/').filter(Boolean);
    const dashboardSection = pathSections[1]; // Get section after /dashboard
    
    console.log('🔍 URL Detection - Dashboard section:', dashboardSection);
    
    // 🛡️ SECURITY: Validate URL section against allowed routes
    const allowedRoutes = [
      'dashboard', 'users', 'roles', 'admin-users', 'subscriptions', 'promotions',
      'analytics', 'payments', 'invoices', 'reports', 'notifications', 'settings',
      'profile', 'rbac', 'permissions', 'support-tickets', 'affiliates', 'revenue-analytics',
      'financial-reports', 'subscription-plan-manager', 'marketing-reports', 'support-dashboard',
      'my-tickets', 'ticket-overview', 'staff-log', 'help-support', 'view-payment',
      'create-invoices', 'generate-financial-reports', 'view-revenue-analytics',
      'support-user-management', 'support-agent-performance', 'my-assigned-tickets',
      'admin-user-management', 'send-notifications', 'subscription-management',
      'marketing-subscription-management', 'journal', 'portfolio', 'chart', 'api-access',
      'priority-support', 'advanced-analytics', 'auth-diagnostic', 'test-sidebar',
      'direct-api-test', 'rbac-test', 'admin-test', 'api-test', 'user-creation-test',
      'permissions-overview', 'user-management-permissions', 'rbac-management-permissions',
      'system-admin-permissions', 'content-management-permissions', 'analytics-permissions',
      'subscription-management-permissions', 'communication-permissions', 'security-permissions',
      'promotions-permissions', 'database-permissions', 'permission-templates'
    ];
    
    // 🛡️ SECURITY: Check if URL section is allowed
    if (dashboardSection && dashboardSection !== 'dashboard') {
      if (!allowedRoutes.includes(dashboardSection)) {
        console.warn('🚨 SECURITY: Invalid route detected:', dashboardSection);
        // Redirect to dashboard for invalid routes
        navigate('/dashboard', { replace: true });
        setActiveItem('dashboard');
        return;
      }
      
      // 🛡️ SECURITY: Check permissions for the route
      const hasPermission = checkRoutePermission(dashboardSection);
      if (!hasPermission) {
        console.warn('🚨 SECURITY: Access denied for route:', dashboardSection);
        // Redirect to appropriate default based on role
        const defaultItem = getDefaultActiveItem();
        navigate(`/dashboard/${defaultItem}`, { replace: true });
        setActiveItem(defaultItem);
        return;
      }
      
      console.log('✅ SECURITY: Route validated and permission granted for:', dashboardSection);
      setActiveItem(dashboardSection);
      return;
    }
    
    // If no URL section, use your existing default logic
    console.log('🔍 URL Detection - No URL section, using default logic');
    const defaultItem = getDefaultActiveItem();
    setActiveItem(defaultItem);
  }, [hasRole, isSuperAdmin, location.pathname, navigate, checkRoutePermission, getDefaultActiveItem]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // 🛡️ ENTERPRISE SECURITY: Security Headers and CSP (Temporarily disabled for API compatibility)
  useEffect(() => {
    // Set security headers - Disabled temporarily to fix API calls
    const setSecurityHeaders = () => {
      // Only set non-CSP headers that don't interfere with API calls
      const securityHeaders = [
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-XSS-Protection', value: '1; mode=block' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ];
      
      securityHeaders.forEach(header => {
        let meta = document.querySelector(`meta[http-equiv="${header.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('http-equiv', header.name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', header.value);
      });
      
      console.log('🛡️ SECURITY: Basic security headers set (CSP disabled for API compatibility)');
    };
    
    setSecurityHeaders();
  }, []);

  // 🚀 SEO & PROFESSIONAL URL OPTIMIZATION
  useEffect(() => {
    // Update page title based on current section
    const getPageTitle = (section) => {
      const titleMap = {
        'dashboard': 'Dashboard - TALARIA Admin',
        'users': 'User Management - TALARIA Admin',
        'roles': 'Role Management - TALARIA Admin',
        'subscriptions': 'Subscription Management - TALARIA Admin',
        'analytics': 'Analytics - TALARIA Admin',
        'payments': 'Payment Management - TALARIA Admin',
        'reports': 'Reports - TALARIA Admin',
        'settings': 'Settings - TALARIA Admin',
        'profile': 'Profile - TALARIA Admin',
        'support-tickets': 'Support Tickets - TALARIA Admin',
        'promotions': 'Promotions - TALARIA Admin',
        'rbac': 'Role-Based Access Control - TALARIA Admin',
        'permissions': 'Permissions - TALARIA Admin'
      };
      return titleMap[section] || 'TALARIA Admin Dashboard';
    };

    // Update document title
    document.title = getPageTitle(activeItem);
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `TALARIA Admin Dashboard - ${activeItem.charAt(0).toUpperCase() + activeItem.slice(1)} Management`);
    }
    
    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const canonicalUrl = activeItem === 'dashboard' 
        ? `${window.location.origin}/dashboard`
        : `${window.location.origin}/dashboard/${activeItem}`;
      canonicalLink.setAttribute('href', canonicalUrl);
    }
    
    console.log('🚀 SEO: Updated page metadata for:', activeItem);
  }, [activeItem]);

  // 🚀 PERFORMANCE: Memoized user data
  const userData = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.warn('🚨 ERROR: Failed to parse user data:', error);
      return null;
    }
  }, []);

  // 🚀 PERFORMANCE: Memoized user info for sidebars
  const userInfo = useMemo(() => ({
    name: userData?.username || 'User',
    email: userData?.email || 'user@example.com',
    avatar: null
  }), [userData]);

  // 🛡️ ENTERPRISE SECURITY: CSRF Token Management
  const [csrfToken, setCsrfToken] = useState(null);
  
  useEffect(() => {
    // Generate CSRF token on component mount
    const generateCSRFToken = () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };
    
    const token = generateCSRFToken();
    setCsrfToken(token);
    // Store in sessionStorage for security
    sessionStorage.setItem('csrf_token', token);
    console.log('🛡️ CSRF: Token generated and stored');
  }, []);

  // 🛡️ ENTERPRISE SECURITY: Rate Limiting
  const [navigationAttempts, setNavigationAttempts] = useState({});
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const checkRateLimit = useCallback((itemId) => {
    const now = Date.now();
    let shouldAllow = true;
    
    // Update attempts and check rate limit in one operation
    setNavigationAttempts(prev => {
      const attempts = prev[itemId] || [];
      
      // Remove attempts older than 1 minute
      const recentAttempts = attempts.filter(time => now - time < 60000);
      
      // If more than 10 attempts in 1 minute, rate limit
      if (recentAttempts.length >= 10) {
        console.warn('🚨 RATE LIMIT: Too many navigation attempts for:', itemId);
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 60000); // Reset after 1 minute
        shouldAllow = false;
        return prev; // Don't update state, just return current state
      }
      
      // Add current attempt
      return {
        ...prev,
        [itemId]: [...recentAttempts, now]
      };
    });
    
    return shouldAllow;
  }, []); // Remove navigationAttempts from dependencies

  // 🛡️ ENTERPRISE SECURITY: Session Management
  const [lastActivity, setLastActivity] = useState(Date.now());
  const sessionTimeoutRef = useRef(null);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  // 🛡️ ENTERPRISE SECURITY: Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    console.warn('🚨 SESSION: Session timeout - logging out user');
    
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Clear any timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Redirect to login with timeout message
    window.location.href = '/login?timeout=true';
  }, []);

  // 🛡️ ENTERPRISE SECURITY: Session Validation with timeout
  const validateSession = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.warn('🚨 SESSION: Invalid session detected');
      return false;
    }
    
    // Check if session has timed out due to inactivity
    const now = Date.now();
    if (now - lastActivity > SESSION_TIMEOUT) {
      console.warn('🚨 SESSION: Session timed out due to inactivity');
      handleSessionTimeout();
      return false;
    }
    
    // Check token expiration (if you have JWT)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.exp && tokenData.exp < Date.now() / 1000) {
        console.warn('🚨 SESSION: Token expired');
        handleSessionTimeout();
        return false;
      }
    } catch (error) {
      // If not JWT, just check if token exists
      console.log('🔍 SESSION: Token validation skipped (not JWT)');
    }
    
    return true;
  }, [lastActivity, handleSessionTimeout]);

  // 🛡️ ENTERPRISE SECURITY: Update last activity
  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // 🛡️ ENTERPRISE SECURITY: Set up activity monitoring
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // Set up session timeout check
    const checkSession = () => {
      if (!validateSession()) {
        return;
      }
      
      // Schedule next check
      const timeoutId = setTimeout(checkSession, 60000); // Check every minute
      sessionTimeoutRef.current = timeoutId;
    };
    
    checkSession();
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      // Clear timeout on cleanup
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [updateLastActivity, validateSession]);

  // 🛡️ ENTERPRISE SECURITY: Advanced Input Validation
  const validateInput = useCallback((input) => {
    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i,
      /(\b(OR|AND)\s+".*"\s*=\s*".*")/i
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(input))) {
      console.warn('🚨 SECURITY: SQL injection attempt detected:', input);
      return false;
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi
    ];
    
    if (xssPatterns.some(pattern => pattern.test(input))) {
      console.warn('🚨 SECURITY: XSS attempt detected:', input);
      return false;
    }
    
    // Check for path traversal
    if (input.includes('..') || input.includes('//') || input.includes('\\')) {
      console.warn('🚨 SECURITY: Path traversal attempt detected:', input);
      return false;
    }
    
    return true;
  }, []);

  // 🛡️ ENTERPRISE SECURITY: Security Event Logging
  const logSecurityEvent = useCallback((eventType, details) => {
    const securityEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userType: userType,
      sessionId: sessionStorage.getItem('session_id') || 'unknown',
      details: details
    };
    
    // Log to console for development
    console.log('🛡️ SECURITY EVENT:', securityEvent);
    
    // In production, you would send this to your security monitoring service
    // Example: sendToSecurityService(securityEvent);
    
    // Store in localStorage for audit trail (in production, use proper logging)
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    existingLogs.push(securityEvent);
    
    // Keep only last 100 events to prevent storage bloat
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(existingLogs));
  }, [userType]);

  // 🛡️ ENTERPRISE SECURITY: Enhanced Secure Navigation
  const handleItemClick = useCallback((itemId) => {
    console.log('🔍 Navigation - handleItemClick called with itemId:', itemId)
    
    // 🛡️ ENTERPRISE SECURITY: Session validation
    if (!validateSession()) {
      logSecurityEvent('SESSION_INVALID', { itemId, reason: 'Invalid session' });
      console.warn('🚨 SECURITY: Invalid session, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    // 🛡️ ENTERPRISE SECURITY: Rate limiting check
    if (isRateLimited) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { itemId, reason: 'Rate limit exceeded' });
      console.warn('🚨 SECURITY: Rate limited, please wait');
      alert('Too many requests. Please wait a moment before trying again.');
      return;
    }
    
    if (!checkRateLimit(itemId)) {
      return;
    }
    
    // 🛡️ ENTERPRISE SECURITY: Advanced input validation
    if (!validateInput(itemId)) {
      logSecurityEvent('MALICIOUS_INPUT', { itemId, input: itemId });
      console.warn('🚨 SECURITY: Malicious input detected:', itemId);
      alert('Invalid input detected. Access denied.');
      return;
    }
    
    // 🛡️ SECURITY: Validate itemId before proceeding
    if (!itemId || typeof itemId !== 'string') {
      logSecurityEvent('INVALID_INPUT', { itemId, type: typeof itemId });
      console.warn('🚨 SECURITY: Invalid itemId provided:', itemId);
      return;
    }
    
    // 🛡️ SECURITY: Check permissions for the route
    const hasPermission = checkRoutePermission(itemId);
    if (!hasPermission) {
      logSecurityEvent('ACCESS_DENIED', { itemId, userType, reason: 'Insufficient permissions' });
      console.warn('🚨 SECURITY: Access denied for route:', itemId);
      // Show user-friendly error message
      alert(`Access denied: You don't have permission to access ${itemId}`);
      return;
    }
    
    // 🛡️ SECURITY: Sanitize itemId to prevent XSS
    const sanitizedItemId = itemId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedItemId !== itemId) {
      logSecurityEvent('XSS_ATTEMPT', { original: itemId, sanitized: sanitizedItemId });
      console.warn('🚨 SECURITY: Potentially malicious itemId detected:', itemId);
      return;
    }
    
    // Update state
    setActiveItem(sanitizedItemId);
    setMobileMenuOpen(false); // Close mobile menu when item is selected
    
    // 🛡️ SECURE URL UPDATE with error handling
    try {
      // Update URL to reflect the selected item
      const newUrl = sanitizedItemId === 'dashboard' ? '/dashboard' : `/dashboard/${sanitizedItemId}`;
      navigate(newUrl, { replace: true });
      console.log('✅ SECURITY: Navigation successful to:', newUrl);
      
      // 🛡️ SECURITY: Log successful navigation
      logSecurityEvent('NAVIGATION_SUCCESS', {
        route: sanitizedItemId,
        url: newUrl,
        csrfToken: csrfToken ? 'present' : 'missing',
        sessionValid: validateSession()
      });
      
    } catch (error) {
      logSecurityEvent('NAVIGATION_ERROR', { error: error.message, itemId: sanitizedItemId });
      console.error('🚨 SECURITY: Navigation failed:', error);
      // Fallback: still update the state even if URL update fails
      console.warn('⚠️ FALLBACK: Using state-only navigation');
    }
  }, [checkRoutePermission, navigate, userType, validateSession, isRateLimited, checkRateLimit, validateInput, csrfToken, logSecurityEvent]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

          const handleApplyTemplate = async (template) => {
          try {
            console.log('Applying template:', template)
            // The template application is now handled by the PermissionTemplates component
            // which calls the backend API directly
            alert(`Template "${template.name}" applied successfully with ${template.permissions_count} permissions to ${template.roles_applied?.length || 0} roles.`)
          } catch (error) {
            console.error('Failed to apply template:', error)
            alert('Failed to apply template. Please try again.')
          }
        }

  // 🛡️ SECURE CONTENT RENDERING with error boundaries
  const renderContent = () => {
    console.log('🔍 Content - renderContent called with activeItem:', activeItem)
    console.log('🔍 Content - useChartDashboard:', useChartDashboard)
    
    // 🛡️ SECURITY: Final permission check before rendering
    if (!checkRoutePermission(activeItem)) {
      console.warn('🚨 SECURITY: Access denied during render for:', activeItem);
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h2>
            <p className="text-red-600 mb-4">You don't have permission to access this section.</p>
            <button 
              onClick={() => handleItemClick('dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    
    // 🛡️ ERROR BOUNDARY: Try-catch wrapper for content rendering
    try {
      return renderContentSafely();
    } catch (error) {
      console.error('🚨 ERROR: Content rendering failed:', error);
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">Loading Error</h2>
            <p className="text-yellow-600 mb-4">There was an error loading this section. Please try again.</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Reload Page
              </button>
              <button 
                onClick={() => handleItemClick('dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // 🛡️ SAFE CONTENT RENDERING
  const renderContentSafely = () => {
    switch (activeItem) {
      case 'dashboard':
        console.log('DashboardPage - Rendering dashboard component')
        console.log('DashboardPage - User type:', userType)
        
        // For regular users, show a simple dashboard
        if (userType === 'regular') {
          return (
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-6">Welcome to TALARIA</h1>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
                  <p className="text-gray-600">Your personal dashboard overview</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-2">Trading Journal</h2>
                  <p className="text-gray-600">Track your trades and performance</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-2">My Subscription</h2>
                  <p className="text-gray-600">Manage your subscription plan</p>
                </div>
              </div>
            </div>
          )
        }
        
        // For admin users, show the full dashboard
        try {
          return useChartDashboard ? (
            <ChartBasedDashboard 
              onNavigate={handleItemClick}
            />
          ) : (
            <RoleBasedDashboard 
              onNavigate={handleItemClick}
            />
          )
        } catch (error) {
          console.error('DashboardPage - Error rendering dashboard:', error)
          return (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
              <p className="text-red-600">Error loading dashboard: {error.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          )
        }
      case 'users':
        return <NewEnhancedUserManagement onNavigate={handleItemClick} />
      case 'roles':
        return <NewRoleManagement onNavigate={handleItemClick} />
      case 'admin-users':
        return <AdminUserManagement onNavigate={handleItemClick} />
      case 'subscription-plan-manager':
        return <SubscriptionPlanManagement />
      case 'auth-diagnostic':
        return <AuthDiagnostic />
  case 'test-sidebar':
    return <TestSidebar />
  case 'direct-api-test':
    return <DirectApiTest />
      case 'subscriptions':
        return <EnhancedSubscriptionManagement />
      case 'promotions':
        return <PromotionsManagement onNavigate={handleItemClick} />
      case 'affiliates':
        return <Affiliates />;
      case 'reports':
        return <Reports />;
      case 'subscription':
        return <Subscription />;
      case 'payments':
        return <Payments />;
      case 'process-payments':
        return <ProcessPayments />;
      case 'invoices':
        return <Invoices />;
      case 'payment-disputes':
        return <PaymentDisputes />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'revenue-analytics':
        return <RevenueAnalytics />;
      case 'view-subscriptions':
        return <Subscriptions />;
      case 'notifications':
        return <Notifications />;
      case 'help-support':
        return <HelpSupportPage onNavigate={handleItemClick} />
      case 'analytics':
        return <AnalyticsReporting onNavigate={handleItemClick} />
      case 'rbac':
        return <RBACOverview onNavigate={handleItemClick} />
      case 'role-assignments':
        return <UserRoleAssignment onNavigate={handleItemClick} />
      case 'permissions':
        return <PermissionManagement onNavigate={handleItemClick} />
      case 'permissions-overview':
        return <PermissionsOverview onNavigate={handleItemClick} />
      case 'user-management-permissions':
        return <UserManagementPermissions onNavigate={handleItemClick} />
      case 'rbac-management-permissions':
        return <RBACManagementPermissions onNavigate={handleItemClick} />
      case 'system-admin-permissions':
        return <SystemAdminPermissions onNavigate={handleItemClick} />
      case 'content-management-permissions':
        return <ContentManagementPermissions onNavigate={handleItemClick} />
      case 'analytics-permissions':
        return <AnalyticsPermissions onNavigate={handleItemClick} />
      case 'subscription-management-permissions':
        return <SubscriptionManagementPermissions onNavigate={handleItemClick} />
      case 'communication-permissions':
        return <CommunicationPermissions onNavigate={handleItemClick} />
      case 'security-permissions':
        return <SecurityPermissions onNavigate={handleItemClick} />
      case 'promotions-permissions':
        return <PromotionsPermissions onNavigate={handleItemClick} />
      case 'database-permissions':
        return <DatabasePermissions onNavigate={handleItemClick} />
      case 'permission-templates':
        return <PermissionTemplates onApplyTemplate={handleApplyTemplate} />
      case 'support-tickets':
        return <SupportTickets onNavigate={handleItemClick} />
      case 'my-tickets':
        return <UserSupportTickets onNavigate={handleItemClick} />
      case 'ticket-overview':
        return <AdminTicketOverview onNavigate={handleItemClick} />
      case 'staff-log':
        return <StaffLog />
      case 'profile':
        console.log('DashboardPage - Rendering Profile component for profile case')
        return <Profile />
      case 'settings':
        return <Settings onNavigate={handleItemClick} />
      case 'rbac-test':
        return <RBACTest />
      case 'admin-test':
        return <AdminTest />
      case 'api-test':
        return <ApiTest />;
      case 'user-creation-test':
        return <UserCreationTest />;
      // Finance Section Cases
      case 'view-payment':
        return <Payments />
      case 'create-invoices':
        return <Invoices />
      case 'generate-financial-reports':
        return <FinancialReports />
      case 'view-revenue-analytics':
        return <RevenueAnalytics />
      case 'detailed-analytics':
        return <AnalyticsReporting onNavigate={handleItemClick} />
      // Support Section Cases
      case 'support-user-management':
        return <SupportUserManagementPage />
      case 'support-agent-performance':
        return <SupportAgentPerformance />
      case 'support-dashboard':
        return <SupportDashboard />
      case 'my-assigned-tickets':
        return <MyAssignedTickets />
      case 'admin-user-management':
        return <AdminUserManagementPage />
      case 'send-notifications':
        return <Notifications />
      // Marketing Section Cases
      case 'subscription-management':
        return <EnhancedSubscriptionManagement />
      case 'marketing-subscription-management':
        return <MarketingSubscriptionManagement onNavigate={handleItemClick} />
      case 'subscription-plan-manager':
        return <SubscriptionPlanManagement />
      case 'marketing-reports':
        return <MarketingReports onNavigate={handleItemClick} />
      // Additional Cases for Other Items
      case 'journal':
        return <TradingJournal />
      case 'portfolio':
        return <Portfolio />
      case 'chart':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Chart Trading</h2><p className="text-muted-foreground">Advanced charting tools coming soon...</p></div>
      case 'api-access':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">API Access</h2><p className="text-muted-foreground">API access management coming soon...</p></div>
      case 'priority-support':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Priority Support</h2><p className="text-muted-foreground">Priority customer support coming soon...</p></div>
      case 'advanced-analytics':
        return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2><p className="text-muted-foreground">Advanced trading analytics coming soon...</p></div>
      default:
        // If the active item is not found, redirect to appropriate default based on role
        if (hasRole('finance_team')) {
          return <Payments />;
        } else if (hasRole('marketing_team')) {
          return <PromotionsManagement onNavigate={handleItemClick} />;
        } else if (hasRole('support_team')) {
          return <SupportUserManagement onNavigate={handleItemClick} />;
        } else if (isSuperAdmin() || hasRole('system_administrator')) {
          return (
            <RoleBasedDashboard 
              onNavigate={handleItemClick}
            />
          );
        } else {
          return <div className="p-6"><h2 className="text-2xl font-bold mb-4">Access Denied</h2><p className="text-muted-foreground">You don't have permission to access this section.</p></div>;
        }
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {userType === 'regular' ? (
          (() => {
            console.log('🚀 RENDERING DYNAMIC SIDEBAR FOR REGULAR USER');
            return <DynamicUserSidebar
            activeItem={activeItem}
            onItemClick={handleItemClick}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onLogout={onLogout}
            theme={darkMode ? 'dark' : 'light'}
            onThemeToggle={toggleDarkMode}
            user={userInfo}
          />
          })()
        ) : (
          (() => {
            console.log('⚠️ RENDERING ROLE-BASED SIDEBAR FOR ADMIN USER');
            return <RoleBasedSidebar
            activeItem={activeItem}
            onItemClick={handleItemClick}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onLogout={onLogout}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            onNavigate={handleItemClick}
            user={userInfo}
          />
          })()
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 animate-fade-in" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            {userType === 'regular' ? (
              (() => {
                console.log('🚀 RENDERING DYNAMIC SIDEBAR FOR REGULAR USER (MOBILE)');
                return <DynamicUserSidebar
                activeItem={activeItem}
                onItemClick={handleItemClick}
                collapsed={false}
                onToggleCollapse={() => setMobileMenuOpen(false)}
                onLogout={onLogout}
                theme={darkMode ? 'dark' : 'light'}
                onThemeToggle={toggleDarkMode}
                user={{
                  name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'User',
                  email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'user@example.com',
                  avatar: null
                }}
              />
              })()
            ) : (
              (() => {
                console.log('⚠️ RENDERING ROLE-BASED SIDEBAR FOR ADMIN USER (MOBILE)');
                return <RoleBasedSidebar
                activeItem={activeItem}
                onItemClick={handleItemClick}
                collapsed={false}
                onToggleCollapse={() => setMobileMenuOpen(false)}
                onLogout={onLogout}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
                onNavigate={handleItemClick}
                user={{
                  name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'User',
                  email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'user@example.com',
                  avatar: null
                }}
              />
              })()
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Header 
          onToggleSidebar={toggleMobileMenu}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onLogout={onLogout}
          useChartDashboard={useChartDashboard}
          onToggleDashboardType={() => setUseChartDashboard(!useChartDashboard)}
        />
        
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          <Breadcrumb activeItem={activeItem} onItemClick={handleItemClick} />
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
