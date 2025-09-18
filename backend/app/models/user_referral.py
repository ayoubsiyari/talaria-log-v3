"""
UserReferral Model
Tracks individual users who signed up through affiliate referral codes
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from .. import db

class UserReferral(db.Model):
    """Model to track individual referrals from affiliates"""
    __tablename__ = 'user_referrals'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Null if user hasn't registered yet
    affiliate_id = Column(Integer, ForeignKey('affiliates.id'), nullable=False)
    coupon_id = Column(Integer, ForeignKey('coupons.id'), nullable=False)  # The specific coupon code used
    
    # Referral details
    coupon_code = Column(String(50), nullable=False)  # Store code for reference even if coupon is deleted
    user_email = Column(String(255), nullable=True)  # Store email even before user registers
    user_name = Column(String(255), nullable=True)
    
    # Tracking status
    referred_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When they first used the code
    registered_at = Column(DateTime, nullable=True)  # When they completed registration
    converted_at = Column(DateTime, nullable=True)  # When they made their first purchase
    
    # Conversion details
    is_converted = Column(Boolean, default=False)  # Has made a purchase
    conversion_amount = Column(Float, nullable=True)  # Amount of first purchase
    commission_earned = Column(Float, nullable=True)  # Commission paid to affiliate
    
    # Metadata
    referral_source = Column(String(100), nullable=True)  # web, mobile, api, etc.
    referral_medium = Column(String(100), nullable=True)  # organic, social, email, etc.
    ip_address = Column(String(45), nullable=True)  # Store IP for fraud detection
    user_agent = Column(String(500), nullable=True)  # Store user agent
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='referrals')
    affiliate = relationship('Affiliate', backref='user_referrals')
    coupon = relationship('Coupon', backref='user_referrals')
    
    def __repr__(self):
        return f'<UserReferral {self.coupon_code} -> {self.user_email}>'
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'affiliate_id': self.affiliate_id,
            'coupon_id': self.coupon_id,
            'coupon_code': self.coupon_code,
            'user_email': self.user_email,
            'user_name': self.user_name,
            'referred_at': self.referred_at.isoformat() if self.referred_at else None,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'converted_at': self.converted_at.isoformat() if self.converted_at else None,
            'is_converted': self.is_converted,
            'conversion_amount': self.conversion_amount,
            'commission_earned': self.commission_earned,
            'referral_source': self.referral_source,
            'referral_medium': self.referral_medium,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'affiliate': {
                'id': self.affiliate.id,
                'name': self.affiliate.name,
                'email': self.affiliate.email
            } if self.affiliate else None,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.full_name
            } if self.user else None
        }
    
    @classmethod
    def create_referral(cls, affiliate_id, coupon_code, user_email=None, user_name=None, 
                       source=None, medium=None, ip_address=None, user_agent=None):
        """Create a new referral record"""
        from .coupon import Coupon
        
        # Find the coupon
        coupon = Coupon.query.filter_by(code=coupon_code, is_affiliate_code=True).first()
        if not coupon:
            raise ValueError(f"Affiliate coupon '{coupon_code}' not found")
        
        if coupon.affiliate_id != affiliate_id:
            raise ValueError(f"Coupon '{coupon_code}' does not belong to affiliate {affiliate_id}")
        
        # Create referral record
        referral = cls(
            affiliate_id=affiliate_id,
            coupon_id=coupon.id,
            coupon_code=coupon_code,
            user_email=user_email,
            user_name=user_name,
            referral_source=source,
            referral_medium=medium,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(referral)
        db.session.commit()
        return referral
    
    def mark_registered(self, user_id=None):
        """Mark this referral as having completed registration"""
        self.registered_at = datetime.utcnow()
        if user_id:
            self.user_id = user_id
        db.session.commit()
    
    def mark_converted(self, amount, commission=None):
        """Mark this referral as converted (made a purchase)"""
        self.is_converted = True
        self.converted_at = datetime.utcnow()
        self.conversion_amount = amount
        if commission:
            self.commission_earned = commission
        db.session.commit()
        
        # Update affiliate stats
        if self.affiliate:
            if not self.converted_at:  # First time conversion
                self.affiliate.conversions += 1
                self.affiliate.total_earnings += (commission or 0)
                self.affiliate.update_conversion_rate()
                self.affiliate.calculate_performance()
                db.session.commit()
    
    @property
    def status(self):
        """Get current status of this referral"""
        if self.is_converted:
            return 'converted'
        elif self.registered_at:
            return 'registered'
        else:
            return 'referred'
    
    @property
    def days_since_referral(self):
        """Get number of days since initial referral"""
        if self.referred_at:
            return (datetime.utcnow() - self.referred_at).days
        return 0