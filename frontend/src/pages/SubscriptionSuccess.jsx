import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // First try to get order details from location state (new payment flow)
    if (location.state && location.state.order) {
      const order = location.state.order;
      console.log('✅ SubscriptionSuccess: Using real order data:', order);
      
      // Calculate discount if there's a promotion
      let discount = 0;
      let originalPrice = order.total_amount || 99.99;
      
      if (order.discount_amount && order.discount_amount > 0) {
        discount = Math.round((order.discount_amount / (order.subtotal || order.total_amount)) * 100);
        originalPrice = order.subtotal || order.total_amount;
      }
      
      setOrderDetails({
        sessionId: order.order_number || `ORDER-${order.id}`,
        planId: order.items?.[0]?.product_name || 'premium',
        finalPrice: order.total_amount || 99.99,
        originalPrice: originalPrice,
        discount: discount,
        order: order,
        customerEmail: order.customer_email,
        customerName: order.customer_name
      });
      return;
    }

    // Fallback: Get order details from URL parameters (legacy flow)
    const sessionId = searchParams.get('session_id');
    const planId = searchParams.get('plan_id');
    const finalPrice = searchParams.get('final_price');
    
    if (sessionId && planId && finalPrice) {
      setOrderDetails({
        sessionId,
        planId,
        finalPrice: parseFloat(finalPrice),
        originalPrice: parseFloat(finalPrice) * 10, // Mock original price
        discount: 90 // Mock discount
      });
    } else {
      // If no parameters, create default success state
      setOrderDetails({
        sessionId: 'SUCCESS-' + Date.now(),
        planId: 'premium',
        finalPrice: 99.99,
        originalPrice: 119.99,
        discount: 17
      });
    }
  }, [searchParams, location.state]);

  const handleContinue = async () => {
    console.log('🔍 SubscriptionSuccess - Handle continue clicked');
    
    // Check if we have post-payment order info for automatic login
    const postPaymentInfo = localStorage.getItem('postPaymentOrderInfo');
    console.log('🔍 SubscriptionSuccess - postPaymentOrderInfo:', postPaymentInfo);
    
    if (postPaymentInfo) {
      try {
        const orderInfo = JSON.parse(postPaymentInfo);
        console.log('🔍 SubscriptionSuccess - Found post-payment order info:', orderInfo);
        
        // Attempt automatic login using post-payment endpoint
        console.log('🔄 Attempting automatic login after payment...');
        console.log('🔄 Login request data:', {
          email: orderInfo.customerEmail,
          order_id: orderInfo.orderId
        });
        
        const loginResponse = await fetch('http://localhost:5000/api/auth/post-payment-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: orderInfo.customerEmail,
            order_id: orderInfo.orderId
          })
        });
        
        console.log('🔍 Login response status:', loginResponse.status);
        console.log('🔍 Login response ok:', loginResponse.ok);
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('✅ Automatic login successful:', loginData);
          
          // Store tokens and user data
          localStorage.setItem('access_token', loginData.access_token);
          localStorage.setItem('refresh_token', loginData.refresh_token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          
          // Update global user data in App.jsx
          if (window.updateUserData) {
            window.updateUserData(loginData.user);
          }
          
          // Clear the post-payment info
          localStorage.removeItem('postPaymentOrderInfo');
          
          console.log('✅ User automatically logged in, redirecting to dashboard');
          
          // Redirect to appropriate dashboard
          if (loginData.user.is_admin) {
            console.log('🔍 SubscriptionSuccess - Redirecting to admin dashboard');
            navigate('/dashboard');
          } else {
            console.log('🔍 SubscriptionSuccess - Redirecting to user dashboard');
            navigate('/user-dashboard');
          }
          
          return;
        } else {
          console.log('⚠️ Automatic login failed:', loginResponse.status);
          const errorData = await loginResponse.json();
          console.log('⚠️ Login error:', errorData.error);
          
          // If automatic login fails, try regular login with stored user data
          console.log('🔄 Trying regular login as fallback...');
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData.email) {
            console.log('🔄 Attempting regular login with:', userData.email);
            // Redirect to login page with pre-filled email
            navigate(`/login?email=${encodeURIComponent(userData.email)}`);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ Automatic login error:', error);
        
        // If automatic login fails, try regular login with stored user data
        console.log('🔄 Trying regular login as fallback...');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.email) {
          console.log('🔄 Attempting regular login with:', userData.email);
          // Redirect to login page with pre-filled email
          navigate(`/login?email=${encodeURIComponent(userData.email)}`);
          return;
        }
      }
    }
    
    // Check if this is a mock payment (from URL parameters)
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    const planId = searchParams.get('plan_id');
    
    if (sessionId && userId && planId) {
      console.log('🔍 SubscriptionSuccess - Mock payment detected, attempting automatic login...');
      console.log('🔍 Session ID:', sessionId, 'User ID:', userId);
      
      try {
        // Use the new mock payment login endpoint
        const loginResponse = await fetch('http://localhost:5000/api/auth/mock-payment-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('✅ Mock payment login successful:', loginData);
          
          // Store tokens and user data
          localStorage.setItem('access_token', loginData.access_token);
          localStorage.setItem('refresh_token', loginData.refresh_token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          
          // Update global user data in App.jsx
          if (window.updateUserData) {
            window.updateUserData(loginData.user);
          }
          
          console.log('✅ User automatically logged in after mock payment, redirecting to dashboard');
          
          // Redirect to appropriate dashboard
          if (loginData.user.is_admin) {
            console.log('🔍 SubscriptionSuccess - Redirecting to admin dashboard');
            navigate('/dashboard');
          } else {
            console.log('🔍 SubscriptionSuccess - Redirecting to user dashboard');
            navigate('/user-dashboard');
          }
          
          return;
        } else {
          console.log('⚠️ Mock payment login failed:', loginResponse.status);
          const errorData = await loginResponse.json();
          console.log('⚠️ Mock payment login error:', errorData.error);
        }
        
        // If we can't login automatically, just redirect to login page
        console.log('⚠️ Could not automatically login after mock payment, redirecting to login');
        navigate('/login');
        return;
        
      } catch (error) {
        console.log('⚠️ Mock payment automatic login error:', error);
        navigate('/login');
        return;
      }
    }
    
    // Fallback: Check if user is already logged in
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = userData.is_admin || userData.role === 'admin';
    
    console.log('🔍 SubscriptionSuccess - Fallback: User data:', userData);
    console.log('🔍 SubscriptionSuccess - Fallback: Is admin:', isAdmin);
    console.log('🔍 SubscriptionSuccess - Fallback: Subscription status:', userData.subscription_status);
    console.log('🔍 SubscriptionSuccess - Fallback: Is active:', userData.is_active);
    
    if (userData.id && (userData.is_active || userData.subscription_status === 'active')) {
      // User is already logged in with active subscription
      console.log('✅ SubscriptionSuccess - User is logged in with active subscription');
      
      // Clear post-payment info since we're handling it now
      localStorage.removeItem('postPaymentOrderInfo');
      
      if (isAdmin) {
        console.log('🔍 SubscriptionSuccess - Fallback: Redirecting to admin dashboard');
        navigate('/dashboard');
      } else {
        console.log('🔍 SubscriptionSuccess - Fallback: Redirecting to user dashboard');
        navigate('/user-dashboard');
      }
    } else {
      // User not logged in or no active subscription
      console.log('🔍 SubscriptionSuccess - Fallback: User not logged in or no active subscription');
      
      // If user has email but no active status, try to manually activate them
      if (userData.email) {
        console.log('🔄 Attempting manual activation for user:', userData.email);
        
        try {
          // Try to find and activate the user
          const activationResponse = await fetch('http://localhost:5000/api/payments/activate-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email
            })
          });
          
          if (activationResponse.ok) {
            const activationData = await activationResponse.json();
            console.log('✅ Manual activation successful:', activationData);
            
            // Update user data
            const updatedUserData = {
              ...userData,
              is_active: true,
              subscription_status: 'active',
              subscription_plan: activationData.subscription_plan || 'premium'
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Redirect to dashboard
            if (updatedUserData.is_admin) {
              navigate('/dashboard');
            } else {
              navigate('/user-dashboard');
            }
            return;
          }
        } catch (error) {
          console.log('⚠️ Manual activation failed:', error);
        }
      }
      
      // Final fallback - redirect to login
      console.log('🔍 SubscriptionSuccess - Final fallback: Redirecting to login');
      if (userData.email) {
        navigate(`/login?email=${encodeURIComponent(userData.email)}`);
      } else {
        navigate('/login');
      }
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Subscription Successful!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase. Your subscription is now active.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-mono text-sm">{orderDetails.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{orderDetails.planId}</span>
              </div>
              {orderDetails.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-sm">{orderDetails.customerEmail}</span>
                </div>
              )}
              {orderDetails.discount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Price:</span>
                    <span className="line-through text-gray-500">${(orderDetails.originalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {orderDetails.discount}% OFF
                    </Badge>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-gray-900">Final Price:</span>
                <span className="text-green-600">${(orderDetails.finalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-900">Payment Processed</span>
            </div>
            <p className="text-sm text-blue-700">
              Your payment has been successfully processed and your subscription is now active. 
              You can access all premium features immediately.
            </p>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Your subscription is now active
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                You can access all premium features
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Welcome email will be sent shortly
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleContinue}
              className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Need help? Contact our support team at support@talaria.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
