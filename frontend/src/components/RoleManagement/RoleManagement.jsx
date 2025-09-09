import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, Edit, Plus, Users, Shield, Settings } from 'lucide-react';
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import api from '../../config/api';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const { hasPermission } = usePermissions();

  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    priority: 0
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to fetch roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/admin/permissions');
      const permissionsData = response.data.permissions || [];
      
      // Convert flat array to categorized object for frontend compatibility
      const categorizedPermissions = {};
      permissionsData.forEach(permission => {
        const category = permission.category || 'other';
        if (!categorizedPermissions[category]) {
          categorizedPermissions[category] = [];
        }
        categorizedPermissions[category].push(permission);
      });
      
      setPermissions(categorizedPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/roles', newRole);
      setRoles([...roles, response.data.role]);
      setNewRole({ name: '', display_name: '', description: '', priority: 0 });
      setShowCreateDialog(false);
      setSuccess('Role created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/admin/roles/${selectedRole.id}`, selectedRole);
      setRoles(roles.map(role => 
        role.id === selectedRole.id ? response.data.role : role
      ));
      setShowEditDialog(false);
      setSelectedRole(null);
      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setRoles(roles.filter(role => role.id !== roleId));
      setSuccess('Role deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAssignPermissions = async (roleId, permissionIds) => {
    try {
      const response = await api.post(`/admin/roles/${roleId}/permissions`, {
        permission_ids: permissionIds
      });
      setRoles(roles.map(role => 
        role.id === roleId ? response.data.role : role
      ));
      setShowPermissionsDialog(false);
      setSuccess('Permissions updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to assign permissions');
      setTimeout(() => setError(''), 3000);
    }
  };

  const PermissionAssignmentDialog = ({ role, onClose, onSave }) => {
    const [selectedPermissions, setSelectedPermissions] = useState(
      role?.permissions || []
    );

    const togglePermission = (permissionName) => {
      setSelectedPermissions(prev => 
        prev.includes(permissionName)
          ? prev.filter(p => p !== permissionName)
          : [...prev, permissionName]
      );
    };

    const handleSave = () => {
      // Get permission IDs from names
      const permissionIds = [];
      Object.values(permissions).flat().forEach(perm => {
        if (selectedPermissions.includes(perm.name)) {
          permissionIds.push(perm.id);
        }
      });
      onSave(role.id, permissionIds);
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Permissions to {role?.display_name || role?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(permissions).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">
                    {category.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.name}
                          checked={selectedPermissions.includes(permission.name)}
                          onCheckedChange={() => togglePermission(permission.name)}
                        />
                        <Label 
                          htmlFor={permission.name} 
                          className="text-sm cursor-pointer"
                        >
                          {permission.display_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission="roles.view" fallback={
      <Alert>
        <AlertDescription>
          You don't have permission to view role management.
        </AlertDescription>
      </Alert>
    }>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Role Management</h1>
          <PermissionGate permission="roles.create">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </PermissionGate>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="roles" className="w-full">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <Card key={role.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{role.display_name || role.name}</CardTitle>
                        <Badge variant={role.is_system_role ? "secondary" : "default"}>
                          {role.is_system_role ? "System" : "Custom"}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <PermissionGate permission="roles.edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="roles.delete">
                          {!role.is_system_role && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </PermissionGate>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {role.assigned_users_count || 0} users
                      </span>
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        {role.permissions?.length || 0} permissions
                      </span>
                    </div>
                    <PermissionGate permission="roles.edit">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowPermissionsDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </Button>
                    </PermissionGate>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            {Object.entries(permissions).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {category.replace('_', ' ')} Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{permission.display_name}</div>
                        <div className="text-sm text-gray-600">{permission.description}</div>
                        <Badge variant="outline" className="mt-1">
                          {permission.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Create Role Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({...newRole, display_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={newRole.priority}
                  onChange={(e) => setNewRole({...newRole, priority: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Role</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        {selectedRole && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <Label htmlFor="edit_name">Role Name</Label>
                  <Input
                    id="edit_name"
                    value={selectedRole.name}
                    onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_display_name">Display Name</Label>
                  <Input
                    id="edit_display_name"
                    value={selectedRole.display_name || ''}
                    onChange={(e) => setSelectedRole({...selectedRole, display_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={selectedRole.description || ''}
                    onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_priority">Priority</Label>
                  <Input
                    id="edit_priority"
                    type="number"
                    value={selectedRole.priority || 0}
                    onChange={(e) => setSelectedRole({...selectedRole, priority: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Role</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Permission Assignment Dialog */}
        {showPermissionsDialog && selectedRole && (
          <PermissionAssignmentDialog
            role={selectedRole}
            onClose={() => setShowPermissionsDialog(false)}
            onSave={handleAssignPermissions}
          />
        )}
      </div>
    </PermissionGate>
  );
};

export default RoleManagement;
