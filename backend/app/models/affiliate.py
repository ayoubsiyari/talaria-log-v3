from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from .. import db

Base = declarative_base()

class Affiliate(db.Model):
    __tablename__ = 'affiliates'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    status = Column(Enum('active', 'pending', 'suspended', 'inactive', name='affiliate_status'), 
                   default='pending', nullable=False)
    join_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    commission_rate = Column(Float, default=20.0, nullable=False)  # Percentage
    total_earnings = Column(Float, default=0.0, nullable=False)
    referrals = Column(Integer, default=0, nullable=False)
    conversions = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False)  # Percentage
    website = Column(String(255))
    social_media = Column(String(255))
    category = Column(String(100))  # Blog, Influencer, Podcast, YouTube, News, etc.
    performance = Column(Enum('excellent', 'good', 'poor', 'new', name='affiliate_performance'), 
                        default='new', nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Affiliate {self.name}>'
    
    def to_dict(self):
        """Convert affiliate to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'status': self.status,
            'joinDate': self.join_date.isoformat() if self.join_date else None,
            'commissionRate': self.commission_rate,
            'totalEarnings': self.total_earnings,
            'referrals': self.referrals,
            'conversions': self.conversions,
            'conversionRate': self.conversion_rate,
            'website': self.website,
            'socialMedia': self.social_media,
            'category': self.category,
            'performance': self.performance,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create(cls, **kwargs):
        """Create a new affiliate"""
        affiliate = cls(**kwargs)
        db.session.add(affiliate)
        db.session.commit()
        return affiliate
    
    def update(self, **kwargs):
        """Update affiliate fields"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self
    
    def delete(self):
        """Delete affiliate"""
        db.session.delete(self)
        db.session.commit()
    
    def calculate_performance(self):
        """Calculate and update performance based on conversion rate"""
        if self.conversion_rate >= 40:
            self.performance = 'excellent'
        elif self.conversion_rate >= 30:
            self.performance = 'good'
        elif self.conversion_rate >= 10:
            self.performance = 'poor'
        else:
            self.performance = 'new'
        return self.performance
    
    def update_conversion_rate(self):
        """Recalculate conversion rate based on referrals and conversions"""
        if self.referrals > 0:
            self.conversion_rate = round((self.conversions / self.referrals) * 100, 1)
        else:
            self.conversion_rate = 0.0
        return self.conversion_rate