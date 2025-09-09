import { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  BarChart3,
  Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import notificationService from '../../services/notificationService'

export default function Header({ onToggleSidebar, darkMode, onToggleDarkMode, onLogout, useChartDashboard, onToggleDashboardType }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [ticketsWithReplies, setTicketsWithReplies] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  // Get user type to determine notification type
  const getUserType = () => {
    const storedUser = localStorage.getItem('user')
    const parsedUser = storedUser ? JSON.parse(storedUser) : null
    // Check if user is admin (account_type === 'admin' or is_admin flag)
    const isAdmin = parsedUser?.account_type === 'admin' || parsedUser?.is_admin
    return isAdmin ? 'admin' : 'regular'
  }

  const userType = getUserType()

  // Get total notification count for badge
  const getTotalNotificationCount = () => {
    const count = userType === 'regular' ? unreadCount : ticketsWithReplies.length
    console.log('🔔 Total notification count:', count, '(userType:', userType, ', unreadCount:', unreadCount, ', ticketsWithReplies:', ticketsWithReplies.length, ')')
    return count
  }

  useEffect(() => {
    console.log('🔔 Header useEffect triggered')
    console.log('🔔 Current userType:', userType)
    
    // Set current user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setCurrentUser(parsedUser)
      console.log('🔔 Current user set:', parsedUser)
    } else {
      console.log('🔔 No user found in localStorage')
    }

    console.log('🔔 Starting notification polling for user type:', userType)
    
    try {
      // Start notification polling
      notificationService.startNotifications(({ unreadCount, ticketsWithReplies }) => {
        console.log('🔔 Notification update received:', { userType, unreadCount, ticketsWithReplies })
        
        setUnreadCount(unreadCount)
        setTicketsWithReplies(ticketsWithReplies)
        
        // Create notification messages
        const notificationMessages = []
        
        if (userType === 'regular' && unreadCount > 0) {
          console.log('🔔 Creating regular user notification for', unreadCount, 'unread messages')
          notificationMessages.push({
            id: 'unread-messages',
            message: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
            time: 'Just now',
            unread: true,
            type: 'message'
          })
        }
        
        if (userType === 'admin' && ticketsWithReplies.length > 0) {
          console.log('🔔 Creating admin notification for', ticketsWithReplies.length, 'tickets with replies')
          ticketsWithReplies.forEach(ticket => {
            notificationMessages.push({
              id: `ticket-${ticket.id}`,
              message: `New reply in ticket ${ticket.ticket_number}`,
              time: 'Just now',
              unread: true,
              type: 'ticket',
              ticketId: ticket.id
            })
          })
        }
        
        console.log('🔔 Setting notifications:', notificationMessages)
        setNotifications(notificationMessages)
      })
    } catch (error) {
      console.error('🔔 Error starting notification polling:', error)
    }

    // Cleanup on unmount
    return () => {
      console.log('🔔 Cleaning up notification polling')
      notificationService.stopNotifications()
    }
  }, [userType])

  const handleLogout = () => {
    console.log('🔍 Logout button clicked');
    if (onLogout) {
      console.log('🔍 Calling onLogout function');
      onLogout()
    } else {
      console.log('❌ onLogout function not provided');
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.type === 'ticket' && notification.ticketId) {
        // Mark ticket as read
        await notificationService.markAsRead(notification.ticketId)
        console.log('🔔 Marked ticket as read:', notification.ticketId)
      } else if (notification.type === 'message') {
        // Mark all messages as read
        await notificationService.markAllAsRead()
        console.log('🔔 Marked all messages as read')
      }
      
      // Remove notification from list
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      
      // Refresh notification count
      const newUnreadCount = await notificationService.getUnreadMessageCount()
      const newTicketsWithReplies = await notificationService.getTicketsWithNewReplies()
      setUnreadCount(newUnreadCount)
      setTicketsWithReplies(newTicketsWithReplies)
      
    } catch (error) {
      console.error('🔔 Error handling notification click:', error)
    }
  }

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users, subscriptions..."
              className="pl-10 w-64 md:w-80"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dashboard type toggle */}
          {onToggleDashboardType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDashboardType}
              title={useChartDashboard ? "Switch to Regular Dashboard" : "Switch to Chart Dashboard"}
            >
              {useChartDashboard ? <Layout className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
            </Button>
          )}
          
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {getTotalNotificationCount() > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
                  >
                    {getTotalNotificationCount()}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-sm text-muted-foreground">
                  No new notifications
                </DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm ${notification.unread ? 'font-medium' : ''}`}>
                        {notification.message}
                      </span>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-2" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick logout button for testing */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="mr-2"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2"
                onClick={() => console.log('🔍 Profile icon clicked')}
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">
                    {currentUser?.username || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentUser?.email || 'user@example.com'}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 Logout menu item clicked');
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

