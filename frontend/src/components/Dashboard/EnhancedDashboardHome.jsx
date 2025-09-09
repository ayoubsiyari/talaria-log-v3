import { useState, useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  UserPlus,
  AlertTriangle,
  Activity,
  Target,
  ArrowRight,
  BarChart3,
  Tag,
  Settings,
  Eye,
  Plus,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  FileText,
  Mail,
  Share2,
  Maximize2,
  MoreVertical,
  Bell,
  Clock,
  TrendingDown,
  Info,
  ExternalLink
} from 'lucide-react'
import subscriptionService from '@/services/subscriptionService'
import { LOADING_STATES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EnhancedDashboardHome = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING)
      setError(null)
      
      const days = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 : 
                   timeRange === '30d' ? 30 : 
                   timeRange === '90d' ? 90 : 365
      
      const overviewData = await subscriptionService.getSubscriptionOverview(days)
      setDashboardData(overviewData)
      setLoadingState(LOADING_STATES.SUCCESS)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || ERROR_MESSAGES.DEFAULT)
      setLoadingState(LOADING_STATES.ERROR)
    }
  }

  // Load data on component mount and time range change
  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  // Auto-refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
  }

  // Export functionality
  const handleExport = async (format) => {
    try {
      const days = timeRange === '24h' ? 1 : 
                   timeRange === '7d' ? 7 : 
                   timeRange === '30d' ? 30 : 
                   timeRange === '90d' ? 90 : 365
      
      const exportedData = await subscriptionService.exportSubscriptionData(format, { days })
      
      // Create and download file
      const blob = new Blob([exportedData], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscription-data-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log(`Dashboard exported as ${format}`)
    } catch (error) {
      console.error('Error exporting dashboard:', error)
    }
  }

  // Get stats cards data from backend
  const getStatsCards = () => {
    if (!dashboardData) return []

    const stats = subscriptionService.getDashboardStats(dashboardData)
    if (!stats) return []

    return [
      {
        title: "Total Users",
        value: subscriptionService.formatNumber(stats.totalUsers),
        change: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
        changeType: stats.growthRate >= 0 ? "positive" : "negative",
        icon: Users,
        description: "Active registered users",
        link: "users",
        linkText: "View Users",
        trend: [65, 68, 70, 72, 75, 78, 82], // Placeholder trend data
        actions: ['export', 'details', 'share']
      },
      {
        title: "Active Subscriptions",
        value: subscriptionService.formatNumber(stats.activeSubscriptions),
        change: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
        changeType: stats.growthRate >= 0 ? "positive" : "negative",
        icon: CreditCard,
        description: "Currently paying subscribers",
        link: "subscriptions",
        linkText: "Manage Subscriptions",
        trend: [45, 48, 47, 50, 52, 54, 56], // Placeholder trend data
        actions: ['export', 'details', 'alert']
      },
      {
        title: "Monthly Revenue",
        value: subscriptionService.formatCurrency(stats.monthlyRevenue),
        change: `${stats.mrrChange > 0 ? '+' : ''}${stats.mrrChange.toFixed(1)}%`,
        changeType: stats.mrrChange >= 0 ? "positive" : "negative",
        icon: DollarSign,
        description: "This month's recurring revenue",
        link: "analytics",
        linkText: "View Analytics",
        trend: [30, 35, 38, 42, 48, 52, 58], // Placeholder trend data
        actions: ['export', 'forecast', 'compare']
      },
      {
        title: "Churn Rate",
        value: subscriptionService.formatPercentage(stats.churnRate),
        change: `${stats.churnChange > 0 ? '+' : ''}${stats.churnChange.toFixed(1)}%`,
        changeType: stats.churnChange <= 0 ? "positive" : "negative", // Lower churn is positive
        icon: TrendingDown,
        description: "Monthly subscription cancellations",
        link: "subscriptions",
        linkText: "View Details",
        trend: [8, 7, 6.5, 5, 4, 3.2, 2.4], // Placeholder trend data
        actions: ['export', 'alert', 'analyze']
      }
    ]
  }

  // Get recent activities from backend
  const getRecentActivities = () => {
    if (!dashboardData) return []

    const events = subscriptionService.getRecentEvents(dashboardData)
    return events.slice(0, 5).map(event => ({
      id: event.id,
      type: event.event_type,
      message: `${subscriptionService.getEventTypeDisplayName(event.event_type)}: ${event.plan_name || 'N/A'}`,
      time: new Date(event.event_timestamp).toLocaleString(),
      icon: UserPlus, // Placeholder icon
      color: "text-blue-600",
      link: "subscriptions",
      action: "View Details",
      priority: "medium"
    }))
  }

  // Use live data for recent activities
  const recentActivities = getRecentActivities()

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your trading journal platform.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Dashboard</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Email Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button 
            variant="outline" 
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Full Screen */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => document.documentElement.requestFullscreen()}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Full screen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Alert Banner for Important Notifications */}
      {showNotifications && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium">3 payments failed in the last hour</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => onNavigate('subscriptions')}>
                Review Now
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNotifications(false)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards with Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingState === LOADING_STATES.LOADING ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-4">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={loadDashboardData}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          getStatsCards().map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 group relative">
              {/* Card Actions Menu */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Metric
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      Set Alert
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Analytics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                
                {/* Mini Sparkline Chart */}
                <div className="flex items-end h-8 mt-2 space-x-1">
                  {stat.trend.map((value, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-sm hover:bg-primary/30 transition-colors"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{stat.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => onNavigate(stat.link)}
                  >
                    <span className="text-xs mr-1">{stat.linkText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabbed Content Area */}
      <Tabs defaultValue="activity" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </div>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Live</Badge>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('analytics')}>
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 group">
                      <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {activity.time}
                          </span>
                          {activity.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => onNavigate(activity.link)}
                        >
                          {activity.action}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Load More Button */}
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  Load More Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Subscription content */}
              <p className="text-muted-foreground">Subscription breakdown will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Performance content */}
              <p className="text-muted-foreground">Performance metrics will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Alerts content */}
              <p className="text-muted-foreground">System alerts will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Grid with More Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => onNavigate('users')}>
              <UserPlus className="w-5 h-5 mb-2" />
              <span className="text-xs">Add User</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => onNavigate('subscriptions')}>
              <CreditCard className="w-5 h-5 mb-2" />
              <span className="text-xs">New Plan</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => onNavigate('promotions')}>
              <Tag className="w-5 h-5 mb-2" />
              <span className="text-xs">Create Promo</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => handleExport('pdf')}>
              <FileText className="w-5 h-5 mb-2" />
              <span className="text-xs">Generate Report</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4">
              <Mail className="w-5 h-5 mb-2" />
              <span className="text-xs">Send Email</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => onNavigate('settings')}>
              <Settings className="w-5 h-5 mb-2" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedDashboardHome

