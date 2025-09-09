import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const QuickDebug = () => {
  const [status, setStatus] = useState('Initializing...');
  const [results, setResults] = useState({});

  useEffect(() => {
    runQuickTest();
  }, []);

  const runQuickTest = async () => {
    setStatus('Running tests...');
    const testResults = {};

    // Test 1: Check localStorage
    try {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      
      testResults.localStorage = {
        hasToken: !!token,
        hasUser: !!user,
        userData: user ? JSON.parse(user) : null
      };
      
      console.log('LocalStorage check:', testResults.localStorage);
    } catch (error) {
      testResults.localStorage = { error: error.message };
    }

    // Test 2: Check if user is admin
    if (testResults.localStorage.userData) {
      const user = testResults.localStorage.userData;
      testResults.adminCheck = {
        isSuperAdmin: user.is_super_admin || false,
        isAdmin: user.is_admin || false,
        accountType: user.account_type || 'unknown',
        username: user.username,
        email: user.email
      };
    }

    // Test 3: Test API call
    try {
      const response = await api.get('/api/admin/users');
      testResults.apiCall = {
        success: true,
        userCount: response.users?.length || 0,
        pagination: response.pagination
      };
      console.log('API call successful:', testResults.apiCall);
    } catch (error) {
      testResults.apiCall = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('API call failed:', error);
    }

    // Test 4: Test stats API
    try {
      const statsResponse = await api.get('/api/admin/users/stats');
      testResults.statsCall = {
        success: true,
        stats: statsResponse
      };
    } catch (error) {
      testResults.statsCall = {
        success: false,
        error: error.message
      };
    }

    setResults(testResults);
    setStatus('Tests completed');
  };

  const retryTest = () => {
    setStatus('Retrying...');
    runQuickTest();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quick Debug Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={retryTest}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {status}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* LocalStorage */}
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">LocalStorage Check</h3>
          {results.localStorage ? (
            <div>
              <p><strong>Has Token:</strong> {results.localStorage.hasToken ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Has User:</strong> {results.localStorage.hasUser ? '✅ Yes' : '❌ No'}</p>
              {results.localStorage.userData && (
                <div className="mt-2">
                  <p><strong>Username:</strong> {results.localStorage.userData.username}</p>
                  <p><strong>Email:</strong> {results.localStorage.userData.email}</p>
                  <p><strong>Account Type:</strong> {results.localStorage.userData.account_type}</p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Admin Check */}
        {results.adminCheck && (
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-bold mb-2">Admin Check</h3>
            <p><strong>Is Super Admin:</strong> {results.adminCheck.isSuperAdmin ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Admin:</strong> {results.adminCheck.isAdmin ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Account Type:</strong> {results.adminCheck.accountType}</p>
          </div>
        )}

        {/* API Call */}
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-bold mb-2">Users API Call</h3>
          {results.apiCall ? (
            results.apiCall.success ? (
              <div>
                <p className="text-green-600">✅ API call successful!</p>
                <p><strong>Users found:</strong> {results.apiCall.userCount}</p>
                <p><strong>Pagination:</strong> {JSON.stringify(results.apiCall.pagination)}</p>
              </div>
            ) : (
              <div>
                <p className="text-red-600">❌ API call failed</p>
                <p><strong>Error:</strong> {results.apiCall.error}</p>
                <p><strong>Status:</strong> {results.apiCall.status}</p>
              </div>
            )
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Stats Call */}
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="font-bold mb-2">Stats API Call</h3>
          {results.statsCall ? (
            results.statsCall.success ? (
              <div>
                <p className="text-green-600">✅ Stats call successful!</p>
                <pre className="text-sm mt-2 bg-white p-2 rounded">
                  {JSON.stringify(results.statsCall.stats, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <p className="text-red-600">❌ Stats call failed</p>
                <p><strong>Error:</strong> {results.statsCall.error}</p>
              </div>
            )
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>

      {/* Raw Results */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">Raw Results</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default QuickDebug;
