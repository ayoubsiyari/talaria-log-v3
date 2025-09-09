import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  User, 
  Shield, 
  Users,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const RoleManagement = ({ open, onOpenChange }) => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userRoleAssignments, setUserRoleAssignments] = useState({});
  const [activeTab, setActiveTab] = useState('assignments');

  useEffect(() => {
    if (open) {
      loadUsers();
      loadAvailableRoles();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const usersData = data.users || data;
        console.log('Loaded users:', usersData);
        setUsers(usersData);
        
        // Initialize role assignments for each user
        const assignments = {};
        usersData.forEach(user => {
          // Handle different role data structures
          let userRoles = [];
          if (user.roles) {
            if (Array.isArray(user.roles)) {
              userRoles = user.roles;
            } else if (typeof user.roles === 'string') {
              // If roles is a string, it might be comma-separated role names
              userRoles = user.roles.split(',').map(roleName => ({ name: roleName.trim() }));
            }
          } else if (user.user_roles) {
            userRoles = user.user_roles;
          }
          
          // Extract role IDs - handle both object and string formats
          const roleIds = userRoles.map(role => {
            if (typeof role === 'object') {
              return role.id || role.role_id;
            }
            return role;
          }).filter(id => id); // Remove any undefined/null values
          
          assignments[user.id] = roleIds;
          console.log(`User ${user.username} roles:`, userRoles, 'Role IDs:', roleIds);
        });
        setUserRoleAssignments(assignments);
        console.log('Initial role assignments:', assignments);
      } else {
        console.error('Failed to load users:', response.status);
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const roles = data.roles || data;
        console.log('Available roles:', roles);
        setAvailableRoles(roles);
      } else {
        console.error('Failed to load roles:', response.status);
        toast.error('Failed to load available roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load available roles');
    }
  };

  const handleRoleToggle = async (userId, roleId) => {
    try {
      console.log('Toggling role for user:', userId, 'role:', roleId);
      console.log('Current user role assignments:', userRoleAssignments);
      console.log('Available roles:', availableRoles);
      
      const currentAssignments = userRoleAssignments[userId] || [];
      const isCurrentlyAssigned = currentAssignments.includes(roleId);
      
      console.log('Current assignments for user:', currentAssignments);
      console.log('Is currently assigned:', isCurrentlyAssigned);
      
      let newAssignments;
      if (isCurrentlyAssigned) {
        // Remove role
        newAssignments = currentAssignments.filter(id => id !== roleId);
        console.log('Removing role, new assignments:', newAssignments);
      } else {
        // Add role
        newAssignments = [...currentAssignments, roleId];
        console.log('Adding role, new assignments:', newAssignments);
      }

      // Update local state immediately for better UX
      setUserRoleAssignments(prev => ({
        ...prev,
        [userId]: newAssignments
      }));

      // Send update to server
      const token = localStorage.getItem('access_token');
      console.log('Sending request to:', `${API_BASE_URL}/admin/users/${userId}`);
      console.log('Request body:', { role_ids: newAssignments });
      
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role_ids: newAssignments
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Response data:', result);
        
        const action = isCurrentlyAssigned ? 'removed from' : 'assigned to';
        const roleName = availableRoles.find(r => r.id === roleId)?.display_name || 'role';
        toast.success(`Role ${action} user successfully`);
        console.log('Role update successful');
      } else {
        // Revert on error
        setUserRoleAssignments(prev => ({
          ...prev,
          [userId]: currentAssignments
        }));
        
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        let errorMessage = 'Failed to update role assignment';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        
        console.error('Server error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating role assignment:', error);
      toast.error(error.message || 'Failed to update role assignment');
    }
  };

  const openUserDialog = (user) => {
    console.log('Opening dialog for user:', user);
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRoles = (userId) => {
    const roleIds = userRoleAssignments[userId] || [];
    const roles = availableRoles.filter(role => roleIds.includes(role.id));
    console.log(`User ${userId} roles:`, roles);
    return roles;
  };

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'moderator': 'bg-blue-100 text-blue-800 border-blue-200',
      'user': 'bg-green-100 text-green-800 border-green-200',
      'marketing': 'bg-purple-100 text-purple-800 border-purple-200',
      'support': 'bg-orange-100 text-orange-800 border-orange-200',
      'system_administrator': 'bg-red-100 text-red-800 border-red-200',
      'content_manager': 'bg-blue-100 text-blue-800 border-blue-200',
      'finance_team': 'bg-green-100 text-green-800 border-green-200',
      'marketing_team': 'bg-purple-100 text-purple-800 border-purple-200',
      'support_team': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[roleName?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Management
            </DialogTitle>
            <DialogDescription>
              Manage user role assignments and permissions across the system
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assignments">User Role Assignments</TabsTrigger>
              <TabsTrigger value="overview">Role Overview</TabsTrigger>
            </TabsList>

            {/* User Role Assignments Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadUsers}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {users.length} users
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-600" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg truncate">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.username
                                  }
                                </h3>
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {user.is_admin && (
                                  <Badge variant="destructive">Admin</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Username: {user.username}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Assigned Roles ({getUserRoles(user.id).length})
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                                {getUserRoles(user.id).map((role) => (
                                  <Badge 
                                    key={role.id} 
                                    variant="outline" 
                                    className={`text-xs ${getRoleBadgeColor(role.name)}`}
                                  >
                                    {role.display_name || role.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUserDialog(user)}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Manage Roles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Role Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Available Roles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableRoles.map((role) => {
                      const usersWithRole = users.filter(user => 
                        (userRoleAssignments[user.id] || []).includes(role.id)
                      );
                      
                      return (
                        <Card key={role.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{role.display_name || role.name}</h3>
                            <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                              {usersWithRole.length} users
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {role.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Users with this role:
                          </div>
                          <div className="mt-2 space-y-1">
                            {usersWithRole.slice(0, 3).map((user) => (
                              <div key={user.id} className="text-xs flex items-center gap-2">
                                <User className="w-3 h-3" />
                                <span className="truncate">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.username
                                  }
                                </span>
                              </div>
                            ))}
                            {usersWithRole.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{usersWithRole.length - 3} more users
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* User Role Assignment Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Manage Roles for {selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              Assign or remove roles for this user. Changes are applied immediately.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedUser.first_name && selectedUser.last_name 
                          ? `${selectedUser.first_name} ${selectedUser.last_name}`
                          : selectedUser.username
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                          {selectedUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {selectedUser.is_admin && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Assignment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Roles</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Test button clicked');
                      console.log('Selected user:', selectedUser);
                      console.log('Available roles:', availableRoles);
                      console.log('Current assignments:', userRoleAssignments[selectedUser.id] || []);
                    }}
                  >
                    Debug Info
                  </Button>
                </div>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  {availableRoles.map((role) => {
                    const isAssigned = (userRoleAssignments[selectedUser.id] || []).includes(role.id);
                    return (
                      <div key={role.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={isAssigned}
                          onCheckedChange={() => handleRoleToggle(selectedUser.id, role.id)}
                          className="cursor-pointer"
                        />
                        <Label 
                          htmlFor={`role-${role.id}`} 
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{role.display_name || role.name}</span>
                            {isAssigned && (
                              <Badge variant="outline" className="text-xs">
                                Assigned
                              </Badge>
                            )}
                          </div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {role.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Assignments */}
              {getUserRoles(selectedUser.id).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Currently Assigned Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {getUserRoles(selectedUser.id).map((role) => (
                      <Badge 
                        key={role.id} 
                        variant="secondary" 
                        className={`${getRoleBadgeColor(role.name)} flex items-center gap-1`}
                      >
                        {role.display_name || role.name}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-500" 
                          onClick={() => handleRoleToggle(selectedUser.id, role.id)}
                          title="Remove role"
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoleManagement;
