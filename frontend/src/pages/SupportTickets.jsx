import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Search, 
  Filter, 
  Plus,
  Reply,
  Archive,
  Tag,
  Calendar,
  Mail,
  Phone,
  Star,
  Eye,
  Edit3,
  Trash2,
  X,
  Send,
  RefreshCw
} from 'lucide-react';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Mock data for demonstration (replace with API calls)
  const mockTickets = [
    {
      id: 1,
      title: "Payment processing issue",
      description: "I'm trying to upgrade to premium but the payment keeps failing. I've tried multiple cards but nothing works.",
      user: {
        name: "John Doe",
        email: "john.doe@example.com",
        username: "johndoe"
      },
      status: "open",
      priority: "high",
      category: "billing",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T14:20:00Z",
      assigned_to: "Support Team",
      messages: [
        {
          id: 1,
          sender: "John Doe",
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
        },
        {
          id: 3,
          sender: "John Doe",
          message: "It says 'Payment declined' but my card has sufficient funds",
          timestamp: "2024-01-15T15:30:00Z",
          is_customer: true
        }
      ]
    },
    {
      id: 2,
      title: "Account access problem",
      description: "I cannot log into my account after password reset. The new password doesn't work.",
      user: {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        username: "janesmith"
      },
      status: "in_progress",
      priority: "medium",
      category: "account",
      created_at: "2024-01-14T09:15:00Z",
      updated_at: "2024-01-15T11:45:00Z",
      assigned_to: "Support Team",
      messages: [
        {
          id: 1,
          sender: "Jane Smith",
          message: "I reset my password but still can't log in",
          timestamp: "2024-01-14T09:15:00Z",
          is_customer: true
        },
        {
          id: 2,
          sender: "Support Agent",
          message: "I'll help you with this. Let me check your account status and reset your password manually.",
          timestamp: "2024-01-15T11:45:00Z",
          is_customer: false
        }
      ]
    },
    {
      id: 3,
      title: "Feature request for trading journal",
      description: "I would love to see more chart types in the trading journal. Currently only basic charts are available.",
      user: {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        username: "mikejohnson"
      },
      status: "closed",
      priority: "low",
      category: "feature",
      created_at: "2024-01-13T16:20:00Z",
      updated_at: "2024-01-15T08:30:00Z",
      assigned_to: "Support Team",
      messages: [
        {
          id: 1,
          sender: "Mike Johnson",
          message: "Would love to see more chart types in the trading journal",
          timestamp: "2024-01-13T16:20:00Z",
          is_customer: true
        },
        {
          id: 2,
          sender: "Support Agent",
          message: "Thank you for the suggestion! We're working on adding more chart types in the next update. I'll mark this as a feature request.",
          timestamp: "2024-01-15T08:30:00Z",
          is_customer: false
        },
        {
          id: 3,
          sender: "Mike Johnson",
          message: "Great! Looking forward to it. Thanks for the quick response.",
          timestamp: "2024-01-15T09:15:00Z",
          is_customer: true
        }
      ]
    },
    {
      id: 4,
      title: "App not loading on mobile",
      description: "The app crashes immediately when I try to open it on my iPhone. I've tried reinstalling but it doesn't help.",
      user: {
        name: "Sarah Wilson",
        email: "sarah.wilson@example.com",
        username: "sarahw"
      },
      status: "open",
      priority: "high",
      category: "technical",
      created_at: "2024-01-16T08:45:00Z",
      updated_at: "2024-01-16T08:45:00Z",
      assigned_to: "Support Team",
      messages: [
        {
          id: 1,
          sender: "Sarah Wilson",
          message: "The app crashes immediately when I try to open it on my iPhone. I've tried reinstalling but it doesn't help.",
          timestamp: "2024-01-16T08:45:00Z",
          is_customer: true
        }
      ]
    }
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/admin/support/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          toast.error('Failed to fetch tickets');
          // Fallback to mock data for demonstration
          setTickets(mockTickets);
        }
      } else {
        toast.error('Failed to fetch tickets');
        // Fallback to mock data for demonstration
        setTickets(mockTickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Error fetching tickets');
      // Fallback to mock data for demonstration
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const filterTickets = () => {
    let filtered = tickets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'open': 'destructive',
      'in_progress': 'secondary',
      'closed': 'outline',
      'pending': 'secondary'
    };
    
    const labels = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'pending': 'Pending'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline'
    };
    
    return (
      <Badge variant={variants[priority] || 'outline'}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category) => {
    const variants = {
      'billing': 'destructive',
      'account': 'secondary',
      'feature': 'outline',
      'technical': 'default'
    };
    
    return (
      <Badge variant={variants[category] || 'outline'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    setNewResponse('');
  };

  const closeTicketModal = () => {
    setSelectedTicket(null);
    setShowTicketModal(false);
    setNewResponse('');
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success(`Ticket status updated to ${newStatus}`);
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
      }
    } catch (error) {
      toast.error('Failed to update ticket status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, priority: newPriority, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success(`Ticket priority updated to ${newPriority}`);
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, priority: newPriority, updated_at: new Date().toISOString() }));
      }
    } catch (error) {
      toast.error('Failed to update ticket priority');
    } finally {
      setActionLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!newResponse.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMessage = {
        id: Date.now(),
        sender: "Support Agent",
        message: newResponse,
        timestamp: new Date().toISOString(),
        is_customer: false
      };
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                messages: [...ticket.messages, newMessage],
                updated_at: new Date().toISOString()
              }
            : ticket
        )
      );
      
      // Update selected ticket
      setSelectedTicket(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        updated_at: new Date().toISOString()
      }));
      
      setNewResponse('');
      toast.success('Response sent successfully');
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            View and respond to customer support requests
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Open Tickets</p>
                <p className="text-2xl font-bold text-red-600">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'closed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Support Tickets</CardTitle>
          <CardDescription>
            View and respond to customer support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tickets by title, description, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all-tickets">All Tickets ({filteredTickets.length})</TabsTrigger>
              <TabsTrigger value="open-tickets">Open ({tickets.filter(t => t.status === 'open').length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({tickets.filter(t => t.status === 'in_progress').length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({tickets.filter(t => t.status === 'closed').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all-tickets" className="space-y-4">
              <div className="grid gap-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicketModal(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{ticket.title}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            {getCategoryBadge(ticket.category)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>By: {ticket.user.name}</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                            <span>Messages: {ticket.messages.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="open-tickets" className="space-y-4">
              <div className="grid gap-4">
                {filteredTickets.filter(t => t.status === 'open').map((ticket) => (
                  <Card key={ticket.id} className="border-red-200 bg-red-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicketModal(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-red-900">{ticket.title}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            {getCategoryBadge(ticket.category)}
                          </div>
                          <p className="text-sm text-red-700 mb-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-red-600">
                            <span>By: {ticket.user.name}</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span>Messages: {ticket.messages.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="destructive" size="sm">
                            <Reply className="w-4 h-4 mr-2" />
                            Respond Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              <div className="grid gap-4">
                {filteredTickets.filter(t => t.status === 'in_progress').map((ticket) => (
                  <Card key={ticket.id} className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicketModal(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-blue-900">{ticket.title}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            {getCategoryBadge(ticket.category)}
                          </div>
                          <p className="text-sm text-blue-700 mb-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-blue-600">
                            <span>By: {ticket.user.name}</span>
                            <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                            <span>Messages: {ticket.messages.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Reply className="w-4 h-4 mr-2" />
                            Continue
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="closed" className="space-y-4">
              <div className="grid gap-4">
                {filteredTickets.filter(t => t.status === 'closed').map((ticket) => (
                  <Card key={ticket.id} className="border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicketModal(ticket)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-green-900">{ticket.title}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            {getCategoryBadge(ticket.category)}
                          </div>
                          <p className="text-sm text-green-700 mb-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-green-600">
                            <span>By: {ticket.user.name}</span>
                            <span>Resolved: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                            <span>Messages: {ticket.messages.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTicket.title}</span>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={selectedTicket.status} 
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                    disabled={actionLoading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedTicket.priority} 
                    onValueChange={(value) => handlePriorityChange(selectedTicket.id, value)}
                    disabled={actionLoading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={closeTicketModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
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
                <div className="mt-1">{getCategoryBadge(selectedTicket.category)}</div>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Customer Information</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm"><strong>Name:</strong> {selectedTicket.user.name}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedTicket.user.email}</p>
                <p className="text-sm"><strong>Username:</strong> {selectedTicket.user.username}</p>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Original Issue</Label>
              <p className="mt-1 text-sm text-muted-foreground">{selectedTicket.description}</p>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Conversation</Label>
              <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
                {selectedTicket.messages.map((message) => (
                  <div key={message.id} className={`p-3 rounded-md ${message.is_customer ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{message.sender}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Textarea 
                placeholder="Type your response to the customer..." 
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
