from datetime import datetime
from .. import db

class Portfolio(db.Model):
    """Portfolio model for managing trading portfolios"""
    __tablename__ = 'portfolios'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    initial_balance = db.Column(db.Numeric(15, 2), nullable=False)
    current_balance = db.Column(db.Numeric(15, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    positions = db.relationship('Position', backref='portfolio', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Portfolio {self.name}>'
    
    def to_dict(self):
        """Convert portfolio to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'initial_balance': float(self.initial_balance) if self.initial_balance else None,
            'current_balance': float(self.current_balance) if self.current_balance else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Position(db.Model):
    """Position model for individual holdings in a portfolio"""
    __tablename__ = 'positions'
    
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    average_price = db.Column(db.Numeric(10, 2), nullable=False)
    current_price = db.Column(db.Numeric(10, 2))
    market_value = db.Column(db.Numeric(15, 2))
    unrealized_pnl = db.Column(db.Numeric(15, 2))
    unrealized_pnl_percent = db.Column(db.Numeric(10, 4))
    position_type = db.Column(db.String(10))  # 'LONG' or 'SHORT'
    entry_date = db.Column(db.Date, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Position {self.symbol}>'
    
    def to_dict(self):
        """Convert position to dictionary"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'average_price': float(self.average_price) if self.average_price else None,
            'current_price': float(self.current_price) if self.current_price else None,
            'market_value': float(self.market_value) if self.market_value else None,
            'unrealized_pnl': float(self.unrealized_pnl) if self.unrealized_pnl else None,
            'unrealized_pnl_percent': float(self.unrealized_pnl_percent) if self.unrealized_pnl_percent else None,
            'position_type': self.position_type,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        } 