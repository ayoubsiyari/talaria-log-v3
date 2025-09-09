import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  CreditCard, 
  Activity,
  Eye,
  Crown,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Database,
  Server,
  Network,
  FileText,
  Bell,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Globe,
  Key,
  UserCheck,
  UserX,
  Mail,
  MessageSquare,
  Archive,
  Zap,
  Target,
  Filter,
  Search,
  MoreHorizontal,
  Loader2,
  Info,
  PieChart,
  LineChart,
  BarChart,
  AreaChart,
  Smartphone,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart as RechartsRadialBarChart,
  RadialBar,
  ComposedChart as RechartsComposedChart,
  Scatter,
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Treemap,
  Cell as TreemapCell
} from 'recharts';

const ChartBasedDashboard = ({ onNavigate }) => {
  const { hasRole, isSuperAdmin } = usePermissions();
  const [systemStats, setSystemStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    suspended_users: 0,
    inactive_users: 0
  });
  const [roleStats, setRoleStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts (replace with real data from API)
  const [chartData, setChartData] = useState({
    userGrowth: [
      { month: 'Jan', users: 1200, growth: 15 },
      { month: 'Feb', users: 1350, growth: 12.5 },
      { month: 'Mar', users: 1520, growth: 12.6 },
      { month: 'Apr', users: 1680, growth: 10.5 },
      { month: 'May', users: 1820, growth: 8.3 },
      { month: 'Jun', users: 1950, growth: 7.1 },
      { month: 'Jul', users: 2100, growth: 7.7 },
      { month: 'Aug', users: 2280, growth: 8.6 }
    ],
    revenueData: [
      { month: 'Jan', revenue: 98420, subscriptions: 890 },
      { month: 'Feb', revenue: 105680, subscriptions: 950 },
      { month: 'Mar', revenue: 112340, subscriptions: 1020 },
      { month: 'Apr', revenue: 118920, subscriptions: 1150 },
      { month: 'May', revenue: 124580, subscriptions: 1280 },
      { month: 'Jun', revenue: 131240, subscriptions: 1420 },
      { month: 'Jul', revenue: 138760, subscriptions: 1580 },
      { month: 'Aug', revenue: 145320, subscriptions: 1750 }
    ],
    userDistribution: [
      { name: 'Active Users', value: 2100, color: '#10b981' },
      { name: 'Inactive Users', value: 180, color: '#f59e0b' },
      { name: 'Suspended Users', value: 45, color: '#ef4444' }
    ],
    roleDistribution: [
      { name: 'Regular Users', value: 1850, color: '#3b82f6' },
      { name: 'Administrators', value: 150, color: '#8b5cf6' },
      { name: 'Moderators', value: 75, color: '#06b6d4' },
      { name: 'Support Agents', value: 25, color: '#f97316' }
    ],
    systemMetrics: [
      { name: 'CPU Usage', value: 45, color: '#3b82f6' },
      { name: 'Memory Usage', value: 62, color: '#10b981' },
      { name: 'Disk Usage', value: 78, color: '#f59e0b' },
      { name: 'Network Load', value: 35, color: '#8b5cf6' }
    ],
    securityMetrics: [
      { name: 'Security Score', value: 95, color: '#10b981' },
      { name: 'Failed Logins', value: 12, color: '#ef4444' },
      { name: 'Active Sessions', value: 156, color: '#3b82f6' },
      { name: 'Blocked IPs', value: 8, color: '#f59e0b' }
    ],
    activityTrend: [
      { hour: '00:00', logins: 45, actions: 120 },
      { hour: '04:00', logins: 23, actions: 67 },
      { hour: '08:00', logins: 89, actions: 234 },
      { hour: '12:00', logins: 156, actions: 445 },
      { hour: '16:00', logins: 134, actions: 378 },
      { hour: '20:00', logins: 98, actions: 289 },
      { hour: '24:00', logins: 67, actions: 156 }
    ]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all dashboard data in parallel
      const [
        systemStatsData,
        recentActivityData,
        securityAlertsData,
        userStatsData,
        roleStatsData,
        userGrowthData,
        revenueData,
        userDistributionData,
        roleDistributionData,
        activityTrendData,
        loginAnalyticsData,
        systemMetricsData,
        securityMetricsData
      ] = await Promise.all([
        loadSystemStats(),
        loadRecentActivity(),
        loadSecurityAlerts(),
        loadUserStats(),
        loadRoleStats(),
        loadUserGrowthTrend(),
        loadRevenueData(),
        loadUserDistribution(),
        loadRoleDistribution(),
        loadActivityTrend(),
        loadLoginAnalytics(),
        loadSystemMetrics(),
        loadSecurityMetrics()
      ]);

      setSystemStats(systemStatsData);
      setRecentActivity(recentActivityData);
      setSecurityAlerts(securityAlertsData);
      setUserStats(userStatsData);
      setRoleStats(roleStatsData);

      // Update chart data with real data
      setChartData(prevData => ({
        ...prevData,
        userGrowth: userGrowthData || prevData.userGrowth,
        revenueData: revenueData || prevData.revenueData,
        userDistribution: userDistributionData || prevData.userDistribution,
        roleDistribution: roleDistributionData || prevData.roleDistribution,
        activityTrend: activityTrendData?.hourly_data || prevData.activityTrend,
        activityCategories: activityTrendData?.category_data || [],
        geographicActivity: activityTrendData?.geographic_data || [],
        loginAnalytics: loginAnalyticsData || {},
        systemMetrics: systemMetricsData || prevData.systemMetrics,
        securityMetrics: securityMetricsData || prevData.securityMetrics
      }));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/system-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          security_score: data.security_score || 95,
          system_status: 'online',
          cpu_usage: data.data?.find(m => m.name === 'CPU Usage')?.value || 45,
          memory_usage: data.data?.find(m => m.name === 'Memory Usage')?.value || 62,
          disk_usage: data.data?.find(m => m.name === 'Disk Usage')?.value || 78,
          active_sessions: data.data?.find(m => m.name === 'Active Sessions')?.value || 156,
          failed_logins: data.data?.find(m => m.name === 'Failed Logins')?.value || 12
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading system stats:', error);
      return null;
    }
  };

  const loadRecentActivity = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/activity/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.activities || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/security/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.alerts || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading security alerts:', error);
      return [];
    }
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.stats || {
          total_users: 0,
          active_users: 0,
          suspended_users: 0,
          inactive_users: 0
        };
      }
      return {
        total_users: 0,
        active_users: 0,
        suspended_users: 0,
        inactive_users: 0
      };
    } catch (error) {
      console.error('Error loading user stats:', error);
      return {
        total_users: 0,
        active_users: 0,
        suspended_users: 0,
        inactive_users: 0
      };
    }
  };

  const loadRoleStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/rbac/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.statistics;
      }
      return null;
    } catch (error) {
      console.error('Error loading role stats:', error);
      return null;
    }
  };

  const loadUserGrowthTrend = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/user-growth-trend`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading user growth trend:', error);
      return [];
    }
  };

  const loadRevenueData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/revenue-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading revenue data:', error);
      return [];
    }
  };

  const loadUserDistribution = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/user-distribution`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading user distribution:', error);
      return [];
    }
  };

  const loadRoleDistribution = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/role-distribution`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading role distribution:', error);
      return [];
    }
  };

  const loadActivityTrend = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/activity-trend`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || { hourly_data: [], category_data: [], geographic_data: [], summary: {} };
      }
      return { hourly_data: [], category_data: [], geographic_data: [], summary: {} };
    } catch (error) {
      console.error('Error loading activity trend:', error);
      return { hourly_data: [], category_data: [], geographic_data: [], summary: {} };
    }
  };

  const loadLoginAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/login-analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || { daily_trends: [], hourly_success_rate: [], device_analytics: [], browser_analytics: [], failed_patterns: [], summary: {} };
      }
      return { daily_trends: [], hourly_success_rate: [], device_analytics: [], browser_analytics: [], failed_patterns: [], summary: {} };
    } catch (error) {
      console.error('Error loading login analytics:', error);
      return { daily_trends: [], hourly_success_rate: [], device_analytics: [], browser_analytics: [], failed_patterns: [], summary: {} };
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/system-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading system metrics:', error);
      return [];
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/security-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading security metrics:', error);
      return [];
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
      case 'offline':
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Chart-Based Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">Dashboard Error</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span>Chart-Based Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Visual analytics and insights for better decision making
          </p>
        </div>
                 <div className="flex gap-2">
           <Button variant="outline" onClick={loadDashboardData}>
             <RefreshCw className="w-4 h-4 mr-2" />
             Refresh
           </Button>
         </div>
      </div>

      

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isSuperAdmin() || hasRole('system_administrator') ? 'grid-cols-5' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {(isSuperAdmin() || hasRole('system_administrator')) && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
          {(isSuperAdmin() || hasRole('system_administrator')) && (
            <TabsTrigger value="system">System</TabsTrigger>
          )}
          {(isSuperAdmin() || hasRole('system_administrator')) && (
            <TabsTrigger value="security">Security</TabsTrigger>
          )}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards with Mini Charts */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin() || hasRole('system_administrator') ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            {(isSuperAdmin() || hasRole('system_administrator')) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{formatNumber(userStats?.total_users || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <RechartsAreaChart data={chartData.userGrowth.slice(-6)}>
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RechartsAreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {(isSuperAdmin() || hasRole('system_administrator')) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">{formatNumber(userStats?.active_users || 0)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <RechartsBarChart data={chartData.userGrowth.slice(-6)}>
                      <Bar dataKey="users" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Finance-relevant cards for all users */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">${formatNumber(systemStats?.monthly_revenue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                  <RechartsLineChart data={chartData.revenueData}>
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                    <p className="text-2xl font-bold">{formatNumber(systemStats?.active_subscriptions || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                  <RechartsBarChart data={chartData.subscriptionData}>
                    <Bar dataKey="subscriptions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Success Rate</p>
                    <p className="text-2xl font-bold">{systemStats?.payment_success_rate || 98}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                  <RechartsRadialBarChart data={[{ name: 'Success Rate', value: systemStats?.payment_success_rate || 98 }]} innerRadius="60%" outerRadius="100%">
                    <RadialBar dataKey="value" fill="#3b82f6" />
                  </RechartsRadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {(isSuperAdmin() || hasRole('system_administrator')) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Status</p>
                      <p className="text-2xl font-bold">Online</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <RechartsLineChart data={chartData.systemMetrics}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {(isSuperAdmin() || hasRole('system_administrator')) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                      <p className="text-2xl font-bold">{systemStats?.security_score || 95}%</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <RechartsRadialBarChart data={[{ name: 'Security', value: systemStats?.security_score || 95 }]} innerRadius="60%" outerRadius="100%">
                      <RadialBar dataKey="value" fill="#f97316" />
                    </RechartsRadialBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>User Growth Trend</span>
                </CardTitle>
                <CardDescription>Monthly user growth and revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsComposedChart data={chartData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="users" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total Users"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="growth" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="Growth %"
                    />
                  </RechartsComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Revenue Performance</span>
                </CardTitle>
                <CardDescription>Monthly revenue and subscription growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsComposedChart data={chartData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Subscriptions'
                    ]} />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="revenue" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="subscriptions" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      name="Subscriptions"
                    />
                  </RechartsComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>User Distribution</span>
                </CardTitle>
                <CardDescription>Breakdown of user status across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Users']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Role Distribution</span>
                </CardTitle>
                <CardDescription>Distribution of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Users']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>User Activity Timeline</span>
                </CardTitle>
                <CardDescription>Daily user activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsComposedChart data={chartData.activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="logins" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Logins" />
                    <Line 
                      type="monotone" 
                      dataKey="actions" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      name="Actions"
                    />
                  </RechartsComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>User Growth Funnel</span>
                </CardTitle>
                <CardDescription>User acquisition and retention funnel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsFunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={[
                        { name: 'Visitors', value: 5000, fill: '#3b82f6' },
                        { name: 'Signups', value: 2500, fill: '#8b5cf6' },
                        { name: 'Active Users', value: 2100, fill: '#10b981' },
                        { name: 'Premium Users', value: 850, fill: '#f59e0b' }
                      ]}
                      isAnimationActive
                    />
                  </RechartsFunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>System Performance</span>
                </CardTitle>
                <CardDescription>Real-time system resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsRadialBarChart data={chartData.systemMetrics} innerRadius="20%" outerRadius="100%">
                    <RadialBar dataKey="value" fill="#3b82f6" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    <Legend />
                  </RechartsRadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Load Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>System Load Trend</span>
                </CardTitle>
                <CardDescription>System performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsAreaChart data={chartData.systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Security Metrics</span>
                </CardTitle>
                <CardDescription>Security performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={chartData.securityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Security Score Radial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Score</span>
                </CardTitle>
                <CardDescription>Overall system security rating</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsRadialBarChart data={[{ name: 'Security Score', value: systemStats?.security_score || 95 }]} innerRadius="60%" outerRadius="100%">
                    <RadialBar dataKey="value" fill="#10b981" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  </RechartsRadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Activity Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Actions Today</p>
                    <p className="text-2xl font-bold">{formatNumber(chartData.activityTrend?.summary?.total_actions || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Logins Today</p>
                    <p className="text-2xl font-bold">{formatNumber(chartData.activityTrend?.summary?.total_logins || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
                    <p className="text-2xl font-bold">{formatNumber(chartData.activityTrend?.summary?.total_failed_logins || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold">{formatNumber(chartData.activityTrend?.summary?.unique_users_today || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Activity Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Activity Heatmap</span>
                </CardTitle>
                <CardDescription>User activity patterns throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsComposedChart data={chartData.activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="actions" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Total Actions" />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="logins" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                      name="Logins"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="failed_logins" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                      name="Failed Logins"
                    />
                  </RechartsComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Activity by Category</span>
                </CardTitle>
                <CardDescription>Breakdown of user activities by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.activityCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.activityCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Actions']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Login Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Login Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Login Success Rate</span>
                </CardTitle>
                <CardDescription>Login success rate by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsAreaChart data={chartData.loginAnalytics?.hourly_success_rate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                    <Area 
                      type="monotone" 
                      dataKey="success_rate" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Device Analytics</span>
                </CardTitle>
                <CardDescription>Login activity by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={chartData.loginAnalytics?.device_analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Geographic Activity</span>
                </CardTitle>
                <CardDescription>User activity by country</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={chartData.geographicActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Browser Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Browser Analytics</span>
                </CardTitle>
                <CardDescription>Login activity by browser</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.loginAnalytics?.browser_analytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.loginAnalytics?.browser_analytics?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Logins']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartBasedDashboard;
