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
import { API_BASE_URL, STRIPE_CONFIG, ENV } from '@/config/config';
import securityService from '../services/securityService';
import subscriptionService from '../services/subscriptionService';
import stripeService from '../services/stripeService';

// Payment form - shows test button in development, real Stripe form in production
const CheckoutForm = ({ order, paymentIntent, onSuccess, onError, disabled = false }) => {
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

  // Test payment handler for development mode
  const handleTestPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Processing test payment...');
      console.log('📋 Order data:', order);
      console.log('💰 Amount:', order.total_amount);
      console.log('📧 Customer:', order.customer_email);
      console.log('🏷️ Referral code:', order.promotion_code);
      
      // Step 1: Create a real order in the database first (if not already created)
      let realOrder = order;
      
      // Check if this is a mock/fallback order (has a JavaScript timestamp as ID)
      if (!realOrder.id || realOrder.id > 1000000000000) {
        console.log('📝 Creating real order in database for test payment...');
        
        const orderData = {
          customer_email: realOrder.customer_email,
          customer_name: realOrder.customer_name,
          items: realOrder.items || [
            {
              name: 'Premium Subscription',
              price: realOrder.total_amount || 99.99,
              quantity: 1,
              description: 'Test subscription purchase'
            }
          ],
          referral_code: realOrder.promotion_code || null
        };
        
        try {
          const response = await securityService.createSecurePaymentRequest('/payments/create-order', orderData);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Real order created for test payment:', data);
            realOrder = data.order;
          } else {
            console.log('⚠️ Failed to create real order, using existing order');
          }
        } catch (err) {
          console.log('⚠️ Error creating real order, using existing order:', err.message);
        }
      }
      
      // Step 2: Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Call payment success to actually activate the subscription
      console.log('💾 Calling payment success endpoint to activate subscription...');
      
      const paymentData = {
        order_id: realOrder.id,
        payment_intent_id: `pi_test_${Date.now()}`,
        customer_email: realOrder.customer_email,
        referral_code: realOrder.promotion_code || null,
        final_amount: realOrder.total_amount
      };
      
      console.log('📤 Payment success data:', paymentData);
      
      const paymentResponse = await securityService.createSecurePaymentRequest('/payments/payment-success', paymentData);
      
      if (paymentResponse.ok) {
        const result = await paymentResponse.json();
        console.log('✅ Payment success API response:', result);
        
        if (result.subscription_updated || result.user_activated) {
          toast.success('🎉 Test payment successful! Subscription activated!');
          console.log('🎉 Subscription activated successfully');
          
          // Update the order object for the success handler
          realOrder = { ...realOrder, ...result.order };
          
        } else {
          toast.warning('🧐 Payment processed but subscription activation may be pending');
          console.log('⚠️ Payment success but subscription not immediately activated');
        }
      } else {
        const errorData = await paymentResponse.json();
        console.error('❌ Payment success API failed:', errorData);
        throw new Error(errorData.error || 'Failed to process payment success');
      }
      
      // Step 4: Call the success handler to update UI
      console.log('✅ Test payment completed successfully');
      onSuccess();
      
    } catch (err) {
      console.error('❌ Test payment error:', err);
      setError('Test payment failed: ' + err.message);
      toast.error('Test payment failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Real Stripe payment handler
  const handleStripePayment = async (event) => {
    event.preventDefault();
    
    if (disabled) {
      setError('Payment form is disabled. Please wait for the current process to complete.');
      return;
    }
    
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

  // Development mode - Show prominent test button
  if (ENV.development) {
    return (
      <div className="space-y-6">
        {/* Development Mode Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-blue-800">Development Mode</span>
          </div>
          <p className="text-sm text-blue-600">
            You're in development mode. Click the button below to simulate a successful payment.
            Real Stripe integration will be enabled in production.
          </p>
        </div>

        {/* Test Payment Button */}
        <Button 
          type="button"
          onClick={handleTestPayment}
          disabled={loading || disabled}
          className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Processing Test Payment...
            </>
          ) : disabled ? (
            <>
              <CheckCircle className="h-5 w-5 mr-3" />
              Payment Processed
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-3" />
              🧪 Test Payment - ${(order.total_amount || 0).toFixed(2)}
            </>
          )}
        </Button>

        {error && (
          <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Show what will be tested */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-gray-900 mb-2">Test Payment Flow:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>✅ <strong>Step 1:</strong> Create real order in database</div>
            <div>✅ <strong>Step 2:</strong> Process test payment (${(order.total_amount || 0).toFixed(2)})</div>
            <div>✅ <strong>Step 3:</strong> Activate user subscription</div>
            {order.promotion_code && (
              <div>✅ <strong>Step 4:</strong> Process affiliate commissions ({order.promotion_code})</div>
            )}
            <div>✅ <strong>Step 5:</strong> Update user account status</div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-sm text-gray-700">
              <div><strong>Customer:</strong> {order.customer_email}</div>
              <div><strong>Order:</strong> {order.order_number}</div>
              {order.promotion_code && (
                <div><strong>Referral Code:</strong> {order.promotion_code}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Production mode - Show real Stripe form
  return (
    <form onSubmit={handleStripePayment} className="space-y-6">
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
            disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
        disabled={loading || disabled} 
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : disabled ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Payment Processed
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${(order.total_amount || 0).toFixed(2)}
          </>
        )}
      </Button>
    </form>
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
  const [partialSuccess, setPartialSuccess] = useState(false);
  const [retryingActivation, setRetryingActivation] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);

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
      toast.error('Please enter a referral code');
      return;
    }

    try {
      setValidatingPromotion(true);
      
      console.log('🔍 Validating referral code:', promotionCode);
      console.log('🔍 Order amount:', order.subtotal || order.total_amount);
      
      // Use the new referral code validation endpoint (public endpoint)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referral-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promotionCode.trim(),
          amount: order.subtotal || order.total_amount || 99.99,
          plan_id: 'premium'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Referral code validation successful:', data);
        
        if (data.success) {
          // Set the applied promotion with referral code data
          const promotionData = {
            name: data.data.code,
            value: data.data.discount_percent,
            type: 'percentage',
            is_affiliate_code: data.data.is_affiliate_code,
            affiliate_name: data.data.affiliate_name,
            discount_amount: data.data.discount_amount,
            discounted_total: data.data.discounted_total
          };
          
          setAppliedPromotion(promotionData);
          
          // Show success message with affiliate info if applicable
          if (data.data.is_affiliate_code && data.data.affiliate_name) {
            toast.success(`Referral code applied! ${data.data.discount_percent}% off from ${data.data.affiliate_name}`);
          } else {
            toast.success(`Code applied! ${data.data.discount_percent}% discount`);
          }
          
          // Update the order with the discount
          const updatedOrder = {
            ...order,
            discount_amount: data.data.discount_amount,
            total_amount: data.data.discounted_total,
            promotion_code: promotionCode.trim()
          };
          
          setOrder(updatedOrder);
          
        } else {
          throw new Error(data.error || 'Invalid referral code');
        }
      } else {
        const error = await response.json();
        console.error('❌ Referral code validation failed:', error);
        toast.error(error.error || 'Invalid referral code');
      }
    } catch (error) {
      console.error('❌ Error validating referral code:', error);
      toast.error('Failed to validate referral code. Please try again.');
    } finally {
      setValidatingPromotion(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    toast.success('Payment successful! Processing your subscription...');
    
    let paymentProcessedSuccessfully = false;
    let subscriptionUpdated = false;
    
    // Call payment success API to save payment and update user subscription
    if (order && order.id) {
      const paymentData = {
        order_id: order.id,
        payment_intent_id: paymentIntent?.payment_intent_id || paymentIntent?.id || `pi_stripe_${Date.now()}`,
        customer_email: order.customer_email,
        // Include referral code if applied
        referral_code: order.promotion_code || promotionCode.trim() || null,
        final_amount: order.total_amount
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
          paymentProcessedSuccessfully = true;
          
          if (result.subscription_updated) {
            subscriptionUpdated = true;
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
            // Payment succeeded but subscription activation failed - partial success
            setPartialSuccess(true);
            setPaymentProcessed(true);
            toast.warning('Payment successful, but subscription activation failed. We\'re working to fix this automatically.');
            console.error('❌ Payment succeeded but subscription was not updated:', result);
            
            // Try to retry subscription activation automatically
            setTimeout(() => {
              retrySubscriptionActivation(order);
            }, 3000);
          }
        } else {
          const error = await response.json();
          console.error('❌ Failed to save payment:', error);
          console.error('❌ Response status:', response.status);
          console.error('❌ Response text:', await response.text());
          toast.error('Payment processed but failed to save. Please contact support.');
          paymentProcessedSuccessfully = false;
        }
      } catch (error) {
        console.error('❌ Payment processing error:', error);
        toast.error('Payment processing failed. Please try again.');
        paymentProcessedSuccessfully = false;
      }
    }
    
    // Only redirect to success page if payment was actually processed successfully
    if (paymentProcessedSuccessfully && subscriptionUpdated) {
      console.log('✅ Payment fully processed, redirecting to success page');
      setTimeout(() => {
        navigate('/payment-success', {
          state: {
            order: order,
            paymentSuccess: true,
            subscriptionUpdated: true
          }
        });
      }, 3000);
    } else {
      console.log('❌ Payment processing failed, staying on checkout page');
      setPaymentSuccess(false);
      toast.error('Payment processing failed. Please try again or contact support.');
    }
  };

  const handlePaymentError = (error) => {
    toast.error(`Payment failed: ${error}`);
  };

  // Retry subscription activation for partial success scenarios
  const retrySubscriptionActivation = async (order) => {
    if (retryingActivation) return; // Prevent multiple retries
    
    setRetryingActivation(true);
    console.log('🔄 Retrying subscription activation...');
    
    try {
      // Wait a bit longer for database consistency
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Force a fresh subscription status check
      const freshStatus = await subscriptionService.checkSubscriptionStatus(true);
      console.log('🔄 Retry - Fresh subscription status check:', freshStatus);
      
      if (freshStatus.hasActiveSubscription) {
        console.log('✅ Retry successful - subscription is now active!');
        setPartialSuccess(false);
        setPaymentSuccess(true);
        toast.success('Subscription activated successfully! Redirecting...');
        
        // Redirect to success page
        setTimeout(() => {
          navigate('/payment-success', {
            state: {
              order: order,
              paymentSuccess: true,
              subscriptionUpdated: true,
              retrySuccess: true
            }
          });
        }, 2000);
      } else {
        console.log('⚠️ Retry failed - subscription still not active');
        toast.warning('Subscription activation is taking longer than expected. Please contact support if this persists.');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      toast.error('Failed to retry subscription activation. Please contact support.');
    } finally {
      setRetryingActivation(false);
    }
  };

  // Manual retry function for user-initiated retries
  const handleManualRetry = () => {
    if (order) {
      retrySubscriptionActivation(order);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Setting up checkout...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4 font-medium">Thank you for your purchase. Your subscription is being activated...</p>
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
                    disabled={paymentProcessed}
                  />
                ) : (
                  <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Preparing payment form...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partial Success UI */}
            {partialSuccess && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <CheckCircle className="h-5 w-5" />
                    Payment Successful - Activating Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-amber-700">
                    <p className="font-medium mb-2">✅ Your payment has been processed successfully!</p>
                    <p className="text-sm mb-4">
                      We're currently activating your subscription. This usually takes just a few moments, 
                      but sometimes it can take a bit longer. Please don't close this page.
                    </p>
                  </div>
                  
                  {retryingActivation && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Retrying subscription activation...</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleManualRetry}
                      disabled={retryingActivation}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      {retryingActivation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Try Again'
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/contact'}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Contact Support
                    </Button>
                  </div>
                  
                  <div className="text-xs text-amber-600 bg-amber-100 p-3 rounded">
                    <p className="font-medium mb-1">What's happening?</p>
                    <p>
                      Your payment was successful, but there was a temporary issue activating your subscription. 
                      We're automatically retrying this process. If this persists, our support team can help you manually activate your account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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

                {/* Referral Code - Enhanced */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <Label htmlFor="promotion-code" className="text-sm font-semibold text-blue-900">
                      Have a Referral Code?
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="promotion-code"
                      value={promotionCode}
                      onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                      placeholder="Enter referral code (e.g., STO0005)"
                      disabled={validatingPromotion}
                      className="flex-1 font-mono"
                    />
                    <Button 
                      onClick={validatePromotionCode}
                      disabled={validatingPromotion || !promotionCode.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {validatingPromotion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  
                  {appliedPromotion && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedPromotion(null);
                          setPromotionCode('');
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
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
