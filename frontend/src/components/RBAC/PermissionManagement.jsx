import React, { useState, useEffect } from 'react';
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
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
  Users,
  FileText,
  BarChart3,
  CreditCard,
  Bell,
  DollarSign,
  Database,
  Server,
  Globe,
  Target,
  Zap,
  Info
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

const PermissionManagement = ({ onNavigate }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showSystem, setShowSystem] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    resource: '',
    action: '',
    is_system_permission: false,
    is_active: true
  });

  // Permission categories and resources
  const permissionCategories = {
    'user_management': {
      icon: Users,
      resources: ['users', 'profiles', 'accounts', 'sessions'],
      actions: ['view', 'create', 'edit', 'delete', 'activate', 'suspend', 'export', 'import']
    },
    'rbac_management': {
      icon: Shield,
      resources: ['roles', 'permissions', 'assignments', 'audit'],
      actions: ['view', 'create', 'edit', 'delete', 'assign', 'revoke', 'audit']
    },
    'system_admin': {
      icon: Settings,
      resources: ['system', 'settings', 'backup', 'logs', 'maintenance', 'updates'],
      actions: ['view', 'configure', 'backup', 'restore', 'maintain', 'update']
    },
    'content_management': {
      icon: FileText,
      resources: ['content', 'files', 'media', 'templates'],
      actions: ['view', 'create', 'edit', 'delete', 'publish', 'approve', 'moderate']
    },
    'analytics': {
      icon: BarChart3,
      resources: ['analytics', 'reports', 'metrics', 'dashboards'],
      actions: ['view', 'export', 'generate', 'schedule', 'share']
    },
    'subscription_management': {
      icon: CreditCard,
      resources: ['subscriptions', 'plans', 'billing', 'payments'],
      actions: ['view', 'create', 'edit', 'cancel', 'refund', 'upgrade', 'downgrade']
    },
    'communication': {
      icon: Bell,
      resources: ['notifications', 'messages', 'announcements', 'templates'],
      actions: ['view', 'send', 'create', 'edit', 'delete', 'schedule']
    },
    'financial': {
      icon: DollarSign,
      resources: ['payments', 'invoices', 'refunds', 'reports'],
      actions: ['view', 'process', 'create', 'edit', 'approve', 'export']
    },
    'security': {
      icon: Lock,
      resources: ['security', 'audit', 'logs', 'threats'],
      actions: ['view', 'monitor', 'configure', 'respond', 'investigate']
    },
    'database': {
      icon: Database,
      resources: ['database', 'backups', 'migrations', 'queries'],
      actions: ['view', 'backup', 'restore', 'migrate', 'optimize']
    }
  };

  // Load permissions and roles
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      
      // Load permissions
      const permissionsResponse = await fetch(`${API_BASE_URL}/admin/permissions?include_inactive=${showInactive}&include_system=${showSystem}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions || []);
      }
      
      // Load roles for bulk operations
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
      setError('Failed to load permissions and roles');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showInactive, showSystem]);

  // Filter permissions based on search and filters
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || permission.category === filterCategory;
    const matchesResource = filterResource === 'all' || permission.resource === filterResource;
    const matchesAction = filterAction === 'all' || permission.action === filterAction;
    
    return matchesSearch && matchesCategory && matchesResource && matchesAction;
  });

  // Get unique resources and actions for filters
  const uniqueResources = [...new Set(permissions.map(p => p.resource))];
  const uniqueActions = [...new Set(permissions.map(p => p.action))];

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle create permission
  const handleCreatePermission = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Permission created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create permission');
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      toast.error('Failed to create permission');
    }
  };

  // Handle edit permission
  const handleEditPermission = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/permissions/${selectedPermission.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Permission updated successfully');
        setEditDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  // Handle delete permission
  const handleDeletePermission = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/permissions/${selectedPermission.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Permission deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedPermission(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  };

  // Handle bulk permission operations
  const handleBulkOperation = async (operation, targetRoleId = null) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/admin/permissions/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation,
          permission_ids: selectedPermissions.map(p => p.id),
          target_role_id: targetRoleId
        })
      });

      if (response.ok) {
        toast.success(`Bulk ${operation} completed successfully`);
        setBulkEditDialogOpen(false);
        setSelectedPermissions([]);
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
      name: '',
      description: '',
      category: '',
      resource: '',
      action: '',
      is_system_permission: false,
      is_active: true
    });
    setSelectedPermission(null);
  };

  // Open edit dialog
  const openEditDialog = (permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || '',
      category: permission.category,
      resource: permission.resource,
      action: permission.action,
      is_system_permission: permission.is_system_permission,
      is_active: permission.is_active
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (permission) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'user_management': 'User Management',
      'rbac_management': 'RBAC Management',
      'system_admin': 'System Administration',
      'content_management': 'Content Management',
      'analytics': 'Analytics & Reports',
      'subscription_management': 'Subscription Management',
      'communication': 'Communication',
      'financial': 'Financial Management',
      'security': 'Security & Audit',
      'database': 'Database Management'
    };
    return categoryMap[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const categoryConfig = permissionCategories[category];
    if (categoryConfig && categoryConfig.icon) {
      const Icon = categoryConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Key className="w-4 h-4" />;
  };

  // Generate permission name from category, resource, and action
  const generatePermissionName = () => {
    if (formData.category && formData.resource && formData.action) {
      return `${formData.category}.${formData.resource}.${formData.action}`;
    }
    return '';
  };

  // Update permission name when category, resource, or action changes
  useEffect(() => {
    const generatedName = generatePermissionName();
    if (generatedName) {
      setFormData(prev => ({ ...prev, name: generatedName }));
    }
  }, [formData.category, formData.resource, formData.action]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permission Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system permissions with granular access control.
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
            Create Permission
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(permissionCategories).map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
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

      {/* Bulk Actions */}
      {selectedPermissions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedPermissions.length} permission(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setBulkEditDialogOpen(true)}
              >
                Bulk Assign to Role
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
                variant="ghost"
                onClick={() => setSelectedPermissions([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions ({filteredPermissions.length})</CardTitle>
          <CardDescription>
            Manage system permissions and access control
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
                      checked={selectedPermissions.length === filteredPermissions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions(filteredPermissions);
                        } else {
                          setSelectedPermissions([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.some(p => p.id === permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions(prev => [...prev, permission]);
                          } else {
                            setSelectedPermissions(prev => prev.filter(p => p.id !== permission.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(permission.category)}
                        <span className="font-medium">{permission.name}</span>
                        {permission.is_system_permission && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryDisplayName(permission.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{permission.resource}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {permission.description || 'No description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={permission.is_active ? "default" : "secondary"}>
                        {permission.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(permission)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Permission
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Permission
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            View Assigned Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!permission.is_system_permission && (
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(permission)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permission
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

          {filteredPermissions.length === 0 && (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No permissions found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Permission
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Permission Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Create a new system permission with specific access control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(permissionCategories).map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryDisplayName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource">Resource *</Label>
                <Select value={formData.resource} onValueChange={(value) => handleInputChange('resource', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && permissionCategories[formData.category]?.resources.map(resource => (
                      <SelectItem key={resource} value={resource}>
                        {resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action">Action *</Label>
                <Select value={formData.action} onValueChange={(value) => handleInputChange('action', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && permissionCategories[formData.category]?.actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Permission Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Auto-generated from category.resource.action"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this permission allows..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-system"
                checked={formData.is_system_permission}
                onCheckedChange={(checked) => handleInputChange('is_system_permission', checked)}
              />
              <Label htmlFor="is-system">System Permission</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePermission}>
              <Save className="w-4 h-4 mr-2" />
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permission: {selectedPermission?.name}</DialogTitle>
            <DialogDescription>
              Modify the permission's settings and access control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(permissionCategories).map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryDisplayName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-resource">Resource</Label>
                <Select value={formData.resource} onValueChange={(value) => handleInputChange('resource', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && permissionCategories[formData.category]?.resources.map(resource => (
                      <SelectItem key={resource} value={resource}>
                        {resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-action">Action</Label>
                <Select value={formData.action} onValueChange={(value) => handleInputChange('action', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && permissionCategories[formData.category]?.actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Permission Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
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

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="edit-is-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPermission}>
              <Save className="w-4 h-4 mr-2" />
              Update Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the permission "{selectedPermission?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>This will remove the permission from all assigned roles.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePermission}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Permissions</DialogTitle>
            <DialogDescription>
              Assign {selectedPermissions.length} selected permission(s) to a role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-role">Target Role</Label>
              <Select onValueChange={(value) => handleBulkOperation('assign', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role to assign permissions to" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionManagement;
