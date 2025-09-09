import { useState, useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  Tag, 
  UserCheck, 
  BarChart3, 
  Settings, 
  Home,
  ChevronLeft,
  Bug,
  ChevronRight,
  Menu,
  TrendingUp,
  Activity,
  Shield,
  FileText,
  MessageSquare,
  HelpCircle,
  Database,
  Target,
  DollarSign,
  Calendar,
  Plus,
  TestTube,
  Bell,
  Search,
  LogOut,
  Zap,
  Star,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Moon,
  Sun,
  Command,
  User,
  Key,
  Eye,
  ClipboardList,
  UserPlus,
  AlertCircle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useSimpleSubscriptionSidebar } from '@/hooks/useSimpleSubscriptionSidebar'
// Remove usePermissions dependency - we'll implement role checking directly
import { useAuth } from '../../hooks/useAuth'
import './RoleBasedSidebar.css'

const RoleBasedSidebar = ({ 
  activeItem, 
  onItemClick, 
  collapsed, 
  onToggleCollapse,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onNavigate
}) => {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const allItems = finalNavigationItems.flatMap(group => 
      group.items.map(item => ({ ...item, group: group.group }))
    );
    
    const results = allItems.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };
  
  // Get user data and roles directly from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const userData = getUserData();
  const roles = userData?.roles || [];
  const permissions = roles.flatMap(role => role.permissions || []);
  const loading = false; // No loading state needed

  // Implement role checking functions directly
  const hasRole = (roleName) => {
    if (!userData || !roles) return false;
    return roles.some(role => role.name === roleName);
  };

  const hasAnyRole = (roleNames) => {
    if (!userData || !roles) return false;
    return roleNames.some(roleName => hasRole(roleName));
  };

  const hasPermission = (permission) => {
    if (!userData) return false;
    if (userData.is_super_admin || userData.account_type === 'admin') return true;
    return permissions.includes(permission);
  };

  // Get subscription-based sidebar components (always call the hook)
  const { 
    sidebarComponents, 
    loading: subscriptionLoading, 
    error: subscriptionError,
    getGroupedComponents 
  } = useSimpleSubscriptionSidebar();

  // Determine user type
  const getUserType = () => {
    if (!user) {
      console.log('🔍 No user object, returning guest');
      return 'guest';
    }
    
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    
    console.log('🔍 User type detection:', {
      user: user,
      parsedUser: parsedUser,
      is_admin: user?.is_admin || parsedUser?.is_admin,
      hasSystemAdminRole: hasRole('system_administrator'),
      hasSuperAdminRole: hasRole('super_admin'),
      hasMarketingRole: hasRole('marketing_team'),
      hasFinanceRole: hasRole('finance_team'),
      hasSupportRole: hasRole('support_team')
    });
    
    // Check for admin roles - only check is_admin field
    if (user?.is_admin === true || parsedUser?.is_admin === true) {
      console.log('🔍 Detected as ADMIN user');
      return 'admin';
    }
    
    // Check for admin roles via hasRole (but log what we find)
    const hasSystemAdminRole = hasRole('system_administrator');
    const hasSuperAdminRole = hasRole('super_admin');
    
    if (hasSystemAdminRole || hasSuperAdminRole) {
      console.log('🔍 Detected as ADMIN user via roles:', { hasSystemAdminRole, hasSuperAdminRole });
      return 'admin';
    }
    
    // Check for team roles
    if (hasRole('marketing_team') || hasRole('finance_team') || hasRole('support_team')) {
      console.log('🔍 Detected as TEAM user');
      return 'team';
    }
    
    console.log('🔍 Detected as REGULAR user');
    return 'regular';
  };

  const userType = getUserType();

  console.log('🔍 RoleBasedSidebar subscription state:', { 
    subscriptionLoading, 
    subscriptionError, 
    componentsCount: sidebarComponents.length,
    components: sidebarComponents
  });

  // Check if user has any admin role
  const hasAdminRole = () => {
    const adminRoles = ['super_admin', 'admin', 'user_manager', 'content_manager', 'analyst'];
    return hasAnyRole(adminRoles) || user?.account_type === 'admin' || user?.is_super_admin || user?.is_admin;
  };

  // Check if user is super admin (has all permissions)
  const isSuperAdmin = () => {
    // First check if user has specific team roles - if they do, they're NOT a super admin
    if (hasRole('marketing_team') || hasRole('finance_team') || hasRole('support_team')) {
      return false;
    }
    
    // Then check for system administrator role
    if (hasRole('system_administrator')) {
      return true;
    }
    
    // Finally check legacy flags
    return user?.is_super_admin || user?.is_admin || hasRole('super_admin') || user?.account_type === 'admin';
  };

  console.log('🔍 RoleBasedSidebar - User type detected:', userType)
  console.log('🔍 RoleBasedSidebar - User data:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : 'No user data')
  console.log('🔍 RoleBasedSidebar - User object:', user)
  console.log('🔍 RoleBasedSidebar - Roles:', roles)
  console.log('🔍 RoleBasedSidebar - Has admin role:', hasAdminRole())
  console.log('🔍 RoleBasedSidebar - Is super admin:', isSuperAdmin())
  console.log('🔍 RoleBasedSidebar - Account type:', user?.account_type)
  console.log('🔍 RoleBasedSidebar - Is admin:', user?.is_admin)
  console.log('🔍 RoleBasedSidebar - Is super admin flag:', user?.is_super_admin)

  // Comprehensive role-based filtering function for all roles
  // Helper function to get default regular user navigation (fallback)
  const getDefaultRegularUserNavigation = () => {
    return [
      {
        group: "Main",
        items: [
          { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: Home, 
            path: '/', 
            description: 'Your personal dashboard',
            badge: null,
            shortcut: 'D'
          }
        ]
      },
      {
        group: "Account",
        items: [
          { 
            id: 'subscription', 
            label: 'My Subscription', 
            icon: CreditCard, 
            path: '/subscription', 
            description: 'Manage your plan',
            badge: null,
            shortcut: 'S'
          },
          { 
            id: 'profile', 
            label: 'Profile Settings', 
            icon: User, 
            path: '/profile', 
            description: 'Update your profile',
            badge: null,
            shortcut: 'U'
          }
        ]
      }
    ];
  };

  // Convert subscription components to navigation items format
  const getSubscriptionNavigationItems = () => {
    if (subscriptionLoading) {
      console.log('RoleBasedSidebar - Subscription still loading, returning empty array');
      return [];
    }
    
    if (!sidebarComponents.length) {
      console.log('RoleBasedSidebar - No subscription components available, returning empty array');
      return [];
    }

    const groupedComponents = getGroupedComponents();
    const subscriptionItems = [];

    // Convert grouped components to navigation items format
    Object.entries(groupedComponents).forEach(([groupName, components]) => {
      const items = components.map(component => ({
        id: component.id,
        label: component.label,
        icon: getIconForComponent(component.id),
        path: getPathForComponent(component.id),
        description: component.description,
        badge: null,
        shortcut: null
      }));

      subscriptionItems.push({
        group: groupName,
        items: items
      });
    });

    return subscriptionItems;
  };

  // Icon mapping for subscription components
  const getIconForComponent = (componentId) => {
    const iconMap = {
      'dashboard': Home,
      'journal': FileText,
      'analytics': BarChart3,
      'portfolio': TrendingUp,
      'chart': Activity,
      'subscription': CreditCard,
      'profile': User,
      'settings': Settings,
      'help-support': MessageSquare,
      'advanced-analytics': BarChart3,
      'api-access': Settings,
      'priority-support': MessageSquare
    };
    return iconMap[componentId] || Home;
  };

  // Path mapping for subscription components
  const getPathForComponent = (componentId) => {
    const pathMap = {
      'dashboard': '/',
      'journal': '/journal',
      'analytics': '/analytics',
      'portfolio': '/portfolio',
      'chart': '/chart',
      'subscription': '/subscription',
      'profile': '/profile',
      'settings': '/settings',
      'help-support': '/help-support',
      'advanced-analytics': '/advanced-analytics',
      'api-access': '/api-access',
      'priority-support': '/priority-support'
    };
    return pathMap[componentId] || '/';
  };

  const getRoleBasedSections = () => {
    const sections = [];

    // System Administrator - Has access to everything
    if (hasRole('system_administrator') || isSuperAdmin()) {
      console.log('RoleBasedSidebar - System Administrator case triggered');
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'System Dashboard', icon: Home, path: '/' }] },
        { group: "Management", items: [
          { id: 'users', label: 'User Management', icon: Users, path: '/users' },
          { id: 'admin-user-management', label: 'User Subscriptions', icon: UserCheck, path: '/admin-user-management' },
          { id: 'roles', label: 'User Roles', icon: Shield, path: '/roles' },
                        { id: 'auth-diagnostic', label: 'Auth Diagnostic', icon: Bug, path: '/auth-diagnostic' }
        ]},
        { group: "Marketing", items: [
          { id: 'subscriptions', label: 'Subscription Management', icon: CreditCard, path: '/subscriptions' },
          { id: 'promotions', label: 'Promotions', icon: Star, path: '/promotions' },
          { id: 'affiliates', label: 'Affiliates', icon: Users, path: '/affiliates' },
          { id: 'marketing-reports', label: 'Reports', icon: FileText, path: '/marketing-reports' }
        ]},
        { group: "Finance", items: [
          { id: 'view-payment', label: 'View payment', icon: CreditCard, path: '/payments' },
          { id: 'process-payments', label: 'Process payments', icon: Zap, path: '/process-payments' },
          { id: 'create-invoices', label: 'Create invoices', icon: FileText, path: '/invoices' },
          { id: 'payment-disputes', label: 'Fix Payment Problems', icon: AlertCircle, path: '/payment-disputes' },
          { id: 'generate-financial-reports', label: 'Generate financial reports', icon: BarChart3, path: '/financial-reports' },
          { id: 'view-revenue-analytics', label: 'View revenue analytics', icon: TrendingUp, path: '/revenue-analytics' },
          { id: 'detailed-analytics', label: 'Detailed Analytics', icon: BarChart3, path: '/analytics', description: 'Advanced analytics dashboard' }
        ]},
        { group: "Support", items: [
          { id: 'view-subscriptions', label: 'View subscriptions', icon: CreditCard, path: '/subscriptions' },
          { id: 'send-notifications', label: 'Send notifications', icon: Bell, path: '/notifications' },
          { id: 'support-tickets', label: 'Support Tickets', icon: MessageSquare, path: '/support-tickets' },
          { id: 'support-agent-performance', label: 'Agent Performance', icon: Star, path: '/support-agent-performance' },
          { id: 'support-dashboard', label: 'Support Dashboard', icon: BarChart3, path: '/support-dashboard' },
          { id: 'my-assigned-tickets', label: 'My Assigned Tickets', icon: UserCheck, path: '/my-assigned-tickets' }
        ]},
        { group: "Support Management", items: [
          { id: 'staff-log', label: 'Staff Log', icon: ClipboardList, path: '/staff-log' }
        ]}
      );
    }
    // Marketing Team - Marketing section only
    else if (hasRole('marketing_team')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Marketing Dashboard', icon: Home, path: '/' }] },
        { group: "Marketing", items: [
          { id: 'subscriptions', label: 'Subscription Management', icon: CreditCard, path: '/subscriptions' },
          { id: 'promotions', label: 'Promotions', icon: Star, path: '/promotions' },
          { id: 'affiliates', label: 'Affiliates', icon: Users, path: '/affiliates' },
          { id: 'marketing-reports', label: 'Reports', icon: FileText, path: '/marketing-reports' }
        ]}
      );
    }
    // Finance Team - Finance section only
    else if (hasRole('finance_team')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Finance Dashboard', icon: Home, path: '/' }] },
        { group: "Finance", items: [
          { id: 'view-payment', label: 'View payment', icon: CreditCard, path: '/payments' },
          { id: 'process-payments', label: 'Process payments', icon: Zap, path: '/process-payments' },
          { id: 'create-invoices', label: 'Create invoices', icon: FileText, path: '/invoices' },
          { id: 'generate-financial-reports', label: 'Generate financial reports', icon: BarChart3, path: '/financial-reports' },
          { id: 'view-revenue-analytics', label: 'View revenue analytics', icon: TrendingUp, path: '/revenue-analytics' },
          { id: 'detailed-analytics', label: 'Detailed Analytics', icon: BarChart3, path: '/analytics', description: 'Advanced analytics dashboard' }
        ]}
      );
    }
    // Support Team - Support section only
    else if (hasRole('support_team')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Support Dashboard', icon: Home, path: '/' }] },
        { group: "Support", items: [
          { id: 'support-user-management', label: 'User Support', icon: User, path: '/support-user-management' },
          { id: 'support-tickets', label: 'Support Tickets', icon: MessageSquare, path: '/support-tickets' },
          { id: 'support-dashboard', label: 'Support Dashboard', icon: BarChart3, path: '/support-dashboard' },
          { id: 'my-assigned-tickets', label: 'My Assigned Tickets', icon: UserCheck, path: '/my-assigned-tickets' },
          { id: 'view-subscriptions', label: 'View subscriptions', icon: CreditCard, path: '/subscriptions' },
          { id: 'send-notifications', label: 'Send notifications', icon: Bell, path: '/notifications' }
        ]}
      );
    }
    // Content Manager - Content-focused access
    else if (hasRole('content_manager')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Content Dashboard', icon: Home, path: '/' }] },
        { group: "Content Management", items: [
          { id: 'analytics', label: 'Content Analytics', icon: BarChart3, path: '/analytics' },
          { id: 'content-reports', label: 'Content Reports', icon: FileText, path: '/content-reports' }
        ]}
      );
    }
    // User Manager - User-focused access
    else if (hasRole('user_manager')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'User Management Dashboard', icon: Home, path: '/' }] },
        { group: "User Management", items: [
          { id: 'users', label: 'Users', icon: Users, path: '/users' },
          { id: 'user-reports', label: 'User Reports', icon: FileText, path: '/user-reports' },
          { id: 'user-analytics', label: 'User Analytics', icon: BarChart3, path: '/analytics' }
        ]}
      );
    }
    // Support Agent - Support and user management
    else if (hasRole('support_agent')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Support Agent Dashboard', icon: Home, path: '/' }] },
        { group: "Support Management", items: [
          { id: 'support-user-management', label: 'User Support', icon: Users, path: '/support-user-management' },
          { id: 'support-tickets', label: 'Support Tickets', icon: MessageSquare, path: '/support-tickets' },
          { id: 'support-dashboard', label: 'Support Dashboard', icon: BarChart3, path: '/support-dashboard' },
          { id: 'my-assigned-tickets', label: 'My Assigned Tickets', icon: UserCheck, path: '/my-assigned-tickets' },
          { id: 'support-analytics', label: 'Support Analytics', icon: BarChart3, path: '/analytics' }
        ]}
      );
    }
    // Analyst - Analytics and reporting
    else if (hasRole('analyst')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'Analytics Dashboard', icon: Home, path: '/' }] },
        { group: "Analytics & Insights", items: [
          { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3, path: '/analytics' },
          { id: 'subscriptions', label: 'Subscription Analytics', icon: CreditCard, path: '/subscriptions' },
          { id: 'user-reports', label: 'User Reports', icon: Users, path: '/users' }
        ]}
      );
    }
    // Viewer - Read-only access
    else if (hasRole('viewer')) {
      sections.push(
        { group: "", items: [{ id: 'dashboard', label: 'View Dashboard', icon: Home, path: '/' }] },
        { group: "View Access", items: [
          { id: 'analytics', label: 'View Analytics', icon: BarChart3, path: '/analytics' },
          { id: 'subscriptions', label: 'View Subscriptions', icon: CreditCard, path: '/subscriptions' }
        ]}
      );
    }
    // Regular Users - Always show basic components
    else {
      console.log('RoleBasedSidebar - Regular user case triggered, using basic components')
      
      // Always show basic components for regular users
      sections.push(
        { group: "Main", items: [{ id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' }] },
        { group: "Trading", items: [
          { id: 'journal', label: 'Trading Journal', icon: BookOpen, path: '/journal' }
        ]},
        { group: "Account", items: [
          { id: 'subscription', label: 'My Subscription', icon: CreditCard, path: '/subscription' },
          { id: 'profile', label: 'Profile Settings', icon: User, path: '/profile' }
        ]},
        { group: "Support", items: [
          { id: 'help-support', label: 'Help & Support', icon: MessageSquare, path: '/help-support' }
        ]}
      );
      console.log('RoleBasedSidebar - Regular user sections added:', sections)
    }

    // Settings - Always available for all users
    sections.push({
      group: "",
      items: [{
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/settings',
      }]
    });

    return sections;
  };

      // Get navigation items based on user type and roles
  const getNavigationItems = () => {
    console.log('getNavigationItems called, userType:', userType)
    
    // Regular user navigation - use subscription-based components
    if (userType === 'regular') {
      console.log('🔍 Regular user detected - checking subscription components...');
      console.log('🔍 Sidebar components:', sidebarComponents);
      console.log('🔍 Components length:', sidebarComponents?.length);
      console.log('🔍 Subscription loading:', subscriptionLoading);
      console.log('🔍 Subscription error:', subscriptionError);
      
      // If subscription components are available, use them
      if (sidebarComponents && sidebarComponents.length > 0) {
        console.log('✅ Using subscription-based navigation');
        return getSubscriptionNavigationItems();
      }
      
      // Fallback to default components if subscription loading failed
      console.log('⚠️ Using fallback navigation - no subscription components available');
      return getDefaultRegularUserNavigation();
    }

    // Admin user navigation (RBAC-based)
    const baseItems = [
      {
        group: "Main",
        items: [
          { 
            id: 'dashboard', 
            label: 'Admin Dashboard', 
            icon: Home, 
            path: '/', 
            description: 'Administrative overview',
            badge: null,
            shortcut: 'D'
          }
        ]
      }
    ];

    // Support section for ALL authenticated users (including regular users)
    const supportSection = {
      group: "Support",
      items: [
        { 
          id: 'help-support', 
          label: 'Help & Support', 
          icon: MessageSquare, 
          path: '/help-support', 
          description: 'Get help via chat, email, or tickets',
          badge: { value: 'Help', type: 'secondary' },
          shortcut: 'H'
        }
      ]
    };

    // Ensure ALL users get support section regardless of role loading status
    const ensureSupportForAllUsers = (items) => {
      const hasSupportSection = items.some(section => 
        section.group === "Support" || 
        section.items?.some(item => item.id === 'help-support')
      );
      
      if (!hasSupportSection) {
        items.push(supportSection);
      }
      
      return items;
    };

        // Check for specific team roles FIRST (before general admin role check)
    if (hasRole('marketing_team') || hasRole('finance_team') || hasRole('support_team') || 
        hasRole('content_manager') || hasRole('user_manager') || hasRole('support_agent') || 
        hasRole('analyst') || hasRole('viewer') || hasRole('system_administrator')) {
      return getRoleBasedSections();
    }

    // Use the new role-based filtering system for other admin users
    if (hasAdminRole()) {
      return getRoleBasedSections();
    }

    // Default admin navigation (minimal access) - ALWAYS includes support
    return [
      ...baseItems,
      {
        group: "Support",
        items: [
          { 
            id: 'help-support', 
            label: 'Help & Support', 
            icon: MessageSquare, 
            path: '/help-support', 
            description: 'Get help via chat, email, or tickets',
            badge: { value: 'Help', type: 'secondary' },
            shortcut: 'H'
          },
          { 
            id: 'support-dashboard', 
            label: 'Support Dashboard', 
            icon: BarChart3, 
            path: '/support-dashboard', 
            description: 'Manage support tickets and assignments',
            badge: null,
            shortcut: 'D'
          },
          { 
            id: 'my-assigned-tickets', 
            label: 'My Assigned Tickets', 
            icon: UserCheck, 
            path: '/my-assigned-tickets', 
            description: 'View tickets assigned to you',
            badge: null,
            shortcut: 'M'
          }
        ]
      },
      {
        group: "Information",
        items: [
          { 
            id: 'settings', 
            label: 'Admin Settings', 
            icon: User, 
            path: '/settings', 
            description: 'Administrative settings',
            badge: null,
            shortcut: 'S'
          }
        ]
      }
    ];
  };

  const navigationItems = getNavigationItems();
  
  // Ensure ALL users get the Support section (only for admin users)
  const ensureSupportSection = (items) => {
    // Only add support section for admin users, not regular users
    if (userType === 'regular') {
      return items;
    }
    
    const hasSupportSection = items.some(section => 
      section.group === "Support" || 
      section.items?.some(item => item.id === 'help-support')
    );
    
    if (!hasSupportSection) {
      console.log('Adding Support section for user type:', userType);
      items.push({
        group: "Support",
        items: [
          { 
            id: 'help-support', 
            label: 'Help & Support', 
            icon: HelpCircle, 
            path: '/help-support', 
            description: 'Get help and support',
            badge: null,
            shortcut: 'H'
          },
          { 
            id: 'support-dashboard', 
            label: 'Support Dashboard', 
            icon: BarChart3, 
            path: '/support-dashboard', 
            description: 'Manage support tickets and assignments',
            badge: null,
            shortcut: 'D'
          },
          { 
            id: 'my-assigned-tickets', 
            label: 'My Assigned Tickets', 
            icon: UserCheck, 
            path: '/my-assigned-tickets', 
            description: 'View tickets assigned to you',
            badge: null,
            shortcut: 'M'
          }
        ]
      });
    }
    
    return items;
  };
  
  const finalNavigationItems = ensureSupportSection(navigationItems);
  
  // Debug logging for navigation items
  console.log('RoleBasedSidebar - Final navigation items:', finalNavigationItems.map(group => ({
    group: group.group,
    items: group.items.map(item => ({ id: item.id, label: item.label }))
  })))
  
  // Check if help-support is in the navigation
  const hasHelpSupport = finalNavigationItems.some(group => 
    group.items.some(item => item.id === 'help-support')
  );
  console.log('RoleBasedSidebar - Has help-support item:', hasHelpSupport)
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Role-Based Sidebar:', {
      userType,
      roles: roles.map(r => r.name),
      hasMarketingRole: hasRole('marketing_team'),
      hasFinanceRole: hasRole('finance_team'),
      hasSupportRole: hasRole('support_team'),
      hasContentManagerRole: hasRole('content_manager'),
      hasUserManagerRole: hasRole('user_manager'),
      hasSupportAgentRole: hasRole('support_agent'),
      hasAnalystRole: hasRole('analyst'),
      hasViewerRole: hasRole('viewer'),
      hasSystemAdminRole: hasRole('system_administrator'),
      navigationSections: finalNavigationItems.length
    });
  }

  // Only show loading for regular users with subscription loading
  if (loading || (subscriptionLoading && userType === 'regular')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading navigation...' : 'Loading your plan components...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}>
        {/* Header */}
        <div className="sidebar-header flex h-16 items-center justify-between border-b border-sidebar-border/50 px-4 pt-2 bg-gradient-to-r from-sidebar/60 via-sidebar/40 to-sidebar/20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl"></div>
          
          {!collapsed && (
            <div className="flex items-center space-x-3 relative z-10 flex-1 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300 hover:scale-105 flex-shrink-0">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={darkMode ? '/src/assets/LOGO-white.png' : '/src/assets/LOGO-black.png'} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain absolute"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {userType === 'admin' ? (
                    <Shield className="h-6 w-6" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent truncate">
                    {userType === 'admin' ? (
                      isSuperAdmin() ? 'Super Admin Dashboard' : 
                      hasRole('system_administrator') ? 'System Admin Dashboard' :
                      hasRole('marketing_team') ? 'Marketing Dashboard' :
                      hasRole('finance_team') ? 'Finance Dashboard' :
                      hasRole('support_team') ? 'Support Dashboard' :
                      'Admin Dashboard'
                    ) : (
                      'Talaria Dashboard'
                    )}
                  </h1>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                </div>
                <p className="text-sm text-sidebar-foreground/80 font-medium truncate">
                  Welcome back, {user?.name || user?.username || 'Admin'} 👋
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-10 w-10 p-0 hover:bg-sidebar-accent/60 rounded-xl transition-all duration-200 hover:scale-105 relative z-10"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="sidebar-search px-4 py-3 border-b border-sidebar-border/30 bg-gradient-to-r from-sidebar/20 via-transparent to-sidebar/20 relative overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
              <Input
                placeholder="Search features... (⌘K)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 w-full bg-sidebar/50 border-sidebar-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-200 hover:bg-sidebar/60 focus:bg-sidebar/70"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent/50 rounded-lg"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {!searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent/50 rounded-lg"
                >
                  <Command className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="mt-2 text-xs text-sidebar-foreground/60 text-center">
              {searchResults.length > 0 ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found` : 'Quick access to all features'}
            </div>
          </div>
        )}


        {/* Navigation */}
        <ScrollArea className="flex-1 sidebar-scroll">
          <div className="p-4 space-y-8">
            {searchQuery ? (
              // Search Results
              <div className="sidebar-group group">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-sidebar-foreground/90 uppercase tracking-wide">
                      Search Results
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = activeItem === item.id;
                      
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className={cn(
                                "sidebar-item w-full justify-start h-12 px-4 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive 
                                  ? "sidebar-item-active bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 text-primary-foreground shadow-md border border-primary/20 hover:shadow-lg" 
                                  : "hover:bg-sidebar-accent/50 hover:shadow-sm hover:border-sidebar-border/40"
                              )}
                              onClick={() => {
                                console.log('RoleBasedSidebar - Clicked search result:', item.id, item.label)
                                onItemClick(item.id)
                                setSearchQuery('')
                                setSearchResults([])
                              }}
                              style={{
                                animationDelay: `${itemIndex * 20}ms`
                              }}
                            >
                              {/* Active indicator */}
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r-full"></div>
                              )}
                              
                              {/* Background glow effect */}
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-xl"></div>
                              )}
                              
                              <Icon className={cn(
                                "sidebar-icon h-5 w-5 mr-3 transition-all duration-200 relative z-10",
                                isActive 
                                  ? "text-primary drop-shadow-sm" 
                                  : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground group-hover:scale-105"
                              )} />
                              
                              <div className="flex-1 text-left relative z-10 min-w-0 pr-2">
                                <div className={cn(
                                  "font-semibold transition-all duration-200 truncate",
                                  isActive 
                                    ? "text-primary-foreground" 
                                    : "text-sidebar-foreground group-hover:text-sidebar-foreground"
                                )}>
                                  {item.label}
                                </div>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    {item.group}
                                  </Badge>
                                  {item.description && (
                                    <span className={cn(
                                      "text-xs transition-all duration-200 line-clamp-1",
                                      isActive 
                                        ? "text-primary-foreground/80" 
                                        : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80"
                                    )}>
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                            </Button>
                          </TooltipTrigger>
                        </Tooltip>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sidebar-foreground/60">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No results found for "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Regular Navigation
              finalNavigationItems.map((group, groupIndex) => (
              <div key={groupIndex} className="sidebar-group group">
                {!collapsed && (
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-sidebar-foreground/90 uppercase tracking-wide">
                        {group.group}
                      </h3>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "sidebar-item w-full justify-start h-12 px-4 rounded-xl transition-all duration-200 group relative overflow-hidden",
                              isActive 
                                ? "sidebar-item-active bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 text-primary-foreground shadow-md border border-primary/20 hover:shadow-lg" 
                                : "hover:bg-sidebar-accent/50 hover:shadow-sm hover:border-sidebar-border/40"
                            )}
                            onClick={() => {
                              console.log('RoleBasedSidebar - Clicked:', item.id, item.label)
                              onItemClick(item.id)
                            }}
                            style={{
                              animationDelay: `${itemIndex * 20}ms`
                            }}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r-full"></div>
                            )}
                            
                            {/* Background glow effect */}
                            {isActive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-xl"></div>
                            )}
                            
                            <Icon className={cn(
                              "sidebar-icon h-5 w-5 mr-3 transition-all duration-200 relative z-10",
                              isActive 
                                ? "text-primary drop-shadow-sm" 
                                : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground group-hover:scale-105"
                            )} />
                            
                            {!collapsed && (
                              <div className="flex-1 text-left relative z-10 min-w-0 pr-2">
                                <div className={cn(
                                  "font-semibold transition-all duration-200 truncate",
                                  isActive 
                                    ? "text-primary-foreground" 
                                    : "text-sidebar-foreground group-hover:text-sidebar-foreground"
                                )}>
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className={cn(
                                    "text-xs transition-all duration-200 mt-0.5 line-clamp-2",
                                    isActive 
                                      ? "text-primary-foreground/80" 
                                      : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80"
                                  )}>
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {item.badge && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "ml-auto relative z-10 transition-all duration-200",
                                  isActive 
                                    ? "bg-primary/20 text-primary border-primary/30" 
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                              >
                                {item.badge.value}
                              </Badge>
                            )}
                            
                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                          </Button>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" className="bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl z-50">
                            <div className="p-3">
                              <p className="font-semibold text-sm text-popover-foreground">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                              {item.badge && (
                                <Badge variant={item.badge.type} className="text-xs mt-1">
                                  {item.badge.value}
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="sidebar-footer border-t border-sidebar-border/50 p-4 bg-gradient-to-r from-sidebar/40 via-sidebar/20 to-sidebar/10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start h-12 px-4 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/50 hover:shadow-sm hover:border-sidebar-border/40 group",
                    collapsed ? "justify-center p-3" : ""
                  )}
                >
                  <Avatar className={cn(
                    "ring-2 ring-sidebar-border/40 hover:ring-primary/50 transition-all duration-200 hover:scale-105",
                    collapsed ? "h-10 w-10" : "h-8 w-8 mr-3"
                  )}>
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary font-bold">
                      {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left min-w-0 pr-2">
                      <div className="font-semibold text-sidebar-foreground truncate">
                        {user?.name || user?.username || 'Admin'}
                      </div>
                      <div className="text-xs text-sidebar-foreground/70 truncate">
                        {userType === 'admin' ? 'Administrator' : 'User'}
                      </div>
                    </div>
                  )}
                  {!collapsed && (
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl">
                <DropdownMenuLabel className="text-center py-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary font-bold">
                        {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{user?.name || user?.username || 'Admin'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onNavigate && onNavigate('profile')}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <User className="mr-3 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onNavigate && onNavigate('notifications')}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <Bell className="mr-3 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onToggleDarkMode}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  {darkMode ? (
                    <>
                      <Sun className="mr-3 h-4 w-4" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onNavigate && onNavigate('settings')}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span>{userType === 'admin' ? 'Admin Settings' : 'Account Settings'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {!collapsed && (
              <div className="mt-3 pt-3 border-t border-sidebar-border/30">
                <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
                  <span>v1.0.0</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RoleBasedSidebar;
