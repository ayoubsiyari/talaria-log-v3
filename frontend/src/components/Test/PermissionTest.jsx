import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../config/api';

const PermissionTest = () => {
  const { permissions, roles, hasPermission, isAdmin, isSuperAdmin } = usePermissions();
  const [userData, setUserData] = useState(null);
  const [apiPermissions, setApiPermissions] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      setUserData(JSON.parse(user));
    }
  }, []);

  const testPermission = (permissionName) => {
    return hasPermission(permissionName);
  };

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      
      if (!token || !user) {
        console.log('No token or user data');
        return;
      }

      // Try to get user permissions from API
      const endpoint = user.account_type === 'admin' ? '/auth/admin/me' : '/auth/me';
      const response = await api.get(endpoint);
      
      if (response.data) {
        const userData = response.data.admin || response.data.user;
        console.log('API user data:', userData);
        
        if (userData.roles) {
          const allPermissions = new Set();
          userData.roles.forEach(role => {
            if (role.permissions) {
              role.permissions.forEach(permission => {
                allPermissions.add(permission);
              });
            }
          });
          setApiPermissions(Array.from(allPermissions));
        }
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Permission Debug Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">User Information</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>

        {/* Permission Status */}
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-bold mb-2">Permission Status</h3>
          <div className="space-y-2">
            <p><strong>Is Admin:</strong> {isAdmin() ? 'Yes' : 'No'}</p>
            <p><strong>Is Super Admin:</strong> {isSuperAdmin() ? 'Yes' : 'No'}</p>
            <p><strong>Total Permissions:</strong> {permissions.length}</p>
            <p><strong>Total Roles:</strong> {roles.length}</p>
          </div>
        </div>
      </div>

      {/* Specific Permission Tests */}
      <div className="mt-6 bg-yellow-50 p-4 rounded">
        <h3 className="font-bold mb-2">Specific Permission Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            'user_management.users.view',
            'user_management.users.create',
            'user_management.users.edit',
            'user_management.users.delete',
            'user_management.users.activate',
            'user_management.users.suspend'
          ].map(permission => (
            <div key={permission} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${testPermission(permission) ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm">{permission}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Permissions */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">All User Permissions ({permissions.length})</h3>
        <div className="max-h-40 overflow-auto">
          {permissions.map((permission, index) => (
            <div key={index} className="text-sm py-1">
              {typeof permission === 'string' ? permission : permission.name}
            </div>
          ))}
        </div>
      </div>

      {/* User Roles */}
      <div className="mt-6 bg-purple-50 p-4 rounded">
        <h3 className="font-bold mb-2">User Roles ({roles.length})</h3>
        <div className="space-y-2">
          {roles.map((role, index) => (
            <div key={index} className="text-sm">
              <strong>{role.name || role.display_name}</strong>
              {role.permissions && (
                <div className="ml-4 text-xs text-gray-600">
                  Permissions: {role.permissions.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Permissions */}
      <div className="mt-6 bg-orange-50 p-4 rounded">
        <h3 className="font-bold mb-2">API Permissions ({apiPermissions.length})</h3>
        <button 
          onClick={fetchUserPermissions}
          className="bg-orange-500 text-white px-4 py-2 rounded mb-2"
        >
          Fetch API Permissions
        </button>
        <div className="max-h-40 overflow-auto">
          {apiPermissions.map((permission, index) => (
            <div key={index} className="text-sm py-1">
              {permission}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionTest;
