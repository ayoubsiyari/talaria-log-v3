import { useState, useEffect, useMemo } from 'react'
import { 
  Home,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  User,
  Bell,
  Search,
  TrendingUp,
  Activity,
  Shield,
  Database,
  Target,
  DollarSign,
  Calendar,
  Zap,
  Star,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Command,
  // Add more icons as needed
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  Users,
  Mail,
  Phone,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Tag,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react'
import { useSimpleSubscriptionSidebar } from '../../hooks/useSimpleSubscriptionSidebar'
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
import './DynamicUserSidebar.css'

// Dynamic icon mapping - automatically maps component IDs to icons
const getIconForComponent = (componentId) => {
  const iconMap = {
    // Core components
    'dashboard': Home,
    'home': Home,
    'main': Home,
    
    // Trading components
    'journal': FileText,
    'journals': FileText,
    'trading': FileText,
    'trades': FileText,
    'trade': FileText,
    
    // Analytics components
    'analytics': BarChart3,
    'analysis': BarChart3,
    'stats': BarChart3,
    'statistics': BarChart3,
    'metrics': BarChart3,
    'reports': BarChart3,
    'reporting': BarChart3,
    
    // Chart components
    'chart': Activity,
    'charts': Activity,
    'charting': Activity,
    'graphs': Activity,
    'graph': Activity,
    'visualization': Activity,
    
    // Portfolio components
    'portfolio': TrendingUp,
    'portfolios': TrendingUp,
    'holdings': TrendingUp,
    'positions': TrendingUp,
    'investments': TrendingUp,
    
    // Account components
    'subscription': CreditCard,
    'subscriptions': CreditCard,
    'billing': CreditCard,
    'payment': CreditCard,
    'payments': CreditCard,
    'plan': CreditCard,
    'plans': CreditCard,
    
    'profile': User,
    'profiles': User,
    'account': User,
    'settings': Settings,
    'preferences': Settings,
    'configuration': Settings,
    'config': Settings,
    
    // Support components
    'help': HelpCircle,
    'support': HelpCircle,
    'help-support': HelpCircle,
    'assistance': HelpCircle,
    'faq': HelpCircle,
    'documentation': HelpCircle,
    'docs': HelpCircle,
    
    // Advanced features
    'advanced-analytics': BarChart,
    'advanced': BarChart,
    'premium': Star,
    'pro': Star,
    'enterprise': Shield,
    
    // API and integrations
    'api': Database,
    'api-access': Database,
    'integrations': Database,
    'webhooks': Database,
    
    // Communication
    'notifications': Bell,
    'alerts': Bell,
    'messages': Mail,
    'email': Mail,
    'sms': Phone,
    
    // Security
    'security': Shield,
    'permissions': Lock,
    'roles': Shield,
    'access': Lock,
    
    // Data management
    'data': Database,
    'export': Download,
    'import': Upload,
    'backup': Save,
    'sync': RefreshCw,
    
    // UI components
    'dashboard': Home,
    'overview': Home,
    'summary': Home,
    'home': Home,
    
    // Default fallback
    'default': Circle
  };
  
  // Try exact match first
  if (iconMap[componentId]) {
    return iconMap[componentId];
  }
  
  // Try partial matches
  const partialMatch = Object.keys(iconMap).find(key => 
    componentId.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(componentId.toLowerCase())
  );
  
  if (partialMatch) {
    return iconMap[partialMatch];
  }
  
  // Return default icon
  return Circle;
};

// Dynamic path mapping - automatically generates paths based on component ID
const getPathForComponent = (componentId) => {
  // Convert component ID to kebab-case path
  const path = componentId
    .replace(/([A-Z])/g, '-$1') // Add dash before capital letters
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase();
  
  return `/${path}`;
};

// Default fallback navigation for when subscription components are not available
const getDefaultNavigationItems = () => [
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
    group: "Trading",
    items: [
      { 
        id: 'journal', 
        label: 'Trading Journal', 
        icon: FileText, 
        path: '/journal', 
        description: 'Track your trades and performance',
        badge: null,
        shortcut: 'J'
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
        shortcut: 'P'
      }
    ]
  },
  {
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
      }
    ]
  }
];

export default function DynamicUserSidebar({ 
  activeItem, 
  onItemClick, 
  collapsed, 
  onToggleCollapse,
  onLogout,
  user = { name: 'User', email: 'user@example.com', avatar: null },
  theme = 'light',
  onThemeToggle
}) {
  console.log('🚀 DynamicUserSidebar is being rendered!');
  console.log('🚀 This is the NEW dynamic sidebar, not the old RegularUserSidebar');
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({})
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState(2)

  // Get subscription-based sidebar components with simple real-time updates
  const {
    sidebarComponents,
    loading: subscriptionLoading,
    error: subscriptionError,
    refreshComponents,
    getGroupedComponents,
    lastFetch,
    userPlan,
    planName
  } = useSimpleSubscriptionSidebar();

  // Convert subscription components to navigation items format
  const getSubscriptionNavigationItems = () => {
    if (subscriptionLoading) {
      console.log('DynamicUserSidebar - Subscription still loading, returning empty array');
      return [];
    }
    
    if (!sidebarComponents.length) {
      console.log('DynamicUserSidebar - No subscription components available, returning empty array');
      return [];
    }

    const groupedComponents = getGroupedComponents();
    const subscriptionItems = [];

    // Convert grouped components to navigation items format
    Object.entries(groupedComponents).forEach(([groupName, components]) => {
      const items = components.map(component => ({
        id: component.id,
        label: component.label || component.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: getIconForComponent(component.id),
        path: getPathForComponent(component.id),
        description: component.description || `Access ${component.label || component.id}`,
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

  // Get navigation items based on subscription status
  const getNavigationItems = () => {
    console.log('🔍 DynamicUserSidebar - Getting navigation items...');
    console.log('🔍 Subscription loading:', subscriptionLoading);
    console.log('🔍 Sidebar components:', sidebarComponents);
    console.log('🔍 Components length:', sidebarComponents?.length);
    console.log('🔍 Subscription error:', subscriptionError);
    console.log('🔍 Last fetch:', lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never');

    // If subscription components are available, use them ONLY
    if (sidebarComponents && sidebarComponents.length > 0) {
      console.log('✅ Using subscription-based navigation ONLY');
      console.log('📋 Subscription components:', sidebarComponents.map(c => c.id));
      const subscriptionItems = getSubscriptionNavigationItems();
      console.log('📋 Generated subscription items:', subscriptionItems);
      return subscriptionItems;
    }

    // Fallback to default components if subscription loading failed
    console.log('⚠️ Using fallback navigation - no subscription components available');
    console.log('📋 Fallback components: dashboard, journal, subscription, profile, help-support');
    const fallbackItems = getDefaultNavigationItems();
    console.log('📋 Generated fallback items:', fallbackItems);
    return fallbackItems;
  };

  const navigationItems = useMemo(() => getNavigationItems(), [sidebarComponents, subscriptionLoading, subscriptionError]);

  // Initialize expanded groups only once
  useEffect(() => {
    const initialExpanded = {}
    navigationItems.forEach((group, index) => {
      initialExpanded[index] = true
    })
    setExpandedGroups(initialExpanded)
  }, []) // Remove navigationItems dependency to prevent infinite loop

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() =>
    navigationItems.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0),
    [navigationItems, searchQuery]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.metaKey || e.ctrlKey) {
        const allItems = [...navigationItems.flatMap(g => g.items)]
        const item = allItems.find(i => i.shortcut === e.key.toUpperCase())
        if (item) {
          e.preventDefault()
          onItemClick(item.id)
        }
        if (e.key === 'k') {
          e.preventDefault()
          setShowSearch(!showSearch)
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onItemClick, showSearch, navigationItems])

  const toggleGroup = (index) => {
    setExpandedGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
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
                    src={theme === 'dark' ? '/src/assets/LOGO-white.png' : '/src/assets/LOGO-black.png'} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain absolute"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent truncate">
                    {planName || 'Basic'} Plan
                  </h1>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50 flex-shrink-0"></div>
                </div>
                <p className="text-sm text-sidebar-foreground/80 font-medium truncate">
                  Welcome back, {user.username || user.email?.split('@')[0] || 'User'} 👋
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

        {/* Search */}
        {!collapsed && (
          <div className="sidebar-search border-b border-sidebar-border/50 p-4 bg-gradient-to-r from-sidebar/30 to-sidebar/10 relative">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Search features... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-sidebar/60 border-sidebar-border/60 focus:bg-sidebar/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent/60 rounded-lg"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-sidebar-foreground/60">
                {filteredNavItems.reduce((acc, group) => acc + group.items.length, 0)} results found
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 sidebar-scroll">
          <div className="p-4 space-y-8">
            {filteredNavItems.map((group, groupIndex) => (
              <div key={group.group || groupIndex} className="sidebar-group group">
                {!collapsed && group.group && (
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-sidebar-foreground/90 uppercase tracking-wide">
                        {group.group}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(groupIndex)}
                      className="h-7 w-7 p-0 hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      {expandedGroups[groupIndex] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
                
                {expandedGroups[groupIndex] && (
                  <div className="space-y-2">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon
                      const isActive = activeItem === item.id
                      
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
                              onClick={() => onItemClick(item.id)}
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
                                    "font-semibold transition-all duration-300 truncate",
                                    isActive 
                                      ? "text-primary-foreground" 
                                      : "text-sidebar-foreground group-hover:text-sidebar-foreground"
                                  )}>
                                    {item.label}
                                  </div>
                                  {item.description && (
                                    <div className={cn(
                                      "text-xs transition-all duration-300 mt-0.5 line-clamp-2",
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
                                    "ml-auto relative z-10 transition-all duration-300",
                                    isActive 
                                      ? "bg-primary/20 text-primary border-primary/30" 
                                      : "bg-primary/10 text-primary hover:bg-primary/20"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                            </Button>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right" className="bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl">
                              <div className="p-2">
                                <p className="font-semibold text-sm">{item.label}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>


        {/* User Profile */}
        <div className={cn(
          "sidebar-user border-t border-sidebar-border/50 bg-gradient-to-r from-sidebar/40 via-sidebar/20 to-sidebar/10 relative overflow-hidden",
          collapsed ? "p-2" : "p-4"
        )}>
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-xl"></div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn(
                    "w-full h-auto rounded-xl hover:bg-sidebar-accent/50 transition-all duration-200 group relative z-10",
                    collapsed ? "justify-center p-3" : "justify-start p-4"
                  )}>
                    <Avatar className={cn(
                      "ring-2 ring-sidebar-border/40 group-hover:ring-primary/50 transition-all duration-200 group-hover:scale-102",
                      collapsed ? "h-10 w-10" : "h-11 w-11 mr-4"
                    )}>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary font-bold text-lg">
                        {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0 pr-2">
                    <div className="font-bold text-sidebar-foreground group-hover:text-sidebar-foreground transition-colors truncate text-base">
                      {user.username || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-sm text-sidebar-foreground/70 group-hover:text-sidebar-foreground/90 transition-colors truncate">
                      {user.email}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                )}
                {!collapsed && (
                  <ChevronUp className="h-5 w-5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
                )}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl">
                    <div className="p-2">
                      <p className="font-semibold text-sm">{user.username || user.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover/95 backdrop-blur-sm border border-border/50 shadow-2xl rounded-xl">
              <DropdownMenuLabel className="text-foreground font-bold text-base px-3 py-2">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => onItemClick('profile')} className="hover:bg-accent/60 transition-all duration-200 px-3 py-2.5 rounded-lg mx-2">
                <User className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Profile Settings</div>
                  <div className="text-xs text-muted-foreground">Manage your account</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onItemClick('subscription')} className="hover:bg-accent/60 transition-all duration-200 px-3 py-2.5 rounded-lg mx-2">
                <CreditCard className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Subscription</div>
                  <div className="text-xs text-muted-foreground">Manage your plan</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onThemeToggle} className="hover:bg-accent/60 transition-all duration-200 px-3 py-2.5 rounded-lg mx-2">
                {theme === 'dark' ? (
                  <Sun className="mr-3 h-5 w-5" />
                ) : (
                  <Moon className="mr-3 h-5 w-5" />
                )}
                <div>
                  <div className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'} Mode</div>
                  <div className="text-xs text-muted-foreground">Switch theme</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 px-3 py-2.5 rounded-lg mx-2">
                <LogOut className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Logout</div>
                  <div className="text-xs text-red-500">Sign out of your account</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Version & Status */}
        {!collapsed && (
          <div className="sidebar-footer px-4 pb-4">
            <div className="flex items-center justify-between text-xs bg-gradient-to-r from-sidebar/30 via-sidebar/20 to-sidebar/10 rounded-xl p-3 border border-sidebar-border/40 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
                <span className="font-semibold text-sidebar-foreground/80">v2.0.0</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
                <span className="text-green-600 font-medium text-xs">All systems operational</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
