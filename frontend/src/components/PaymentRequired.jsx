import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const PaymentRequired = ({ onContinue, onTryAgain }) => {
  const navigate = useNavigate();

  // Check if user just completed payment
  const postPaymentInfo = localStorage.getItem('postPaymentOrderInfo');
  const hasRecentPayment = !!postPaymentInfo;

  const handleContinueToPayment = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigate('/subscription/select');
    }
  };

  const handleTryAgain = () => {
    if (onTryAgain) {
      onTryAgain();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {hasRecentPayment ? 'Payment Processing...' : 'Complete Your Subscription'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {hasRecentPayment 
              ? 'We\'re processing your payment. Please try logging in again in a moment.'
              : 'Your account is not active yet. Please complete your payment to continue.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className={hasRecentPayment ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}>
            <CheckCircle className={`h-4 w-4 ${hasRecentPayment ? "text-blue-600" : "text-orange-600"}`} />
            <AlertDescription className={hasRecentPayment ? "text-blue-800" : "text-orange-800"}>
              {hasRecentPayment 
                ? 'Your payment was successful! We\'re just finalizing your account activation. Please try logging in again.'
                : 'You\'ve successfully registered! Now you need to choose a plan and complete your payment to activate your account.'
              }
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {!hasRecentPayment && (
              <Button 
                onClick={handleContinueToPayment}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Choose Your Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            <Button 
              onClick={handleTryAgain}
              variant={hasRecentPayment ? "default" : "outline"}
              className={`w-full ${hasRecentPayment ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" : ""}`}
            >
              {hasRecentPayment ? "Try Login Again" : "Try Login Again"}
            </Button>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">What happens next?</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Choose your subscription plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Complete your payment securely</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Get instant access to all features</span>
              </div>
            </div>
          </div>

          {!hasRecentPayment && (
            <Button
              onClick={handleContinueToPayment}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Continue to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentRequired;
