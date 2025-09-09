import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, Users, Key, CheckCircle, XCircle } from 'lucide-react';

const AdminTest = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('access_token');
    
    setUser(userData ? JSON.parse(userData) : null);
    setToken(tokenData);

    // Run permission tests
    const results = {
      hasToken: !!tokenData,
      hasUser: !!userData,
      isAdmin: false,
      isSuperAdmin: false,
      accountType: 'unknown'
    };

    if (userData) {
      const parsedUser = JSON.parse(userData);
      results.isAdmin = parsedUser.account_type === 'admin' || parsedUser.is_admin;
      results.isSuperAdmin = parsedUser.is_super_admin;
      results.accountType = parsedUser.account_type || 'regular';
    }

    setTestResults(results);
  }, []);

  const TestResult = ({ label, value, success }) => (
    <div className="flex items-center justify-between p-2 border rounded">
      <span className="font-medium">{label}:</span>
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={success ? "text-green-700" : "text-red-700"}>
          {value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Access Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3">Authentication Status</h3>
              <div className="space-y-2">
                <TestResult 
                  label="Access Token" 
                  value={testResults.hasToken ? "Present" : "Missing"} 
                  success={testResults.hasToken} 
                />
                <TestResult 
                  label="User Data" 
                  value={testResults.hasUser ? "Present" : "Missing"} 
                  success={testResults.hasUser} 
                />
                <TestResult 
                  label="Account Type" 
                  value={testResults.accountType} 
                  success={testResults.accountType === 'admin'} 
                />
                <TestResult 
                  label="Is Admin" 
                  value={testResults.isAdmin ? "Yes" : "No"} 
                  success={testResults.isAdmin} 
                />
                <TestResult 
                  label="Is Super Admin" 
                  value={testResults.isSuperAdmin ? "Yes" : "No"} 
                  success={testResults.isSuperAdmin} 
                />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">User Details</h3>
              {user ? (
                <div className="space-y-2 text-sm">
                  <div><strong>Username:</strong> {user.username}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Account Type:</strong> 
                    <Badge variant={user.account_type === 'admin' ? 'default' : 'secondary'} className="ml-2">
                      {user.account_type}
                    </Badge>
                  </div>
                  <div><strong>Super Admin:</strong> {user.is_super_admin ? '✅' : '❌'}</div>
                  <div><strong>Admin:</strong> {user.is_admin ? '✅' : '❌'}</div>
                </div>
              ) : (
                <p className="text-muted-foreground">No user data found</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Direct Access Test</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                variant={testResults.isAdmin || testResults.isSuperAdmin ? "default" : "secondary"}
                className="flex items-center gap-2"
                disabled={!testResults.isAdmin && !testResults.isSuperAdmin}
              >
                <Users className="w-4 h-4" />
                Users
              </Button>
              <Button 
                variant={testResults.isAdmin || testResults.isSuperAdmin ? "default" : "secondary"}
                className="flex items-center gap-2"
                disabled={!testResults.isAdmin && !testResults.isSuperAdmin}
              >
                <Key className="w-4 h-4" />
                Roles
              </Button>
              <Button 
                variant={testResults.isAdmin || testResults.isSuperAdmin ? "default" : "secondary"}
                className="flex items-center gap-2"
                disabled={!testResults.isAdmin && !testResults.isSuperAdmin}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>
              <Button variant="outline">
                Test API
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Recommendation</h3>
            {testResults.isAdmin || testResults.isSuperAdmin ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  ✅ Admin access detected. You should be able to access all admin features.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">
                  ❌ No admin access detected. Check your login credentials or contact system administrator.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTest;
