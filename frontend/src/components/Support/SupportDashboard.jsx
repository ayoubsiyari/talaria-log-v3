import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supportService } from '@/services/supportService';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  UserCheck, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Import components
import TicketAssignmentManager from './TicketAssignmentManager';
import MyAssignedTickets from './MyAssignedTickets';

const SupportDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('agent');


  useEffect(() => {
    loadDashboardData();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    // Check if user has admin permissions from stored user data
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const roles = user.roles || [];
        
        // Check if user has admin roles
        const hasAdminRole = roles.some(role => {
          if (typeof role === 'string') {
            return role === 'super_admin' || role === 'admin' || role === 'support_team';
          } else if (typeof role === 'object' && role.name) {
            return role.name === 'super_admin' || role.name === 'admin' || role.name === 'support_team';
          }
          return false;
        });
        
        if (hasAdminRole) {
          setUserRole('admin');
        } else {
          setUserRole('agent');
        }
        
        console.log('User roles detected:', roles);
        console.log('User role set to:', hasAdminRole ? 'admin' : 'agent');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole('agent');
      }
    } else {
      setUserRole('agent');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load support statistics
      const statsResponse = await supportService.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Load agent workload if admin
      if (userRole === 'admin') {
        try {
          const workloadResponse = await supportService.getAgentWorkload();
          if (workloadResponse.data.success) {
            setStats(prev => ({ ...prev, workload: workloadResponse.data.workload }));
          }
        } catch (workloadError) {
          console.warn('Failed to load agent workload:', workloadError);
          // Don't fail the entire dashboard if workload fails
          setStats(prev => ({ ...prev, workload: [] }));
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Support Dashboard</h1>
              <p className="text-muted-foreground">
                {userRole === 'admin' ? 'Manage support tickets and assignments' : 'Handle your assigned tickets'}
              </p>
            </div>
            <Button onClick={loadDashboardData} variant="outline">
              Refresh
            </Button>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_tickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.new_tickets_today ? `+${stats.new_tickets_today} today` : 'No new tickets today'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.open_tickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.urgent_tickets ? `${stats.urgent_tickets} urgent` : 'No urgent tickets'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.in_progress_tickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.avg_response_time ? `${stats.avg_response_time}h avg response` : 'No response time data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved_tickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.resolution_rate ? `${stats.resolution_rate}% resolution rate` : 'No resolution data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue={userRole === 'admin' ? 'assignment' : 'my-tickets'} className="space-y-4">
            <TabsList>
              {userRole === 'admin' && (
                <TabsTrigger value="assignment">Assignment Manager</TabsTrigger>
              )}
              <TabsTrigger value="my-tickets">My Assigned Tickets</TabsTrigger>
              {userRole === 'admin' && (
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              )}
            </TabsList>

            {userRole === 'admin' && (
              <TabsContent value="assignment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Assignment Management</CardTitle>
                    <CardDescription>
                      Assign tickets to agents and manage workload distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketAssignmentManager />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="my-tickets" className="space-y-4">
              <MyAssignedTickets />
            </TabsContent>

            {userRole === 'admin' && (
              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Support Analytics</CardTitle>
                    <CardDescription>
                      Performance metrics and workload distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             {/* Agent Workload */}
                       <div>
                         <h3 className="text-lg font-semibold mb-4">Agent Workload</h3>
                         {stats.workload && Array.isArray(stats.workload) && stats.workload.length > 0 ? (
                           <div className="space-y-3">
                             {stats.workload.map((agent) => (
                               <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                                 <div>
                                   <p className="font-medium">{agent.full_name || agent.username}</p>
                                   <p className="text-sm text-muted-foreground">{agent.username}</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="font-bold">{agent.assigned_tickets || 0}</p>
                                   <p className="text-xs text-muted-foreground">tickets</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <p className="text-muted-foreground">No workload data available</p>
                         )}
                       </div>

                      {/* Performance Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Average Response Time</span>
                            <Badge variant="outline">
                              {stats.avg_response_time || 'N/A'} hours
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Resolution Rate</span>
                            <Badge variant="outline">
                              {stats.resolution_rate || 'N/A'}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Customer Satisfaction</span>
                            <Badge variant="outline">
                              {stats.satisfaction_score || 'N/A'}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
    </div>
  );
};

export default SupportDashboard;
