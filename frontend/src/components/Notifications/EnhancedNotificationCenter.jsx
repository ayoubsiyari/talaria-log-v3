import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Settings, 
  Trash2,
  Filter,
  Search,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import notificationService from '@/services/notificationService';

const EnhancedNotificationCenter = ({ 
  isOpen, 
  onClose, 
  className = "",
  position = "right" // "right", "left", "bottom"
}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all',
    unreadOnly: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = useRef(null);

  // Load notifications on mount and when filters change
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
      loadStats();
      
      if (autoRefresh) {
        startAutoRefresh();
      }
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [isOpen, filters, searchQuery, page]);

  const startAutoRefresh = () => {
    stopAutoRefresh();
    autoRefreshRef.current = setInterval(() => {
      loadUnreadCount();
      if (filters.unreadOnly) {
        loadNotifications();
      }
    }, 30000); // Refresh every 30 seconds
  };

  const stopAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  };

  const loadNotifications = async (resetPage = true) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 20,
        ...filters
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (resetPage) {
            setNotifications(data.notifications);
            setPage(1);
          } else {
            setNotifications(prev => [...prev, ...data.notifications]);
          }
          setHasMore(data.pagination.has_next);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unread_count);
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 'delivered' }
              : notification
          )
        );
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, status: 'delivered' }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const clearNotifications = async (type = null, status = null) => {
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, status })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications([]);
          loadUnreadCount();
          loadStats();
          toast.success(`Cleared ${data.deleted_count} notifications`);
        }
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(newPreferences);
          toast.success('Preferences updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'in_app',
          title: 'Test Notification',
          message: 'This is a test notification to verify your settings.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          loadNotifications();
          toast.success('Test notification sent successfully');
        }
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconProps = { className: "w-4 h-4" };
    
    if (priority === 'high') {
      return <AlertTriangle {...iconProps} className="text-red-500" />;
    }
    
    switch (type) {
      case 'email':
        return <Mail {...iconProps} className="text-blue-500" />;
      case 'sms':
        return <Smartphone {...iconProps} className="text-green-500" />;
      case 'push':
        return <Bell {...iconProps} className="text-purple-500" />;
      case 'in_app':
        return <MessageSquare {...iconProps} className="text-orange-500" />;
      default:
        return <Info {...iconProps} className="text-gray-500" />;
    }
  };

  const getNotificationBadge = (type) => {
    const variants = {
      email: 'bg-blue-100 text-blue-800',
      sms: 'bg-green-100 text-green-800',
      push: 'bg-purple-100 text-purple-800',
      in_app: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={cn("text-xs", variants[type] || 'bg-gray-100 text-gray-800')}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.unreadOnly && notification.status !== 'pending') return false;
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.status !== 'all' && notification.status !== filters.status) return false;
    if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const positionClasses = {
    right: "right-0 top-0 h-full",
    left: "left-0 top-0 h-full",
    bottom: "bottom-0 left-0 right-0 h-96"
  };

  return (
    <>
      {/* Notification Bell with Badge */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClose(!isOpen)}
          className="relative p-2"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Center */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Notification Panel */}
          <div className={cn(
            "absolute bg-white shadow-2xl border-l border-gray-200 w-96 max-w-[90vw]",
            positionClasses[position]
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Notifications</h2>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="p-1"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark all as read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPreferences(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={sendTestNotification}>
                      <Bell className="w-4 h-4 mr-2" />
                      Send test notification
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => clearNotifications()}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadNotifications(true)}
                  className="p-1"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      Type: {filters.type === 'all' ? 'All' : filters.type}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}>
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'email' }))}>
                      Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'sms' }))}>
                      SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'push' }))}>
                      Push
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'in_app' }))}>
                      In-App
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      Status: {filters.status === 'all' ? 'All' : filters.status}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, status: 'pending' }))}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, status: 'delivered' }))}>
                      Delivered
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, status: 'failed' }))}>
                      Failed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={filters.unreadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
                  className="text-xs"
                >
                  Unread Only
                </Button>
              </div>
            </div>

            {/* Stats Panel */}
            {showStats && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">By Type</div>
                    <div className="text-xs text-gray-500">
                      Email: {stats.by_type?.email || 0} | 
                      SMS: {stats.by_type?.sms || 0} | 
                      Push: {stats.by_type?.push || 0} | 
                      In-App: {stats.by_type?.in_app || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">By Status</div>
                    <div className="text-xs text-gray-500">
                      Pending: {stats.by_status?.pending || 0} | 
                      Delivered: {stats.by_status?.delivered || 0} | 
                      Failed: {stats.by_status?.failed || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              )}

              {!loading && filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== false)
                      ? 'No notifications match your filters'
                      : 'You\'re all caught up!'}
                  </p>
                </div>
              )}

              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                    notification.status === 'pending' && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getNotificationBadge(notification.type)}
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                        {notification.message}
                      </p>
                      
                      {notification.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Unread
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && !loading && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(prev => prev + 1);
                      loadNotifications(false);
                    }}
                    disabled={loading}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    className="scale-75"
                  />
                  <span>Auto-refresh</span>
                </div>
                <span>{filteredNotifications.length} notifications</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Customize how you receive notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <Switch
                  id="email-enabled"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, email_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-enabled">SMS Notifications</Label>
                <Switch
                  id="sms-enabled"
                  checked={preferences.sms_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, sms_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled">Push Notifications</Label>
                <Switch
                  id="push-enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, push_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="in-app-enabled">In-App Notifications</Label>
                <Switch
                  id="in-app-enabled"
                  checked={preferences.in_app_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, in_app_enabled: checked })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours">Quiet Hours</Label>
                <Switch
                  id="quiet-hours"
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, quiet_hours_enabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <Switch
                  id="marketing-emails"
                  checked={preferences.marketing_emails}
                  onCheckedChange={(checked) => 
                    updatePreferences({ ...preferences, marketing_emails: checked })
                  }
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedNotificationCenter;
