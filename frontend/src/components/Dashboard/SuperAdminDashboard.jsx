import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';
import roleService from '@/services/roleService';

const SuperAdminDashboard = ({ onNavigate }) => {
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
        roleStatsData
      ] = await Promise.all([
        loadSystemStats(),
        loadRecentActivity(),
        loadSecurityAlerts(),
        loadUserStats(),
        loadRoleStats()
      ]);

      setSystemStats(systemStatsData);
      setRecentActivity(recentActivityData);
      setSecurityAlerts(securityAlertsData);
      setUserStats(userStatsData);
      setRoleStats(roleStatsData);

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
      const response = await fetch(`${API_BASE_URL}/admin/system/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.stats;
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

  const handleSystemAction = async (action, targetId = null) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/system/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_id: targetId })
      });

      if (response.ok) {
        toast.success(`${action} completed successfully`);
        loadDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Super Administrator Dashboard...</p>
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
            <Crown className="w-8 h-8 text-yellow-600" />
            <span>Super Administrator Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete system control and oversight
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => onNavigate('settings')}>
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

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

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Status</p>
                    <p className="text-2xl font-bold">Online</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{userStats?.active_users || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                    <p className="text-2xl font-bold">{roleStats?.total_roles || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                    <p className="text-2xl font-bold">{systemStats?.security_score || 95}%</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>Latest administrative actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity, index) => (
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
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management Overview</CardTitle>
              <CardDescription>Complete control over user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Active Users</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{userStats?.active_users || 0}</p>
                </div>
                
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserX className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Suspended Users</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{userStats?.suspended_users || 0}</p>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{userStats?.total_users || 0}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => onNavigate('users')}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" onClick={() => onNavigate('user-roles')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Role Assignments
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RBAC Tab */}
        <TabsContent value="rbac" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
              <CardDescription>Manage roles, permissions, and access control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Total Roles</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{roleStats?.total_roles || 0}</p>
                </div>
                
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Total Permissions</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{roleStats?.total_permissions || 0}</p>
                </div>
                
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-teal-600" />
                    <span className="font-medium">Active Assignments</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{roleStats?.active_assignments || 0}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => onNavigate('rbac')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Roles
                </Button>
                <Button variant="outline" onClick={() => onNavigate('permissions')}>
                  <Key className="w-4 h-4 mr-2" />
                  Manage Permissions
                </Button>
                <Button variant="outline" onClick={() => onNavigate('role-assignments')}>
                  <Target className="w-4 h-4 mr-2" />
                  Role Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
              <CardDescription>System maintenance and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-medium">System Health</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Database Status</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Server Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Cache Status</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSystemAction('backup')}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSystemAction('cache-clear')}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSystemAction('maintenance')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Maintenance Mode
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>Security alerts and threat monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Security Overview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Failed Login Attempts</span>
                      <Badge variant="outline">{systemStats?.failed_logins || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Active Sessions</span>
                      <Badge variant="outline">{systemStats?.active_sessions || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Security Score</span>
                      <Badge className="bg-green-100 text-green-800">{systemStats?.security_score || 95}%</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Recent Security Events</h3>
                  <div className="space-y-2">
                    {securityAlerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Performance metrics and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">User Growth</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">+12%</p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Active Sessions</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{systemStats?.active_sessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Currently online</p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">System Load</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{systemStats?.system_load || 45}%</p>
                  <p className="text-sm text-muted-foreground">CPU usage</p>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Storage Used</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{systemStats?.storage_used || 65}%</p>
                  <p className="text-sm text-muted-foreground">Of total capacity</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => onNavigate('analytics')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
