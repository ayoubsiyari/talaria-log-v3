import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Tag, 
  DollarSign, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const CreateCampaignModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  const campaignTypes = [
    { value: 'percentage', label: 'Percentage Discount', icon: '%', description: 'Discount as a percentage' },
    { value: 'fixed', label: 'Fixed Amount Discount', icon: '$', description: 'Fixed dollar amount discount' },
    { value: 'trial_extension', label: 'Trial Extension', icon: '⏰', description: 'Extend free trial period' }
  ];

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    }

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Promotion code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Code must be at least 3 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters and numbers';
    }

    // Value validation
    if (!formData.value) {
      newErrors.value = 'Value is required';
    } else {
      const numValue = parseFloat(formData.value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = 'Value must be a positive number';
      } else if (formData.type === 'percentage' && numValue > 100) {
        newErrors.value = 'Percentage cannot exceed 100%';
      }
    }

    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Usage limit validation
    if (formData.usageLimit && (isNaN(formData.usageLimit) || parseInt(formData.usageLimit) <= 0)) {
      newErrors.usageLimit = 'Usage limit must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        code: formData.code.trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        status: formData.status
      };

      const response = await fetch(`${API_BASE_URL}/admin/promotions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newCampaign = await response.json();
        toast.success('Campaign created successfully!');
        onSuccess(newCampaign);
        handleClose();
      } else {
        const errorData = await response.json();
        console.error('Campaign creation failed:', errorData);
        toast.error(errorData.error || `Failed to create campaign (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      console.error('Payload sent:', payload);
      toast.error(`Failed to create campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'percentage',
      value: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      status: 'active'
    });
    setErrors({});
    onClose();
  };

  const getValuePlaceholder = () => {
    switch (formData.type) {
      case 'percentage':
        return '25 (for 25% discount)';
      case 'fixed':
        return '50 (for $50 discount)';
      case 'trial_extension':
        return '30 (for 30 days extension)';
      default:
        return 'Enter value';
    }
  };

  const getValueLabel = () => {
    switch (formData.type) {
      case 'percentage':
        return 'Discount Percentage (%)';
      case 'fixed':
        return 'Discount Amount ($)';
      case 'trial_extension':
        return 'Extension Days';
      default:
        return 'Value';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Create a new promotional campaign with discount codes, usage limits, and scheduling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Summer Sale 2024"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Promotion Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER2024"
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateCode}
                    className="whitespace-nowrap"
                  >
                    Generate
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.code}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your promotional campaign..."
                rows={3}
              />
            </div>
          </div>

          {/* Campaign Type & Value */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Campaign Type & Value
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, value: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">{getValueLabel()} *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={getValuePlaceholder()}
                  className={errors.value ? 'border-red-500' : ''}
                  step={formData.type === 'percentage' ? '0.1' : '1'}
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                />
                {errors.value && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.value}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduling
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Usage & Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage & Limits
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="1000 (leave empty for unlimited)"
                  className={errors.usageLimit ? 'border-red-500' : ''}
                  min="1"
                />
                {errors.usageLimit && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.usageLimit}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited usage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                        <span>Start immediately</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Scheduled</Badge>
                        <span>Start on start date</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="paused">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Paused</Badge>
                        <span>Create but don't start</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Campaign Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Campaign Preview
            </h3>
            
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {formData.name || 'Not set'}
                </div>
                <div>
                  <strong>Code:</strong> {formData.code || 'Not set'}
                </div>
                <div>
                  <strong>Type:</strong> {campaignTypes.find(t => t.value === formData.type)?.label || 'Not set'}
                </div>
                <div>
                  <strong>Value:</strong> {formData.value ? `${formData.value}${formData.type === 'percentage' ? '%' : formData.type === 'fixed' ? '$' : ' days'}` : 'Not set'}
                </div>
                <div>
                  <strong>Start Date:</strong> {formData.startDate || 'Not set'}
                </div>
                <div>
                  <strong>End Date:</strong> {formData.endDate || 'No end date'}
                </div>
                <div>
                  <strong>Usage Limit:</strong> {formData.usageLimit || 'Unlimited'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge 
                    variant={formData.status === 'active' ? 'default' : formData.status === 'scheduled' ? 'secondary' : 'outline'}
                    className="ml-2"
                  >
                    {formData.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Tag className="h-4 w-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;
