import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: this.generateErrorId()
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logErrorToService(error, errorInfo) {
    // In a real application, you would send this to a service like Sentry, LogRocket, etc.
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    // For now, we'll just log it (replace with actual error reporting service)
    console.error('Error Report:', errorData);
  }

  getCurrentUserId() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 'unknown';
      }
    } catch (error) {
      return 'unknown';
    }
    return 'unknown';
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // In a real application, you would open a bug report form or send to support
    const mailtoLink = `mailto:support@yourcompany.com?subject=Bug Report - ${this.state.errorId}&body=${encodeURIComponent(JSON.stringify(errorReport, null, 2))}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details (only in development) */}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Error Details (Development Only)</h4>
                  <div className="text-sm font-mono bg-background p-3 rounded border overflow-auto max-h-40">
                    <div className="text-red-600 mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="text-gray-600">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Error ID: <span className="font-mono">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </Button>
              </div>

              {/* Additional Help */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please contact our support team.
                </p>
                <p className="mt-1">
                  You can also try refreshing the page or clearing your browser cache.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback = null) => {
  return class extends ErrorBoundary {
    render() {
      if (this.state.hasError) {
        return fallback || super.render();
      }
      return <Component {...this.props} />;
    }
  };
};

export default ErrorBoundary;
