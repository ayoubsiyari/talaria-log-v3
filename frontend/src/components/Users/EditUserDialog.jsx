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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  User, 
  Shield, 
  CreditCard, 
  Plus, 
  X,
  Eye,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import userService from '@/services/userService';
import { API_BASE_URL } from '@/config/config';

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    // Basic User Information
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    
    // Account Settings
    is_active: true,
    is_admin: false,
    is_verified: false,
    subscription_status: 'free',
    
    // Role Assignment
    role_ids: [],
    
    // Admin Notes
    admin_notes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [availablePlans, setAvailablePlans] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    duration_days: 30,
    is_trial: false,
    admin_notes: ''
  });

  useEffect(() => {
    if (user && open) {
      loadUserData();
      loadAvailableRoles();
      loadAvailablePlans();
    }
  }, [user, open]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading user data for user ID:', user.id);
      
      // Fetch detailed user data from API
      const token = localStorage.getItem('access_token');
      const url = `${API_BASE_URL}/admin/users/${user.id}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        console.log('API Response - User Data:', userData);
        
        // Extract first and last name from the name field
        const nameParts = (userData.name || userData.first_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Get user roles from API response
        const currentRoles = userData.roles || userData.user_roles || [];
        const roleIds = currentRoles.map(role => role.id || role.role_id);
        
        console.log('Current User Roles:', currentRoles);
        console.log('Role IDs:', roleIds);
        
        const formDataToSet = {
          // Basic User Information
          username: userData.username || user.username || '',
          first_name: userData.first_name || firstName,
          last_name: userData.last_name || lastName,
          email: userData.email || user.email || '',
          phone: userData.phone || user.phone || '',
          country: userData.country || user.country || '',
          
          // Account Settings - use actual data from API
          is_active: userData.is_active !== undefined ? userData.is_active : (user.status === 'active'),
          is_admin: userData.is_admin || userData.isAdmin || false,
          is_verified: userData.is_verified || userData.isVerified || false,
          subscription_status: userData.subscription_status || userData.subscription?.toLowerCase() || 'free',
          
          // Role Assignment - use actual roles from API
          role_ids: roleIds,
          
          // Admin Notes
          admin_notes: userData.admin_notes || ''
        };
        
        console.log('Setting Form Data:', formDataToSet);
        setFormData(formDataToSet);
        setUserRoles(currentRoles);
        setError('');
      } else {
        console.error('Failed to load user data:', response.status, response.statusText);
        
        // Try to get error details
        let errorMessage = 'Failed to load detailed user data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Fallback to props data if API fails
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const formDataToSet = {
          username: user.username || '',
          first_name: firstName,
          last_name: lastName,
          email: user.email || '',
          phone: user.phone || '',
          country: user.country || '',
          is_active: user.status === 'active',
          is_admin: user.isAdmin || false,
          is_verified: user.isVerified || false,
          subscription_status: user.subscription?.toLowerCase() || 'free',
          role_ids: user.role_ids || [],
          admin_notes: user.admin_notes || ''
        };
        
        setFormData(formDataToSet);
        setUserRoles(user.roles || []);
        toast.error(`${errorMessage}, using basic information`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
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
        console.log('Available Roles:', roles);
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

  const loadAvailablePlans = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/available-plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.plans || []);
      } else {
        console.error('Failed to load available plans');
      }
    } catch (error) {
      console.error('Error loading available plans:', error);
    }
  };

  const handleInputChange = (field, value) => {
    console.log('EditUserDialog - Input change:', field, '=', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSelectChange = (value) => {
    console.log('EditUserDialog - Select change: subscription_status =', value);
    setFormData(prev => ({
      ...prev,
      subscription_status: value
    }));
    setError('');
  };

  const handleSwitchChange = (field, checked) => {
    console.log('EditUserDialog - Switch change:', field, '=', checked);
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
    setError('');
  };

  const handleRoleToggle = (roleId) => {
    if (!isEditMode) {
      console.log('Cannot toggle role - not in edit mode');
      return;
    }
    
    console.log('Toggling role:', roleId);
    console.log('Current role IDs:', formData.role_ids);
    
    setFormData(prev => {
      const currentRoleIds = prev.role_ids || [];
      const isCurrentlySelected = currentRoleIds.includes(roleId);
      
      let newRoleIds;
      if (isCurrentlySelected) {
        // Remove role
        newRoleIds = currentRoleIds.filter(id => id !== roleId);
        console.log('Removing role:', roleId);
      } else {
        // Add role
        newRoleIds = [...currentRoleIds, roleId];
        console.log('Adding role:', roleId);
      }
      
      console.log('New role IDs:', newRoleIds);
      
      return {
        ...prev,
        role_ids: newRoleIds
      };
    });
  };

  const getSelectedRoles = () => {
    const selected = availableRoles.filter(role => formData.role_ids.includes(role.id));
    console.log('Selected roles:', selected);
    return selected;
  };

  const handleAssignSubscription = async () => {
    if (!subscriptionForm.plan_id) {
      toast.error('Please select a plan');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/assign-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          ...subscriptionForm
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowSubscriptionModal(false);
        setSubscriptionForm({
          plan_id: '',
          duration_days: 30,
          is_trial: false,
          admin_notes: ''
        });
        onUserUpdated(); // Refresh user data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign subscription');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting form data:', formData);
      
      // Update user information
      const userUpdateData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        country: formData.country,
        is_active: formData.is_active,
        is_admin: formData.is_admin,
        is_verified: formData.is_verified,
        subscription_status: formData.subscription_status,
        role_ids: formData.role_ids,
        admin_notes: formData.admin_notes
      };

      console.log('Sending update data:', userUpdateData);

      const userResponse = await fetch(`${API_BASE_URL}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(userUpdateData)
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to update user information');
      }

      const result = await userResponse.json();
      console.log('Update result:', result);

      toast.success('User updated successfully');
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await userService.resetUserPassword(user.id);
      if (success) {
        toast.success('Password reset successfully');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {isEditMode ? 'Edit User' : 'View User'} - {user.username}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Edit user information and manage their account' : 'View complete user information and account details'}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditMode ? 'View Mode' : 'Edit Mode'}
              </Button>
            </div>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading user data...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Username
                          </Label>
                          {isEditMode ? (
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) => handleInputChange('username', e.target.value)}
                              placeholder="Username"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.username || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </Label>
                          {isEditMode ? (
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="Email address"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.email || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          {isEditMode ? (
                            <Input
                              id="first_name"
                              value={formData.first_name}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                              placeholder="First name"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.first_name || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          {isEditMode ? (
                            <Input
                              id="last_name"
                              value={formData.last_name}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                              placeholder="Last name"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.last_name || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </Label>
                          {isEditMode ? (
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="Phone number"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.phone || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Country
                          </Label>
                          {isEditMode ? (
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              placeholder="Country"
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="font-medium">{formData.country || 'Not provided'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Account Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {getStatusIcon(formData.is_active ? 'active' : 'inactive')}
                            Account Status
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {formData.is_active ? 'User account is active' : 'User account is disabled'}
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                          disabled={!isEditMode}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {formData.is_verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            Email Verification
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {formData.is_verified ? 'Email is verified' : 'Email is not verified'}
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_verified}
                          onCheckedChange={(checked) => handleSwitchChange('is_verified', checked)}
                          disabled={!isEditMode}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {formData.is_admin ? <Shield className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-gray-500" />}
                            Admin Access
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {formData.is_admin ? 'Has administrative privileges' : 'Regular user account'}
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_admin}
                          onCheckedChange={(checked) => handleSwitchChange('is_admin', checked)}
                          disabled={!isEditMode}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="admin_notes">Notes</Label>
                      {isEditMode ? (
                        <Textarea
                          id="admin_notes"
                          value={formData.admin_notes}
                          onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                          placeholder="Add admin notes about this user..."
                          rows={4}
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md border min-h-[100px]">
                          <span className="font-medium">
                            {formData.admin_notes || 'No admin notes available'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Role Assignment
                      {!isEditMode && (
                        <Badge variant="outline" className="ml-2">
                          View Only
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Debug Info - Remove in production */}
                    {isEditMode && (
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded space-y-1">
                        <div>Debug: Available roles: {availableRoles.length} | Selected role IDs: {formData.role_ids.join(', ')}</div>
                        <div>Edit Mode: {isEditMode ? 'Yes' : 'No'} | Form Data Role IDs: {JSON.stringify(formData.role_ids)}</div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            console.log('Current form data:', formData);
                            console.log('Available roles:', availableRoles);
                            console.log('Selected roles:', getSelectedRoles());
                          }}
                        >
                          Debug Log
                        </Button>
                      </div>
                    )}
                    
                    <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                      {availableRoles && availableRoles.length > 0 ? (
                        <div className="space-y-2">
                          {availableRoles.map((role) => {
                            const isChecked = formData.role_ids.includes(role.id);
                            return (
                              <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={isChecked}
                                  onCheckedChange={() => handleRoleToggle(role.id)}
                                  disabled={!isEditMode}
                                  className="cursor-pointer"
                                />
                                <Label 
                                  htmlFor={`role-${role.id}`} 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => isEditMode && handleRoleToggle(role.id)}
                                >
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {role.display_name || role.name}
                                      {isChecked && (
                                        <Badge variant="outline" className="text-xs">
                                          Selected
                                        </Badge>
                                      )}
                                    </div>
                                    {role.description && (
                                      <div className="text-sm text-muted-foreground">{role.description}</div>
                                    )}
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No roles available</p>
                          {isEditMode && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Roles will appear here once they are loaded from the server.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {getSelectedRoles().length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Assigned Roles ({getSelectedRoles().length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedRoles().map((role) => (
                            <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                              {role.display_name || role.name}
                              {isEditMode && (
                                <X 
                                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                  onClick={() => handleRoleToggle(role.id)}
                                  title="Remove role"
                                />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isEditMode && getSelectedRoles().length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No roles assigned. Click on roles above to assign them.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Subscription Management
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSubscriptionModal(true)}
                        disabled={!isEditMode}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Plan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription_status" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Current Subscription Status
                      </Label>
                      {isEditMode ? (
                        <Select
                          value={formData.subscription_status}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subscription status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pending">Pending Payment</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge className={getSubscriptionStatusColor(formData.subscription_status)}>
                            {formData.subscription_status?.toUpperCase() || 'FREE'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formData.subscription_status === 'free' && 'No active subscription'}
                            {formData.subscription_status === 'active' && 'Active subscription'}
                            {formData.subscription_status === 'trial' && 'Trial period'}
                            {formData.subscription_status === 'expired' && 'Subscription expired'}
                            {formData.subscription_status === 'cancelled' && 'Subscription cancelled'}
                            {formData.subscription_status === 'pending' && 'Payment pending'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                      <p className="font-medium mb-1">💡 Subscription Management</p>
                      <p>Use the "Assign Plan" button to assign a specific subscription plan to this user.</p>
                      <p>This will create a new subscription record and update the user's status accordingly.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Reset Password
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                {isEditMode && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 sm:flex-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subscription Assignment Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to {user?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold">{user?.username}</h4>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>

            <div>
              <Label htmlFor="plan">Select Plan</Label>
              <Select 
                value={subscriptionForm.plan_id} 
                onValueChange={(value) => setSubscriptionForm({...subscriptionForm, plan_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - ${plan.price}/{plan.billing_cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={subscriptionForm.duration_days}
                onChange={(e) => setSubscriptionForm({...subscriptionForm, duration_days: parseInt(e.target.value)})}
                min="1"
                max="365"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_trial"
                checked={subscriptionForm.is_trial}
                onChange={(e) => setSubscriptionForm({...subscriptionForm, is_trial: e.target.checked})}
              />
              <Label htmlFor="is_trial">Mark as Trial</Label>
            </div>

            <div>
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={subscriptionForm.admin_notes}
                onChange={(e) => setSubscriptionForm({...subscriptionForm, admin_notes: e.target.value})}
                placeholder="Optional notes about this assignment..."
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAssignSubscription} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Assign Plan
              </Button>
              <Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditUserDialog;
