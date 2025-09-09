import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import api from '@/config/api';
import RoleManagement from '../Users/RoleManagement';

const NewRoleManagement = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Real data state
  const [systemRoles, setSystemRoles] = useState([]);
  const [systemPermissions, setSystemPermissions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  
  // Dialog states
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isAssignUsersOpen, setIsAssignUsersOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form states
  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: []
  });
  const [editRole, setEditRole] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: []
  });

  // Helper function to check if user is super admin
  const isSuperAdmin = () => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    return user && (user.is_super_admin || user.account_type === 'admin');
  };

  // Helper function to check if user has role
  const hasRole = (roleName) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  };

  // API Functions
  const fetchSystemRoles = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching system roles...');
      console.log('Token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
      console.log('User:', localStorage.getItem('user') ? 'Present' : 'Missing');
      
      const response = await api.get('/admin/roles');
      console.log('✅ Roles response:', response);
      setSystemRoles(response.roles || []);
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemPermissions = async () => {
    try {
      console.log('🔍 Fetching system permissions...');
      console.log('Token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
      
      const response = await api.get('/admin/permissions');
      console.log('✅ Permissions response:', response);
      setSystemPermissions(response.permissions || []);
    } catch (error) {
      console.error('❌ Error fetching permissions:', error);
      setError('Failed to fetch permissions');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      // Filter out test users (users with 'deleted_' or 'test' in their username/email)
      const filteredUsers = (response.users || []).filter(user => {
        const username = user.username || user.name || '';
        const email = user.email || '';
        return !username.toLowerCase().includes('deleted_') && 
               !email.toLowerCase().includes('deleted_') &&
               !username.toLowerCase().includes('test') &&
               !email.toLowerCase().includes('test');
      });
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserAssignments = async () => {
    try {
      const response = await api.get('/admin/role-assignments');
      setUserAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
    }
  };

  // Create new role
  const createRole = async (roleData) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/roles', roleData);
      setSuccess('Role created successfully');
      fetchSystemRoles();
      setIsCreateRoleOpen(false);
      setNewRole({ name: '', display_name: '', description: '', permissions: [] });
    } catch (error) {
      console.error('Error creating role:', error);
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  // Update role
  const updateRole = async (roleId, roleData) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/roles/${roleId}`, roleData);
      setSuccess('Role updated successfully');
      fetchSystemRoles();
      setIsEditRoleOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  // Delete role
  const deleteRole = async (roleId) => {
    try {
      setLoading(true);
      await api.delete(`/admin/roles/${roleId}`);
      setSuccess('Role deleted successfully');
      fetchSystemRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  // Assign permissions to role
  const assignPermissionsToRole = async (roleId, permissions) => {
    try {
      setLoading(true);
      await api.post(`/admin/roles/${roleId}/permissions`, { permissions });
      setSuccess('Permissions assigned successfully');
      fetchSystemRoles();
    } catch (error) {
      console.error('Error assigning permissions:', error);
      setError('Failed to assign permissions');
    } finally {
      setLoading(false);
    }
  };

  // Assign user to role
  const assignUserToRole = async (userId, roleId) => {
    try {
      setLoading(true);
      await api.post('/admin/role-assignments', {
        user_id: userId,
        role_id: roleId
      });
      setSuccess('User assigned to role successfully');
      fetchUserAssignments();
    } catch (error) {
      console.error('Error assigning user to role:', error);
      setError('Failed to assign user to role');
    } finally {
      setLoading(false);
    }
  };

  // Remove user from role
  const removeUserFromRole = async (userId, roleId) => {
    try {
      setLoading(true);
      // Find the assignment ID first
      const assignment = userAssignments.find(
        a => {
          const assignmentUserId = a.user?.id || a.admin_user?.id;
          return assignmentUserId === userId && a.role?.id === roleId;
        }
      );
      
      if (assignment) {
        await api.delete(`/admin/role-assignments/${assignment.id}`);
        setSuccess('User removed from role successfully');
        fetchUserAssignments();
      } else {
        setError('Assignment not found');
      }
    } catch (error) {
      console.error('Error removing user from role:', error);
      setError('Failed to remove user from role');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSystemRoles();
    fetchSystemPermissions();
    fetchAllUsers();
    fetchUserAssignments();
  }, []);

  // Group permissions by category
  const groupedPermissions = systemPermissions.reduce((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  const renderRolesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., content_manager"
                />
              </div>
              <div>
                <Label htmlFor="role-display-name">Display Name</Label>
                <Input
                  id="role-display-name"
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                  placeholder="e.g., Content Manager"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role's purpose"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createRole(newRole)} disabled={loading}>
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading roles...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {systemRoles.map((role) => (
            <Card key={role.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.display_name}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <Badge variant={role.is_active ? "default" : "secondary"}>
                    {role.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Assigned Users:</span>
                    <Badge variant="outline">{role.assigned_users_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Permissions:</span>
                    <Badge variant="outline">{(role.permissions || []).length}</Badge>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Key Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).slice(0, 5).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {typeof perm === 'string' ? perm.split('.')[1] : perm.name?.split('.')[1] || perm}
                        </Badge>
                      ))}
                      {(role.permissions || []).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{(role.permissions || []).length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                                           onClick={() => {
                       setSelectedRole(role);
                       setEditRole({
                         name: role.name,
                         display_name: role.display_name,
                         description: role.description,
                         permissions: role.permissions || []
                       });
                       setIsEditRoleOpen(true);
                       setError(null);
                       setSuccess(null);
                     }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                                           onClick={() => {
                       setSelectedRole(role);
                       setIsAssignUsersOpen(true);
                       setError(null);
                       setSuccess(null);
                     }}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Assign Users
                    </Button>
                    {!role.is_system_role && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the role "${role.display_name}"?`)) {
                            deleteRole(role.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">System Permissions</h3>
        <p className="text-sm text-muted-foreground">
          View all available permissions in the system
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading permissions...</p>
        </div>
      ) : (
        <Tabs defaultValue={Object.keys(groupedPermissions)[0] || "dashboard"} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {Object.keys(groupedPermissions).map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-3">
                {perms.map((permission) => (
                  <Card key={permission.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{permission.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {permission.description || `Permission to ${permission.action} ${permission.resource}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {permission.category}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">User Role Assignments</h3>
        <p className="text-sm text-muted-foreground">
          View and manage user role assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Your current role assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {hasRole('system_administrator') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">System Administrator</h4>
                  <p className="text-sm text-muted-foreground">
                    Full access to manage system settings and users.
                  </p>
                </div>
                <Badge variant="default">10 permissions</Badge>
              </div>
            </div>
          )}
          {hasRole('content_manager') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Content Manager</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage content, categories, and basic user settings.
                  </p>
                </div>
                <Badge variant="default">5 permissions</Badge>
              </div>
            </div>
          )}
          {hasRole('editor') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Editor</h4>
                  <p className="text-sm text-muted-foreground">
                    Edit existing content and manage comments.
                  </p>
                </div>
                <Badge variant="default">3 permissions</Badge>
              </div>
            </div>
          )}
          {!hasRole('system_administrator') && !hasRole('content_manager') && !hasRole('editor') && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No roles assigned</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin() && (
            <Badge variant="destructive">Super Admin</Badge>
          )}
          {hasRole('system_administrator') && (
            <Badge variant="default">System Administrator</Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">User Assignments</TabsTrigger>
          <TabsTrigger value="role-management">Role Management</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {renderRolesTab()}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {renderPermissionsTab()}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {renderUsersTab()}
        </TabsContent>

        <TabsContent value="role-management" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">User Role Assignments</h3>
                <p className="text-sm text-muted-foreground">
                  Manage user role assignments with advanced interface
                </p>
              </div>
              <Button
                onClick={() => setIsRoleManagementOpen(true)}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Open Role Management
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-medium mb-2">Advanced Role Management</h4>
                  <p className="text-muted-foreground mb-4">
                    Use the advanced role management interface to efficiently assign and manage user roles.
                  </p>
                  <Button onClick={() => setIsRoleManagementOpen(true)}>
                    Launch Role Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.display_name}</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                value={editRole.name}
                onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                disabled={selectedRole?.is_system_role}
              />
            </div>
            <div>
              <Label htmlFor="edit-role-display-name">Display Name</Label>
              <Input
                id="edit-role-display-name"
                value={editRole.display_name}
                onChange={(e) => setEditRole({ ...editRole, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={editRole.description}
                onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="mb-4">
                    <h4 className="font-medium text-sm mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((permission) => (
                        <div key={permission.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${permission.name}`}
                            checked={editRole.permissions.includes(permission.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditRole({
                                  ...editRole,
                                  permissions: [...editRole.permissions, permission.name]
                                });
                              } else {
                                setEditRole({
                                  ...editRole,
                                  permissions: editRole.permissions.filter(p => p !== permission.name)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`edit-${permission.name}`} className="text-sm">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateRole(selectedRole.id, editRole)} disabled={loading}>
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={isAssignUsersOpen} onOpenChange={setIsAssignUsersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Users to: {selectedRole?.display_name}</DialogTitle>
            <DialogDescription>
              Select users to assign to this role
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
                         {allUsers.map((user) => {
               const isAssigned = userAssignments.some(
                 assignment => {
                   const assignmentUserId = assignment.user?.id || assignment.admin_user?.id;
                   return assignmentUserId === user.id && assignment.role?.id === selectedRole?.id;
                 }
               );
              return (
                <div key={user.id} className="flex items-center space-x-2 p-2 border-b">
                                     <Checkbox
                     id={`user-${user.id}`}
                     checked={isAssigned}
                     onCheckedChange={async (checked) => {
                       if (checked) {
                         await assignUserToRole(user.id, selectedRole?.id);
                       } else {
                         await removeUserFromRole(user.id, selectedRole?.id);
                       }
                     }}
                   />
                                     <Label htmlFor={`user-${user.id}`} className="flex-1">
                     <div className="font-medium">{user.username || user.name || user.email}</div>
                     <div className="text-sm text-muted-foreground">{user.email}</div>
                   </Label>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => fetchUserAssignments()}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setIsAssignUsersOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <RoleManagement 
        open={isRoleManagementOpen} 
        onOpenChange={setIsRoleManagementOpen}
      />
    </div>
  );
};

export default NewRoleManagement;
