import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import api from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';

const UserCreationTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testUser, setTestUser] = useState({
    username: 'testuser123',
    email: 'testuser123@example.com',
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    subscription_status: 'free',
    is_active: true
  });

  const { hasPermission } = usePermissions();

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Check permissions
    const hasCreatePermission = hasPermission('user_management.users.create');
    addResult('Permission Check', hasCreatePermission ? 'PASS' : 'FAIL', 
      `user_management.users.create: ${hasCreatePermission}`);

    // Test 2: Check user data in localStorage
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    addResult('User Data', user ? 'PASS' : 'FAIL', 
      user ? `Account type: ${user.account_type}, Admin: ${user.is_admin}, Super Admin: ${user.is_super_admin}` : 'No user data found');

    // Test 3: Check token
    const token = localStorage.getItem('access_token');
    addResult('Token Check', token ? 'PASS' : 'FAIL', 
      token ? 'Token exists' : 'No access token found');

    // Test 4: Test API connectivity
    try {
      const response = await api.get('/admin/users/stats');
      addResult('API Connectivity', 'PASS', 'Successfully connected to admin API', response.data);
    } catch (error) {
      addResult('API Connectivity', 'FAIL', `API Error: ${error.message}`, error.response?.data);
    }

    // Test 5: Test user creation endpoint
    try {
      console.log('Testing user creation with data:', testUser);
      const response = await api.post('/admin/users', testUser);
      addResult('User Creation', 'PASS', 'User created successfully', response.data);
      
      // Clean up - delete the test user
      try {
        await api.delete(`/admin/users/${response.data.user.id}`);
        addResult('Cleanup', 'PASS', 'Test user deleted successfully');
      } catch (cleanupError) {
        addResult('Cleanup', 'WARN', 'Failed to delete test user', cleanupError.response?.data);
      }
    } catch (error) {
      addResult('User Creation', 'FAIL', 
        `Creation failed: ${error.response?.data?.error || error.message}`, 
        error.response?.data);
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Creation Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Username</Label>
              <Input 
                value={testUser.username}
                onChange={(e) => setTestUser({...testUser, username: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={testUser.email}
                onChange={(e) => setTestUser({...testUser, email: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={runTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Debug Tests'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                    result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer">View Data</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    <div className="text-xs text-gray-500">{result.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserCreationTest;
