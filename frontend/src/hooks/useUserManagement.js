import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/config';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, per_page: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: '', statusFilter: 'all' });

  const fetchUsers = useCallback(async (page = pagination.page, perPage = pagination.per_page, searchTerm = filters.searchTerm, statusFilter = filters.statusFilter) => {
    console.log('=== fetchUsers Debug ===');
    console.log('fetchUsers called with:', { page, perPage, searchTerm, statusFilter });
    console.log('API base URL:', API_BASE_URL);
    console.log('Access token exists:', !!localStorage.getItem('access_token'));
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        per_page: perPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const endpoint = `/admin/users?${params}`;
      console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);
      
      const response = await api.get(endpoint);
      console.log('API response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      const responseData = response.data || response;
      console.log('Response data:', responseData);
      console.log('Users array:', responseData.users);
      console.log('Pagination:', responseData.pagination);
      
      // Filter out soft-deleted users (users with "deleted_" prefix in email or username)
      const activeUsers = (responseData.users || []).filter(user => {
        const isDeleted = user.email?.includes('deleted_') || user.username?.includes('deleted_');
        return !isDeleted;
      });
      
      console.log('Filtered out soft-deleted users:', {
        total: responseData.users?.length || 0,
        active: activeUsers.length,
        filtered: (responseData.users?.length || 0) - activeUsers.length
      });
      
      setUsers(activeUsers);
      setPagination(responseData.pagination || { page: 1, pages: 1, per_page: 20, total: 0 });
      setError(null);
      console.log('=== fetchUsers Success ===');
    } catch (err) {
      console.error('=== fetchUsers Error ===');
      console.error('Error type:', typeof err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Full error object:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(`Failed to fetch users: ${errorMessage}`);
      console.log('=== fetchUsers Error End ===');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, filters.searchTerm, filters.statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('=== fetchStats Debug ===');
      console.log('Fetching stats...');
      const response = await api.get('/admin/users/stats/');
      console.log('Stats response:', response);
      console.log('Stats response type:', typeof response);
      const responseData = response.data || response;
      console.log('Stats data:', responseData);
      
      // The backend returns stats in a nested structure
      if (responseData.success && responseData.stats) {
        setStats(responseData);
      } else {
        // Fallback for different response structure
        setStats(responseData);
      }
      console.log('=== fetchStats Success ===');
    } catch (err) {
      console.error('=== fetchStats Error ===');
      console.error('Error fetching stats:', err);
      console.error('Error message:', err.message);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      toast.error(`Failed to fetch user stats: ${err.message}`);
      console.log('=== fetchStats Error End ===');
    }
  }, []);

  useEffect(() => {
    fetchUsers(pagination.page, pagination.per_page, filters.searchTerm, filters.statusFilter);
    fetchStats();
  }, [fetchUsers, fetchStats, pagination.page, pagination.per_page, filters.searchTerm, filters.statusFilter]);

  const handleFilterChange = (newFilters) => {
    setPagination(p => ({ ...p, page: 1 }));
    setFilters(f => ({ ...f, ...newFilters }));
  };
  
  const refreshData = () => {
      fetchUsers(pagination.page, pagination.per_page, filters.searchTerm, filters.statusFilter);
      fetchStats();
  };

  return { users, stats, pagination, loading, error, filters, handleFilterChange, setPagination, refreshData };
};
