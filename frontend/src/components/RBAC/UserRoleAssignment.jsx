import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  X,
  Shield,
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Target,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Key,
  Lock,
  Unlock,
  Info,
  Mail,
  MessageSquare,
  Download,
  Upload,
  Database,
  BarChart3,
  CreditCard,
  FileText,
  Bell,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const UserRoleAssignment = ({ onNavigate }) => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  // User search state for Assign Role dialog
  const [userSearch, setUserSearch] = useState('');
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimeoutRef = useRef(null);
  
  // Form states
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
    expires_at: '',
    notes: '',
    is_active: true
  });

  // Load assignments, users, and roles
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      
      // Load assignments
      const assignmentsResponse = await fetch(`${API_BASE_URL}/admin/role-assignments?include_expired=${showExpired}&include_inactive=${showInactive}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      }
      
      // Load users (fetch a large page to populate dropdown)
      const usersResponse = await fetch(`${API_BASE_URL}/admin/users?page=1&page_size=1000&sort_by=name&sort_order=asc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Backend returns { items, total, page, page_size }
        setUsers(usersData.items || usersData.users || []);
      }
      
      // Load roles
      const rolesResponse = await fetch(`${API_BASE_URL}/admin/roles?include_inactive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load assignments, users, and roles');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showExpired, showInactive]);

  // Search users via backend endpoint with debounce
  const searchUsersApi = async (q) => {
    try {
      setUserSearchLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/admin/users/search?q=${encodeURIComponent(q)}&page_size=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      }
    } catch (e) {
      console.error('User search failed', e);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleUserSearchChange = (value) => {
    setUserSearch(value);
    if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);
    userSearchTimeoutRef.current = setTimeout(() => {
      const q = value.trim();
      if (q.length === 0) {
        // reload default users page if search cleared
        loadData();
      } else {
        searchUsersApi(q);
      }
    }, 300);
  };

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.role?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.role?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || assignment.role?.id?.toString() === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && assignment.is_active && !assignment.is_expired) ||
      (filterStatus === 'expired' && assignment.is_expired) ||
      (filterStatus === 'inactive' && !assignment.is_active);
    const matchesUser = filterUser === 'all' || assignment.user?.id?.toString() === filterUser;
    
    return matchesSearch && matchesRole && matchesStatus && matchesUser;
  });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle create assignment
  const handleCreateAssignment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role assignment created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create role assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create role assignment');
    }
  };

  // Handle edit assignment
  const handleEditAssignment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role assignment updated successfully');
        setEditDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update role assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update role assignment');
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Role assignment revoked successfully');
        setDeleteDialogOpen(false);
        setSelectedAssignment(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to revoke role assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to revoke role assignment');
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation, targetRoleId = null) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation,
          assignment_ids: selectedAssignments.map(a => a.id),
          target_role_id: targetRoleId
        })
      });

      if (response.ok) {
        toast.success(`Bulk ${operation} completed successfully`);
        setBulkAssignDialogOpen(false);
        setSelectedAssignments([]);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to perform bulk ${operation}`);
      }
    } catch (error) {
      console.error(`Error performing bulk ${operation}:`, error);
      toast.error(`Failed to perform bulk ${operation}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      user_id: '',
      role_id: '',
      expires_at: '',
      notes: '',
      is_active: true
    });
    setSelectedAssignment(null);
  };

  // Open edit dialog
  const openEditDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      user_id: assignment.user?.id || '',
      role_id: assignment.role?.id || '',
      expires_at: assignment.expires_at ? assignment.expires_at.split('T')[0] : '',
      notes: assignment.notes || '',
      is_active: assignment.is_active
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  // Get status badge
  const getStatusBadge = (assignment) => {
    if (!assignment.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (assignment.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  // Get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get assignment statistics
  const getAssignmentStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => a.is_active && !a.is_expired).length;
    const expired = assignments.filter(a => a.is_expired).length;
    const inactive = assignments.filter(a => !a.is_active).length;
    
    return { total, active, expired, inactive };
  };

  const stats = getAssignmentStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading role assignments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Role Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Manage role assignments and user permissions with granular control.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Role
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
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
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.display_name || role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-expired"
                checked={showExpired}
                onCheckedChange={setShowExpired}
              />
              <Label htmlFor="show-expired">Show Expired</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
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

      {/* Bulk Actions */}
      {selectedAssignments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedAssignments.length} assignment(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setBulkAssignDialogOpen(true)}
              >
                Bulk Change Role
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkOperation('activate')}
              >
                Activate All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkOperation('deactivate')}
              >
                Deactivate All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkOperation('extend')}
              >
                Extend Expiry
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedAssignments([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Assignments ({filteredAssignments.length})</CardTitle>
          <CardDescription>
            Manage user role assignments and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedAssignments.length === filteredAssignments.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssignments(filteredAssignments);
                        } else {
                          setSelectedAssignments([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAssignments.some(a => a.id === assignment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignments(prev => [...prev, assignment]);
                          } else {
                            setSelectedAssignments(prev => prev.filter(a => a.id !== assignment.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={assignment.user?.avatar} />
                          <AvatarFallback>{getUserInitials(assignment.user?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{assignment.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{assignment.role?.display_name || assignment.role?.name}</span>
                        {assignment.role?.is_system_role && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(assignment.assigned_at)}</span>
                    </TableCell>
                    <TableCell>
                      {assignment.expires_at ? (
                        <span className={`text-sm ${assignment.is_expired ? 'text-red-600' : ''}`}>
                          {formatDate(assignment.expires_at)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {assignment.notes || 'No notes'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Assignment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Assignment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(assignment)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Assignment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No role assignments found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Assignment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Create a new role assignment with specific permissions and expiry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">User *</Label>
                <div className="mb-2">
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                  />
                  {userSearchLoading && (
                    <div className="text-xs text-muted-foreground mt-1">Searching...</div>
                  )}
                </div>
                <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{user.name || user.email}</span>
                          <Badge variant="outline" className="text-xs">{user.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role_id} onValueChange={(value) => handleInputChange('role_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{role.display_name || role.name}</span>
                          {role.is_system_role && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires-at">Expires At</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => handleInputChange('expires_at', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add notes about this assignment..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>
              <Save className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role Assignment</DialogTitle>
            <DialogDescription>
              Modify the role assignment settings and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user">User</Label>
                <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{user.name || user.email}</span>
                          <Badge variant="outline" className="text-xs">{user.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role_id} onValueChange={(value) => handleInputChange('role_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{role.display_name || role.name}</span>
                          {role.is_system_role && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expires-at">Expires At</Label>
                <Input
                  id="edit-expires-at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => handleInputChange('expires_at', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="edit-is-active">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAssignment}>
              <Save className="w-4 h-4 mr-2" />
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Role Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the role assignment for "{selectedAssignment?.user?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>This will immediately remove the user's access to this role's permissions.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              <Trash2 className="w-4 h-4 mr-2" />
              Revoke Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedAssignments.length} selected assignment(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-role">New Role</Label>
              <Select onValueChange={(value) => handleBulkOperation('change_role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{role.display_name || role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRoleAssignment;
