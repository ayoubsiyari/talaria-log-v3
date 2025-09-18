import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  CreditCard,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Target,
  UserPlus,
  DollarSign,
  Activity,
  Star,
  Award,
  Zap,
  Loader2,
  AlertCircle,
  X,
  Save,
  Copy,
  Gift,
  QrCode,
  Link,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { listAffiliates, approveAffiliate, suspendAffiliate, deleteAffiliate, createAffiliate, getAffiliateReferrals } from '@/api/affiliates';


const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const performanceColors = {
  excellent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  poor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  new: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const Affiliates = ({ onNavigate }) => {
  const [selectedTab, setSelectedTab] = useState("partners");
  const [affiliates, setAffiliates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    name: '',
    email: '',
    category: 'Influencer',
    commissionRate: 20
  });
  const [selectedAffiliateForCodes, setSelectedAffiliateForCodes] = useState(null);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [affiliateCodes, setAffiliateCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [showGenerateCodeDialog, setShowGenerateCodeDialog] = useState(false);
  const [newCodeData, setNewCodeData] = useState({
    code: '',
    discount_percent: 10,
    description: ''
  });
  
  // Referrals modal state
  const [selectedAffiliateForReferrals, setSelectedAffiliateForReferrals] = useState(null);
  const [showReferralsDialog, setShowReferralsDialog] = useState(false);
  const [affiliateReferrals, setAffiliateReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsSummary, setReferralsSummary] = useState(null);
  const [referralsStatusFilter, setReferralsStatusFilter] = useState('all');
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('30d');

  // Fetch affiliates on component mount
  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Starting to load affiliates...');
      
      const token = localStorage.getItem('access_token');
      console.log('🔍 Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await listAffiliates();
      console.log('🔍 API Response:', response);
      
      if (response.success) {
        console.log('✅ Successfully loaded affiliates:', response.data?.length || 0, 'items');
        setAffiliates(response.data || []);
      } else {
        console.error('❌ API returned error:', response.error);
        throw new Error(response.error || 'Failed to load affiliates');
      }
    } catch (err) {
      console.error('❌ Error loading affiliates:', err);
      let errorMessage = err.message || 'Failed to load affiliates';
      
      // Check if it's an authentication error
      if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Missing Authorization')) {
        errorMessage = 'Authentication failed. Please log in again with admin credentials.';
      } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
        errorMessage = 'Access denied. You need admin or marketing team permissions to view affiliates.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAffiliateAction = async (affiliateId, action) => {
    if (actionLoading[affiliateId]) return; // Prevent multiple concurrent actions
    
    try {
      setActionLoading(prev => ({ ...prev, [affiliateId]: true }));
      
      // Optimistic update
      const previousAffiliates = affiliates;
      let updatedAffiliates;
      
      switch (action) {
        case 'approve':
          updatedAffiliates = affiliates.map(affiliate => 
            affiliate.id === affiliateId 
              ? { ...affiliate, status: 'active' }
              : affiliate
          );
          setAffiliates(updatedAffiliates);
          await approveAffiliate(affiliateId);
          break;
          
        case 'suspend':
          updatedAffiliates = affiliates.map(affiliate => 
            affiliate.id === affiliateId 
              ? { ...affiliate, status: 'suspended' }
              : affiliate
          );
          setAffiliates(updatedAffiliates);
          await suspendAffiliate(affiliateId);
          break;
          
        case 'delete':
          updatedAffiliates = affiliates.filter(affiliate => affiliate.id !== affiliateId);
          setAffiliates(updatedAffiliates);
          await deleteAffiliate(affiliateId);
          break;
          
        default:
          break;
      }
      
      // Re-load data to ensure sync with backend
      await loadAffiliates();
      
    } catch (err) {
      console.error(`Error ${action}ing affiliate:`, err);
      // Rollback on error by reloading data
      await loadAffiliates();
      setError(`Failed to ${action} affiliate: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [affiliateId]: false }));
    }
  };

  const handleCreateAffiliate = async () => {
    try {
      setCreateLoading(true);
      setError(null);
      
      const response = await createAffiliate(newAffiliate);
      
      if (response.success) {
        // Reset form
        setNewAffiliate({
          name: '',
          email: '',
          category: 'Influencer',
          commissionRate: 20
        });
        setShowCreateDialog(false);
        
        // Reload affiliates
        await loadAffiliates();
        
        console.log('✅ New affiliate created successfully');
      } else {
        throw new Error(response.error || 'Failed to create affiliate');
      }
    } catch (err) {
      console.error('❌ Error creating affiliate:', err);
      setError(`Failed to create affiliate: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const loadAffiliateCodes = async (affiliateId) => {
    try {
      setCodesLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/affiliates/${affiliateId}/codes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAffiliateCodes(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load referral codes');
      }
    } catch (err) {
      console.error('Error loading affiliate codes:', err);
      setError(`Failed to load referral codes: ${err.message}`);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleViewCodes = async (affiliate) => {
    setSelectedAffiliateForCodes(affiliate);
    setShowCodesDialog(true);
    await loadAffiliateCodes(affiliate.id);
  };

  const handleGenerateCode = async () => {
    try {
      setCreateLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const payload = {
        ...newCodeData,
        commission_percent: selectedAffiliateForCodes.commissionRate
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/affiliates/${selectedAffiliateForCodes.id}/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setNewCodeData({
          code: '',
          discount_percent: 10,
          description: ''
        });
        setShowGenerateCodeDialog(false);
        
        // Reload codes
        await loadAffiliateCodes(selectedAffiliateForCodes.id);
        
        console.log('✅ New referral code generated successfully');
      } else {
        throw new Error(data.error || 'Failed to generate referral code');
      }
    } catch (err) {
      console.error('❌ Error generating referral code:', err);
      setError(`Failed to generate referral code: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };
  
  const loadAffiliateReferrals = async (affiliateId, statusFilter = 'all') => {
    try {
      setReferralsLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await getAffiliateReferrals(affiliateId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        per_page: 50 // Get more results for the modal
      });
      
      if (response.success) {
        setAffiliateReferrals(response.data || []);
        setReferralsSummary(response.summary || {});
      } else {
        throw new Error(response.error || 'Failed to load referrals');
      }
    } catch (err) {
      console.error('Error loading affiliate referrals:', err);
      setError(`Failed to load referrals: ${err.message}`);
    } finally {
      setReferralsLoading(false);
    }
  };
  
  const handleViewReferrals = async (affiliate) => {
    setSelectedAffiliateForReferrals(affiliate);
    setShowReferralsDialog(true);
    setReferralsStatusFilter('all');
    await loadAffiliateReferrals(affiliate.id, 'all');
  };
  
  const handleReferralsStatusChange = async (newStatus) => {
    setReferralsStatusFilter(newStatus);
    if (selectedAffiliateForReferrals) {
      await loadAffiliateReferrals(selectedAffiliateForReferrals.id, newStatus);
    }
  };
  
  const loadAnalyticsData = async (range = '30d') => {
    try {
      setAnalyticsLoading(true);
      
      const response = await getAffiliateAnalytics(range);
      
      if (response && !response.error) {
        setAnalyticsData(response);
      } else {
        console.warn('No analytics data received or error occurred');
        // Set some default/mock data for demonstration
        setAnalyticsData({
          total_affiliates: affiliates.length,
          active_affiliates: affiliates.filter(a => a.status === 'active').length,
          total_commission: affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0),
          average_commission_rate: affiliates.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / Math.max(affiliates.length, 1),
          top_performers: affiliates
            .filter(a => a.status === 'active')
            .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
            .slice(0, 4)
            .map(a => ({
              name: a.name,
              commission: a.totalEarnings || 0,
              referrals: a.referrals || 0,
              conversion_rate: a.conversionRate || 0
            }))
        });
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(`Failed to load analytics: ${err.message}`);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const handleAnalyticsRangeChange = async (range) => {
    setAnalyticsRange(range);
    await loadAnalyticsData(range);
  };

  const filteredAffiliates = useMemo(() => {
    if (!affiliates.length) return [];
    
    return affiliates.filter(affiliate => {
      const matchesSearch = affiliate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           affiliate.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [affiliates, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!affiliates.length) {
      return {
        totalPartners: 0,
        activePartners: 0,
        pendingPartners: 0,
        totalEarnings: 0,
        totalReferrals: 0,
        totalConversions: 0
      };
    }
    
    return {
      totalPartners: affiliates.length,
      activePartners: affiliates.filter(a => a.status === 'active').length,
      pendingPartners: affiliates.filter(a => a.status === 'pending').length,
      totalEarnings: affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0),
      totalReferrals: affiliates.reduce((sum, a) => sum + (a.referrals || 0), 0),
      totalConversions: affiliates.reduce((sum, a) => sum + (a.conversions || 0), 0)
    };
  }, [affiliates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Partners</h1>
          <p className="text-muted-foreground">
            Manage affiliate partnerships, commissions, and performance tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAffiliates} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Affiliate Partner</DialogTitle>
                <DialogDescription>
                  Create a new affiliate partnership. All new partners start with 'pending' status.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Partner name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAffiliate.email}
                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="partner@example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <select
                    id="category"
                    value={newAffiliate.category}
                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, category: e.target.value }))}
                    className="col-span-3 px-3 py-2 border rounded-md"
                  >
                    <option value="Influencer">Influencer</option>
                    <option value="Blogger">Blogger</option>
                    <option value="YouTuber">YouTuber</option>
                    <option value="Website Owner">Website Owner</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Email Marketer">Email Marketer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="commission" className="text-right">
                    Commission %
                  </Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={newAffiliate.commissionRate}
                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleCreateAffiliate}
                  disabled={createLoading || !newAffiliate.name || !newAffiliate.email}
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Partner
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Partners</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalPartners}</p>
            <p className="text-xs text-muted-foreground">
              {stats.activePartners} active, {stats.pendingPartners} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">
              {stats.totalConversions} conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalReferrals > 0 ? ((stats.totalConversions / stats.totalReferrals) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={(value) => {
        setSelectedTab(value);
        if (value === 'analytics' && !analyticsData && affiliates.length > 0) {
          loadAnalyticsData(analyticsRange);
        }
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="partners">Affiliate Partners</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="commission">Commission Structure</TabsTrigger>
        </TabsList>

        {/* Affiliate Partners Tab */}
        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Affiliate Partners</CardTitle>
                  <CardDescription>
                    Manage affiliate partnerships, commissions, and performance tracking
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search partners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {error && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2 text-red-600">
                            <AlertCircle className="h-8 w-8" />
                            <p className="text-sm">{error}</p>
                            <div className="flex space-x-2">
                              {error.includes('Authentication failed') || error.includes('No authentication token') ? (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => window.location.href = '/login'}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Login
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={loadAffiliates}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                  </Button>
                                </>
                              ) : (
                                <Button variant="outline" size="sm" onClick={loadAffiliates}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!error && isLoading && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm">Loading affiliates...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!error && !isLoading && filteredAffiliates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                            <Users className="h-8 w-8" />
                            <p className="text-sm">No affiliates found</p>
                            {(searchTerm || statusFilter !== 'all') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('all');
                                }}
                              >
                                Clear filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!error && !isLoading && filteredAffiliates.map((affiliate) => (
                      <TableRow key={affiliate.id} className="group">
                        <TableCell>
                          <div>
                            <div className="font-medium">{affiliate.name}</div>
                            <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                            <div className="text-xs text-muted-foreground">{affiliate.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[affiliate.status]}>
                            {affiliate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={performanceColors[affiliate.performance]}>
                            {affiliate.performance}
                          </Badge>
                        </TableCell>
                        <TableCell>{affiliate.commissionRate}%</TableCell>
                        <TableCell>{affiliate.referrals}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{affiliate.conversions}</div>
                            <div className="text-xs text-muted-foreground">
                              {(affiliate.conversionRate || 0).toFixed(1)}% rate
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(affiliate.totalEarnings)}</TableCell>
                        <TableCell>{formatDate(affiliate.joinDate)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Partner
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewCodes(affiliate)}>
                                <Gift className="mr-2 h-4 w-4" />
                                View Referral Codes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewReferrals(affiliate)}>
                                <Users className="mr-2 h-4 w-4" />
                                View Referrals
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onNavigate('analytics')}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {affiliate.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => handleAffiliateAction(affiliate.id, 'approve')}
                                  className="text-green-600"
                                  disabled={actionLoading[affiliate.id]}
                                >
                                  {actionLoading[affiliate.id] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Approve Partner
                                </DropdownMenuItem>
                              )}
                              {affiliate.status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleAffiliateAction(affiliate.id, 'suspend')}
                                  className="text-yellow-600"
                                  disabled={actionLoading[affiliate.id]}
                                >
                                  {actionLoading[affiliate.id] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Suspend Partner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleAffiliateAction(affiliate.id, 'delete')}
                                className="text-red-600"
                                disabled={actionLoading[affiliate.id]}
                              >
                                {actionLoading[affiliate.id] ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Remove Partner
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Analytics Controls */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>Comprehensive affiliate performance metrics and insights</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={analyticsRange}
                      onChange={(e) => handleAnalyticsRangeChange(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                      disabled={analyticsLoading}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => loadAnalyticsData(analyticsRange)} disabled={analyticsLoading}>
                      {analyticsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {analyticsData && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analyticsData.total_affiliates || stats.totalPartners}</div>
                      <div className="text-sm text-muted-foreground">Total Affiliates</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analyticsData.active_affiliates || stats.activePartners}</div>
                      <div className="text-sm text-muted-foreground">Active Partners</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">${(analyticsData.total_commission || stats.totalEarnings).toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">Total Commission</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{(analyticsData.average_commission_rate || 25).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg Commission Rate</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
            
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading analytics...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Partners</CardTitle>
                <CardDescription>Partners with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analyticsData?.top_performers || affiliates
                    .filter(a => a.status === 'active')
                    .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))
                    .slice(0, 5)
                    .map(a => ({
                      name: a.name,
                      commission: a.totalEarnings || 0,
                      referrals: a.referrals || 0,
                      conversion_rate: a.conversionRate || 0,
                      category: a.category
                    }))
                  ).map((performer, index) => (
                      <div key={performer.name || index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.category || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(performer.conversion_rate || 0).toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">{performer.referrals || 0} referrals</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Total earnings by partner category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    affiliates.reduce((acc, affiliate) => {
                      const category = affiliate.category || 'Other';
                      acc[category] = (acc[category] || 0) + (affiliate.totalEarnings || 0);
                      return acc;
                    }, {})
                  )
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, earnings]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {affiliates.filter(a => (a.category || 'Other') === category).length} partners
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(earnings)}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Commission Structure Tab */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
              <CardDescription>Manage commission rates and tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tier 1 - New Partners</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Commission Rate:</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requirements:</span>
                      <span className="font-medium">0-10 referrals</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partners:</span>
                      <span className="font-medium">
                        {affiliates.filter(a => a.referrals < 10).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tier 2 - Growing Partners</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Commission Rate:</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requirements:</span>
                      <span className="font-medium">11-50 referrals</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partners:</span>
                      <span className="font-medium">
                        {affiliates.filter(a => a.referrals >= 11 && a.referrals <= 50).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tier 3 - Elite Partners</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Commission Rate:</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requirements:</span>
                      <span className="font-medium">50+ referrals</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partners:</span>
                      <span className="font-medium">
                        {affiliates.filter(a => a.referrals > 50).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Referral Codes Dialog */}
      <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Referral Codes for {selectedAffiliateForCodes?.name}</DialogTitle>
            <DialogDescription>
              Manage referral codes that customers can use to get discounts while earning commissions for this affiliate.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Generate New Code Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Commission Rate: {selectedAffiliateForCodes?.commissionRate}%
              </div>
              <Button onClick={() => setShowGenerateCodeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Code
              </Button>
            </div>
            
            {/* Codes List */}
            {codesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading referral codes...</span>
              </div>
            ) : affiliateCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No referral codes generated yet</p>
                <p className="text-sm">Generate a code to start tracking referrals</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {affiliateCodes.map((code) => (
                  <div key={code.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-mono text-lg font-bold bg-primary/10 px-3 py-1 rounded">
                          {code.code}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 mr-1" />
                          {code.discount_percent}% OFF
                        </Badge>
                        <Badge variant={code.is_active ? 'default' : 'secondary'}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Used: {code.used_count}{code.max_uses ? `/${code.max_uses}` : ''} times</span>
                      <span>Commission: {code.affiliate_commission_percent}%</span>
                      <span>Created: {new Date(code.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Share URL */}
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded">
                      <Link className="h-4 w-4" />
                      <span className="flex-1 font-mono text-sm truncate">
                        {window.location.origin}/signup?ref={code.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/signup?ref=${code.code}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Code Dialog */}
      <Dialog open={showGenerateCodeDialog} onOpenChange={setShowGenerateCodeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate New Referral Code</DialogTitle>
            <DialogDescription>
              Create a new referral code for {selectedAffiliateForCodes?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ref-code" className="text-right">
                Code
              </Label>
              <Input
                id="ref-code"
                value={newCodeData.code}
                onChange={(e) => setNewCodeData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="col-span-3"
                placeholder="Leave empty for auto-generate"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ref-discount" className="text-right">
                Discount %
              </Label>
              <Input
                id="ref-discount"
                type="number"
                min="0"
                max="100"
                value={newCodeData.discount_percent}
                onChange={(e) => setNewCodeData(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder="10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ref-description" className="text-right">
                Description
              </Label>
              <Input
                id="ref-description"
                value={newCodeData.description}
                onChange={(e) => setNewCodeData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Special discount code"
              />
            </div>
            <div className="text-sm text-muted-foreground pl-4">
              Commission: {selectedAffiliateForCodes?.commissionRate}% for {selectedAffiliateForCodes?.name}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowGenerateCodeDialog(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleGenerateCode}
              disabled={createLoading}
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Generate Code
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Referrals Modal */}
      <Dialog open={showReferralsDialog} onOpenChange={setShowReferralsDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referrals for {selectedAffiliateForReferrals?.name}</DialogTitle>
            <DialogDescription>
              View all users who signed up through this affiliate's referral codes and their conversion status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary Stats */}
            {referralsSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{referralsSummary.total_referrals || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{referralsSummary.total_registered || 0}</div>
                  <div className="text-sm text-muted-foreground">Registered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{referralsSummary.total_converted || 0}</div>
                  <div className="text-sm text-muted-foreground">Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${referralsSummary.total_commission?.toFixed(2) || '0.00'}</div>
                  <div className="text-sm text-muted-foreground">Commission Earned</div>
                </div>
              </div>
            )}
            
            {/* Status Filter */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Commission Rate: {selectedAffiliateForReferrals?.commissionRate}%
              </div>
              <select
                value={referralsStatusFilter}
                onChange={(e) => handleReferralsStatusChange(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
                disabled={referralsLoading}
              >
                <option value="all">All Status</option>
                <option value="referred">Referred Only</option>
                <option value="registered">Registered</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            
            {/* Referrals List */}
            {referralsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading referrals...</span>
              </div>
            ) : affiliateReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No referrals found</p>
                <p className="text-sm">
                  {referralsStatusFilter !== 'all' 
                    ? `No referrals with status: ${referralsStatusFilter}`
                    : 'This affiliate has no referrals yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {affiliateReferrals.map((referral) => (
                  <div key={referral.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">
                            {referral.user ? referral.user.full_name || referral.user.username : referral.user_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.user ? referral.user.email : referral.user_email || 'No email'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {referral.coupon_code}
                        </Badge>
                        <Badge 
                          variant={referral.status === 'converted' ? 'default' : 
                                  referral.status === 'registered' ? 'secondary' : 'outline'}
                        >
                          {referral.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Referred:</span><br/>
                        {referral.referred_at ? new Date(referral.referred_at).toLocaleDateString() : 'N/A'}
                      </div>
                      {referral.registered_at && (
                        <div>
                          <span className="font-medium">Registered:</span><br/>
                          {new Date(referral.registered_at).toLocaleDateString()}
                        </div>
                      )}
                      {referral.converted_at && (
                        <div>
                          <span className="font-medium">Converted:</span><br/>
                          {new Date(referral.converted_at).toLocaleDateString()}
                        </div>
                      )}
                      {referral.conversion_amount && (
                        <div>
                          <span className="font-medium">Amount:</span><br/>
                          ${referral.conversion_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {referral.commission_earned && (
                      <div className="text-sm">
                        <span className="font-medium text-green-600">
                          Commission Earned: ${referral.commission_earned.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferralsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affiliates;
