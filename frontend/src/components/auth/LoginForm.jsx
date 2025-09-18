import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Loader2, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../config/api';
import PaymentRequired from '../PaymentRequired';

const LoginForm = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    dateOfBirth: '',
    gender: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // Track which social button is loading
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

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '' });
    setRegisterData({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      country: '',
      zipCode: '',
      dateOfBirth: '',
      gender: '',
      agreeToTerms: false,
      agreeToMarketing: false
    });
    setError('');
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
        if (data.payment_required || data.subscription_required) {
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

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    setError('');

    try {
      // Simulate a brief loading state for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show coming soon message
      toast.info(`${provider} login is coming soon! Please use email/password for now.`);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setError(`${provider} login is not available yet. Please use email/password.`);
      toast.error(`${provider} login is not available yet.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (registerData.password !== registerData.confirmPassword) {
        setIsLoading(false);
        setError('Passwords do not match');
        return;
      }

      if (!registerData.agreeToTerms) {
        setIsLoading(false);
        setError('You must agree to the terms and conditions');
        return;
      }

      const response = await api.post('/auth/register', {
        username: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        company: registerData.company,
        address: registerData.address,
        city: registerData.city,
        country: registerData.country,
        zipCode: registerData.zipCode,
        dateOfBirth: registerData.dateOfBirth,
        gender: registerData.gender,
        agreeToTerms: registerData.agreeToTerms,
        agreeToMarketing: registerData.agreeToMarketing
      });

      toast.success('Registration successful! Please log in.');
      setIsLogin(true);
      setFormData({ email: registerData.email, password: '' });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex min-h-[600px] relative">
          {/* Left Panel - Welcome Back (Purple) - Animated */}
          <div className={`flex-1 bg-gradient-to-br from-purple-600 to-purple-800 p-12 transition-all duration-700 ease-in-out transform ${!isLogin ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'} relative`}>
            {/* Curved divider */}
            <div className="absolute right-0 top-0 bottom-0 w-16 overflow-hidden">
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full -translate-x-16"></div>
            </div>
            
            <div className="w-full max-w-md mx-auto flex flex-col justify-center items-center text-center text-white relative z-10">
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-purple-100 text-lg">
                  Enter your personal details to use all of site features
                </p>
              </div>

              <Button
                onClick={toggleMode}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                SIGN IN
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Forms (White) - Animated */}
          <div className={`flex-1 p-12 transition-all duration-700 ease-in-out transform ${isLogin ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}`}>
            <div className="w-full max-w-md mx-auto">
              {/* Login Form */}
              {isLogin ? (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                    <p className="text-gray-600">Welcome back! Please sign in to your account</p>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="flex flex-col items-center space-y-2 mb-6">
                    <div className="flex justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('Google')}
                        disabled={socialLoading === 'Google' || isLoading}
                        aria-label="Sign in with Google (Coming Soon)"
                        title="Google login coming soon"
                      >
                        {socialLoading === 'Google' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">G+</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('Facebook')}
                        disabled={socialLoading === 'Facebook' || isLoading}
                        aria-label="Sign in with Facebook (Coming Soon)"
                        title="Facebook login coming soon"
                      >
                        {socialLoading === 'Facebook' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">f</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('GitHub')}
                        disabled={socialLoading === 'GitHub' || isLoading}
                        aria-label="Sign in with GitHub (Coming Soon)"
                        title="GitHub login coming soon"
                      >
                        {socialLoading === 'GitHub' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">Git</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('LinkedIn')}
                        disabled={socialLoading === 'LinkedIn' || isLoading}
                        aria-label="Sign in with LinkedIn (Coming Soon)"
                        title="LinkedIn login coming soon"
                      >
                        {socialLoading === 'LinkedIn' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">in</span>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 italic">Social login coming soon</p>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or use your email password</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Forget Your Password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Signing In...
                        </div>
                      ) : (
                        'SIGN IN'
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                    <p className="text-gray-600">Enter your personal details to use all of site features</p>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="flex flex-col items-center space-y-2 mb-6">
                    <div className="flex justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('Google')}
                        disabled={socialLoading === 'Google' || isLoading}
                        aria-label="Sign up with Google (Coming Soon)"
                        title="Google sign up coming soon"
                      >
                        {socialLoading === 'Google' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">G+</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('Facebook')}
                        disabled={socialLoading === 'Facebook' || isLoading}
                        aria-label="Sign up with Facebook (Coming Soon)"
                        title="Facebook sign up coming soon"
                      >
                        {socialLoading === 'Facebook' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">f</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('GitHub')}
                        disabled={socialLoading === 'GitHub' || isLoading}
                        aria-label="Sign up with GitHub (Coming Soon)"
                        title="GitHub sign up coming soon"
                      >
                        {socialLoading === 'GitHub' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">Git</span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-12 h-12 rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSocialLogin('LinkedIn')}
                        disabled={socialLoading === 'LinkedIn' || isLoading}
                        aria-label="Sign up with LinkedIn (Coming Soon)"
                        title="LinkedIn sign up coming soon"
                      >
                        {socialLoading === 'LinkedIn' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-sm font-bold text-gray-700">in</span>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 italic">Social login coming soon</p>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or use your email for registration</span>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="name"
                            type="text"
                            placeholder="Full Name"
                            value={registerData.name}
                            onChange={handleRegisterInputChange}
                            className="pl-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={registerData.email}
                            onChange={handleRegisterInputChange}
                            className="pl-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Input
                            name="phone"
                            type="tel"
                            placeholder="Phone Number"
                            value={registerData.phone}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <Input
                            name="company"
                            type="text"
                            placeholder="Company (Optional)"
                            value={registerData.company}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Input
                            name="dateOfBirth"
                            type="date"
                            placeholder="Date of Birth"
                            value={registerData.dateOfBirth}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <select
                            name="gender"
                            value={registerData.gender}
                            onChange={handleRegisterInputChange}
                            className="w-full h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-md px-3"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h3>
                      
                      <div className="relative">
                        <Input
                          name="address"
                          type="text"
                          placeholder="Street Address"
                          value={registerData.address}
                          onChange={handleRegisterInputChange}
                          className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <Input
                            name="city"
                            type="text"
                            placeholder="City"
                            value={registerData.city}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <Input
                            name="country"
                            type="text"
                            placeholder="Country"
                            value={registerData.country}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <Input
                            name="zipCode"
                            type="text"
                            placeholder="ZIP Code"
                            value={registerData.zipCode}
                            onChange={handleRegisterInputChange}
                            className="h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Security Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Security</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={registerData.password}
                            onChange={handleRegisterInputChange}
                            className="pl-10 pr-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterInputChange}
                            className="pl-10 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={registerData.agreeToTerms}
                          onChange={(e) => setRegisterData({...registerData, agreeToTerms: e.target.checked})}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          required
                        />
                        <label className="text-sm text-gray-700">
                          I agree to the{' '}
                          <a href="/terms" className="text-purple-600 hover:text-purple-800 underline">
                            Terms and Conditions
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" className="text-purple-600 hover:text-purple-800 underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="agreeToMarketing"
                          checked={registerData.agreeToMarketing}
                          onChange={(e) => setRegisterData({...registerData, agreeToMarketing: e.target.checked})}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          I would like to receive marketing communications and updates
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Creating Account...
                        </div>
                      ) : (
                        'SIGN UP'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Mobile Toggle - Show when in login mode on mobile */}
          <div className={`lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 ${isLogin ? 'block' : 'hidden'}`}>
            <Button
              onClick={toggleMode}
              variant="outline"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
            >
              Don't have an account? Sign Up
            </Button>
          </div>

          {/* Mobile Toggle - Show when in register mode on mobile */}
          <div className={`lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 ${!isLogin ? 'block' : 'hidden'}`}>
            <Button
              onClick={toggleMode}
              variant="outline"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
