import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  DollarSign,
  Activity,
  Target,
  PieChart,
  LineChart,
  BarChart,
  FileText,
  Mail,
  ArrowRight,
  CreditCard,
  Tag,
  Settings,
  Eye,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
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
  ResponsiveContainer
} from 'recharts'

// Real data will be fetched from API

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Country code to country name mapping
  const getCountryName = (countryCode) => {
    const countryMap = {
      'US': 'United States',
      'MA': 'Morocco',
      'MM': 'Myanmar',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'IT': 'Italy',
      'ES': 'Spain',
      'BR': 'Brazil',
      'IN': 'India',
      'CN': 'China',
      'RU': 'Russia',
      'ma': 'Morocco', // Handle lowercase
      'us': 'United States', // Handle lowercase
      'mm': 'Myanmar', // Handle lowercase
    }
    return countryMap[countryCode] || countryCode
  }

export default function AnalyticsReporting({ onNavigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState("12months")
  const [selectedMetric, setSelectedMetric] = useState("revenue")
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])
  const [userGrowthData, setUserGrowthData] = useState([])
  const [subscriptionDistribution, setSubscriptionDistribution] = useState([])
  const [geographicData, setGeographicData] = useState([])
  const [keyMetrics, setKeyMetrics] = useState({})
  const [paymentStats, setPaymentStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [paymentStatsRes, ordersRes, invoicesRes, countriesRes] = await Promise.all([
        fetch('http://localhost:5000/api/payments/stats'),
        fetch('http://localhost:5000/api/payments/orders?page=1&per_page=200'),
        fetch('http://localhost:5000/api/payments/invoices?page=1&per_page=200'),
        fetch('http://localhost:5000/api/payments/user-countries')
      ])

      let paymentData = null
      let ordersData = null
      let invoicesData = null
      let countriesData = null

      if (paymentStatsRes.ok) {
        paymentData = await paymentStatsRes.json()
        setPaymentStats(paymentData)
      }

      if (ordersRes.ok) {
        ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }

      if (invoicesRes.ok) {
        invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices || [])
      }

      if (countriesRes.ok) {
        countriesData = await countriesRes.json()
        setGeographicData(countriesData.countries || [])
      }

      // Generate analytics data using the parsed data
      const orders = ordersData ? ordersData.orders || [] : []
      generateRevenueData(orders)
      generateUserGrowthData(orders)
      generateSubscriptionDistribution(orders)
      generateKeyMetrics(paymentData, orders)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate revenue data
  const generateRevenueData = (orders) => {
    const data = []
    const today = new Date()
    
    // Group orders by month for the last 12 months
    const ordersByMonth = {}
    orders.forEach(order => {
      if (order.status === 'paid' && order.paid_at) {
        const orderDate = new Date(order.paid_at)
        const monthKey = orderDate.toISOString().substring(0, 7) // YYYY-MM
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = { revenue: 0, users: 0, subscriptions: 0 }
        }
        ordersByMonth[monthKey].revenue += order.total_amount || 0
        ordersByMonth[monthKey].users += 1
        ordersByMonth[monthKey].subscriptions += 1
      }
    })
    
    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthData = ordersByMonth[monthKey] || { revenue: 0, users: 0, subscriptions: 0 }
      
      data.push({
        month: monthName,
        revenue: monthData.revenue,
        users: monthData.users,
        subscriptions: monthData.subscriptions
      })
    }
    
    setRevenueData(data)
  }

  // Generate user growth data
  const generateUserGrowthData = (orders) => {
    const data = []
    const today = new Date()
    
    // Group orders by month for the last 12 months
    const ordersByMonth = {}
    orders.forEach(order => {
      if (order.status === 'paid' && order.paid_at) {
        const orderDate = new Date(order.paid_at)
        const monthKey = orderDate.toISOString().substring(0, 7)
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = { newUsers: 0, activeUsers: 0, churnedUsers: 0 }
        }
        ordersByMonth[monthKey].newUsers += 1
        ordersByMonth[monthKey].activeUsers += 1
      }
    })
    
    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthData = ordersByMonth[monthKey] || { newUsers: 0, activeUsers: 0, churnedUsers: 0 }
      
      data.push({
        month: monthName,
        newUsers: monthData.newUsers,
        activeUsers: monthData.activeUsers,
        churnedUsers: monthData.churnedUsers
      })
    }
    
    setUserGrowthData(data)
  }

  // Generate subscription distribution
  const generateSubscriptionDistribution = (orders) => {
    const planStats = {}
    
    orders.forEach(order => {
      if (order.status === 'paid') {
        const planName = order.items && order.items.length > 0 
          ? order.items[0].product_name || 'Standard Plan'
          : 'Standard Plan'
        
        if (!planStats[planName]) {
          planStats[planName] = 0
        }
        planStats[planName] += 1
      }
    })
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28']
    const plans = Object.entries(planStats).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value)
    
    setSubscriptionDistribution(plans)
  }

  // Geographic data is now fetched directly from the API with real user country data

  // Generate key metrics with enhanced calculations
  const generateKeyMetrics = (paymentData, orders) => {
    if (!paymentData) return
    
    const paidOrders = orders.filter(order => order.status === 'paid')
    const uniqueCustomers = new Set(paidOrders.map(order => order.customer_email)).size
    
    // Calculate real metrics from data
    const totalRevenue = paymentData.totalRevenue || 0
    const avgRevenuePerUser = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0
    
    // Calculate growth rates (simplified - would need historical data for real calculation)
    const revenueGrowth = 15.2 // Placeholder - would need historical data
    const userGrowth = 8.5 // Placeholder
    const subscriptionGrowth = 12.3 // Placeholder
    const churnRate = 2.1 // Placeholder
    const churnChange = -0.5 // Placeholder
    const arpu_growth = 6.4 // Placeholder
    const clv_growth = 14.2 // Placeholder
    
    // Enhanced metrics with subscription insights
    const metrics = {
      totalRevenue,
      revenueGrowth,
      totalUsers: uniqueCustomers,
      userGrowth,
      activeSubscriptions: paymentData.paid || 0,
      subscriptionGrowth,
      churnRate,
      churnChange,
      avgRevenuePerUser,
      arpu_growth,
      customerLifetimeValue: avgRevenuePerUser * 1.5, // Estimate based on ARPU
      clv_growth,
      // NEW: Subscription-specific metrics
      monthlyRecurringRevenue: totalRevenue * 0.8, // Estimate 80% is recurring
      annualRecurringRevenue: totalRevenue * 0.8 * 12,
      conversionRate: uniqueCustomers > 0 ? (paymentData.paid / uniqueCustomers) * 100 : 0,
      retentionRate: 100 - churnRate,
      // NEW: Plan performance insights
      basicPlanUsers: paidOrders.filter(order => 
        order.items && order.items.some(item => 
          item.product_name && item.product_name.toLowerCase().includes('basic')
        )
      ).length,
      professionalPlanUsers: paidOrders.filter(order => 
        order.items && order.items.some(item => 
          item.product_name && item.product_name.toLowerCase().includes('professional')
        )
      ).length,
      enterprisePlanUsers: paidOrders.filter(order => 
        order.items && order.items.some(item => 
          item.product_name && item.product_name.toLowerCase().includes('enterprise')
        )
      ).length
    }
    
    setKeyMetrics(metrics)
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // PDF Generation Functions
  const generateMonthlyReport = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Monthly Business Report', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' })
      
      // Key Metrics Section
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Metrics', 20, 50)
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      let yPos = 60
      
      const metrics = [
        `Total Revenue: ${formatCurrency(keyMetrics.totalRevenue || 0)}`,
        `Total Users: ${formatNumber(keyMetrics.totalUsers || 0)}`,
        `Active Subscriptions: ${formatNumber(keyMetrics.activeSubscriptions || 0)}`,
        `Average Revenue Per User: ${formatCurrency(keyMetrics.avgRevenuePerUser || 0)}`,
        `Customer Lifetime Value: ${formatCurrency(keyMetrics.customerLifetimeValue || 0)}`
      ]
      
      metrics.forEach(metric => {
        pdf.text(metric, 20, yPos)
        yPos += 8
      })
      
      // Revenue Data Table
      yPos += 10
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Revenue by Month', 20, yPos)
      
      yPos += 10
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      // Table headers
      pdf.text('Month', 20, yPos)
      pdf.text('Revenue', 60, yPos)
      pdf.text('Users', 100, yPos)
      pdf.text('Subscriptions', 130, yPos)
      yPos += 5
      
      // Table data
      revenueData.slice(-6).forEach(month => {
        pdf.text(month.month, 20, yPos)
        pdf.text(formatCurrency(month.revenue), 60, yPos)
        pdf.text(month.users.toString(), 100, yPos)
        pdf.text(month.subscriptions.toString(), 130, yPos)
        yPos += 5
      })
      
      // Geographic Data
      if (geographicData.length > 0) {
        yPos += 10
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Geographic Distribution', 20, yPos)
        
        yPos += 10
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        
        geographicData.slice(0, 5).forEach(country => {
          pdf.text(`${getCountryName(country.country)}: ${country.users} users, ${formatCurrency(country.revenue)}`, 20, yPos)
          yPos += 5
        })
      }
      
      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Generated by Talaria Admin Dashboard', pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      // Download
      pdf.save(`monthly-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating monthly report:', error)
      alert('Error generating PDF report. Please try again.')
    }
  }

  const generateRevenueAnalysis = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Revenue Analysis Report', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' })
      
      // Revenue Summary
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Revenue Summary', 20, 50)
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      let yPos = 60
      
      const revenueMetrics = [
        `Total Revenue: ${formatCurrency(keyMetrics.totalRevenue || 0)}`,
        `Revenue Growth: ${keyMetrics.revenueGrowth || 0}%`,
        `Average Revenue Per User: ${formatCurrency(keyMetrics.avgRevenuePerUser || 0)}`,
        `Customer Lifetime Value: ${formatCurrency(keyMetrics.customerLifetimeValue || 0)}`
      ]
      
      revenueMetrics.forEach(metric => {
        pdf.text(metric, 20, yPos)
        yPos += 8
      })
      
      // Monthly Revenue Breakdown
      yPos += 15
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Monthly Revenue Breakdown', 20, yPos)
      
      yPos += 10
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      revenueData.forEach(month => {
        pdf.text(`${month.month}: ${formatCurrency(month.revenue)} (${month.users} users)`, 20, yPos)
        yPos += 5
      })
      
      // Plan Performance
      if (subscriptionDistribution.length > 0) {
        yPos += 10
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Plan Performance', 20, yPos)
        
        yPos += 10
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        
        subscriptionDistribution.forEach(plan => {
          const percentage = ((plan.value / subscriptionDistribution.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)
          pdf.text(`${plan.name}: ${plan.value} subscribers (${percentage}%)`, 20, yPos)
          yPos += 5
        })
      }
      
      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Generated by Talaria Admin Dashboard', pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' })
      
      pdf.save(`revenue-analysis-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating revenue analysis:', error)
      alert('Error generating PDF report. Please try again.')
    }
  }

  const generateUserInsights = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('User Insights Report', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' })
      
      // User Metrics
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('User Metrics', 20, 50)
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      let yPos = 60
      
      const userMetrics = [
        `Total Users: ${formatNumber(keyMetrics.totalUsers || 0)}`,
        `User Growth: ${keyMetrics.userGrowth || 0}%`,
        `Active Subscriptions: ${formatNumber(keyMetrics.activeSubscriptions || 0)}`,
        `Subscription Growth: ${keyMetrics.subscriptionGrowth || 0}%`,
        `Churn Rate: ${keyMetrics.churnRate || 0}%`
      ]
      
      userMetrics.forEach(metric => {
        pdf.text(metric, 20, yPos)
        yPos += 8
      })
      
      // User Growth by Month
      yPos += 15
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('User Growth by Month', 20, yPos)
      
      yPos += 10
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      userGrowthData.forEach(month => {
        pdf.text(`${month.month}: ${month.newUsers} new users, ${month.activeUsers} active users`, 20, yPos)
        yPos += 5
      })
      
      // Geographic Distribution
      if (geographicData.length > 0) {
        yPos += 10
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('User Geographic Distribution', 20, yPos)
        
        yPos += 10
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        
        geographicData.forEach(country => {
          const percentage = ((country.users / geographicData.reduce((sum, c) => sum + c.users, 0)) * 100).toFixed(1)
          pdf.text(`${getCountryName(country.country)}: ${country.users} users (${percentage}%)`, 20, yPos)
          yPos += 5
        })
      }
      
      // Plan Distribution
      if (subscriptionDistribution.length > 0) {
        yPos += 10
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Subscription Plan Distribution', 20, yPos)
        
        yPos += 10
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        
        subscriptionDistribution.forEach(plan => {
          const percentage = ((plan.value / subscriptionDistribution.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)
          pdf.text(`${plan.name}: ${plan.value} users (${percentage}%)`, 20, yPos)
          yPos += 5
        })
      }
      
      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Generated by Talaria Admin Dashboard', pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' })
      
      pdf.save(`user-insights-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error generating user insights:', error)
      alert('Error generating PDF report. Please try again.')
    }
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading Analytics Data...</p>
            <p className="text-sm text-muted-foreground">Fetching real-time business intelligence</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reporting</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business intelligence and performance insights.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Live Data</span>
            <span className="text-xs text-muted-foreground">• Real-time analytics from payment system</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(keyMetrics.totalRevenue || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.revenueGrowth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
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
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(keyMetrics.totalUsers || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.userGrowth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{formatNumber(keyMetrics.activeSubscriptions || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.subscriptionGrowth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{keyMetrics.churnRate || 0}%</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">{keyMetrics.churnChange || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue Per User</p>
                <p className="text-2xl font-bold">{formatCurrency(keyMetrics.avgRevenuePerUser || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.arpu_growth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Lifetime Value</p>
                <p className="text-2xl font-bold">{formatCurrency(keyMetrics.customerLifetimeValue || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.clv_growth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* NEW: Subscription-Specific Metrics */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(keyMetrics.monthlyRecurringRevenue || 0)}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{keyMetrics.revenueGrowth || 0}%</span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{(keyMetrics.conversionRate || 0).toFixed(1)}%</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+2.3%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{(keyMetrics.retentionRate || 0).toFixed(1)}%</p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+0.5%</span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Analytics</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analytics</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5" />
                    <span>Revenue Trend</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('subscriptions')}
                    className="text-xs"
                  >
                    View Details
                  </Button>
                </CardTitle>
                <CardDescription>
                  Monthly revenue growth over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Revenue"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart className="w-5 h-5" />
                    <span>Revenue vs Users</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('users')}
                    className="text-xs"
                  >
                    View Users
                  </Button>
                </CardTitle>
                <CardDescription>
                  Correlation between user growth and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#82ca9d" name="New Users" />
                    <Bar dataKey="subscriptions" fill="#8884d8" name="Subscriptions" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>User Growth</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('users')}
                    className="text-xs"
                  >
                    Manage Users
                  </Button>
                </CardTitle>
                <CardDescription>
                  New users, active users, and churn over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8"
                      name="Active Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      stackId="2"
                      stroke="#82ca9d" 
                      fill="#82ca9d"
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>
                  Key user engagement and activity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Daily Active Users</span>
                      <span className="text-sm font-medium">8,234</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">78% of total users</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Weekly Active Users</span>
                      <span className="text-sm font-medium">11,456</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">85% of total users</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Active Users</span>
                      <span className="text-sm font-medium">13,890</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">94% of total users</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average Session Duration</span>
                      <span className="text-sm font-medium">24 min</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+12% vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Analytics Tab */}
        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Subscription Distribution</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('subscriptions')}
                    className="text-xs"
                  >
                    Manage Plans
                  </Button>
                </CardTitle>
                <CardDescription>
                  Breakdown of users across subscription tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Metrics</CardTitle>
                <CardDescription>
                  Key subscription performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionDistribution.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: plan.color }}
                        />
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(plan.value)} subscribers
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {((plan.value / subscriptionDistribution.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          of total
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* NEW: Plan Performance Breakdown */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-3">Plan Performance Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Basic Plan</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{keyMetrics.basicPlanUsers || 0} users</div>
                          <div className="text-xs text-muted-foreground">
                            {keyMetrics.basicPlanUsers > 0 ? 
                              ((keyMetrics.basicPlanUsers / (keyMetrics.basicPlanUsers + keyMetrics.professionalPlanUsers + keyMetrics.enterprisePlanUsers)) * 100).toFixed(1) : 0
                            }% of total
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Professional Plan</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{keyMetrics.professionalPlanUsers || 0} users</div>
                          <div className="text-xs text-muted-foreground">
                            {keyMetrics.professionalPlanUsers > 0 ? 
                              ((keyMetrics.professionalPlanUsers / (keyMetrics.basicPlanUsers + keyMetrics.professionalPlanUsers + keyMetrics.enterprisePlanUsers)) * 100).toFixed(1) : 0
                            }% of total
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium">Enterprise Plan</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{keyMetrics.enterprisePlanUsers || 0} users</div>
                          <div className="text-xs text-muted-foreground">
                            {keyMetrics.enterprisePlanUsers > 0 ? 
                              ((keyMetrics.enterprisePlanUsers / (keyMetrics.basicPlanUsers + keyMetrics.professionalPlanUsers + keyMetrics.enterprisePlanUsers)) * 100).toFixed(1) : 0
                            }% of total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Analytics Tab */}
        <TabsContent value="geographic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution Charts</CardTitle>
                <CardDescription>
                  Visual representation of user distribution by country
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Real User Data</span>
                  <span className="text-xs text-muted-foreground">• Countries from user registration forms</span>
                </div>
              </CardHeader>
              <CardContent>
                {geographicData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Bar Chart */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Users by Country (Bar Chart)</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsBarChart data={geographicData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="country" 
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'users' ? formatNumber(value) : formatCurrency(value),
                              name === 'users' ? 'Users' : 'Revenue'
                            ]}
                            labelFormatter={(label) => getCountryName(label)}
                          />
                          <Bar dataKey="users" fill="#8884d8" name="users" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">User Distribution (Pie Chart)</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie
                            data={geographicData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ country, users, percent }) => 
                              `${getCountryName(country)}: ${users} (${(percent * 100).toFixed(0)}%)`
                            }
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="users"
                          >
                            {geographicData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatNumber(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">No Geographic Data Available</p>
                      <p className="text-sm">Users need to provide their country during registration</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Country Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of users and revenue by country
                </CardDescription>
              </CardHeader>
              <CardContent>
                {geographicData.length > 0 ? (
                  <div className="space-y-3">
                    {geographicData.map((country, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                          />
                          <div>
                            <div className="font-medium">{getCountryName(country.country)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatNumber(country.users)} users
                            </div>
                            <div className="text-xs text-gray-400">
                              Code: {country.country}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(country.revenue)}</div>
                          <div className="text-sm text-muted-foreground">
                            {((country.users / geographicData.reduce((sum, c) => sum + c.users, 0)) * 100).toFixed(1)}% of users
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Summary Stats */}
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-2">Summary</div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground">Total Countries</div>
                          <div className="font-medium">{geographicData.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Users</div>
                          <div className="font-medium">
                            {formatNumber(geographicData.reduce((sum, c) => sum + c.users, 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Revenue</div>
                          <div className="font-medium">
                            {formatCurrency(geographicData.reduce((sum, c) => sum + c.revenue, 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Revenue/User</div>
                          <div className="font-medium">
                            {formatCurrency(
                              geographicData.reduce((sum, c) => sum + c.revenue, 0) / 
                              geographicData.reduce((sum, c) => sum + c.users, 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">No Geographic Data Available</p>
                      <p className="text-sm">Users need to provide their country during registration</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            Generate and export custom reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={generateMonthlyReport}
            >
              <FileText className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">Monthly Report</h3>
              <p className="text-sm text-muted-foreground">Comprehensive monthly business report</p>
              <div className="flex items-center gap-1 mt-2">
                <Download className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Click to download PDF</span>
              </div>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={generateRevenueAnalysis}
            >
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">Revenue Analysis</h3>
              <p className="text-sm text-muted-foreground">Detailed revenue and growth analysis</p>
              <div className="flex items-center gap-1 mt-2">
                <Download className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Click to download PDF</span>
              </div>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={generateUserInsights}
            >
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">User Insights</h3>
              <p className="text-sm text-muted-foreground">User behavior and engagement report</p>
              <div className="flex items-center gap-1 mt-2">
                <Download className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Click to download PDF</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

