import React, { useState } from 'react';
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
  Zap
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

// Mock affiliate data
const affiliatePartners = [
  {
    id: 1,
    name: "TradingGuru Blog",
    email: "contact@tradingguru.com",
    status: "active",
    joinDate: "2024-01-15",
    commissionRate: 25,
    totalEarnings: 2450.75,
    referrals: 89,
    conversions: 34,
    conversionRate: 38.2,
    website: "https://tradingguru.com",
    socialMedia: "@tradingguru",
    category: "Blog",
    performance: "excellent"
  },
  {
    id: 2,
    name: "FinanceInfluencer",
    email: "partnerships@financeinfluencer.com",
    status: "active",
    joinDate: "2024-02-20",
    commissionRate: 30,
    totalEarnings: 3890.20,
    referrals: 156,
    conversions: 67,
    conversionRate: 42.9,
    website: "https://financeinfluencer.com",
    socialMedia: "@financeinfluencer",
    category: "Influencer",
    performance: "excellent"
  },
  {
    id: 3,
    name: "InvestmentPodcast",
    email: "ads@investmentpodcast.com",
    status: "pending",
    joinDate: "2024-08-10",
    commissionRate: 20,
    totalEarnings: 0,
    referrals: 0,
    conversions: 0,
    conversionRate: 0,
    website: "https://investmentpodcast.com",
    socialMedia: "@investmentpodcast",
    category: "Podcast",
    performance: "new"
  },
  {
    id: 4,
    name: "CryptoTrader Pro",
    email: "affiliate@cryptotraderpro.com",
    status: "suspended",
    joinDate: "2024-03-05",
    commissionRate: 25,
    totalEarnings: 1234.50,
    referrals: 45,
    conversions: 12,
    conversionRate: 26.7,
    website: "https://cryptotraderpro.com",
    socialMedia: "@cryptotraderpro",
    category: "YouTube",
    performance: "poor"
  },
  {
    id: 5,
    name: "StockMarket Daily",
    email: "affiliate@stockmarketdaily.com",
    status: "active",
    joinDate: "2024-04-12",
    commissionRate: 22,
    totalEarnings: 1876.30,
    referrals: 78,
    conversions: 29,
    conversionRate: 37.2,
    website: "https://stockmarketdaily.com",
    socialMedia: "@stockmarketdaily",
    category: "News",
    performance: "good"
  },
  {
    id: 6,
    name: "TechInvestor",
    email: "partnerships@techinvestor.com",
    status: "active",
    joinDate: "2024-05-18",
    commissionRate: 28,
    totalEarnings: 3120.45,
    referrals: 134,
    conversions: 58,
    conversionRate: 43.3,
    website: "https://techinvestor.com",
    socialMedia: "@techinvestor",
    category: "Blog",
    performance: "excellent"
  }
];

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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Affiliates = ({ onNavigate }) => {
  const [selectedTab, setSelectedTab] = useState("partners");
  const [affiliates, setAffiliates] = useState(affiliatePartners);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleAffiliateAction = (affiliateId, action) => {
    setAffiliates(affiliates.map(affiliate => {
      if (affiliate.id === affiliateId) {
        switch (action) {
          case 'approve':
            return { ...affiliate, status: 'active' };
          case 'suspend':
            return { ...affiliate, status: 'suspended' };
          case 'delete':
            return null;
          default:
            return affiliate;
        }
      }
      return affiliate;
    }).filter(Boolean));
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPartners: affiliates.length,
    activePartners: affiliates.filter(a => a.status === 'active').length,
    pendingPartners: affiliates.filter(a => a.status === 'pending').length,
    totalEarnings: affiliates.reduce((sum, a) => sum + a.totalEarnings, 0),
    totalReferrals: affiliates.reduce((sum, a) => sum + a.referrals, 0),
    totalConversions: affiliates.reduce((sum, a) => sum + a.conversions, 0)
  };

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
        <Button onClick={() => onNavigate('users')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Partner
        </Button>
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
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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
                    {filteredAffiliates.map((affiliate) => (
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
                              {affiliate.conversionRate.toFixed(1)}% rate
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
                              <DropdownMenuItem onClick={() => onNavigate('users')}>
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
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve Partner
                                </DropdownMenuItem>
                              )}
                              {affiliate.status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleAffiliateAction(affiliate.id, 'suspend')}
                                  className="text-yellow-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Suspend Partner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleAffiliateAction(affiliate.id, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Partners</CardTitle>
                <CardDescription>Partners with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates
                    .filter(a => a.status === 'active')
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
                    .map((affiliate, index) => (
                      <div key={affiliate.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-sm text-muted-foreground">{affiliate.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{affiliate.conversionRate.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">{affiliate.conversions} conversions</p>
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
                      const category = affiliate.category;
                      acc[category] = (acc[category] || 0) + affiliate.totalEarnings;
                      return acc;
                    }, {})
                  )
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, earnings]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {affiliates.filter(a => a.category === category).length} partners
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(earnings)}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default Affiliates;
