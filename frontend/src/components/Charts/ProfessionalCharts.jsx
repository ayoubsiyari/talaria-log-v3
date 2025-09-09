import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple Line Chart Component
const LineChart = ({ 
  data = [], 
  width = 400, 
  height = 200, 
  color = "#3b82f6",
  showGrid = true,
  showPoints = true,
  animate = true 
}) => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Calculate points
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * (width - 40) + 20,
      y: height - 40 - ((d.value - minValue) / range) * (height - 80)
    }));

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = 20 + (i * (height - 40)) / 4;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(width - 20, y);
        ctx.stroke();
      }
    }

    // Draw line
    if (points.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (animate) {
        setIsAnimating(true);
        let progress = 0;
        const animateLine = () => {
          progress += 0.02;
          if (progress >= 1) {
            progress = 1;
            setIsAnimating(false);
          }

          ctx.clearRect(0, 0, width, height);
          
          // Redraw grid
          if (showGrid) {
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
              const y = 20 + (i * (height - 40)) / 4;
              ctx.beginPath();
              ctx.moveTo(20, y);
              ctx.lineTo(width - 20, y);
              ctx.stroke();
            }
          }

          // Draw animated line
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          const animatedPoints = points.slice(0, Math.ceil(points.length * progress));
          animatedPoints.forEach((point, i) => {
            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          
          ctx.stroke();

          // Draw points
          if (showPoints) {
            ctx.fillStyle = color;
            animatedPoints.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            });
          }

          if (progress < 1) {
            requestAnimationFrame(animateLine);
          }
        };
        animateLine();
      } else {
        // Draw static line
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();

        // Draw points
        if (showPoints) {
          ctx.fillStyle = color;
          points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      }
    }
  }, [data, width, height, color, showGrid, showPoints, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="text-sm text-gray-500">Animating...</div>
        </div>
      )}
    </div>
  );
};

// Simple Bar Chart Component
const BarChart = ({ 
  data = [], 
  width = 400, 
  height = 200, 
  color = "#3b82f6",
  showValues = true,
  animate = true 
}) => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);

    // Calculate bar dimensions
    const barWidth = (width - 40) / data.length - 10;
    const barSpacing = 10;

    if (animate) {
      setIsAnimating(true);
      let progress = 0;
      const animateBars = () => {
        progress += 0.05;
        if (progress >= 1) {
          progress = 1;
          setIsAnimating(false);
        }

        ctx.clearRect(0, 0, width, height);

        // Draw bars
        data.forEach((d, i) => {
          const x = 20 + i * (barWidth + barSpacing);
          const barHeight = ((d.value / maxValue) * (height - 60)) * progress;
          const y = height - 40 - barHeight;

          // Draw bar
          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Draw value
          if (showValues) {
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);
          }

          // Draw label
          ctx.fillStyle = '#6b7280';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(d.label, x + barWidth / 2, height - 15);
        });

        if (progress < 1) {
          requestAnimationFrame(animateBars);
        }
      };
      animateBars();
    } else {
      // Draw static bars
      data.forEach((d, i) => {
        const x = 20 + i * (barWidth + barSpacing);
        const barHeight = (d.value / maxValue) * (height - 60);
        const y = height - 40 - barHeight;

        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw value
        if (showValues) {
          ctx.fillStyle = '#374151';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);
        }

        // Draw label
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, height - 15);
      });
    }
  }, [data, width, height, color, showValues, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="text-sm text-gray-500">Animating...</div>
        </div>
      )}
    </div>
  );
};

// Simple Pie Chart Component
const PieChart = ({ 
  data = [], 
  width = 200, 
  height = 200,
  showLabels = true,
  animate = true 
}) => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Calculate total
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (animate) {
      setIsAnimating(true);
      let progress = 0;
      const animatePie = () => {
        progress += 0.02;
        if (progress >= 1) {
          progress = 1;
          setIsAnimating(false);
        }

        ctx.clearRect(0, 0, width, height);

        let currentAngle = -Math.PI / 2; // Start from top

        data.forEach((d, i) => {
          const sliceAngle = (d.value / total) * 2 * Math.PI * progress;
          
          // Draw slice
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = d.color || `hsl(${(i * 360) / data.length}, 70%, 60%)`;
          ctx.fill();

          // Draw label
          if (showLabels) {
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.value.toString(), labelX, labelY);
          }

          currentAngle += sliceAngle;
        });

        if (progress < 1) {
          requestAnimationFrame(animatePie);
        }
      };
      animatePie();
    } else {
      // Draw static pie chart
      let currentAngle = -Math.PI / 2;

      data.forEach((d, i) => {
        const sliceAngle = (d.value / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = d.color || `hsl(${(i * 360) / data.length}, 70%, 60%)`;
        ctx.fill();

        // Draw label
        if (showLabels) {
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + Math.cos(labelAngle) * labelRadius;
          const labelY = centerY + Math.sin(labelAngle) * labelRadius;

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(d.value.toString(), labelX, labelY);
        }

        currentAngle += sliceAngle;
      });
    }
  }, [data, width, height, showLabels, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="text-sm text-gray-500">Animating...</div>
        </div>
      )}
    </div>
  );
};

// Analytics Card Component
const AnalyticsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'percentage', 
  icon: Icon,
  color = 'blue',
  trend = 'up',
  period = 'vs last month',
  onClick 
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'purple':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getTrendIcon = () => {
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-medium",
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {change}{changeType === 'percentage' ? '%' : ''}
              </span>
              <span className="text-sm text-gray-500">{period}</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-full", getColorClasses())}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Chart Container with Controls
const ChartContainer = ({ 
  title, 
  children, 
  period = '7d',
  onPeriodChange,
  onRefresh,
  onDownload,
  className = "" 
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
                <SelectItem value="90d">90D</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
            
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Data Table Component
const DataTable = ({ 
  data = [], 
  columns = [], 
  sortable = true,
  onSort,
  className = "" 
}) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (!sortable) return;
    
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left py-3 px-4 font-medium text-gray-700",
                  sortable && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortable && <span className="text-xs">{getSortIcon(column.key)}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="py-3 px-4">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export {
  LineChart,
  BarChart,
  PieChart,
  AnalyticsCard,
  ChartContainer,
  DataTable
};

export default ChartContainer;
