from .. import db
from datetime import datetime
from sqlalchemy import func

class Promotion(db.Model):
    __tablename__ = 'promotions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False, default='percentage')  # 'percentage', 'fixed', 'trial_extension'
    value = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)  # 'active', 'paused', 'scheduled', 'expired'
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    usage_limit = db.Column(db.Integer, default=None)  # None means unlimited
    usage_count = db.Column(db.Integer, default=0)
    revenue = db.Column(db.Numeric(10, 2), default=0)  # Total revenue generated
    conversions = db.Column(db.Integer, default=0)  # Number of successful conversions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'code': self.code,
            'type': self.type,
            'value': float(self.value),
            'status': self.status,
            'startDate': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'endDate': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'usageLimit': self.usage_limit,
            'usageCount': self.usage_count,
            'revenue': float(self.revenue),
            'conversions': self.conversions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update_status(self):
        """Update promotion status based on dates and usage"""
        now = datetime.utcnow()
        
        # Check if expired
        if self.end_date and now > self.end_date:
            self.status = 'expired'
        # Check if scheduled
        elif self.start_date and now < self.start_date:
            self.status = 'scheduled'
        # Check if usage limit reached
        elif self.usage_limit and self.usage_count >= self.usage_limit:
            self.status = 'expired'
        # Otherwise active (unless manually paused)
        elif self.status not in ['paused', 'expired']:
            self.status = 'active'
        
        return self.status

    def is_valid(self):
        """Check if promotion is valid for use"""
        # Update status first
        self.update_status()
        
        # Check if active
        if self.status != 'active':
            return False
        
        # Check usage limits
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        
        # Check dates
        now = datetime.utcnow()
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        
        return True

    def increment_usage(self, revenue_amount=0):
        """Increment usage count and revenue"""
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False, "Usage limit reached"
        
        if self.status != 'active':
            return False, f"Promotion is {self.status}"
        
        self.usage_count += 1
        self.revenue += revenue_amount
        self.conversions += 1
        self.update_status()
        return True, "Success"

    def __repr__(self):
        return f'<Promotion {self.name}>'
