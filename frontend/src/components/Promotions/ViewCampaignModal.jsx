import React from 'react';
import { 
  Calendar, 
  Tag, 
  DollarSign, 
  Users, 
  Eye,
  Copy,
  ExternalLink,
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const ViewCampaignModal = ({ isOpen, onClose, campaign }) => {
  if (!campaign) return null;

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
        return `${value}%`;
      case 'fixed':
        return `$${value}`;
      case 'trial_extension':
        return `${value} days`;
      default:
        return value;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getUsagePercentage = () => {
    if (!campaign.usage_limit) return 0;
    return Math.round((campaign.usage_count || 0) / campaign.usage_limit * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Campaign Details: {campaign.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this promotional campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Header */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              </div>
            </div>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>

          {/* Campaign Code Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promotion Code
            </h4>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex-1">
                <div className="text-2xl font-mono font-bold text-primary">
                  {campaign.code}
                </div>
                <div className="text-sm text-muted-foreground">
                  Use this code at checkout
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(campaign.code)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/promo/${campaign.code}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </div>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Campaign Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">Type</span>
                  <span className="text-sm">{getTypeLabel(campaign.type)}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">Value</span>
                  <span className="text-sm font-semibold text-primary">
                    {getValueDisplay(campaign.type, campaign.value)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduling
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">Start Date</span>
                  <span className="text-sm">{formatDate(campaign.start_date)}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">End Date</span>
                  <span className="text-sm">{formatDate(campaign.end_date)}</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm">{formatDate(campaign.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Usage Count</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {campaign.usage_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Times used
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${campaign.revenue || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Generated revenue
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Usage Limit</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {campaign.usage_limit || '∞'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {campaign.usage_limit ? `${getUsagePercentage()}% used` : 'Unlimited'}
                </div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            {campaign.usage_limit && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage Progress</span>
                  <span>{campaign.usage_count || 0} / {campaign.usage_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {(campaign.revenue || campaign.conversions) && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.revenue && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">${campaign.revenue}</div>
                  </div>
                )}
                {campaign.conversions && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">Conversions</div>
                    <div className="text-2xl font-bold text-blue-600">{campaign.conversions}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => copyToClipboard(campaign.code)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCampaignModal;
