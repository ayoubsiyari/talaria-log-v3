import React from 'react';
import { 
  Trash2, 
  AlertTriangle,
  X,
  CheckCircle
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

const DeleteCampaignModal = ({ isOpen, onClose, onConfirm, campaign, isDeleting }) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Campaign
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the campaign and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Deleting this campaign will remove all usage data, analytics, and the promotion code. This action is irreversible.
            </p>
          </div>

          {/* Campaign Details */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{campaign.name}</h3>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code:</span>
                <span className="font-mono font-bold">{campaign.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{getTypeLabel(campaign.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-semibold text-primary">
                  {getValueDisplay(campaign.type, campaign.value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usage:</span>
                <span>{campaign.usage_count || 0} / {campaign.usage_limit || '∞'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(campaign.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What will be deleted:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <X className="h-3 w-3 text-red-500" />
                <span>Campaign configuration and settings</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-3 w-3 text-red-500" />
                <span>Usage statistics and analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-3 w-3 text-red-500" />
                <span>Revenue tracking data</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-3 w-3 text-red-500" />
                <span>Promotion code availability</span>
              </div>
            </div>
          </div>

          {/* Confirmation Check */}
          <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">
                  Are you absolutely sure?
                </p>
                <p className="text-orange-700">
                  This campaign has been used {campaign.usage_count || 0} times and generated ${campaign.revenue || 0} in revenue. 
                  Deleting it will permanently remove all this data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCampaignModal;
