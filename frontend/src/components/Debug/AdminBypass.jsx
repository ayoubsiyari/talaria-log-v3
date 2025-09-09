import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Shield, Users, Key, Settings } from 'lucide-react';

const AdminBypass = ({ onNavigate }) => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const token = localStorage.getItem('access_token');

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Access Bypass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">User Info:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify({
                  username: user?.username,
                  email: user?.email,
                  account_type: user?.account_type,
                  is_super_admin: user?.is_super_admin,
                  is_admin: user?.is_admin
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Auth Status:</h3>
              <p>Token: {token ? '✅ Present' : '❌ Missing'}</p>
              <p>User: {user ? '✅ Loaded' : '❌ Missing'}</p>
              <p>Admin Type: {user?.account_type}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={() => onNavigate('users')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Users (Bypass)
            </Button>
            <Button 
              onClick={() => onNavigate('roles')}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Roles (Bypass)
            </Button>
            <Button 
              onClick={() => onNavigate('admin-users')}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Users
            </Button>
            <Button 
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBypass;
