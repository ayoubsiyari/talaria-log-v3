import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  TrendingUp,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react';

const SecurityStatusIndicator = () => {
  const [securityStatus, setSecurityStatus] = useState({
    overall: 'healthy',
    components: {
      authentication: 'healthy',
      encryption: 'healthy',
      fraud_detection: 'healthy',
      monitoring: 'healthy',
      compliance: 'healthy'
    },
    lastChecked: new Date(),
    alerts: []
  });

  const [loading, setLoading] = useState(false);

  const checkSecurityStatus = async () => {
    setLoading(true);
    try {
      // Simulate API call to check security status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock security status data
      const mockStatus = {
        overall: 'healthy',
        components: {
          authentication: 'healthy',
          encryption: 'healthy',
          fraud_detection: 'healthy',
          monitoring: 'healthy',
          compliance: 'healthy'
        },
        lastChecked: new Date(),
        alerts: []
      };

      setSecurityStatus(mockStatus);
    } catch (error) {
      console.error('Failed to check security status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSecurityStatus();
    
    // Check security status every 5 minutes
    const interval = setInterval(checkSecurityStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getComponentName = (component) => {
    const names = {
      authentication: 'Authentication',
      encryption: 'Encryption',
      fraud_detection: 'Fraud Detection',
      monitoring: 'Monitoring',
      compliance: 'PCI Compliance'
    };
    return names[component] || component;
  };

  const getComponentIcon = (component) => {
    const icons = {
      authentication: <Shield className="h-4 w-4" />,
      encryption: <Lock className="h-4 w-4" />,
      fraud_detection: <Activity className="h-4 w-4" />,
      monitoring: <TrendingUp className="h-4 w-4" />,
      compliance: <CheckCircle className="h-4 w-4" />
    };
    return icons[component] || <AlertCircle className="h-4 w-4" />;
  };

  const getAlertClasses = (severity) => {
    const classMap = {
      critical: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50'
    };
    return classMap[severity] || 'border-gray-200 bg-gray-50';
  };

  const getBadgeVariant = (severity) => {
    const variantMap = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'default'
    };
    return variantMap[severity] || 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Security Status</span>
              </div>
              <Badge className={`${getStatusColor(securityStatus.overall)} flex items-center space-x-1`}>
                {getStatusIcon(securityStatus.overall)}
                <span className="font-medium">{securityStatus.overall.toUpperCase()}</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Last checked: {securityStatus.lastChecked.toLocaleTimeString()}
              </span>
              <Button
                onClick={checkSecurityStatus}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(securityStatus.components).map(([component, status]) => (
          <Card key={component}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getComponentIcon(component)}
                  <span className="text-sm font-medium text-gray-900">
                    {getComponentName(component)}
                  </span>
                </div>
                <Badge className={`${getStatusColor(status)} flex items-center space-x-1`}>
                  {getStatusIcon(status)}
                  <span className="text-xs">{status.toUpperCase()}</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Features */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Active Security Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>JWT Authentication</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>CSRF Protection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Rate Limiting</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Input Sanitization</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>End-to-End Encryption</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Fraud Detection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>PCI Compliance</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {securityStatus.alerts && securityStatus.alerts.length > 0 && (
        <div className="space-y-2">
          {securityStatus.alerts.map((alert, index) => (
            <Alert key={index} className={getAlertClasses(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.message}</span>
                  <Badge variant={getBadgeVariant(alert.severity)}>
                    {alert.severity?.toUpperCase()}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Security Information */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Enterprise-Grade Security</p>
            <p className="text-sm">
              Your payment system is protected by multiple layers of security including 
              encryption, fraud detection, and real-time monitoring. All transactions 
              are processed securely and in compliance with PCI DSS standards.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SecurityStatusIndicator;

