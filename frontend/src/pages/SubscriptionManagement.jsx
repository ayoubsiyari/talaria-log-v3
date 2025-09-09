import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, DollarSign, Users, Database, Zap } from 'lucide-react';
import { API_BASE_URL } from '@/config/config';

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly',
    features: [],
    max_users: '',
    max_projects: '',
    storage_limit: '',
    trial_days: '0',
    trial_price: '0',
    is_active: true,
    is_popular: false,
    sort_order: '0'
  });

  useEffect(() => {
    fetchPlans();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      console.log('=== CREATE PLAN DEBUG ===');
      console.log('Form data:', formData);
      
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        toast.error('Please enter a plan name');
        return;
      }
      
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        toast.error('Please enter a valid price');
        return;
      }
      
      if (!formData.billing_cycle) {
        toast.error('Please select a billing cycle');
        return;
      }

      const planData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        price: parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        features: [], // Default empty features array
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_projects: formData.max_projects ? parseInt(formData.max_projects) : null,
        storage_limit: formData.storage_limit ? parseInt(formData.storage_limit) : null,
        trial_days: parseInt(formData.trial_days) || 0,
        trial_price: parseFloat(formData.trial_price) || 0,
        sort_order: parseInt(formData.sort_order) || 0,
        is_active: formData.is_active,
        is_popular: formData.is_popular
      };

      console.log('Processed plan data:', planData);
      console.log('API URL:', `${API_BASE_URL}/subscription/plans`);

      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(planData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Plan created successfully:', result);
        toast.success('Subscription plan created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Failed to create plan';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Error creating subscription plan: ' + error.message);
    }
  };

  const handleEditPlan = async () => {
    try {
      console.log('=== EDIT PLAN DEBUG ===');
      console.log('Selected plan:', selectedPlan);
      console.log('Form data:', formData);
      
      const editData = {
        ...formData,
        price: parseFloat(formData.price),
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_projects: formData.max_projects ? parseInt(formData.max_projects) : null,
        storage_limit: formData.storage_limit ? parseInt(formData.storage_limit) : null,
        trial_days: parseInt(formData.trial_days),
        trial_price: parseFloat(formData.trial_price),
        sort_order: parseInt(formData.sort_order)
      };
      
      console.log('Edit data:', editData);
      console.log('API URL:', `${API_BASE_URL}/subscription/plans/${selectedPlan.id}`);

      const response = await fetch(`${API_BASE_URL}/subscription/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Plan updated successfully:', result);
        toast.success('Subscription plan updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPlan(null);
        resetForm();
        fetchPlans();
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Failed to update plan';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error updating subscription plan: ' + error.message);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Subscription plan deleted successfully');
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error('Error deleting subscription plan');
    }
  };

  const resetForm = () => {
    console.log('Resetting form...');
    setFormData({
      name: '',
      description: '',
      price: '',
      billing_cycle: 'monthly',
      features: [],
      max_users: '',
      max_projects: '',
      storage_limit: '',
      trial_days: '0',
      trial_price: '0',
      is_active: true,
      is_popular: false,
      sort_order: '0'
    });
    console.log('Form reset complete');
  };

  // Test function to verify the form is working
  const testFormData = () => {
    console.log('=== TEST FORM DATA ===');
    console.log('Current form data:', formData);
    console.log('Form validation:');
    console.log('- Name:', formData.name ? 'Valid' : 'Missing');
    console.log('- Price:', formData.price ? 'Valid' : 'Missing');
    console.log('- Billing Cycle:', formData.billing_cycle ? 'Valid' : 'Missing');
  };

  const openEditDialog = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      features: plan.features || [],
      max_users: plan.max_users?.toString() || '',
      max_projects: plan.max_projects?.toString() || '',
      storage_limit: plan.storage_limit?.toString() || '',
      trial_days: plan.trial_days?.toString() || '0',
      trial_price: plan.trial_price?.toString() || '0',
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      sort_order: plan.sort_order?.toString() || '0'
    });
    setIsEditDialogOpen(true);
  };

  const getBillingCycleLabel = (cycle) => {
    const labels = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };
    return labels[cycle] || cycle;
  };

  const getStorageLabel = (bytes) => {
    if (!bytes) return 'Unlimited';
    const gb = bytes / 1024;
    return `${gb} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basic, Professional"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
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
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this plan includes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
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
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="max_projects">Max Projects</Label>
                  <Input
                    id="max_projects"
                    type="number"
                    value={formData.max_projects}
                    onChange={(e) => setFormData({ ...formData, max_projects: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_days">Trial Days</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="trial_price">Trial Price ($)</Label>
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

              <div className="flex items-center space-x-4">
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
                  <Label htmlFor="is_popular">Popular Plan</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={testFormData}>
                  Test Form
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>
                  Create Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                      {plan.is_popular && (
                        <Badge variant="secondary" className="mt-1">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${plan.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {getBillingCycleLabel(plan.billing_cycle)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.max_users || 'Unlimited'} users
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {getStorageLabel(plan.storage_limit)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {plan.max_projects || 'Unlimited'} projects
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Plan Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-billing_cycle">Billing Cycle</Label>
                <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
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
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-max_users">Max Users</Label>
                <Input
                  id="edit-max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-max_projects">Max Projects</Label>
                <Input
                  id="edit-max_projects"
                  type="number"
                  value={formData.max_projects}
                  onChange={(e) => setFormData({ ...formData, max_projects: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-storage_limit">Storage Limit (MB)</Label>
                <Input
                  id="edit-storage_limit"
                  type="number"
                  value={formData.storage_limit}
                  onChange={(e) => setFormData({ ...formData, storage_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-trial_days">Trial Days</Label>
                <Input
                  id="edit-trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-trial_price">Trial Price ($)</Label>
                <Input
                  id="edit-trial_price"
                  type="number"
                  step="0.01"
                  value={formData.trial_price}
                  onChange={(e) => setFormData({ ...formData, trial_price: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="edit-is_popular">Popular Plan</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPlan}>
                Update Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
