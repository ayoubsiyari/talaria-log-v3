import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity,
  ArrowRight,
  CreditCard,
  BarChart3,
  Tag,
  Settings,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Shield
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
import userService from '@/services/userService'
import { API_BASE_URL } from '@/config/config'
import EditUserDialog from './EditUserDialog'
import ViewUserDialog from './ViewUserDialog'
import AddUserDialog from './AddUserDialog'
import EditRoleDialog from './EditRoleDialog'

// Constants
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

const ERROR_MESSAGES = {
  DEFAULT: 'An error occurred while loading users.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to view this data.'
};

const UserManagement = ({ onNavigate }) => {
  const [users, setUsers] = useState([])
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [pagination, setPagination] = useState({})
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewUser, setViewUser] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState(null)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [roleAssignments, setRoleAssignments] = useState([])

  // Load role assignments
  const loadRoleAssignments = async () => {
    try {
      console.log('Loading role assignments...')
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Role assignments response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Role assignments loaded:', data.assignments)
        console.log('Number of assignments:', data.assignments?.length || 0)
        setRoleAssignments(data.assignments || [])
      } else {
        console.error('Failed to load role assignments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading role assignments:', error)
    }
  }

  // Load users data
  const loadUsers = async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING)
      setError(null)
      
      const params = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      }
      
      if (statusFilter !== 'all') params.status = statusFilter
      if (subscriptionFilter !== 'all') params.subscription_status = subscriptionFilter
      
      const response = await userService.getUsers(params)
      const transformedData = userService.transformUsersList(response)
      
      setUsers(transformedData.users)
      setPagination(transformedData.pagination)
      setLoadingState(LOADING_STATES.SUCCESS)
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message || ERROR_MESSAGES.DEFAULT)
      setLoadingState(LOADING_STATES.ERROR)
    }
  }

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const stats = await userService.getUserStats()
      setUserStats(stats)
    } catch (err) {
      console.error('Error loading user stats:', err)
    }
  }

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers()
      return
    }
    
    try {
      setLoadingState(LOADING_STATES.LOADING)
      setError(null)
      
      const response = await userService.searchUsers(searchQuery, {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      const transformedData = userService.transformUsersList(response)
      setUsers(transformedData.users)
      setPagination(transformedData.pagination)
      setLoadingState(LOADING_STATES.SUCCESS)
    } catch (err) {
      console.error('Error searching users:', err)
      setError(err.message || ERROR_MESSAGES.DEFAULT)
      setLoadingState(LOADING_STATES.ERROR)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    loadUsers()
    loadUserStats()
    loadRoleAssignments()
  }, [currentPage, pageSize, sortBy, sortOrder, statusFilter, subscriptionFilter])

  // Handle user actions
  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'activate':
          await userService.updateUser(userId, { is_active: true })
          toast.success('User activated successfully')
          break
        case 'suspend':
          await userService.updateUser(userId, { is_active: false })
          toast.success('User suspended successfully')
          break
        case 'delete':
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await userService.deleteUser(userId)
            toast.success('User deleted successfully')
          }
          break
        default:
          return
      }
      
      // Reload users after action
      loadUsers()
      loadUserStats()
    } catch (err) {
      console.error('Error performing user action:', err)
      setError(err.message || ERROR_MESSAGES.DEFAULT)
      toast.error('Failed to perform user action')
    }
  }

  // Export users
  const handleExport = async (format) => {
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      }
      
      if (statusFilter !== 'all') params.status = statusFilter
      if (subscriptionFilter !== 'all') params.subscription_status = subscriptionFilter
      
      const exportedData = await userService.exportUsers(format, params)
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log(`Users exported as ${format}`)
    } catch (error) {
      console.error('Error exporting users:', error)
      setError('Failed to export users')
    }
  }

  // Helper functions for styling
  const getStatusColor = (status) => {
    return userService.getStatusColor(status)
  }

  const getSubscriptionColor = (subscription) => {
    return userService.getSubscriptionColor(subscription)
  }

  const getActivityLevelColor = (level) => {
    return userService.getActivityLevelColor(level)
  }

  const handleEditUser = (user) => {
    setEditUser(user)
    setEditDialogOpen(true)
  }

  const handleEditRole = (user) => {
    setEditRoleUser(user)
    setEditRoleDialogOpen(true)
  }

  const handleViewUser = (user) => {
    setViewUser(user)
    setViewDialogOpen(true)
  }

  const handleUserUpdated = () => {
    loadUsers()
    loadUserStats()
  }

  const handleRoleUpdated = () => {
    loadUsers()
    loadUserStats()
    loadRoleAssignments()
  }

  // Handle user creation
  const handleUserCreated = (newUser) => {
    // Reload users list to include the new user
    loadUsers()
    loadUserStats()
    toast.success('User created successfully!')
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get roles for a specific user
  const getUserRoles = (userId) => {
    console.log('Getting roles for user ID:', userId)
    console.log('Available role assignments:', roleAssignments)
    
    const userAssignments = roleAssignments.filter(
      assignment => assignment.user?.id === userId && assignment.is_active
    )
    
    console.log('User assignments found:', userAssignments)
    
    if (userAssignments.length === 0) {
      console.log(`No roles found for user ${userId}, returning 'No Role Assigned'`)
      return [{ name: 'No Role Assigned', variant: 'secondary' }]
    }
    
    const roles = userAssignments.map(assignment => ({
      name: assignment.role?.display_name || assignment.role?.name || 'Unknown Role',
      variant: assignment.is_active ? 'default' : 'secondary',
      id: assignment.role?.id
    }))
    
    console.log(`Returning roles for user ${userId}:`, roles)
    return roles
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions across your platform.
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={loadUsers}
            disabled={loadingState === LOADING_STATES.LOADING}
          >
            <RefreshCw className={`w-4 h-4 ${loadingState === LOADING_STATES.LOADING ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button 
            className="flex items-center space-x-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {loadingState === LOADING_STATES.LOADING ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      userStats?.overview?.active_users || users.filter(u => u.status === 'active').length
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('analytics')}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'inactive').length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Search and filter users to manage accounts effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleSearch}
                disabled={loadingState === LOADING_STATES.LOADING}
              >
                Search
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Journals</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingState === LOADING_STATES.LOADING ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse mt-1"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No users found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSubscriptionColor(user.subscription)}>
                          {user.subscription}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getUserRoles(user.id).map((role, index) => (
                            <Badge key={index} variant={role.variant} className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{user.journalsCount}</TableCell>
                      <TableCell>
                        {user.lastLogin === 'Never logged in' ? (
                          <span className="text-muted-foreground text-sm italic">
                            {user.lastLogin}
                          </span>
                        ) : (
                          user.lastLogin
                        )}
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
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('subscriptions')}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="text-yellow-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
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

          {users.length === 0 && loadingState !== LOADING_STATES.LOADING && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={handleUserUpdated}
      />

      {/* View User Dialog */}
      <ViewUserDialog
        user={viewUser}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onUserCreated={handleUserCreated}
      />

      {/* Edit Role Dialog */}
      <EditRoleDialog
        user={editRoleUser}
        open={editRoleDialogOpen}
        onOpenChange={setEditRoleDialogOpen}
        onRoleUpdated={handleRoleUpdated}
      />
    </div>
  )
}

export default UserManagement

