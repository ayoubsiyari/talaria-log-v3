import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  ArrowDown, 
  Clock, 
  User, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  X,
  Check,
  CheckCheck,
  Minimize2,
  Maximize2,
  Headphones,
  ChevronDown,
  Circle,
  Paperclip,
  Download,
  File,
  Image,
  FileText,
  Upload,
  Eye,
  RefreshCw,
  Maximize,
  Minimize,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '../../services/supportService';
import notificationService from '../../services/notificationService';
import TicketRatingDialog from './TicketRatingDialog';
import SmartReplySuggestions from './SmartReplySuggestions';
import aiService from '../../services/aiService';
import usePollingChat from '../../hooks/usePollingChat';
import useRealtimeChat from '../../hooks/useRealtimeChat';

const TicketChat = ({ ticket, onClose, onUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);
  const fileInputRef = useRef(null);
  const previewContentRef = useRef(null);

  // Handle new message (shared between SocketIO and polling)
  const handleNewMessage = useCallback((message, ticketId) => {
    console.log('TicketChat - New message received via', message, 'for ticket:', ticketId);
    if (String(ticketId) === String(ticket?.id)) {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => m.id === message.id);
        console.log('TicketChat - Message exists check:', exists, 'Current messages:', prev.length);
        if (exists) return prev;
        
        // If this is a real message from server, replace any temporary message with same content
        const tempMessageIndex = prev.findIndex(m => 
          String(m.id).startsWith('temp_') && 
          m.message === message.message && 
          m.status === 'sent'
        );
        
        if (tempMessageIndex !== -1) {
          console.log('TicketChat - Replacing temporary message with real message');
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = message;
          return newMessages;
        }
        
        console.log('TicketChat - Adding new message to state');
        return [...prev, message];
      });
      scrollToBottom();
    }
  }, [ticket?.id]);

  // Handle ticket updates (shared between SocketIO and polling)
  const handleTicketUpdate = useCallback((ticketId, updateType, data) => {
    if (String(ticketId) === String(ticket?.id)) {
      // Update ticket status in real-time
      if (onUpdate) {
        onUpdate(true);
      }
      toast.info(`Ticket ${updateType.replace('_', ' ')}`);
    }
  }, [ticket?.id, onUpdate]);

  // SocketIO real-time chat (primary)
  const {
    isConnected: socketConnected,
    connectionStatus,
    joinTicketChat,
    leaveTicketChat
  } = useRealtimeChat({
    onNewMessage: handleNewMessage,
    onTicketUpdate: handleTicketUpdate,
    onError: (error) => {
      console.log('SocketIO error, polling will handle updates:', error);
    }
  });

  // Polling-based fallback (secondary)
  const {
    isPolling,
    error: pollingError,
    startPolling,
    stopPolling,
    markMessagesAsRead
  } = usePollingChat({
    enabled: true, // Always enabled as fallback
    onNewMessage: handleNewMessage,
    onTicketUpdate: handleTicketUpdate
  });

  useEffect(() => {
    if (ticket) {
      loadMessages();
      // Get current user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
      
      // Check if user is support agent or admin
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      console.log('TicketChat - Admin user detection:', {
        adminUser,
        hasAdminUser: !!adminUser,
        roles: adminUser?.roles,
        permissions: adminUser?.permissions
      });
      
      const isAgent = adminUser && (
        adminUser.roles?.some(role => 
          role.name === 'support_agent' || 
          role.name === 'support_team' || 
          role.name === 'system_administrator'
        ) ||
        adminUser.permissions?.some(permission => 
          permission.name === 'support.tickets.reply' ||
          permission.name === 'support.tickets.view'
        )
      );
      
      console.log('TicketChat - Is support agent:', isAgent);
      
      // Fallback: Check if we're in admin dashboard context
      const isAdminDashboard = window.location.pathname.includes('/dashboard');
      const isAdminByContext = isAdminDashboard && adminUser && Object.keys(adminUser).length > 0;
      
      console.log('TicketChat - Admin context check:', {
        isAdminDashboard,
        isAdminByContext,
        pathname: window.location.pathname
      });
      
      setIsSupportAgent(isAgent || isAdminByContext);
      
      // Mark ticket as read when opened
      markTicketAsRead();
      // Clear unread indicators
      clearUnreadIndicators();
      
      // Show rating dialog if ticket is closed/resolved and not rated
      if ((ticket.status === 'closed' || ticket.status === 'resolved') && 
          !ticket.user_rating && 
          user.email === ticket.user_email) {
        setShowRatingDialog(true);
      }
    }
  }, [ticket]);

  // Start/stop both SocketIO and polling when ticket changes
  useEffect(() => {
    if (ticket) {
      console.log('TicketChat - Starting real-time systems for ticket:', ticket.id);
      
      // Start SocketIO connection
      if (socketConnected) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const userId = adminUser?.id || user?.id;
        
        if (userId) {
          console.log('TicketChat - Joining SocketIO room for ticket:', ticket.id);
          joinTicketChat(ticket.id, userId);
        }
      } else {
        console.log('TicketChat - SocketIO not connected, relying on polling');
      }
      
      // Always start polling as fallback
      startPolling(ticket.id);
    }
    
    return () => {
      if (ticket) {
        console.log('TicketChat - Stopping real-time systems for ticket:', ticket.id);
        if (socketConnected) {
          leaveTicketChat(ticket.id);
        }
        stopPolling();
      }
    };
  }, [ticket, startPolling, stopPolling, socketConnected, joinTicketChat, leaveTicketChat]);

  // Mark ticket as read
  const markTicketAsRead = async () => {
    try {
      await notificationService.markAsRead(ticket.id);
      // Don't call onUpdate here to avoid unnecessary ticket reloads
      // Only call onUpdate when there are actual changes (like sending a message)
    } catch (error) {
      console.error('Error marking ticket as read:', error);
    }
  };

  // Mark messages as read when user views them
  const markMessagesAsReadNow = useCallback(async () => {
    if (!ticket || !messages.length) return;

    try {
      // Get unread admin messages (messages from support team)
      const unreadAdminMessages = messages.filter(msg => 
        msg.is_admin_reply && !msg.read_at
      );

      if (unreadAdminMessages.length > 0) {
        const messageIds = unreadAdminMessages.map(msg => msg.id);
        await markMessagesAsRead(ticket.id, messageIds);
        
        // Update local state to show as read
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [ticket, messages, markMessagesAsRead]);

  // Clear unread indicators when chat is opened
  const clearUnreadIndicators = () => {
    // Update messages to mark them as read locally
    setMessages(prevMessages => 
      prevMessages.map(message => ({
        ...message,
        read_at: message.is_admin_reply ? new Date().toISOString() : message.read_at
      }))
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when user scrolls to bottom (sees the messages)
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

      if (isAtBottom) {
        markMessagesAsReadNow();
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [markMessagesAsReadNow]);

  // Handle escape key to close preview
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && previewAttachment) {
        closePreview();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [previewAttachment]);

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      console.log('TicketChat loading messages for ticket:', ticket.id);
      const response = await supportService.getTicket(ticket.id);
      console.log('TicketChat loadMessages response:', response);
      
      if (response.data.success) {
        const messages = response.data.ticket.messages || [];
        const attachments = response.data.ticket.attachments || [];
        
        
        // Combine messages and attachments into a single conversation
        const conversation = [];
        
        // Add messages
        messages.forEach(message => {
          conversation.push({
            ...message,
            type: 'message',
            read_at: message.is_admin_reply ? new Date().toISOString() : message.read_at
          });
        });
        
        // Add attachments as file messages
        attachments.forEach(attachment => {
          conversation.push({
            id: `attachment_${attachment.id}`,
            type: 'attachment',
            attachment: attachment,
            created_at: attachment.uploaded_at || attachment.created_at,
            is_admin_reply: false, // Files are always from users for now
            author_name: attachment.uploaded_by,
            read_at: new Date().toISOString() // Mark as read when loaded
          });
        });
        
        // Sort by creation time
        conversation.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        setMessages(conversation);
        setAttachments(attachments); // Keep for reference
      } else {
        console.error('Failed to load messages:', response.data.error);
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !ticket) {
      return;
    }
    
    // Prevent sending messages if ticket is closed or resolved
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      toast.error('Cannot send messages to closed or resolved tickets');
      return;
    }

    setSending(true);
    
    // Add a temporary "sending" message to show immediate feedback
    const tempMessageId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      message: newMessage || (selectedFiles.length > 0 ? `📎 Attached ${selectedFiles.length} file(s)` : ''),
      is_admin_reply: isSupportAgent, // Set based on current user type
      author_name: currentUser?.full_name || currentUser?.username || 'You',
      created_at: new Date().toISOString(),
      status: 'sending',
      type: 'message'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();
    
    try {
      // First upload files if any
      const uploadedAttachments = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`/api/support/tickets/${ticket.id}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });

          const result = await response.json();
          
          if (result.success) {
            uploadedAttachments.push(result.attachment);
          } else {
            toast.error(`Failed to upload ${file.name}: ${result.error}`);
          }
        }
      }

      // Then send the message (even if empty, to show attachments)
      const messageData = {
        message: newMessage || (uploadedAttachments.length > 0 ? `📎 Attached ${uploadedAttachments.length} file(s)` : ''),
        is_internal: false
      };

      const response = await supportService.addMessage(ticket.id, messageData);
      
      if (response.data.success) {
        // Update the temporary message to show it was sent successfully
        setMessages(prev => prev.map(m => 
          m.id === tempMessageId 
            ? { ...m, status: 'sent' }
            : m
        ));
        
        setNewMessage('');
        setSelectedFiles([]); // Clear selected files
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Force a refresh of messages to get the latest from server
        setTimeout(() => {
          console.log('Force refreshing messages after send');
          loadMessages();
        }, 200);
        
        // Also force refresh after a longer delay to ensure we get the latest
        setTimeout(() => {
          console.log('Secondary refresh to ensure latest messages');
          loadMessages();
        }, 1000);
        
        // Third refresh to be absolutely sure
        setTimeout(() => {
          console.log('Third refresh to ensure latest messages');
          loadMessages();
        }, 3000);
        
        // Polling will handle real-time updates automatically
        
        // Clear unread indicators since we've responded
        clearUnreadIndicators();
        
        // Immediately refresh notification state
        try {
          const unreadCount = await notificationService.getUnreadMessageCount();
          const ticketsWithReplies = await notificationService.getTicketsWithNewReplies();
          // Update parent component with fresh notification data
          if (onUpdate) onUpdate(true, { unreadCount, ticketsWithReplies });
        } catch (error) {
          console.error('Error refreshing notification state:', error);
          // Fallback to regular update
          if (onUpdate) onUpdate(true);
        }
        
        if (uploadedAttachments.length > 0) {
          toast.success(`Message sent with ${uploadedAttachments.length} attachment(s)!`);
        } else {
          toast.success('Message sent successfully!');
        }
      } else {
        // Update the temporary message to show error
        setMessages(prev => prev.map(m => 
          m.id === tempMessageId 
            ? { ...m, status: 'error' }
            : m
        ));
        toast.error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update the temporary message to show error
      setMessages(prev => prev.map(m => 
        m.id === tempMessageId 
          ? { ...m, status: 'error' }
          : m
      ));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    // Debug logging
    console.log('FormatTime - Timestamp:', timestamp, 'Date:', date, 'Diff minutes:', diffInMinutes);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleRatingSubmitted = (rating, feedback) => {
    // Update the ticket data with the rating
    if (onUpdate) {
      onUpdate(true);
    }
  };

  const handleSmartReplySuggestion = (suggestion) => {
    setNewMessage(suggestion);
    // Focus on the textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  };

  // File upload functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not allowed: ${file.name}`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected`);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openPreview = async (attachmentId, filename, mimeType) => {
    try {
      setPreviewLoading(true);
      const response = await fetch(`/api/support/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        let content = null;
        // Load text content for text files
        if (mimeType === 'text/plain') {
          content = await blob.text();
        }
        
        setPreviewAttachment({
          id: attachmentId,
          filename,
          mimeType,
          url,
          blob,
          content
        });
      } else {
        toast.error('Failed to load file preview');
      }
    } catch (error) {
      console.error('Error loading file preview:', error);
      toast.error('Failed to load file preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Auto-scroll preview content to top when it loads
  useEffect(() => {
    if (previewAttachment && previewContentRef.current) {
      previewContentRef.current.scrollTop = 0;
    }
  }, [previewAttachment]);

  const closePreview = () => {
    if (previewAttachment?.url) {
      window.URL.revokeObjectURL(previewAttachment.url);
    }
    setPreviewAttachment(null);
  };

  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await fetch(`/api/support/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="h-3 w-3 text-blue-600" />;
    if (mimeType === 'application/pdf') return <FileText className="h-3 w-3 text-red-600" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-3 w-3 text-blue-700" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-3 w-3 text-green-600" />;
    if (mimeType === 'text/plain') return <FileText className="h-3 w-3 text-gray-600" />;
    return <File className="h-3 w-3 text-gray-600" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-500 ease-out ${
        isMinimized ? 'w-80 h-16' : 'w-[400px] h-[650px]'
      } flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate max-w-[200px]">
                    {ticket.subject}
                  </h3>
                  {(() => {
                    const unreadCount = messages.filter(m => m.is_admin_reply && !m.read_at).length;
                    const totalMessages = messages.filter(m => m.is_admin_reply).length;
                    const readCount = totalMessages - unreadCount;
                    
                    return (
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-0.5 animate-pulse">
                            {unreadCount} new
                          </Badge>
                        )}
                        {totalMessages > 0 && (
                          <span className="text-xs text-gray-300">
                            {readCount}/{totalMessages} read
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                                 <div className="flex items-center gap-2">
                   <Badge className={`${getStatusColor(ticket.status)} text-xs px-2 py-0.5 border font-medium`}>
                     <Circle className="w-2 h-2 mr-1 fill-current" />
                     {ticket.status?.replace('_', ' ')}
                   </Badge>
                   <Badge className={`${getPriorityColor(ticket.priority)} text-xs px-2 py-0.5 border font-medium`}>
                     {ticket.priority}
                   </Badge>
                   {ticket.status === 'closed' && (
                     <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-2 py-0.5 border font-medium">
                       <X className="w-2 h-2 mr-1" />
                       Closed
                     </Badge>
                   )}
                   {/* Connection Status Indicators */}
                   {socketConnected ? (
                     <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-0.5 border font-medium">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                       Real-time
                     </Badge>
                   ) : isPolling ? (
                     <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 border font-medium">
                       <RefreshCw className="w-2 h-2 mr-1 animate-spin" />
                       Polling
                     </Badge>
                   ) : (
                     <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs px-2 py-0.5 border font-medium">
                       <AlertCircle className="w-2 h-2 mr-1" />
                       Offline
                     </Badge>
                   )}
                 </div>
              </div>
            </div>
            
                         <div className="flex items-center gap-1">
               {/* Smart Replies Toggle - Only show for support agents */}
               {isSupportAgent && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setShowSmartReplies(!showSmartReplies)}
                   className={`h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors rounded-lg ${
                     showSmartReplies ? 'bg-white/20' : ''
                   }`}
                   title={showSmartReplies ? "Hide AI suggestions" : "Show AI suggestions"}
                 >
                   <Sparkles className="h-4 w-4" />
                 </Button>
               )}
               
                             <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => {
                   setIsMinimized(!isMinimized);
                   // Clear unread indicators when expanding
                   if (isMinimized) {
                     clearUnreadIndicators();
                   }
                 }}
                 className="h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors rounded-lg"
                 title={isMinimized ? "Expand chat" : "Minimize chat"}
               >
                 {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
               </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors rounded-lg"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area - Hidden when minimized */}
        {!isMinimized && (
          <>
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto bg-gray-50/30 relative"
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-base font-medium text-gray-800 mb-1">Start a conversation</h4>
                    <p className="text-sm text-gray-500">Send a message and our support team will respond shortly.</p>
                  </div>
                </div>
              ) : (
                                 <div className="px-5 py-4 space-y-5">
                   {messages.map((item) => {
                     const isAdminMessage = item.is_admin_reply;
                     const isUserMessage = !isAdminMessage;
                     const isUnread = isAdminMessage && !item.read_at;
                     const isAttachment = item.type === 'attachment';
                     
                     console.log('TicketChat - Message rendering:', {
                       messageId: item.id,
                       message: item.message,
                       isAdminMessage,
                       isUserMessage,
                       isSupportAgent,
                       author_name: item.author_name
                     });
                     
                     return (
                       <div
                         key={item.id}
                         className={`flex gap-3 ${(() => {
                           if (isSupportAgent) {
                             // Admin view: admin messages on right, customer messages on left
                             return isAdminMessage ? 'flex-row-reverse' : 'flex-row';
                           } else {
                             // User view: user messages on right, admin messages on left
                             return isUserMessage ? 'flex-row-reverse' : 'flex-row';
                           }
                         })()}`}
                       >
                         {/* Avatar */}
                         <div className="flex-shrink-0">
                           <Avatar className={`h-8 w-8 border-2 ${
                             isAdminMessage ? 'border-blue-200' : 'border-gray-200'
                           } shadow-sm`}>
                             <AvatarImage src={isAdminMessage ? "/admin-avatar.png" : currentUser?.avatar} />
                             <AvatarFallback className={`text-xs font-medium ${
                               isAdminMessage 
                                 ? 'bg-blue-50 text-blue-600' 
                                 : 'bg-gray-50 text-gray-600'
                             }`}>
                               {isAdminMessage ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                             </AvatarFallback>
                           </Avatar>
                           {isAdminMessage && (
                             <div className="w-3 h-3 bg-green-500 border-2 border-white rounded-full -mt-2 ml-6 shadow-sm"></div>
                           )}
                         </div>
                         
                         {/* Message Content */}
                         <div className={`flex flex-col max-w-[75%] ${(() => {
                           if (isSupportAgent) {
                             // Admin view: admin messages aligned right, customer messages aligned left
                             return isAdminMessage ? 'items-end' : 'items-start';
                           } else {
                             // User view: user messages aligned right, admin messages aligned left
                             return isUserMessage ? 'items-end' : 'items-start';
                           }
                         })()}`}>
                           {/* Message Header */}
                           <div className={`flex items-center gap-2 mb-1 ${(() => {
                             if (isSupportAgent) {
                               // Admin view: admin message headers aligned right, customer headers aligned left
                               return isAdminMessage ? 'flex-row-reverse' : 'flex-row';
                             } else {
                               // User view: user message headers aligned right, admin headers aligned left
                               return isUserMessage ? 'flex-row-reverse' : 'flex-row';
                             }
                           })()}`}>
                             <span className="text-xs font-semibold text-gray-700">
                               {(() => {
                                 // Get current user info for comparison
                                 const currentUserEmail = currentUser?.email;
                                 const messageAuthorEmail = item.author_email;
                                 
                                 // Check if this message is from the current logged-in user
                                 const isCurrentUserMessage = currentUserEmail && messageAuthorEmail && currentUserEmail === messageAuthorEmail;
                                 
                                 console.log('Message author logic:', {
                                   currentUserEmail,
                                   messageAuthorEmail,
                                   isCurrentUserMessage,
                                   authorName: item.author_name,
                                   isAdminMessage,
                                   isSupportAgent
                                 });
                                 
                                 // If this is the current user's message, show "You"
                                 if (isCurrentUserMessage) {
                                   return 'You';
                                 }
                                 
                                 // Otherwise, show the actual author name
                                 if (isAdminMessage) {
                                   return item.author_name || 'Support Agent';
                                 } else {
                                   return item.author_name || 'Customer';
                                 }
                               })()}
                             </span>
                             {isAdminMessage && !isSupportAgent && (
                               <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                                 Support
                               </Badge>
                             )}
                                                           {isAttachment && (
                                <Badge className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-sm">
                                  📎 Attachment
                                </Badge>
                              )}
                             <span className="text-xs text-gray-500">
                               {formatTime(item.created_at)}
                             </span>
                             {item.status && (
                               <div className="flex items-center gap-1">
                                 {item.status === 'sending' && (
                                   <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                                 )}
                                 {item.status === 'sent' && (
                                   <CheckCircle className="h-3 w-3 text-green-500" />
                                 )}
                                 {item.status === 'error' && (
                                   <AlertCircle className="h-3 w-3 text-red-500" />
                                 )}
                               </div>
                             )}
                           </div>
                           
                           {/* Message Bubble */}
                           <div className={`rounded-2xl px-4 py-3 shadow-sm border transition-all duration-200 ${(() => {
                             if (isSupportAgent) {
                               // Admin view: admin messages (right) are dark, customer messages (left) are light
                               return isAdminMessage
                                 ? 'bg-gray-900 text-white border-gray-800 rounded-br-md'
                                 : `bg-white text-gray-800 border-gray-200 rounded-bl-md ${
                                     isUnread ? 'ring-2 ring-blue-400/30 border-blue-300' : ''
                                   }`;
                             } else {
                               // User view: user messages (right) are dark, admin messages (left) are light
                               return isUserMessage
                                 ? 'bg-gray-900 text-white border-gray-800 rounded-br-md'
                                 : `bg-white text-gray-800 border-gray-200 rounded-bl-md ${
                                     isUnread ? 'ring-2 ring-blue-400/30 border-blue-300' : ''
                                   }`;
                             }
                           })()}`}>
                                                           {isAttachment ? (
                                /* File Attachment Message */
                                                                 <div className="group relative">
                                   <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200/50 hover:border-blue-300/70 transition-all duration-200 hover:shadow-sm">
                                     {/* File Icon with Background */}
                                     <div className="flex-shrink-0">
                                       <div className="w-6 h-6 bg-white rounded border border-blue-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                         {getFileIcon(item.attachment.mime_type)}
                                       </div>
                                     </div>
                                     
                                     {/* File Info */}
                                     <div className="min-w-0 flex-1">
                                       <p className="text-xs font-medium text-gray-900 truncate">
                                         {item.attachment.original_filename}
                                       </p>
                                       <div className="flex items-center gap-1 text-xs text-gray-600">
                                         <span className="flex items-center gap-1">
                                           <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                           {formatFileSize(item.attachment.file_size)}
                                         </span>
                                         <span className="text-gray-400">•</span>
                                         <span className="flex items-center gap-1">
                                           <Upload className="h-2.5 w-2.5" />
                                           {item.attachment.uploaded_by}
                                         </span>
                                       </div>
                                     </div>
                                     
                                     {/* Action Buttons */}
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                       <Button
                                         onClick={() => openPreview(item.attachment.id, item.attachment.original_filename, item.attachment.mime_type)}
                                         variant="ghost"
                                         size="sm"
                                         className="h-6 w-6 p-0 bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700 border border-blue-200/50 hover:border-blue-300 rounded shadow-sm"
                                         title="Preview file"
                                       >
                                         <Eye className="h-2.5 w-2.5" />
                                       </Button>
                                       <Button
                                         onClick={() => downloadAttachment(item.attachment.id, item.attachment.original_filename)}
                                         variant="ghost"
                                         size="sm"
                                         className="h-6 w-6 p-0 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200/50 hover:border-gray-300 rounded shadow-sm"
                                         title="Download file"
                                       >
                                         <Download className="h-2.5 w-2.5" />
                                       </Button>
                                     </div>
                                   </div>
                                   
                                   {/* Hover Effect Overlay */}
                                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                                 </div>
                              ) : (
                               /* Text Message */
                               <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                 {item.message}
                               </p>
                             )}
                           </div>
                           
                           {/* Message Status */}
                           <div className={`flex items-center gap-1 mt-1 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                             {isUserMessage && !isAttachment && (
                               <>
                                 {(() => {
                                   const isRead = item.read_at;
                                   const readTime = isRead ? new Date(item.read_at) : null;
                                   const now = new Date();
                                   
                                   return (
                                     <>
                                       {isRead ? (
                                         <CheckCheck className="w-3 h-3 text-blue-500" title={`Read at ${readTime?.toLocaleTimeString()}`} />
                                       ) : (
                                         <Check className="w-3 h-3 text-gray-400" title="Sent" />
                                       )}
                                       <span className="text-xs text-gray-500">
                                         {isRead ? (
                                           <span className="text-blue-600">
                                             Read {readTime && now.getTime() - readTime.getTime() < 60000 ? 'now' : `at ${readTime?.toLocaleTimeString()}`}
                                           </span>
                                         ) : (
                                           'Sent'
                                         )}
                                       </span>
                                     </>
                                   );
                                 })()}
                               </>
                             )}
                             
                             {isUnread && (
                               <div className="flex items-center gap-1">
                                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                 <span className="text-xs text-blue-600 font-medium">New</span>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                 </div>
              )}
              
              
              
                             {/* Scroll to bottom button */}
               {showScrollButton && (
                 <Button
                   onClick={scrollToBottom}
                   className="absolute bottom-4 right-4 w-12 h-12 p-0 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl rounded-full transition-all duration-200 backdrop-blur-sm"
                   title="Scroll to bottom"
                 >
                   <ChevronDown className="h-5 w-5" />
                 </Button>
               )}
            </div>

            {/* Mark Read Button - Only show when there are unread messages */}
            {messages.filter(m => m.is_admin_reply && !m.read_at).length > 0 && (
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markMessagesAsReadNow}
                    className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark All as Read
                  </Button>
                </div>
              </div>
            )}

                         {/* Message Input */}
             <div className="border-t border-gray-200 bg-white px-5 py-4 flex-shrink-0">
               {/* Smart Reply Suggestions - Only show for support agents */}
               {isSupportAgent && showSmartReplies && (
                 <div className="px-5 pb-3">
                   <SmartReplySuggestions
                     ticketId={ticket.id}
                     onSuggestionClick={handleSmartReplySuggestion}
                     disabled={ticket.status === 'closed' || ticket.status === 'resolved'}
                   />
                 </div>
               )}
               
               <div className="flex gap-3 items-end">
                <div className="relative flex-1">
                                     <Textarea
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     onKeyPress={handleKeyPress}
                     placeholder={
                       ticket.status === 'closed' || ticket.status === 'resolved' 
                         ? `This ticket is ${ticket.status}. You cannot send new messages.` 
                         : selectedFiles.length > 0 
                           ? `Type your message (optional) - ${selectedFiles.length} file(s) will be attached...`
                           : 'Type your message...'
                     }
                     className="min-h-[48px] max-h-[100px] resize-none pr-20 text-sm border-gray-300 focus:border-gray-400 focus:ring-gray-400/20 rounded-xl bg-gray-50/50 placeholder:text-gray-500"
                     disabled={sending || ticket.status === 'closed' || ticket.status === 'resolved'}
                   />
                  
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx"
                    disabled={uploadingFile || ticket.status === 'closed' || ticket.status === 'resolved'}
                  />
                  
                                     <Button
                     onClick={() => fileInputRef.current?.click()}
                     disabled={uploadingFile || ticket.status === 'closed' || ticket.status === 'resolved'}
                     className="absolute bottom-2 right-12 h-9 w-9 p-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                     title="Attach files"
                   >
                     {uploadingFile ? (
                       <RefreshCw className="h-4 w-4 animate-spin" />
                     ) : (
                       <Paperclip className="h-4 w-4" />
                     )}
                   </Button>
                  
                                     <Button 
                     onClick={sendMessage} 
                     disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || ticket.status === 'closed' || ticket.status === 'resolved'}
                     className="absolute bottom-2 right-2 h-9 w-9 p-0 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                   >
                     {sending ? (
                       <RefreshCw className="h-4 w-4 animate-spin" />
                     ) : (
                       <Send className="h-4 w-4" />
                     )}
                   </Button>
                </div>
              </div>
                                             {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-sm font-semibold text-blue-900">
                          Attaching {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </h4>
                      </div>
                      <Button
                        onClick={clearSelectedFiles}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-blue-200/50 hover:border-blue-300/70 transition-colors">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg border border-blue-200 flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            onClick={() => removeSelectedFile(index)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
               
                                <div className="text-xs text-gray-500 mt-3 flex items-center justify-between">
                   <span className="flex items-center gap-1">
                     <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                     Press Enter to send • Shift+Enter for new line
                   </span>
                   <div className="flex items-center gap-2 text-green-600">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="font-medium">Online</span>
                   </div>
                 </div>
            </div>
          </>
                 )}
       </div>
       
               {/* Rating Dialog */}
        <TicketRatingDialog
          ticket={ticket}
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          onRatingSubmitted={handleRatingSubmitted}
        />

        {/* File Preview Modal */}
        {previewAttachment && (
          <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={closePreview}
          >
                        <div 
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {previewAttachment.filename}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadAttachment(previewAttachment.id, previewAttachment.filename)}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={closePreview}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

                             {/* Content */}
               <div ref={previewContentRef} className="flex-1 overflow-auto p-4">
                 {previewLoading ? (
                   <div className="flex items-center justify-center h-64">
                     <div className="text-center">
                       <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
                       <p className="text-sm text-gray-600">Loading preview...</p>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full h-full">
                     {/* Image Preview */}
                     {previewAttachment.mimeType.startsWith('image/') && (
                       <div className="flex items-center justify-center">
                         <img
                           src={previewAttachment.url}
                           alt={previewAttachment.filename}
                           className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                         />
                       </div>
                     )}

                     {/* PDF Preview */}
                     {previewAttachment.mimeType === 'application/pdf' && (
                       <div className="w-full h-[70vh]">
                         <iframe
                           src={previewAttachment.url}
                           className="w-full h-full border rounded-lg"
                           title={previewAttachment.filename}
                         />
                       </div>
                     )}

                     {/* Text Preview */}
                     {previewAttachment.mimeType === 'text/plain' && (
                       <div className="bg-gray-50 rounded-lg p-4 h-[70vh] overflow-auto">
                         <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                           {previewAttachment.content || 'Loading text content...'}
                         </pre>
                       </div>
                     )}

                     {/* Unsupported File Type */}
                     {!previewAttachment.mimeType.startsWith('image/') && 
                      previewAttachment.mimeType !== 'application/pdf' && 
                      previewAttachment.mimeType !== 'text/plain' && (
                       <div className="flex items-center justify-center h-64">
                         <div className="text-center">
                           <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                           <h4 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h4>
                           <p className="text-sm text-gray-500 mb-4">
                             This file type cannot be previewed. Please download to view.
                           </p>
                           <Button
                             onClick={() => downloadAttachment(previewAttachment.id, previewAttachment.filename)}
                             className="bg-blue-600 hover:bg-blue-700 text-white"
                           >
                             <Download className="h-4 w-4 mr-2" />
                             Download File
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default TicketChat;