import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SubscriptionChecker = () => {
  const [userData, setUserData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    setLoading(true);
    try {
      // Check localStorage
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      console.log('🔍 Checking subscription status...');
      console.log('📱 Stored user:', storedUser);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        
        // Test subscription API
        if (token) {
          const response = await fetch('http://localhost:5000/api/users/me/subscription', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data);
            console.log('✅ Subscription API response:', data);
          } else {
            console.log('❌ Subscription API failed:', response.status);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginAsManal = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'manal@gmail.com',
          password: 'password123'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store in localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ Logged in as manal@gmail.com');
        await checkSubscription();
      } else {
        console.log('❌ Login failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Subscription Status Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkSubscription} disabled={loading}>
            {loading ? 'Checking...' : 'Check Status'}
          </Button>
          <Button onClick={loginAsManal} disabled={loading} variant="outline">
            Login as manal@gmail.com
          </Button>
        </div>

        {userData && (
          <div className="space-y-2">
            <h3 className="font-semibold">User Data (localStorage):</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Username:</strong> {userData.username}</p>
              <p><strong>ID:</strong> {userData.id}</p>
              <p><strong>Is Active:</strong> 
                <Badge variant={userData.is_active ? 'default' : 'destructive'}>
                  {userData.is_active ? 'True' : 'False'}
                </Badge>
              </p>
              <p><strong>Subscription Status:</strong> 
                <Badge variant={userData.subscription_status === 'active' ? 'default' : 'destructive'}>
                  {userData.subscription_status || 'None'}
                </Badge>
              </p>
              <p><strong>Subscription Plan:</strong> {userData.subscription_plan || 'None'}</p>
            </div>
          </div>
        )}

        {subscriptionStatus && (
          <div className="space-y-2">
            <h3 className="font-semibold">API Response:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Email:</strong> {subscriptionStatus.email}</p>
              <p><strong>User ID:</strong> {subscriptionStatus.user_id}</p>
              <p><strong>Is Active:</strong> 
                <Badge variant={subscriptionStatus.is_active ? 'default' : 'destructive'}>
                  {subscriptionStatus.is_active ? 'True' : 'False'}
                </Badge>
              </p>
              <p><strong>Subscription Status:</strong> 
                <Badge variant={subscriptionStatus.subscription_status === 'active' ? 'default' : 'destructive'}>
                  {subscriptionStatus.subscription_status}
                </Badge>
              </p>
              <p><strong>Subscription Plan:</strong> {subscriptionStatus.subscription_plan}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Login as manal@gmail.com" to login</li>
            <li>Check the status above</li>
            <li>If subscription is active, try accessing the dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionChecker;
