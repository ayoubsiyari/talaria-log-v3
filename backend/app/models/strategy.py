from .. import db
from datetime import datetime

class Strategy(db.Model):
    """Trading strategy model"""
    __tablename__ = 'strategies'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    strategy_type = db.Column(db.String(50))  # 'Swing', 'Day', 'Scalping', etc.
    symbols = db.Column(db.String(500))  # Comma-separated list
    parameters = db.Column(db.Text)  # JSON string of strategy parameters
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    backtest_results = db.relationship('BacktestResult', backref='strategy', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Strategy {self.name}>'
    
    def to_dict(self):
        """Convert strategy to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'strategy_type': self.strategy_type,
            'symbols': self.symbols,
            'parameters': self.parameters,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BacktestResult(db.Model):
    """Backtesting result model"""
    __tablename__ = 'backtest_results'
    
    id = db.Column(db.Integer, primary_key=True)
    strategy_id = db.Column(db.Integer, db.ForeignKey('strategies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    initial_capital = db.Column(db.Numeric(15, 2), nullable=False)
    final_capital = db.Column(db.Numeric(15, 2), nullable=False)
    total_return = db.Column(db.Numeric(10, 4))  # Percentage
    max_drawdown = db.Column(db.Numeric(10, 4))  # Percentage
    sharpe_ratio = db.Column(db.Numeric(10, 4))
    total_trades = db.Column(db.Integer)
    winning_trades = db.Column(db.Integer)
    losing_trades = db.Column(db.Integer)
    win_rate = db.Column(db.Numeric(5, 2))  # Percentage
    avg_win = db.Column(db.Numeric(10, 2))
    avg_loss = db.Column(db.Numeric(10, 2))
    profit_factor = db.Column(db.Numeric(10, 4))
    results_data = db.Column(db.Text)  # JSON string with detailed results
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BacktestResult {self.id}>'
    
    def to_dict(self):
        """Convert backtest result to dictionary"""
        return {
            'id': self.id,
            'strategy_id': self.strategy_id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'initial_capital': float(self.initial_capital) if self.initial_capital else None,
            'final_capital': float(self.final_capital) if self.final_capital else None,
            'total_return': float(self.total_return) if self.total_return else None,
            'max_drawdown': float(self.max_drawdown) if self.max_drawdown else None,
            'sharpe_ratio': float(self.sharpe_ratio) if self.sharpe_ratio else None,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate': float(self.win_rate) if self.win_rate else None,
            'avg_win': float(self.avg_win) if self.avg_win else None,
            'avg_loss': float(self.avg_loss) if self.avg_loss else None,
            'profit_factor': float(self.profit_factor) if self.profit_factor else None,
            'results_data': self.results_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BacktestParameter(db.Model):
    """Backtesting parameters model"""
    __tablename__ = 'backtest_parameters'
    
    id = db.Column(db.Integer, primary_key=True)
    backtest_id = db.Column(db.Integer, db.ForeignKey('backtest_results.id'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False)
    parameter_value = db.Column(db.String(500), nullable=False)
    parameter_type = db.Column(db.String(50))  # 'int', 'float', 'string', 'bool'
    
    def __repr__(self):
        return f'<BacktestParameter {self.parameter_name}>'
    
    def to_dict(self):
        """Convert parameter to dictionary"""
        return {
            'id': self.id,
            'backtest_id': self.backtest_id,
            'parameter_name': self.parameter_name,
            'parameter_value': self.parameter_value,
            'parameter_type': self.parameter_type
        }
