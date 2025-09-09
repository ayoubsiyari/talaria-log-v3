import React, { useState } from 'react';
import api from '../../config/api';

const SimpleLogin = () => {
  const [loginData, setLoginData] = useState({
    email: 'admin@talaria.com',
    password: 'admin123'
  });
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  const handleLogin = async () => {
    setStatus('Logging in...');
    try {
      const response = await api.post('/api/auth/login', loginData);
      
      if (response.access_token) {
        // Store the authentication data
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setStatus('Login successful!');
        setResult({
          success: true,
          message: 'Login successful! You can now access the dashboard and user management.',
          user: response.user
        });
        
        // Reload the page to refresh the app state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        setStatus('Login failed - no token received');
        setResult({
          success: false,
          message: 'No access token received from server'
        });
      }
    } catch (error) {
      setStatus('Login failed');
      setResult({
        success: false,
        message: error.message,
        error: error
      });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quick Admin Login</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Admin Credentials</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Email:</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Login as Admin
        </button>
      </div>

      <div className="mb-4">
        <p className="font-medium">Status: {status}</p>
      </div>

      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-bold mb-2">{result.success ? '✅ Success' : '❌ Error'}</h3>
          <p className="mb-2">{result.message}</p>
          
          {result.success && (
            <div className="mt-2">
              <p className="text-sm text-green-600">
                ✅ Authentication data stored successfully
              </p>
              <p className="text-sm text-green-600">
                ✅ Page will reload automatically in 2 seconds
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">What This Does:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Logs you in as the admin user</li>
          <li>Stores the authentication token in localStorage</li>
          <li>Reloads the page to refresh the app state</li>
          <li>After reload, dashboard and user management should show real data</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleLogin;
