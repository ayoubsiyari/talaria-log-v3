import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Tag,
  ShoppingCart,
  DollarSign,
  Percent,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL, STRIPE_CONFIG } from '@/config/config';
import securityService from '../services/securityService';
import subscriptionService from '../services/subscriptionService';
import stripeService from '../services/stripeService';

// Real Stripe payment form
const CheckoutForm = ({ order, paymentIntent, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Safety check for order data
  if (!order || order.total_amount === undefined) {
    return (
      <div className="text-center p-8">
        <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      setError('Please fill in all card details');
      return;
    }

    // Validate card details
    if (!stripeService.validateCardNumber(cardNumber)) {
      setError('Invalid card number');
      return;
    }

    if (!stripeService.validateExpiryDate(expiryDate)) {
      setError('Invalid expiry date');
      return;
    }

    if (!stripeService.validateCVV(cvv)) {
      setError('Invalid CVV');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💳 Processing real Stripe payment...');
      console.log('📋 Order:', order);
      console.log('🔑 Payment Intent:', paymentIntent);
      
      // Process payment with Stripe
      const paymentResult = await stripeService.processPayment({
        cardDetails: {
          cardNumber,
          expiryDate,
          cvv,
          cardName
        },
        paymentIntentId: paymentIntent?.payment_intent_id || paymentIntent?.id,
        customerEmail: order.customer_email
      });

      if (paymentResult.success) {
        console.log('✅ Stripe payment successful:', paymentResult);
        onSuccess();
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (err) {
      console.error('❌ Stripe payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="card-name">Cardholder Name</Label>
          <Input
            id="card-name"
            type="text"
            placeholder="John Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="card-number">Card Number</Label>
          <Input
            id="card-number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(stripeService.formatCardNumber(e.target.value))}
            maxLength={19}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                  value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                setExpiryDate(value);
              }}
              maxLength={5}
              required
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              required
            />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${(order.total_amount || 0).toFixed(2)}
          </>
        )}
      </Button>
    </form>
    
    {/* Debug button for testing payment success */}
    <div className="mt-4">
      <Button
        type="button"
        onClick={() => {
          console.log('🔧 Manual payment success trigger clicked');
          console.log('🔧 Order data:', order);
          console.log('🔧 Payment intent data:', paymentIntent);
          onSuccess();
        }}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
        variant="outline"
      >
        🔧 Test Payment Success (Debug)
      </Button>
    </div>
    </>
  );
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [validatingPromotion, setValidatingPromotion] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Get promotion code from URL if present
  useEffect(() => {
    const code = searchParams.get('promo');
    if (code) {
      setPromotionCode(code);
    }
  }, [searchParams]);

  // Initialize order data
  useEffect(() => {
    initializeOrder();
  }, []);

  const initializeOrder = () => {
    console.log('🔍 Checkout - location.state:', location.state);
    
    // Check if order data was passed from subscription selection
    if (location.state && location.state.order) {
      console.log('✅ Using real order data from subscription selection:', location.state.order);
      console.log('📋 Order object structure:', location.state.order);
      console.log('💰 Order total_amount:', location.state.order?.total_amount);
      console.log('👤 Customer email:', location.state.order?.customer_email);
      console.log('📦 Plan:', location.state.plan);
      
      setOrder(location.state.order);
      setPaymentIntent({ client_secret: location.state.clientSecret });
      setLoading(false);
    } else if (location.state && location.state.plan) {
      // If we have plan data but no order, create order with the selected plan
      console.log('📋 Creating order with selected plan:', location.state.plan);
      createOrderWithPlan(location.state.plan);
    } else {
      console.log('⚠️  No order or plan data found, creating test order with user data');
      // Create test order if no data passed
      createTestOrder();
    }
  };

  const createOrderWithPlan = async (plan) => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 User data from localStorage:', userData);
      console.log('📋 Selected plan:', plan);
      
      const orderData = {
        customer_email: userData.email || 'user@example.com',
        customer_name: userData.username || userData.first_name || userData.last_name || 'User',
        items: [
          {
            name: `${plan.name} Subscription`,
            price: parseFloat(plan.price) || 99.99,
            quantity: 1,
            description: plan.description || `${plan.name} plan`
          }
        ],
        promotion_code: promotionCode || undefined
      };

      console.log('📝 Creating order with plan data:', orderData);

      // Use imported security service
      
      // Check for suspicious activity
      if (securityService.detectSuspiciousActivity()) {
        toast.error('Please wait before submitting another payment request.');
        return;
      }
      
      // Create secure payment request
      const response = await securityService.createSecurePaymentRequest('/payments/create-order', orderData);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order created successfully with plan:', data);
        console.log('📋 Order details:', data.order);
        console.log('💳 Payment intent:', data.payment_intent);
        setOrder(data.order);
        setPaymentIntent(data.payment_intent);
        
        if (data.order.promotion) {
          setAppliedPromotion(data.order.promotion);
        }
      } else {
        const error = await response.json();
        console.error('❌ Order creation error:', error);
        console.error('Response status:', response.status);
        toast.error(error.error || 'Failed to create order');
        
        // Create fallback order with plan data
        console.log('🔄 Creating fallback order with plan data...');
        createFallbackOrderWithPlan(plan);
      }
    } catch (error) {
      console.error('Error creating order with plan:', error);
      toast.error('Failed to create order');
      
      // Create fallback order with plan data
      console.log('🔄 Creating fallback order with plan data due to error...');
      createFallbackOrderWithPlan(plan);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 User data from localStorage:', userData);
      
      const orderData = {
        customer_email: userData.email || 'test@example.com',
        customer_name: userData.username || userData.first_name || userData.last_name || 'Test Customer',
        items: [
          {
            name: 'Premium Subscription',
            price: 99.99,
            quantity: 1,
            description: 'Monthly premium subscription'
          }
        ],
        promotion_code: promotionCode || undefined
      };

      // Use imported security service
      
      // Check for suspicious activity
      if (securityService.detectSuspiciousActivity()) {
        toast.error('Please wait before submitting another payment request.');
        return;
      }
      
      // Create secure payment request
      const response = await securityService.createSecurePaymentRequest('/payments/create-order', orderData);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order created successfully:', data);
        console.log('📋 Order object structure:', data.order);
        console.log('💰 Order total_amount:', data.order?.total_amount);
        setOrder(data.order);
        setPaymentIntent(data.payment_intent);
        
        if (data.order.promotion) {
          setAppliedPromotion(data.order.promotion);
        }
      } else {
        const error = await response.json();
        console.error('❌ Order creation error:', error);
        console.error('Response status:', response.status);
        toast.error(error.error || 'Failed to create order');
        
        // Create fallback test order
        console.log('🔄 Creating fallback test order...');
        createFallbackOrder();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      
      // Create fallback test order
      console.log('🔄 Creating fallback test order due to error...');
      createFallbackOrder();
    } finally {
      setLoading(false);
    }
  };

  const createFallbackOrderWithPlan = (plan) => {
    console.log('🔄 Creating fallback order with plan data...');
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Create fallback order with the selected plan
    const fallbackOrder = {
      id: Date.now(),
      order_number: `TEST-${Date.now()}`,
      customer_email: userData.email || 'user@example.com',
      customer_name: userData.username || userData.first_name || userData.last_name || 'User',
      subtotal: parseFloat(plan.price) || 99.99,
      tax_amount: (parseFloat(plan.price) || 99.99) * 0.08, // 8% tax
      discount_amount: 0,
      total_amount: (parseFloat(plan.price) || 99.99) * 1.08, // price + tax
      status: 'pending',
      payment_status: 'pending',
      items: [
        {
          product_name: plan.name,
          total_price: parseFloat(plan.price) || 99.99,
          quantity: 1,
          description: plan.description
        }
      ]
    };
    
    const fallbackPaymentIntent = {
      client_secret: `test_secret_${Date.now()}`,
      id: `test_pi_${Date.now()}`
    };
    
    setOrder(fallbackOrder);
    setPaymentIntent(fallbackPaymentIntent);
    setLoading(false);
    
    toast.info(`Using test mode for ${plan.name} checkout`);
  };

  const createFallbackOrder = () => {
    console.log('🔄 Creating fallback test order...');
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Create a simple test order
    const fallbackOrder = {
      id: Date.now(),
      order_number: `TEST-${Date.now()}`,
      customer_email: userData.email || 'test@example.com',
      customer_name: userData.username || userData.first_name || userData.last_name || 'Test Customer',
      subtotal: 99.99,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 99.99,
      status: 'pending',
      payment_status: 'pending',
      items: [
        {
          product_name: 'Premium Subscription',
          total_price: 99.99,
          quantity: 1,
          description: 'Monthly premium subscription'
        }
      ]
    };
    
    const fallbackPaymentIntent = {
      client_secret: `test_secret_${Date.now()}`,
      id: `test_pi_${Date.now()}`
    };
    
    setOrder(fallbackOrder);
    setPaymentIntent(fallbackPaymentIntent);
    setLoading(false);
    
    toast.info('Using test mode for checkout');
  };

  const validatePromotionCode = async () => {
    if (!promotionCode.trim()) {
      toast.error('Please enter a promotion code');
      return;
    }

    try {
      setValidatingPromotion(true);
      
      // Use imported security service
      
      // Create secure promotion validation request
      const response = await securityService.createSecurePaymentRequest('/payments/validate-promotion', {
        code: promotionCode,
        order_amount: order.subtotal
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedPromotion(data.promotion);
        toast.success(`Promotion applied! ${(data.discount_amount || 0).toFixed(2)} discount`);
        
        // Recreate order with promotion
        await createTestOrder();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Invalid promotion code');
      }
    } catch (error) {
      console.error('Error validating promotion:', error);
      toast.error('Failed to validate promotion code');
    } finally {
      setValidatingPromotion(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    toast.success('Payment successful! Thank you for your purchase.');
    
    // Call payment success API to save payment and update user subscription
    if (order && order.id) {
      const paymentData = {
        order_id: order.id,
        payment_intent_id: paymentIntent?.payment_intent_id || paymentIntent?.id || `pi_stripe_${Date.now()}`,
        customer_email: order.customer_email
      };
      
      console.log('💾 Saving payment to database:', paymentData);
      
      try {
        // Use imported security service
        
        // Create secure payment success request
        console.log('🔍 Calling payment success endpoint with data:', paymentData);
        const response = await securityService.createSecurePaymentRequest('/payments/payment-success', paymentData);
        
        console.log('🔍 Payment success response status:', response.status);
        console.log('🔍 Payment success response ok:', response.ok);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Payment saved successfully:', result);
          
          if (result.subscription_updated) {
            toast.success('Payment successful! Your subscription has been activated.');
            
            // Store order and user info for post-payment login
            const orderInfo = {
              orderId: order.id,
              customerEmail: order.customer_email,
              subscriptionPlan: order.items?.[0]?.product_name?.toLowerCase() || 'premium'
            };
            
            // Store in localStorage for the success page to use
            localStorage.setItem('postPaymentOrderInfo', JSON.stringify(orderInfo));
            
            console.log('✅ Stored order info for post-payment login:', orderInfo);
            console.log('✅ User data preserved for success page');
            
            // Update user data with new subscription status instead of clearing it
            try {
              // Get current user data
              const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
              
              // Update user data with new subscription status
              const updatedUserData = {
                ...currentUserData,
                subscription_status: 'active',
                subscription_plan: order.items?.[0]?.product_name?.toLowerCase() || 'premium',
                is_active: true,
                is_admin: false // Ensure user is regular user, not admin
              };
              
              // Save updated user data
              localStorage.setItem('user', JSON.stringify(updatedUserData));
              console.log('✅ Updated user data with active subscription:', updatedUserData);
              
              // Clear subscription service cache to force fresh check
              subscriptionService.clearCache();
              console.log('✅ Cleared subscription service cache');
              
              // Add a small delay to ensure database transaction is committed
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('✅ Waited for database transaction to complete');
              
              // Force a subscription status check to verify the update
              const freshStatus = await subscriptionService.checkSubscriptionStatus(true);
              console.log('✅ Fresh subscription status check:', freshStatus);
              
              if (freshStatus.hasActiveSubscription) {
                console.log('🎉 User subscription is now active!');
              } else {
                console.log('⚠️ User subscription is still not active - may need more time');
              }
            } catch (error) {
              console.log('⚠️ Could not update user data:', error);
            }
          } else {
            toast.warning('Payment successful, but subscription activation failed. Please contact support.');
            console.error('❌ Payment succeeded but subscription was not updated:', result);
          }
        } else {
          const error = await response.json();
          console.error('❌ Failed to save payment:', error);
          console.error('❌ Response status:', response.status);
          console.error('❌ Response text:', await response.text());
          toast.error('Payment processed but failed to save. Please contact support.');
        }
      } catch (error) {
        console.error('❌ Payment processing error:', error);
        toast.error('Payment processing failed. Please try again.');
      }
    }
    
    // Redirect to success page after 3 seconds
    setTimeout(() => {
      navigate('/payment-success', {
        state: {
          order: order,
          paymentSuccess: true,
          subscriptionUpdated: true
        }
      });
    }, 3000);
  };

  const handlePaymentError = (error) => {
    toast.error(`Payment failed: ${error}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Setting up checkout...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">Thank you for your purchase.</p>
            <p className="text-sm text-gray-500">Redirecting to success page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Checkout</h1>
            <p className="text-gray-600 mb-4">Setting up your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order || !paymentIntent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h1>
            <p className="text-gray-600 mb-4">Failed to load checkout information.</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure order has required properties
  if (!order.total_amount && !order.subtotal) {
    console.error('❌ Order missing required amount properties:', order);
    console.error('❌ Order keys:', Object.keys(order || {}));
    console.error('❌ Order values:', order);
    
    // Don't create fallback order here - let the loading state handle it
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Order Data</h1>
            <p className="text-gray-600 mb-4">Order data is missing required information.</p>
            <Button onClick={() => navigate('/subscription-selection')}>
              Select Plan Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug logging for order data
  console.log('🔍 Checkout rendering with order:', {
    id: order.id,
    total_amount: order.total_amount,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    discount_amount: order.discount_amount,
    customer_email: order.customer_email,
    items_count: order.items?.length || 0
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order && order.total_amount !== undefined ? (
                  <CheckoutForm
                    order={order}
                    paymentIntent={paymentIntent}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Preparing payment form...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <p className="font-medium">${(item.total_price || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Promotion Code */}
                <div className="space-y-3">
                  <Label htmlFor="promotion-code">Promotion Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promotion-code"
                      value={promotionCode}
                      onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                      placeholder="Enter promotion code"
                      disabled={validatingPromotion}
                    />
                    <Button 
                      onClick={validatePromotionCode}
                      disabled={validatingPromotion || !promotionCode.trim()}
                      variant="outline"
                    >
                      {validatingPromotion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {appliedPromotion && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {appliedPromotion.name} applied
                        </p>
                        <p className="text-xs text-green-600">
                          {appliedPromotion.value}
                          {appliedPromotion.type === 'percentage' ? '%' : '$'} off
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <hr />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${(order.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(order.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Order Number:</span>
                  <p className="font-medium font-mono">{order.order_number}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
