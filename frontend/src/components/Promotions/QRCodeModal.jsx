import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  Copy, 
  Share2,
  Smartphone,
  Monitor,
  Settings
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const QRCodeModal = ({ isOpen, onClose, campaign }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrSize, setQrSize] = useState('300');
  const [qrFormat, setQrFormat] = useState('png');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [isGenerating, setIsGenerating] = useState(false);

  const qrSizes = [
    { value: '200', label: 'Small (200x200)' },
    { value: '300', label: 'Medium (300x300)' },
    { value: '400', label: 'Large (400x400)' },
    { value: '500', label: 'Extra Large (500x500)' }
  ];

  const qrFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
    { value: 'pdf', label: 'PDF' }
  ];

  const presetColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' }
  ];

  const presetBgColors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Light Gray', value: '#F3F4F6' },
    { name: 'Light Blue', value: '#EFF6FF' },
    { name: 'Light Green', value: '#ECFDF5' },
    { name: 'Light Purple', value: '#F5F3FF' },
    { name: 'Light Yellow', value: '#FFFBEB' }
  ];

  useEffect(() => {
    if (campaign && isOpen) {
      generateQRCode();
    }
  }, [campaign, isOpen, qrSize, qrFormat, qrColor, qrBgColor]);

  const generateQRCode = async () => {
    if (!campaign) return;

    setIsGenerating(true);
    try {
      // Create the URL for the promotion
      const promotionUrl = `${window.location.origin}/promo/${campaign.code}`;
      
      // Use a QR code generation service (you can replace this with your preferred service)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(promotionUrl)}&format=${qrFormat}&color=${qrColor.replace('#', '')}&bgcolor=${qrBgColor.replace('#', '')}`;
      
      setQrCodeUrl(qrApiUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${campaign.code}.${qrFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyQRCodeUrl = () => {
    const promotionUrl = `${window.location.origin}/promo/${campaign.code}`;
    navigator.clipboard.writeText(promotionUrl);
    toast.success('Promotion URL copied to clipboard!');
  };

  const shareQRCode = async () => {
    const promotionUrl = `${window.location.origin}/promo/${campaign.code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Use code: ${campaign.code}`,
          text: `Get ${campaign.value}${campaign.type === 'percentage' ? '%' : campaign.type === 'fixed' ? '$' : ' days'} off with code ${campaign.code}`,
          url: promotionUrl
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
        copyQRCodeUrl();
      }
    } else {
      copyQRCodeUrl();
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code for {campaign.code}
          </DialogTitle>
          <DialogDescription>
            Generate and customize QR codes for your promotional campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              {isGenerating ? (
                <div className="flex items-center justify-center w-64 h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <img 
                  src={qrCodeUrl} 
                  alt={`QR Code for ${campaign.code}`}
                  className="w-64 h-64 object-contain"
                />
              )}
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">
                Scan to use code: <span className="font-mono font-bold text-primary">{campaign.code}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {campaign.value}{campaign.type === 'percentage' ? '%' : campaign.type === 'fixed' ? '$' : ' days'} {campaign.type === 'percentage' ? 'discount' : campaign.type === 'fixed' ? 'off' : 'trial extension'}
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Customization
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qrSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={qrFormat} onValueChange={setQrFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qrFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color Customization */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>QR Code Color</Label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setQrColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        qrColor === color.value ? 'border-primary scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <span className="text-xs text-muted-foreground">Custom</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex flex-wrap gap-2">
                  {presetBgColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setQrBgColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        qrBgColor === color.value ? 'border-primary scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <span className="text-xs text-muted-foreground">Custom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold mb-2">How to use this QR code:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Customers can scan with their phone camera</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>Print and display at your business location</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Share digitally on social media or email</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={copyQRCodeUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
          <Button variant="outline" onClick={shareQRCode}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={downloadQRCode} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
