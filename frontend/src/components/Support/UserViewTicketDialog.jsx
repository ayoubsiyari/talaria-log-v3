import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  User, 
  Send,
  Paperclip
} from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/config/config'

const TICKET_STATUSES = {
  'open': { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  'in_progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  'pending': { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  'resolved': { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
}

const TICKET_PRIORITIES = {
  'low': { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  'high': { label: 'High', color: 'bg-orange-100 text-orange-800' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-800' }
}

const UserViewTicketDialog = ({ ticket, open, onOpenChange }) => {
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  if (!ticket) return null

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

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSendingReply(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyMessage,
          is_internal: false // User messages are never internal
        })
      })

      if (response.ok) {
        toast.success('Reply sent successfully!')
        setReplyMessage('')
        // Refresh ticket data would happen here in a real app
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to send reply')
      }
    } catch (err) {
      console.error('Error sending reply:', err)
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {ticket.ticket_number}
          </DialogTitle>
          <DialogDescription>
            {ticket.subject}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={TICKET_STATUSES[ticket.status]?.color || 'bg-gray-100 text-gray-800'}>
                {TICKET_STATUSES[ticket.status]?.label || ticket.status}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Priority</p>
              <Badge variant="outline" className={TICKET_PRIORITIES[ticket.priority]?.color || 'bg-gray-100 text-gray-800'}>
                {TICKET_PRIORITIES[ticket.priority]?.label || ticket.priority}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              {ticket.category ? (
                <Badge variant="outline" style={{ backgroundColor: ticket.category.color + '20', color: ticket.category.color }}>
                  {ticket.category.name}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">General Support</span>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(ticket.created_at)}</p>
            </div>
          </div>

          {/* Assignment Info */}
          {ticket.assigned_admin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned Support Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {ticket.assigned_admin.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{ticket.assigned_admin.full_name}</p>
                    <p className="text-sm text-muted-foreground">Support Agent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          {ticket.messages && ticket.messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversation ({ticket.messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.messages
                    .filter(message => !message.is_internal) // Hide internal messages from users
                    .map((message, index) => (
                    <div key={message.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {message.author_name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{message.author_name}</span>
                          {message.is_admin_reply && (
                            <Badge variant="outline" className="text-xs">Support Team</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <div className={`ml-8 text-sm whitespace-pre-wrap p-3 rounded-lg ${
                        message.is_admin_reply 
                          ? 'bg-blue-50 border-l-4 border-blue-200' 
                          : 'bg-muted/50'
                      }`}>
                        {message.message}
                      </div>
                      {index < ticket.messages.filter(m => !m.is_internal).length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{attachment.original_filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(attachment.file_size / 1024)}KB
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(attachment.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reply Section - Only show if ticket is not closed */}
          {ticket.status !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Add Reply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply or additional information here..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Closed ticket notice */}
          {ticket.status === 'closed' && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  This ticket has been closed. If you need further assistance, please create a new ticket.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UserViewTicketDialog
