import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  User,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  Eye,
  Plus,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const PaymentDisputes = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Search form state
  const [searchForm, setSearchForm] = useState({
    email: ''
  });
  
  // Resolution form state
  const [resolutionForm, setResolutionForm] = useState({
    customer_email: '',
    customer_name: '',
    amount: '',
    payment_intent_id: '',
    resolution_type: 'create_order',
    order_id: '',
    admin_notes: ''
  });

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(searchForm).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/payments/search-payments?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        toast.success(`Found ${data.results.length} payment records`);
      } else {
        toast.error('Failed to search payments');
      }
    } catch (error) {
      console.error('Error searching payments:', error);
      toast.error('Error searching payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentIntentId, customerEmail, amount) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          customer_email: customerEmail,
          amount: amount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationResult(data.verification);
        toast.success('Payment verification completed');
      } else {
        toast.error('Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Error verifying payment');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/payments/resolve-payment-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resolutionForm)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowResolutionDialog(false);
        setResolutionForm({
          customer_email: '',
          customer_name: '',
          amount: '',
          payment_intent_id: '',
          resolution_type: 'create_order',
          order_id: '',
          admin_notes: ''
        });
        handleSearch(); // Refresh search results
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Error resolving dispute');
    } finally {
      setLoading(false);
    }
  };

  const openResolutionDialog = (order = null) => {
    if (order) {
      setResolutionForm({
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        amount: order.amount,
        payment_intent_id: order.payment_intent_id || '',
        resolution_type: order.status === 'pending' ? 'update_order' : 'create_order',
        order_id: order.id,
        admin_notes: ''
      });
    }
    setSelectedOrder(order);
    setShowResolutionDialog(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      'cancelled': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fix Payment Problems</h1>
          <p className="text-muted-foreground">Search by email and help customers who paid but can't access their account</p>
        </div>
        <Button onClick={() => openResolutionDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Manual Resolution
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search by Customer Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                placeholder="customer@example.com"
                value={searchForm.email}
                onChange={(e) => setSearchForm({...searchForm, email: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Payment Verification Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Status: {verificationResult.verified ? 'Verified' : 'Not Verified'}</p>
                <p className="text-sm">Payment Intent: {verificationResult.payment_intent_id}</p>
                <p className="text-sm">Amount: {formatCurrency(verificationResult.amount)}</p>
              </div>
              <div>
                <p className="text-sm">Customer: {verificationResult.customer_email}</p>
                <p className="text-sm">Stripe Charge: {verificationResult.stripe_charge_id}</p>
                <p className="text-sm">Verified At: {formatDate(verificationResult.verified_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length} found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Payment Intent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">ID: {order.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(order.amount)}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {order.payment_intent_id || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyPayment(order.payment_intent_id, order.customer_email, order.amount)}
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResolutionDialog(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Payment Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_email">Customer Email *</Label>
                <Input
                  id="customer_email"
                  value={resolutionForm.customer_email}
                  onChange={(e) => setResolutionForm({...resolutionForm, customer_email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={resolutionForm.customer_name}
                  onChange={(e) => setResolutionForm({...resolutionForm, customer_name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={resolutionForm.amount}
                  onChange={(e) => setResolutionForm({...resolutionForm, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_intent_id">Payment Intent ID</Label>
                <Input
                  id="payment_intent_id"
                  value={resolutionForm.payment_intent_id}
                  onChange={(e) => setResolutionForm({...resolutionForm, payment_intent_id: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resolution_type">Resolution Type</Label>
              <Select
                value={resolutionForm.resolution_type}
                onValueChange={(value) => setResolutionForm({...resolutionForm, resolution_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create_order">Create New Paid Order</SelectItem>
                  <SelectItem value="update_order">Update Existing Order to Paid</SelectItem>
                  <SelectItem value="refund">Process Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resolutionForm.resolution_type === 'update_order' && (
              <div>
                <Label htmlFor="order_id">Order ID</Label>
                <Input
                  id="order_id"
                  value={resolutionForm.order_id}
                  onChange={(e) => setResolutionForm({...resolutionForm, order_id: e.target.value})}
                />
              </div>
            )}

            <div>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                id="admin_notes"
                placeholder="Add notes about the dispute resolution..."
                value={resolutionForm.admin_notes}
                onChange={(e) => setResolutionForm({...resolutionForm, admin_notes: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResolutionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleResolveDispute} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Resolve Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentDisputes;
