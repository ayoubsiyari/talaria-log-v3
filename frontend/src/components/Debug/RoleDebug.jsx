import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const RoleDebug = () => {
  const { roles, permissions, loading, error } = usePermissions();
  
  // Get user from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Role Debug Info</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">User from localStorage:</h4>
        <pre className="text-xs bg-white p-2 rounded">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold">Roles from context:</h4>
        <pre className="text-xs bg-white p-2 rounded">
          {JSON.stringify(roles, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold">Permissions from context:</h4>
        <pre className="text-xs bg-white p-2 rounded">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
      
      <div>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
      </div>
    </div>
  );
};

export default RoleDebug;
