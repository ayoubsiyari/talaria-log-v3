import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, TickMarkType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { 
  Loader2, RefreshCw, ZoomIn, ZoomOut, Move, TrendingUp, Settings, Eye, EyeOff, Upload, Play, Pause, BarChart3, Activity, Maximize2, ArrowLeft,
  // FXReplay Navigation
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SkipBack, SkipForward, Square, RotateCcw, RotateCw,
  // Drawing Tools
  Pencil, Ruler, Circle, Square as SquareIcon, Triangle, Type, Minus, Plus, Crosshair, Grid,
  // Professional Tools
  Target, Layers, Palette, Download, Search, Moon, Sun, AlertCircle, CheckCircle, X
} from 'lucide-react';

// Supported timeframes
const TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

// Supported symbols
const SYMBOLS = [
  { value: 'BTC/USD', label: 'BTC/USD', description: 'Bitcoin' },
  { value: 'ETH/USD', label: 'ETH/USD', description: 'Ethereum' },
  { value: 'SOL/USD', label: 'SOL/USD', description: 'Solana' },
  { value: 'XRP/USD', label: 'XRP/USD', description: 'Ripple' },
  { value: 'ADA/USD', label: 'ADA/USD', description: 'Cardano' },
];

// Generate sample data
const generateSampleData = (count = 200) => {
  const initialDate = new Date();
  initialDate.setDate(initialDate.getDate() - count);
  
  const data = [];
  let previousValue = 40000 + Math.random() * 10000;
  
  for (let i = 0; i < count; i++) {
    const time = new Date(initialDate);
    time.setDate(time.getDate() + i);
    
    const open = previousValue;
    const close = open + (Math.random() - 0.5) * open * 0.02;
    const high = Math.max(open, close) + Math.random() * open * 0.01;
    const low = Math.min(open, close) - Math.random() * open * 0.01;
    
    data.push({
      time: time.getTime() / 1000, // Convert to Unix timestamp
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000) + 100
    });
    
    previousValue = close;
  }
  
  return data;
};

export default function Chart() {
  const chartContainerRef = useRef();
  const chart = useRef();
  const candlestickSeries = useRef();
  const volumeSeries = useRef();
  const smaSeries = useRef();
  const rsiSeries = useRef();
  const resizeObserver = useRef();
  const tooltipRef = useRef();
  const fileInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [replayData, setReplayData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Enhanced FXReplay and Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState(null);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showChartControls, setShowChartControls] = useState(false);
  const [crosshairMode, setCrosshairMode] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [volumeVisible, setVolumeVisible] = useState(true);
  const [priceScaleVisible, setPriceScaleVisible] = useState(true);
  const [timeScaleVisible, setTimeScaleVisible] = useState(true);
  
  // TradingView-style Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('drawing');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activeTab, setActiveTab] = useState('chart');

  // Load settings from local storage or use defaults
  const [symbol, setSymbol] = useState(() => localStorage.getItem('chartSymbol') || 'BTC/USD');
  const [timeframe, setTimeframe] = useState(() => localStorage.getItem('chartTimeframe') || '1h');
  const [chartTheme, setChartTheme] = useState(() => localStorage.getItem('chartTheme') || 'dark');
  const [smaPeriod, setSmaPeriod] = useState(() => parseInt(localStorage.getItem('chartSmaPeriod'), 10) || 20);
  const [showSma, setShowSma] = useState(() => localStorage.getItem('chartShowSma') === 'true');
  const [rsiPeriod, setRsiPeriod] = useState(() => parseInt(localStorage.getItem('chartRsiPeriod'), 10) || 14);
  const [showRsi, setShowRsi] = useState(() => localStorage.getItem('chartShowRsi') === 'true');

  // File upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsedData = results.data
            .filter(row => row.time && row.open && row.high && row.low && row.close)
            .map(row => ({
              time: new Date(row.time).getTime() / 1000,
              open: parseFloat(row.open),
              high: parseFloat(row.high),
              low: parseFloat(row.low),
              close: parseFloat(row.close),
              volume: parseFloat(row.volume) || 100
            }))
            .sort((a, b) => a.time - b.time);
          
          if (parsedData.length > 0) {
            setReplayData(parsedData);
            setCurrentBarIndex(0);
            setIsPlaying(false);
          }
        }
      });
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chart.current = createChart(chartContainerRef.current, {
        layout: {
            background: { type: 'solid', color: chartTheme === 'dark' ? '#0c0e14' : '#ffffff' },
            textColor: chartTheme === 'dark' ? '#d1d4dc' : '#333333',
            fontSize: 11,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        },
        grid: {
            vertLines: { 
                color: chartTheme === 'dark' ? 'rgba(42, 46, 57, 0.4)' : 'rgba(197, 203, 206, 0.4)',
                style: 0,
                visible: true,
            },
            horzLines: { 
                color: chartTheme === 'dark' ? 'rgba(42, 46, 57, 0.4)' : 'rgba(197, 203, 206, 0.4)',
                style: 0,
                visible: true,
            },
        },
        rightPriceScale: {
            borderColor: 'transparent',
            textColor: chartTheme === 'dark' ? '#787b86' : '#333333',
            entireTextOnly: false,
            visible: true,
            drawTicks: false,
            alignLabels: true,
            borderVisible: false,
            scaleMargins: { top: 0.05, bottom: 0.05 },
        },
        timeScale: {
            borderColor: 'transparent',
            textColor: chartTheme === 'dark' ? '#787b86' : '#333333',
            timeVisible: true,
            secondsVisible: false,
            borderVisible: false,
            tickMarkFormatter: (time, tickMarkType, locale) => {
                const date = new Date(time * 1000);
                switch (tickMarkType) {
                    case TickMarkType.Year:
                        return date.getFullYear().toString();
                    case TickMarkType.Month:
                        return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
                    case TickMarkType.DayOfMonth:
                        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
                    case TickMarkType.Time:
                        return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric' }).format(date);
                    default:
                        return '';
                }
            },
        },
        crosshair: {
            mode: 1, // Magnet mode
            vertLine: { 
                width: 1, 
                color: '#2962FF', 
                style: 2,
                labelBackgroundColor: chartTheme === 'dark' ? '#0c0e14' : '#ffffff',
            },
            horzLine: { 
                width: 1, 
                color: '#2962FF', 
                style: 2,
                labelBackgroundColor: chartTheme === 'dark' ? '#0c0e14' : '#ffffff',
            },
        },
        watermark: {
            color: chartTheme === 'dark' ? 'rgba(120, 123, 134, 0.08)' : 'rgba(180, 180, 180, 0.15)',
            visible: true,
            text: '',
            fontSize: 28,
            horzAlign: 'left',
            vertAlign: 'top',
        },
        handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
        },
        handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
        },
    });

    candlestickSeries.current = chart.current.addSeries(CandlestickSeries, {
        priceScaleId: 'right',
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderDownColor: '#f6465d',
        borderUpColor: '#0ecb81',
        wickDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
    });
    
    chart.current.priceScale('right').applyOptions({
        scaleMargins: { top: 0.08, bottom: 0.25 },
        borderColor: 'transparent',
    });
    
    volumeSeries.current = chart.current.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale',
        scaleMargins: { top: 0.8, bottom: 0 },
    });
    
    smaSeries.current = chart.current.addSeries(LineSeries, { 
        color: '#FF9800', 
        lineWidth: 2,
        priceScaleId: 'right',
        title: `SMA(${smaPeriod})`,
    });
    
    rsiSeries.current = chart.current.addSeries(LineSeries, {
        color: '#9C27B0',
        lineWidth: 2,
        priceScaleId: 'rsi_scale',
        title: `RSI(${rsiPeriod})`,
    });
    
    chart.current.priceScale('rsi_scale').applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
        height: 100,
    });

    const rsiLevel30 = rsiSeries.current.createPriceLine({ 
        price: 30, 
        color: 'rgba(246, 70, 93, 0.4)', 
        lineWidth: 1, 
        lineStyle: 2,
        title: 'Oversold'
    });
    const rsiLevel70 = rsiSeries.current.createPriceLine({ 
        price: 70, 
        color: 'rgba(14, 203, 129, 0.4)', 
        lineWidth: 1, 
        lineStyle: 2,
        title: 'Overbought'
    });
    
    chart.current.priceScale('volume_scale').applyOptions({ 
        scaleMargins: { top: 0.8, bottom: 0 },
        borderColor: 'transparent',
    });

    const handleResize = () => {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        chart.current.resize(clientWidth, clientHeight);

        const smallScreen = window.innerWidth < 640;
        const verySmallScreen = window.innerWidth < 420;

        chart.current.applyOptions({
            layout: {
                fontSize: verySmallScreen ? 10 : smallScreen ? 11 : 11,
            },
            rightPriceScale: {
                visible: !verySmallScreen,
            },
            timeScale: {
                visible: !verySmallScreen,
            },
        });
    };

    resizeObserver.current = new ResizeObserver(handleResize);
    resizeObserver.current.observe(chartContainerRef.current);
    handleResize(); // Initial call

    // Enhanced tooltip logic
    const tooltip = tooltipRef.current;
    chart.current.subscribeCrosshairMove(param => {
        if (
            !param.time ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current.clientHeight
        ) {
            tooltip.style.display = 'none';
            return;
        }

        const data = param.seriesData.get(candlestickSeries.current);
        if (!data) {
            tooltip.style.display = 'none';
            return;
        }

        const { open, high, low, close } = data;
        const change = close - open;
        const changePercent = ((change / open) * 100);
        const changeColor = change >= 0 ? '#0ecb81' : '#f6465d';
        const selectedSymbol = SYMBOLS.find(s => s.value === symbol);
        
        tooltip.style.display = 'block';
        tooltip.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: 600; color: ${changeColor}; font-size: 13px; margin-right: 8px;">${symbol}</div>
                <div style="font-size: 10px; color: #787b86; background: rgba(120, 123, 134, 0.1); padding: 2px 6px; border-radius: 3px;">
                    ${selectedSymbol?.description || ''}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 11px;">
                <span style="color: #787b86;">Open:</span><span style="color: #d1d4dc; font-weight: 500;">${open.toFixed(2)}</span>
                <span style="color: #787b86;">High:</span><span style="color: #d1d4dc; font-weight: 500;">${high.toFixed(2)}</span>
                <span style="color: #787b86;">Low:</span><span style="color: #d1d4dc; font-weight: 500;">${low.toFixed(2)}</span>
                <span style="color: #787b86;">Close:</span><span style="color: ${changeColor}; font-weight: 600;">${close.toFixed(2)}</span>
                <span style="color: #787b86;">Change:</span><span style="color: ${changeColor}; font-weight: 600;">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</span>
            </div>
        `;

        const y = param.point.y;
        let x = param.point.x;

        if (x > chartContainerRef.current.clientWidth - 180) {
            x -= 180;
        }

        tooltip.style.left = `${x + 20}px`;
        tooltip.style.top = `${y + 20}px`;
    });

    return () => {
        if (resizeObserver.current) resizeObserver.current.disconnect();
        if (chart.current) chart.current.remove();
    };
  }, [chartTheme]);

  // Effect for data loading and theme changes
  useEffect(() => {
    if (!chart.current) return;

    // Apply theme and watermark
    const selectedTimeframe = TIMEFRAMES.find(tf => tf.value === timeframe)?.label || '';
    chart.current.applyOptions({
        layout: {
            background: { type: 'solid', color: chartTheme === 'dark' ? '#0c0e14' : '#ffffff' },
            textColor: chartTheme === 'dark' ? '#d1d4dc' : '#333333',
        },
        grid: {
            vertLines: { color: chartTheme === 'dark' ? 'rgba(42, 46, 57, 0.4)' : 'rgba(197, 203, 206, 0.4)' },
            horzLines: { color: chartTheme === 'dark' ? 'rgba(42, 46, 57, 0.4)' : 'rgba(197, 203, 206, 0.4)' },
        },
        watermark: {
            text: `${symbol} • ${selectedTimeframe}`,
            color: chartTheme === 'dark' ? 'rgba(120, 123, 134, 0.08)' : 'rgba(180, 180, 180, 0.15)',
        }
    });

    candlestickSeries.current.applyOptions({
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderDownColor: '#f6465d',
        borderUpColor: '#0ecb81',
        wickDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
    });

    // Load data
    const loadChartData = () => {
        setIsLoading(true);
        const data = replayData.length > 0 ? replayData : generateSampleData(200);
        
        const candlestickData = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
        const volumeData = data.map(d => ({ 
            time: d.time, 
            value: d.volume, 
            color: d.close >= d.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)' 
        }));

        const calculateSMA = (period, data) => {
            let smaData = [];
            for (let i = period - 1; i < data.length; i++) {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += data[i - j].close;
                }
                smaData.push({ time: data[i].time, value: sum / period });
            }
            return smaData;
        };

        if (showSma && smaPeriod > 0) {
            const smaData = calculateSMA(smaPeriod, candlestickData);
            smaSeries.current.setData(smaData);
        } else {
            smaSeries.current.setData([]);
        }

        const calculateRSI = (period, data) => {
            let gains = 0;
            let losses = 0;
            const rsiData = [];

            for (let i = 1; i < data.length; i++) {
                const change = data[i].close - data[i - 1].close;
                if (i < period) {
                    if (change > 0) gains += change;
                    else losses -= change;
                } else if (i === period) {
                    gains /= period;
                    losses /= period;
                } else {
                    if (change > 0) {
                        gains = (gains * (period - 1) + change) / period;
                        losses = (losses * (period - 1)) / period;
                    } else {
                        losses = (losses * (period - 1) - change) / period;
                        gains = (gains * (period - 1)) / period;
                    }
                }

                if (i >= period -1) {
                    const rs = losses === 0 ? 100 : gains / losses;
                    const rsi = 100 - (100 / (1 + rs));
                    rsiData.push({ time: data[i].time, value: rsi });
                }
            }
            return rsiData;
        };

        if (showRsi && rsiPeriod > 0) {
            const rsiData = calculateRSI(rsiPeriod, candlestickData);
            rsiSeries.current.setData(rsiData);
            chart.current.priceScale('rsi_scale').applyOptions({ visible: true });
            candlestickSeries.current.applyOptions({ priceScaleId: 'right' });
        } else {
            rsiSeries.current.setData([]);
            chart.current.priceScale('rsi_scale').applyOptions({ visible: false });
        }

        if (replayData.length > 0) {
            candlestickSeries.current.setData(candlestickData.slice(0, 1));
            volumeSeries.current.setData(volumeData.slice(0, 1));
            setCurrentBarIndex(1);
        } else {
            candlestickSeries.current.setData(candlestickData);
            volumeSeries.current.setData(volumeData);
        }
        
        chart.current.timeScale().fitContent();
        setIsLoading(false);
    };

    loadChartData();

  }, [symbol, timeframe, chartTheme, refreshTrigger, smaPeriod, showSma, rsiPeriod, showRsi]);
  
  // Handle symbol change
  const handleSymbolChange = (value) => {
    setSymbol(value);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (value) => {
    setTimeframe(value);
  };

  // Effect to save settings to local storage
  useEffect(() => {
    localStorage.setItem('chartSymbol', symbol);
    localStorage.setItem('chartTimeframe', timeframe);
    localStorage.setItem('chartTheme', chartTheme);
    localStorage.setItem('chartSmaPeriod', smaPeriod.toString());
    localStorage.setItem('chartShowSma', showSma.toString());
    localStorage.setItem('chartRsiPeriod', rsiPeriod.toString());
    localStorage.setItem('chartShowRsi', showRsi.toString());
  }, [symbol, timeframe, chartTheme, smaPeriod, showSma, rsiPeriod, showRsi]);
  
  // Toggle theme
  const toggleTheme = () => {
    setChartTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };


  // Effect for bar replay
  useEffect(() => {
    if (!isPlaying || !replayData.length || currentBarIndex >= replayData.length) {
      return;
    }

    const interval = setInterval(() => {
      const nextBar = replayData[currentBarIndex];
      candlestickSeries.current.update(nextBar);
      volumeSeries.current.update({
        time: nextBar.time,
        value: nextBar.volume,
        color: nextBar.close >= nextBar.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
      });
      setCurrentBarIndex(prevIndex => prevIndex + 1);
    }, replaySpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentBarIndex, replayData, replaySpeed]);

  return (
    <div className="h-screen w-full flex" style={{ backgroundColor: chartTheme === 'dark' ? '#0c0e14' : '#ffffff' }}>
      {/* TradingView-style Sidebar */}
      <div 
        className={`transition-all duration-300 flex-shrink-0 border-r`}
        style={{ 
          width: sidebarCollapsed ? '60px' : `${sidebarWidth}px`,
          backgroundColor: chartTheme === 'dark' ? '#1a1e2e' : '#f8f9fa',
          borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7'
        }}
      >
        {/* Sidebar Header */}
        <div 
          className="h-12 flex items-center justify-between px-3 border-b"
          style={{ 
            borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7'
          }}
        >
          {!sidebarCollapsed && (
            <h2 className="text-sm font-semibold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
              Tools
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Sidebar Tabs */}
        {!sidebarCollapsed && (
          <div className="flex border-b" style={{ borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7' }}>
            {[
              { id: 'drawing', label: 'Drawing', icon: Pencil },
              { id: 'indicators', label: 'Indicators', icon: Target },
              { id: 'controls', label: 'Controls', icon: Settings },
              { id: 'replay', label: 'Replay', icon: Play }
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors ${
                  activeSidebarTab === tab.id 
                    ? 'text-blue-500 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveSidebarTab(tab.id)}
                style={{ 
                  color: activeSidebarTab === tab.id 
                    ? '#2962FF' 
                    : chartTheme === 'dark' ? '#787b86' : '#666666'
                }}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {sidebarCollapsed ? (
            // Collapsed sidebar - show only icons
            <div className="space-y-2">
              {[
                { id: 'drawing', icon: Pencil, label: 'Drawing' },
                { id: 'indicators', icon: Target, label: 'Indicators' },
                { id: 'controls', icon: Settings, label: 'Controls' },
                { id: 'replay', icon: Play, label: 'Replay' }
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 ${
                    activeSidebarTab === tab.id ? 'bg-blue-500 text-white' : ''
                  }`}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  title={tab.label}
                >
                  <tab.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          ) : (
            // Expanded sidebar content
            <div className="space-y-4">
              {/* Drawing Tools Tab */}
              {activeSidebarTab === 'drawing' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                    Drawing Tools
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'trendline', icon: Ruler, label: 'Trend Line' },
                      { id: 'horizontal', icon: Minus, label: 'Horizontal' },
                      { id: 'vertical', icon: () => <div className="w-3 h-3 border-l-2 border-current" />, label: 'Vertical' },
                      { id: 'rectangle', icon: SquareIcon, label: 'Rectangle' },
                      { id: 'circle', icon: Circle, label: 'Circle' },
                      { id: 'triangle', icon: Triangle, label: 'Triangle' },
                      { id: 'fibonacci', icon: () => <div className="w-3 h-3 flex items-center justify-center"><div className="w-2 h-2 border border-current rounded-full"></div></div>, label: 'Fibonacci' },
                      { id: 'text', icon: Type, label: 'Text' }
                    ].map(tool => (
                      <Button
                        key={tool.id}
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 text-xs ${activeDrawingTool === tool.id ? 'bg-blue-500 text-white' : ''}`}
                        onClick={() => setActiveDrawingTool(activeDrawingTool === tool.id ? null : tool.id)}
                      >
                        <tool.icon className="w-3 h-3 mr-1" />
                        {tool.label}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs w-full"
                    onClick={() => setActiveDrawingTool(null)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}

              {/* Indicators Tab */}
              {activeSidebarTab === 'indicators' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                    Technical Indicators
                  </h3>
                  
                  {/* Moving Averages */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                      Moving Averages
                    </h4>
                    <div className="space-y-1">
                      {['SMA (20)', 'EMA (12)', 'WMA (21)', 'TEMA (9)'].map(indicator => (
                        <Button key={indicator} variant="ghost" size="sm" className="h-7 px-2 text-xs w-full justify-start">
                          <Activity className="w-3 h-3 mr-2" />
                          {indicator}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Oscillators */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                      Oscillators
                    </h4>
                    <div className="space-y-1">
                      {['RSI (14)', 'MACD', 'Stochastic', 'Williams %R'].map(indicator => (
                        <Button key={indicator} variant="ghost" size="sm" className="h-7 px-2 text-xs w-full justify-start">
                          <BarChart3 className="w-3 h-3 mr-2" />
                          {indicator}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Volume */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                      Volume
                    </h4>
                    <div className="space-y-1">
                      {['Volume Profile', 'OBV', 'A/D Line', 'CMF'].map(indicator => (
                        <Button key={indicator} variant="ghost" size="sm" className="h-7 px-2 text-xs w-full justify-start">
                          <BarChart3 className="w-3 h-3 mr-2" />
                          {indicator}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls Tab */}
              {activeSidebarTab === 'controls' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                    Chart Controls
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'crosshairMode', label: 'Crosshair', value: crosshairMode, setter: setCrosshairMode },
                      { key: 'gridVisible', label: 'Grid', value: gridVisible, setter: setGridVisible },
                      { key: 'volumeVisible', label: 'Volume', value: volumeVisible, setter: setVolumeVisible },
                      { key: 'priceScaleVisible', label: 'Price Scale', value: priceScaleVisible, setter: setPriceScaleVisible },
                      { key: 'timeScaleVisible', label: 'Time Scale', value: timeScaleVisible, setter: setTimeScaleVisible }
                    ].map(control => (
                      <div key={control.key} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                          {control.label}
                        </span>
                        <Switch
                          checked={control.value}
                          onCheckedChange={control.setter}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Replay Tab */}
              {activeSidebarTab === 'replay' && replayData.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                    FXReplay Controls
                  </h3>
                  
                  {/* Navigation Controls */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentBarIndex(0);
                        }}
                        title="Go to Start"
                      >
                        <ChevronsLeft className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          if (currentBarIndex > 0) {
                            setCurrentBarIndex(prev => prev - 1);
                          }
                        }}
                        disabled={currentBarIndex === 0}
                        title="Previous Bar"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setIsPlaying(!isPlaying)}
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          if (currentBarIndex < replayData.length - 1) {
                            setCurrentBarIndex(prev => prev + 1);
                          }
                        }}
                        disabled={currentBarIndex >= replayData.length - 1}
                        title="Next Bar"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs w-full"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentBarIndex(replayData.length - 1);
                      }}
                      title="Go to End"
                    >
                      <ChevronsRight className="w-3 h-3 mr-1" />
                      Go to End
                    </Button>
                  </div>
                  
                  {/* Speed Control */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                      Speed: {replaySpeed}ms
                    </label>
                    <input 
                      type="range" 
                      min="50" 
                      max="2000" 
                      step="50" 
                      value={replaySpeed} 
                      onChange={(e) => setReplaySpeed(Number(e.target.value))}
                      className="w-full h-1"
                      title="Replay Speed"
                    />
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                      <span>Progress</span>
                      <span>{currentBarIndex + 1} / {replayData.length}</span>
                    </div>
                    <div className="w-full h-1 bg-opacity-30 rounded-full" style={{ backgroundColor: chartTheme === 'dark' ? '#434651' : '#d0d0d0' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-200" 
                        style={{ 
                          backgroundColor: '#2962FF',
                          width: `${((currentBarIndex + 1) / replayData.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col">
      {/* Enhanced Top Toolbar */}
      <div 
        className="border-b px-2 py-2 flex items-center justify-between flex-wrap gap-3"
        style={{ 
          backgroundColor: chartTheme === 'dark' ? '#1a1e2e' : '#f8f9fa',
          borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7',
          boxShadow: chartTheme === 'dark' ? '0 1px 0 rgba(42, 46, 57, 0.5)' : '0 1px 0 rgba(224, 227, 231, 0.5)'
        }}
      >
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs border-0 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
            onClick={() => window.history.back()}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {/* Enhanced Symbol Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#2962FF' }}
              >
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <Select value={symbol} onValueChange={handleSymbolChange}>
                <SelectTrigger 
                  className="w-36 h-8 text-sm font-semibold border-0 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  style={{ 
                    backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#ffffff',
                    color: chartTheme === 'dark' ? '#d1d4dc' : '#333333'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  style={{ 
                    backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#ffffff',
                    borderColor: chartTheme === 'dark' ? '#434651' : '#e0e3e7'
                  }}
                >
                  {SYMBOLS.map(sym => (
                    <SelectItem 
                      key={sym.value} 
                      value={sym.value}
                      style={{ 
                        color: chartTheme === 'dark' ? '#d1d4dc' : '#333333'
                      }}
                      className="hover:bg-blue-500/10 transition-colors duration-150"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{sym.label}</span>
                        <span className="text-xs opacity-60">{sym.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Display */}
            <div className="flex flex-col">
              <div className="text-lg font-bold" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                $45,234.56
              </div>
              <div className="text-xs flex items-center space-x-1">
                <span style={{ color: '#0ecb81' }}>+2.34%</span>
                <span style={{ color: '#787b86' }}>+$1,023.45</span>
              </div>
            </div>
          </div>

          {/* Enhanced Timeframe Buttons */}
          <div className="flex items-center space-x-1 bg-opacity-50 rounded-lg p-1" style={{ backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#f0f0f0' }}>
            {TIMEFRAMES.map(tf => (
              <Button
                key={tf.value}
                variant="ghost"
                size="sm"
                className={`h-7 px-3 text-xs font-medium border-0 transition-all duration-200 rounded-md ${
                  timeframe === tf.value 
                    ? 'text-white shadow-sm' 
                    : chartTheme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                style={{
                  backgroundColor: timeframe === tf.value ? '#2962FF' : 'transparent',
                }}
                onClick={() => handleTimeframeChange(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Right Side Controls */}
        <div className="flex items-center space-x-3">

          {/* Enhanced Indicators */}
          <div className="flex items-center space-x-3 border-l pl-4" style={{ borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7' }}>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs border-0 transition-all duration-200 rounded-md ${showSma ? 'text-orange-500 bg-orange-500/10' : chartTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
                onClick={() => setShowSma(!showSma)}
              >
                <Activity className="w-3 h-3 mr-1" />
                SMA({smaPeriod})
                {showSma ? <Eye className="w-3 h-3 ml-1" /> : <EyeOff className="w-3 h-3 ml-1" />}
              </Button>
              {showSma && (
                <input 
                  type="number" 
                  value={smaPeriod}
                  onChange={e => setSmaPeriod(parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-8 px-2 text-xs rounded-md border-0 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  style={{ 
                    backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#ffffff',
                    color: chartTheme === 'dark' ? '#d1d4dc' : '#333333'
                  }}
                />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-3 text-xs border-0 transition-all duration-200 rounded-md ${showRsi ? 'text-purple-500 bg-purple-500/10' : chartTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
                onClick={() => setShowRsi(!showRsi)}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                RSI({rsiPeriod})
                {showRsi ? <Eye className="w-3 h-3 ml-1" /> : <EyeOff className="w-3 h-3 ml-1" />}
              </Button>
              {showRsi && (
                <input 
                  type="number" 
                  value={rsiPeriod}
                  onChange={e => setRsiPeriod(parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-8 px-2 text-xs rounded-md border-0 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  style={{ 
                    backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#ffffff',
                    color: chartTheme === 'dark' ? '#d1d4dc' : '#333333'
                  }}
                />
              )}
            </div>
          </div>

          {/* Professional FXReplay Navigation Controls */}
          {replayData.length > 0 && (
            <div className="flex items-center space-x-1 border-l pl-4" style={{ borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7' }}>
              {/* Navigation Controls */}
              <div className="flex items-center space-x-1 bg-opacity-50 rounded-lg p-1" style={{ backgroundColor: chartTheme === 'dark' ? '#2a2e39' : '#f0f0f0' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 border-0 rounded-md transition-all duration-200"
                  style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentBarIndex(0);
                  }}
                  title="Go to Start"
                >
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 border-0 rounded-md transition-all duration-200"
                  style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
                  onClick={() => {
                    if (currentBarIndex > 0) {
                      setCurrentBarIndex(prev => prev - 1);
                    }
                  }}
                  disabled={currentBarIndex === 0}
                  title="Previous Bar"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 border-0 rounded-md transition-all duration-200"
                  style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 border-0 rounded-md transition-all duration-200"
                  style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
                  onClick={() => {
                    if (currentBarIndex < replayData.length - 1) {
                      setCurrentBarIndex(prev => prev + 1);
                    }
                  }}
                  disabled={currentBarIndex >= replayData.length - 1}
                  title="Next Bar"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 border-0 rounded-md transition-all duration-200"
                  style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentBarIndex(replayData.length - 1);
                  }}
                  title="Go to End"
                >
                  <ChevronsRight className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Speed Control */}
              <div className="flex items-center space-x-2">
                <input 
                  type="range" 
                  min="50" 
                  max="2000" 
                  step="50" 
                  value={replaySpeed} 
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="w-16 h-1"
                  title="Replay Speed"
                />
                <span className="text-xs min-w-[35px]" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                  {replaySpeed}ms
                </span>
              </div>
              
              {/* Progress Indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-xs" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                  {currentBarIndex + 1} / {replayData.length}
                </span>
                <div className="w-16 h-1 bg-opacity-30 rounded-full" style={{ backgroundColor: chartTheme === 'dark' ? '#434651' : '#d0d0d0' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-200" 
                    style={{ 
                      backgroundColor: '#2962FF',
                      width: `${((currentBarIndex + 1) / replayData.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chart Navigation Tools */}
          <div className="flex items-center space-x-1 border-l pl-4" style={{ borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7' }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={() => chart.current?.timeScale().scrollToRealTime()}
              title="Go to realtime"
            >
              <div className="w-4 h-4 border border-current rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={() => chart.current?.timeScale().fitContent()}
              title="Fit content"
            >
              <div className="w-4 h-4 border border-current rounded flex items-center justify-center">
                <div className="w-2 h-2 border border-current rounded"></div>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              title="Zoom in"
              onClick={() => {
                const timeScale = chart.current?.timeScale();
                const logicalRange = timeScale?.getVisibleLogicalRange();
                if (logicalRange) {
                  const barsInfo = candlestickSeries.current?.barsInLogicalRange(logicalRange);
                  if (barsInfo && barsInfo.barsBefore < 0 && barsInfo.barsAfter < 0) {
                    const zoomFactor = 0.8;
                    const center = (logicalRange.from + logicalRange.to) / 2;
                    const newRange = (logicalRange.to - logicalRange.from) * zoomFactor / 2;
                    timeScale.setVisibleLogicalRange({
                      from: center - newRange,
                      to: center + newRange
                    });
                  }
                }
              }}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              title="Zoom out"
              onClick={() => {
                const timeScale = chart.current?.timeScale();
                const logicalRange = timeScale?.getVisibleLogicalRange();
                if (logicalRange) {
                  const zoomFactor = 1.2;
                  const center = (logicalRange.from + logicalRange.to) / 2;
                  const newRange = (logicalRange.to - logicalRange.from) * zoomFactor / 2;
                  timeScale.setVisibleLogicalRange({
                    from: center - newRange,
                    to: center + newRange
                  });
                }
              }}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={handleUploadButtonClick}
              title="Upload CSV"
            >
              <Upload className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {chartTheme === 'dark' ? '☀️' : '🌙'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 border-0 rounded-md transition-all duration-200 hover:bg-white/5"
              style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}
              onClick={() => setRefreshTrigger(t => t + 1)}
              disabled={isLoading}
              title="Refresh data"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chart Area - Full Width */}
      <div className="flex-1 relative w-full" style={{ margin: 0, padding: 0 }}>
          <div 
            ref={chartContainerRef} 
            className="w-full h-full"
            style={{ 
              backgroundColor: chartTheme === 'dark' ? '#0c0e14' : '#ffffff',
              margin: 0,
              padding: 0
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(2px)' }}>
                <div className="flex flex-col items-center p-6 rounded-lg" style={{ backgroundColor: chartTheme === 'dark' ? 'rgba(26, 30, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)' }}>
                  <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: '#2962FF' }} />
                  <p className="text-sm font-medium" style={{ color: chartTheme === 'dark' ? '#d1d4dc' : '#333333' }}>
                    Loading chart data...
                  </p>
                  <p className="text-xs mt-1" style={{ color: chartTheme === 'dark' ? '#787b86' : '#666666' }}>
                    Please wait while we fetch the latest market data
                  </p>
                </div>
              </div>
            )}
            
            {/* Enhanced Tooltip */}
            <div 
              ref={tooltipRef}
              style={{
                position: 'absolute',
                display: 'none',
                padding: '12px',
                background: chartTheme === 'dark' 
                  ? 'rgba(26, 30, 46, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                color: chartTheme === 'dark' ? '#d1d4dc' : '#333333',
                border: `1px solid ${chartTheme === 'dark' ? '#434651' : '#e0e3e7'}`,
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                pointerEvents: 'none',
                zIndex: 1000,
                fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minWidth: '160px',
                backdropFilter: 'blur(20px)',
              }}
            />
        </div>


        {/* Hidden file input */}
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden"
        />
      </div>

      {/* Enhanced Bottom Status Bar */}
      <div 
        className="border-t px-2 py-2 flex items-center justify-between text-xs"
        style={{ 
          backgroundColor: chartTheme === 'dark' ? '#1a1e2e' : '#f8f9fa',
          borderColor: chartTheme === 'dark' ? '#2a2e39' : '#e0e3e7',
          color: chartTheme === 'dark' ? '#787b86' : '#666666',
          boxShadow: chartTheme === 'dark' ? '0 -1px 0 rgba(42, 46, 57, 0.5)' : '0 -1px 0 rgba(224, 227, 231, 0.5)'
        }}
      >
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium">Live Market Data</span>
            </div>
            {replayData.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2962FF' }}></div>
                <span>Replay Mode ({currentBarIndex}/{replayData.length})</span>
                <div className="w-20 h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      backgroundColor: '#2962FF',
                      width: `${(currentBarIndex / replayData.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span>Last updated:</span>
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0ecb81' }}></div>
              <span>Bullish Trend</span>
            </span>
            <span className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f6465d' }}></div>
              <span>Bearish Trend</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Powered by</span>
            <span className="font-semibold" style={{ color: '#2962FF' }}>TradingView</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

