import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';

const TradingJournal = () => {
  const [trades, setTrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    side: 'buy',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Sample trades data
  useEffect(() => {
    const sampleTrades = [
      {
        id: 1,
        symbol: 'AAPL',
        side: 'buy',
        quantity: 100,
        price: 150.25,
        date: '2024-01-15',
        notes: 'Strong earnings report expected',
        pnl: 250.00,
        status: 'closed'
      },
      {
        id: 2,
        symbol: 'TSLA',
        side: 'sell',
        quantity: 50,
        price: 200.50,
        date: '2024-01-14',
        notes: 'Taking profits on recent rally',
        pnl: -150.00,
        status: 'closed'
      },
      {
        id: 3,
        symbol: 'NVDA',
        side: 'buy',
        quantity: 75,
        price: 400.00,
        date: '2024-01-13',
        notes: 'AI sector momentum',
        pnl: 0,
        status: 'open'
      }
    ];
    setTrades(sampleTrades);
  }, []);

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trade.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = trades.filter(trade => trade.pnl > 0).length / trades.length * 100;

  const handleAddTrade = () => {
    if (newTrade.symbol && newTrade.quantity && newTrade.price) {
      const trade = {
        ...newTrade,
        id: trades.length + 1,
        quantity: parseInt(newTrade.quantity),
        price: parseFloat(newTrade.price),
        pnl: 0,
        status: 'open'
      };
      setTrades([...trades, trade]);
      setNewTrade({
        symbol: '',
        side: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddingTrade(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Journal</h1>
          <p className="text-muted-foreground">Track your trades and analyze your performance</p>
        </div>
        <Button onClick={() => setIsAddingTrade(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trades.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trades.filter(trade => trade.status === 'open').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Trade Modal */}
      {isAddingTrade && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Trade</CardTitle>
            <CardDescription>Enter the details of your trade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={newTrade.symbol}
                  onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value})}
                  placeholder="e.g., AAPL"
                />
              </div>
              <div>
                <Label htmlFor="side">Side</Label>
                <Select value={newTrade.side} onValueChange={(value) => setNewTrade({...newTrade, side: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newTrade.quantity}
                  onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newTrade.price}
                  onChange={(e) => setNewTrade({...newTrade, price: e.target.value})}
                  placeholder="150.25"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTrade.date}
                  onChange={(e) => setNewTrade({...newTrade, date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newTrade.notes}
                onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                placeholder="Add any notes about this trade..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingTrade(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTrade}>
                Add Trade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trades</CardTitle>
              <CardDescription>Your trading history and current positions</CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{trade.symbol}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.quantity} shares @ ${trade.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(trade.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-right ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="font-medium">
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trade.status === 'open' ? 'Open' : 'Closed'}
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
    </div>
  );
};

export default TradingJournal;
