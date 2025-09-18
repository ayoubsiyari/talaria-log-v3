import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle, XCircle, Loader2, Copy, Percent } from 'lucide-react';

const ReferralCodeTest = () => {
  const [code, setCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateCode = async () => {
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setValidationResult(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referral-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          amount: 29.99, // Example subscription price
          plan_id: 'premium'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data.data);
      } else {
        setError(data.error || 'Invalid referral code');
      }
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      validateCode();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Sample codes for testing
  const sampleCodes = ['STO0005', 'TEC0006', 'PREMIUM0006', 'TAY0007', 'WELCOME10', 'SAVE20'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Referral Code Testing</h1>
          <p className="text-muted-foreground">
            Test the affiliate referral code system - enter a code to see validation results
          </p>
        </div>

        {/* Sample Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Codes to Test</CardTitle>
            <CardDescription>
              These codes were auto-generated from the affiliate system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sampleCodes.map((sampleCode) => (
                <div key={sampleCode} className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setCode(sampleCode)}
                  >
                    {sampleCode}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(sampleCode)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Validate Referral Code</CardTitle>
            <CardDescription>
              Enter a referral code to check if it's valid and see the discount details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="code">Referral Code</Label>
                <Input
                  id="code"
                  placeholder="Enter referral code (e.g., STO0005)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={validateCode} disabled={loading || !code.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                  {loading ? 'Validating...' : 'Validate'}
                </Button>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">Invalid Code</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {validationResult && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Valid Referral Code!</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Code Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <span className="font-mono font-bold">{validationResult.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 mr-1" />
                          {validationResult.discount_percent}% OFF
                        </Badge>
                      </div>
                      {validationResult.is_affiliate_code && (
                        <div className="flex justify-between">
                          <span>Affiliate:</span>
                          <span className="font-medium">{validationResult.affiliate_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Price Calculation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Original Price:</span>
                        <span>$29.99</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${validationResult.discount_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Final Price:</span>
                        <span>${validationResult.discounted_total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-muted-foreground mb-1">Description:</p>
                  <p className="text-sm">{validationResult.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Affiliate Referrals Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Affiliate Shares Code</h3>
                <p className="text-sm text-muted-foreground">
                  Affiliate partners share their unique referral codes with potential customers
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Customer Uses Code</h3>
                <p className="text-sm text-muted-foreground">
                  Customer enters the code during signup/checkout to get a discount
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Affiliate Earns Commission</h3>
                <p className="text-sm text-muted-foreground">
                  Affiliate automatically receives commission based on their rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralCodeTest;