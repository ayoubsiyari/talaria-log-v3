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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Star,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import { getAuthToken } from '@/utils/tokenUtils';

const EnhancedSubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('plans');

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
  const [newComponent, setNewComponent] = useState('');

  // Available sidebar components
  const availableComponents = [
    { id: 'dashboard', label: 'Dashboard', description: 'Main dashboard', required: true },
    { id: 'analytics', label: 'Analytics', description: 'Trading analytics and reports' },
    { id: 'chart', label: 'Chart Trading', description: 'Advanced charting tools' },
    { id: 'journal', label: 'Trading Journal', description: 'Track your trades' },
    { id: 'portfolio', label: 'Portfolio', description: 'Portfolio management' },
    { id: 'subscription', label: 'Subscription', description: 'Manage your plan', required: true },
    { id: 'profile', label: 'Profile', description: 'User profile settings', required: true },
    { id: 'help-support', label: 'Help & Support', description: 'Get help and support', required: true },
    { id: 'advanced-analytics', label: 'Advanced Analytics', description: 'Advanced trading analytics' },
    { id: 'api-access', label: 'API Access', description: 'API access for developers' },
    { id: 'priority-support', label: 'Priority Support', description: 'Priority customer support' }
  ];

  // Load subscription plans
  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in first.');
      }

      console.log('🔄 Loading subscription plans...');
      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded plans:', data.plans?.length || 0);
        setPlans(data.plans || []);
      } else {
        const errorData = await response.json();
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
        billing_cycle: formData.billing_cycle,
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

      console.log(`🔄 ${editingPlan ? 'Updating' : 'Creating'} plan:`, planData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Plan saved:', data);
        
        if (editingPlan) {
          setPlans(plans.map(plan => plan.id === editingPlan.id ? data : plan));
          toast.success('Plan updated successfully!');
        } else {
          setPlans([...plans, data]);
          toast.success('Plan created successfully!');
        }
        
        resetForm();
        setShowCreateDialog(false);
      } else {
        const errorData = await response.json();
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
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔄 Deleting plan:', planId);

      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPlans(plans.filter(plan => plan.id !== planId));
        toast.success('Plan deleted successfully!');
      } else {
        const errorData = await response.json();
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
    setEditingPlan(null);
    setNewFeature('');
    setNewComponent('');
  };

  // Edit plan
  const editPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      features: plan.features || [],
      sidebar_components: plan.sidebar_components || [],
      max_users: plan.max_users ? plan.max_users.toString() : '',
      max_projects: plan.max_projects ? plan.max_projects.toString() : '',
      storage_limit: plan.storage_limit ? plan.storage_limit.toString() : '',
      trial_days: plan.trial_days ? plan.trial_days.toString() : '',
      trial_price: plan.trial_price ? plan.trial_price.toString() : '',
      is_popular: plan.is_popular || false,
      is_active: plan.is_active !== false,
      sort_order: plan.sort_order ? plan.sort_order.toString() : ''
    });
    setShowCreateDialog(true);
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  // Toggle sidebar component
  const toggleSidebarComponent = (componentId) => {
    const isSelected = formData.sidebar_components.includes(componentId);
    setFormData({
      ...formData,
      sidebar_components: isSelected
        ? formData.sidebar_components.filter(id => id !== componentId)
        : [...formData.sidebar_components, componentId]
    });
  };

  // Load plans on component mount
  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plans and their sidebar components
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="components">Sidebar Components</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {plan.is_popular && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">
                        /{plan.billing_cycle.toLowerCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2" />
                        {plan.max_users ? `${plan.max_users} users` : 'Unlimited users'}
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {plan.trial_days > 0 ? `${plan.trial_days} days trial` : 'No trial'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Settings className="h-4 w-4 mr-2" />
                        {plan.sidebar_components?.length || 0} sidebar components
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editPlan(plan)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePlan(plan.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Sidebar Components</CardTitle>
              <CardDescription>
                These components can be assigned to subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableComponents.map((component) => (
                  <div key={component.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{component.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {component.description}
                      </div>
                      {component.required && (
                        <Badge variant="outline" className="mt-1">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update the subscription plan details' : 'Create a new subscription plan with sidebar components'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic, Professional, Enterprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="29.99"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this plan includes..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
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
              <div className="space-y-2">
                <Label htmlFor="trial_days">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                  placeholder="14"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial_price">Trial Price</Label>
                <Input
                  id="trial_price"
                  type="number"
                  step="0.01"
                  value={formData.trial_price}
                  onChange={(e) => setFormData({ ...formData, trial_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_projects">Max Projects</Label>
                <Input
                  id="max_projects"
                  type="number"
                  value={formData.max_projects}
                  onChange={(e) => setFormData({ ...formData, max_projects: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_limit">Storage Limit (MB)</Label>
                <Input
                  id="storage_limit"
                  type="number"
                  value={formData.storage_limit}
                  onChange={(e) => setFormData({ ...formData, storage_limit: e.target.value })}
                  placeholder="1024"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1">{feature}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} disabled={!newFeature.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar Components */}
            <div className="space-y-4">
              <Label>Sidebar Components</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {availableComponents.map((component) => (
                  <div key={component.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={component.id}
                      checked={formData.sidebar_components.includes(component.id)}
                      onCheckedChange={() => toggleSidebarComponent(component.id)}
                    />
                    <Label htmlFor={component.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{component.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {component.description}
                      </div>
                      {component.required && (
                        <Badge variant="outline" className="mt-1">
                          Required
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label htmlFor="is_popular">Popular</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePlan} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedSubscriptionManagement;