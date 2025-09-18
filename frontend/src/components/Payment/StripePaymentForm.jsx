import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Shield,
  Lock,
  Info,
  AlertCircle,
  Eye,
  EyeOff
} from '@/components/ui';
import { API_BASE_URL } from '@/config/config';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key');

const PaymentForm = ({ onSubmit, loading = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    billing_address: '',
    cardholder_name: ''
  });

  const [errors, setErrors] = useState({});
  const [csrfToken, setCsrfToken] = useState('');
  const [csrfLoading, setCsrfLoading] = useState(false);
  const [csrfError, setCsrfError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch CSRF token on component mount
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const fetchCsrfToken = async () => {
    setCsrfLoading(true);
    setCsrfError('');
    
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await fetch(`${API_BASE_URL}/payments/csrf-token`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrf_token);
          setCsrfLoading(false);
          return;
        } else {
          attempt++;
          if (attempt === maxRetries) {
            const errorMsg = `Failed to obtain security token. Server returned ${response.status}: ${response.statusText}`;
            setCsrfError(errorMsg);
            setCsrfLoading(false);
            return;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          const errorMsg = `Failed to obtain security token after ${maxRetries} attempts. Please check your connection and try again.`;
          setCsrfError(errorMsg);
          setCsrfLoading(false);
          return;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    }

    if (!formData.billing_address.trim()) {
      newErrors.billing_address = 'Billing address is required';
    }

    if (!formData.cardholder_name.trim()) {
      newErrors.cardholder_name = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrors({ general: 'Stripe is not loaded. Please refresh the page.' });
      return;
    }

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

    setIsProcessing(true);
    setErrors({});

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method using Stripe Elements (PCI-compliant)
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.cardholder_name,
          email: formData.customer_email,
          phone: formData.customer_phone,
          address: {
            line1: formData.billing_address,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Prepare payment data with tokenized payment method
      const paymentData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        billing_address: formData.billing_address,
        csrf_token: csrfToken,
        items: [
          {
            name: 'Premium Subscription',
            price: 29.99,
            quantity: 1,
            product_id: 'premium_monthly'
          }
        ],
        // Send only the payment method ID (tokenized) - no raw card data
        payment_method_id: paymentMethod.id,
        payment_intent_id: null // Will be created by backend
      };

      // Call the parent onSubmit with tokenized data
      onSubmit(paymentData);

    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>PCI-Compliant Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span className="font-medium">PCI COMPLIANT</span>
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lock className="h-4 w-4" />
                <span>
                  {csrfLoading ? 'Obtaining security token...' : 'Tokenized Processing'}
                </span>
                {csrfLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Customer Information</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </Label>
                  <Input
                    type="text"
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    id="customer_email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.customer_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </Label>
                  <Input
                    type="tel"
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customer_phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.customer_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="billing_address" className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address *
                  </Label>
                  <Input
                    type="text"
                    id="billing_address"
                    value={formData.billing_address}
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.billing_address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123 Main St, City, State 12345"
                  />
                  {errors.billing_address && (
                    <p className="mt-1 text-sm text-red-600">{errors.billing_address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Payment Information</span>
              </h4>

              <div>
                <Label htmlFor="cardholder_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name *
                </Label>
                <Input
                  type="text"
                  id="cardholder_name"
                  value={formData.cardholder_name}
                  onChange={(e) => handleInputChange('cardholder_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardholder_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="JOHN DOE"
                />
                {errors.cardholder_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardholder_name}</p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Details *
                </Label>
                <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
                  <CardElement options={cardElementOptions} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your card details are securely processed by Stripe and never stored on our servers.
                </p>
              </div>
            </div>

            {/* Security Information */}
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Your payment is secure with:</p>
                  <ul className="text-sm space-y-1">
                    <li>• PCI DSS Level 1 compliance</li>
                    <li>• Tokenized card processing</li>
                    <li>• End-to-end encryption</li>
                    <li>• Fraud detection</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* CSRF Error Display */}
            {csrfError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Security Token Error</p>
                    <p>{csrfError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchCsrfToken}
                      disabled={csrfLoading}
                    >
                      {csrfLoading ? 'Retrying...' : 'Retry'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* General Error Display */}
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Payment Error</p>
                  <p>{errors.general}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || isProcessing || csrfLoading || !!csrfError}
              className="w-full"
            >
              {loading || isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Process Secure Payment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const StripePaymentForm = ({ onSubmit, loading = false }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm onSubmit={onSubmit} loading={loading} />
    </Elements>
  );
};

export default StripePaymentForm;
