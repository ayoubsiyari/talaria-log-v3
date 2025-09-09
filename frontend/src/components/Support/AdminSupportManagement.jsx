import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  Reply, 
  CheckCircle, 
  Clock,
  AlertCircle,
  User,
  Mail,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  Plus,
  X,
  Send,
  Archive,
  Trash2
} from 'lucide-react';

const AdminSupportManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assigned_to: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock data for demonstration
  const mockTickets = [
    {
      id: 1,
      ticket_number: 'TKT-001',
      subject: 'Payment processing issue',
      description: 'I\'m trying to upgrade to premium but the payment keeps failing. I\'ve tried multiple cards but nothing works.',
      status: 'open',
      priority: 'high',
      category: 'billing',
      user_email: 'user1@example.com',
      user_name: 'John Doe',
      assigned_to: 'Support Team',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T14:20:00Z',
      messages: [
        {
          id: 1,
          sender: 'John Doe',
          message: 'I\'m trying to upgrade to premium but the payment keeps failing',
          timestamp: '2024-01-15T10:30:00Z',
          is_customer: true
        },
        {
          id: 2,
          sender: 'Support Agent',
          message: 'I can see the issue. Let me help you resolve this payment problem. Can you tell me what error message you\'re seeing?',
          timestamp: '2024-01-15T14:20:00Z',
          is_customer: false
        }
      ]
    },
    {
      id: 2,
      ticket_number: 'TKT-002',
      subject: 'Feature request for trading journal',
      description: 'I would love to see more chart types in the trading journal. Currently only basic charts are available.',
      status: 'in_progress',
      priority: 'medium',
      category: 'feature',
      user_email: 'user2@example.com',
      user_name: 'Jane Smith',
      assigned_to: 'Product Team',
      created_at: '2024-01-13T16:20:00Z',
      updated_at: '2024-01-15T08:30:00Z',
      messages: [
        {
          id: 1,
          sender: 'Jane Smith',
          message: 'I would love to see more chart types in the trading journal',
          timestamp: '2024-01-13T16:20:00Z',
          is_customer: true
        },
        {
          id: 2,
          sender: 'Product Team',
          message: 'Thank you for your feedback! We\'re working on adding more chart types in the next update.',
          timestamp: '2024-01-15T08:30:00Z',
          is_customer: false
        }
      ]
    },
    {
      id: 3,
      ticket_number: 'TKT-003',
      subject: 'Login issues',
      description: 'I cannot log into my account. It says invalid credentials but I know my password is correct.',
      status: 'resolved',
      priority: 'high',
      category: 'technical',
      user_email: 'user3@example.com',
      user_name: 'Mike Johnson',
      assigned_to: 'Support Team',
      created_at: '2024-01-12T09:15:00Z',
      updated_at: '2024-01-14T11:45:00Z',
      messages: [
        {
          id: 1,
          sender: 'Mike Johnson',
          message: 'I cannot log into my account. It says invalid credentials but I know my password is correct.',
          timestamp: '2024-01-12T09:15:00Z',
          is_customer: true
        },
        {
          id: 2,
          sender: 'Support Agent',
          message: 'I\'ve reset your password. Please check your email for the new login credentials.',
          timestamp: '2024-01-14T11:45:00Z',
          is_customer: false
        }
      ]
    }
  ];

  useEffect(() => {
    setTickets(mockTickets);
  }, []);

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

  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
          : ticket
      )
    );
  };

  const assignTicket = (ticketId, assignee) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assigned_to: assignee, updated_at: new Date().toISOString() }
          : ticket
      )
    );
  };

  const sendResponse = async () => {
    if (!newResponse.trim()) return;

    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = {
        id: Date.now(),
        sender: 'Support Agent',
        message: newResponse,
        timestamp: new Date().toISOString(),
        is_customer: false
      };

      setSelectedTicket(prev => ({
        ...prev,
        messages: [...prev.messages, response],
        updated_at: new Date().toISOString()
      }));

      setNewResponse('');
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
    setNewResponse('');
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.category !== 'all' && ticket.category !== filters.category) return false;
    if (filters.assigned_to !== 'all' && ticket.assigned_to !== filters.assigned_to) return false;
    if (filters.search && !ticket.subject.toLowerCase().includes(filters.search.toLowerCase()) && 
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !ticket.user_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    high_priority: tickets.filter(t => t.priority === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Management</h1>
          <p className="text-muted-foreground">Manage and respond to support tickets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats.high_priority}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Assigned To</Label>
              <Select value={filters.assigned_to} onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_to: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="Support Team">Support Team</SelectItem>
                  <SelectItem value="Product Team">Product Team</SelectItem>
                  <SelectItem value="Technical Team">Technical Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('asc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Ascending
            </Button>
            <Button
              variant={sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('desc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Descending
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({sortedTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedTickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{ticket.ticket_number} - {ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      {getCategoryBadge(ticket.category)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {ticket.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <span>Assigned to: {ticket.assigned_to}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => openTicketModal(ticket)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {sortedTickets.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedTicket.ticket_number} - {selectedTicket.subject}</h2>
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
                <div className="mt-1">{getCategoryBadge(selectedTicket.category)}</div>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm font-medium">Customer Information</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p><strong>Name:</strong> {selectedTicket.user_name}</p>
                <p><strong>Email:</strong> {selectedTicket.user_email}</p>
                <p><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
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

            <div className="flex items-center space-x-2 mb-4">
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

            <div className="flex gap-2">
              <Select value={selectedTicket.status} onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedTicket.assigned_to} onValueChange={(value) => assignTicket(selectedTicket.id, value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Support Team">Support Team</SelectItem>
                  <SelectItem value="Product Team">Product Team</SelectItem>
                  <SelectItem value="Technical Team">Technical Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportManagement;
