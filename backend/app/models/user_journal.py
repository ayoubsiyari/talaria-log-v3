from .. import db
from datetime import datetime

class UserJournal(db.Model):
    """User Journal model for tracking journal creation and management"""
    __tablename__ = 'user_journals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Journal Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    journal_type = db.Column(db.String(50), nullable=False, default='trading')  # trading, investment, learning, etc.
    status = db.Column(db.String(20), nullable=False, default='active')  # active, archived, deleted
    
    # Journal Settings
    is_public = db.Column(db.Boolean, default=False)
    allow_comments = db.Column(db.Boolean, default=True)
    allow_sharing = db.Column(db.Boolean, default=False)
    
    # Statistics
    total_entries = db.Column(db.Integer, default=0)
    total_trades = db.Column(db.Integer, default=0)
    total_profit_loss = db.Column(db.Numeric(precision=15, scale=2), default=0)
    win_rate = db.Column(db.Numeric(precision=5, scale=2), nullable=True)  # percentage
    avg_win = db.Column(db.Numeric(precision=10, scale=2), nullable=True)
    avg_loss = db.Column(db.Numeric(precision=10, scale=2), nullable=True)
    
    # Performance Tracking
    best_trade = db.Column(db.Numeric(precision=10, scale=2), nullable=True)
    worst_trade = db.Column(db.Numeric(precision=10, scale=2), nullable=True)
    longest_winning_streak = db.Column(db.Integer, default=0)
    longest_losing_streak = db.Column(db.Integer, default=0)
    
    # Metadata
    tags = db.Column(db.String(500), nullable=True)  # comma-separated tags
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_entry_date = db.Column(db.DateTime, nullable=True)
    
    # Relationship
    user = db.relationship('User', back_populates='user_journals')
    
    def __repr__(self):
        return f'<UserJournal {self.user_id}:{self.title}>'
    
    def to_dict(self):
        """Convert user journal to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'journal_type': self.journal_type,
            'status': self.status,
            'is_public': self.is_public,
            'allow_comments': self.allow_comments,
            'allow_sharing': self.allow_sharing,
            'total_entries': self.total_entries,
            'total_trades': self.total_trades,
            'total_profit_loss': float(self.total_profit_loss) if self.total_profit_loss else 0,
            'win_rate': float(self.win_rate) if self.win_rate else None,
            'avg_win': float(self.avg_win) if self.avg_win else None,
            'avg_loss': float(self.avg_loss) if self.avg_loss else None,
            'best_trade': float(self.best_trade) if self.best_trade else None,
            'worst_trade': float(self.worst_trade) if self.worst_trade else None,
            'longest_winning_streak': self.longest_winning_streak,
            'longest_losing_streak': self.longest_losing_streak,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_entry_date': self.last_entry_date.isoformat() if self.last_entry_date else None
        }
    
    def update_statistics(self):
        """Update journal statistics based on entries"""
        # This method would be called when entries are added/updated
        # For now, it's a placeholder for future implementation
        pass
    
    @property
    def is_active(self):
        """Check if journal is active"""
        return self.status == 'active'
    
    @property
    def tag_list(self):
        """Get tags as a list"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
    
    @tag_list.setter
    def tag_list(self, tags):
        """Set tags from a list"""
        if isinstance(tags, list):
            self.tags = ', '.join(tags)
        else:
            self.tags = tags
