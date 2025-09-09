from .. import db
from datetime import datetime

# Association table for many-to-many relationship between entries and tags
entry_tags = db.Table('entry_tags',
    db.Column('entry_id', db.Integer, db.ForeignKey('journal_entries.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('journal_tags.id'), primary_key=True)
)

class JournalEntry(db.Model):
    """Trading journal entry model"""
    __tablename__ = 'journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    trade_date = db.Column(db.Date, nullable=False)
    symbol = db.Column(db.String(20))
    entry_price = db.Column(db.Numeric(10, 2))
    exit_price = db.Column(db.Numeric(10, 2))
    quantity = db.Column(db.Integer)
    trade_type = db.Column(db.String(10))  # 'BUY' or 'SELL'
    profit_loss = db.Column(db.Numeric(10, 2))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Many-to-many relationship with tags
    tags = db.relationship('JournalTag', secondary=entry_tags, lazy='subquery',
                          backref=db.backref('entries', lazy=True))
    
    def __repr__(self):
        return f'<JournalEntry {self.title}>'
    
    def to_dict(self):
        """Convert entry to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'trade_date': self.trade_date.isoformat() if self.trade_date else None,
            'symbol': self.symbol,
            'entry_price': float(self.entry_price) if self.entry_price else None,
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'quantity': self.quantity,
            'trade_type': self.trade_type,
            'profit_loss': float(self.profit_loss) if self.profit_loss else None,
            'notes': self.notes,
            'tags': [tag.to_dict() for tag in self.tags],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class JournalTag(db.Model):
    """Tags for categorizing journal entries"""
    __tablename__ = 'journal_tags'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7))  # Hex color code
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<JournalTag {self.name}>'
    
    def to_dict(self):
        """Convert tag to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 