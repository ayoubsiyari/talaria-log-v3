import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const useRealtimeNotifications = (options = {}) => {
  const {
    enabled = true,
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onNotification = null,
    onConnectionChange = null,
    onError = null
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found, skipping WebSocket connection');
        return;
      }

      // Use secure WebSocket if in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('🔔 WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000); // Send heartbeat every 30 seconds
        
        if (onConnectionChange) {
          onConnectionChange('connected');
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔔 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        if (onConnectionChange) {
          onConnectionChange('disconnected');
        }

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('🔔 WebSocket error:', error);
        setConnectionStatus('error');
        
        if (onError) {
          onError(error);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
      
      if (onError) {
        onError(error);
      }
    }
  }, [enabled, maxReconnectAttempts, onConnectionChange, onError]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('🔔 Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }

    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);
    setConnectionStatus('reconnecting');

    console.log(`🔔 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  // Handle incoming notifications
  const handleNotification = useCallback((data) => {
    if (data.type === 'notification') {
      const notification = data.notification;
      
      setLastNotification(notification);
      setNotificationCount(prev => prev + 1);
      
      // Show toast notification
      if (notification.priority === 'high') {
        toast.error(notification.title, {
          description: notification.message,
          duration: 0, // Don't auto-dismiss high priority notifications
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to notification center or specific notification
              if (onNotification) {
                onNotification(notification);
              }
            }
          }
        });
      } else {
        toast(notification.title, {
          description: notification.message,
          action: {
            label: 'View',
            onClick: () => {
              if (onNotification) {
                onNotification(notification);
              }
            }
          }
        });
      }
      
      // Call custom notification handler
      if (onNotification) {
        onNotification(notification);
      }
    } else if (data.type === 'heartbeat_ack') {
      // Heartbeat acknowledged
      console.log('🔔 Heartbeat acknowledged');
    } else if (data.type === 'connection_status') {
      // Connection status update
      setConnectionStatus(data.status);
    }
  }, [onNotification]);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Subscribe to specific notification types
  const subscribe = useCallback((notificationTypes = []) => {
    return sendMessage({
      type: 'subscribe',
      notification_types: notificationTypes
    });
  }, [sendMessage]);

  // Unsubscribe from specific notification types
  const unsubscribe = useCallback((notificationTypes = []) => {
    return sendMessage({
      type: 'unsubscribe',
      notification_types: notificationTypes
    });
  }, [sendMessage]);

  // Request notification history
  const requestHistory = useCallback((limit = 50) => {
    return sendMessage({
      type: 'request_history',
      limit: limit
    });
  }, [sendMessage]);

  // Initialize connection on mount
  useEffect(() => {
    if (autoConnect && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Fallback to polling if WebSocket is not available
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const pollingIntervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('🔔 Starting notification polling as fallback');
    setPollingEnabled(true);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.unread_count > 0) {
            // Trigger notification update
            if (onNotification) {
              onNotification({
                type: 'polling_update',
                unread_count: data.unread_count
              });
            }
          }
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // Poll every 30 seconds
  }, [onNotification]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPollingEnabled(false);
    }
  }, []);

  // Start polling if WebSocket fails
  useEffect(() => {
    if (connectionStatus === 'failed' && !pollingEnabled) {
      startPolling();
    } else if (isConnected && pollingEnabled) {
      stopPolling();
    }
  }, [connectionStatus, isConnected, pollingEnabled, startPolling, stopPolling]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    reconnectAttempts,
    
    // Notification state
    lastNotification,
    notificationCount,
    
    // Connection methods
    connect,
    disconnect,
    sendMessage,
    
    // Subscription methods
    subscribe,
    unsubscribe,
    requestHistory,
    
    // Polling state
    pollingEnabled,
    startPolling,
    stopPolling,
    
    // Utility methods
    isWebSocketSupported: typeof WebSocket !== 'undefined',
    isWebSocketConnected: isConnected && !pollingEnabled
  };
};

export default useRealtimeNotifications;
