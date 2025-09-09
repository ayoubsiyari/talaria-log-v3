"""
Subscription Models
Handles subscription plans, user subscriptions, and billing cycles
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from .. import db
import enum

class BillingCycle(enum.Enum):
    """Billing cycle options"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    BIENNIALLY = "biennially"

class SubscriptionStatus(enum.Enum):
    """Subscription status options"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PAST_DUE = "past_due"
    TRIAL = "trial"

class SubscriptionPlan(db.Model):
    """Subscription plan model"""
    __tablename__ = 'subscription_plans'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    
    # Features
    features = Column(JSON, nullable=True)  # List of features included
    sidebar_components = Column(JSON, nullable=True)  # List of sidebar components included
    max_users = Column(Integer, nullable=True)
    max_projects = Column(Integer, nullable=True)
    storage_limit = Column(Integer, nullable=True)  # in MB
    
    # Trial settings
    trial_days = Column(Integer, default=0)
    trial_price = Column(Float, default=0.0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    visible_to_regular_users = Column(Boolean, default=True)
    visible_to_admin_users = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship('UserSubscription', back_populates='plan')
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'billing_cycle': self.billing_cycle.value,
            'features': self.features or [],
            'sidebar_components': self.sidebar_components or [],
            'max_users': self.max_users,
            'max_projects': self.max_projects,
            'storage_limit': self.storage_limit,
            'trial_days': self.trial_days,
            'trial_price': self.trial_price,
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'visible_to_regular_users': self.visible_to_regular_users,
            'visible_to_admin_users': self.visible_to_admin_users,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_next_billing_date(self, from_date=None):
        """Calculate next billing date based on billing cycle"""
        if not from_date:
            from_date = datetime.utcnow()
        
        if self.billing_cycle == BillingCycle.MONTHLY:
            return from_date + timedelta(days=30)
        elif self.billing_cycle == BillingCycle.QUARTERLY:
            return from_date + timedelta(days=90)
        elif self.billing_cycle == BillingCycle.YEARLY:
            return from_date + timedelta(days=365)
        
        return from_date + timedelta(days=30)  # Default to monthly



class SubscriptionInvoice(db.Model):
    """Subscription invoice model"""
    __tablename__ = 'subscription_invoices'
    
    id = Column(Integer, primary_key=True)
    subscription_id = Column(Integer, ForeignKey('user_subscriptions.id'), nullable=False)
    
    # Invoice details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='usd')
    status = Column(String(50), default='pending')  # pending, paid, failed, void
    
    # Billing period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Stripe integration
    stripe_invoice_id = Column(String(255), nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f'<SubscriptionInvoice {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
