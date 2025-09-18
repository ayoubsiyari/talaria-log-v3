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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import securityService from '../services/securityService';
import { getUserData, getUserEmail } from '../utils/userUtils';
import logger from '../utils/logger';

const SubscriptionSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

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
      logger.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };


  const calculatePrice = (plan) => {
    if (!plan) return 0;
    
    let price = billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price;
    
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
      const access_token = localStorage.getItem('access_token');
      
      // Secure logging with centralized logger
      logger.debug('Access token available', { hasToken: !!access_token });
      logger.debug('User data available', { 
        hasEmail: !!userData?.email,
        hasUsername: !!userData?.username,
        hasFirstName: !!userData?.first_name,
        hasLastName: !!userData?.last_name
      });
      
      // If we still don't have user data, try to get it from the API
      if (!userData || !userData.email) {
        logger.debug('No user data in localStorage, trying to get from API');
        
        if (!access_token) {
          logger.error('No access token available');
          toast.error('Please log in to continue with your subscription');
          navigate('/login');
          return;
        }
        
        try {
          // Try to get user data from API
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const apiUserData = await response.json();
            logger.debug('Got user data from API - user authenticated successfully');
            
            // Update localStorage with API data
            localStorage.setItem('user', JSON.stringify(apiUserData));
            
            // Use the API data
            userData = apiUserData;
          } else {
            logger.error('Failed to get user data from API');
            toast.error('Please log in to continue with your subscription');
            navigate('/login');
            return;
          }
        } catch (apiError) {
          logger.error('API error getting user data:', apiError);
          toast.error('Please log in to continue with your subscription');
          navigate('/login');
          return;
        }
      }
      
      // If we still don't have user data after all attempts, redirect to registration
      if (!userData || !userData.email) {
        logger.debug('No user data available, redirecting to registration');
        toast.error('Please register first to select a subscription plan');
        navigate('/register');
        return;
      }
      
      // For users coming from registration, we don't need authentication tokens
      // We'll create the order without authentication and handle login after payment
      logger.debug('Using user data from registration for order creation');
      
      // Create order with payment intent
      const orderData = {
        customer_email: userData.email,
        customer_name: userData.username || userData.first_name || userData.last_name || userData.email.split('@')[0],
        plan_id: selectedPlan.id, // Include plan ID for reliable matching
        items: [
          {
            name: `${selectedPlan.name} Subscription`,
            price: parseFloat(selectedPlan.price) || 99.99,
            quantity: 1,
            description: selectedPlan.description || `${selectedPlan.name} plan`,
            plan_id: selectedPlan.id // Also include plan ID in item
          }
        ]
      };
      
      logger.debug('Creating order with data', {
        hasCustomerEmail: !!orderData.customer_email,
        hasCustomerName: !!orderData.customer_name,
        hasUserData: !!userData,
        selectedPlanId: selectedPlan?.id,
        priceType: typeof selectedPlan?.price,
        priceValue: selectedPlan?.price
      });

      logger.debug('Making API call to create order', { endpoint: `${API_BASE_URL}/payments/create-order` });
      
      // Import security service
      // Use imported security service
      
      // Check for suspicious activity
      if (securityService.detectSuspiciousActivity()) {
        toast.error('Please wait before submitting another payment request.');
        return;
      }
      
      // Get CSRF token first
      logger.debug('Getting CSRF token');
      let csrfToken = null;
      try {
        const csrfResponse = await fetch(`${API_BASE_URL}/payments/csrf-token`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrf_token;
          logger.debug('CSRF token obtained');
        } else {
          logger.warn('Failed to get CSRF token, proceeding without it');
        }
      } catch (csrfError) {
        logger.warn('CSRF token error:', csrfError);
      }

      // Add CSRF token to order data
      if (csrfToken) {
        orderData.csrf_token = csrfToken;
      }

      // Create payment request without authentication (for new users)
      logger.debug('Making unauthenticated API call to create order', { endpoint: `${API_BASE_URL}/payments/create-order` });
      const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      logger.debug('API response status', { status: response.status });

      if (response.ok) {
        const data = await response.json();
        logger.debug('Order created successfully', {
          hasOrder: !!data.order,
          hasPaymentIntent: !!data.payment_intent
        });
        
        // Navigate to checkout page with order data and user info
        logger.debug('Navigating to checkout with order data');
        
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
        logger.error('Order creation error', { error, status: response.status });
        toast.error(error.error || 'Failed to create order');
        
        // Fallback: navigate to checkout with test data
        logger.debug('Fallback: Navigating to checkout with test data');
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
      logger.error('Network/API error creating order', { error: error.message });
      toast.error('Failed to create order - network error');
      
      // Fallback: navigate to checkout with test data
      logger.debug('Catch block: Navigating to checkout with test data');
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-medium">Loading subscription plans...</p>
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
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 ${
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

          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleNext}
            disabled={!selectedPlan || processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
