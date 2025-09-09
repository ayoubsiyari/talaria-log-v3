import { useState } from 'react';
import api from '../config/api';
import { toast } from 'sonner';

export const useUserActions = (refreshData) => {
  const [actionLoading, setActionLoading] = useState(false);

  const createUser = async (userData) => {
    setActionLoading(true);
    try {
      console.log('Creating user with data:', userData);
      const response = await api.post('/admin/users/', userData);
      console.log('Create user response:', response);
      toast.success(response.message || 'User created successfully!');
      
      // Add a small delay to ensure backend has processed the creation
      setTimeout(() => {
        console.log('Refreshing data after creation...');
        refreshData();
      }, 500);
      return true;
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Failed to create user.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    setActionLoading(true);
    try {
      console.log('Updating user with data:', userData);
      const response = await api.put(`/admin/users/${userId}/`, userData);
      console.log('Update user response:', response);
      toast.success(response.message || 'User updated successfully!');
      
      // Add a small delay to ensure backend has processed the update
      setTimeout(() => {
        console.log('Refreshing data after update...');
        refreshData();
      }, 500);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      toast.error(error.message || 'Failed to update user.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    setActionLoading(true);
    try {
      console.log('Deleting user:', userId);
      const response = await api.delete(`/admin/users/${userId}/`);
      console.log('Delete user response:', response);
      toast.success('User deactivated and removed from active users!');
      
      // Immediate UI update for better user experience
      setTimeout(() => {
        console.log('Refreshing data after deletion...');
        refreshData();
      }, 300); // Reduced delay for faster feedback
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete user.';
      toast.error(errorMessage);
      
      // Still refresh data to ensure UI is in sync
      setTimeout(() => {
        console.log('Refreshing data after error...');
        refreshData();
      }, 300);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    setActionLoading(true);
    try {
      console.log('Toggling user status:', user.id, user.is_active);
      const response = await api.post(`/admin/users/${user.id}/suspend/`, { suspend: user.is_active });
      console.log('Toggle status response:', response);
      
      const newStatus = !user.is_active;
      toast.success(`User ${newStatus ? 'activated' : 'suspended'} successfully!`);
      
      // Immediate UI update for better user experience
      setTimeout(() => {
        console.log('Refreshing data after status change...');
        refreshData();
      }, 300); // Reduced delay for faster feedback
    } catch (error) {
      console.error('Toggle user status error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update user status.';
      toast.error(errorMessage);
      
      // Still refresh data to ensure UI is in sync
      setTimeout(() => {
        console.log('Refreshing data after error...');
        refreshData();
      }, 300);
    } finally {
      setActionLoading(false);
    }
  };
  
  const executeBulkAction = async (action, userIds) => {
      setActionLoading(true);
      try {
          console.log('Executing bulk action:', action, userIds);
          await api.post('/admin/users/bulk-action/', { action, user_ids: userIds });
          toast.success(`Bulk action '${action}' executed successfully.`);
          
          // Add a small delay to ensure backend has processed the bulk action
          setTimeout(() => {
            console.log('Refreshing data after bulk action...');
            refreshData();
          }, 500);
      } catch (error) {
          console.error('Bulk action error:', error);
          toast.error(`Failed to execute bulk action: ${error.message}`);
      } finally {
          setActionLoading(false);
      }
  };

  return { createUser, updateUser, deleteUser, toggleUserStatus, executeBulkAction, actionLoading };
};
