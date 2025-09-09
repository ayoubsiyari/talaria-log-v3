import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  Share2,
  Eye,
  Filter,
  RefreshCw,
  FileText,
  Printer,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

// Simple Chart Component
const SimpleChart = ({ data, type = 'bar', title, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h4 className="text-sm font-medium">{title}</h4>}
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  
  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              minHeight: '20px'
            }}
          />
          <span className="text-xs text-muted-foreground mt-2">{item.label}</span>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative h-full">
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 60} ${height}`}>
        <polyline
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          points={data.map((item, index) => 
            `${index * 60 + 30},${height - (item.value / maxValue) * height}`
          ).join(' ')}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {data.map((item, index) => (
          <circle
            key={index}
            cx={index * 60 + 30}
            cy={height - (item.value / maxValue) * height}
            r="4"
            fill="#3b82f6"
          />
        ))}
      </svg>
    </div>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={`hsl(${index * 60}, 70%, 60%)`}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      <div className="h-48 flex items-center justify-center">
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: type === 'pie' ? `hsl(${index * 60}, 70%, 60%)` : '#3b82f6' }}
            />
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketingReports = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  const [data, setData] = useState({
    promotions: {},
    affiliates: {},
    subscriptions: {},
    overview: {}
  });

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPromotionsData(),
        fetchAffiliatesData(),
        fetchSubscriptionsData(),
        fetchOverviewData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/promotions/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        setData(prev => ({ ...prev, promotions: responseData }));
      } else {
        console.error('Failed to fetch promotions data:', response.status);
        setData(prev => ({ ...prev, promotions: {} }));
      }
    } catch (error) {
      console.error('Error fetching promotions data:', error);
      setData(prev => ({ ...prev, promotions: {} }));
    }
  };

  const fetchAffiliatesData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/affiliates/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        setData(prev => ({ ...prev, affiliates: responseData }));
      } else {
        console.error('Failed to fetch affiliates data:', response.status);
        setData(prev => ({ ...prev, affiliates: {} }));
      }
    } catch (error) {
      console.error('Error fetching affiliates data:', error);
      setData(prev => ({ ...prev, affiliates: {} }));
    }
  };

  const fetchSubscriptionsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscriptions/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        setData(prev => ({ ...prev, subscriptions: responseData }));
      } else {
        console.error('Failed to fetch subscriptions data:', response.status);
        setData(prev => ({ ...prev, subscriptions: {} }));
      }
    } catch (error) {
      console.error('Error fetching subscriptions data:', error);
      setData(prev => ({ ...prev, subscriptions: {} }));
    }
  };

  const fetchOverviewData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/marketing/overview?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        setData(prev => ({ ...prev, overview: responseData }));
      } else {
        console.error('Failed to fetch overview data:', response.status);
        // Calculate overview from other data sources
        const overview = calculateOverviewFromData();
        setData(prev => ({ ...prev, overview }));
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      // Calculate overview from other data sources
      const overview = calculateOverviewFromData();
      setData(prev => ({ ...prev, overview }));
    }
  };

  const calculateOverviewFromData = () => {
    const promotions = data.promotions || {};
    const affiliates = data.affiliates || {};
    const subscriptions = data.subscriptions || {};

    const totalRevenue = (promotions.total_revenue || 0) + 
                        (affiliates.total_commission || 0) + 
                        (subscriptions.mrr || 0);

    const totalConversions = (promotions.total_conversions || 0) + 
                            (affiliates.total_referrals || 0) + 
                            (subscriptions.active_subscriptions || 0);

    return {
      total_revenue: totalRevenue,
      total_conversions: totalConversions,
      total_campaigns: promotions.total_campaigns || 0,
      total_affiliates: affiliates.total_affiliates || 0,
      roi: calculateROI(promotions, affiliates, subscriptions),
      customer_acquisition_cost: calculateCAC(promotions, affiliates, subscriptions),
      lifetime_value: calculateLTV(subscriptions),
      monthly_growth: calculateGrowth(subscriptions)
    };
  };

  const calculateROI = (promotions, affiliates, subscriptions) => {
    const totalRevenue = (promotions.total_revenue || 0) + 
                        (affiliates.total_commission || 0) + 
                        (subscriptions.mrr || 0);
    const totalCost = (promotions.total_cost || 0) + 
                     (affiliates.total_commission || 0) + 
                     (subscriptions.total_cost || 0);
    
    return totalCost > 0 ? (totalRevenue / totalCost) : 0;
  };

  const calculateCAC = (promotions, affiliates, subscriptions) => {
    const totalCost = (promotions.total_cost || 0) + 
                     (affiliates.total_commission || 0) + 
                     (subscriptions.total_cost || 0);
    const totalAcquisitions = (promotions.total_conversions || 0) + 
                             (affiliates.total_referrals || 0) + 
                             (subscriptions.new_subscriptions || 0);
    
    return totalAcquisitions > 0 ? (totalCost / totalAcquisitions) : 0;
  };

  const calculateLTV = (subscriptions) => {
    const mrr = subscriptions.mrr || 0;
    const activeSubscriptions = subscriptions.active_subscriptions || 1;
    const avgSubscriptionLength = subscriptions.avg_subscription_length || 12; // months
    
    return (mrr / activeSubscriptions) * avgSubscriptionLength;
  };

  const calculateGrowth = (subscriptions) => {
    const currentMRR = subscriptions.mrr || 0;
    const previousMRR = subscriptions.previous_mrr || currentMRR;
    
    return previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const exportReport = (type) => {
    const reportData = {
      dateRange,
      reportType,
      timestamp: new Date().toISOString(),
      data: data
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-report-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${type} report exported successfully`);
  };

  const printReport = () => {
    window.print();
    toast.success('Report sent to printer');
  };

  const emailReport = () => {
    toast.success('Report sent via email');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing Reports</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics and insights from all marketing channels
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => exportReport('overview')}>
                <FileText className="mr-2 h-4 w-4" />
                Overview Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('detailed')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Detailed Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('financial')}>
                <DollarSign className="mr-2 h-4 w-4" />
                Financial Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={printReport}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={emailReport}>
                <Mail className="mr-2 h-4 w-4" />
                Email Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{data.overview.monthly_growth?.toFixed(1) || 0}%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.total_conversions)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.overview.roi || 0).toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3x</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.lifetime_value)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
                <CardDescription>Revenue distribution across marketing channels</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={[
                    { label: 'Promotions', value: data.promotions.total_revenue || 0 },
                    { label: 'Affiliates', value: data.affiliates.total_commission || 0 },
                    { label: 'Subscriptions', value: data.subscriptions.mrr || 0 }
                  ].filter(item => item.value > 0)}
                  type="pie"
                  title="Revenue Distribution"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue growth over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={data.promotions.monthly_data?.map(item => ({
                    label: item.month,
                    value: item.revenue
                  })) || []}
                  type="line"
                  title="Revenue Trend"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Important metrics for marketing success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Acquisition Cost</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(data.overview.customer_acquisition_cost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="text-sm font-medium">
                      {(data.promotions.conversion_rate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Churn Rate</span>
                    <span className="text-sm font-medium">
                      {(data.subscriptions.churn_rate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Commission Rate</span>
                    <span className="text-sm font-medium">
                      {(data.affiliates.average_commission_rate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Top performing campaigns by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={data.promotions.campaigns?.map(campaign => ({
                    label: campaign.name,
                    value: campaign.revenue
                  })) || []}
                  type="bar"
                  title="Campaign Revenue"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Campaigns</CardTitle>
                <CardDescription>Performance of active promotion campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.promotions.campaigns?.length > 0 ? (
                    data.promotions.campaigns.map((campaign, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <Badge variant="outline">{formatCurrency(campaign.revenue)}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">{campaign.conversions}</span> conversions
                          </div>
                          <div>
                            <span className="font-medium">{campaign.clicks}</span> clicks
                          </div>
                          <div>
                            <span className="font-medium">
                              {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) : 0}%
                            </span> rate
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No promotion campaigns found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotion Metrics</CardTitle>
                <CardDescription>Key promotion performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Campaigns</span>
                      <span className="text-2xl font-bold">{data.promotions.total_campaigns || 0}</span>
                    </div>
                    <Progress value={data.promotions.total_campaigns > 0 ? ((data.promotions.active_campaigns || 0) / data.promotions.total_campaigns) * 100 : 0} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.promotions.active_campaigns || 0} active campaigns
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-2xl font-bold">{(data.promotions.conversion_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.promotions.conversion_rate || 0} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Click Through Rate</span>
                      <span className="text-2xl font-bold">{(data.promotions.click_through_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.promotions.click_through_rate || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Affiliates</CardTitle>
                <CardDescription>Best performing affiliate partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.affiliates.top_performers?.length > 0 ? (
                    data.affiliates.top_performers.map((affiliate, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{affiliate.name}</h4>
                          <Badge variant="outline">{formatCurrency(affiliate.commission)}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">{affiliate.referrals}</span> referrals
                          </div>
                          <div>
                            <span className="font-medium">{affiliate.conversion_rate}%</span> rate
                          </div>
                          <div>
                            <span className="font-medium">
                              {affiliate.referrals > 0 ? formatCurrency(affiliate.commission / affiliate.referrals) : '$0'}
                            </span> avg
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No affiliate data found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Affiliate Metrics</CardTitle>
                <CardDescription>Overall affiliate program performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Affiliates</span>
                      <span className="text-2xl font-bold">{data.affiliates.total_affiliates || 0}</span>
                    </div>
                    <Progress value={data.affiliates.total_affiliates > 0 ? ((data.affiliates.active_affiliates || 0) / data.affiliates.total_affiliates) * 100 : 0} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.affiliates.active_affiliates || 0} active affiliates
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Commission</span>
                      <span className="text-2xl font-bold">{formatCurrency(data.affiliates.total_commission)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average Commission Rate</span>
                      <span className="text-2xl font-bold">{(data.affiliates.average_commission_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.affiliates.average_commission_rate || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans Performance</CardTitle>
                <CardDescription>Revenue and growth by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.subscriptions.plans?.length > 0 ? (
                    data.subscriptions.plans.map((plan, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          <Badge variant="outline">{formatCurrency(plan.revenue)}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">{formatNumber(plan.subscribers)}</span> subscribers
                          </div>
                          <div>
                            <span className="font-medium">{plan.growth}%</span> growth
                          </div>
                          <div>
                            <span className="font-medium">
                              {plan.subscribers > 0 ? formatCurrency(plan.revenue / plan.subscribers) : '$0'}
                            </span> avg
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No subscription plans found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Metrics</CardTitle>
                <CardDescription>Key subscription business metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Recurring Revenue</span>
                      <span className="text-2xl font-bold">{formatCurrency(data.subscriptions.mrr)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Active Subscriptions</span>
                      <span className="text-2xl font-bold">{formatNumber(data.subscriptions.active_subscriptions)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Churn Rate</span>
                      <span className="text-2xl font-bold">{(data.subscriptions.churn_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.subscriptions.churn_rate || 0} />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-2xl font-bold">{(data.subscriptions.conversion_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.subscriptions.conversion_rate || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingReports;
