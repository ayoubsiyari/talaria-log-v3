import { useState, useEffect, useRef, useCallback } from 'react';

const usePollingChat = (options = {}) => {
  const {
    enabled = true,
    pollInterval = 1500, // Poll every 1.5 seconds for faster updates
    onNewMessage = null,
    onTicketUpdate = null,
    onError = null
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const lastMessageIdRef = useRef(null);
  const lastTicketUpdateRef = useRef(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onTicketUpdateRef = useRef(onTicketUpdate);

  // Update refs when props change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onTicketUpdateRef.current = onTicketUpdate;
  }, [onTicketUpdate]);

  // Poll for new messages and updates
  const pollForUpdates = useCallback(async (ticketId) => {
    // Validate ticketId
    if (!ticketId) {
      console.warn('Invalid ticketId provided to pollForUpdates:', ticketId);
      return;
    }

    // Convert ticketId to string for consistency
    const ticketIdStr = String(ticketId);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token available for polling');
        return;
      }

      // Get latest messages
      const response = await fetch(`/api/support/tickets/${ticketIdStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, stop polling
          console.warn('Token expired, stopping polling');
          setError('Authentication expired');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.ticket) {
        const ticket = data.ticket;
        const messages = ticket.messages || [];
        
        console.log('Polling - Received messages:', messages.length, 'Latest ID:', lastMessageIdRef.current);
        
        // Clear any previous error
        setError(null);
        
        // Check for new messages - improved detection
        if (messages.length > 0) {
          // If this is the first poll, set the latest message ID without triggering callback
          if (lastMessageIdRef.current === null) {
            const latestMessage = messages[messages.length - 1];
            lastMessageIdRef.current = String(latestMessage.id);
            console.log('Polling - Initial message ID set:', lastMessageIdRef.current);
            return; // Don't trigger callback on first load
          }
          
          const latestMessage = messages[messages.length - 1];
          const currentMessageId = String(latestMessage.id);
          const lastMessageId = String(lastMessageIdRef.current || '0');
          
          // Check if there are new messages by comparing IDs and message count
          const hasNewMessage = currentMessageId !== lastMessageId;
          
          if (hasNewMessage) {
            console.log('Polling - New message detected:', {
              newId: currentMessageId,
              lastId: lastMessageId,
              messagePreview: latestMessage.message?.substring(0, 50) + '...',
              totalMessages: messages.length
            });
            
            lastMessageIdRef.current = currentMessageId;
            
            if (onNewMessageRef.current) {
              onNewMessageRef.current(latestMessage, ticketIdStr);
            }
          } else {
            console.log('Polling - No new messages (latest ID:', currentMessageId, 'vs last:', lastMessageId, ')');
          }
        } else {
          console.log('Polling - No messages in response');
        }

        // Check for ticket updates
        const ticketUpdatedAt = new Date(ticket.updated_at).getTime();
        if (lastTicketUpdateRef.current && ticketUpdatedAt > lastTicketUpdateRef.current) {
          lastTicketUpdateRef.current = ticketUpdatedAt;
          
          if (onTicketUpdateRef.current) {
            onTicketUpdateRef.current(ticketIdStr, 'ticket_updated', {
              status: ticket.status,
              priority: ticket.priority,
              assigned_to: ticket.assigned_to
            });
          }
        } else if (!lastTicketUpdateRef.current) {
          lastTicketUpdateRef.current = ticketUpdatedAt;
        }
      } else {
        console.warn('Polling - Invalid response structure:', data);
      }
    } catch (error) {
      console.error('Polling error:', error);
      setError(error.message);
      // Don't stop polling on network errors, just log them
    }
  }, []);

  // Start polling
  const startPolling = useCallback((ticketId) => {
    const ticketIdStr = String(ticketId);
    console.log('Starting polling for ticket:', ticketIdStr, 'Enabled:', enabled, 'Already polling:', isPollingRef.current);
    
    if (!enabled || isPollingRef.current) {
      console.log('Polling not started - enabled:', enabled, 'already polling:', isPollingRef.current);
      return;
    }

    if (!ticketId) {
      console.warn('No ticket ID provided, cannot start polling');
      return;
    }

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null); // Clear any previous errors

    // Reset last message ID for this new ticket
    lastMessageIdRef.current = null;
    lastTicketUpdateRef.current = null;

    // Start polling immediately
    pollForUpdates(ticketIdStr);

    pollingIntervalRef.current = setInterval(async () => {
      if (!isPollingRef.current) return;

      try {
        console.log('Polling tick for ticket:', ticketIdStr);
        await pollForUpdates(ticketIdStr);
      } catch (error) {
        console.error('Polling error in interval:', error);
        setError(error.message);
        if (onError) onError(error);
      }
    }, pollInterval);
    
    console.log('Polling started with interval:', pollInterval, 'ms');
  }, [enabled, pollInterval, onError, pollForUpdates]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('Stopping polling');
    setIsPolling(false);
    isPollingRef.current = false;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (ticketId, messageIds) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/notifications/mark-as-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          message_ids: messageIds
        })
      });

      if (response.ok) {
        // Messages marked as read successfully
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    error,
    startPolling,
    stopPolling,
    markMessagesAsRead
  };
};

export default usePollingChat;
