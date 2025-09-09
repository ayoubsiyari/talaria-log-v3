import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Clock, 
  User, 
  MessageSquare, 
  Search, 
  Filter, 
  Download,
  Eye,
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '../../services/supportService';

const StaffLog = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    averageResponseTime: 0
  });

  // Load assignment history
  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (agentFilter !== 'all') params.append('assigned_to', agentFilter);
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('date_from', today);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append('date_from', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.append('date_from', monthAgo.toISOString());
      }
      
      const response = await fetch(`/api/support/assignments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.assignments || []);
        calculateStats(data.assignments || []);
      } else {
        throw new Error(data.error || 'Failed to load assignments');
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignment history');
      
      // Fallback to mock data for development
      const mockAssignments = [
        {
          id: 1,
          ticket_id: 'TKT-001',
          ticket_subject: 'Payment processing issue',
          assigned_by: 'admin@example.com',
          assigned_to: 'support_agent@example.com',
          assigned_at: '2024-01-15T10:30:00Z',
          status: 'active',
          priority: 'high',
          response_time: '2h 15m',
          resolution_time: null,
          customer_rating: null
        },
        {
          id: 2,
          ticket_id: 'TKT-002',
          ticket_subject: 'Feature request for trading journal',
          assigned_by: 'admin@example.com',
          assigned_to: 'support_team@example.com',
          assigned_at: '2024-01-14T16:20:00Z',
          status: 'completed',
          priority: 'medium',
          response_time: '1h 30m',
          resolution_time: '8h 45m',
          customer_rating: 5
        },
        {
          id: 3,
          ticket_id: 'TKT-003',
          ticket_subject: 'Account login problem',
          assigned_by: 'support_agent@example.com',
          assigned_to: 'senior_support@example.com',
          assigned_at: '2024-01-13T14:15:00Z',
          status: 'active',
          priority: 'urgent',
          response_time: '45m',
          resolution_time: null,
          customer_rating: null
        }
      ];
      
      setAssignments(mockAssignments);
      calculateStats(mockAssignments);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const total = data.length;
    const active = data.filter(a => a.status === 'active').length;
    const completed = data.filter(a => a.status === 'completed').length;
    
    // Calculate average response time
    const responseTimes = data
      .filter(a => a.response_time)
      .map(a => {
        const timeStr = a.response_time;
        if (timeStr.includes('h')) {
          const hours = parseInt(timeStr.split('h')[0]);
          const minutes = parseInt(timeStr.split('h')[1]?.split('m')[0] || 0);
          return hours * 60 + minutes;
        } else {
          return parseInt(timeStr.split('m')[0]);
        }
      });
    
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    setStats({
      totalAssignments: total,
      activeAssignments: active,
      completedAssignments: completed,
      averageResponseTime: avgResponseTime
    });
  };

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.ticket_subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.assigned_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.ticket_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || assignment.assigned_to === agentFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      const assignmentDate = new Date(assignment.assigned_at).toDateString();
      matchesDate = today === assignmentDate;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(assignment.assigned_at) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(assignment.assigned_at) >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesAgent && matchesDate;
  });

  // Get unique agents for filter
  const uniqueAgents = [...new Set(assignments.map(a => a.assigned_to))];

  // Get status badge variant
  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      completed: 'outline',
      reassigned: 'secondary',
      escalated: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  // Get priority badge variant
  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive',
      urgent: 'destructive'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority.toUpperCase()}</Badge>;
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Ticket ID', 'Subject', 'Assigned By', 'Assigned To', 'Assigned At', 'Status', 'Priority', 'Response Time', 'Resolution Time', 'Rating'],
      ...filteredAssignments.map(a => [
        a.ticket_id,
        a.ticket_subject,
        a.assigned_by,
        a.assigned_to,
        a.assigned_at,
        a.status,
        a.priority,
        a.response_time,
        a.resolution_time || 'N/A',
        a.customer_rating || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Staff log exported successfully');
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Log</h1>
          <p className="text-muted-foreground">Track staff assignments and workload distribution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAssignments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <div className="text-sm text-muted-foreground">Total Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeAssignments}</div>
                <div className="text-sm text-muted-foreground">Active Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedAssignments}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.averageResponseTime}m</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tickets, agents, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="reassigned">Reassigned</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment History</CardTitle>
          <CardDescription>
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{assignment.ticket_subject}</h3>
                        <Badge variant="outline">{assignment.ticket_id}</Badge>
                        {getStatusBadge(assignment.status)}
                        {getPriorityBadge(assignment.priority)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Assigned By:</span> {assignment.assigned_by}
                        </div>
                        <div>
                          <span className="font-medium">Assigned To:</span> {assignment.assigned_to}
                        </div>
                        <div>
                          <span className="font-medium">Response Time:</span> {assignment.response_time}
                        </div>
                        <div>
                          <span className="font-medium">Assigned:</span> {new Date(assignment.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {assignment.resolution_time && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-green-600">Resolved in: {assignment.resolution_time}</span>
                        </div>
                      )}
                      
                      {assignment.customer_rating && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-medium">Customer Rating:</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < assignment.customer_rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Ticket
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLog;
