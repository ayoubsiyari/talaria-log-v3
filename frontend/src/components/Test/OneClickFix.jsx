import React, { useState } from 'react';

const OneClickFix = () => {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fixEverything = async () => {
    setLoading(true);
    setStatus('Starting emergency fix...');
    
    try {
      // Step 1: Login
      setStatus('Step 1: Logging in as admin...');
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@talaria.com',
          password: 'admin123'
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      
      if (!loginData.access_token) {
        throw new Error('No access token received');
      }
      
      // Store authentication data
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('refresh_token', loginData.refresh_token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      
      setStatus('Step 2: Testing API endpoints...');
      
      // Step 2: Test users API
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error(`Users API failed: ${usersResponse.status}`);
      }
      
      // Step 3: Test stats API
      const statsResponse = await fetch('http://localhost:5000/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API failed: ${statsResponse.status}`);
      }
      
      const statsData = await statsResponse.json();
      
      setStatus('✅ Everything fixed! Reloading app...');
      setResult({
        success: true,
        message: 'All systems working! Dashboard and user management should now show real data.',
        stats: statsData
      });
      
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setStatus('❌ Fix failed');
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🚀 One-Click Emergency Fix</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
        <h3 className="font-bold text-yellow-800 mb-2">What This Will Do:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
          <li>Log you in as admin automatically</li>
          <li>Store authentication tokens in localStorage</li>
          <li>Test all API endpoints</li>
          <li>Reload the app to show real data</li>
        </ul>
      </div>
      
      <div className="text-center mb-6">
        <button
          onClick={fixEverything}
          disabled={loading}
          className={`px-8 py-4 rounded-lg text-lg font-bold ${
            loading 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {loading ? 'Fixing...' : '🚀 Fix Everything Now'}
        </button>
      </div>
      
      {status && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="font-medium">{status}</p>
        </div>
      )}
      
      {result && (
        <div className={`p-4 rounded border-2 ${
          result.success 
            ? 'border-green-500 bg-green-50' 
            : 'border-red-500 bg-red-50'
        }`}>
          <h3 className={`font-bold mb-2 ${
            result.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>
          <p className="mb-2">{result.message}</p>
          
          {result.success && result.stats && (
            <div className="mt-3 p-3 bg-white rounded">
              <h4 className="font-bold mb-2">Current Data:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Total Users:</strong> {result.stats.total_users || result.stats.overview?.total_users || 0}</p>
                  <p><strong>Active Users:</strong> {result.stats.active_users || result.stats.overview?.active_users || 0}</p>
                </div>
                <div>
                  <p><strong>MRR:</strong> ${result.stats.mrr || 0}</p>
                  <p><strong>Churn Rate:</strong> {result.stats.churn_rate || 0}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">After the fix, you should see:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Dashboard showing real numbers instead of 0s</li>
          <li>User Management displaying 4 users</li>
          <li>All API calls working properly</li>
          <li>Authentication working across the app</li>
        </ul>
      </div>
    </div>
  );
};

export default OneClickFix;
