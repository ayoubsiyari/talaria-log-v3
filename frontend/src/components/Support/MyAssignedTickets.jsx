import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supportService } from '@/services/supportService';
import { format } from 'date-fns';
import { Clock, MessageSquare, FileText, User, AlertCircle, CheckCircle, XCircle, Send, Paperclip, Download, Eye, X, RefreshCw } from 'lucide-react';
import TicketChat from './TicketChat';

const MyAssignedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);


  useEffect(() => {
    loadMyAssignedTickets();
  }, []);

  const loadMyAssignedTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getTickets({ assigned_to: 'me' });
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Error loading assigned tickets:', error);
      toast.error('Failed to load assigned tickets');
    } finally {
      setLoading(false);
    }
  };

  const openTicketChat = async (ticket) => {
    try {
      // Load the full ticket data with messages
      console.log('Loading full ticket data for chat:', ticket.id);
      const response = await supportService.getTicket(ticket.id);
      console.log('Full ticket data response:', response);
      
      if (response.data.success) {
        setFullTicketData(response.data.ticket);
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

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const response = await supportService.addMessage(selectedTicket.id, {
        message: replyMessage,
        is_internal: false
      });

      if (response.data.success) {
        toast.success('Reply sent successfully');
        setReplyMessage('');
        setShowTicketDialog(false);
        loadMyAssignedTickets(); // Refresh to get updated message count
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await supportService.updateTicket(ticketId, { status: newStatus });
      if (response.data.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        loadMyAssignedTickets();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleTicketSelection = (ticketId, checked) => {
    if (checked) {
      setSelectedTickets(prev => [...prev, ticketId]);
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map(ticket => ticket.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTickets.length} ticket(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await supportService.bulkDelete(selectedTickets);
      if (response.data.success) {
        toast.success(`Successfully deleted ${selectedTickets.length} ticket(s)`);
        setSelectedTickets([]);
        loadMyAssignedTickets();
      }
    } catch (error) {
      console.error('Error deleting tickets:', error);
      toast.error('Failed to delete tickets');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });



  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold">My Assigned Tickets</h1>
           <p className="text-muted-foreground">Manage tickets assigned to you</p>
         </div>
         <div className="flex gap-2">
           {selectedTickets.length > 0 && (
             <Button
               variant="destructive"
               onClick={handleBulkDelete}
               disabled={isDeleting}
             >
               {isDeleting ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                   Deleting...
                 </>
               ) : (
                 <>
                   <XCircle className="h-4 w-4 mr-2" />
                   Delete Selected ({selectedTickets.length})
                 </>
               )}
             </Button>
           )}
           <Button onClick={loadMyAssignedTickets} variant="outline">
             Refresh
           </Button>
         </div>
       </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-sm text-muted-foreground">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
          </div>
        </CardContent>
      </Card>

             {/* Bulk Actions */}
       {selectedTickets.length > 0 && (
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">
                   {selectedTickets.length} ticket(s) selected
                 </span>
               </div>
               <div className="flex gap-2">
                 <Button
                   variant="destructive"
                   size="sm"
                   onClick={handleBulkDelete}
                   disabled={isDeleting}
                 >
                   {isDeleting ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Deleting...
                     </>
                   ) : (
                     <>
                       <XCircle className="h-4 w-4 mr-2" />
                       Delete Selected ({selectedTickets.length})
                     </>
                   )}
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {/* Tickets Table */}
       <Card>
         <CardHeader>
           <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
         </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found matching your criteria
            </div>
          ) : (
                         <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-12">
                     <Checkbox
                       checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                       onCheckedChange={handleSelectAll}
                     />
                   </TableHead>
                   <TableHead>Ticket #</TableHead>
                   <TableHead>Subject</TableHead>
                   <TableHead>Customer</TableHead>
                   <TableHead>Priority</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Messages</TableHead>
                   <TableHead>Created</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                                 {filteredTickets.map((ticket) => (
                   <TableRow key={ticket.id}>
                     <TableCell>
                       <Checkbox
                         checked={selectedTickets.includes(ticket.id)}
                         onCheckedChange={(checked) => handleTicketSelection(ticket.id, checked)}
                       />
                     </TableCell>
                     <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{ticket.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {ticket.message_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTicketChat(ticket)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketDialog(true);
                          }}
                        >
                          View
                        </Button>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.ticket_number} - {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription>
              Assigned to you on {selectedTicket && format(new Date(selectedTicket.created_at), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm font-medium">{selectedTicket.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm">{selectedTicket.category?.name || 'Uncategorized'}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{format(new Date(selectedTicket.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">{format(new Date(selectedTicket.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Messages</Label>
                  <p className="text-sm">{selectedTicket.message_count || 0} messages</p>
                </div>
                <div>
                  <Label>Ticket Number</Label>
                  <p className="text-sm font-mono">{selectedTicket.ticket_number}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Messages */}
              <div>
                <Label>Messages</Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {selectedTicket.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.is_admin_reply ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {message.is_admin_reply ? 'You' : selectedTicket.user_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div>
                <Label htmlFor="reply">Add Reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => openTicketChat(selectedTicket)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
            <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
              Close
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyMessage.trim() || sendingReply}
            >
              {sendingReply ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Ticket Chat */}
      {showChat && fullTicketData && (
        <TicketChat
          ticket={fullTicketData}
          onClose={() => {
            setShowChat(false);
            setFullTicketData(null);
          }}
          onUpdate={(refresh, data) => {
            if (refresh) {
              loadMyAssignedTickets();
            }
          }}
        />
      )}
    </div>
  );
};

export default MyAssignedTickets;
