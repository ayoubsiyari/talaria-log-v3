import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Check, 
  Star, 
  CreditCard, 
  Shield, 
  Zap, 
  Users, 
  Database,
  ArrowRight,
  Loader2,
  Crown,
  TrendingUp,
  Headphones,
  Tag,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import securityService from '../services/securityService';
import { getUserData, getUserEmail } from '../utils/userUtils';

const SubscriptionSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscription/plans`);
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        
        // Set default selected plan (Professional if available)
        const professionalPlan = data.plans.find(plan => plan.is_popular);
        if (professionalPlan) {
          setSelectedPlan(professionalPlan);
        } else if (data.plans.length > 0) {
          setSelectedPlan(data.plans[0]);
        }
      } else {
        toast.error('Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setValidatingCoupon(true);
      const response = await fetch(`${API_BASE_URL}/payments/validate-promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          order_amount: selectedPlan ? selectedPlan.price : 99.99
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedCoupon(data.promotion);
        toast.success(`Promotion applied! ${(data.discount_amount || 0).toFixed(2)} discount`);
        setShowCouponInput(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Invalid promotion code');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const calculatePrice = (plan) => {
    if (!plan) return 0;
    
    let price = billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price;
    
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        const discount = price * (appliedCoupon.value / 100);
        price = price - discount;
      } else if (appliedCoupon.type === 'fixed') {
        price = Math.max(0, price - appliedCoupon.value);
      }
    }
    
    return price;
  };

  const handleNext = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setProcessing(true);
      
      // Get user data using utility function
      let userData = getUserData(); // Remove await since it's synchronous
      const accessToken = localStorage.getItem('access_token');
      
      console.log('🔑 Access token available:', !!accessToken);
      console.log('👤 User data available:', !!userData?.email);
      console.log('📧 User email:', userData?.email);
      console.log('📋 Full user data:', userData);
      
      // If we still don't have user data, try to get it from the API
      if (!userData || !userData.email) {
        console.log('⚠️ No user data in localStorage, trying to get from API...');
        
        if (!accessToken) {
          console.error('❌ No access token available');
          toast.error('Please log in to continue with your subscription');
          navigate('/login');
          return;
        }
        
        try {
          // Try to get user data from API
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const apiUserData = await response.json();
            console.log('✅ Got user data from API:', apiUserData);
            
            // Update localStorage with API data
            localStorage.setItem('user', JSON.stringify(apiUserData));
            
            // Use the API data
            userData = apiUserData;
          } else {
            console.error('❌ Failed to get user data from API');
            toast.error('Please log in to continue with your subscription');
            navigate('/login');
            return;
          }
        } catch (apiError) {
          console.error('❌ API error getting user data:', apiError);
          toast.error('Please log in to continue with your subscription');
          navigate('/login');
          return;
        }
      }
      
      // If we still don't have user data after all attempts, redirect to registration
      if (!userData || !userData.email) {
        console.log('⚠️ No user data available, redirecting to registration');
        toast.error('Please register first to select a subscription plan');
        navigate('/register');
        return;
      }
      
      // For users coming from registration, we don't need authentication tokens
      // We'll create the order without authentication and handle login after payment
      console.log('✅ Using user data from registration for order creation');
      
      // Create order with payment intent
      const orderData = {
        customer_email: userData.email,
        customer_name: userData.username || userData.first_name || userData.last_name || userData.email.split('@')[0],
        items: [
          {
            name: `${selectedPlan.name} Subscription`,
            price: parseFloat(selectedPlan.price) || 99.99,
            quantity: 1,
            description: selectedPlan.description || `${selectedPlan.name} plan`
          }
        ],
        promotion_code: appliedCoupon?.code
      };
      
      console.log('📝 Creating order with user data:', {
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        userData: userData,
        orderData: orderData,
        selectedPlan: selectedPlan,
        priceType: typeof selectedPlan.price,
        priceValue: selectedPlan.price
      });

      console.log('🌐 Making API call to:', `${API_BASE_URL}/payments/create-order`);
      
      // Import security service
      // Use imported security service
      
      // Check for suspicious activity
      if (securityService.detectSuspiciousActivity()) {
        toast.error('Please wait before submitting another payment request.');
        return;
      }
      
      // Create payment request without authentication (for new users)
      console.log('🌐 Making unauthenticated API call to:', `${API_BASE_URL}/payments/create-order`);
      const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order created successfully:', data);
        console.log('📋 Order details:', data.order);
        console.log('💳 Payment intent:', data.payment_intent);
        
        // Navigate to checkout page with order data and user info
        console.log('🚀 Navigating to checkout with data:', {
          order: data.order,
          clientSecret: data.payment_intent.client_secret,
          plan: selectedPlan,
          user: userData
        });
        
        navigate('/checkout', { 
          state: { 
            order: data.order,
            clientSecret: data.payment_intent.client_secret,
            plan: selectedPlan,
            user: userData // Pass user data to checkout
          }
        });
      } else {
        const error = await response.json();
        console.error('❌ Order creation error:', error);
        console.error('Response status:', response.status);
        toast.error(error.error || 'Failed to create order');
        
        // Fallback: navigate to checkout with test data
        console.log('🔄 Fallback: Navigating to checkout with test data');
        toast.info('Using test mode - proceeding to checkout');
        navigate('/checkout', { 
          state: { 
            order: null, // Will trigger fallback in checkout
            plan: selectedPlan,
            user: userData
          }
        });
      }
    } catch (error) {
      console.error('❌ Network/API error creating order:', error);
      console.error('Error details:', error.message);
      toast.error('Failed to create order - network error');
      
      // Fallback: navigate to checkout with test data
      console.log('🔄 Catch block: Navigating to checkout with test data');
      toast.info('Using test mode - proceeding to checkout');
      navigate('/checkout', { 
        state: { 
          order: null, // Will trigger fallback in checkout
          plan: selectedPlan,
          user: userData
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    // Navigate to dashboard or main app
    navigate('/dashboard');
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('users') || feature.includes('team')) return <Users className="h-4 w-4" />;
    if (feature.includes('analytics')) return <TrendingUp className="h-4 w-4" />;
    if (feature.includes('support')) return <Headphones className="h-4 w-4" />;
    if (feature.includes('API') || feature.includes('integrations')) return <Zap className="h-4 w-4" />;
    if (feature.includes('storage') || feature.includes('projects')) return <Database className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Shield className="h-6 w-6" />;
      case 'professional':
        return <Star className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with the perfect plan for your needs. All plans include a free trial.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan?.id === plan.id
                  ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                  : 'hover:scale-105'
              } ${plan.is_popular ? 'border-blue-500' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${
                    plan.is_popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <p className="text-gray-600">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${(calculatePrice(plan) || 0).toFixed(2)}
                  </span>
                  <span className="text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                
                {plan.trial_days > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    {plan.trial_days}-day free trial
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-green-600">
                        {getFeatureIcon(feature)}
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.max_users && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Users</span>
                      <span className="font-medium">
                        {plan.max_users === null ? 'Unlimited' : `Up to ${plan.max_users}`}
                      </span>
                    </div>
                  </div>
                )}

                {plan.storage_limit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium">
                      {plan.storage_limit >= 1024 
                        ? `${(plan.storage_limit / 1024).toFixed(0)}GB`
                        : `${plan.storage_limit}MB`
                      }
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Selected Plan Summary</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{selectedPlan.name}</p>
                <p className="text-sm text-gray-600">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${(calculatePrice(selectedPlan) || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</p>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="border-t pt-4">
              {!showCouponInput && !appliedCoupon && (
                <Button
                  variant="outline"
                  onClick={() => setShowCouponInput(true)}
                  className="flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Add Coupon Code
                </Button>
              )}

              {showCouponInput && !appliedCoupon && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="coupon" className="sr-only">Coupon Code</Label>
                    <Input
                      id="coupon"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                    />
                  </div>
                  <Button
                    onClick={validateCoupon}
                    disabled={validatingCoupon}
                    className="flex items-center gap-2"
                  >
                    {validatingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponCode('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Coupon applied: {appliedCoupon.code} ({appliedCoupon.discount_percent}% off)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleNext}
            disabled={!selectedPlan || processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          <Button
            onClick={handleSkip}
            variant="outline"
            className="px-8 py-3 text-lg font-medium"
          >
            Skip for now
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              <span className="text-sm">24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSelection;
