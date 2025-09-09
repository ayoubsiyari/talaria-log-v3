import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const UserFetchTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, data = null, isError = false) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      message,
      data,
      isError,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Check authentication
    addResult('Testing authentication...');
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (!token) {
      addResult('❌ No access token found', null, true);
      setLoading(false);
      return;
    }
    
    addResult('✅ Access token found');
    
    if (user) {
      const userData = JSON.parse(user);
      addResult('✅ User data found', userData);
    } else {
      addResult('❌ No user data found', null, true);
    }

    // Test 2: Test API configuration
    addResult('Testing API configuration...');
    try {
      const response = await api.get('/api/health');
      addResult('✅ API health check passed', response);
    } catch (error) {
      addResult('❌ API health check failed', error.message, true);
    }

    // Test 3: Test users endpoint
    addResult('Testing users endpoint...');
    try {
      const response = await api.get('/api/admin/users');
      addResult('✅ Users endpoint working', {
        userCount: response.users?.length || 0,
        pagination: response.pagination
      });
    } catch (error) {
      addResult('❌ Users endpoint failed', error.message, true);
    }

    // Test 4: Test stats endpoint
    addResult('Testing stats endpoint...');
    try {
      const response = await api.get('/api/admin/users/stats');
      addResult('✅ Stats endpoint working', response);
    } catch (error) {
      addResult('❌ Stats endpoint failed', error.message, true);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Fetch Debug Test</h1>
      
      <button 
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className="space-y-2">
        {testResults.map(result => (
          <div 
            key={result.id}
            className={`p-3 rounded border ${
              result.isError 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <div className="font-medium">{result.message}</div>
            {result.data && (
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
            <div className="text-xs text-gray-500 mt-1">{result.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserFetchTest;
