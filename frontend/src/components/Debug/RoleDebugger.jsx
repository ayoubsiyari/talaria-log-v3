import React, { useState, useEffect } from 'react';
import roleService from '@/services/roleService';

const RoleDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const debugRoles = async () => {
    setLoading(true);
    try {
      console.log('=== ROLE DEBUG START ===');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      console.log('User data from localStorage:', userData);
      console.log('Token exists:', !!token);
      
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Parsed user:', user);
      }
      
      // Clear cache and fetch fresh data
      roleService.clearCache();
      const { roles, permissions } = await roleService.getRolesAndPermissions(true);
      
      console.log('Fetched roles:', roles);
      console.log('Fetched permissions:', permissions);
      
      // Check specific role
      const hasUserManager = roleService.hasRole('user_manager');
      console.log('Has user_manager role:', hasUserManager);
      
      const primaryRole = roleService.getPrimaryRole();
      console.log('Primary role:', primaryRole);
      
      setDebugInfo({
        userData: userData ? JSON.parse(userData) : null,
        hasToken: !!token,
        roles,
        permissions,
        hasUserManager,
        primaryRole
      });
      
      console.log('=== ROLE DEBUG END ===');
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Role Debugger</h3>
      
      <button 
        onClick={debugRoles}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Debugging...' : 'Debug Roles'}
      </button>
      
      {debugInfo && (
        <div className="mt-4">
          <h4 className="font-semibold">Debug Results:</h4>
          <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RoleDebugger;