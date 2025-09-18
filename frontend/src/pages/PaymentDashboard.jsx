import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Activity, 
  Shield, 
  CreditCard, 
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye,
  Lock
} from 'lucide-react';

// Import the new components
import PaymentMonitoringDashboard from '@/components/Payment/PaymentMonitoringDashboard';
import FraudDetectionPanel from '@/components/Payment/FraudDetectionPanel';
import PCIComplianceDashboard from '@/components/Payment/PCIComplianceDashboard';
import EnhancedPaymentForm from '@/components/Payment/EnhancedPaymentForm';
import SecurityStatusIndicator from '@/components/Payment/SecurityStatusIndicator';

// Import authentication service
import authService from '@/services/authService';

const PaymentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePaymentSubmit = async (paymentData) => {
    setPaymentLoading(true);
    
    try {
      // Input validation
      const validationErrors = [];
      
      // Check if paymentData exists
      if (!paymentData || typeof paymentData !== 'object') {
        validationErrors.push('Payment data is required');
        setPaymentLoading(false);
        toast.error('Payment data is required');
        return;
      }

      // Validate required fields
      if (!paymentData.amount || typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
        validationErrors.push('Amount must be a positive number');
      }

      if (!paymentData.currency || typeof paymentData.currency !== 'string') {
        validationErrors.push('Currency is required');
      } else {
        // Validate currency format (3-letter ISO code)
        const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'BGN', 'RON', 'HRK', 'RUB', 'TRY', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VEF', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD', 'NGN', 'KES', 'GHS', 'UGX', 'TZS', 'ETB', 'ZMW', 'BWP', 'SZL', 'LSL', 'NAD', 'AOA', 'MZN', 'ZWL', 'XOF', 'XAF', 'XPF', 'KWD', 'BHD', 'QAR', 'AED', 'SAR', 'OMR', 'JOD', 'LBP', 'ILS', 'PKR', 'INR', 'BDT', 'LKR', 'NPR', 'AFN', 'KZT', 'UZS', 'KGS', 'TJS', 'TMT', 'AZN', 'GEL', 'AMD', 'BYN', 'MDL', 'UAH', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'PHP', 'MMK', 'LAK', 'KHR', 'BND', 'FJD', 'PGK', 'SBD', 'VUV', 'WST', 'TOP', 'NZD', 'AUD'];
        const sanitizedCurrency = paymentData.currency.trim().toUpperCase();
        if (!validCurrencies.includes(sanitizedCurrency)) {
          validationErrors.push('Invalid currency code');
        } else {
          paymentData.currency = sanitizedCurrency;
        }
      }

      // Validate payment method (either paymentMethodId or card details)
      if (!paymentData.paymentMethodId && !paymentData.card) {
        validationErrors.push('Either payment method ID or card details are required');
      }

      // If paymentMethodId is provided, validate it
      if (paymentData.paymentMethodId) {
        if (typeof paymentData.paymentMethodId !== 'string' || paymentData.paymentMethodId.trim().length === 0) {
          validationErrors.push('Payment method ID must be a non-empty string');
        } else {
          paymentData.paymentMethodId = paymentData.paymentMethodId.trim();
        }
      }

      // If card details are provided, validate them
      if (paymentData.card) {
        if (typeof paymentData.card !== 'object') {
          validationErrors.push('Card details must be an object');
        } else {
          // Validate card number
          if (!paymentData.card.number || typeof paymentData.card.number !== 'string') {
            validationErrors.push('Card number is required');
          } else {
            const sanitizedNumber = paymentData.card.number.replace(/\s/g, '').replace(/-/g, '');
            if (!/^\d{13,19}$/.test(sanitizedNumber)) {
              validationErrors.push('Card number must be 13-19 digits');
            } else {
              paymentData.card.number = sanitizedNumber;
            }
          }

          // Validate expiry
          if (!paymentData.card.exp_month || !paymentData.card.exp_year) {
            validationErrors.push('Card expiry month and year are required');
          } else {
            const month = parseInt(paymentData.card.exp_month);
            const year = parseInt(paymentData.card.exp_year);
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            if (isNaN(month) || month < 1 || month > 12) {
              validationErrors.push('Expiry month must be between 1 and 12');
            }
            if (isNaN(year) || year < currentYear || (year === currentYear && month < currentMonth)) {
              validationErrors.push('Card has expired');
            }
          }

          // Validate CVC
          if (!paymentData.card.cvc || typeof paymentData.card.cvc !== 'string') {
            validationErrors.push('Card CVC is required');
          } else {
            const sanitizedCvc = paymentData.card.cvc.trim();
            if (!/^\d{3,4}$/.test(sanitizedCvc)) {
              validationErrors.push('CVC must be 3 or 4 digits');
            } else {
              paymentData.card.cvc = sanitizedCvc;
            }
          }

          // Validate cardholder name
          if (paymentData.card.name) {
            if (typeof paymentData.card.name !== 'string') {
              validationErrors.push('Cardholder name must be a string');
            } else {
              paymentData.card.name = paymentData.card.name.trim();
            }
          }
        }
      }

      // Validate customer identifiers if provided
      if (paymentData.customerId) {
        if (typeof paymentData.customerId !== 'string' || paymentData.customerId.trim().length === 0) {
          validationErrors.push('Customer ID must be a non-empty string');
        } else {
          paymentData.customerId = paymentData.customerId.trim();
        }
      }

      if (paymentData.customerEmail) {
        if (typeof paymentData.customerEmail !== 'string') {
          validationErrors.push('Customer email must be a string');
        } else {
          const sanitizedEmail = paymentData.customerEmail.trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(sanitizedEmail)) {
            validationErrors.push('Invalid email format');
          } else {
            paymentData.customerEmail = sanitizedEmail;
          }
        }
      }

      // Validate amount range (prevent extremely large or small amounts)
      if (paymentData.amount) {
        if (paymentData.amount < 0.01) {
          validationErrors.push('Amount must be at least $0.01');
        }
        if (paymentData.amount > 999999.99) {
          validationErrors.push('Amount cannot exceed $999,999.99');
        }
        // Round to 2 decimal places
        paymentData.amount = Math.round(paymentData.amount * 100) / 100;
      }

      // If validation fails, show errors and return early
      if (validationErrors.length > 0) {
        setPaymentLoading(false);
        toast.error('Validation failed: ' + validationErrors.join(', '));
        return;
      }

      // Use the secure authentication service for payment processing
      const result = await authService.makePaymentRequest(paymentData);
      
      // Handle payment success
      if (result.payment_intent) {
        console.log('Payment successful:', result);
        toast.success('Payment processed successfully!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Security Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Enterprise-grade payment processing with advanced security features
          </p>
        </div>

        {/* Security Status Overview */}
        <div className="mb-8">
          <SecurityStatusIndicator />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Fraud Detection</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">PCI Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Security Level</span>
                      <span className="font-medium text-green-600">Enterprise Grade</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">PCI Compliance</span>
                      <span className="font-medium text-green-600">100%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fraud Detection</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monitoring</span>
                      <span className="font-medium text-green-600">Real-time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>JWT Authentication</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>CSRF Protection</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>End-to-End Encryption</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Fraud Detection</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>PCI DSS Compliance</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Real-time Monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Payment processed successfully</span>
                    </div>
                    <span className="text-xs text-gray-500">2 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Fraud detection analysis completed</span>
                    </div>
                    <span className="text-xs text-gray-500">5 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">High-risk transaction flagged</span>
                    </div>
                    <span className="text-xs text-gray-500">10 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <PaymentMonitoringDashboard />
          </TabsContent>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud">
            <FraudDetectionPanel />
          </TabsContent>

          {/* PCI Compliance Tab */}
          <TabsContent value="compliance">
            <PCIComplianceDashboard />
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Secure Payment Processing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedPaymentForm 
                    onSubmit={handlePaymentSubmit}
                    loading={paymentLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaymentDashboard;

