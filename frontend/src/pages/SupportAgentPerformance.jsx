import React, { useState, useEffect } from 'react';
import SupportAgentStats from '../components/Support/SupportAgentStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Star,
  Award,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supportService } from '../services/supportService';
import { toast } from 'sonner';

export default function SupportAgentPerformance() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    topPerformer: { rating: 0, name: '' },
    mostActive: { tickets: 0, name: '' },
    teamAverage: 0,
    activeAgents: 0,
    ratingDistribution: {
      '5': 0, '4': 0, '3': 0, '2': 0, '1': 0
    },
    insights: {
      improving: 0,
      completionRate: 0,
      trainingNeeded: 0
    }
  });

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      const response = await supportService.getSupportAgentStats();
      if (response.success && response.agents) {
        setAgents(response.agents);
        
        // Calculate real statistics
        const calculatedStats = calculateStats(response.agents);
        setStats(calculatedStats);
      } else {
        toast.error('Failed to load agent statistics');
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (agents) => {
    if (!agents || agents.length === 0) {
      return {
        topPerformer: { rating: 0, name: '' },
        mostActive: { tickets: 0, name: '' },
        teamAverage: 0,
        activeAgents: agents.length || 0,
        ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        insights: { improving: 0, completionRate: 0, trainingNeeded: 0 }
      };
    }

    // Find top performer
    const topPerformer = agents.reduce((best, current) => 
      current.average_rating > best.average_rating ? current : best
    );

    // Find most active
    const mostActive = agents.reduce((most, current) => 
      current.total_tickets > most.total_tickets ? current : most
    );

    // Calculate team average
    const totalRating = agents.reduce((sum, agent) => sum + agent.average_rating, 0);
    const teamAverage = agents.length > 0 ? totalRating / agents.length : 0;

    // Calculate rating distribution
    const ratingDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    agents.forEach(agent => {
      if (agent.rated_tickets > 0) {
        const rating = Math.round(agent.average_rating);
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating.toString()]++;
        }
      }
    });

    // Calculate insights
    const improving = agents.filter(agent => 
      agent.recent_average_rating > agent.average_rating
    ).length;

    const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
    const completedTickets = agents.reduce((sum, agent) => 
      sum + agent.closed_tickets + agent.resolved_tickets, 0
    );
    const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

    const trainingNeeded = agents.filter(agent => 
      agent.average_rating < 3.0 && agent.rated_tickets >= 5
    ).length;

    return {
      topPerformer: { 
        rating: topPerformer.average_rating, 
        name: topPerformer.full_name || topPerformer.username 
      },
      mostActive: { 
        tickets: mostActive.total_tickets, 
        name: mostActive.full_name || mostActive.username 
      },
      teamAverage,
      activeAgents: agents.length,
      ratingDistribution,
      insights: {
        improving,
        completionRate: Math.round(completionRate),
        trainingNeeded
      }
    };
  };

  const getRatingPercentage = (rating) => {
    const totalRatings = Object.values(stats.ratingDistribution).reduce((sum, count) => sum + count, 0);
    if (totalRatings === 0) return 0;
    return Math.round((stats.ratingDistribution[rating] / totalRatings) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Agent Performance</h1>
            <p className="text-gray-600 mt-2">Loading performance data...</p>
          </div>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Agent Performance</h1>
          <p className="text-gray-600 mt-2">
            Track and analyze your support team's performance with detailed metrics and rankings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Trophy className="w-4 h-4 mr-1" />
            Performance Dashboard
          </Badge>
          <button
            onClick={loadAgentData}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.topPerformer.rating.toFixed(1)}/5.0
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topPerformer.name || 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.mostActive.tickets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.mostActive.name || 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Average</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.teamAverage.toFixed(1)}/5.0
            </div>
            <p className="text-xs text-muted-foreground">
              Overall team rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Rankings */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          <h2 className="text-xl font-semibold">Agent Performance Rankings</h2>
        </div>
        
        <SupportAgentStats />
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Improving Performance</p>
                  <p className="text-sm text-green-600">
                    {stats.insights.improving} agent{stats.insights.improving !== 1 ? 's' : ''} improved their ratings this month
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Completion Rate</p>
                  <p className="text-sm text-blue-600">
                    {stats.insights.completionRate}% of tickets resolved
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Training Opportunity</p>
                  <p className="text-sm text-yellow-600">
                    {stats.insights.trainingNeeded} agent{stats.insights.trainingNeeded !== 1 ? 's' : ''} need additional training
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const percentage = getRatingPercentage(rating.toString());
                const color = rating === 5 ? 'bg-green-600' : 
                             rating === 4 ? 'bg-blue-600' : 
                             rating === 3 ? 'bg-yellow-600' : 
                             rating === 2 ? 'bg-orange-600' : 'bg-red-600';
                
                return (
                  <div key={rating} className="flex items-center justify-between">
                    <span className="text-sm">{rating} Star{rating !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all duration-300`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
