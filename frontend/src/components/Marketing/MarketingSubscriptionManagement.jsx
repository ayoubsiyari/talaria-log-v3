import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Star,
  Crown,
  Zap,
  Check,
  Eye,
  Download,
  Copy,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const MarketingSubscriptionManagement = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlans(), fetchMetrics()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        toast.error('Failed to fetch subscription plans');
      }
    } catch (error) {
      toast.error('Error fetching subscription plans');
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscriptions/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMetrics(data);
      }
    } catch (error) {
      setMetrics(getMockMetrics());
    }
  };

  const getMockMetrics = () => ({
    mrr: 124580,
    arr: 1494960,
    active_subscriptions: 8234,
    churn_rate: 2.4,
    conversion_rate: 64.1
  });

  const handleCreatePlan = async (planData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Plan created successfully');
        fetchPlans();
        setShowPlanModal(false);
      } else {
        toast.error(data.error || 'Failed to create plan');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleUpdatePlan = async (planId, planData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Plan updated successfully');
        fetchPlans();
        setShowPlanModal(false);
      } else {
        toast.error(data.error || 'Failed to update plan');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'enterprise':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'pro':
        return <Star className="w-4 h-4 text-purple-500" />;
      case 'basic':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Check className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage subscription plans for your users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowPlanModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Manage your subscription plans and their features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          <p className="text-2xl font-bold text-primary">
                            {plan.price === 0 ? 'Free' : `${formatCurrency(plan.price)}/${plan.billing_cycle}`}
                          </p>
                        </div>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {plan.is_popular && (
                          <Badge variant="outline" className="text-yellow-600">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedPlan(plan);
                            setShowPlanModal(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedPlan(plan);
                            setShowPreviewModal(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
                            toast.success('Plan data copied to clipboard');
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <strong>Features:</strong> {plan.features?.length || 0} items
                      </div>
                      <div>
                        <strong>Max Users:</strong> {plan.max_users || 'Unlimited'}
                      </div>
                      <div>
                        <strong>Trial:</strong> {plan.trial_days || 0} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Plan Preview</CardTitle>
              <CardDescription>
                Preview how your subscription plans will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-primary mb-4">
                      {plan.price === 0 ? 'Free' : `${formatCurrency(plan.price)}/${plan.billing_cycle}`}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features?.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full">
                      {plan.price === 0 ? 'Get Started' : 'Choose Plan'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Revenue and conversion metrics by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getPlanIcon(plan.name)}
                          <span className="text-sm font-medium">{plan.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency((plan.price || 0) * (plan.subscribers || 0))}
                        </span>
                      </div>
                      <Progress 
                        value={((plan.price || 0) * (plan.subscribers || 0) / (metrics.total_revenue || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Creation/Edit Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details
            </DialogDescription>
          </DialogHeader>
          <SimplePlanForm 
            plan={selectedPlan}
            onSubmit={selectedPlan ? 
              (data) => handleUpdatePlan(selectedPlan.id, data) : 
              handleCreatePlan
            }
            onCancel={() => {
              setShowPlanModal(false);
              setSelectedPlan(null);
            }}
            onPreview={() => setShowPreviewModal(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan Preview</DialogTitle>
            <DialogDescription>
              Preview how your plan will appear to users
            </DialogDescription>
          </DialogHeader>
          <SimplePlanPreview 
            plan={selectedPlan}
            onClose={() => setShowPreviewModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple Plan Form Component
const SimplePlanForm = ({ plan, onSubmit, onCancel, onPreview }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price: plan?.price || 0,
    billing_cycle: plan?.billing_cycle || 'monthly',
    features: plan?.features || [],
    max_users: plan?.max_users || 1,
    max_projects: plan?.max_projects || 10,
    storage_limit: plan?.storage_limit || 1024,
    trial_days: plan?.trial_days || 0,
    is_popular: plan?.is_popular || false,
    is_active: plan?.is_active !== false
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Basic, Pro, Enterprise"
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Plan description for users"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billing_cycle">Billing Cycle *</Label>
            <Select 
              value={formData.billing_cycle} 
              onValueChange={(value) => setFormData({...formData, billing_cycle: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="trial_days">Trial Days</Label>
            <Input
              id="trial_days"
              type="number"
              value={formData.trial_days}
              onChange={(e) => setFormData({...formData, trial_days: parseInt(e.target.value)})}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="max_users">Max Users</Label>
            <Input
              id="max_users"
              type="number"
              value={formData.max_users}
              onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value)})}
              placeholder="1"
            />
          </div>
          <div>
            <Label htmlFor="max_projects">Max Projects</Label>
            <Input
              id="max_projects"
              type="number"
              value={formData.max_projects}
              onChange={(e) => setFormData({...formData, max_projects: parseInt(e.target.value)})}
              placeholder="10"
            />
          </div>
          <div>
            <Label htmlFor="storage_limit">Storage (MB)</Label>
            <Input
              id="storage_limit"
              type="number"
              value={formData.storage_limit}
              onChange={(e) => setFormData({...formData, storage_limit: parseInt(e.target.value)})}
              placeholder="1024"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <Label>Features</Label>
        <div className="space-y-2">
          {formData.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={feature}
                onChange={(e) => {
                  const newFeatures = [...formData.features];
                  newFeatures[index] = e.target.value;
                  setFormData({...formData, features: newFeatures});
                }}
                placeholder="Feature description"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFeature(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add new feature"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <Label>Settings</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_popular"
              checked={formData.is_popular}
              onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
            />
            <Label htmlFor="is_popular">Mark as Popular</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button type="submit">
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};

// Simple Plan Preview Component
const SimplePlanPreview = ({ plan, onClose }) => {
  if (!plan) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Preview: {plan.name}</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy HTML
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          {plan.is_popular && (
            <Badge className="mb-4" variant="outline">
              Most Popular
            </Badge>
          )}
          <h2 className="text-3xl font-bold mb-2">{plan.name}</h2>
          <div className="text-4xl font-bold text-primary mb-4">
            {plan.price === 0 ? 'Free' : `${formatCurrency(plan.price)}/${plan.billing_cycle}`}
          </div>
          {plan.description && (
            <p className="text-muted-foreground mb-6">{plan.description}</p>
          )}
          
          {plan.features && plan.features.length > 0 && (
            <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <Button size="lg" className="w-full max-w-xs">
            {plan.price === 0 ? 'Get Started' : 'Choose Plan'}
          </Button>

          {plan.trial_days > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {plan.trial_days}-day free trial • No credit card required
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>
          Close Preview
        </Button>
      </div>
    </div>
  );
};

export default MarketingSubscriptionManagement;
