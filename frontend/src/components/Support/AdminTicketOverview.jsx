import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/config/config'
import ViewTicketDialog from './ViewTicketDialog'

const TICKET_STATUSES = {
  'resolved': { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  'pending': { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
}

const TICKET_PRIORITIES = {
  'low': { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-800' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-800' }
}

const AdminTicketOverview = ({ onNavigate }) => {
  const [resolvedTickets, setResolvedTickets] = useState([])
  const [pendingTickets, setPendingTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('resolved')
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  
  // Dialogs
  const [viewTicket, setViewTicket] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Load tickets by status
  const loadTickets = async (status) => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('access_token')
      const params = new URLSearchParams({
        status: status,
        per_page: 100,
        sort_by: status === 'resolved' ? 'resolved_at' : 'updated_at',
        sort_order: 'desc',
        ...(priorityFilter !== 'all' && { priority: priorityFilter })
      })
      
      const response = await fetch(`${API_BASE_URL}/support/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.tickets || []
      } else {
        throw new Error(`Failed to load ${status} tickets: ${response.status}`)
      }
    } catch (err) {
      console.error(`Error loading ${status} tickets:`, err)
      toast.error(`Failed to load ${status} tickets`)
      return []
    } finally {
      setLoading(false)
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
    const loadData = async () => {
      const [resolved, pending] = await Promise.all([
        loadTickets('resolved'),
        loadTickets('pending')
      ])
      setResolvedTickets(resolved)
      setPendingTickets(pending)
    }
    
    loadData()
    loadStats()
  }, [priorityFilter])

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
      } else {
        toast.error('Failed to load ticket details')
      }
    } catch (err) {
      console.error('Error loading ticket:', err)
      toast.error('Failed to load ticket details')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = TICKET_STATUSES[status]
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = TICKET_PRIORITIES[priority]
    return (
      <Badge variant="outline" className={priorityConfig?.color || 'bg-gray-100 text-gray-800'}>
        {priorityConfig?.label || priority}
      </Badge>
    )
  }

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

  const exportTickets = (tickets, status) => {
    const csvContent = [
      ['Ticket Number', 'Subject', 'Customer', 'Priority', 'Category', 'Assigned To', 'Date', 'Status'].join(','),
      ...tickets.map(ticket => [
        ticket.ticket_number,
        `"${ticket.subject}"`,
        `"${ticket.user_name} (${ticket.user_email})"`,
        ticket.priority,
        ticket.category?.name || 'No category',
        ticket.assigned_admin?.username || 'Unassigned',
        formatDate(status === 'resolved' ? ticket.resolved_at : ticket.updated_at),
        ticket.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${status}-tickets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const renderTicketTable = (tickets, status) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportTickets(tickets, status)}
            disabled={tickets.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>{status === 'resolved' ? 'Resolved' : 'Updated'}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No {status} tickets found.</p>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="group">
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.ticket_number}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.user_name}</div>
                      <div className="text-sm text-muted-foreground">{ticket.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(ticket.priority)}
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
                    {ticket.assigned_admin ? (
                      <div className="text-sm">
                        {ticket.assigned_admin.username}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDate(status === 'resolved' ? ticket.resolved_at : ticket.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Ticket Overview</h1>
          <p className="text-muted-foreground mt-2">
            Monitor resolved and pending support tickets
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Pending Response</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending_tickets || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                  <p className="text-2xl font-bold">{stats.avg_resolution_time || '0h'}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Overview</CardTitle>
          <CardDescription>
            Review resolved tickets and monitor pending responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Resolved ({resolvedTickets.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingTickets.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="resolved" className="mt-6">
              {renderTicketTable(resolvedTickets, 'resolved')}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-6">
              {renderTicketTable(pendingTickets, 'pending')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <ViewTicketDialog
        ticket={viewTicket}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        agents={[]}
      />
    </div>
  )
}

export default AdminTicketOverview
