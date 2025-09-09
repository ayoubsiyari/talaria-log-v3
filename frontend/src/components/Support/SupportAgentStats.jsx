import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Users,
  RefreshCw,
  Award,
  Clock,
  Zap,
  Heart,
  Target,
  Crown,
  Medal,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '../../services/supportService';

const SupportAgentStats = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('total_rating_points');
  const [filterBy, setFilterBy] = useState('all'); // all, excellent, good, needs_improvement

  useEffect(() => {
    loadAgentStats();
  }, []);

  const loadAgentStats = async () => {
    setLoading(true);
    try {
      const response = await supportService.getSupportAgentStats();
      if (response.success) {
        setAgents(response.agents);
      } else {
        toast.error('Failed to load agent statistics');
      }
    } catch (error) {
      console.error('Error loading agent stats:', error);
      toast.error('Failed to load agent statistics');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 4.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rating >= 3.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rating >= 2.0) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const getCompletionRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (agent) => {
    const rating = agent.average_rating;
    const completionRate = agent.completion_rate;
    const totalTickets = agent.total_tickets;
    
    if (rating >= 4.5 && completionRate >= 90 && totalTickets >= 10) return 'excellent';
    if (rating >= 4.0 && completionRate >= 80 && totalTickets >= 5) return 'good';
    if (rating >= 3.0 && completionRate >= 70) return 'average';
    return 'needs_improvement';
  };

  const getPerformanceBadge = (level) => {
    switch (level) {
      case 'excellent':
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0"><Crown className="h-3 w-3 mr-1" />Excellent</Badge>;
      case 'good':
        return <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0"><Medal className="h-3 w-3 mr-1" />Good</Badge>;
      case 'average':
        return <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0"><Target className="h-3 w-3 mr-1" />Average</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0"><TrendingUp className="h-3 w-3 mr-1" />Needs Improvement</Badge>;
    }
  };

  const getExcellenceScore = (agent) => {
    const rating = agent.average_rating;
    const completionRate = agent.completion_rate;
    const totalTickets = agent.total_tickets;
    const recentRating = agent.recent_average_rating;
    
    // Calculate excellence score (0-100)
    let score = 0;
    score += (rating / 5) * 40; // 40% weight for rating
    score += (completionRate / 100) * 30; // 30% weight for completion rate
    score += Math.min(totalTickets / 20, 1) * 20; // 20% weight for experience (capped at 20 tickets)
    score += (recentRating / 5) * 10; // 10% weight for recent performance
    
    return Math.round(score);
  };

  const filteredAndSortedAgents = [...agents]
    .filter(agent => {
      if (filterBy === 'all') return true;
      return getPerformanceLevel(agent) === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'average_rating':
          return b.average_rating - a.average_rating;
        case 'total_tickets':
          return b.total_tickets - a.total_tickets;
        case 'completion_rate':
          return b.completion_rate - a.completion_rate;
        case 'recent_rating':
          return b.recent_average_rating - a.recent_average_rating;
        case 'total_rating_points':
          return (b.total_rating_points || 0) - (a.total_rating_points || 0);
        case 'excellence_score':
          return getExcellenceScore(b) - getExcellenceScore(a);
        default:
          return b.average_rating - a.average_rating;
      }
    });

  const excellentAgents = agents.filter(agent => getPerformanceLevel(agent) === 'excellent');
  const goodAgents = agents.filter(agent => getPerformanceLevel(agent) === 'good');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Support Agent Performance</h2>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Agent Performance</h2>
          <p className="text-gray-600">Track and analyze support team performance</p>
        </div>
        <Button onClick={loadAgentStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Excellence Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Excellent Performers</p>
                <p className="text-2xl font-bold text-yellow-600">{excellentAgents.length}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Good Performers</p>
                <p className="text-2xl font-bold text-blue-600">{goodAgents.length}</p>
              </div>
              <Medal className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Agents</p>
                <p className="text-2xl font-bold text-green-600">{agents.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterBy === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterBy('all')}
        >
          All Agents ({agents.length})
        </Button>
        <Button
          variant={filterBy === 'excellent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterBy('excellent')}
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          <Crown className="h-4 w-4 mr-1" />
          Excellent ({excellentAgents.length})
        </Button>
        <Button
          variant={filterBy === 'good' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterBy('good')}
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          <Medal className="h-4 w-4 mr-1" />
          Good ({goodAgents.length})
        </Button>
        <Button
          variant={filterBy === 'needs_improvement' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterBy('needs_improvement')}
          className="bg-orange-100 text-orange-800 hover:bg-orange-200"
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Needs Improvement
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={sortBy === 'total_rating_points' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('total_rating_points')}
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          <Trophy className="h-4 w-4 mr-1" />
          Total Rating Points
        </Button>
        <Button
          variant={sortBy === 'excellence_score' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('excellence_score')}
        >
          <Zap className="h-4 w-4 mr-1" />
          Excellence Score
        </Button>
        <Button
          variant={sortBy === 'average_rating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('average_rating')}
        >
          <Star className="h-4 w-4 mr-1" />
          Best Rating
        </Button>
        <Button
          variant={sortBy === 'recent_rating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('recent_rating')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Recent Rating
        </Button>
        <Button
          variant={sortBy === 'total_tickets' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('total_tickets')}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Most Tickets
        </Button>
        <Button
          variant={sortBy === 'completion_rate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('completion_rate')}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Completion Rate
        </Button>
      </div>

      {/* Agent Cards */}
      <div className="grid gap-4">
        {filteredAndSortedAgents.map((agent, index) => {
          const performanceLevel = getPerformanceLevel(agent);
          const excellenceScore = getExcellenceScore(agent);
          const isExcellent = performanceLevel === 'excellent';
          
          return (
            <Card key={agent.id} className={`hover:shadow-md transition-shadow ${
              isExcellent ? 'ring-2 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-white' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      {index === 0 && isExcellent && (
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {index === 1 && isExcellent && (
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                          <Medal className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {index === 2 && isExcellent && (
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {index > 2 && (
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border-2 border-gray-200">
                          <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/api/avatars/${agent.id}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {agent.full_name?.charAt(0) || agent.username?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{agent.full_name || agent.username}</h3>
                            {getPerformanceBadge(performanceLevel)}
                          </div>
                          <p className="text-sm text-gray-600">{agent.email}</p>
                        </div>
                      </div>

                      {/* Excellence Score */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Excellence Score</span>
                          <span className="text-lg font-bold text-yellow-600">{excellenceScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              excellenceScore >= 90 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              excellenceScore >= 75 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              excellenceScore >= 60 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              'bg-gradient-to-r from-orange-400 to-orange-600'
                            }`}
                            style={{ width: `${excellenceScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{agent.total_tickets}</div>
                          <div className="text-xs text-gray-500">Total Tickets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {agent.closed_tickets + agent.resolved_tickets}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{agent.total_rating_points || 0}</div>
                          <div className="text-xs text-gray-500">Total Rating Points</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{agent.rated_tickets}</div>
                          <div className="text-xs text-gray-500">Rated Tickets</div>
                        </div>
                      </div>
                      
                      {/* Rating Breakdown */}
                      {agent.rating_breakdown && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Rating Breakdown:</p>
                          <div className="flex gap-2 text-xs">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              ⭐⭐⭐⭐⭐ {agent.rating_breakdown['5_star'] || 0}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              ⭐⭐⭐⭐ {agent.rating_breakdown['4_star'] || 0}
                            </span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              ⭐⭐⭐ {agent.rating_breakdown['3_star'] || 0}
                            </span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              ⭐⭐ {agent.rating_breakdown['2_star'] || 0}
                            </span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              ⭐ {agent.rating_breakdown['1_star'] || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="flex-shrink-0 text-right">
                    <div className="mb-2">
                      <Badge className={`${getRatingColor(agent.average_rating)} border`}>
                        {agent.average_rating.toFixed(1)} / 5.0
                      </Badge>
                    </div>
                    <div className="flex justify-end mb-1">
                      {getRatingStars(agent.average_rating)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {agent.rated_tickets} ratings
                    </p>
                    
                    {agent.recent_average_rating > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Recent (30d):</p>
                        <p className="text-sm font-medium text-blue-600">
                          {agent.recent_average_rating.toFixed(1)} / 5.0
                        </p>
                      </div>
                    )}

                    {/* Special Indicators */}
                    {isExcellent && (
                      <div className="mt-2 flex items-center gap-1 text-yellow-600">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs font-medium">Top Performer</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedAgents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Agents Found</h3>
            <p className="text-gray-500">No support agents match the current filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportAgentStats;
