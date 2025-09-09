import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  Calendar,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import { getAuthToken } from '@/utils/tokenUtils';

const SubscriptionPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly',
    features: [],
    sidebar_components: [],
    max_users: '',
    max_projects: '',
    storage_limit: '',
    trial_days: '',
    trial_price: '',
    is_popular: false,
    is_active: true,
    sort_order: ''
  });

  const [newFeature, setNewFeature] = useState('');

  // Available sidebar components
  const availableComponents = [
    { id: 'dashboard', label: 'Dashboard', required: true },
    { id: 'analytics', label: 'Analytics' },
    { id: 'chart', label: 'Chart Trading' },
    { id: 'journal', label: 'Trading Journal' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'subscription', label: 'Subscription', required: true },
    { id: 'profile', label: 'Profile', required: true },
    { id: 'help-support', label: 'Help & Support', required: true }
  ];


  // Load subscription plans
  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No authentication token found');
        console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
        throw new Error('No authentication token found. Please log in first.');
      }

      console.log('🔑 Using token:', token.substring(0, 50) + '...');
      console.log('🔍 Token length:', token.length);

      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response:', data);
        setPlans(data.plans || []);
        console.log('✅ Loaded plans:', data.plans?.length || 0);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error loading plans:', err);
      setError(err.message);
      toast.error(`Failed to load plans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create or update plan
  const savePlan = async () => {
    try {
      setSaving(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate required fields
      if (!formData.name || !formData.price) {
        throw new Error('Name and price are required');
      }

      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_projects: formData.max_projects ? parseInt(formData.max_projects) : null,
        storage_limit: formData.storage_limit ? parseInt(formData.storage_limit) : null,
        trial_days: formData.trial_days ? parseInt(formData.trial_days) : 0,
        trial_price: formData.trial_price ? parseFloat(formData.trial_price) : 0.0,
        sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0
      };

      const url = editingPlan 
        ? `${API_BASE_URL}/subscription/plans/${editingPlan.id}`
        : `${API_BASE_URL}/subscription/plans`;
      const method = editingPlan ? 'PUT' : 'POST';

      console.log('💾 Saving plan:', { url, method, planData });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      console.log('📡 Save response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Plan saved:', data);
        
        toast.success(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
        
        // Reset form and reload plans
        resetForm();
        setShowCreateDialog(false);
        setEditingPlan(null);
        loadPlans();
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error saving plan:', err);
      toast.error(`Failed to save plan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete plan
  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Plan deleted successfully!');
        loadPlans();
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error deleting plan:', err);
      toast.error(`Failed to delete plan: ${err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billing_cycle: 'monthly',
      features: [],
      sidebar_components: [],
      max_users: '',
      max_projects: '',
      storage_limit: '',
      trial_days: '',
      trial_price: '',
      is_popular: false,
      is_active: true,
      sort_order: ''
    });
    setNewFeature('');
  };

  // Start editing
  const startEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      billing_cycle: plan.billing_cycle || 'monthly',
      features: plan.features || [],
      sidebar_components: plan.sidebar_components || [],
      max_users: plan.max_users?.toString() || '',
      max_projects: plan.max_projects?.toString() || '',
      storage_limit: plan.storage_limit?.toString() || '',
      trial_days: plan.trial_days?.toString() || '',
      trial_price: plan.trial_price?.toString() || '',
      is_popular: plan.is_popular || false,
      is_active: plan.is_active !== false,
      sort_order: plan.sort_order?.toString() || ''
    });
    setShowCreateDialog(true);
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Toggle sidebar component
  const toggleSidebarComponent = (componentId) => {
    setFormData(prev => ({
      ...prev,
      sidebar_components: prev.sidebar_components.includes(componentId)
        ? prev.sidebar_components.filter(id => id !== componentId)
        : [...prev.sidebar_components, componentId]
    }));
  };

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  // Show error if no token
  if (error && error.includes('No authentication token found')) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Subscription Plan Management</h1>
            <p className="text-muted-foreground">Create, edit, and manage subscription plans</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Authentication Required</strong></p>
              <p>You need to be logged in to manage subscription plans.</p>
              <div className="flex gap-2 mt-3">
                <Button onClick={() => window.location.href = '/login'} variant="outline">
                  Go to Login
                </Button>
                <Button onClick={loadPlans} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plan Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage subscription plans</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading subscription plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.is_popular && (
                      <Badge variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm text-muted-foreground">/{plan.billing_cycle}</span>
                    </span>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Features:</h4>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.sidebar_components && plan.sidebar_components.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Sidebar Components:</h4>
                      <div className="flex flex-wrap gap-1">
                        {plan.sidebar_components.map((component) => (
                          <Badge key={component} variant="outline" className="text-xs">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {plan.max_users && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {plan.max_users} users
                      </div>
                    )}
                    {plan.trial_days > 0 && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {plan.trial_days} days trial
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the subscription plan details' : 'Create a new subscription plan for your users'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Basic, Premium, Enterprise"
                />
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="29.99"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this plan includes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{feature}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Sidebar Components</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableComponents.map((component) => (
                  <div key={component.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={component.id}
                      checked={formData.sidebar_components.includes(component.id)}
                      onCheckedChange={() => toggleSidebarComponent(component.id)}
                      disabled={component.required}
                    />
                    <Label
                      htmlFor={component.id}
                      className={`text-sm ${component.required ? 'text-muted-foreground' : ''}`}
                    >
                      {component.label}
                      {component.required && ' (Required)'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_users: e.target.value }))}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="max_projects">Max Projects</Label>
                <Input
                  id="max_projects"
                  type="number"
                  value={formData.max_projects}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_projects: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="storage_limit">Storage Limit (MB)</Label>
                <Input
                  id="storage_limit"
                  type="number"
                  value={formData.storage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, storage_limit: e.target.value }))}
                  placeholder="1024"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trial_days">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_days: e.target.value }))}
                  placeholder="7"
                />
              </div>
              <div>
                <Label htmlFor="trial_price">Trial Price</Label>
                <Input
                  id="trial_price"
                  type="number"
                  step="0.01"
                  value={formData.trial_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                />
                <Label htmlFor="is_popular">Popular Plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingPlan(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={savePlan} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlanManagement;
