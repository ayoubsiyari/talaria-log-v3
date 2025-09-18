import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Info
} from 'lucide-react';
import { isValidCardNumber, getCardType } from 'card-validator';

const EnhancedPaymentForm = ({ onSubmit, loading = false, isTestMode = null }) => {
  // Determine if test mode is enabled
  const testModeEnabled = isTestMode !== null ? isTestMode : import.meta.env.VITE_ENABLE_TEST_CARDS === 'true';
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    billing_address: '',
    cardholder_name: ''
  });

  const [security, setSecurity] = useState({
    showCardDetails: false,
    isSecure: false,
    riskLevel: 'low',
    tokenized: false
  });

  const [errors, setErrors] = useState({});
  const [csrfToken, setCsrfToken] = useState('');
  const [csrfLoading, setCsrfLoading] = useState(false);
  const [csrfError, setCsrfError] = useState('');

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const fetchCsrfToken = async () => {
    // Clear previous errors
    setCsrfError('');
    setCsrfLoading(true);

    // Validate token presence first
    const token = localStorage.getItem('token');
    if (!token) {
      const errorMsg = 'Authentication token not found. Please log in again.';
      setCsrfError(errorMsg);
      setCsrfLoading(false);
      console.error('CSRF fetch failed: No auth token found');
      return;
    }

    // Retry logic with 3 attempts
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        // Only include Authorization header when token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/payments/csrf-token', {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrf_token);
          setCsrfError('');
          setCsrfLoading(false);
          return;
        } else {
          const errorText = await response.text();
          console.warn(`CSRF fetch attempt ${attempt} failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });

          // If it's the last attempt, set error
          if (attempt === maxRetries) {
            const errorMsg = `Failed to obtain security token. Server returned ${response.status}: ${response.statusText}`;
            setCsrfError(errorMsg);
            setCsrfLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn(`CSRF fetch attempt ${attempt} failed:`, {
          error: error.message,
          stack: error.stack
        });

        // If it's the last attempt, set error
        if (attempt === maxRetries) {
          const errorMsg = `Failed to obtain security token after ${maxRetries} attempts. Please check your connection and try again.`;
          setCsrfError(errorMsg);
          setCsrfLoading(false);
          return;
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Real-time security validation
    validateSecurity(field, value);
  };

  const validateSecurity = (field, value) => {
    let riskLevel = 'low';
    let isSecure = true;

    // Email validation
    if (field === 'customer_email' && value) {
      const emailDomain = value.split('@')[1]?.toLowerCase();
      const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      
      if (suspiciousDomains.includes(emailDomain)) {
        riskLevel = 'high';
        isSecure = false;
      }
    }

    // Card number validation
    if (field === 'card_number' && value) {
      const cleanCard = value.replace(/\s/g, '');
      
      // Use card-validator for proper validation
      const cardValidation = isValidCardNumber(cleanCard);
      const cardType = getCardType(cleanCard);
      
      if (!cardValidation.isValid) {
        riskLevel = 'high';
        isSecure = false;
      } else {
        // Check for test cards only if test mode is enabled
        if (testModeEnabled) {
          // Known test card numbers (only checked in test mode)
          const testCardNumbers = [
            '4000000000000002', // Stripe test card
            '4242424242424242', // Visa test card
            '5555555555554444', // Mastercard test card
            '378282246310005',  // American Express test card
            '6011111111111117'  // Discover test card
          ];
          
          if (testCardNumbers.includes(cleanCard)) {
            riskLevel = 'medium'; // Test cards are medium risk in test mode
            isSecure = true; // Allow test cards in test mode
          }
        } else {
          // In production, any test card should be rejected
          const testCardNumbers = [
            '4000000000000002', '4242424242424242', '5555555555554444',
            '378282246310005', '6011111111111117'
          ];
          
          if (testCardNumbers.includes(cleanCard)) {
            riskLevel = 'high';
            isSecure = false;
          }
        }
      }
    }

    // Amount validation (if available)
    if (field === 'amount' && value) {
      const amount = parseFloat(value);
      if (amount > 10000) {
        riskLevel = 'medium';
      }
    }

    setSecurity(prev => ({
      ...prev,
      riskLevel,
      isSecure
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }

    if (!formData.card_number.trim()) {
      newErrors.card_number = 'Card number is required';
    } else {
      const cleanCard = formData.card_number.replace(/\s/g, '');
      const cardValidation = isValidCardNumber(cleanCard);
      
      if (!cardValidation.isValid) {
        newErrors.card_number = 'Invalid card number';
      } else if (!testModeEnabled) {
        // In production, reject test cards
        const testCardNumbers = [
          '4000000000000002', '4242424242424242', '5555555555554444',
          '378282246310005', '6011111111111117'
        ];
        
        if (testCardNumbers.includes(cleanCard)) {
          newErrors.card_number = 'Test cards are not allowed in production';
        }
      }
    }

    if (!formData.expiry_month || !formData.expiry_year) {
      newErrors.expiry = 'Expiry date is required';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const expiryYear = parseInt(formData.expiry_year);
      const expiryMonth = parseInt(formData.expiry_month);
      
      if (expiryYear < currentYear || 
          (expiryYear === currentYear && expiryMonth < currentMonth)) {
        newErrors.expiry = 'Card has expired';
      }
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!formData.cardholder_name.trim()) {
      newErrors.cardholder_name = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!csrfToken) {
      if (csrfError) {
        setErrors({ general: csrfError });
      } else if (csrfLoading) {
        setErrors({ general: 'Obtaining security token... Please wait.' });
      } else {
        setErrors({ general: 'Security token not available. Please refresh the page.' });
      }
      return;
    }

    // Prepare payment data
    const paymentData = {
      ...formData,
      csrf_token: csrfToken,
      items: [
        {
          name: 'Premium Subscription',
          price: 29.99,
          quantity: 1,
          product_id: 'premium_monthly'
        }
      ],
      card_data: {
        card_number: formData.card_number,
        expiry_month: formData.expiry_month,
        expiry_year: formData.expiry_year,
        cvv: formData.cvv,
        cardholder_name: formData.cardholder_name
      }
    };

    onSubmit(paymentData);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Deprecation Notice */}
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">This payment form is deprecated for security reasons.</p>
            <p className="text-sm">
              This form sends raw card data which violates PCI DSS requirements. 
              Please use the PCI-compliant Stripe payment form instead.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/checkout?form=stripe'}
              className="mt-2"
            >
              Use PCI-Compliant Payment Form
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Status - DEPRECATED</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">NOT PCI COMPLIANT</span>
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lock className="h-4 w-4" />
                <span>
                  {csrfLoading ? 'Obtaining security token...' : 'Raw Card Data - Use Stripe Form'}
                </span>
                {csrfLoading && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deprecated Form Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Information - DEPRECATED</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              This payment form is no longer available
            </h3>
            <p className="text-gray-600 mb-4">
              For security and PCI compliance reasons, this form has been disabled.
              Please use the secure Stripe payment form instead.
            </p>
            <Button
              onClick={() => window.location.href = '/checkout?form=stripe'}
              className="w-full max-w-xs"
            >
              <Lock className="h-4 w-4 mr-2" />
              Use Secure Payment Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPaymentForm;

