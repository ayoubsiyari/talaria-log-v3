"""
Coupon Model
Handles discount coupons and promotions
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from .. import db

class Coupon(db.Model):
    """Coupon model for discounts"""
    __tablename__ = 'coupons'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    discount_percent = Column(Float, nullable=False)  # Percentage discount
    max_uses = Column(Integer, nullable=True)  # null = unlimited
    used_count = Column(Integer, default=0)
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)  # null = never expires
    is_active = Column(Boolean, default=True)
    applicable_plans = Column(JSON, nullable=True)  # List of plan IDs, null = all plans
    minimum_amount = Column(Float, default=0.0)  # Minimum order amount
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Coupon {self.code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'description': self.description,
            'discount_percent': self.discount_percent,
            'max_uses': self.max_uses,
            'used_count': self.used_count,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'is_active': self.is_active,
            'applicable_plans': self.applicable_plans,
            'minimum_amount': self.minimum_amount,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_valid(self, plan_id=None, amount=None):
        """Check if coupon is valid for given plan and amount"""
        if not self.is_active:
            return False
        
        now = datetime.utcnow()
        if self.valid_from and now < self.valid_from:
            return False
        
        if self.valid_until and now > self.valid_until:
            return False
        
        if self.max_uses and self.used_count >= self.max_uses:
            return False
        
        if self.applicable_plans and plan_id not in self.applicable_plans:
            return False
        
        if amount and amount < self.minimum_amount:
            return False
        
        return True
    
    def apply_discount(self, amount):
        """Apply discount to amount"""
        if not self.is_valid():
            return amount
        
        discount = amount * (self.discount_percent / 100)
        return amount - discount
