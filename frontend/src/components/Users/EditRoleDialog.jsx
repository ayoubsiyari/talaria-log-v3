import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Save, 
  X,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const EditRoleDialog = ({ user, open, onOpenChange, onRoleUpdated }) => {
  const [roles, setRoles] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [notes, setNotes] = useState('');

  // Load roles and current assignments when dialog opens
  useEffect(() => {
    if (open && user) {
      loadRoles();
      loadCurrentAssignments();
    }
  }, [open, user]);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const loadCurrentAssignments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter assignments for this specific user (only active ones)
        const userAssignments = (data.assignments || []).filter(
          assignment => (assignment.user?.id === user.id || assignment.user_id === user.id) && assignment.is_active
        );
        setCurrentAssignments(userAssignments);
      }
    } catch (error) {
      console.error('Error loading current assignments:', error);
      toast.error('Failed to load current role assignments');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          role_id: parseInt(selectedRole),
          is_active: true,
          notes: notes
        })
      });

      if (response.ok) {
        toast.success('Role assigned successfully');
        onRoleUpdated();
        onOpenChange(false);
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async (assignmentId) => {
    if (!confirm('Are you sure you want to revoke this role?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/role-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Role revoked successfully');
        onRoleUpdated();
        loadCurrentAssignments(); // Reload current assignments
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to revoke role');
      }
    } catch (error) {
      console.error('Error revoking role:', error);
      toast.error('Failed to revoke role');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRole('');
    setNotes('');
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? (role.display_name || role.name) : 'Unknown Role';
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Edit Roles for {user.username || user.email}</span>
          </DialogTitle>
          <DialogDescription>
            Manage role assignments for this user. You can assign new roles or revoke existing ones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Role Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Role Assignments</CardTitle>
              <CardDescription>
                Roles currently assigned to this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAssignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No roles assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {assignment.role?.display_name || assignment.role?.name || getRoleName(assignment.role_id)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeRole(assignment.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign New Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign New Role</CardTitle>
              <CardDescription>
                Select a role to assign to this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.is_active).map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this role assignment..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleAssignRole}
            disabled={!selectedRole || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
