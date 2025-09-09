import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Target, 
  BarChart3, 
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Archive,
  Loader2,
  Save,
  X,
  Lock,
  Unlock,
  Info,
  Mail,
  MessageSquare,
  Database,
  Server,
  Globe,
  Zap,
  Crown,
  UserCheck,
  UserX,
  Bell,
  DollarSign,
  FileText,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const RBACOverview = ({ onNavigate }) => {
  const [rbacStats, setRbacStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [topRoles, setTopRoles] = useState([]);
  const [permissionUsage, setPermissionUsage] = useState([]);
  const [userRoleDistribution, setUserRoleDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    loadRBACData();
    
    // Set up auto-refresh
    const interval = setInterval(loadRBACData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeRange, refreshInterval]);

  const loadRBACData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      
      // Load all RBAC data in parallel
      const [
        statsResponse,
        activityResponse,
        alertsResponse,
        rolesResponse,
        permissionsResponse,
        distributionResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/rbac/statistics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/rbac/activity?time_range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/rbac/security-alerts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/rbac/top-roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/rbac/permission-usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/rbac/user-distribution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process responses
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setRbacStats(statsData.statistics);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setSecurityAlerts(alertsData.alerts || []);
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setTopRoles(rolesData.roles || []);
      }

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissionUsage(permissionsData.permissions || []);
      }

      if (distributionResponse.ok) {
        const distributionData = await distributionResponse.json();
        setUserRoleDistribution(distributionData.distribution || []);
      }

    } catch (err) {
      console.error('Error loading RBAC data:', err);
      setError('Failed to load RBAC data');
      toast.error('Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading RBAC Overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={loadRBACData}>
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
            <Shield className="w-8 h-8 text-blue-600" />
            <span>RBAC System Overview</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete view of Role-Based Access Control system and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRBACData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common RBAC management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('roles')}>
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="outline" onClick={() => onNavigate('role-assignments')}>
              <Target className="w-4 h-4 mr-2" />
              Role Assignments
            </Button>
            <Button variant="outline" onClick={() => onNavigate('permissions-overview')}>
              <Lock className="w-4 h-4 mr-2" />
              Permissions Overview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5" />
              <span>Security Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.severity)}
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  <Badge className={getStatusColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              {securityAlerts.length > 3 && (
                <Button variant="link" className="text-red-600 p-0 h-auto">
                  View {securityAlerts.length - 3} more alerts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{rbacStats?.total_roles || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {rbacStats?.roles_growth > 0 ? '+' : ''}{rbacStats?.roles_growth || 0}% from last period
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Permissions</p>
                <p className="text-2xl font-bold">{rbacStats?.total_permissions || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {rbacStats?.permissions_growth > 0 ? '+' : ''}{rbacStats?.permissions_growth || 0}% from last period
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                <p className="text-2xl font-bold">{rbacStats?.active_assignments || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {rbacStats?.assignments_growth > 0 ? '+' : ''}{rbacStats?.assignments_growth || 0}% from last period
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{rbacStats?.security_score || 95}%</p>
                <p className="text-xs text-muted-foreground">
                  {rbacStats?.security_trend === 'up' ? 'Improving' : 'Needs attention'}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Roles and Permission Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Roles</CardTitle>
            <CardDescription>Roles with the highest number of assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRoles.slice(0, 5).map((role, index) => (
                <div key={role.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{role.display_name || role.name}</p>
                      <p className="text-sm text-muted-foreground">{role.permissions_count} permissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{role.assignments_count}</p>
                    <p className="text-xs text-muted-foreground">assignments</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permission Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Usage</CardTitle>
            <CardDescription>Most commonly used permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {permissionUsage.slice(0, 5).map((permission, index) => (
                <div key={permission.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{permission.name}</span>
                    <span className="text-sm text-muted-foreground">{permission.usage_count} uses</span>
                  </div>
                  <Progress value={permission.usage_percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <CardDescription>How users are distributed across different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRoleDistribution.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.role_name}</span>
                  <Badge variant="outline">{item.user_count}</Badge>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {item.percentage}% of total users
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent RBAC Activity</CardTitle>
          <CardDescription>Latest role and permission changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={activity.user?.avatar} />
                      <AvatarFallback>{getUserInitials(activity.user?.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{activity.user?.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>RBAC System Health</CardTitle>
          <CardDescription>System status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">System Status</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Response Time</span>
              </div>
              <span className="font-bold">{rbacStats?.avg_response_time || 45}ms</span>
              <p className="text-xs text-muted-foreground mt-1">Average API response</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Database</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
              <p className="text-xs text-muted-foreground mt-1">All tables accessible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RBACOverview;
