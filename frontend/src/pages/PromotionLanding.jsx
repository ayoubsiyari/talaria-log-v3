import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  ExternalLink,
  Calendar,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  Star,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const PromotionLanding = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (code) {
      fetchPromotion();
    }
  }, [code]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/promotions/validate-code/${code}`);
      
      if (response.ok) {
        const data = await response.json();
        setPromotion(data.promotion);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Promotion not found');
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
      setError('Failed to load promotion');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Promotion code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const applyPromotion = async () => {
    setIsApplying(true);
    try {
      // Simulate applying the promotion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would call your checkout/application API
      toast.success('Promotion applied successfully!');
      
      // Redirect to checkout or main site
      setTimeout(() => {
        window.location.href = '/checkout'; // Replace with your actual checkout URL
      }, 1500);
    } catch (error) {
      toast.error('Failed to apply promotion');
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'percentage':
        return 'Percentage Discount';
      case 'fixed':
        return 'Fixed Amount Discount';
      case 'trial_extension':
        return 'Trial Extension';
      default:
        return type;
    }
  };

  const getValueDisplay = (type, value) => {
    switch (type) {
      case 'percentage':
        return `${value}% OFF`;
      case 'fixed':
        return `$${value} OFF`;
      case 'trial_extension':
        return `${value} Days Extended`;
      default:
        return value;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promotion...</p>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Promotion Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This promotion code is invalid or has expired.'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Special Offer</h1>
                <p className="text-sm text-gray-600">Limited time promotion</p>
              </div>
            </div>
            <Badge className={getStatusColor(promotion.status)}>
              {promotion.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Promotion Details */}
          <div className="space-y-6">
            {/* Promotion Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-yellow-700">EXCLUSIVE OFFER</span>
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {getValueDisplay(promotion.type, promotion.value)}
                </CardTitle>
                <p className="text-lg text-gray-600">{promotion.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">{promotion.description}</p>
                  
                  {/* Promotion Code */}
                  <div className="bg-white border-2 border-dashed border-green-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Your Promotion Code:</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-bold text-green-600">
                        {promotion.code}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCode}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <Button
                    onClick={applyPromotion}
                    disabled={isApplying || promotion.status !== 'active'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                  >
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Applying...
                      </>
                    ) : (
                      <>
                        Apply Promotion
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How to Use */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Copy the promotion code</p>
                    <p className="text-sm text-gray-600">Click the copy button above to copy the code to your clipboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Go to checkout</p>
                    <p className="text-sm text-gray-600">Navigate to your shopping cart or checkout page</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enter the code</p>
                    <p className="text-sm text-gray-600">Paste the promotion code in the discount field</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Enjoy your discount!</p>
                    <p className="text-sm text-gray-600">Your discount will be applied to your order</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Terms */}
          <div className="space-y-6">
            {/* Promotion Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Promotion Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Type</span>
                    <span className="text-sm">{getTypeLabel(promotion.type)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Value</span>
                    <span className="text-sm font-semibold text-green-600">
                      {getValueDisplay(promotion.type, promotion.value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Usage</span>
                    <span className="text-sm">
                      {promotion.usage_count || 0} / {promotion.usage_limit || '∞'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Expires</span>
                    <span className="text-sm">{formatDate(promotion.end_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>• This promotion is valid until {formatDate(promotion.end_date)}</p>
                <p>• Cannot be combined with other promotions</p>
                <p>• One use per customer</p>
                <p>• Valid on eligible items only</p>
                <p>• {promotion.usage_limit ? `Limited to ${promotion.usage_limit} uses` : 'Unlimited uses available'}</p>
                <p>• Subject to availability and may be modified or cancelled at any time</p>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardContent className="text-center p-6">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you have any questions about this promotion, our support team is here to help.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Contact Support
                  </Button>
                  <Button variant="outline" className="flex-1">
                    FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionLanding;
