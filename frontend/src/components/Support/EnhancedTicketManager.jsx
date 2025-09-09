import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Tag,
  Star,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Settings,
  Bell,
  Mail,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useRealtimeNotifications from '@/hooks/useRealtimeNotifications';
import EnhancedNotificationCenter from '@/components/Notifications/EnhancedNotificationCenter';

const EnhancedTicketManager = ({ 
  userType = 'admin', // 'admin' or 'user'
  className = "" 
}) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [bulkActions, setBulkActions] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const autoRefreshRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Real-time notifications
  const {
    isConnected,
    connectionStatus,
    lastNotification,
    connect,
    disconnect,
    subscribe,
    unsubscribe
  } = useRealtimeNotifications({
    onNotification: handleRealtimeNotification,
    onConnectionChange: handleConnectionChange
  });

  // Load tickets on mount and when filters change
  useEffect(() => {
    loadTickets();
    loadStats();
    
    if (autoRefresh) {
      startAutoRefresh();
    }

    // Subscribe to ticket notifications
    if (isConnected) {
      subscribe(['ticket_created', 'ticket_updated', 'ticket_reply']);
    }

    return () => {
      stopAutoRefresh();
      if (isConnected) {
        unsubscribe(['ticket_created', 'ticket_updated', 'ticket_reply']);
      }
    };
  }, [filters, sortBy, sortOrder, page, isConnected]);

  const startAutoRefresh = () => {
    stopAutoRefresh();
    autoRefreshRef.current = setInterval(() => {
      loadTickets();
      loadStats();
    }, 30000); // Refresh every 30 seconds
  };

  const stopAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  };

  const loadTickets = async (resetPage = true) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 20,
        sort_by: sortBy,
        sort_order: sortOrder,
        user_only: userType === 'user' ? 'true' : 'false',
        ...filters
      });

      const response = await fetch(`/api/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (resetPage) {
            setTickets(data.tickets);
            setPage(1);
          } else {
            setTickets(prev => [...prev, ...data.tickets]);
          }
          setHasMore(data.pagination.has_next);
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/support/stats', {
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

  const handleRealtimeNotification = (notification) => {
    // Handle real-time ticket notifications
    if (notification.notification_metadata?.notification_type === 'ticket_reply') {
      // Refresh tickets when there's a new reply
      loadTickets();
    } else if (notification.notification_metadata?.notification_type === 'ticket_created') {
      // Add new ticket to the list
      setTickets(prev => [notification.notification_metadata.ticket, ...prev]);
    }
  };

  const handleConnectionChange = (status) => {
    console.log('🔔 Notification connection status:', status);
  };

  const handleSearch = (value) => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 500);
  };

  const handleBulkAction = async (action) => {
    if (selectedTickets.size === 0) {
      toast.error('Please select tickets first');
      return;
    }

    try {
      const response = await fetch('/api/support/tickets/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          ticket_ids: Array.from(selectedTickets)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${action} completed for ${selectedTickets.size} tickets`);
          setSelectedTickets(new Set());
          setShowBulkActions(false);
          loadTickets();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const exportTickets = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({
        format: format,
        ...filters
      });

      const response = await fetch(`/api/support/tickets/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Tickets exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error exporting tickets:', error);
      toast.error('Failed to export tickets');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      in_progress: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      pending: { variant: 'outline', color: 'bg-gray-100 text-gray-800' },
      resolved: { variant: 'outline', color: 'bg-green-100 text-green-800' },
      closed: { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };
    
    const config = variants[status] || variants.open;
    return (
      <Badge className={cn("text-xs", config.color)}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-blue-100 text-blue-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      urgent: { color: 'bg-red-100 text-red-800' }
    };
    
    const config = variants[priority] || variants.medium;
    return (
      <Badge className={cn("text-xs", config.color)}>
        {priority.toUpperCase()}
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

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.category !== 'all' && ticket.category_id !== parseInt(filters.category)) return false;
    if (filters.assignedTo !== 'all' && ticket.assigned_to !== parseInt(filters.assignedTo)) return false;
    if (filters.search && !ticket.subject.toLowerCase().includes(filters.search.toLowerCase()) && 
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-600">
            Manage and track support requests
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Real-time connection indicator */}
          <div className="flex items-center gap-1 text-xs">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Notification Center */}
          <EnhancedNotificationCenter
            isOpen={showNotificationCenter}
            onClose={setShowNotificationCenter}
          />

          {/* Create Ticket Button */}
          {userType === 'user' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          )}

          {/* Export Button */}
          {userType === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportTickets('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTickets('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTickets('xlsx')}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total_tickets || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open_tickets || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved_today || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.avg_response_time ? `${Math.round(stats.avg_response_time)}h` : 'N/A'}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                </SelectContent>
              </Select>

              {userType === 'admin' && (
                <Select value={filters.assignedTo} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="me">Assigned to Me</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTickets(true)}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setAutoRefresh(!autoRefresh)}>
                    <div className="flex items-center gap-2">
                      <Switch checked={autoRefresh} className="scale-75" />
                      Auto-refresh
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBulkActions(!showBulkActions)}>
                    Bulk Actions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedTickets.size} tickets selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTickets(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('close')}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading tickets...</span>
          </div>
        )}

        {!loading && filteredTickets.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500">
                {filters.search || Object.values(filters).some(f => f !== 'all')
                  ? 'No tickets match your filters'
                  : 'No tickets have been created yet'}
              </p>
            </CardContent>
          </Card>
        )}

        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              selectedTickets.has(ticket.id) && "ring-2 ring-blue-500"
            )}
            onClick={() => {
              if (showBulkActions) {
                const newSelected = new Set(selectedTickets);
                if (newSelected.has(ticket.id)) {
                  newSelected.delete(ticket.id);
                } else {
                  newSelected.add(ticket.id);
                }
                setSelectedTickets(newSelected);
              } else {
                setSelectedTicket(ticket);
                setShowTicketDialog(true);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedTickets.has(ticket.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedTickets);
                          if (e.target.checked) {
                            newSelected.add(ticket.id);
                          } else {
                            newSelected.delete(ticket.id);
                          }
                          setSelectedTickets(newSelected);
                        }}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.user_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(ticket.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.message_count || 0} replies
                        </div>
                        {ticket.is_overdue && (
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                      setShowTicketDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDialog(true);
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        // Navigate to ticket chat
                        setSelectedTicket(ticket);
                        setShowTicketDialog(true);
                      }}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        // Copy ticket link
                        navigator.clipboard.writeText(`${window.location.origin}/tickets/${ticket.id}`);
                        toast.success('Ticket link copied to clipboard');
                      }}>
                        <Tag className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {hasMore && !loading && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setPage(prev => prev + 1);
                loadTickets(false);
              }}
              disabled={loading}
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Ticket Dialog */}
      {selectedTicket && (
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket.ticket_number} • Created {formatTime(selectedTicket.created_at)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="mt-1 text-sm">{selectedTicket.user_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <div className="mt-1 text-sm">
                    {selectedTicket.assigned_admin?.full_name || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reply
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                {userType === 'admin' && (
                  <>
                    <Button variant="outline" size="sm">
                      <User className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                    <Button variant="outline" size="sm">
                      <Tag className="w-4 h-4 mr-2" />
                      Change Status
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedTicketManager;
