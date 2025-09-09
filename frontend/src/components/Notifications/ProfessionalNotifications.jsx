import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Star,
  MessageSquare,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Notification types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SECURITY: 'security',
  SYSTEM: 'system'
};

// Notification priorities
const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Individual notification component
const NotificationItem = ({ 
  notification, 
  onDismiss, 
  onAction,
  onMarkAsRead 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRead, setIsRead] = useState(notification.read);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case NOTIFICATION_TYPES.INFO:
        return <Info className="w-5 h-5 text-blue-500" />;
      case NOTIFICATION_TYPES.SECURITY:
        return <Shield className="w-5 h-5 text-purple-500" />;
      case NOTIFICATION_TYPES.SYSTEM:
        return <Zap className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case PRIORITIES.CRITICAL:
        return 'border-red-200 bg-red-50';
      case PRIORITIES.HIGH:
        return 'border-orange-200 bg-orange-50';
      case PRIORITIES.MEDIUM:
        return 'border-yellow-200 bg-yellow-50';
      case PRIORITIES.LOW:
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = () => {
    setIsRead(true);
    onMarkAsRead?.(notification.id);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(notification.id), 300);
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out transform",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Card className={cn(
        "mb-3 border-l-4 cursor-pointer hover:shadow-md transition-all duration-200",
        getPriorityColor(),
        !isRead && "ring-2 ring-blue-200"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                {getIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </h4>
                  {notification.priority === PRIORITIES.CRITICAL && (
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  )}
                  {!isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(notification.timestamp)}</span>
                    </span>
                    {notification.category && (
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAsRead}
                        className="h-6 px-2 text-xs"
                      >
                        Mark read
                      </Button>
                    )}
                    {notification.actions && notification.actions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction?.(notification.id, notification.actions[0])}
                        className="h-6 px-2 text-xs"
                      >
                        {notification.actions[0].label}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Notification center component
const NotificationCenter = ({ 
  notifications = [], 
  onDismiss, 
  onAction, 
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  maxHeight = 400 
}) => {
  const [filter, setFilter] = useState('all');
  const [isMuted, setIsMuted] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'critical') return notification.priority === PRIORITIES.CRITICAL;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === PRIORITIES.CRITICAL).length;

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'unread':
        return unreadCount;
      case 'critical':
        return criticalCount;
      default:
        return notifications.filter(n => n.type === filterType).length;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAllAsRead?.()}
              className="h-8 px-2 text-xs"
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-1 mt-3">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'critical', label: 'Critical', count: criticalCount },
            { key: 'success', label: 'Success', count: getFilterCount('success') },
            { key: 'error', label: 'Error', count: getFilterCount('error') }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(key)}
              className="h-7 px-2 text-xs"
            >
              {label}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto px-4 pb-4"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications</p>
              {filter !== 'all' && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  View all notifications
                </Button>
              )}
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={onDismiss}
                  onAction={onAction}
                  onMarkAsRead={onMarkAsRead}
                />
              ))}
              
              {filteredNotifications.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClearAll?.()}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Toast notification component
const ToastNotification = ({ 
  notification, 
  onDismiss, 
  onAction,
  position = 'top-right',
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(notification.id), 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case NOTIFICATION_TYPES.INFO:
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 max-w-sm w-full transition-all duration-300 ease-in-out transform",
        getPositionClasses(),
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600">
                {notification.message}
              </p>
              
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={() => onAction?.(notification.id, action)}
                      className="h-7 px-2 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Notification bell with badge
const NotificationBell = ({ 
  count = 0, 
  onClick, 
  className = "" 
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn("relative h-10 w-10 p-0", className)}
  >
    <Bell className="w-5 h-5" />
    {count > 0 && (
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    )}
  </Button>
);

export {
  NotificationCenter,
  ToastNotification,
  NotificationBell,
  NotificationItem,
  NOTIFICATION_TYPES,
  PRIORITIES
};

export default NotificationCenter;
