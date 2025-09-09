import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalProfit: 15420.50,
    totalTrades: 127,
    winRate: 68.5,
    avgReturn: 12.3,
    monthlyProfit: 3240.75,
    openPositions: 8
  });

  const [recentTrades, setRecentTrades] = useState([
    { id: 1, symbol: 'AAPL', type: 'BUY', amount: 1500, profit: 245.50, status: 'closed', date: '2024-01-15' },
    { id: 2, symbol: 'TSLA', type: 'SELL', amount: 2200, profit: -120.30, status: 'closed', date: '2024-01-14' },
    { id: 3, symbol: 'GOOGL', type: 'BUY', amount: 1800, profit: 0, status: 'open', date: '2024-01-13' },
    { id: 4, symbol: 'MSFT', type: 'BUY', amount: 2100, profit: 89.75, status: 'closed', date: '2024-01-12' },
  ]);

  const profitData = [
    { month: 'Jan', profit: 3200 },
    { month: 'Feb', profit: 2800 },
    { month: 'Mar', profit: 4100 },
    { month: 'Apr', profit: 3800 },
    { month: 'May', profit: 5200 },
    { month: 'Jun', profit: 4800 },
  ];

  const tradeData = [
    { day: 'Mon', trades: 12 },
    { day: 'Tue', trades: 8 },
    { day: 'Wed', trades: 15 },
    { day: 'Thu', trades: 10 },
    { day: 'Fri', trades: 18 },
    { day: 'Sat', trades: 5 },
    { day: 'Sun', trades: 3 },
  ];

  const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${value.toLocaleString()}</div>
        <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {change}% from last month
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your trading overview.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Profit"
          value={stats.totalProfit}
          change={12.5}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          change={8.2}
          icon={BarChart3}
          trend="up"
        />
        <StatCard
          title="Win Rate"
          value={stats.winRate}
          change={-2.1}
          icon={Target}
          trend="down"
        />
        <StatCard
          title="Open Positions"
          value={stats.openPositions}
          change={15.3}
          icon={Calendar}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>Monthly profit performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trades Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Trades</CardTitle>
            <CardDescription>Number of trades per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your latest trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-sm text-gray-500">{trade.date}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">${trade.amount.toLocaleString()}</div>
                    <div className={`text-sm ${trade.profit > 0 ? 'text-green-600' : trade.profit < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={trade.status === 'open' ? 'secondary' : 'default'}>
                    {trade.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline">View All Trades</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
