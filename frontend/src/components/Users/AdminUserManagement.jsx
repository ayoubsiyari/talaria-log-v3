import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Settings,
  Crown
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
import { API_BASE_URL } from '@/config/config'
import AddAdminUserDialog from './AddAdminUserDialog'
import EditAdminUserDialog from './EditAdminUserDialog'
import ViewAdminUserDialog from './ViewAdminUserDialog'

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

const AdminUserManagement = ({ onNavigate }) => {
  const [adminUsers, setAdminUsers] = useState([])
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [adminStats, setAdminStats] = useState(null)
  const [availableRoles, setAvailableRoles] = useState([])
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewUser, setViewUser] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Load admin users
  const loadAdminUsers = async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/admin-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.admin_users || [])
        setLoadingState(LOADING_STATES.SUCCESS)
      } else {
        throw new Error(`Failed to load admin users: ${response.status}`)
      }
    } catch (err) {
      console.error('Error loading admin users:', err)
      setError(err.message || 'Failed to load admin users')
      setLoadingState(LOADING_STATES.ERROR)
    }
  }

  // Load available roles
  const loadAvailableRoles = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data.roles || [])
      }
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  // Load admin statistics
  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/admin-users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdminStats(data)
      }
    } catch (err) {
      console.error('Error loading admin stats:', err)
    }
  }

  // Search admin users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAdminUsers()
      return
    }
    
    try {
      setLoadingState(LOADING_STATES.LOADING)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/admin-users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.admin_users || [])
        setLoadingState(LOADING_STATES.SUCCESS)
      } else {
        throw new Error(`Search failed: ${response.status}`)
      }
    } catch (err) {
      console.error('Error searching admin users:', err)
      setError(err.message || 'Search failed')
      setLoadingState(LOADING_STATES.ERROR)
    }
  }

  // Handle admin user actions
  const handleAdminUserAction = async (userId, action) => {
    try {
      const token = localStorage.getItem('access_token')
      let endpoint = ''
      let method = 'PUT'
      let body = {}

      switch (action) {
        case 'activate':
          endpoint = `${API_BASE_URL}/admin/admin-users/${userId}`
          body = { is_active: true }
          break
        case 'suspend':
          endpoint = `${API_BASE_URL}/admin/admin-users/${userId}`
          body = { is_active: false }
          break
        case 'delete':
          if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
            return
          }
          endpoint = `${API_BASE_URL}/admin/admin-users/${userId}`
          method = 'DELETE'
          break
        default:
          return
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      })

      if (response.ok) {
        toast.success(`Admin user ${action}d successfully`)
        loadAdminUsers()
        loadAdminStats()
      } else {
        throw new Error(`Failed to ${action} admin user`)
      }
    } catch (err) {
      console.error(`Error ${action}ing admin user:`, err)
      toast.error(`Failed to ${action} admin user`)
    }
  }


  // Load data on component mount
  useEffect(() => {
    loadAdminUsers()
    loadAvailableRoles()
    loadAdminStats()
  }, [])

  // Filter admin users based on search and filters
  const filteredAdminUsers = adminUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    
    const matchesRole = roleFilter === 'all' || 
      user.roles?.some(role => role.name === roleFilter)
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    return user.username?.[0]?.toUpperCase() || 'A'
  }

  const getFullName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.username || user.email
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

  const handleEditUser = (user) => {
    setEditUser(user)
    setEditDialogOpen(true)
  }

  const handleViewUser = (user) => {
    setViewUser(user)
    setViewDialogOpen(true)
  }

  const handleUserUpdated = () => {
    loadAdminUsers()
    loadAdminStats()
  }

  const handleUserCreated = () => {
    loadAdminUsers()
    loadAdminStats()
    toast.success('Admin user created successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage administrator accounts and their roles across the system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={loadAdminUsers}
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
            <span>Add Admin User</span>
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
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Admins</p>
                  <p className="text-2xl font-bold">
                    {loadingState === LOADING_STATES.LOADING ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      adminUsers.length
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">
                    {adminUsers.filter(u => u.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold">
                    {adminUsers.filter(u => !u.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                  <p className="text-2xl font-bold">
                    {adminUsers.filter(u => u.is_super_admin).length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Directory</CardTitle>
          <CardDescription>
            Search and filter admin users to manage accounts effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, username, or email..."
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
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.display_name || role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
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
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredAdminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No admin users found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdminUsers.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getFullName(user)}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {role.display_name || role.name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No roles assigned
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_super_admin ? (
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Super Admin
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(user.last_login)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(user.created_at)}
                        </span>
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
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => handleAdminUserAction(user.id, 'suspend')}
                                className="text-yellow-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleAdminUserAction(user.id, 'activate')}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleAdminUserAction(user.id, 'delete')}
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

          {filteredAdminUsers.length === 0 && loadingState !== LOADING_STATES.LOADING && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No admin users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin User Dialog */}
      <AddAdminUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onUserCreated={handleUserCreated}
        availableRoles={availableRoles}
      />

      {/* Edit Admin User Dialog */}
      <EditAdminUserDialog
        user={editUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={handleUserUpdated}
        availableRoles={availableRoles}
      />

      {/* View Admin User Dialog */}
      <ViewAdminUserDialog
        user={viewUser}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  )
}

export default AdminUserManagement
