import React, { useState, useEffect } from 'react';

const EmergencyFix = () => {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      setResults(prev => ({ ...prev, backend: { success: true, data } }));
      setStep(2);
    } catch (error) {
      setResults(prev => ({ ...prev, backend: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@talaria.com',
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        // Store the tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setResults(prev => ({ ...prev, login: { success: true, data } }));
        setStep(3);
      } else {
        setResults(prev => ({ ...prev, login: { success: false, error: data } }));
      }
    } catch (error) {
      setResults(prev => ({ ...prev, login: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const testUsersAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(prev => ({ ...prev, users: { success: true, data } }));
        setStep(4);
      } else {
        setResults(prev => ({ ...prev, users: { success: false, error: data } }));
      }
    } catch (error) {
      setResults(prev => ({ ...prev, users: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const testStatsAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(prev => ({ ...prev, stats: { success: true, data } }));
        setStep(5);
      } else {
        setResults(prev => ({ ...prev, stats: { success: false, error: data } }));
      }
    } catch (error) {
      setResults(prev => ({ ...prev, stats: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🚨 Emergency Fix - Step by Step</h1>
      
      <div className="space-y-6">
        {/* Step 1: Backend Connection */}
        <div className={`p-4 rounded border-2 ${step >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <h3 className="text-lg font-bold mb-2">Step 1: Test Backend Connection</h3>
          <p className="mb-3">First, let's make sure the backend server is running and accessible.</p>
          
          {step === 1 && (
            <button
              onClick={testBackendConnection}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Backend Connection'}
            </button>
          )}
          
          {results.backend && (
            <div className={`mt-3 p-3 rounded ${results.backend.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {results.backend.success ? (
                <p className="text-green-700">✅ Backend is running and accessible!</p>
              ) : (
                <p className="text-red-700">❌ Backend connection failed: {results.backend.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Login */}
        <div className={`p-4 rounded border-2 ${step >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <h3 className="text-lg font-bold mb-2">Step 2: Admin Login</h3>
          <p className="mb-3">Now let's log in as admin to get authentication tokens.</p>
          
          {step === 2 && (
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          )}
          
          {results.login && (
            <div className={`mt-3 p-3 rounded ${results.login.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {results.login.success ? (
                <div>
                  <p className="text-green-700">✅ Login successful!</p>
                  <p className="text-sm text-green-600">Tokens stored in localStorage</p>
                </div>
              ) : (
                <p className="text-red-700">❌ Login failed: {JSON.stringify(results.login.error)}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Test Users API */}
        <div className={`p-4 rounded border-2 ${step >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <h3 className="text-lg font-bold mb-2">Step 3: Test Users API</h3>
          <p className="mb-3">Test if we can fetch users with the authentication token.</p>
          
          {step === 3 && (
            <button
              onClick={testUsersAPI}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Users API'}
            </button>
          )}
          
          {results.users && (
            <div className={`mt-3 p-3 rounded ${results.users.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {results.users.success ? (
                <div>
                  <p className="text-green-700">✅ Users API working!</p>
                  <p className="text-sm text-green-600">
                    Found {results.users.data.users?.length || 0} users
                  </p>
                </div>
              ) : (
                <p className="text-red-700">❌ Users API failed: {JSON.stringify(results.users.error)}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Test Stats API */}
        <div className={`p-4 rounded border-2 ${step >= 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
          <h3 className="text-lg font-bold mb-2">Step 4: Test Stats API</h3>
          <p className="mb-3">Test if we can fetch dashboard statistics.</p>
          
          {step === 4 && (
            <button
              onClick={testStatsAPI}
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Stats API'}
            </button>
          )}
          
          {results.stats && (
            <div className={`mt-3 p-3 rounded ${results.stats.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {results.stats.success ? (
                <div>
                  <p className="text-green-700">✅ Stats API working!</p>
                  <p className="text-sm text-green-600">
                    Total Users: {results.stats.data.total_users || results.stats.data.overview?.total_users || 0}
                  </p>
                </div>
              ) : (
                <p className="text-red-700">❌ Stats API failed: {JSON.stringify(results.stats.error)}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="p-4 rounded border-2 border-green-500 bg-green-50">
            <h3 className="text-lg font-bold mb-2 text-green-700">🎉 All Tests Passed!</h3>
            <p className="mb-3">Everything is working! Now let's reload the app to see the real data.</p>
            
            <button
              onClick={reloadApp}
              className="bg-green-500 text-white px-6 py-3 rounded text-lg"
            >
              Reload App & See Real Data
            </button>
            
            <div className="mt-4 p-3 bg-white rounded">
              <h4 className="font-bold mb-2">What should work now:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Dashboard should show real numbers (4 total users, 3 active)</li>
                <li>User Management should display the user list</li>
                <li>All API calls should work with authentication</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Current Status */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Current Status:</h3>
        <div className="space-y-1 text-sm">
          <p>Step: {step}/5</p>
          <p>Backend: {results.backend?.success ? '✅ Working' : '❌ Failed'}</p>
          <p>Login: {results.login?.success ? '✅ Working' : '❌ Failed'}</p>
          <p>Users API: {results.users?.success ? '✅ Working' : '❌ Failed'}</p>
          <p>Stats API: {results.stats?.success ? '✅ Working' : '❌ Failed'}</p>
        </div>
      </div>

      {/* Raw Results for Debugging */}
      {Object.keys(results).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto bg-white p-2 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmergencyFix;
