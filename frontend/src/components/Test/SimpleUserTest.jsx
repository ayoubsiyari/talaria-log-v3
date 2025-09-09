import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const SimpleUserTest = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users...');
      const response = await api.get('/api/admin/users');
      console.log('Users response:', response);
      
      if (response.users) {
        setUsers(response.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const response = await api.get('/api/admin/users/stats');
      console.log('Stats response:', response);
      setStats(response);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('User:', user ? JSON.parse(user) : 'Missing');
    
    return { token: !!token, user: !!user };
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple User Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={checkAuth}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
        >
          Check Auth
        </button>
        <button 
          onClick={fetchUsers}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Users'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">Stats</h3>
          <pre className="text-sm">{JSON.stringify(stats, null, 2)}</pre>
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-bold mb-2">User Count</h3>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
      </div>

      <div className="bg-white border rounded">
        <h3 className="font-bold p-4 border-b">Users ({users.length})</h3>
        <div className="max-h-96 overflow-auto">
          {users.map((user, index) => (
            <div key={user.id || index} className="p-4 border-b last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {user.first_name} {user.last_name} ({user.username})
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    ID: {user.id} | Type: {user.account_type} | Active: {user.is_active ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{user.subscription_status || 'N/A'}</p>
                  <p className="text-xs text-gray-500">
                    Roles: {user.roles?.join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleUserTest;
