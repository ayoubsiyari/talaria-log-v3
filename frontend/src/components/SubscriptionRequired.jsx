import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SubscriptionRequired = ({ error, onSubscribe }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to subscription page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/subscription');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const getErrorDetails = () => {
    if (!error) {
      return {
        title: 'Subscription Required',
        message: 'You need an active subscription to access this feature.',
        icon: <Lock className="h-8 w-8 text-orange-500" />,
        type: 'warning'
      };
    }

    switch (error.status) {
      case 'no_subscription':
        return {
          title: 'No Active Subscription',
          message: 'You need to subscribe to access this feature.',
          icon: <CreditCard className="h-8 w-8 text-blue-500" />,
          type: 'info'
        };
      case 'expired':
        return {
          title: 'Subscription Expired',
          message: 'Your subscription has expired. Please renew to continue.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          type: 'error'
        };
      case 'cancelled':
        return {
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. Please resubscribe to continue.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          type: 'error'
        };
      case 'past_due':
        return {
          title: 'Payment Past Due',
          message: 'Your payment is past due. Please update your payment method.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          type: 'error'
        };
      default:
        return {
          title: 'Subscription Required',
          message: 'Please subscribe to access this feature.',
          icon: <Lock className="h-8 w-8 text-orange-500" />,
          type: 'warning'
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      navigate('/subscription');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {errorDetails.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorDetails.title}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {errorDetails.message}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subscription Benefits */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">What you get with a subscription:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Access to trading journal and analytics
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Portfolio tracking and performance reports
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Risk management tools
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Export and backup features
              </li>
            </ul>
          </div>

          {/* Current Status */}
          {error && (
            <div className={`rounded-lg p-4 ${
              errorDetails.type === 'error' ? 'bg-red-50' : 
              errorDetails.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Current Status:</span>
                <Badge variant={
                  errorDetails.type === 'error' ? 'destructive' : 
                  errorDetails.type === 'warning' ? 'secondary' : 'default'
                }>
                  {error.status || 'No Subscription'}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSubscribe}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-xs text-gray-500 text-center">
            Redirecting to subscription page in 3 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionRequired;
