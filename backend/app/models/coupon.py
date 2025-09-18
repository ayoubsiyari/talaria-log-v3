"""
Coupon Model
Handles discount coupons and promotions
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
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
    
    # Affiliate referral fields
    affiliate_id = Column(Integer, ForeignKey('affiliates.id'), nullable=True)  # Link to affiliate
    is_affiliate_code = Column(Boolean, default=False)  # Is this an affiliate referral code?
    affiliate_commission_percent = Column(Float, nullable=True)  # Commission for affiliate
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    affiliate = relationship('Affiliate', backref='referral_codes')
    
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
            # Affiliate fields
            'affiliate_id': self.affiliate_id,
            'is_affiliate_code': self.is_affiliate_code,
            'affiliate_commission_percent': self.affiliate_commission_percent,
            'affiliate_name': self.affiliate.name if self.affiliate else None,
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
    
    def calculate_affiliate_commission(self, amount):
        """Calculate affiliate commission for this referral"""
        if not self.is_affiliate_code or not self.affiliate_commission_percent:
            return 0.0
        
        return amount * (self.affiliate_commission_percent / 100)
    
    def record_referral(self):
        """Record when someone uses this referral code (not necessarily a conversion)"""
        self.used_count += 1
        
        # Track referral (person using code) if this is an affiliate code
        if self.is_affiliate_code and self.affiliate:
            self.affiliate.referrals += 1
            self.affiliate.update_conversion_rate()
            self.affiliate.calculate_performance()
        
        db.session.commit()
    
    def record_conversion(self, amount):
        """Record a successful conversion (payment) from this referral code"""
        if not self.is_affiliate_code or not self.affiliate or not amount:
            return
        
        # Track conversion (successful payment) and calculate commission
        commission = self.calculate_affiliate_commission(amount)
        self.affiliate.total_earnings += commission
        self.affiliate.conversions += 1
        
        # Update performance metrics based on new values
        self.affiliate.update_conversion_rate()
        self.affiliate.calculate_performance()
        
        db.session.commit()
    
    def record_usage(self, amount=None):
        """Legacy method - now calls record_conversion for backward compatibility"""
        if amount:
            self.record_conversion(amount)
        else:
            self.record_referral()
    
    @classmethod
    def create_affiliate_code(cls, affiliate_id, code=None, discount_percent=10, commission_percent=None, description=None):
        """Create a new affiliate referral code"""
        from .affiliate import Affiliate
        
        affiliate = Affiliate.query.get(affiliate_id)
        if not affiliate:
            raise ValueError("Affiliate not found")
        
        # Auto-generate code if not provided
        if not code:
            base_code = f"{affiliate.name.upper().replace(' ', '')[:3]}{affiliate.id:04d}"
            code = base_code
            counter = 1
            
            # Check if code already exists and increment if needed
            while cls.query.filter_by(code=code).first():
                code = f"{base_code}_{counter}"
                counter += 1
        
        # Use affiliate's commission rate if not specified
        if commission_percent is None:
            commission_percent = affiliate.commission_rate
        
        # Create the coupon
        coupon = cls(
            code=code,
            description=description or f"Referral code for {affiliate.name}",
            discount_percent=discount_percent,
            is_affiliate_code=True,
            affiliate_id=affiliate_id,
            affiliate_commission_percent=commission_percent,
            is_active=True
        )
        
        db.session.add(coupon)
        db.session.commit()
        return coupon
