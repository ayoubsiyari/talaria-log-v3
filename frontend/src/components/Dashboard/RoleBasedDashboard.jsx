import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  BarChart3, 
  Star, 
  MessageSquare, 
  Bell,
  FileText,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Settings
} from 'lucide-react';

const RoleBasedDashboard = () => {
  const { hasRole, isSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');

  // Determine which sections to show based on role
  const getVisibleSections = () => {
    if (isSuperAdmin() || hasRole('system_administrator')) {
      return ['overview', 'management', 'marketing', 'finance', 'support'];
    } else if (hasRole('marketing_team')) {
      return ['marketing'];
    } else if (hasRole('finance_team')) {
      return ['finance'];
    } else if (hasRole('support_team')) {
      return ['support'];
    }
    return ['overview'];
  };

  const visibleSections = getVisibleSections();

  const renderOverviewSection = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">+180.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">+201 since last hour</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12</div>
          <p className="text-xs text-muted-foreground">+2 new this week</p>
          </CardContent>
        </Card>
      </div>
    );

  const renderManagementSection = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
              </CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Users</span>
              <Badge variant="secondary">1,234</Badge>
        </div>
            <div className="flex justify-between">
              <span>Active Users</span>
              <Badge variant="default">1,156</Badge>
      </div>
            <div className="flex justify-between">
              <span>Pending Approval</span>
              <Badge variant="destructive">23</Badge>
            </div>
          </div>
        </CardContent>
            </Card>
      <Card>
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Role Management
                </CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Roles</span>
              <Badge variant="secondary">4</Badge>
          </div>
            <div className="flex justify-between">
              <span>Active Roles</span>
              <Badge variant="default">4</Badge>
        </div>
            <div className="flex justify-between">
              <span>Total Permissions</span>
              <Badge variant="outline">29</Badge>
            </div>
          </div>
        </CardContent>
            </Card>
      <Card>
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Analytics
                </CardTitle>
          <CardDescription>System performance and metrics</CardDescription>
              </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>System Status</span>
              <Badge variant="default">Healthy</Badge>
          </div>
            <div className="flex justify-between">
              <span>Uptime</span>
              <Badge variant="secondary">99.9%</Badge>
        </div>
            <div className="flex justify-between">
              <span>Active Sessions</span>
              <Badge variant="outline">156</Badge>
            </div>
          </div>
        </CardContent>
            </Card>
    </div>
  );

  const renderMarketingSection = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Promotions
                </CardTitle>
          <CardDescription>Manage promotional campaigns</CardDescription>
              </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Promotions</span>
              <Badge variant="default">12</Badge>
          </div>
            <div className="flex justify-between">
              <span>Total Clicks</span>
              <Badge variant="secondary">45,678</Badge>
        </div>
            <div className="flex justify-between">
              <span>Conversion Rate</span>
              <Badge variant="outline">3.2%</Badge>
            </div>
          </div>
        </CardContent>
            </Card>
      <Card>
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Affiliates
                </CardTitle>
          <CardDescription>Affiliate program management</CardDescription>
              </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Affiliates</span>
              <Badge variant="default">89</Badge>
          </div>
            <div className="flex justify-between">
              <span>Total Commissions</span>
              <Badge variant="secondary">$12,345</Badge>
        </div>
            <div className="flex justify-between">
              <span>Pending Payouts</span>
              <Badge variant="destructive">$2,345</Badge>
            </div>
          </div>
        </CardContent>
            </Card>
      <Card>
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Marketing Analytics
                </CardTitle>
          <CardDescription>Marketing performance metrics</CardDescription>
              </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Campaign Reach</span>
              <Badge variant="default">125K</Badge>
            </div>
            <div className="flex justify-between">
              <span>Engagement Rate</span>
              <Badge variant="secondary">4.5%</Badge>
            </div>
            <div className="flex justify-between">
              <span>ROI</span>
              <Badge variant="outline">320%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      );

  const renderFinanceSection = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Financial performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Monthly Revenue</span>
              <Badge variant="default">$45,231</Badge>
            </div>
            <div className="flex justify-between">
              <span>Growth Rate</span>
              <Badge variant="secondary">+15.3%</Badge>
          </div>
            <div className="flex justify-between">
              <span>Profit Margin</span>
              <Badge variant="outline">68%</Badge>
        </div>
          </div>
        </CardContent>
          </Card>
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Processing
              </CardTitle>
          <CardDescription>Payment and transaction management</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Pending Payments</span>
              <Badge variant="destructive">23</Badge>
            </div>
            <div className="flex justify-between">
              <span>Processed Today</span>
              <Badge variant="default">156</Badge>
        </div>
            <div className="flex justify-between">
              <span>Success Rate</span>
              <Badge variant="secondary">98.5%</Badge>
      </div>
          </div>
        </CardContent>
          </Card>
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
              </CardTitle>
          <CardDescription>Invoice and billing management</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Outstanding Invoices</span>
              <Badge variant="destructive">$12,345</Badge>
            </div>
            <div className="flex justify-between">
              <span>Paid This Month</span>
              <Badge variant="default">$34,567</Badge>
        </div>
            <div className="flex justify-between">
              <span>Overdue</span>
              <Badge variant="destructive">$2,345</Badge>
      </div>
          </div>
        </CardContent>
      </Card>
        </div>
  );

  const renderSupportSection = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
              </CardTitle>
          <CardDescription>Customer support management</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Open Tickets</span>
              <Badge variant="destructive">45</Badge>
            </div>
            <div className="flex justify-between">
              <span>Resolved Today</span>
              <Badge variant="default">23</Badge>
        </div>
            <div className="flex justify-between">
              <span>Avg Response Time</span>
              <Badge variant="secondary">2.3h</Badge>
      </div>
          </div>
        </CardContent>
          </Card>
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            User Support
              </CardTitle>
          <CardDescription>User account assistance</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Account Issues</span>
              <Badge variant="destructive">12</Badge>
        </div>
            <div className="flex justify-between">
              <span>Password Resets</span>
              <Badge variant="default">8</Badge>
      </div>
            <div className="flex justify-between">
              <span>Verification Requests</span>
              <Badge variant="secondary">5</Badge>
        </div>
      </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>System notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Pending Notifications</span>
              <Badge variant="destructive">34</Badge>
                </div>
            <div className="flex justify-between">
              <span>Sent Today</span>
              <Badge variant="default">156</Badge>
            </div>
            <div className="flex justify-between">
              <span>Delivery Rate</span>
              <Badge variant="secondary">99.2%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your role-based dashboard
          </p>
        </div>
      </div>

      {visibleSections.length > 1 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {visibleSections.includes('overview') && (
              <TabsTrigger value="overview">Overview</TabsTrigger>
            )}
            {visibleSections.includes('management') && (
              <TabsTrigger value="management">Management</TabsTrigger>
            )}
            {visibleSections.includes('marketing') && (
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            )}
            {visibleSections.includes('finance') && (
              <TabsTrigger value="finance">Finance</TabsTrigger>
            )}
            {visibleSections.includes('support') && (
              <TabsTrigger value="support">Support</TabsTrigger>
            )}
          </TabsList>

          {visibleSections.includes('overview') && (
            <TabsContent value="overview" className="space-y-4">
              {renderOverviewSection()}
            </TabsContent>
          )}

          {visibleSections.includes('management') && (
            <TabsContent value="management" className="space-y-4">
              {renderManagementSection()}
            </TabsContent>
          )}

          {visibleSections.includes('marketing') && (
            <TabsContent value="marketing" className="space-y-4">
              {renderMarketingSection()}
            </TabsContent>
          )}

          {visibleSections.includes('finance') && (
            <TabsContent value="finance" className="space-y-4">
              {renderFinanceSection()}
            </TabsContent>
          )}

          {visibleSections.includes('support') && (
            <TabsContent value="support" className="space-y-4">
              {renderSupportSection()}
            </TabsContent>
          )}
        </Tabs>
      ) : (
        // Single section view
        <div className="space-y-4">
          {visibleSections.includes('marketing') && renderMarketingSection()}
          {visibleSections.includes('finance') && renderFinanceSection()}
          {visibleSections.includes('support') && renderSupportSection()}
        </div>
      )}
    </div>
  );
};

export default RoleBasedDashboard;
