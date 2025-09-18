import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, AlertDescription } from '@/components/ui';
import { Shield, CreditCard, AlertCircle } from 'lucide-react';
import EnhancedPaymentForm from './EnhancedPaymentForm';
import StripePaymentForm from './StripePaymentForm';

const PaymentFormDemo = () => {
  const [selectedForm, setSelectedForm] = useState('stripe');
  const [loading, setLoading] = useState(false);

  const handlePaymentSubmit = async (paymentData) => {
    setLoading(true);
    console.log('Payment data received:', paymentData);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Payment processed successfully!');
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Payment Form Security Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              This demo shows the difference between PCI-compliant and non-compliant payment forms.
            </p>
            
            <div className="flex space-x-4">
              <Button
                variant={selectedForm === 'stripe' ? 'default' : 'outline'}
                onClick={() => setSelectedForm('stripe')}
                className="flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>PCI-Compliant (Stripe)</span>
              </Button>
              
              <Button
                variant={selectedForm === 'legacy' ? 'default' : 'outline'}
                onClick={() => setSelectedForm('legacy')}
                className="flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Legacy (Deprecated)</span>
              </Button>
            </div>

            {selectedForm === 'stripe' && (
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">✅ PCI-Compliant Payment Form</p>
                    <ul className="text-sm space-y-1">
                      <li>• Card data is tokenized by Stripe Elements</li>
                      <li>• No raw card data sent to your server</li>
                      <li>• PCI DSS Level 1 compliant</li>
                      <li>• Secure payment processing</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {selectedForm === 'legacy' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">❌ Legacy Payment Form (Deprecated)</p>
                    <ul className="text-sm space-y-1">
                      <li>• Sends raw card data (PCI DSS violation)</li>
                      <li>• Not secure for production use</li>
                      <li>• Form has been disabled for security</li>
                      <li>• Use Stripe form instead</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedForm === 'stripe' && (
        <StripePaymentForm onSubmit={handlePaymentSubmit} loading={loading} />
      )}

      {selectedForm === 'legacy' && (
        <EnhancedPaymentForm onSubmit={handlePaymentSubmit} loading={loading} />
      )}
    </div>
  );
};

export default PaymentFormDemo;
