import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Activity,
  Clock,
  Users,
  Globe,
  Server,
  Database,
  Network,
  Zap,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Security Status Types
const SECURITY_STATUS = {
  SECURE: 'secure',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

// Threat Levels
const THREAT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Security Metric Component
const SecurityMetric = ({ 
  title, 
  value, 
  status = SECURITY_STATUS.SECURE,
  trend = 'stable',
  icon: Icon,
  description,
  onClick 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case SECURITY_STATUS.SECURE:
        return 'text-green-600 bg-green-100 border-green-200';
      case SECURITY_STATUS.WARNING:
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case SECURITY_STATUS.CRITICAL:
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        getStatusColor(),
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Icon className="w-5 h-5" />
              <h3 className="text-sm font-medium">{title}</h3>
              {getTrendIcon()}
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-600">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge 
              variant={status === SECURITY_STATUS.CRITICAL ? "destructive" : "secondary"}
              className="text-xs"
            >
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Threat Alert Component
const ThreatAlert = ({ 
  alert, 
  onDismiss, 
  onAction,
  onViewDetails 
}) => {
  const getThreatLevelColor = () => {
    switch (alert.level) {
      case THREAT_LEVELS.CRITICAL:
        return 'border-red-500 bg-red-50';
      case THREAT_LEVELS.HIGH:
        return 'border-orange-500 bg-orange-50';
      case THREAT_LEVELS.MEDIUM:
        return 'border-yellow-500 bg-yellow-50';
      case THREAT_LEVELS.LOW:
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getThreatIcon = () => {
    switch (alert.type) {
      case 'brute_force':
        return <Lock className="w-5 h-5 text-red-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'data_breach':
        return <Database className="w-5 h-5 text-red-500" />;
      case 'malware':
        return <Virus className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className={cn("mb-3 border-l-4", getThreatLevelColor())}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getThreatIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {alert.title}
                </h4>
                <Badge 
                  variant={alert.level === THREAT_LEVELS.CRITICAL ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {alert.level.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {alert.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(alert.timestamp)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>{alert.source}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(alert.id)}
                      className="h-6 px-2 text-xs"
                    >
                      View Details
                    </Button>
                  )}
                  {alert.actions && alert.actions.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onAction?.(alert.id, alert.actions[0])}
                      className="h-6 px-2 text-xs"
                    >
                      {alert.actions[0].label}
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(alert.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Security Dashboard Component
const SecurityDashboard = ({ 
  metrics = [], 
  alerts = [],
  onRefresh,
  onViewAllAlerts,
  onViewAllMetrics 
}) => {
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.level === filter;
  });

  const criticalAlerts = alerts.filter(a => a.level === THREAT_LEVELS.CRITICAL).length;
  const highAlerts = alerts.filter(a => a.level === THREAT_LEVELS.HIGH).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Monitor</h1>
            <p className="text-sm text-gray-600">Real-time security monitoring and threat detection</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <SecurityMetric
            key={index}
            {...metric}
            onClick={() => onViewAllMetrics?.()}
          />
        ))}
      </div>

      {/* Threat Alerts */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Active Threats</span>
              {(criticalAlerts > 0 || highAlerts > 0) && (
                <Badge variant="destructive" className="ml-2">
                  {criticalAlerts + highAlerts}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All', count: alerts.length },
                  { key: 'critical', label: 'Critical', count: criticalAlerts },
                  { key: 'high', label: 'High', count: highAlerts }
                ].map(({ key, label, count }) => (
                  <Button
                    key={key}
                    variant={filter === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(key)}
                    className="h-7 px-2 text-xs"
                  >
                    {label}
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              
              {onViewAllAlerts && (
                <Button variant="outline" size="sm" onClick={onViewAllAlerts}>
                  View All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No active threats detected</p>
              <p className="text-xs text-gray-400 mt-1">Your system is currently secure</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <ThreatAlert
                  key={alert.id}
                  alert={alert}
                  onDismiss={(id) => console.log('Dismiss alert:', id)}
                  onAction={(id, action) => console.log('Action on alert:', id, action)}
                  onViewDetails={(id) => console.log('View details for alert:', id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Security Status Overview Component
const SecurityStatusOverview = ({ 
  status = SECURITY_STATUS.SECURE,
  score = 95,
  lastScan = new Date(),
  nextScan = new Date(Date.now() + 24 * 60 * 60 * 1000),
  vulnerabilities = [],
  onRunScan 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case SECURITY_STATUS.SECURE:
        return 'text-green-600 bg-green-100 border-green-200';
      case SECURITY_STATUS.WARNING:
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case SECURITY_STATUS.CRITICAL:
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={cn("border-2", getStatusColor())}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Security Status</span>
          <Badge variant={status === SECURITY_STATUS.CRITICAL ? "destructive" : "secondary"}>
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            <span className={getScoreColor()}>{score}</span>
            <span className="text-gray-500 text-lg">/100</span>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">Overall Security Score</p>
        </div>

        {/* Scan Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Last Scan</p>
            <p className="font-medium">{lastScan.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Next Scan</p>
            <p className="font-medium">{nextScan.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Vulnerabilities */}
        {vulnerabilities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recent Vulnerabilities</p>
            <div className="space-y-2">
              {vulnerabilities.slice(0, 3).map((vuln, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate">{vuln.title}</span>
                  <Badge variant={vuln.severity === 'high' ? "destructive" : "secondary"} className="text-xs">
                    {vuln.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button onClick={onRunScan} className="flex-1">
            <Activity className="w-4 h-4 mr-2" />
            Run Security Scan
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Network Activity Monitor Component
const NetworkActivityMonitor = ({ 
  activities = [],
  onViewDetails 
}) => {
  const [filter, setFilter] = useState('all');

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'api_call':
        return <Network className="w-4 h-4 text-green-500" />;
      case 'file_access':
        return <Database className="w-4 h-4 text-purple-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Network Activity</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.user} • {activity.ip} • {getTimeAgo(activity.timestamp)}
                </p>
              </div>
              
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(activity.id)}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  SecurityDashboard,
  SecurityStatusOverview,
  NetworkActivityMonitor,
  SecurityMetric,
  ThreatAlert,
  SECURITY_STATUS,
  THREAT_LEVELS
};

export default SecurityDashboard;
