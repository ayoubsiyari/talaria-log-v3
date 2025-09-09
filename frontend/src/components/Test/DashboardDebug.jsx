import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const DashboardDebug = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    const testResults = {};

    // Test 1: Check authentication
    console.log('=== Testing Authentication ===');
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    testResults.auth = {
      hasToken: !!token,
      hasUser: !!user,
      userData: user ? JSON.parse(user) : null
    };

    // Test 2: Test users endpoint
    console.log('=== Testing Users API ===');
    try {
      const usersResponse = await api.get('/api/admin/users');
      testResults.users = {
        success: true,
        data: usersResponse,
        userCount: usersResponse.users?.length || 0
      };
      console.log('Users API success:', usersResponse);
    } catch (error) {
      testResults.users = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('Users API failed:', error);
    }

    // Test 3: Test stats endpoint
    console.log('=== Testing Stats API ===');
    try {
      const statsResponse = await api.get('/api/admin/users/stats');
      testResults.stats = {
        success: true,
        data: statsResponse
      };
      console.log('Stats API success:', statsResponse);
    } catch (error) {
      testResults.stats = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('Stats API failed:', error);
    }

    // Test 4: Test health endpoint
    console.log('=== Testing Health API ===');
    try {
      const healthResponse = await api.get('/api/health');
      testResults.health = {
        success: true,
        data: healthResponse
      };
    } catch (error) {
      testResults.health = {
        success: false,
        error: error.message
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard Debug - Why Showing 0 Values?</h1>
      
      <button 
        onClick={runAllTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Tests Again'}
      </button>

      {/* Authentication Status */}
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Authentication Status</h3>
        {results.auth ? (
          <div>
            <p><strong>Has Token:</strong> {results.auth.hasToken ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Has User:</strong> {results.auth.hasUser ? '✅ Yes' : '❌ No'}</p>
            {results.auth.userData && (
              <div className="mt-2">
                <p><strong>User:</strong> {results.auth.userData.username} ({results.auth.userData.email})</p>
                <p><strong>Account Type:</strong> {results.auth.userData.account_type}</p>
                <p><strong>Is Admin:</strong> {results.auth.userData.is_admin ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Users API Test */}
      <div className="bg-green-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Users API Test</h3>
        {results.users ? (
          results.users.success ? (
            <div>
              <p className="text-green-600">✅ Users API Working!</p>
              <p><strong>Users Found:</strong> {results.users.userCount}</p>
              <p><strong>Pagination:</strong> {JSON.stringify(results.users.data.pagination)}</p>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Users API Failed</p>
              <p><strong>Error:</strong> {results.users.error}</p>
              <p><strong>Status:</strong> {results.users.status}</p>
            </div>
          )
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Stats API Test */}
      <div className="bg-yellow-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Stats API Test</h3>
        {results.stats ? (
          results.stats.success ? (
            <div>
              <p className="text-green-600">✅ Stats API Working!</p>
              <pre className="text-sm bg-white p-2 rounded mt-2">
                {JSON.stringify(results.stats.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Stats API Failed</p>
              <p><strong>Error:</strong> {results.stats.error}</p>
              <p><strong>Status:</strong> {results.stats.status}</p>
            </div>
          )
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Health API Test */}
      <div className="bg-purple-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Health API Test</h3>
        {results.health ? (
          results.health.success ? (
            <div>
              <p className="text-green-600">✅ Health API Working!</p>
              <pre className="text-sm bg-white p-2 rounded mt-2">
                {JSON.stringify(results.health.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Health API Failed</p>
              <p><strong>Error:</strong> {results.health.error}</p>
            </div>
          )
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Quick Fix Instructions */}
      <div className="bg-red-50 p-4 rounded">
        <h3 className="font-bold mb-2">Quick Fix Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>If authentication shows ❌ No token/user, you need to log in first</li>
          <li>Use the LoginHelper component to log in with admin@talaria.com / admin123</li>
          <li>If API calls are failing, check if the backend server is running</li>
          <li>If you see 401 errors, the token is invalid or expired</li>
          <li>If you see 403 errors, the user doesn't have the right permissions</li>
        </ol>
      </div>

      {/* Raw Results */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">Raw Test Results</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DashboardDebug;
