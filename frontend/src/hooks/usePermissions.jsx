import { useState, useEffect, useContext, createContext } from 'react';
import api from '../config/api';

// Create Permission Context
const PermissionContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserPermissions = async () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    if (!token || !user) {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use roles from localStorage (from login response)
      let userRoles = user.roles || [];
      
      console.log('User roles from localStorage:', userRoles);
      
      // Extract permissions from roles
      const allPermissions = new Set();
      userRoles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            allPermissions.add(permission);
          });
        }
      });
      
      console.log('Extracted permissions:', Array.from(allPermissions));
      
      setRoles(userRoles);
      setPermissions(Array.from(allPermissions));
    } catch (error) {
      console.error('Error processing user permissions:', error);
      setError(error.message);
      
      // Fallback for admin users
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      if (user && (user.is_super_admin || user.account_type === 'admin')) {
        setRoles([{
          id: 1,
          name: 'super_admin',
          display_name: 'Super Administrator',
          permissions: []
        }]);
      } else {
        setPermissions([]);
        setRoles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const hasPermission = (permission) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.is_super_admin || user.account_type === 'admin') return true;
    
    // Check if user has the specific permission
    return permissions.some(p => p.name === permission || p === permission);
  };

  const hasAnyPermission = (permissionList) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    if (user.is_super_admin || user.account_type === 'admin') return true;
    
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    if (user.is_super_admin || user.account_type === 'admin') return true;
    
    return permissionList.every(permission => hasPermission(permission));
  };

  const hasRole = (roleName) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    return roles.some(role => role.name === roleName);
  };

  const hasAnyRole = (roleNames) => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    return roleNames.some(roleName => hasRole(roleName));
  };

  const isAdmin = () => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    return user.account_type === 'admin' || hasRole('super_admin') || hasRole('admin');
  };

  const isSuperAdmin = () => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user) return false;
    return user.is_super_admin || hasRole('super_admin');
  };

  const value = {
    permissions,
    roles,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    refreshPermissions: fetchUserPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
