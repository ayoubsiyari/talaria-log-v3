import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

// Safe JSON parsing helper to handle corrupted localStorage data
const safeParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return fallback;
  }
};

const useRealtimeChat = (options = {}) => {
  const {
    enabled = true,
    autoConnect = true,
    onNewMessage = null,
    onMessageStatusUpdate = null,
    onTicketUpdate = null,
    onUserTyping = null,
    onConnectionChange = null,
    onError = null
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Initialize Socket.IO connection
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found, skipping Socket.IO connection');
        return;
      }

      // Get user info with safe parsing
      const user = safeParse(localStorage.getItem('user'), {});
      const adminUser = safeParse(localStorage.getItem('adminUser'), {});
      const isAdmin = !!(adminUser && adminUser.id);
      const userId = isAdmin ? adminUser.id : user.id;

      if (!userId) {
        console.warn('No user ID found, skipping Socket.IO connection');
        return;
      }

      // Create Socket.IO connection
      const socketUrl = window.location.origin;
      socketRef.current = io(socketUrl, {
        transports: ['websocket'],
        auth: {
          token: token,
          user_id: userId,
          is_admin: isAdmin
        }
      });
      
      socketRef.current.on('connect', () => {
        console.log('🔌 Real-time chat Socket.IO connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        // Authenticate with the server
        socketRef.current.emit('chat_authenticate', {
          token: token,
          user_id: userId,
          is_admin: isAdmin
        });
        
        if (onConnectionChange) {
          onConnectionChange('connected');
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 Real-time chat Socket.IO disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        if (onConnectionChange) {
          onConnectionChange('disconnected');
        }
        
        // Clear typing users when disconnected
        setTypingUsers({});
        setConnectedUsers([]);
        
        // Attempt to reconnect if not manually closed
        if (reason !== 'io client disconnect') {
          setReconnectAttempts(prev => {
            if (prev >= maxReconnectAttempts) {
              console.log('Max reconnection attempts reached');
              return prev;
            }
            scheduleReconnect();
            return prev + 1;
          });
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('🔌 Real-time chat Socket.IO error:', error);
        setConnectionStatus('error');
        
        if (onError) {
          onError(error);
        }
      });

      // Set up message handlers
      setupMessageHandlers();

    } catch (error) {
      console.error('Error connecting to real-time chat:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [enabled, reconnectAttempts, onConnectionChange, onError]);

  // Set up Socket.IO message handlers
  const setupMessageHandlers = useCallback(() => {
    if (!socketRef.current) return;

    // Chat authentication responses
    socketRef.current.on('chat_connected', (data) => {
      console.log('✅ Chat authentication successful');
    });

    socketRef.current.on('chat_authenticated', (data) => {
      console.log('✅ Chat authenticated:', data);
    });

    // Message events
    socketRef.current.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    socketRef.current.on('message_status_update', (data) => {
      console.log('📊 Message status update:', data);
      setMessageStatuses(prev => ({
        ...prev,
        [data.message_id]: data.status
      }));
      if (onMessageStatusUpdate) {
        onMessageStatusUpdate(data);
      }
    });

    socketRef.current.on('ticket_update', (data) => {
      console.log('🎫 Ticket update:', data);
      if (onTicketUpdate) {
        onTicketUpdate(data);
      }
    });

    socketRef.current.on('ticket_message_notification', (data) => {
      console.log('🔔 Ticket message notification:', data);
      toast.info(`New message in ticket #${data.ticket_id}`);
    });

    socketRef.current.on('ticket_update_notification', (data) => {
      console.log('🔔 Ticket update notification:', data);
      toast.info(`Ticket #${data.ticket_id} has been updated`);
    });

    // Typing indicators
    socketRef.current.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      setTypingUsers(prev => ({
        ...prev,
        [data.user_id]: {
          ...data,
          timestamp: Date.now()
        }
      }));
      if (onUserTyping) {
        onUserTyping(data);
      }
    });

    // Error handling
    socketRef.current.on('error', (data) => {
      console.error('❌ Socket.IO error:', data);
      if (onError) {
        onError(new Error(data.message || 'Socket.IO error'));
      }
    });
  }, [onNewMessage, onMessageStatusUpdate, onTicketUpdate, onUserTyping, onError]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, reconnectAttempts]);


  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const joinTicketChat = useCallback((ticketId, userId) => {
    if (!isConnected || !socketRef.current) {
      console.warn('Socket.IO not connected, cannot join ticket chat');
      return;
    }
    
    console.log(`🚪 Joining ticket chat: ${ticketId}`);
    socketRef.current.emit('join_ticket_chat', {
      ticket_id: ticketId,
      user_id: userId
    });
  }, [isConnected]);

  const leaveTicketChat = useCallback((ticketId) => {
    if (!isConnected || !socketRef.current) {
      return;
    }
    
    console.log(`🚪 Leaving ticket chat: ${ticketId}`);
    socketRef.current.emit('leave_ticket_chat', {
      ticket_id: ticketId
    });
  }, [isConnected]);

  const sendTypingStart = useCallback((ticketId, userId, userName) => {
    if (!isConnected || !socketRef.current) {
      return;
    }
    
    // Clear existing timeout for this ticket
    if (typingTimeoutRef.current[ticketId]) {
      clearTimeout(typingTimeoutRef.current[ticketId]);
    }
    
    socketRef.current.emit('typing_start', {
      ticket_id: ticketId,
      user_id: userId,
      user_name: userName
    });
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current[ticketId] = setTimeout(() => {
      sendTypingStop(ticketId, userId);
    }, 3000);
  }, [isConnected]);

  const sendTypingStop = useCallback((ticketId, userId) => {
    if (!isConnected || !socketRef.current) {
      return;
    }
    
    // Clear timeout
    if (typingTimeoutRef.current[ticketId]) {
      clearTimeout(typingTimeoutRef.current[ticketId]);
      delete typingTimeoutRef.current[ticketId];
    }
    
    socketRef.current.emit('typing_stop', {
      ticket_id: ticketId,
      user_id: userId
    });
  }, [isConnected]);

  const markMessagesAsRead = useCallback((ticketId, userId, messageIds) => {
    if (!isConnected || !socketRef.current) {
      return;
    }
    
    console.log(`👁️ Marking messages as read: ${messageIds.length} messages`);
    socketRef.current.emit('mark_messages_read', {
      ticket_id: ticketId,
      user_id: userId,
      message_ids: messageIds
    });
  }, [isConnected]);

  const getTypingUsers = useCallback((ticketId) => {
    return typingUsers[ticketId] || {};
  }, [typingUsers]);

  const getMessageStatus = useCallback((messageId) => {
    return messageStatuses[messageId] || 'sent';
  }, [messageStatuses]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    reconnectAttempts,
    
    // Connection methods
    connect,
    disconnect,
    
    // Chat methods
    joinTicketChat,
    leaveTicketChat,
    sendTypingStart,
    sendTypingStop,
    markMessagesAsRead,
    
    // Data getters
    getTypingUsers,
    getMessageStatus,
    connectedUsers,
    
    // Manual refresh
    forceReconnect: () => {
      disconnect();
      setTimeout(connect, 1000);
    }
  };
};

export default useRealtimeChat;


