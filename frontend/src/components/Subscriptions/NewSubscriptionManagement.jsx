import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Tag,
  Settings,
  Eye,
  Download,
  Target,
  Search,
  Filter,
  Star,
  Crown,
  Zap,
  Shield,
  Globe,
  Check,
  Clock,
  UserCheck,
  Activity,
  FileText,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
import { getAuthToken } from '@/utils/tokenUtils';
import PageVisibilityManager from './PageVisibilityManager';

const NewSubscriptionManagement = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPlans(),
        fetchSubscriptions(),
        fetchMetrics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        toast.error('Failed to fetch subscription plans');
      }
    } catch (error) {
      toast.error('Error fetching subscription plans');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/subscription/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/subscription/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Fallback to mock data
      setMetrics(getMockMetrics());
    }
  };

  const getMockMetrics = () => ({
    mrr: 124580,
    arr: 1494960,
    active_subscriptions: 8234,
    churn_rate: 2.4,
    avg_revenue_per_user: 15.12,
    lifetime_value: 287.50,
    total_revenue: 188083.66,
    conversion_rate: 64.1,
    retention_rate: 87.3,
    upgrade_rate: 23.7
  });

  const handleCreatePlan = async (planData) => {
    try {
      console.log('Creating plan with data:', planData);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making API call to:', `${API_BASE_URL}/subscription/plans`);

      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        toast.success('Plan created successfully');
        fetchPlans();
        setShowPlanModal(false);
        setSelectedPlan(null);
      } else {
        console.error('API Error:', data);
        toast.error(data.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Error creating plan: ' + error.message);
    }
  };

  const handleUpdatePlan = async (planId, planData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Plan updated successfully');
        fetchPlans();
        setShowPlanModal(false);
        setSelectedPlan(null);
      } else {
        toast.error(data.error || 'Failed to update plan');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete plan');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      cancelled: 'destructive',
      trial: 'secondary',
      expired: 'destructive',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'enterprise':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'premium':
      case 'pro':
        return <Star className="w-4 h-4 text-purple-500" />;
      case 'basic':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Check className="w-4 h-4 text-green-500" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription plans, monitor revenue, and track user subscriptions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            setSelectedPlan(null);
            setShowPlanModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.mrr || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+15.3%</span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.active_subscriptions || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+8.2%</span>
                  <span className="text-sm text-muted-foreground">this month</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{(metrics.churn_rate || 0).toFixed(1)}%</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">-0.8%</span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue Per User</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avg_revenue_per_user || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+4.2%</span>
                  <span className="text-sm text-muted-foreground">this month</span>
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="page-visibility">Page Visibility</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getPlanIcon(plan.name)}
                          <span className="text-sm font-medium">{plan.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency((plan.price || 0) * (plan.subscribers || 0))}
                        </span>
                      </div>
                      <Progress 
                        value={((plan.price || 0) * (plan.subscribers || 0) / (metrics.total_revenue || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-sm font-medium">{(metrics.conversion_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.conversion_rate || 0} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Retention Rate</span>
                      <span className="text-sm font-medium">{(metrics.retention_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.retention_rate || 0} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Upgrade Rate</span>
                      <span className="text-sm font-medium">{(metrics.upgrade_rate || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.upgrade_rate || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage your subscription tiers and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          <p className="text-2xl font-bold text-primary">
                            {plan.price === 0 ? 'Free' : `${formatCurrency(plan.price)}/month`}
                          </p>
                        </div>
                        <Badge variant="default">
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedPlan(plan);
                            setShowPlanModal(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('users')}>
                            <Users className="mr-2 h-4 w-4" />
                            View Subscribers
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features?.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Check className="w-3 h-3 text-green-600" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features?.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{plan.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Subscribers</h4>
                        <p className="text-2xl font-bold">{formatNumber(plan.subscribers || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.subscribers > 0 ? 
                            `${((plan.subscribers / (metrics.active_subscriptions || 1)) * 100).toFixed(1)}% of total` : 
                            'No subscribers'
                          }
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Monthly Revenue</h4>
                        <p className="text-2xl font-bold">
                          {formatCurrency((plan.price || 0) * (plan.subscribers || 0))}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.price > 0 ? 
                            `${(((plan.price * (plan.subscribers || 0)) / (metrics.total_revenue || 1)) * 100).toFixed(1)}% of total MRR` : 
                            'Free tier'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Visibility Status */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${plan.visible_to_regular_users ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-muted-foreground">Visible to Regular Users</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${plan.visible_to_admin_users ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-muted-foreground">Visible to Admin Users</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
              <CardDescription>Manage individual user subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email or plan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subscriptions Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{subscription.user_email}</div>
                              <div className="text-sm text-muted-foreground">
                                {subscription.user_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getPlanIcon(subscription.plan_name)}
                              <span>{subscription.plan_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(subscription.status)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(subscription.amount || 0)}
                          </TableCell>
                          <TableCell>
                            {subscription.next_billing_date ? 
                              new Date(subscription.next_billing_date).toLocaleDateString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSubscription(subscription);
                                  setShowSubscriptionModal(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Subscription
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Visibility Tab */}
        <TabsContent value="page-visibility">
          <PageVisibilityManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm font-medium text-green-600">
                      +15.3% <ArrowUpRight className="w-4 h-4 inline" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Month</span>
                    <span className="text-sm font-medium text-red-600">
                      -2.1% <ArrowDownRight className="w-4 h-4 inline" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">3 Months Ago</span>
                    <span className="text-sm font-medium text-green-600">
                      +8.7% <ArrowUpRight className="w-4 h-4 inline" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Growth</CardTitle>
                <CardDescription>New subscriptions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New This Month</span>
                    <span className="text-sm font-medium">+234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Upgrades</span>
                    <span className="text-sm font-medium">+89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cancellations</span>
                    <span className="text-sm font-medium text-red-600">-45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details and features
            </DialogDescription>
          </DialogHeader>
          <PlanForm 
            plan={selectedPlan}
            onSubmit={selectedPlan ? 
              (data) => handleUpdatePlan(selectedPlan.id, data) : 
              handleCreatePlan
            }
            onCancel={() => {
              setShowPlanModal(false);
              setSelectedPlan(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>
                View and manage subscription information
              </DialogDescription>
            </DialogHeader>
            <SubscriptionDetails 
              subscription={selectedSubscription}
              onClose={() => {
                setShowSubscriptionModal(false);
                setSelectedSubscription(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Plan Form Component
const PlanForm = ({ plan, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price: plan?.price || 0,
    billing_cycle: plan?.billing_cycle || 'monthly',
    features: plan?.features || [],
    sidebar_components: plan?.sidebar_components || [],
    max_users: plan?.max_users || 1,
    max_projects: plan?.max_projects || 10,
    storage_limit: plan?.storage_limit || 1024,
    trial_days: plan?.trial_days || 0,
    trial_price: plan?.trial_price || 0,
    sort_order: plan?.sort_order || 0,
    is_popular: plan?.is_popular || false,
    is_active: plan?.is_active !== false,
    // Backend requires these fields but we don't show them in UI
    visible_to_regular_users: true,
    visible_to_admin_users: true
  });

  const [newFeature, setNewFeature] = useState('');

  const getAvailableComponents = () => [
    { id: 'dashboard', label: 'Dashboard', description: 'Main dashboard view', required: true },
    { id: 'chart', label: 'Chart Trading', description: 'Trading charts and analysis', required: false },
    { id: 'portfolio', label: 'Portfolio', description: 'Portfolio management', required: false },
    { id: 'profile', label: 'Profile', description: 'User profile settings', required: true },
    { id: 'analytics', label: 'Analytics', description: 'Trading analytics and reports', required: false },
    { id: 'journal', label: 'Trading Journal', description: 'Track your trades', required: false },
    { id: 'subscription', label: 'Subscription', description: 'Manage your subscription', required: true },
    { id: 'help-support', label: 'Help & Support', description: 'Get help and support', required: true }
  ];

  const handleComponentToggle = (componentId, isChecked) => {
    setFormData(prev => ({
      ...prev,
      sidebar_components: isChecked 
        ? [...(prev.sidebar_components || []), componentId]
        : (prev.sidebar_components || []).filter(id => id !== componentId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.price === '' || formData.price === null || formData.price === undefined) {
      toast.error('Name and price are required');
      return;
    }
    
    onSubmit(formData);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="name" className="text-sm">Plan Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Basic, Premium, Enterprise"
            className="h-9"
            required
          />
        </div>
        <div>
          <Label htmlFor="price" className="text-sm">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
            placeholder="0.00"
            className="h-9"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-sm">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe what this plan includes..."
          rows={2}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="billing_cycle" className="text-sm">Billing Cycle</Label>
          <Select 
            value={formData.billing_cycle} 
            onValueChange={(value) => setFormData({...formData, billing_cycle: value})}
          >
            <SelectTrigger className="h-9">
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
          <Label htmlFor="sort_order" className="text-sm">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
            placeholder="1"
            className="h-9"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm">Features</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              className="h-9 text-sm"
            />
            <Button type="button" onClick={addFeature} variant="outline" size="sm" className="h-9 px-3">
              +
            </Button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                <span className="text-xs truncate">{feature}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Components Section */}
      <div>
        <Label className="text-sm font-medium">Sidebar Components</Label>
        <p className="text-xs text-muted-foreground mb-3">Select which components this plan includes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {getAvailableComponents().map((component) => (
            <div key={component.id} className="flex items-center space-x-2 p-2 border rounded-md">
              <input
                type="checkbox"
                id={`component-${component.id}`}
                checked={formData.sidebar_components?.includes(component.id) || false}
                onChange={(e) => handleComponentToggle(component.id, e.target.checked)}
                className="w-4 h-4"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={`component-${component.id}`} className="text-xs font-medium cursor-pointer block truncate">
                  {component.label}
                  {component.required && <span className="text-muted-foreground ml-1">(Required)</span>}
                </Label>
                <p className="text-xs text-muted-foreground truncate">{component.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Plan Settings */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <Label htmlFor="max_users" className="text-xs">Max Users</Label>
          <Input
            id="max_users"
            type="number"
            value={formData.max_users}
            onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value) || 1})}
            placeholder="10"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="max_projects" className="text-xs">Max Projects</Label>
          <Input
            id="max_projects"
            type="number"
            value={formData.max_projects}
            onChange={(e) => setFormData({...formData, max_projects: parseInt(e.target.value) || 10})}
            placeholder="20"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="storage_limit" className="text-xs">Storage (MB)</Label>
          <Input
            id="storage_limit"
            type="number"
            value={formData.storage_limit}
            onChange={(e) => setFormData({...formData, storage_limit: parseInt(e.target.value) || 1024})}
            placeholder="1024"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="trial_days" className="text-xs">Trial Days</Label>
          <Input
            id="trial_days"
            type="number"
            value={formData.trial_days}
            onChange={(e) => setFormData({...formData, trial_days: parseInt(e.target.value) || 0})}
            placeholder="7"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="trial_price" className="text-xs">Trial Price</Label>
          <Input
            id="trial_price"
            type="number"
            step="0.01"
            value={formData.trial_price}
            onChange={(e) => setFormData({...formData, trial_price: parseFloat(e.target.value) || 0})}
            placeholder="0.00"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-xs text-muted-foreground">Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="is_popular" className="text-sm">Popular Plan</Label>
            <div className="relative">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) => setFormData({...formData, is_popular: e.target.checked})}
                className="sr-only"
              />
              <div 
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  formData.is_popular ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={() => setFormData({...formData, is_popular: !formData.is_popular})}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    formData.is_popular ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active" className="text-sm">Active</Label>
            <div className="relative">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="sr-only"
              />
              <div 
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  formData.is_active ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    formData.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          <XCircle className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button type="submit" size="sm">
          <Save className="w-4 h-4 mr-1" />
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};

// Subscription Details Component
const SubscriptionDetails = ({ subscription, onClose }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">User Email</Label>
          <p className="text-sm">{subscription.user_email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Plan Name</Label>
          <p className="text-sm">{subscription.plan_name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <p className="text-sm">{subscription.status}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
          <p className="text-sm">${subscription.amount}</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default NewSubscriptionManagement;
