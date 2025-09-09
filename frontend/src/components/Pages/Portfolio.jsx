import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const Portfolio = () => {
  const [positions, setPositions] = useState([]);
  const [showValues, setShowValues] = useState(true);

  // Sample portfolio data
  useEffect(() => {
    const samplePositions = [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 100,
        avgPrice: 150.25,
        currentPrice: 175.50,
        marketValue: 17550.00,
        costBasis: 15025.00,
        pnl: 2525.00,
        pnlPercent: 16.8,
        sector: 'Technology'
      },
      {
        id: 2,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        shares: 50,
        avgPrice: 200.00,
        currentPrice: 180.25,
        marketValue: 9012.50,
        costBasis: 10000.00,
        pnl: -987.50,
        pnlPercent: -9.9,
        sector: 'Automotive'
      },
      {
        id: 3,
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        shares: 25,
        avgPrice: 400.00,
        currentPrice: 450.75,
        marketValue: 11268.75,
        costBasis: 10000.00,
        pnl: 1268.75,
        pnlPercent: 12.7,
        sector: 'Technology'
      },
      {
        id: 4,
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        shares: 75,
        avgPrice: 300.00,
        currentPrice: 325.50,
        marketValue: 24412.50,
        costBasis: 22500.00,
        pnl: 1912.50,
        pnlPercent: 8.5,
        sector: 'Technology'
      }
    ];
    setPositions(samplePositions);
  }, []);

  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalCost = positions.reduce((sum, pos) => sum + pos.costBasis, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const sectorAllocation = positions.reduce((acc, pos) => {
    acc[pos.sector] = (acc[pos.sector] || 0) + pos.marketValue;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage and track your investment portfolio</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowValues(!showValues)}>
            {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showValues ? 'Hide' : 'Show'} Values
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showValues ? `$${totalValue.toLocaleString()}` : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Market value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {showValues ? (
                <>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                  <span className="text-sm ml-1">({totalPnLPercent.toFixed(1)}%)</span>
                </>
              ) : (
                '••••••'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Unrealized gains/losses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showValues ? `$${totalCost.toLocaleString()}` : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost basis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>Your current stock holdings and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                        {position.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">{position.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {position.shares} shares • {position.sector}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-medium">
                          {showValues ? `$${position.currentPrice.toFixed(2)}` : '••••'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {showValues ? `$${position.avgPrice.toFixed(2)}` : '••••'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {showValues ? `$${position.marketValue.toLocaleString()}` : '••••••'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Market value
                        </div>
                      </div>
                      <div className={`text-right ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-medium">
                          {showValues ? (
                            <>
                              {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                              <span className="text-sm ml-1">({position.pnlPercent.toFixed(1)}%)</span>
                            </>
                          ) : (
                            '••••••'
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          P&L
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
              <CardDescription>How your portfolio is distributed across different sectors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sectorAllocation).map(([sector, value]) => {
                  const percentage = (value / totalValue) * 100;
                  return (
                    <div key={sector} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sector}</span>
                        <span className="text-sm text-muted-foreground">
                          {showValues ? `$${value.toLocaleString()}` : '••••••'} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key performance metrics for your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Best Performer</h4>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">AAPL</span>
                      <span className="text-green-600 font-medium">+16.8%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      +$2,525.00
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Worst Performer</h4>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TSLA</span>
                      <span className="text-red-600 font-medium">-9.9%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      -$987.50
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
