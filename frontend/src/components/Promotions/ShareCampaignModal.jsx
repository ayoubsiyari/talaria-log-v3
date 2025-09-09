import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare, 
  Facebook, 
  Twitter, 
  Instagram,
  Link,
  Download,
  Smartphone,
  Monitor,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

const ShareCampaignModal = ({ isOpen, onClose, campaign }) => {
  const [shareMethod, setShareMethod] = useState('copy');
  const [customMessage, setCustomMessage] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const shareMethods = [
    { 
      value: 'copy', 
      label: 'Copy Link', 
      icon: Copy, 
      description: 'Copy the promotion link to clipboard' 
    },
    { 
      value: 'email', 
      label: 'Email', 
      icon: Mail, 
      description: 'Send via email' 
    },
    { 
      value: 'sms', 
      label: 'SMS/WhatsApp', 
      icon: MessageSquare, 
      description: 'Share via text message' 
    },
    { 
      value: 'social', 
      label: 'Social Media', 
      icon: Share2, 
      description: 'Share on social platforms' 
    },
    { 
      value: 'qr', 
      label: 'QR Code', 
      icon: Smartphone, 
      description: 'Generate QR code for sharing' 
    }
  ];

  const socialPlatforms = [
    { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F' }
  ];

  const getDefaultMessage = () => {
    if (!campaign) return '';
    
    const valueDisplay = campaign.value + (campaign.type === 'percentage' ? '%' : campaign.type === 'fixed' ? '$' : ' days');
    const typeText = campaign.type === 'percentage' ? 'discount' : campaign.type === 'fixed' ? 'off' : 'trial extension';
    
    return `🎉 Exclusive offer! Get ${valueDisplay} ${typeText} with code ${campaign.code}. Don't miss out!`;
  };

  const getPromotionUrl = () => {
    if (!campaign) return '';
    return `${window.location.origin}/promo/${campaign.code}`;
  };

  const copyToClipboard = async () => {
    try {
      const url = getPromotionUrl();
      const message = customMessage || getDefaultMessage();
      const fullText = `${message}\n\n${url}`;
      
      await navigator.clipboard.writeText(fullText);
      toast.success('Promotion link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareViaEmail = async () => {
    if (!emailAddress.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSharing(true);
    try {
      const url = getPromotionUrl();
      const message = customMessage || getDefaultMessage();
      const subject = `Exclusive Offer: ${campaign.name}`;
      const body = `${message}\n\n${url}\n\nBest regards,\nYour Team`;
      
      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      toast.success('Email client opened!');
    } catch (error) {
      console.error('Error sharing via email:', error);
      toast.error('Failed to open email client');
    } finally {
      setIsSharing(false);
    }
  };

  const shareViaSMS = async () => {
    try {
      const url = getPromotionUrl();
      const message = customMessage || getDefaultMessage();
      const fullText = `${message}\n\n${url}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Promotion: ${campaign.name}`,
          text: fullText,
          url: url
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(fullText);
        toast.success('Message copied! You can now paste it in your messaging app.');
      }
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      toast.error('Failed to share via SMS');
    }
  };

  const shareOnSocial = (platform) => {
    const url = getPromotionUrl();
    const message = customMessage || getDefaultMessage();
    const fullText = `${message}\n\n${url}`;
    
    let shareUrl = '';
    
    switch (platform.name.toLowerCase()) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy the text
        navigator.clipboard.writeText(fullText);
        toast.success('Content copied! You can now paste it in Instagram.');
        return;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      toast.success(`Opening ${platform.name}...`);
    }
  };

  const downloadQRCode = () => {
    const url = getPromotionUrl();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    
    // Create a temporary link to download the QR code
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${campaign.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR code downloaded!');
  };

  const handleShare = async () => {
    switch (shareMethod) {
      case 'copy':
        await copyToClipboard();
        break;
      case 'email':
        await shareViaEmail();
        break;
      case 'sms':
        await shareViaSMS();
        break;
      case 'qr':
        downloadQRCode();
        break;
      default:
        break;
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Campaign: {campaign.name}
          </DialogTitle>
          <DialogDescription>
            Share your promotional campaign across different platforms and channels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Preview */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              </div>
              <Badge variant="outline" className="font-mono">
                {campaign.code}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-primary">
                {campaign.value}{campaign.type === 'percentage' ? '%' : campaign.type === 'fixed' ? '$' : ' days'}
              </span>
              {' '}
              {campaign.type === 'percentage' ? 'discount' : campaign.type === 'fixed' ? 'off' : 'trial extension'}
            </div>
          </div>

                     {/* Share Method Selection */}
           <div className="space-y-3">
             <Label>Choose sharing method</Label>
             <div className="grid grid-cols-1 gap-2">
              {shareMethods.map((method) => {
                const Icon = method.icon;
                return (
                                     <button
                     key={method.value}
                     onClick={() => setShareMethod(method.value)}
                     className={`p-3 border rounded-lg text-left transition-all ${
                       shareMethod === method.value
                         ? 'border-primary bg-primary/5'
                         : 'border-gray-200 hover:border-gray-300'
                     }`}
                   >
                     <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg ${
                         shareMethod === method.value ? 'bg-primary/10' : 'bg-gray-100'
                       }`}>
                         <Icon className={`h-3.5 w-3.5 ${
                           shareMethod === method.value ? 'text-primary' : 'text-gray-600'
                         }`} />
                       </div>
                       <div>
                         <div className="font-medium text-sm">{method.label}</div>
                         <div className="text-xs text-muted-foreground">{method.description}</div>
                       </div>
                     </div>
                   </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom message (optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default message
            </p>
          </div>

          {/* Email-specific field */}
          {shareMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
          )}

                     {/* Social Media Platforms */}
           {shareMethod === 'social' && (
             <div className="space-y-3">
               <Label>Choose platform</Label>
               <div className="grid grid-cols-3 gap-2">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                                         <button
                       key={platform.name}
                       onClick={() => shareOnSocial(platform)}
                       className="flex flex-col items-center gap-1 p-2 border rounded-lg hover:border-gray-300 transition-all"
                     >
                       <div 
                         className="p-2 rounded-lg"
                         style={{ backgroundColor: `${platform.color}20` }}
                       >
                         <Icon 
                           className="h-4 w-4" 
                           style={{ color: platform.color }}
                         />
                       </div>
                       <span className="text-xs font-medium">{platform.name}</span>
                     </button>
                  );
                })}
              </div>
            </div>
          )}

                     {/* QR Code Preview */}
           {shareMethod === 'qr' && (
             <div className="space-y-3">
               <Label>QR Code Preview</Label>
               <div className="flex flex-col items-center p-3 border rounded-lg bg-muted/30">
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getPromotionUrl())}`}
                   alt={`QR Code for ${campaign.code}`}
                   className="w-24 h-24"
                 />
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                   Scan to use code: <span className="font-mono font-bold">{campaign.code}</span>
                 </p>
               </div>
             </div>
           )}

                     {/* Usage Instructions */}
           <div className="p-3 border rounded-lg bg-muted/30">
             <h4 className="font-semibold mb-2 text-sm">Sharing tips:</h4>
             <div className="space-y-1 text-xs text-muted-foreground">
               <div className="flex items-center gap-2">
                 <Users className="h-3 w-3" />
                 <span>Share with your email list for maximum reach</span>
               </div>
               <div className="flex items-center gap-2">
                 <Monitor className="h-3 w-3" />
                 <span>Post on social media during peak hours</span>
               </div>
               <div className="flex items-center gap-2">
                 <Smartphone className="h-3 w-3" />
                 <span>Use QR codes for in-person sharing</span>
               </div>
             </div>
           </div>
        </div>

                 <DialogFooter className="flex flex-col gap-2">
           <Button variant="outline" onClick={onClose} className="w-full">
             Cancel
           </Button>
           {shareMethod === 'social' ? (
             <div className="grid grid-cols-3 gap-2 w-full">
               {socialPlatforms.map((platform) => {
                 const Icon = platform.icon;
                 return (
                   <Button
                     key={platform.name}
                     onClick={() => shareOnSocial(platform)}
                     style={{ backgroundColor: platform.color }}
                     size="sm"
                   >
                     <Icon className="h-3 w-3 mr-1" />
                     {platform.name}
                   </Button>
                 );
               })}
             </div>
           ) : (
             <Button onClick={handleShare} disabled={isSharing} className="w-full">
               {isSharing ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                   Sharing...
                 </>
               ) : (
                 <>
                   <Share2 className="h-4 w-4 mr-2" />
                   {shareMethod === 'copy' ? 'Copy Link' : 
                    shareMethod === 'email' ? 'Send Email' :
                    shareMethod === 'sms' ? 'Share via SMS' :
                    shareMethod === 'qr' ? 'Download QR Code' : 'Share'}
                 </>
               )}
             </Button>
           )}
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCampaignModal;
