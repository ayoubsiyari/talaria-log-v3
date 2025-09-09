import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  CreditCard, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RevenueAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [planPerformance, setPlanPerformance] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState({});
  const chartRef = useRef(null);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [paymentStatsRes, ordersRes, invoicesRes] = await Promise.all([
        fetch('http://localhost:5000/api/payments/stats'),
        fetch('http://localhost:5000/api/payments/orders?page=1&per_page=200'),
        fetch('http://localhost:5000/api/payments/invoices?page=1&per_page=200')
      ]);

      let paymentData = null;
      let ordersData = null;
      let invoicesData = null;

      if (paymentStatsRes.ok) {
        paymentData = await paymentStatsRes.json();
        setPaymentStats(paymentData);
      }

      if (ordersRes.ok) {
        ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      if (invoicesRes.ok) {
        invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }

      // Generate analytics data using the parsed data
      const orders = ordersData ? ordersData.orders || [] : [];
      console.log('Revenue Analytics - Orders data:', orders.length, 'orders');
      console.log('Revenue Analytics - Payment data:', paymentData);
      
      generateRevenueAnalytics(orders);
      generateCustomerAnalytics(orders);
      generatePlanPerformance(orders);
      calculateGrowthMetrics(orders);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate revenue analytics data
  const generateRevenueAnalytics = (orders) => {
    console.log('Generating revenue analytics for', orders.length, 'orders');
    const data = [];
    const today = new Date();
    
    // Group orders by date for the last 30 days
    const ordersByDate = {};
    const paidOrders = orders.filter(order => order.status === 'paid' && order.paid_at);
    console.log('Paid orders with dates:', paidOrders.length);
    
    paidOrders.forEach(order => {
      const orderDate = new Date(order.paid_at).toISOString().split('T')[0];
      if (!ordersByDate[orderDate]) {
        ordersByDate[orderDate] = { revenue: 0, orders: 0, customers: new Set() };
      }
      ordersByDate[orderDate].revenue += order.total_amount || 0;
      ordersByDate[orderDate].orders += 1;
      ordersByDate[orderDate].customers.add(order.customer_email);
    });
    
    console.log('Orders by date:', Object.keys(ordersByDate).length, 'unique dates');
    
    // Generate data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = ordersByDate[dateStr] || { revenue: 0, orders: 0, customers: new Set() };
      
      data.push({
        date: dateStr,
        revenue: dayData.revenue,
        orders: dayData.orders,
        customers: dayData.customers.size,
        avgOrderValue: dayData.orders > 0 ? dayData.revenue / dayData.orders : 0
      });
    }
    
    console.log('Generated revenue data:', data.length, 'days');
    setRevenueData(data);
  };

  // Generate customer analytics
  const generateCustomerAnalytics = (orders) => {
    const customerStats = {};
    
    orders.forEach(order => {
      if (order.status === 'paid') {
        const email = order.customer_email;
        if (!customerStats[email]) {
          customerStats[email] = {
            email: email,
            totalSpent: 0,
            orders: 0,
            firstOrder: order.paid_at,
            lastOrder: order.paid_at,
            avgOrderValue: 0
          };
        }
        
        customerStats[email].totalSpent += order.total_amount || 0;
        customerStats[email].orders += 1;
        customerStats[email].lastOrder = order.paid_at;
        customerStats[email].avgOrderValue = customerStats[email].totalSpent / customerStats[email].orders;
      }
    });
    
    const customers = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent);
    setCustomerData(customers);
  };

  // Generate plan performance data
  const generatePlanPerformance = (orders) => {
    const planStats = {};
    
    orders.forEach(order => {
      if (order.status === 'paid') {
        // Extract plan from order items or use a default
        const planName = order.items && order.items.length > 0 
          ? order.items[0].product_name || 'Standard Plan'
          : 'Standard Plan';
        
        if (!planStats[planName]) {
          planStats[planName] = {
            name: planName,
            revenue: 0,
            orders: 0,
            customers: new Set()
          };
        }
        
        planStats[planName].revenue += order.total_amount || 0;
        planStats[planName].orders += 1;
        planStats[planName].customers.add(order.customer_email);
      }
    });
    
    const plans = Object.values(planStats).map(plan => ({
      ...plan,
      customers: plan.customers.size,
      avgOrderValue: plan.orders > 0 ? plan.revenue / plan.orders : 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    setPlanPerformance(plans);
  };

  // Calculate growth metrics
  const calculateGrowthMetrics = (orders) => {
    console.log('Calculating growth metrics for', orders.length, 'orders');
    const paidOrders = orders.filter(order => order.status === 'paid');
    console.log('Paid orders:', paidOrders.length);
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Revenue growth
    const last30DaysRevenue = paidOrders
      .filter(order => order.paid_at && new Date(order.paid_at) >= last30Days)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    const last7DaysRevenue = paidOrders
      .filter(order => order.paid_at && new Date(order.paid_at) >= last7Days)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Customer growth
    const uniqueCustomers = new Set(paidOrders.map(order => order.customer_email)).size;
    const last30DaysCustomers = new Set(
      paidOrders
        .filter(order => order.paid_at && new Date(order.paid_at) >= last30Days)
        .map(order => order.customer_email)
    ).size;
    
    const metrics = {
      totalRevenue: last30DaysRevenue,
      last7DaysRevenue: last7DaysRevenue,
      totalCustomers: uniqueCustomers,
      last30DaysCustomers: last30DaysCustomers,
      avgOrderValue: paidOrders.length > 0 ? last30DaysRevenue / paidOrders.length : 0,
      revenueGrowth: last7DaysRevenue > 0 ? ((last7DaysRevenue - (last30DaysRevenue - last7DaysRevenue) / 23) / (last30DaysRevenue - last7DaysRevenue) * 100) : 0
    };
    
    console.log('Growth metrics:', metrics);
    setGrowthMetrics(metrics);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading revenue analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-gray-600">Advanced revenue insights and performance metrics</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-600 font-medium">Live Analytics</span>
            <span className="text-xs text-gray-500">• Real-time revenue data analysis</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(growthMetrics.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(growthMetrics.revenueGrowth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(growthMetrics.totalCustomers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(growthMetrics.last30DaysCustomers || 0)} active last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(growthMetrics.avgOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="plans">Plan Performance</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Key revenue metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue (30d)</span>
                    <span className="font-bold">{formatCurrency(growthMetrics.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue (7d)</span>
                    <span className="font-bold">{formatCurrency(growthMetrics.last7DaysRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Order Value</span>
                    <span className="font-bold">{formatCurrency(growthMetrics.avgOrderValue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Orders</span>
                    <span className="font-bold">{formatNumber(orders.filter(o => o.status === 'paid').length)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="font-bold">
                      {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'paid').length / orders.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-gray-700 font-medium">Real Revenue Data</p>
                    <p className="text-xs text-gray-500">
                      {revenueData.length} days of actual order data
                    </p>
                    <p className="text-xs text-gray-400">
                      Total: {formatCurrency(revenueData.reduce((sum, day) => sum + day.revenue, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Highest value customers by total spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerData.slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {customer.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.email}</div>
                        <div className="text-sm text-gray-500">
                          {customer.orders} orders • {formatCurrency(customer.avgOrderValue)} avg
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-xs text-gray-500">
                        Last: {new Date(customer.lastOrder).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Performance</CardTitle>
              <CardDescription>Revenue breakdown by subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planPerformance.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-gray-500">
                          {plan.orders} orders • {plan.customers} customers
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(plan.revenue)}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(plan.avgOrderValue)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Detailed revenue analysis and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(growthMetrics.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue (30d)</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(growthMetrics.last7DaysRevenue || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Recent Revenue (7d)</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency((growthMetrics.totalRevenue || 0) / 30)}
                    </div>
                    <div className="text-sm text-gray-600">Daily Average</div>
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

export default RevenueAnalytics;
