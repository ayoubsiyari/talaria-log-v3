import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

const UserDebug = () => {
  const { user } = useAuth();
  const { roles, permissions, hasRole, hasPermission } = usePermissions();

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">User Debug Info</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">User Object:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Roles:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(roles, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Permissions:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Role Checks:</h4>
          <ul className="text-sm">
            <li>hasRole('super_admin'): {hasRole('super_admin') ? 'Yes' : 'No'}</li>
            <li>hasRole('admin'): {hasRole('admin') ? 'Yes' : 'No'}</li>
            <li>user?.account_type: {user?.account_type}</li>
            <li>user?.is_super_admin: {user?.is_super_admin ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">Permission Checks:</h4>
          <ul className="text-sm">
            <li>hasPermission('users.view'): {hasPermission('users.view') ? 'Yes' : 'No'}</li>
            <li>hasPermission('roles.view'): {hasPermission('roles.view') ? 'Yes' : 'No'}</li>
            <li>hasPermission('analytics.view'): {hasPermission('analytics.view') ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserDebug;
