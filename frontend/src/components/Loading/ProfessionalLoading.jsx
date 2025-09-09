import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ProfessionalLoading = ({ 
  message = "Loading...", 
  type = "spinner",
  size = "default",
  showProgress = false,
  progress = 0,
  status = "loading" // loading, success, error
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-4 h-4";
      case "large":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className={`${getSizeClasses()} text-green-500`} />;
      case "error":
        return <AlertCircle className={`${getSizeClasses()} text-red-500`} />;
      default:
        return <Loader2 className={`${getSizeClasses()} animate-spin`} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const renderSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      {getStatusIcon()}
      <div className="text-center">
        <p className={`font-medium ${getStatusColor()}`}>{message}</p>
        {showProgress && (
          <div className="mt-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDots = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className={`font-medium ${getStatusColor()}`}>{message}</p>
    </div>
  );

  const renderPulse = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${getSizeClasses()} bg-blue-500 rounded-full animate-pulse`} />
      <p className={`font-medium ${getStatusColor()}`}>{message}</p>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

// Full screen loading overlay
export const FullScreenLoading = ({ 
  message = "Loading...", 
  type = "spinner",
  showBackdrop = true 
}) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${showBackdrop ? 'bg-background/80 backdrop-blur-sm' : ''}`}>
    <div className="bg-background border rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
      <ProfessionalLoading message={message} type={type} size="large" />
    </div>
  </div>
);

// Inline loading component
export const InlineLoading = ({ 
  message = "Loading...", 
  type = "spinner",
  size = "small" 
}) => (
  <div className="inline-flex items-center space-x-2">
    <ProfessionalLoading message="" type={type} size={size} />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

// Page loading component
export const PageLoading = ({ 
  message = "Loading page...",
  showProgress = true,
  progress = 0 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        <Clock className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{message}</h2>
        {showProgress && (
          <div className="mt-4">
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Table loading skeleton
export const TableLoading = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Header skeleton */}
    <div className="flex space-x-4 pb-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      ))}
    </div>
    
    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div 
            key={colIndex} 
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{ width: `${Math.random() * 60 + 40}px` }}
          />
        ))}
      </div>
    ))}
  </div>
);

// Card loading skeleton
export const CardLoading = ({ cards = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: cards }).map((_, i) => (
      <Card key={i} className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export default ProfessionalLoading;
