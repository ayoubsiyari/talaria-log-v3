import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../config/api';
import PaymentRequired from '../PaymentRequired';

const LoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const navigate = useNavigate();

  // Check for error message in URL parameters (for suspended users)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  // Add form submission debugging
  React.useEffect(() => {
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        console.log('🔍 Form submit event detected');
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Form submit handler called');
    setIsLoading(true);
    setError('');
    setShowPaymentRequired(false); // Reset payment required state on new login attempt

    // Retry logic for race conditions after payment
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Login attempt ${attempt}/${maxRetries} for ${formData.email}`);
        const data = await api.post('/auth/login', formData);

        // Check if payment is required
        if (data.payment_required) {
          console.log('💳 Payment required for account activation');
          toast.info('Login successful! Please complete payment to activate your account.');
          
          // Call the success callback with user data and tokens
          if (onLoginSuccess) {
            onLoginSuccess(data.user, {
              access_token: data.access_token,
              refresh_token: data.refresh_token
            });
          }
          
          // Redirect to subscription selection page
          setTimeout(() => {
            window.location.href = '/subscription/select';
          }, 2000);
          return;
        }
        
        toast.success('Login successful!');
        
        // Call the success callback with user data and tokens
        if (onLoginSuccess) {
          onLoginSuccess(data.user, {
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });
        }
        return; // Success, exit retry loop
        
      } catch (err) {
        console.error(`Login error (attempt ${attempt}):`, err);
        lastError = err;
        
        // Handle payment required response (402)
        if (err.status === 402) {
          // If this is the first attempt and user just paid, wait and retry
          if (attempt === 1) {
            const postPaymentInfo = localStorage.getItem('postPaymentOrderInfo');
            if (postPaymentInfo) {
              console.log('🔄 User just completed payment, waiting 2 seconds before retry...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Retry
            }
          }
          
          // User needs to complete payment before they can login
          console.log('💳 Payment required for account activation');
          toast.info('Please complete your payment to activate your account.');
          
          // Redirect to subscription selection page
          setTimeout(() => {
            window.location.href = '/subscription/select';
          }, 2000);
          return;
        }
        
        // For other errors, wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 1 second before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All retries failed
    setError(lastError?.message || 'Login failed. Please try again.');
    toast.error(lastError?.message || 'Login failed');
    setIsLoading(false);
  };

  // Show payment required component if needed
  if (showPaymentRequired) {
    return (
      <PaymentRequired 
        onContinue={() => navigate('/subscription/select')} 
        onTryAgain={() => setShowPaymentRequired(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your HADES Admin Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
