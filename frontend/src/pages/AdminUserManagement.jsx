import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  RefreshCw,
  BarChart3,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState('stuck-users');
  const [stuckUsers, setStuckUsers] = useState([]);
  const [expiredUsers, setExpiredUsers] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  
  // Plan management state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    plan_id: '',
    duration_days: 30,
    is_trial: false,
    admin_notes: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Load statistics
      const statsResponse = await fetch(`${API_BASE_URL}/admin/users/subscription-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.statistics);
      }

      // Load available plans
      const plansResponse = await fetch(`${API_BASE_URL}/admin/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.plans);
      }

      // Load data based on active tab
      if (activeTab === 'stuck-users') {
        const stuckResponse = await fetch(`${API_BASE_URL}/admin/users/stuck-on-plan-selection`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (stuckResponse.ok) {
          const stuckData = await stuckResponse.json();
          setStuckUsers(stuckData.users);
        }
      } else if (activeTab === 'expired-users') {
        const expiredResponse = await fetch(`${API_BASE_URL}/admin/users/expired-subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (expiredResponse.ok) {
          const expiredData = await expiredResponse.json();
          setExpiredUsers(expiredData.users);
        }
      } else if (activeTab === 'plans') {
        // Plans are already loaded in the main loadData function
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedUser || !assignmentForm.plan_id) {
      toast.error('Please select a user and plan');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/assign-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          ...assignmentForm
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setAssignDialogOpen(false);
        setSelectedUser(null);
        setAssignmentForm({
          plan_id: '',
          duration_days: 30,
          is_trial: false,
          admin_notes: ''
        });
        loadData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign subscription');
      }
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    }
  };

  const loadUserHistory = async (userId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/subscription-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserHistory(data.subscription_history);
        setHistoryDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading user history:', error);
      toast.error('Failed to load user history');
    }
  };

  // Plan management functions
  const handleCreatePlan = async (planData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowPlanModal(false);
        setSelectedPlan(null);
        loadData(); // Refresh plans
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    }
  };

  const handleUpdatePlan = async (planId, planData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowPlanModal(false);
        setSelectedPlan(null);
        loadData(); // Refresh plans
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowDeletePlanDialog(false);
        setPlanToDelete(null);
        loadData(); // Refresh plans
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const openEditPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const openDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setShowDeletePlanDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'no_subscription': 'destructive',
      'active': 'default',
      'trial': 'secondary',
      'expired': 'destructive',
      'cancelled': 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const renderUserCard = (user, type = 'stuck') => (
    <Card key={user.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold">{user.username}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(user.subscription_status)}
                {type === 'stuck' && (
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {user.days_since_registration} days
                    </Badge>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )}
                {type === 'expired' && (
                  <Badge variant="outline" className="text-red-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {user.days_since_expired} days expired
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setAssignDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Assign Plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadUserHistory(user.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Registered:</span>
            <span className="ml-2">{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Last Login:</span>
            <span className="ml-2">
              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users stuck on plan selection and subscription issues</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{statistics.total_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold">{statistics.active_subscriptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment Pending</p>
                <p className="text-2xl font-bold">{statistics.payment_pending_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No Subscription</p>
                <p className="text-2xl font-bold">{statistics.users_without_subscription || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{statistics.conversion_rate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stuck-users">
            <UserX className="h-4 w-4 mr-2" />
            Stuck Users ({stuckUsers.length})
          </TabsTrigger>
          <TabsTrigger value="expired-users">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Expired ({expiredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Plans ({availablePlans.length})
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stuck-users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users Stuck on Plan Selection</CardTitle>
                <Button onClick={loadData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading users...</p>
                </div>
              ) : stuckUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No users stuck on plan selection!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stuckUsers.map(user => renderUserCard(user, 'stuck'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired-users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users with Expired Subscriptions</CardTitle>
                <Button onClick={loadData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading users...</p>
                </div>
              ) : expiredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No users with expired subscriptions!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expiredUsers.map(user => renderUserCard(user, 'expired'))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plans</CardTitle>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowPlanModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                  <Button onClick={loadData} disabled={loading} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading plans...</p>
                </div>
              ) : availablePlans.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No subscription plans found</p>
                  <Button onClick={() => setShowPlanModal(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availablePlans.map(plan => (
                    <Card key={plan.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{plan.name}</h3>
                                {plan.is_popular && (
                                  <Badge variant="secondary">Popular</Badge>
                                )}
                                <Badge variant={plan.is_active ? "default" : "outline"}>
                                  {plan.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{plan.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="font-medium">${plan.price}/{plan.billing_cycle}</span>
                                {plan.trial_days > 0 && (
                                  <span className="text-green-600">{plan.trial_days} days trial</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditPlan(plan)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeletePlan(plan)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {plan.features && plan.features.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                            <div className="flex flex-wrap gap-2">
                              {plan.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Subscription Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{statistics.total_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Subscriptions:</span>
                      <span className="font-semibold text-green-600">{statistics.active_subscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trial Subscriptions:</span>
                      <span className="font-semibold text-blue-600">{statistics.trial_subscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expired Subscriptions:</span>
                      <span className="font-semibold text-red-600">{statistics.expired_subscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No Subscription:</span>
                      <span className="font-semibold text-orange-600">{statistics.users_without_subscription || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Recent Registrations (7 days):</span>
                      <span className="font-semibold">{statistics.recent_registrations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-semibold text-purple-600">{statistics.conversion_rate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Subscription Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subscription Plan</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold">{selectedUser.username}</h4>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-600">
                  Registered: {new Date(selectedUser.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <Label htmlFor="plan">Select Plan</Label>
                <Select value={assignmentForm.plan_id} onValueChange={(value) => setAssignmentForm({...assignmentForm, plan_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - ${plan.price}/{plan.billing_cycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={assignmentForm.duration_days}
                  onChange={(e) => setAssignmentForm({...assignmentForm, duration_days: parseInt(e.target.value)})}
                  min="1"
                  max="365"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_trial"
                  checked={assignmentForm.is_trial}
                  onChange={(e) => setAssignmentForm({...assignmentForm, is_trial: e.target.checked})}
                />
                <Label htmlFor="is_trial">Mark as Trial</Label>
              </div>

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={assignmentForm.admin_notes}
                  onChange={(e) => setAssignmentForm({...assignmentForm, admin_notes: e.target.value})}
                  placeholder="Optional notes about this assignment..."
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAssignSubscription} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Plan
                </Button>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {userHistory.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No subscription history found</p>
            ) : (
              <div className="space-y-3">
                {userHistory.map((sub, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{sub.plan_name}</h4>
                          <p className="text-sm text-gray-600">
                            {sub.start_date && new Date(sub.start_date).toLocaleDateString()} - 
                            {sub.end_date && new Date(sub.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(sub.status)}
                          {sub.created_by_admin && (
                            <Badge variant="outline">Admin Assigned</Badge>
                          )}
                        </div>
                      </div>
                      {sub.admin_notes && (
                        <p className="text-sm text-gray-600 mt-2">{sub.admin_notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl">
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

      {/* Delete Plan Dialog */}
      <Dialog open={showDeletePlanDialog} onOpenChange={setShowDeletePlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeletePlanDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeletePlan(planToDelete?.id)}
            >
              Delete Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
    trial_days: plan?.trial_days || 0,
    is_popular: plan?.is_popular || false,
    is_active: plan?.is_active !== false
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Basic, Pro, Enterprise"
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Plan description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="billing_cycle">Billing Cycle</Label>
          <Select 
            value={formData.billing_cycle} 
            onValueChange={(value) => setFormData({...formData, billing_cycle: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="trial_days">Trial Days</Label>
          <Input
            id="trial_days"
            type="number"
            value={formData.trial_days}
            onChange={(e) => setFormData({...formData, trial_days: parseInt(e.target.value)})}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label>Features</Label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature} variant="outline">
              Add
            </Button>
          </div>
          {formData.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_popular"
          checked={formData.is_popular}
          onChange={(e) => setFormData({...formData, is_popular: e.target.checked})}
        />
        <Label htmlFor="is_popular">Mark as Popular</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
};

export default AdminUserManagement;
