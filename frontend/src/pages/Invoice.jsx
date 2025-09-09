import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  ArrowLeft, 
  CheckCircle, 
  Calendar,
  CreditCard,
  User,
  Mail,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const Invoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchInvoice();
    }
  }, [orderId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/payments/invoice/${orderId}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch invoice');
      }
    } catch (err) {
      setError('Network error while fetching invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a simple text invoice for download
    if (!invoice) return;
    
    const invoiceText = `
INVOICE
Invoice Number: ${invoice.invoice_number}
Order Number: ${invoice.order.order_number}
Date: ${new Date(invoice.issued_date).toLocaleDateString()}

BILL TO:
${invoice.order.customer_name}
${invoice.order.customer_email}

ITEMS:
${invoice.order.items.map(item => 
  `${item.product_name} - Qty: ${item.quantity} - $${item.total_price.toFixed(2)}`
).join('\n')}

SUBTOTAL: $${invoice.order.subtotal.toFixed(2)}
${invoice.order.discount_amount > 0 ? `DISCOUNT: -$${invoice.order.discount_amount.toFixed(2)}` : ''}
TAX: $${invoice.order.tax_amount.toFixed(2)}
TOTAL: $${invoice.order.total_amount.toFixed(2)}

PAYMENT STATUS: ${invoice.order.payment_status.toUpperCase()}
PAYMENT METHOD: ${invoice.payment?.payment_provider || 'Stripe'}
TRANSACTION ID: ${invoice.payment?.transaction_id || 'N/A'}

Thank you for your business!
    `.trim();
    
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Invoice Data</h1>
            <p className="text-gray-600 mb-4">Unable to load invoice information.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice Details
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {invoice.invoice_number}
                    </p>
                  </div>
                  <Badge 
                    variant={invoice.order.payment_status === 'paid' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {invoice.order.payment_status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium">
                      {new Date(invoice.issued_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-medium font-mono">{invoice.order.order_number}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bill To</p>
                  <div className="mt-1">
                    <p className="font-medium">{invoice.order.customer_name}</p>
                    <p className="text-gray-600">{invoice.order.customer_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${invoice.order.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${invoice.order.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${invoice.order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${invoice.order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {invoice.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{invoice.payment.payment_provider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-medium font-mono text-sm">{invoice.payment.transaction_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="default" className="flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      {invoice.payment.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                  >
                    Go to Dashboard
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

export default Invoice;
