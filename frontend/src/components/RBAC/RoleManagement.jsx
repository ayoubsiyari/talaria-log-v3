import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Settings, 
  Eye, 
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
  CreditCard,
  BarChart3,
  FileText,
  Bell,
  DollarSign
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
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const RoleManagement = ({ onNavigate }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    priority: 0,
    is_active: true
  });

  // Load roles and permissions
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      
      // Load roles
      const rolesResponse = await fetch(`${API_BASE_URL}/admin/roles?include_inactive=${showInactive}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }
      
      // Load permissions
      const permissionsResponse = await fetch(`${API_BASE_URL}/admin/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load roles and permissions');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showInactive]);

  // Filter roles based on search and category
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || 
                           (role.permissions && Array.isArray(role.permissions) && 
                            role.permissions.some(perm => perm.startsWith(filterCategory)));
    
    return matchesSearch && matchesCategory;
  });

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  // Permission templates for quick setup
  const permissionTemplates = {
    'user_management': {
      icon: Users,
      permissions: [
        { name: 'users.view', description: 'View user list and details' },
        { name: 'users.create', description: 'Create new users' },
        { name: 'users.edit', description: 'Edit user information' },
        { name: 'users.delete', description: 'Delete users' },
        { name: 'users.export', description: 'Export user data' },
        { name: 'users.import', description: 'Import user data' },
        { name: 'users.activate', description: 'Activate/deactivate users' },
        { name: 'users.reset_password', description: 'Reset user passwords' }
      ]
    },
    'subscription_management': {
      icon: CreditCard,
      permissions: [
        { name: 'subscriptions.view', description: 'View subscription details' },
        { name: 'subscriptions.create', description: 'Create new subscriptions' },
        { name: 'subscriptions.edit', description: 'Edit subscription plans' },
        { name: 'subscriptions.delete', description: 'Delete subscriptions' },
        { name: 'subscriptions.cancel', description: 'Cancel user subscriptions' },
        { name: 'subscriptions.refund', description: 'Process refunds' },
        { name: 'subscriptions.upgrade', description: 'Upgrade user plans' },
        { name: 'subscriptions.downgrade', description: 'Downgrade user plans' }
      ]
    },
    'analytics': {
      icon: BarChart3,
      permissions: [
        { name: 'analytics.view', description: 'View analytics dashboard' },
        { name: 'analytics.export', description: 'Export analytics data' },
        { name: 'analytics.reports', description: 'Generate custom reports' },
        { name: 'analytics.revenue', description: 'View revenue analytics' },
        { name: 'analytics.users', description: 'View user analytics' },
        { name: 'analytics.performance', description: 'View performance metrics' }
      ]
    },
    'content_management': {
      icon: FileText,
      permissions: [
        { name: 'content.view', description: 'View content' },
        { name: 'content.create', description: 'Create new content' },
        { name: 'content.edit', description: 'Edit existing content' },
        { name: 'content.delete', description: 'Delete content' },
        { name: 'content.publish', description: 'Publish content' },
        { name: 'content.approve', description: 'Approve content' },
        { name: 'content.schedule', description: 'Schedule content' }
      ]
    },
    'system_admin': {
      icon: Settings,
      permissions: [
        { name: 'system.settings', description: 'Access system settings' },
        { name: 'system.backup', description: 'Create system backups' },
        { name: 'system.restore', description: 'Restore system from backup' },
        { name: 'system.logs', description: 'View system logs' },
        { name: 'system.maintenance', description: 'Perform maintenance tasks' },
        { name: 'system.security', description: 'Manage security settings' },
        { name: 'system.updates', description: 'Manage system updates' }
      ]
    },
    'rbac_management': {
      icon: Shield,
      permissions: [
        { name: 'roles.view', description: 'View roles and permissions' },
        { name: 'roles.create', description: 'Create new roles' },
        { name: 'roles.edit', description: 'Edit existing roles' },
        { name: 'roles.delete', description: 'Delete roles' },
        { name: 'roles.assign', description: 'Assign roles to users' },
        { name: 'roles.revoke', description: 'Revoke roles from users' },
        { name: 'permissions.manage', description: 'Manage permissions' }
      ]
    },
    'communication': {
      icon: Bell,
      permissions: [
        { name: 'notifications.view', description: 'View notifications' },
        { name: 'notifications.send', description: 'Send notifications' },
        { name: 'notifications.templates', description: 'Manage notification templates' },
        { name: 'messages.view', description: 'View messages' },
        { name: 'messages.send', description: 'Send messages' },
        { name: 'announcements.view', description: 'View announcements' },
        { name: 'announcements.create', description: 'Create announcements' },
        { name: 'announcements.edit', description: 'Edit announcements' },
        { name: 'announcements.delete', description: 'Delete announcements' }
      ]
    },
    'financial': {
      icon: DollarSign,
      permissions: [
        { name: 'payments.view', description: 'View payment information' },
        { name: 'payments.process', description: 'Process payments' },
        { name: 'payments.refund', description: 'Process refunds' },
        { name: 'invoices.view', description: 'View invoices' },
        { name: 'invoices.create', description: 'Create invoices' },
        { name: 'invoices.edit', description: 'Edit invoices' },
        { name: 'reports.financial', description: 'Generate financial reports' }
      ]
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionName) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  // Handle create role
  const handleCreateRole = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    }
  };

  // Handle edit role
  const handleEditRole = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Role updated successfully');
        setEditDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedRole(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      priority: 0,
      is_active: true
    });
    setSelectedRole(null);
  };

  // Open edit dialog
  const openEditDialog = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name || '',
      description: role.description || '',
      permissions: role.permissions || [],
      priority: role.priority || 0,
      is_active: role.is_active
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  // Get permission category display name
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'user_management': 'User Management',
      'system_admin': 'System Administration',
      'content_management': 'Content Management',
      'analytics': 'Analytics & Reports',
      'subscription_management': 'Subscription Management',
      'rbac_management': 'RBAC Management',
      'communication': 'Communication',
      'financial': 'Financial Management',
      'security': 'Security & Audit'
    };
    return categoryMap[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Apply permission template to role
  const applyPermissionTemplate = (templateKey) => {
    const template = permissionTemplates[templateKey];
    if (!template) return;

    const templatePermissions = template.permissions.map(perm => perm.name);
    setFormData(prev => ({
      ...prev,
      permissions: [...new Set([...prev.permissions, ...templatePermissions])]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading roles...</span>
        </div>
      </div>
    );
  }

  // Check if user is admin - bypass permission checks for admin users
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdminUser = user && (
    user.is_super_admin || 
    user.account_type === 'admin' || 
    user.is_admin
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom roles with specific permissions for your team.
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
            Create Role
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(permissionsByCategory).map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">Show Inactive</Label>
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

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>
            Manage administrative roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.display_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions && Array.isArray(role.permissions) && role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{role.assigned_users_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.priority}</Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!role.is_system_role && (
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(role)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No roles found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions for your team members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., content_manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="e.g., Content Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
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

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('user_management')}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    User Mgmt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('subscription_management')}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Subscriptions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('analytics')}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analytics
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('content_management')}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Content
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{getCategoryDisplayName(category)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Switch
                            id={`perm-${permission.id}`}
                            checked={formData.permissions.includes(permission.name)}
                            onCheckedChange={() => handlePermissionToggle(permission.name)}
                          />
                          <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                            {permission.description || permission.name}
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>
              <Save className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.display_name || selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Modify the role's permissions and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role-name">Role Name *</Label>
                <Input
                  id="edit-role-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={selectedRole?.is_system_role}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
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

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('user_management')}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    User Mgmt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('subscription_management')}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Subscriptions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('analytics')}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analytics
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPermissionTemplate('content_management')}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Content
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{getCategoryDisplayName(category)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Switch
                            id={`edit-perm-${permission.id}`}
                            checked={formData.permissions.includes(permission.name)}
                            onCheckedChange={() => handlePermissionToggle(permission.name)}
                          />
                          <Label htmlFor={`edit-perm-${permission.id}`} className="text-sm">
                            {permission.description || permission.name}
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole}>
              <Save className="w-4 h-4 mr-2" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.display_name || selectedRole?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>This will remove the role from all assigned users.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
