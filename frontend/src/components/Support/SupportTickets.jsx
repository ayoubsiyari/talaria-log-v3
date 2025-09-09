import { useState, useEffect } from 'react'
import notificationService from '../../services/notificationService'
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Edit,
  Eye,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Filter,
  RefreshCw,
  Download,
  Paperclip,
  ChevronDown,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../config/config'
import CreateTicketDialog from './CreateTicketDialog'
import ViewTicketDialog from './ViewTicketDialog'
import EditTicketDialog from './EditTicketDialog'
import TicketChat from './TicketChat'

const TICKET_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' }
]

const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const SupportTickets = ({ onNavigate }) => {
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTickets, setTotalTickets] = useState(0)
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewTicket, setViewTicket] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editTicket, setEditTicket] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [ticketsWithNewReplies, setTicketsWithNewReplies] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userType, setUserType] = useState('regular')
  
  // Chat
  const [chatTicket, setChatTicket] = useState(null)
  const [showChat, setShowChat] = useState(false)

  // Get user type to determine notification type
  const getUserType = () => {
    const storedUser = localStorage.getItem('user')
    const parsedUser = storedUser ? JSON.parse(storedUser) : null
    console.log('🔔 SupportTickets: User data from localStorage:', parsedUser)
    
    const isAdmin = parsedUser?.account_type === 'admin' || parsedUser?.is_admin
    const userType = isAdmin ? 'admin' : 'regular'
    console.log('🔔 SupportTickets: Detected user type:', userType, '(account_type:', parsedUser?.account_type, ', is_admin:', parsedUser?.is_admin, ')')
    
    return userType
  }

  // Load data
  useEffect(() => {
    const currentUserType = getUserType()
    setUserType(currentUserType)
    
    console.log('🔔 SupportTickets: Starting notification polling for user type:', currentUserType)
    
    try {
      // Start notification polling
      notificationService.startNotifications(({ unreadCount, ticketsWithReplies }) => {
        console.log('🔔 SupportTickets: Notification update received:', { 
          currentUserType, 
          unreadCount, 
          ticketsWithReplies,
          userType: currentUserType 
        })
        
        setUnreadCount(unreadCount)
        setTicketsWithNewReplies(ticketsWithReplies)
        
        // Additional logging for regular users
        if (currentUserType === 'regular') {
          console.log('🔔 SupportTickets: Regular user notification state updated:', {
            unreadCount,
            shouldShowNotification: unreadCount > 0
          })
        }
      })
      
      console.log('🔔 SupportTickets: Notification polling started successfully')
    } catch (error) {
      console.error('🔔 SupportTickets: Error starting notification polling:', error)
    }

    return () => {
      console.log('🔔 SupportTickets: Cleaning up notification polling')
      notificationService.stopNotifications()
    }
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 25,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
        ...(assignedFilter !== 'all' && { assigned_to: assignedFilter })
      })
      
      const response = await fetch(`${API_BASE_URL}/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalTickets(data.pagination?.total || 0)
      } else {
        throw new Error(`Failed to load tickets: ${response.status}`)
      }
    } catch (err) {
      console.error('Error loading tickets:', err)
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadAgents = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (err) {
      console.error('Error loading agents:', err)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadTickets()
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, assignedFilter])

  useEffect(() => {
    loadCategories()
    loadAgents()
    loadStats()
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    loadTickets()
  }

  const handleViewTicket = async (ticket) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticket.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setViewTicket(data.ticket)
        setViewDialogOpen(true)
        
        // Mark ticket as read for admin users if it has new replies
        if (userType === 'admin' && ticketsWithNewReplies.some(t => t.id === ticket.id)) {
          await handleMarkTicketAsRead(ticket.id)
        }
      } else {
        toast.error('Failed to load ticket details')
      }
    } catch (err) {
      console.error('Error loading ticket:', err)
      toast.error('Failed to load ticket details')
    }
  }

  const handleEditTicket = (ticket) => {
    setEditTicket(ticket)
    setEditDialogOpen(true)
  }

  const handleReply = (ticket) => {
    setViewTicket(ticket)
    setViewDialogOpen(true)
  }

  const handleChat = async (ticket) => {
    console.log('🔔 handleChat called with ticket:', ticket);
    
    // Check if we have a full ticket object or just notification data
    if (!ticket || !ticket.id) {
      console.error('🔔 Invalid ticket data:', ticket);
      toast.error('Invalid ticket data');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token')
      console.log('🔔 Fetching ticket details for ID:', ticket.id);
      
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticket.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔔 Ticket fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Ticket data received:', data);
        
        if (data.success && data.ticket) {
          setChatTicket(data.ticket)
          setShowChat(true)
          console.log('🔔 Chat state set - showChat:', true, 'chatTicket:', data.ticket);
          
          // Also mark this ticket as read since we're opening the chat
          try {
            await notificationService.markAsRead(ticket.id);
            // Remove this ticket from the notification list
            setTicketsWithNewReplies(prev => prev.filter(t => t.id !== ticket.id));
          } catch (error) {
            console.error('🔔 Error marking ticket as read:', error);
          }
        } else {
          console.error('🔔 Invalid ticket data in response:', data);
          toast.error('Invalid ticket data received');
        }
      } else {
        console.error('🔔 Failed to fetch ticket:', response.status, response.statusText);
        toast.error('Failed to load ticket details')
      }
    } catch (err) {
      console.error('🔔 Error loading ticket:', err)
      toast.error('Failed to load ticket details')
    }
  }

  const handleChangeStatus = async (ticket, newStatus) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        toast.success(`Ticket status changed to ${newStatus}`)
        loadTickets()
        loadStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to change status')
      }
    } catch (err) {
      console.error('Error changing status:', err)
      toast.error('Failed to change status')
    }
  }

  const handleTicketUpdated = () => {
    loadTickets()
    loadStats()
    setEditDialogOpen(false)
  }

  const handleTicketCreated = () => {
    loadTickets()
    loadStats()
    setCreateDialogOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setUnreadCount(0)
      setTicketsWithNewReplies([])
      toast.success('All messages marked as read')
    } catch (error) {
      console.error('Error marking messages as read:', error)
      toast.error('Failed to mark messages as read')
    }
  }

  const handleMarkTicketAsRead = async (ticketId) => {
    try {
      await notificationService.markAsRead(ticketId)
      // Remove the ticket from ticketsWithNewReplies
      setTicketsWithNewReplies(prev => prev.filter(ticket => ticket.id !== ticketId))
      toast.success('Ticket marked as read')
    } catch (error) {
      console.error('Error marking ticket as read:', error)
      toast.error('Failed to mark ticket as read')
    }
  }

  const testNotificationService = async () => {
    console.log('🔔 SupportTickets: Testing notification service manually...')
    try {
      const unreadCount = await notificationService.getUnreadMessageCount()
      const ticketsWithReplies = await notificationService.getTicketsWithNewReplies()
      
      console.log('🔔 SupportTickets: Manual test results:', {
        unreadCount,
        ticketsWithReplies,
        userType,
        currentUser: localStorage.getItem('user')
      })
      
      setUnreadCount(unreadCount)
      setTicketsWithNewReplies(ticketsWithReplies)
      
      toast.success(`Test completed: ${unreadCount} unread messages found`)
    } catch (error) {
      console.error('🔔 SupportTickets: Manual test failed:', error)
      toast.error('Notification test failed')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = TICKET_STATUSES.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = TICKET_PRIORITIES.find(p => p.value === priority)
    return (
      <Badge variant="outline" className={priorityConfig?.color || 'bg-gray-100 text-gray-800'}>
        {priorityConfig?.label || priority}
      </Badge>
    )
  }

  const getRatingStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />);
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
            {/* Notification indicator for regular users */}
            {userType === 'regular' && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="text-sm px-3 py-1 h-7 flex items-center animate-pulse cursor-pointer hover:bg-red-700"
                onClick={handleMarkAllAsRead}
                title="Click to mark all as read"
              >
                🔔 {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
            {/* Notification indicator for admin users */}
            {userType === 'admin' && ticketsWithNewReplies.length > 0 && (
              <div className="relative">
                <Badge 
                  variant="destructive" 
                  className="text-sm px-3 py-1 h-7 flex items-center animate-pulse cursor-pointer hover:bg-red-700"
                  onClick={() => {
                    // Open chat for the first ticket with new replies
                    const firstTicketWithReplies = ticketsWithNewReplies[0];
                    console.log('🔔 Notification badge clicked - firstTicketWithReplies:', firstTicketWithReplies);
                    if (firstTicketWithReplies) {
                      handleChat(firstTicketWithReplies);
                    }
                  }}
                  title={`Click to open chat for ${ticketsWithNewReplies.length} ticket${ticketsWithNewReplies.length > 1 ? 's' : ''} with new replies`}
                >
                  🔔 {ticketsWithNewReplies.length} ticket{ticketsWithNewReplies.length > 1 ? 's' : ''} with new replies
                  {ticketsWithNewReplies.length > 1 && (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </Badge>
                
                {/* Dropdown for multiple tickets */}
                {ticketsWithNewReplies.length > 1 && (
                  <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">Tickets with new replies:</p>
                      {ticketsWithNewReplies.slice(0, 5).map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handleChat(ticket)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ticket.subject}
                            </p>
                            <p className="text-xs text-gray-500">
                              #{ticket.ticket_number}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChat(ticket);
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {ticketsWithNewReplies.length > 5 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{ticketsWithNewReplies.length - 5} more tickets
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            Manage customer support tickets and inquiries
          </p>
          {/* Debug info for regular users */}
          {userType === 'regular' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p><strong>Debug Info:</strong> User Type: {userType} | Unread Count: {unreadCount} | Should Show: {unreadCount > 0 ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={loadTickets}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button 
            className="flex items-center space-x-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={async () => {
              console.log('🔔 Manual notification test...');
              
              // Check authentication
              const token = localStorage.getItem('access_token');
              const user = localStorage.getItem('user');
              const userData = user ? JSON.parse(user) : null;
              console.log('🔔 Auth check:', { 
                token: token ? 'Present' : 'Missing', 
                user: user ? 'Present' : 'Missing',
                userData: userData,
                accountType: userData?.account_type,
                isAdmin: userData?.is_admin,
                roles: userData?.roles || userData?.assigned_roles || []
              });
              
              try {
                const unreadCount = await notificationService.getUnreadMessageCount();
                const ticketsWithReplies = await notificationService.getTicketsWithNewReplies();
                console.log('🔔 Manual test results:', { unreadCount, ticketsWithReplies });
                setUnreadCount(unreadCount);
                setTicketsWithNewReplies(ticketsWithReplies);
                toast.success(`Test: ${unreadCount} unread, ${ticketsWithReplies.length} tickets with replies`);
              } catch (error) {
                console.error('🔔 Test failed:', error);
                toast.error(`Test failed: ${error.message}`);
              }
            }}
          >
            <span>🔔 Test Notifications</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Notification Card for Regular Users */}
          {userType === 'regular' && unreadCount > 0 && (
            <Card 
              className="border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={handleMarkAllAsRead}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Unread Messages</p>
                    <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                    <p className="text-xs text-red-600 mt-1">Click to mark all as read</p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-lg">🔔</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Notification Card for Admin Users */}
          {userType === 'admin' && ticketsWithNewReplies.length > 0 && (
            <Card 
              className="border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => {
                // Open chat for the first ticket with new replies
                const firstTicketWithReplies = ticketsWithNewReplies[0];
                console.log('🔔 Notification card clicked - firstTicketWithReplies:', firstTicketWithReplies);
                if (firstTicketWithReplies) {
                  handleChat(firstTicketWithReplies);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">New Replies</p>
                    <p className="text-2xl font-bold text-red-600">{ticketsWithNewReplies.length}</p>
                    <p className="text-xs text-red-600 mt-1">Click to open chat</p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-lg">🔔</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.total_tickets}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open_tickets + stats.in_progress_tickets}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue_tickets}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.unassigned_tickets}</p>
                </div>
                <User className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            Search and filter support tickets to manage customer inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tickets by subject, description, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {TICKET_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {TICKET_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No tickets found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="group">
                      <TableCell>
                        <div className="relative">
                          <div className="font-medium flex items-center gap-2">
                            {ticket.ticket_number}
                            {/* Notification badge for regular users with unread messages */}
                            {userType === 'regular' && unreadCount > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="text-xs px-2 py-0 h-5 flex items-center"
                              >
                                🔔 {unreadCount} new
                              </Badge>
                            )}
                            {/* Red dot indicator for admin users with new replies */}
                            {userType === 'admin' && ticketsWithNewReplies.some(t => t.id === ticket.id) && (
                              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {ticket.subject}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {ticket.message_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {ticket.message_count}
                              </Badge>
                            )}
                            {ticket.attachment_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {ticket.attachment_count}
                              </Badge>
                            )}
                            {ticket.is_overdue && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.user_name}</div>
                          <div className="text-sm text-muted-foreground">{ticket.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.assigned_admin ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {ticket.assigned_admin.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ticket.assigned_admin.username}</span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {ticket.category ? (
                          <Badge variant="outline" style={{ backgroundColor: ticket.category.color + '20', color: ticket.category.color }}>
                            {ticket.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getRatingStars(ticket.user_rating)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(ticket.created_at)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTicket(ticket)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReply(ticket)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChat(ticket)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Open Chat
                            </DropdownMenuItem>
                            {/* Mark as Read option for admin users with new replies */}
                            {userType === 'admin' && ticketsWithNewReplies.some(t => t.id === ticket.id) && (
                              <DropdownMenuItem onClick={() => handleMarkTicketAsRead(ticket.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleChangeStatus(ticket, 'in_progress')}>
                              <Clock className="mr-2 h-4 w-4" />
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(ticket, 'resolved')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(ticket, 'closed')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Close Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {tickets.length} of {totalTickets} tickets
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTicketCreated={handleTicketCreated}
        categories={categories}
        agents={agents}
      />

      <ViewTicketDialog
        ticket={viewTicket}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        agents={agents}
        onUpdate={(shouldReloadTickets = false, notificationData = null) => {
          // Only reload tickets if explicitly requested (e.g., after sending a reply)
          if (shouldReloadTickets) {
            loadTickets()
            loadStats()
          }
          
          // Update notification state - use provided data or fetch fresh data
          if (userType === 'admin') {
            console.log('🔔 SupportTickets: Updating notification state with data:', notificationData);
            if (notificationData) {
              // Use the provided notification data (immediate update)
              console.log('🔔 SupportTickets: Using provided notification data:', notificationData.ticketsWithReplies);
              setTicketsWithNewReplies(notificationData.ticketsWithReplies || []);
            } else {
              // Fetch fresh notification data
              console.log('🔔 SupportTickets: Fetching fresh notification data');
              notificationService.getTicketsWithNewReplies().then(ticketsWithReplies => {
                console.log('🔔 SupportTickets: Fresh notification data received:', ticketsWithReplies);
                setTicketsWithNewReplies(ticketsWithReplies)
              }).catch(error => {
                console.error('🔔 SupportTickets: Error refreshing notification state:', error)
              })
            }
          }
        }}
      />

      <EditTicketDialog
        ticket={editTicket}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTicketUpdated={handleTicketUpdated}
        categories={categories}
        agents={agents}
      />

      {/* Chat Interface */}
      {console.log('🔔 Rendering chat - showChat:', showChat, 'chatTicket:', chatTicket)}
      {showChat && chatTicket && (
        <TicketChat
          ticket={chatTicket}
          onClose={() => {
            setShowChat(false);
            setChatTicket(null);
          }}
                  onUpdate={(shouldReloadTickets = false, notificationData = null) => {
          // Only reload tickets if explicitly requested (e.g., after sending a message)
          if (shouldReloadTickets) {
            loadTickets();
            loadStats();
          }
          
          // Update notification state - use provided data or fetch fresh data
          if (userType === 'admin') {
            console.log('🔔 SupportTickets: Updating notification state with data:', notificationData);
            if (notificationData) {
              // Use the provided notification data (immediate update)
              console.log('🔔 SupportTickets: Using provided notification data:', notificationData.ticketsWithReplies);
              setTicketsWithNewReplies(notificationData.ticketsWithReplies || []);
            } else {
              // Fetch fresh notification data
              console.log('🔔 SupportTickets: Fetching fresh notification data');
              notificationService.getTicketsWithNewReplies().then(ticketsWithReplies => {
                console.log('🔔 SupportTickets: Fresh notification data received:', ticketsWithReplies);
                setTicketsWithNewReplies(ticketsWithReplies)
              }).catch(error => {
                console.error('🔔 SupportTickets: Error refreshing notification state:', error)
              })
            }
          }
        }}
        />
      )}
    </div>
  )
}

export default SupportTickets
