import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Lock,
  Activity,
  TrendingUp,
  AlertCircle,
  Info
} from 'lucide-react';

const FraudDetectionPanel = () => {
  const [fraudAnalysis, setFraudAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState({
    customer_email: '',
    amount: '',
    card_number: '',
    ip_address: ''
  });
  const [showCardNumber, setShowCardNumber] = useState(false);

  const analyzeFraud = async () => {
    setLoading(true);
    setError(null);

    try {
      // Input validation for required fields
      const requiredFields = ['customer_email', 'amount', 'card_number', 'ip_address'];
      const missingFields = requiredFields.filter(field => !testData[field] || testData[field].trim() === '');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testData.customer_email)) {
        throw new Error('Invalid email format');
      }

      // Validate amount is a positive number
      const amount = parseFloat(testData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      // Validate card number format (basic Luhn algorithm check)
      const cardNumber = testData.card_number.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardNumber)) {
        throw new Error('Card number must be 13-19 digits');
      }

      // Defensive token and user_id handling
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('user_id');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const response = await fetch('/api/payments/fraud/analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testData,
          user_id: userId
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to analyze fraud risk');
        }
      }

      const data = await response.json();
      setFraudAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertClasses = (riskLevel) => {
    const alertClassMap = {
      'critical': 'border-red-200 bg-red-50',
      'high': 'border-orange-200 bg-orange-50',
      'medium': 'border-yellow-200 bg-yellow-50',
      'low': 'border-green-200 bg-green-50',
      'default': 'border-blue-200 bg-blue-50'
    };
    return alertClassMap[riskLevel] || alertClassMap.default;
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRiskPercentage = (riskScore) => {
    return Math.round(riskScore * 100);
  };

  const getProgressColor = (riskScore) => {
    if (riskScore < 0.3) return 'bg-green-500';
    if (riskScore < 0.6) return 'bg-yellow-500';
    if (riskScore < 0.8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleInputChange = (field, value) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fillTestData = (scenario) => {
    switch (scenario) {
      case 'low_risk':
        setTestData({
          customer_email: 'john.doe@example.com',
          amount: '29.99',
          card_number: '4111111111111111',
          ip_address: '192.168.1.100'
        });
        break;
      case 'medium_risk':
        setTestData({
          customer_email: 'test@tempmail.com',
          amount: '150.00',
          card_number: '4000000000000002',
          ip_address: '10.0.0.1'
        });
        break;
      case 'high_risk':
        setTestData({
          customer_email: 'fake@test.com',
          amount: '5000.00',
          card_number: '4000000000000002',
          ip_address: '192.168.1.1'
        });
        break;
      case 'critical_risk':
        setTestData({
          customer_email: 'suspicious@fake.com',
          amount: '10000.00',
          card_number: '4000000000000002',
          ip_address: '10.0.0.1'
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Fraud Detection Analysis</h2>
        <p className="text-gray-600">Advanced ML-based fraud detection and risk scoring</p>
      </div>

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Test Scenarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => fillTestData('low_risk')}
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              Low Risk
            </Button>
            <Button
              onClick={() => fillTestData('medium_risk')}
              variant="outline"
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              Medium Risk
            </Button>
            <Button
              onClick={() => fillTestData('high_risk')}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              High Risk
            </Button>
            <Button
              onClick={() => fillTestData('critical_risk')}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Critical Risk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Data Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                value={testData.customer_email}
                onChange={(e) => handleInputChange('customer_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={testData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="29.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number (Test)
              </label>
              <div className="relative">
                <input
                  type={showCardNumber ? "text" : "password"}
                  value={testData.card_number}
                  onChange={(e) => handleInputChange('card_number', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4111111111111111"
                />
                <button
                  type="button"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showCardNumber ? "Hide card number" : "Show card number"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowCardNumber(!showCardNumber);
                    }
                  }}
                >
                  {showCardNumber ? (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={testData.ip_address}
                onChange={(e) => handleInputChange('ip_address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.100"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={analyzeFraud}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Analyze Fraud Risk
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Fraud Analysis Results */}
      {fraudAnalysis && (
        <div className="space-y-6">
          {/* Risk Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Risk Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Risk Level</span>
                  <Badge className={`${getRiskColor(fraudAnalysis.risk_level)} flex items-center space-x-1`}>
                    {getRiskIcon(fraudAnalysis.risk_level)}
                    <span className="font-medium">{fraudAnalysis.risk_level?.toUpperCase()}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">{getRiskPercentage(fraudAnalysis.risk_score)}%</span>
                  </div>
                  <Progress 
                    value={getRiskPercentage(fraudAnalysis.risk_score)} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Manual Review</div>
                    <div className={`font-medium ${fraudAnalysis.requires_manual_review ? 'text-red-600' : 'text-green-600'}`}>
                      {fraudAnalysis.requires_manual_review ? 'REQUIRED' : 'NOT REQUIRED'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Should Block</div>
                    <div className={`font-medium ${fraudAnalysis.should_block ? 'text-red-600' : 'text-green-600'}`}>
                      {fraudAnalysis.should_block ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fraudAnalysis.risk_factors && fraudAnalysis.risk_factors.length > 0 ? (
                <div className="space-y-2">
                  {fraudAnalysis.risk_factors.map((factor, index) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {factor}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No risk factors detected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Recommendation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={getAlertClasses(fraudAnalysis.risk_level)}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{fraudAnalysis.recommendation}</div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Analysis Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Analysis Timestamp</span>
                  <span className="text-sm font-medium">
                    {new Date(fraudAnalysis.analysis_timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="text-sm font-medium">
                    {(fraudAnalysis.risk_score * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className="text-sm font-medium">
                    {fraudAnalysis.risk_level?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manual Review Required</span>
                  <span className="text-sm font-medium">
                    {fraudAnalysis.requires_manual_review ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Should Block</span>
                  <span className="text-sm font-medium">
                    {fraudAnalysis.should_block ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FraudDetectionPanel;

