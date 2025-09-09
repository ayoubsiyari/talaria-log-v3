import React, { useState } from 'react';
import api from '../../config/api';

const LoginHelper = () => {
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
          message: 'Login successful! Authentication data stored.',
          user: response.user
        });
        
        console.log('Login successful:', response);
        console.log('Stored token:', response.access_token);
        console.log('Stored user:', response.user);
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
      console.error('Login error:', error);
    }
  };

  const testUserFetch = async () => {
    setStatus('Testing user fetch...');
    try {
      const response = await api.get('/api/admin/users');
      setStatus('User fetch successful!');
      setResult({
        success: true,
        message: 'User fetch successful!',
        users: response.users,
        count: response.users?.length || 0
      });
    } catch (error) {
      setStatus('User fetch failed');
      setResult({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setStatus('Authentication cleared');
    setResult(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login Helper</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="font-bold mb-2">Admin Login</h3>
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
        
        <div className="mt-4 space-x-2">
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Login
          </button>
          <button
            onClick={testUserFetch}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test User Fetch
          </button>
          <button
            onClick={clearAuth}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear Auth
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-medium">Status: {status}</p>
      </div>

      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-bold mb-2">{result.success ? '✅ Success' : '❌ Error'}</h3>
          <p className="mb-2">{result.message}</p>
          
          {result.user && (
            <div className="mt-2">
              <h4 className="font-medium">User Data:</h4>
              <pre className="text-sm bg-white p-2 rounded mt-1">
                {JSON.stringify(result.user, null, 2)}
              </pre>
            </div>
          )}
          
          {result.users && (
            <div className="mt-2">
              <h4 className="font-medium">Users Found: {result.count}</h4>
              <pre className="text-sm bg-white p-2 rounded mt-1 max-h-40 overflow-auto">
                {JSON.stringify(result.users, null, 2)}
              </pre>
            </div>
          )}
          
          {result.error && (
            <div className="mt-2">
              <h4 className="font-medium">Error Details:</h4>
              <pre className="text-sm bg-white p-2 rounded mt-1">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Enter the admin credentials (email: admin@talaria.com, password: admin123)</li>
          <li>Click "Login" to authenticate</li>
          <li>Click "Test User Fetch" to verify the API works</li>
          <li>If successful, the NewEnhancedUserManagement component should now work</li>
        </ol>
      </div>
    </div>
  );
};

export default LoginHelper;
