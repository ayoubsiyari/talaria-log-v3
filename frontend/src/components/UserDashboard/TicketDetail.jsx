import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  Clock,
  Send,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

const TicketDetail = ({ ticket, onBack, onUpdate }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Prevent sending messages if ticket is closed or resolved
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      toast.error('Cannot send messages to closed or resolved tickets');
      return;
    }

    setSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const message = {
        id: Date.now(),
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toISOString(),
        is_customer: true
      };

      const updatedTicket = {
        ...ticket,
        messages: [...ticket.messages, message],
        updated_at: new Date().toISOString()
      };

      onUpdate(updatedTicket);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.ticket_number}</h1>
            <p className="text-muted-foreground">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
          {getCategoryBadge(ticket.category)}
        </div>
      </div>

      {/* Ticket Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Created:</strong> {formatDate(ticket.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Updated:</strong> {formatDate(ticket.updated_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Assigned to:</strong> {ticket.assigned_to}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Current Status:</span>
              <div className="mt-1">{getStatusBadge(ticket.status)}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Priority Level:</span>
              <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
            </div>
            <div>
              <span className="text-sm font-medium">Category:</span>
              <div className="mt-1">{getCategoryBadge(ticket.category)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open(`mailto:${ticket.assigned_to_email || 'support@example.com'}?subject=Re: ${ticket.ticket_number} - ${ticket.subject}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.print()}
            >
              <Info className="h-4 w-4 mr-2" />
              Print Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Original Issue */}
      <Card>
        <CardHeader>
          <CardTitle>Original Issue</CardTitle>
          <CardDescription>Your initial support request</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation ({ticket.messages.length} messages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ticket.messages.map((message) => (
              <div key={message.id} className={`flex ${message.is_customer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  message.is_customer 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {message.sender}
                    </span>
                    <span className={`text-xs ${
                      message.is_customer ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Send Message */}
          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
            <div className="mt-6 space-y-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sending || !newMessage.trim()}
                  className="h-10"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your response will be sent to the support team. They typically respond within 24 hours.
              </p>
            </div>
          )}

          {(ticket.status === 'closed' || ticket.status === 'resolved') && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  This ticket has been {ticket.status === 'resolved' ? 'resolved' : 'closed'}. You cannot send new messages. If you have a new issue, please create a new support ticket.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Additional ways to get support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">
                Send us an email for detailed inquiries
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Send Email
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Info className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-1">Help Center</h3>
              <p className="text-sm text-muted-foreground">
                Browse our comprehensive help documentation
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Visit Help Center
              </Button>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium mb-1">Emergency Contact</h3>
              <p className="text-sm text-muted-foreground">
                For urgent issues, contact our emergency line
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Emergency Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetail;
