import { API_BASE_URL } from '../config/config'

class NotificationService {
  // Get unread message count for regular users
  async getUnreadMessageCount() {
    try {
      const token = localStorage.getItem('access_token')
      console.log('🔔 Fetching unread count with token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${API_BASE_URL}/support/tickets/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔔 Unread count response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Unread count data:', data)
        return data.unread_count || 0
      }
      console.log('🔔 Unread count failed:', response.status, response.statusText)
      return 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // Get tickets with new replies for support staff
  async getTicketsWithNewReplies() {
    try {
      const token = localStorage.getItem('access_token')
      console.log('🔔 Fetching tickets with new replies. Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${API_BASE_URL}/support/tickets/new-replies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔔 Tickets with new replies response:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Tickets with new replies data:', data)
        return data.tickets || []
      }
      console.log('🔔 Failed to get tickets with new replies:', response.status, response.statusText)
      return []
    } catch (error) {
      console.error('🔔 Error fetching tickets with new replies:', error)
      return []
    }
  }

  // Mark messages as read
  async markAsRead(ticketId) {
    try {
      const token = localStorage.getItem('access_token')
      console.log('🔔 Marking ticket as read:', ticketId, 'Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticketId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔔 Mark as read response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Mark as read success:', data)
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔔 Mark as read failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('🔔 Error marking as read:', error)
      return false
    }
  }

  // Mark all messages as read
  async markAllAsRead() {
    try {
      const token = localStorage.getItem('access_token')
      console.log('🔔 Marking all as read. Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${API_BASE_URL}/support/tickets/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔔 Mark all as read response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Mark all as read success:', data)
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔔 Mark all as read failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('🔔 Error marking all as read:', error)
      return false
    }
  }

  // Start real-time notifications (WebSocket or polling)
  startNotifications(callback) {
    console.log('🔔 Starting notification polling...');
    
    // Poll for new notifications every 30 seconds
    this.notificationInterval = setInterval(async () => {
      console.log('🔔 Polling for notifications...');
      const unreadCount = await this.getUnreadMessageCount()
      const ticketsWithReplies = await this.getTicketsWithNewReplies()
      
      console.log('🔔 Polling results:', { unreadCount, ticketsWithReplies });
      
      callback({
        unreadCount,
        ticketsWithReplies
      })
    }, 30000) // 30 seconds

    // Initial check
    console.log('🔔 Performing initial notification check...');
    this.getUnreadMessageCount().then(unreadCount => {
      this.getTicketsWithNewReplies().then(ticketsWithReplies => {
        console.log('🔔 Initial notification check results:', { unreadCount, ticketsWithReplies });
        callback({
          unreadCount,
          ticketsWithReplies
        })
      })
    })
  }

  // Stop real-time notifications
  stopNotifications() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval)
      this.notificationInterval = null
    }
  }
}

export default new NotificationService()
