import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Mail, 
  Phone,
  FileText,
  Clock,
  Users,
  ArrowRight,
  ExternalLink,
  Search,
  BookOpen,
  Video,
  Download,
  Plus,
  Eye,
  RefreshCw,
  X,
  Send,
  Reply,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Settings,
  User,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '../../services/supportService';
import notificationService from '../../services/notificationService';
import TicketChat from './TicketChat';

const HelpSupportPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('support');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [createTicketData, setCreateTicketData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '1'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userType, setUserType] = useState('regular');
  const [supportTicketSubTab, setSupportTicketSubTab] = useState('new');
  const [isSupportAgent, setIsSupportAgent] = useState(false);

  // Mock data for demonstration
  const mockTickets = [
    {
      id: 1,
      title: "Payment processing issue",
      description: "I'm trying to upgrade to premium but the payment keeps failing. I've tried multiple cards but nothing works.",
      status: "open",
      priority: "high",
      category: "billing",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T14:20:00Z",
      assigned_to: "Support Team",
      messages: [
        {
          id: 1,
          sender: "You",
          message: "I'm trying to upgrade to premium but the payment keeps failing",
          timestamp: "2024-01-15T10:30:00Z",
          is_customer: true
        },
        {
          id: 2,
          sender: "Support Agent",
          message: "I can see the issue. Let me help you resolve this payment problem. Can you tell me what error message you're seeing?",
          timestamp: "2024-01-15T14:20:00Z",
          is_customer: false
        }
      ]
    },
    {
      id: 2,
      title: "Feature request for trading journal",
      description: "I would love to see more chart types in the trading journal. Currently only basic charts are available.",
      status: "closed",
      priority: "low",
      category: "feature",
      created_at: "2024-01-13T16:20:00Z",
      updated_at: "2024-01-15T08:30:00Z",
      assigned_to: "Product Team",
      messages: [
        {
          id: 1,
          sender: "You",
          message: "I would love to see more chart types in the trading journal",
          timestamp: "2024-01-13T16:20:00Z",
          is_customer: true
        },
        {
          id: 2,
          sender: "Product Team",
          message: "Thank you for your feedback! We're working on adding more chart types in the next update.",
          timestamp: "2024-01-15T08:30:00Z",
          is_customer: false
        }
      ]
    }
  ];

  // Load tickets from backend
  const loadTickets = async () => {
    try {
      setLoading(true);
      
      let params = {};
      if (isSupportAgent) {
        // Support agents see different tickets based on sub-tab
        if (supportTicketSubTab === 'new') {
          params = { status: ['open', 'new', 'pending', 'unassigned'] }; // New tickets that haven't been assigned/worked on
        } else if (supportTicketSubTab === 'opened') {
          params = { status: ['in_progress', 'pending'] }; // Tickets being worked on
        }
      } else {
        // Regular users see their own tickets
        params = { user_only: true };
      }
      
      console.log('HelpSupportPage loadTickets params:', params);
      const response = await supportService.getTickets(params);
      console.log('HelpSupportPage loadTickets response:', response);
      if (response.data.success) {
        setTickets(response.data.tickets || []);
      } else {
        console.error('Failed to load tickets:', response.data.error);
        // Fallback to mock data if API fails
        setTickets(mockTickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      // Fallback to mock data if API fails
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  // Load categories from backend
  const loadCategories = async () => {
    try {
      const response = await supportService.getCategories();
      if (response.data.success) {
        setCategories(response.data.categories || []);
      } else {
        // Fallback to mock categories
        setCategories([
          { id: 1, name: 'Technical Support', description: 'Technical issues and bugs' },
          { id: 2, name: 'Billing & Payments', description: 'Payment and subscription issues' },
          { id: 3, name: 'Feature Requests', description: 'New feature suggestions' },
          { id: 4, name: 'Account Issues', description: 'Login and account problems' },
          { id: 5, name: 'General Questions', description: 'General inquiries' }
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to mock categories
      setCategories([
        { id: 1, name: 'Technical Support', description: 'Technical issues and bugs' },
        { id: 2, name: 'Billing & Payments', description: 'Payment and subscription issues' },
        { id: 3, name: 'Feature Requests', description: 'New feature suggestions' },
        { id: 4, name: 'Account Issues', description: 'Login and account problems' },
        { id: 5, name: 'General Questions', description: 'General inquiries' }
      ]);
    }
  };

  // Get user type to determine notification type
  const getUserType = () => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    console.log('User data:', parsedUser);
    const isAdmin = parsedUser?.account_type === 'admin' || parsedUser?.is_admin;
    return isAdmin ? 'admin' : 'regular';
  };

  useEffect(() => {
    const currentUserType = getUserType();
    setUserType(currentUserType);
    console.log('Current user type:', currentUserType);
    
    // Check if user is support agent
    const checkSupportAgentRole = () => {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('🔍 Debug - adminUser from localStorage:', adminUser);
      console.log('🔍 Debug - user from localStorage:', user);
      
      // Check multiple sources for support agent role
      let isAgent = false;
      
      // Check adminUser roles
      if (adminUser && adminUser.roles) {
        console.log('🔍 Debug - adminUser roles:', adminUser.roles);
        isAgent = adminUser.roles.some(role => 
          role.name === 'support_agent' || 
          role.name === 'support_team' || 
          role.name === 'system_administrator'
        );
      }
      
      // Check adminUser permissions
      if (adminUser && adminUser.permissions) {
        console.log('🔍 Debug - adminUser permissions:', adminUser.permissions);
        isAgent = isAgent || adminUser.permissions.some(permission => 
          permission.name === 'support.tickets.reply' ||
          permission.name === 'support.tickets.view'
        );
      }
      
      // Check user account_type and roles
      if (user && (user.account_type === 'admin' || user.is_admin)) {
        console.log('🔍 Debug - user is admin type');
        // If user is admin type, check if they have support-related roles
        if (user.roles) {
          console.log('🔍 Debug - user roles:', user.roles);
          isAgent = isAgent || user.roles.some(role => 
            role.name === 'support_agent' || 
            role.name === 'support_team' || 
            role.name === 'system_administrator'
          );
        }
      }
      
      setIsSupportAgent(isAgent);
      console.log('🔍 Debug - Final isSupportAgent result:', isAgent);
    };
    
    checkSupportAgentRole();
    
    // Start notification polling
    try {
      notificationService.startNotifications(({ unreadCount, ticketsWithReplies }) => {
        console.log('Notification update:', { unreadCount, ticketsWithReplies });
        setUnreadCount(unreadCount);
      });
    } catch (error) {
      console.error('Error starting notification polling:', error);
    }

    loadTickets();
    loadCategories();

    return () => {
      notificationService.stopNotifications();
    };
  }, []);

  // Reload tickets when sub-tab changes for support agents
  useEffect(() => {
    if (isSupportAgent) {
      loadTickets();
    }
  }, [supportTicketSubTab, isSupportAgent]);

  const getStatusBadge = (status) => {
    const variants = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'outline',
      closed: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
      urgent: 'destructive'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority.toUpperCase()}</Badge>;
  };

  const getCategoryBadge = (category) => {
    return <Badge variant="outline">{category.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      // Refresh tickets to update unread status
      await loadTickets();
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      toast.error('Failed to mark messages as read');
    }
  };

  const handleCreateTicket = async () => {
    if (!createTicketData.title || !createTicketData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      // Call the real API to create ticket
      const ticketData = {
        subject: createTicketData.title,
        description: createTicketData.description,
        priority: createTicketData.priority,
        category_id: parseInt(createTicketData.category)
      };

      console.log('HelpSupportPage creating ticket with data:', ticketData);
      const response = await supportService.createTicket(ticketData);
      console.log('HelpSupportPage ticket creation response:', response);
      
      if (response.data.success) {
        // Reload tickets to get the updated list from backend
        await loadTickets();
        setShowCreateTicket(false);
        setCreateTicketData({ title: '', description: '', priority: 'medium', category: '1' });
        toast.success('Ticket created successfully!');
        
        // Automatically switch to chat tab and open the new ticket
        setActiveTab('chat');
        
        // Find the newly created ticket and open chat
        setTimeout(async () => {
          try {
            const ticketsResponse = await supportService.getTickets({ user_only: true });
            if (ticketsResponse.data.success && ticketsResponse.data.tickets.length > 0) {
              const newTicket = ticketsResponse.data.tickets[0]; // Most recent ticket
              await openTicketChat(newTicket);
            }
          } catch (error) {
            console.error('Error opening chat for new ticket:', error);
          }
        }, 500);
      } else {
        toast.error(response.data.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    setActionLoading(true);
    try {
      // Call the real API to add message
      const messageData = {
        message: newResponse,
        is_customer: true
      };

      const response = await supportService.addMessage(selectedTicket.id, messageData);
      
      if (response.data.success) {
        // Reload the ticket to get updated messages
        const ticketResponse = await supportService.getTicket(selectedTicket.id);
        if (ticketResponse.data.success) {
          setSelectedTicket(ticketResponse.data.ticket);
        }
        setNewResponse('');
        toast.success('Response sent successfully!');
        
        // Also refresh the ticket list to show updated status
        await loadTickets();
      } else {
        toast.error(response.data.error || 'Failed to send response');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openTicketModal = async (ticket) => {
    try {
      // Load the full ticket data with messages
      console.log('Loading full ticket data for:', ticket.id);
      const response = await supportService.getTicket(ticket.id);
      console.log('Full ticket data response:', response);
      
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
        setShowTicketModal(true);
      } else {
        console.error('Failed to load ticket data:', response.data.error);
        toast.error('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error loading ticket data:', error);
      toast.error('Failed to load ticket details');
    }
  };

  const openTicketChat = async (ticket) => {
    try {
      // Load the full ticket data with messages
      console.log('Loading full ticket data for chat:', ticket.id);
      const response = await supportService.getTicket(ticket.id);
      console.log('Full ticket data response:', response);
      
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
        setShowChat(true);
      } else {
        console.error('Failed to load ticket data:', response.data.error);
        toast.error('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error loading ticket data:', error);
      toast.error('Failed to load ticket details');
    }
  };

  const handleAssignTicket = async (ticket) => {
    try {
      // Get current admin user ID
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (!adminUser.id) {
        toast.error('User not authenticated');
        return;
      }

      // Update ticket status to in_progress and assign to current user
      const response = await supportService.updateTicket(ticket.id, {
        status: 'in_progress',
        assigned_to: adminUser.id
      });

      if (response.data.success) {
        toast.success('Ticket assigned successfully!');
        // Reload tickets to reflect changes
        await loadTickets();
      } else {
        toast.error(response.data.error || 'Failed to assign ticket');
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
    setNewResponse('');
  };

  const filteredTickets = tickets.filter(ticket => {
    // First filter by search query
    const matchesSearch = (ticket.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (ticket.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Then filter by support agent sub-tab if applicable
    if (isSupportAgent) {
      if (supportTicketSubTab === 'new') {
        return matchesSearch && ticket.status === 'open';
      } else if (supportTicketSubTab === 'opened') {
        return matchesSearch && ['in_progress', 'pending'].includes(ticket.status);
      }
    }
    
    // For regular users, just filter by search
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold relative">
              Help & Support
              {/* Red dot indicator for new tickets (support agents only) */}
              {isSupportAgent && tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              {/* Blue dot indicator for tickets with new replies (support agents only) */}
              {isSupportAgent && tickets.filter(t => 
                t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0
              ).length > 0 && (
                <div className="absolute -top-1 -right-6 w-4 h-4 bg-blue-500 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </h1>
            {/* Enhanced notification indicator for regular users */}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="text-sm px-3 py-1 h-7 flex items-center animate-pulse cursor-pointer hover:bg-red-700"
                onClick={handleMarkAllAsRead}
                title="Click to mark all as read"
              >
                🔔 {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Get help with your account, report issues, or request new features</p>
        </div>
        <Button onClick={() => setShowCreateTicket(true)} className="flex items-center gap-2 relative">
          <Plus className="h-4 w-4" />
          Create Ticket
          {/* Red dot indicator for new tickets (support agents only) */}
          {isSupportAgent && tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
          {/* Blue dot indicator for tickets with new replies (support agents only) */}
          {isSupportAgent && tickets.filter(t => 
            t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0
          ).length > 0 && (
            <div className="absolute -top-1 -right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="support" className="relative">
            Support Tickets
            {/* Red dot for new tickets */}
            {isSupportAgent && tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
            {/* Blue dot for tickets with new replies */}
            {isSupportAgent && tickets.filter(t => 
              t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0
            ).length > 0 && (
              <div className="absolute -top-1 -right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="help">Help Center</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Support Tickets Tab */}
        <TabsContent value="support" className="space-y-6">
                    {/* Support Agent Sub-tab Navigation */}
          {isSupportAgent && (
            <Card>
              <CardContent className="p-4">
                <Tabs value={supportTicketSubTab} onValueChange={setSupportTicketSubTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new" className="flex items-center gap-2 relative">
                      <AlertCircle className="h-4 w-4" />
                      New Tickets ({tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length})
                      {tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="opened" className="flex items-center gap-2 relative">
                      <Clock className="h-4 w-4" />
                      Opened Tickets ({tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).length})
                      {tickets.filter(t => ['in_progress', 'pending'].includes(t.status) && 
                        t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0).length > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}
          
          {/* Agent Workload Statistics */}
          {isSupportAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agent Workload Statistics
                </CardTitle>
                <CardDescription>
                  Real-time overview of your support workload and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* New Tickets */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length}
                    </div>
                    <div className="text-sm text-red-700 font-medium">New Tickets</div>
                    <div className="text-xs text-red-600 mt-1">Require attention</div>
                  </div>
                  
                  {/* In Progress */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">In Progress</div>
                    <div className="text-xs text-blue-600 mt-1">Being worked on</div>
                  </div>
                  
                  {/* New Replies */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {tickets.filter(t => 
                        t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0
                      ).length}
                    </div>
                    <div className="text-sm text-orange-700 font-medium">New Replies</div>
                    <div className="text-xs text-orange-600 mt-1">Need follow-up</div>
                  </div>
                  
                  {/* Resolved Today */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {tickets.filter(t => 
                        t.status === 'resolved' && 
                        t.updated_at && 
                        new Date(t.updated_at).toDateString() === new Date().toDateString()
                      ).length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Resolved Today</div>
                    <div className="text-xs text-green-600 mt-1">Completed today</div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Response Time */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Avg Response Time</h4>
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const responseTimes = tickets
                          .filter(t => t.messages && t.messages.length > 1)
                          .map(t => {
                            const firstMessage = t.messages[0];
                            const firstReply = t.messages.find(m => !m.is_customer);
                            if (firstReply) {
                              return new Date(firstReply.created_at) - new Date(firstMessage.created_at);
                            }
                            return null;
                          })
                          .filter(time => time !== null);
                        
                        if (responseTimes.length === 0) return 'N/A';
                        
                        const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
                        const hours = Math.floor(avgTime / (1000 * 60 * 60));
                        const minutes = Math.floor((avgTime % (1000 * 60 * 60)) / (1000 * 60));
                        
                        if (hours > 0) return `${hours}h ${minutes}m`;
                        return `${minutes}m`;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">First response time</div>
                  </div>
                  
                  {/* Resolution Rate */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Resolution Rate</h4>
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const totalTickets = tickets.length;
                        const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
                        if (totalTickets === 0) return '0%';
                        return `${Math.round((resolvedTickets / totalTickets) * 100)}%`;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Tickets resolved</div>
                  </div>
                  
                  {/* Customer Satisfaction */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Satisfaction</h4>
                      <Star className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const ratedTickets = tickets.filter(t => t.rating);
                        if (ratedTickets.length === 0) return 'N/A';
                        
                        const avgRating = ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTickets.length;
                        return `${avgRating.toFixed(1)}/5`;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Average rating</div>
                  </div>
                </div>
                
                {/* Workload Distribution */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Workload Distribution</h4>
                  <div className="space-y-3">
                    {/* Priority Distribution */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">High Priority</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ 
                              width: `${tickets.length > 0 ? (tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length / tickets.length) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Category Distribution */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Technical Issues</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${tickets.length > 0 ? (tickets.filter(t => t.category?.name === 'Technical Support').length / tickets.length) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tickets.filter(t => t.category?.name === 'Technical Support').length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Distribution */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Open vs Resolved</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${tickets.length > 0 ? (tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length / tickets.length) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}/{tickets.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Debug Info - Remove this after testing */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="text-sm">
                <p><strong>🔍 Debug Info:</strong></p>
                <p>isSupportAgent: {isSupportAgent ? '✅ TRUE' : '❌ FALSE'}</p>
                <p>supportTicketSubTab: {supportTicketSubTab}</p>
                <p>User Type: {userType}</p>
                <p>Total Tickets: {tickets.length}</p>
                <p>Open Tickets: {tickets.filter(t => t.status === 'open').length}</p>
                <p>In Progress Tickets: {tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).length}</p>
                
                {/* Dot Indicator Legend */}
                {isSupportAgent && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p><strong>🎯 Dot Indicators:</strong></p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs">Red = New tickets (never opened)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">Blue = Tickets with new replies</span>
                    </div>
                    
                    {/* Ticket Status Debug */}
                    <div className="mt-3 pt-2 border-t border-orange-200">
                      <p><strong>🔍 Ticket Status Debug:</strong></p>
                      <p className="text-xs">All ticket statuses: {tickets.map(t => t.status).join(', ')}</p>
                      <p className="text-xs">New tickets (open/new/pending/unassigned): {tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length}</p>
                      <p className="text-xs">New ticket IDs: {tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).map(t => t.id).join(', ')}</p>
                      <p className="text-xs">First ticket data: {JSON.stringify(tickets[0]?.status || 'No tickets')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          


          {/* Notification summary card for regular users */}
          {!isSupportAgent && unreadCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Unread Messages</p>
                    <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                    <p className="text-xs text-red-600 mt-1">New replies from support team</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-lg">🔔</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-red-600 border-red-300 hover:bg-red-100"
                    >
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isSupportAgent ? (
                  <>
                    {supportTicketSubTab === 'new' ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        New Tickets Requiring Attention
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-green-600" />
                        Tickets Being Worked On
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    My Support Tickets
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isSupportAgent 
                  ? (supportTicketSubTab === 'new' 
                      ? 'Tickets that have just been created and need to be assigned or responded to' 
                      : 'Tickets currently being handled by support agents')
                  : 'View and manage your support requests'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

                            {/* Separate Ticket Lists for Support Agents */}
              {isSupportAgent ? (
                <Tabs value={supportTicketSubTab} onValueChange={setSupportTicketSubTab} className="w-full">
                  <TabsContent value="new" className="space-y-4">
                    {/* New Tickets Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
                      {/* Red dot indicator for new tickets section */}
                      {tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).length > 0 && (
                        <div className="absolute top-3 right-3 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900">New Tickets Requiring Attention</h4>
                            <p className="text-sm text-blue-700">
                              These tickets have just been created and need to be assigned or responded to.
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          {tickets.filter(t => t.status === 'open').length} New
                        </Badge>
                      </div>
                    </div>
                    
                    {/* New Tickets List */}
                    <div className="space-y-3">
                      {tickets.filter(t => t.status === 'open').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No New Tickets</h3>
                          <p className="text-sm">All tickets have been assigned or are being worked on.</p>
                        </div>
                      ) : (
                        tickets.filter(t => ['open', 'new', 'pending', 'unassigned'].includes(t.status)).map((ticket) => (
                          <div key={ticket.id} className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors bg-blue-50/30 relative">
                            {/* Red dot indicator for new tickets */}
                            <div className="absolute top-3 left-3 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            
                            {/* Blue dot indicator for tickets with new replies */}
                            {ticket.messages && ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0 && (
                              <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                            
                            {/* Debug info for this ticket */}
                            <div className="absolute top-3 left-8 text-xs text-red-600 font-bold">
                              DEBUG: {ticket.status}
                            </div>
                            
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{ticket.subject || 'No Subject'}</h3>
                                    <Badge variant="destructive" className="text-xs px-2 py-0 h-5 flex items-center">
                                      🆕 NEW
                                    </Badge>
                                  </div>
                                  {getStatusBadge(ticket.status)}
                                  {getPriorityBadge(ticket.priority)}
                                  {getCategoryBadge(ticket.category?.name || 'general')}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{ticket.description || 'No description'}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Unknown'}</span>
                                  <span>Updated: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Unknown'}</span>
                                  <span>Assigned to: {ticket.assigned_to || 'Unassigned'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openTicketChat(ticket)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleAssignTicket(ticket)}
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                >
                                  <User className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openTicketModal(ticket)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="opened" className="space-y-4">
                    {/* Opened Tickets Section */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 relative">
                      {/* Blue dot indicator for tickets with new replies */}
                      {tickets.filter(t => ['in_progress', 'pending'].includes(t.status) && 
                        t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0).length > 0 && (
                        <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900">Tickets Being Worked On</h4>
                            <p className="text-sm text-green-700">
                              These tickets are currently being handled by support agents.
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          {tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).length} In Progress
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Opened Tickets List */}
                    <div className="space-y-3">
                      {tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="h-8 w-8 text-green-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No Opened Tickets</h3>
                          <p className="text-sm">No tickets are currently in progress.</p>
                        </div>
                        ) : (
                        tickets.filter(t => ['in_progress', 'pending'].includes(t.status)).map((ticket) => (
                          <div key={ticket.id} className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors bg-green-50/30 relative">
                            {/* Blue dot indicator for tickets with new replies */}
                            {ticket.messages && ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0 && (
                              <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                            
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{ticket.subject || 'No Subject'}</h3>
                                    <Badge variant="outline" className="text-xs px-2 py-0 h-5 flex items-center bg-green-100 text-green-700">
                                      ⏳ IN PROGRESS
                                    </Badge>
                                  </div>
                                  {getStatusBadge(ticket.status)}
                                  {getPriorityBadge(ticket.priority)}
                                  {getCategoryBadge(ticket.category?.name || 'general')}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{ticket.description || 'No description'}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Unknown'}</span>
                                  <span>Updated: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Unknown'}</span>
                                  <span>Assigned to: {ticket.assigned_to || 'Unassigned'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openTicketChat(ticket)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openTicketModal(ticket)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Regular User Ticket List */
                <div className="space-y-3">
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Support Tickets</h3>
                      <p className="text-sm">You haven't created any support tickets yet.</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{ticket.subject || 'No Subject'}</h3>
                                {/* Simple notification badge */}
                                {ticket.messages && ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0 && (
                                  <Badge 
                                    variant="destructive" 
                                    className="text-xs px-2 py-0 h-5 flex items-center"
                                  >
                                    🔔 {ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length} new
                                  </Badge>
                                )}
                              </div>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              {getCategoryBadge(ticket.category?.name || 'general')}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{ticket.description || 'No description'}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Unknown'}</span>
                              <span>Updated: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Unknown'}</span>
                              <span>Assigned to: {ticket.assigned_to || 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openTicketModal(ticket)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-4" />
                    Live Chat
                  </CardTitle>
                  <CardDescription>
                    Quick access to your active conversations and support team
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateTicket(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Conversation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your First Support Chat</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Create a support ticket to start chatting with our support team. We're here to help you with any questions or issues you may have.
                  </p>
                  <Button onClick={() => setShowCreateTicket(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Start New Conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
                      <div className="text-sm text-blue-700">Active Tickets</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                      </div>
                      <div className="text-sm text-green-700">In Progress</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {tickets.filter(t => t.messages && t.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0).length}
                      </div>
                      <div className="text-sm text-orange-700">New Replies</div>
                    </div>
                  </div>

                  {/* Active Conversations */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Conversations</h3>
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{ticket.subject || 'No Subject'}</h3>
                              {ticket.messages && ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length > 0 && (
                                <Badge variant="destructive" className="text-xs px-2 py-0 h-5 flex items-center">
                                  🔔 {ticket.messages.filter(m => m.is_admin_reply && !m.read_at).length} new
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <span>Status: {ticket.status?.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>Priority: {ticket.priority}</span>
                              <span>•</span>
                              <span>{ticket.message_count || 0} messages</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last updated: {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                          <Button 
                            onClick={() => openTicketChat(ticket)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Continue Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('support')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View All Tickets
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('help')}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Help Center
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('contact')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Info
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Center Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn the basics of using our trading journal platform
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Watch step-by-step video tutorials
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Videos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Download user guides and documentation
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Us Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Send us an email and we'll get back to you within 24 hours
                </p>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Call us for immediate assistance
                </p>
                <p className="text-lg font-semibold mb-4">+1 (555) 123-4567</p>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with our support team in real-time
                </p>
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">How do I create a trading journal entry?</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Trading Journal section and click "Add Entry". Fill in the trade details including entry/exit prices, position size, and notes.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Can I export my trading data?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can export your trading data in CSV format. Go to Settings &gt; Data Export to download your trading history.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">How do I upgrade my subscription?</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit the Subscription page in your account settings to view available plans and upgrade options.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create Support Ticket</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateTicket(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={createTicketData.title}
                  onChange={(e) => setCreateTicketData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={createTicketData.description}
                  onChange={(e) => setCreateTicketData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about your issue..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={createTicketData.priority} onValueChange={(value) => setCreateTicketData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={createTicketData.category} onValueChange={(value) => setCreateTicketData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket} disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedTicket.subject || 'No Subject'}</h2>
              <Button variant="ghost" size="sm" onClick={closeTicketModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <div className="mt-1">{getCategoryBadge(selectedTicket.category?.name || 'general')}</div>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Your Original Issue</Label>
              <p className="mt-1 text-sm text-muted-foreground">{selectedTicket.description || 'No description'}</p>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Conversation</Label>
              <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
                {selectedTicket.messages?.map((message) => (
                  <div key={message.id} className={`p-3 rounded-md ${!message.is_admin_reply ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{message.author_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {message.created_at ? new Date(message.created_at).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm">{message.message || 'No message content'}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="flex items-center space-x-2">
                <Textarea 
                  placeholder="Type your response..." 
                  className="flex-1" 
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                />
                <Button onClick={sendResponse} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedTicket.status === 'closed' && (
              <div className="bg-green-50 p-4 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    This ticket has been resolved. If you have a new issue, please create a new ticket.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {showChat && selectedTicket && (
        <TicketChat
          ticket={selectedTicket}
          onClose={() => {
            setShowChat(false);
            setSelectedTicket(null);
          }}
          onUpdate={(refresh, data) => {
            if (refresh) {
              loadTickets();
            }
          }}
        />
      )}
    </div>
  );
};

export default HelpSupportPage;
