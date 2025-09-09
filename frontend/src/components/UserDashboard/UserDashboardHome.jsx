import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function UserDashboardHome({ onNavigate }) {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    monthlyGoal: 0
  })
  const [recentTrades, setRecentTrades] = useState([])
  const [goals, setGoals] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Simulate API call - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalTrades: 24,
          winRate: 68.5,
          totalProfit: 2847.50,
          monthlyGoal: 75
        })
        
        setRecentTrades([
          {
            id: 1,
            symbol: 'AAPL',
            type: 'BUY',
            amount: 150.25,
            profit: 12.50,
            date: '2024-01-15',
            status: 'closed'
          },
          {
            id: 2,
            symbol: 'TSLA',
            type: 'SELL',
            amount: 245.80,
            profit: -8.75,
            date: '2024-01-14',
            status: 'closed'
          },
          {
            id: 3,
            symbol: 'GOOGL',
            type: 'BUY',
            amount: 142.30,
            profit: 0,
            date: '2024-01-13',
            status: 'open'
          }
        ])
        
        setGoals([
          {
            id: 1,
            title: 'Monthly Profit Target',
            target: 5000,
            current: 2847.50,
            progress: 57
          },
          {
            id: 2,
            title: 'Win Rate Goal',
            target: 70,
            current: 68.5,
            progress: 98
          },
          {
            id: 3,
            title: 'Trades This Month',
            target: 30,
            current: 24,
            progress: 80
          }
        ])
        
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your trading account today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => onNavigate('journals')}>
            <FileText className="h-4 w-4 mr-2" />
            New Trade
          </Button>
          <Button variant="outline" onClick={() => onNavigate('analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trades
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Goal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyGoal}%</div>
            <p className="text-xs text-muted-foreground">
              Progress to target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                Your latest trading activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{trade.symbol}</span>
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                            {trade.type}
                          </Badge>
                          <Badge variant={trade.status === 'closed' ? 'outline' : 'default'}>
                            {trade.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${trade.amount} • {trade.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit}
                      </span>
                      {trade.profit >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => onNavigate('journals')}>
                  View All Trades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals & Quick Actions */}
        <div className="space-y-6">
          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Goals Progress</CardTitle>
              <CardDescription>
                Track your monthly targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('journals')}>
                <FileText className="h-4 w-4 mr-2" />
                Add New Trade
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('subscription')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

