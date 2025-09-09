import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Filter,
  RefreshCw
} from 'lucide-react';

const MarketScanner = () => {
  const [scannerData, setScannerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minVolume: '',
    maxPrice: '',
    minChange: ''
  });

  // Mock data - replace with real API call
  const mockData = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      changePercent: 1.24,
      volume: 45678900,
      marketCap: '2.8T',
      sector: 'Technology'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 248.50,
      change: -5.20,
      changePercent: -2.05,
      volume: 78912300,
      marketCap: '790B',
      sector: 'Automotive'
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 875.30,
      change: 15.80,
      changePercent: 1.84,
      volume: 23456700,
      marketCap: '2.1T',
      sector: 'Technology'
    }
  ];

  useEffect(() => {
    setScannerData(mockData);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      let filtered = [...mockData];
      
      if (filters.minVolume) {
        filtered = filtered.filter(stock => stock.volume >= parseInt(filters.minVolume));
      }
      if (filters.maxPrice) {
        filtered = filtered.filter(stock => stock.price <= parseFloat(filters.maxPrice));
      }
      if (filters.minChange) {
        filtered = filtered.filter(stock => stock.changePercent >= parseFloat(filters.minChange));
      }
      
      setScannerData(filtered);
      setLoading(false);
    }, 1000);
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Scanner</h1>
          <p className="text-gray-600 mt-1">Scan the market for trading opportunities</p>
        </div>
        <Button onClick={applyFilters} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Scan Market'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Min Volume</label>
              <Input
                type="number"
                placeholder="e.g., 1000000"
                value={filters.minVolume}
                onChange={(e) => handleFilterChange('minVolume', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Max Price</label>
              <Input
                type="number"
                placeholder="e.g., 500"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Min Change %</label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={filters.minChange}
                onChange={(e) => handleFilterChange('minChange', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Scan Results ({scannerData.length} stocks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scannerData.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-lg">{stock.symbol}</div>
                    <div className="text-sm text-gray-600">{stock.name}</div>
                    <div className="text-xs text-gray-500">{stock.sector}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold text-lg">${stock.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Vol: {stock.volume.toLocaleString()}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold flex items-center gap-1 ${getChangeColor(stock.change)}`}>
                      {getChangeIcon(stock.change)}
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </div>
                    <div className={`text-sm ${getChangeColor(stock.change)}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline">{stock.marketCap}</Badge>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Professional Feature</span>
          </div>
          <p className="text-amber-700 mt-2">
            This Market Scanner is available with Professional and Enterprise subscriptions. 
            Upgrade your plan to access real-time market data and advanced scanning tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketScanner;
