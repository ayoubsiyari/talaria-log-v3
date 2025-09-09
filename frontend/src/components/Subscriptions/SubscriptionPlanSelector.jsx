import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Shield, Users, BarChart3, Download, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const SubscriptionPlanSelector = ({ userId, onPlanSelected }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [validatingPromotion, setValidatingPromotion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans`);
      const data = await response.json();
      
      if (response.ok) {
        setPlans(data.plans || []);
      } else {
        // Fallback to default plans if API fails
        setPlans(getDefaultPlans());
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const validatePromotionCode = async () => {
    if (!promotionCode.trim()) {
      toast.error('Please enter a promotion code');
      return;
    }

    try {
      setValidatingPromotion(true);
      
      const response = await fetch(`${API_BASE_URL}/payments/validate-promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: promotionCode.toUpperCase(),
          order_amount: selectedPlan ? selectedPlan.price : 99.99
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedPromotion(data.promotion);
        toast.success(`Promotion applied! ${data.discount_amount.toFixed(2)} discount`);
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

  const getDefaultPlans = () => [
    {
      id: 1,
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      billing_cycle: 'monthly',
      features: [
        'Basic journal tracking',
        'Up to 5 trading journals',
        'Email support',
        'Basic analytics',
        'Mobile app access'
      ],
      max_users: 1,
      max_projects: 5,
      storage_limit: 100,
      trial_days: 0,
      is_popular: false,
      sort_order: 1
    },
    {
      id: 2,
      name: 'Basic',
      description: 'Great for individual traders',
      price: 9.99,
      billing_cycle: 'monthly',
      features: [
        'Everything in Free',
        'Unlimited trading journals',
        'Advanced analytics',
        'Priority email support',
        'Export to PDF/Excel',
        'Custom categories',
        'Performance tracking'
      ],
      max_users: 1,
      max_projects: 50,
      storage_limit: 1024,
      trial_days: 14,
      is_popular: false,
      sort_order: 2
    },
    {
      id: 3,
      name: 'Pro',
      description: 'For serious traders and small teams',
      price: 19.99,
      billing_cycle: 'monthly',
      features: [
        'Everything in Basic',
        'Advanced analytics & insights',
        'Priority support',
        'API access',
        'Custom reports',
        'Team collaboration',
        'Advanced risk management',
        'Backtesting tools'
      ],
      max_users: 5,
      max_projects: 100,
      storage_limit: 5120,
      trial_days: 14,
      is_popular: true,
      sort_order: 3
    },
    {
      id: 4,
      name: 'Enterprise',
      description: 'For large organizations',
      price: 49.99,
      billing_cycle: 'monthly',
      features: [
        'Everything in Pro',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'Advanced security',
        'Custom training',
        'On-premise option'
      ],
      max_users: null,
      max_projects: null,
      storage_limit: 51200,
      trial_days: 30,
      is_popular: false,
      sort_order: 4
    }
  ];

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    
    if (plan.price === 0) {
      // Free plan - create subscription immediately
      try {
        const response = await fetch('http://localhost:5000/api/subscription/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            plan_id: plan.id
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          toast.success('Free plan activated successfully!');
          navigate('/dashboard');
        } else {
          toast.error(data.error || 'Failed to activate free plan');
        }
      } catch (err) {
        toast.error('Network error. Please try again.');
      }
    } else {
      // Paid plan - redirect to checkout
      try {
        const checkoutData = {
          plan_id: plan.id,
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription/cancel`
        };

        // Add promotion code if applied
        if (appliedPromotion) {
          checkoutData.promotion_code = appliedPromotion.code;
        }

        // Use mock checkout for testing (no Stripe required)
        const response = await fetch('http://localhost:5000/api/subscription/mock-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(checkoutData)
        });

        const data = await response.json();
        
        if (response.ok) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || 'Failed to create checkout session');
        }
      } catch (err) {
        toast.error('Network error. Please try again.');
      }
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('analytics')) return <BarChart3 className="w-4 h-4" />;
    if (feature.includes('support')) return <Shield className="w-4 h-4" />;
    if (feature.includes('API')) return <Zap className="w-4 h-4" />;
    if (feature.includes('team') || feature.includes('collaboration')) return <Users className="w-4 h-4" />;
    if (feature.includes('export') || feature.includes('download')) return <Download className="w-4 h-4" />;
    if (feature.includes('white-label') || feature.includes('custom')) return <Globe className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  const calculateFinalPrice = (price) => {
    if (price === 0) return 0;
    
    if (appliedPromotion && appliedPromotion.type === 'percentage') {
      const discountAmount = price * (appliedPromotion.value / 100);
      return Math.max(0, price - discountAmount);
    } else if (appliedPromotion && appliedPromotion.type === 'fixed') {
      return Math.max(0, price - appliedPromotion.value);
    }
    
    return price;
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    
    const finalPrice = calculateFinalPrice(price);
    let discountText = '';
    
    if (appliedPromotion && appliedPromotion.type === 'percentage') {
      discountText = ` (${appliedPromotion.value}% off)`;
    } else if (appliedPromotion && appliedPromotion.type === 'fixed') {
      discountText = ` ($${appliedPromotion.value} off)`;
    }
    
    if (finalPrice === 0) return 'Free' + discountText;
    return `$${finalPrice.toFixed(2)}/month${discountText}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan for your trading journey. Start free and upgrade anytime.
          </p>
        </div>

        {/* Promotion Code Section */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3">Have a Promotion Code?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                placeholder="Enter promotion code"
                className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={validatingPromotion}
              />
              <button
                onClick={validatePromotionCode}
                disabled={validatingPromotion || !promotionCode.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                {validatingPromotion ? 'Validating...' : 'Apply'}
              </button>
            </div>
            {appliedPromotion && (
              <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                <p className="text-green-300 text-sm font-medium">
                  ✓ {appliedPromotion.name} applied
                </p>
                <p className="text-green-400 text-xs">
                  {appliedPromotion.value}% discount
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:scale-105 ${
                plan.is_popular 
                  ? 'border-2 border-purple-500 bg-gradient-to-b from-purple-50 to-white shadow-2xl' 
                  : 'border border-gray-200 bg-white hover:shadow-xl'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  {plan.name === 'Enterprise' && <Crown className="w-6 h-6 text-yellow-500 mr-2" />}
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  {appliedPromotion && plan.price > 0 ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        ${plan.price}/month
                      </div>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                  )}
                </div>
                {plan.trial_days > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    {plan.trial_days}-day free trial
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getFeatureIcon(feature)}
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full mt-6 ${
                    plan.is_popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                      : calculateFinalPrice(plan.price) === 0
                      ? 'bg-gray-800 hover:bg-gray-900'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {calculateFinalPrice(plan.price) === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center text-gray-300">
          <p className="text-sm">
            All plans include secure data backup, 99.9% uptime guarantee, and 24/7 support.
          </p>
          <p className="text-sm mt-2">
            Need a custom plan? <button className="text-purple-400 hover:text-purple-300 underline">Contact us</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanSelector;
