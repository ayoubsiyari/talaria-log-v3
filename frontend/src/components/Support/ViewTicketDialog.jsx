import { useState, useEffect } from 'react'
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
  Clock, 
  User, 
  Mail, 
  Calendar,
  AlertTriangle,
  Paperclip,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/config/config'
import notificationService from '../../services/notificationService'

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

const ViewTicketDialog = ({ ticket, open, onOpenChange, agents, onUpdate }) => {
  const [replyMessage, setReplyMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)

  // Mark ticket as read when dialog opens
  useEffect(() => {
    if (open && ticket) {
      const markTicketAsRead = async () => {
        try {
          await notificationService.markAsRead(ticket.id)
          // Only call onUpdate if we need to refresh notification state
          // Don't call onUpdate here to avoid unnecessary ticket reloads
        } catch (error) {
          console.error('Error marking ticket as read:', error)
        }
      }
      
      markTicketAsRead()
    }
  }, [open, ticket])

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
          is_internal: isInternal
        })
      })

      if (response.ok) {
        toast.success('Reply sent successfully!')
        setReplyMessage('')
        
        // Immediately refresh notification state
        try {
          const unreadCount = await notificationService.getUnreadMessageCount();
          const ticketsWithReplies = await notificationService.getTicketsWithNewReplies();
          // Update parent component with fresh notification data
          if (onUpdate) {
            onUpdate(true, { unreadCount, ticketsWithReplies });
          }
        } catch (error) {
          console.error('Error refreshing notification state:', error);
          // Fallback to regular update
          if (onUpdate) {
            onUpdate(true);
          }
        }
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                <span className="text-sm text-muted-foreground">No category</span>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(ticket.created_at)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{ticket.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{ticket.user_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.assigned_admin ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {ticket.assigned_admin.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{ticket.assigned_admin.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.assigned_admin.username}</p>
                  </div>
                </div>
              ) : (
                <Badge variant="secondary">Unassigned</Badge>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
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
                  Messages ({ticket.messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ticket.messages.map((message, index) => (
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
                          {message.is_internal && (
                            <Badge variant="secondary" className="text-xs">Internal</Badge>
                          )}
                          {message.is_admin_reply && !message.read_at && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <div className="ml-8 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                        {message.message}
                      </div>
                      {index < ticket.messages.length - 1 && <Separator />}
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
                        by {attachment.uploaded_by}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Reply */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4" />
                Quick Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="internal" className="text-sm">
                      Internal note (not visible to customer)
                    </label>
                  </div>
                  <Button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewTicketDialog
