import React, { useState, useEffect } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useUserActions } from '../../hooks/useUserActions';
import { usePermissions } from '../../hooks/usePermissions';
import UserForm from './UserForm';
import ViewProfileDialog from '../Users/ViewProfileDialog';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, Search, Plus, MoreVertical, UserCheck, UserX, Crown, Trash2,
  CheckCircle, Eye, Edit, Mail, CreditCard, MoreHorizontal, Filter, Download, Plus as PlusIcon, Calendar, Loader2, Send, MessageSquare, FileText,
  AlertTriangle, Clock, BarChart3, Tag, RefreshCw
} from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { API_BASE_URL } from '@/config/config';
import EditUserDialog from '@/components/Users/EditUserDialog';

const UserStatsCards = ({ stats }) => (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.total_users || 0}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.active_users || 0}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.inactive_users || stats.suspended_users || 0}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.premium_users || stats.subscription_stats?.active_subscribers || 0}</div></CardContent>
      </Card>
    </div>
  );

const NewEnhancedUserManagement = () => {
  const { users, stats, pagination, loading, filters, handleFilterChange, setPagination, refreshData } = useUserManagement();
  const { createUser, updateUser, deleteUser, toggleUserStatus, executeBulkAction, actionLoading } = useUserActions(refreshData);
  const { hasPermission } = usePermissions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  // Subscription management state
  const [availablePlans, setAvailablePlans] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    duration_days: 30,
    is_trial: false,
    admin_notes: '',
    auto_activate: true,
    expiration_date: null
  });
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState(null);

  // Message functionality
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    send_to: 'selected' // 'selected' or 'all'
  });
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);

  // Bulk actions
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Stuck users functionality
  const [activeTab, setActiveTab] = useState('stuck-users');
  const [stuckUsers, setStuckUsers] = useState([]);
  const [expiredUsers, setExpiredUsers] = useState([]);

  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdminUser = user && (user.is_super_admin || user.account_type === 'admin' || user.is_admin);

  useEffect(() => {
    loadAvailablePlans();
  }, []);

  // Function to identify stuck users (users with pending subscription status)
  const identifyStuckUsers = () => {
    if (!users) return [];
    return users.filter(user => 
      user.subscription_status === 'pending' && 
      !user.is_active
    );
  };

  // Function to identify expired users
  const identifyExpiredUsers = () => {
    if (!users) return [];
    return users.filter(user => 
      user.subscription_status === 'expired'
    );
  };

  // Update stuck and expired users when users data changes
  useEffect(() => {
    setStuckUsers(identifyStuckUsers());
    setExpiredUsers(identifyExpiredUsers());
  }, [users]);

  // Filter out stuck users from the main table
  const filteredUsers = users ? users.filter(user => 
    !(user.subscription_status === 'pending' && !user.is_active)
  ) : [];

  // Handle sending reminder to stuck users
  const handleSendReminder = async (user) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: `Hi ${user.first_name || user.username}, we noticed you haven't completed your subscription setup yet. Please complete your payment to access all features.`,
          type: 'payment_reminder'
        })
      });

      if (response.ok) {
        toast.success(`Reminder sent to ${user.email}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  // Handle sending renewal reminder to expired users
  const handleSendRenewalReminder = async (user) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: `Hi ${user.first_name || user.username}, your subscription has expired. Please renew your subscription to continue accessing all features.`,
          type: 'renewal_reminder'
        })
      });

      if (response.ok) {
        toast.success(`Renewal reminder sent to ${user.email}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send renewal reminder');
      }
    } catch (error) {
      console.error('Error sending renewal reminder:', error);
      toast.error('Failed to send renewal reminder');
    }
  };

  // Handle quick activation of stuck users
  const handleQuickActivate = async (user) => {
    if (!confirm(`Are you sure you want to activate ${user.first_name || user.username}? This will set their subscription status to 'active' and make them active.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          subscription_status: 'active',
          is_active: true 
        })
      });

      if (response.ok) {
        toast.success(`${user.first_name || user.username} has been activated successfully!`);
        refreshData(); // Refresh to update the lists
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate user');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  // Handle quick reactivation of expired users
  const handleQuickReactivate = async (user) => {
    if (!confirm(`Are you sure you want to reactivate ${user.first_name || user.username}? This will set their subscription status to 'active' and make them active.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          subscription_status: 'active',
          is_active: true 
        })
      });

      if (response.ok) {
        toast.success(`${user.first_name || user.username} has been reactivated successfully!`);
        refreshData(); // Refresh to update the lists
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reactivate user');
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
    }
  };

  // Handle bulk activation of all stuck users
  const handleBulkActivateStuckUsers = async () => {
    if (!confirm(`Are you sure you want to activate all ${stuckUsers.length} stuck users? This will set their subscription status to 'active' and make them active.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_ids: stuckUsers.map(user => user.id),
          action: 'activate_stuck_users'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully activated ${data.processed_count || stuckUsers.length} stuck users!`);
        refreshData(); // Refresh to update the lists
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate stuck users');
      }
    } catch (error) {
      console.error('Error activating stuck users:', error);
      toast.error('Failed to activate stuck users');
    }
  };

  // Handle quick assign with expiration
  const handleQuickAssignWithExpiration = async (user) => {
    const expirationDays = prompt(`Enter expiration days for ${user.first_name || user.username} (e.g., 30 for 30 days):`, '30');
    if (!expirationDays || isNaN(expirationDays)) {
      toast.error('Please enter a valid number of days');
      return;
    }

    const days = parseInt(expirationDays);
    if (days < 1 || days > 365) {
      toast.error('Please enter a number between 1 and 365 days');
      return;
    }

    if (!confirm(`Assign subscription to ${user.first_name || user.username} with ${days} days expiration and activate their account?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Calculate expiration date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      const expirationDate = expiryDate.toISOString().split('T')[0];

      const response = await fetch(`${API_BASE_URL}/admin/users/assign-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: availablePlans[0]?.id || 1, // Use first available plan
          duration_days: days,
          expiration_date: expirationDate,
          auto_activate: true,
          is_trial: false,
          admin_notes: `Quick assignment with ${days} days expiration`
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Subscription assigned to ${user.first_name || user.username} with ${days} days expiration!`);
        refreshData(); // Refresh to update the lists
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign subscription');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    }
  };

  // Handle bulk assign with expiration for all stuck users
  const handleBulkAssignWithExpiration = async () => {
    const expirationDays = prompt(`Enter expiration days for all ${stuckUsers.length} stuck users (e.g., 30 for 30 days):`, '30');
    if (!expirationDays || isNaN(expirationDays)) {
      toast.error('Please enter a valid number of days');
      return;
    }

    const days = parseInt(expirationDays);
    if (days < 1 || days > 365) {
      toast.error('Please enter a number between 1 and 365 days');
      return;
    }

    if (!confirm(`Assign subscription to all ${stuckUsers.length} stuck users with ${days} days expiration and activate their accounts?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Calculate expiration date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      const expirationDate = expiryDate.toISOString().split('T')[0];

      // Process each user
      let successCount = 0;
      for (const user of stuckUsers) {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/users/assign-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: user.id,
              plan_id: availablePlans[0]?.id || 1, // Use first available plan
              duration_days: days,
              expiration_date: expirationDate,
              auto_activate: true,
              is_trial: false,
              admin_notes: `Bulk assignment with ${days} days expiration`
            })
          });

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error assigning subscription to ${user.username}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully assigned subscriptions to ${successCount} out of ${stuckUsers.length} users with ${days} days expiration!`);
        refreshData(); // Refresh to update the lists
      } else {
        toast.error('Failed to assign subscriptions to any users');
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      toast.error('Failed to perform bulk assignment');
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

  const handleAssignSubscription = async () => {
    if (!subscriptionForm.plan_id || !selectedUserForSubscription) {
      toast.error('Please select a plan and user');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Calculate expiration date if not provided
      let expirationDate = subscriptionForm.expiration_date;
      if (!expirationDate && subscriptionForm.duration_days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + subscriptionForm.duration_days);
        expirationDate = expiryDate.toISOString().split('T')[0];
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/assign-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUserForSubscription.id,
          ...subscriptionForm,
          expiration_date: expirationDate,
          auto_activate: subscriptionForm.auto_activate
        })
      });

      if (response.ok) {
        const data = await response.json();
        const successMessage = subscriptionForm.auto_activate 
          ? `Subscription assigned and account activated for ${selectedUserForSubscription.first_name || selectedUserForSubscription.username}!`
          : data.message;
        toast.success(successMessage);
        setShowSubscriptionModal(false);
        setSelectedUserForSubscription(null);
        setSubscriptionForm({
          plan_id: '',
          duration_days: 30,
          is_trial: false,
          admin_notes: '',
          auto_activate: true,
          expiration_date: null
        });
        refreshData(); // Refresh user data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign subscription');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    }
  };

  const openSubscriptionModal = (user) => {
    setSelectedUserForSubscription(user);
    setShowSubscriptionModal(true);
  };

  const openMessageModal = (user) => {
    setSelectedUserForMessage(user);
    setShowMessageModal(true);
  };

  const handleCreateUser = async (userData) => {
    try {
      const success = await createUser(userData);
      if (success) {
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.subject || !messageForm.message) {
      toast.error('Please fill in both subject and message');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUserForMessage?.id,
          subject: messageForm.subject,
          message: messageForm.message,
          send_to: messageForm.send_to
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Message sent successfully');
        setShowMessageModal(false);
        setSelectedUserForMessage(null);
        setMessageForm({
          subject: '',
          message: '',
          send_to: 'selected'
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleExportUsers = async (format = 'csv') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/export?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Users exported as ${format.toUpperCase()}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to export users');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select users to perform bulk action');
      return;
    }

    // Add confirmation for destructive actions
    if (action === 'delete') {
      const confirmMessage = `⚠️ WARNING: You are about to PERMANENTLY DELETE ${selectedUserIds.length} user(s) from the database.\n\nThis action:\n• Cannot be undone\n• Will remove all user data\n• Will skip admin users for safety\n\nAre you absolutely sure you want to continue?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    } else if (action === 'deactivate') {
      if (!confirm(`Are you sure you want to deactivate ${selectedUserIds.length} user(s)? They will lose access to the system.`)) {
        return;
      }
    }

    try {
      console.log('Performing bulk action:', action, 'on users:', selectedUserIds);
      
      const token = localStorage.getItem('access_token');
      
      // Prepare request body
      const requestBody = {
        user_ids: selectedUserIds,
        action: action
      };

      // For delete action, prompt for password
      if (action === 'delete') {
        const password = prompt('🔐 SECURITY: Please enter your password to confirm this bulk delete operation:');
        if (!password) {
          toast.error('Password is required for bulk delete operations');
          return;
        }
        requestBody.password = password;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Bulk action response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Bulk action success:', data);
        
        // Show detailed success message
        if (action === 'delete') {
          toast.success(`✅ Successfully deleted ${data.processed_count} user(s) from database`);
        } else if (action === 'activate') {
          toast.success(`✅ Successfully activated ${data.processed_count} user(s)`);
        } else if (action === 'deactivate') {
          toast.success(`✅ Successfully deactivated ${data.processed_count} user(s)`);
        } else {
          toast.success(data.message || `Bulk action ${action} completed successfully`);
        }
        
        setSelectedUserIds([]); // Clear selection
        refreshData(); // Refresh the data
      } else {
        const error = await response.json();
        console.error('Bulk action error:', error);
        
        // Handle specific error cases
        if (error.requires_super_admin) {
          toast.error('🚫 Access Denied: Only super administrators can perform bulk user deletions');
        } else if (error.requires_password) {
          toast.error('🔐 Password Required: Please provide your password to confirm this action');
        } else {
          toast.error(error.error || `Failed to perform bulk action: ${action}`);
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(`Failed to perform bulk action: ${action}. Please try again.`);
    }
  };

  const handleQuickStatusChange = async (userId, status) => {
    if (!confirm(`Are you sure you want to set this user's status to "${status.charAt(0).toUpperCase() + status.slice(1)}"? This will only update their subscription status, not assign any roles.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription_status: status })
      });

      if (response.ok) {
        toast.success(`Subscription status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
        refreshData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (!isAdminUser && !hasPermission('user_management.users.view')) {
    return <div>Access Denied</div>;
  }

  const handleCreate = async (userData) => {
    const success = await createUser(userData);
    if (success) setShowCreateDialog(false);
  };

  const handleUpdate = async (userData) => {
    const success = await updateUser(selectedUser.id, userData);
    if (success) {
      setShowEditDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSelectUser = (userId, isSelected) => {
    console.log('Selecting user:', userId, 'isSelected:', isSelected);
    setSelectedUserIds(prev => {
      if (isSelected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  const handleSelectAll = (isSelected) => {
    console.log('Select all:', isSelected, 'filtered users count:', filteredUsers.length);
    if (isSelected) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const getSubscriptionBadge = (user) => {
    const subscriptionStatus = user.subscription_status || 'free';
    const variants = {
      'free': 'outline',
      'pending': 'secondary',
      'active': 'default',
      'trial': 'secondary',
      'expired': 'destructive',
      'cancelled': 'outline'
    };
    
    return (
      <Badge variant={variants[subscriptionStatus] || 'outline'}>
        {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Toaster richColors />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users stuck on plan selection and subscription issues
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.total_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.active_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.admin_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.new_users_this_month || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stuckUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'all')}>
                All Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'active')}>
                Active Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'inactive')}>
                Inactive Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          {selectedUserIds.length > 0 && (
            <>
              <Badge variant="secondary" className="px-3 py-1">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate Selected ({selectedUserIds.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate Selected ({selectedUserIds.length})
                  </DropdownMenuItem>
                  {user?.is_super_admin && (
                    <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedUserIds.length})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedUserIds([])}
              >
                Clear Selection
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportUsers('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportUsers('json')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportUsers('xlsx')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="stuck-users">Stuck Users ({stuckUsers.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredUsers.length})</TabsTrigger>
          <TabsTrigger value="plans">Plans (5)</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Stuck Users Tab */}
        <TabsContent value="stuck-users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users Stuck on Plan Selection</CardTitle>
                  <CardDescription>Manage users who haven't completed their payment process</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {stuckUsers.length > 0 && (
                    <>
                      <Button onClick={() => handleBulkActivateStuckUsers()} variant="default" size="sm">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate All ({stuckUsers.length})
                      </Button>
                      <Button onClick={() => handleBulkAssignWithExpiration()} variant="secondary" size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Assign All ({stuckUsers.length})
                      </Button>
                    </>
                  )}
                  <Button onClick={refreshData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stuckUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users stuck on plan selection!</h3>
                  <p className="text-muted-foreground">All users have completed their payment process.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Users Requiring Attention ({stuckUsers.length})</h3>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stuckUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {user.first_name?.[0]}{user.last_name?.[0] || user.username?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Payment Pending</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setShowViewProfile(true);
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendReminder(user)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUserForSubscription(user);
                                    setShowSubscriptionModal(true);
                                  }}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Assign Plan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickAssignWithExpiration(user)}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Assign with Expiration
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleQuickActivate(user)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Quick Activate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Users Tab */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expired Subscriptions</CardTitle>
                  <CardDescription>Users with expired subscription status</CardDescription>
                </div>
                <Button onClick={refreshData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expiredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expired subscriptions!</h3>
                  <p className="text-muted-foreground">All subscriptions are active.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Expired Users ({expiredUsers.length})</h3>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {user.first_name?.[0]}{user.last_name?.[0] || user.username?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Expired</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setShowViewProfile(true);
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendRenewalReminder(user)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Renewal Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUserForSubscription(user);
                                    setShowSubscriptionModal(true);
                                  }}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Reactivate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleQuickReactivate(user)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Quick Reactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage subscription plans and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Subscription Plans Management</h3>
                <p className="text-muted-foreground">This section will show subscription plans management.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Analytics and insights about user behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">User Statistics</h3>
                <p className="text-muted-foreground">This section will show detailed user statistics and analytics.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading ? <p>Loading...</p> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Journals</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow 
                    key={`${user.account_type || 'user'}_${user.id}`}
                    className={selectedUserIds.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                            {user.is_super_admin && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                VIP
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{user.email}</span>
                        {user.is_verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.phone || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.country || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 p-2">
                            {getSubscriptionBadge(user)}
                            <MoreHorizontal className="ml-2 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openSubscriptionModal(user)}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Assign Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Quick Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(user.id, 'free')}>
                            Set to Free
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(user.id, 'active')}>
                            Set to Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(user.id, 'trial')}>
                            Set to Trial
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No Role
                          </Badge>
                        )}
                        {user.is_admin && (
                          <Badge variant="default" className="text-xs bg-purple-600">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{user.journal_count || 0}</span>
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
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowViewProfile(true); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowEditDialog(true); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMessageModal(user)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSubscriptionModal(user)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_active ? (
                            <DropdownMenuItem 
                              onClick={() => toggleUserStatus(user)}
                              className="text-yellow-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => toggleUserStatus(user)}
                              className="text-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.username}? This will deactivate their account and remove access.`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Profile Dialog */}
      <ViewProfileDialog 
        user={selectedUser}
        isOpen={showViewProfile}
        onClose={() => setShowViewProfile(false)}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUserUpdated={refreshData}
      />

      {/* Subscription Assignment Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
            <DialogDescription>
              Assign a subscription plan to {selectedUserForSubscription?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold">{selectedUserForSubscription?.username}</h4>
              <p className="text-sm text-gray-600">{selectedUserForSubscription?.email}</p>
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

            <div>
              <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
              <Input
                id="expiration_date"
                type="date"
                value={subscriptionForm.expiration_date || ''}
                onChange={(e) => setSubscriptionForm({...subscriptionForm, expiration_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use duration days, or set a specific date
              </p>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_activate"
                checked={subscriptionForm.auto_activate}
                onChange={(e) => setSubscriptionForm({...subscriptionForm, auto_activate: e.target.checked})}
              />
              <Label htmlFor="auto_activate" className="text-green-600 font-medium">
                Auto-activate account (set subscription_status to 'active' and is_active to true)
              </Label>
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
                <PlusIcon className="h-4 w-4 mr-2" />
                Assign Plan
              </Button>
              <Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedUserForMessage?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold">{selectedUserForMessage?.username}</h4>
              <p className="text-sm text-gray-600">{selectedUserForMessage?.email}</p>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                placeholder="Message subject..."
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                placeholder="Your message..."
                rows={4}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSendMessage} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the required information.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm
            user={null}
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateDialog(false)}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewEnhancedUserManagement;
