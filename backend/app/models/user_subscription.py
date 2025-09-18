from .. import db
from datetime import datetime
from sqlalchemy import Enum
import enum

class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIAL = "trial"
    SUSPENDED = "suspended"
    EXPIRED = "expired"

class BillingCycle(enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUALLY = "ANNUALLY"
    BIENNIALLY = "BIENNIALLY"

class UserSubscription(db.Model):
    """User Subscription model linking users to their subscription plans"""
    __tablename__ = 'user_subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=True, index=True)
    subscription_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Subscription Details
    plan_name = db.Column(db.String(50), nullable=False)  # free, premium, pro, enterprise
    plan_type = db.Column(db.String(50), nullable=False)  # monthly, yearly, lifetime
    status = db.Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, index=True)
    
    # Billing Information
    amount = db.Column(db.Numeric(precision=10, scale=2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    billing_cycle = db.Column(Enum(BillingCycle), nullable=False)
    unit_amount = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Dates
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    next_billing_date = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    trial_start = db.Column(db.DateTime, nullable=True)
    trial_end = db.Column(db.DateTime, nullable=True)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    quantity = db.Column(db.Integer, default=1)
    
    # Payment Information
    payment_method = db.Column(db.String(50), nullable=True)  # credit_card, paypal, etc.
    payment_provider = db.Column(db.String(50), nullable=True)  # stripe, paypal, etc.
    payment_provider_id = db.Column(db.String(100), nullable=True)  # external payment ID
    payment_method_id = db.Column(db.String(100), nullable=True)
    last_payment_date = db.Column(db.DateTime, nullable=True)
    next_payment_date = db.Column(db.DateTime, nullable=True)
    
    # Features and Limits
    max_journals = db.Column(db.Integer, nullable=True)
    max_strategies = db.Column(db.Integer, nullable=True)
    max_portfolios = db.Column(db.Integer, nullable=True)
    advanced_analytics = db.Column(db.Boolean, default=False)
    priority_support = db.Column(db.Boolean, default=False)
    api_access = db.Column(db.Boolean, default=False)
    
    # Metadata
    notes = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_by_admin = db.Column(db.Boolean, default=False)
    subscription_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='subscriptions')
    plan = db.relationship('SubscriptionPlan', back_populates='subscriptions')
    
    def __repr__(self):
        return f'<UserSubscription {self.user_id}:{self.plan_name}>'
    
    def to_dict(self):
        """Convert user subscription to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_name': self.plan_name,
            'plan_type': self.plan_type,
            'status': self.status,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'billing_cycle': self.billing_cycle,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'next_billing_date': self.next_billing_date.isoformat() if self.next_billing_date else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'payment_method': self.payment_method,
            'payment_provider': self.payment_provider,
            'payment_provider_id': self.payment_provider_id,
            'max_journals': self.max_journals,
            'max_strategies': self.max_strategies,
            'max_portfolios': self.max_portfolios,
            'advanced_analytics': self.advanced_analytics,
            'priority_support': self.priority_support,
            'api_access': self.api_access,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def is_active(self):
        """Check if subscription is currently active"""
        if self.status != SubscriptionStatus.ACTIVE:
            return False
        if self.end_date and datetime.utcnow() > self.end_date:
            return False
        return True
    
    @property
    def days_remaining(self):
        """Get days remaining in subscription"""
        if not self.end_date:
            return None
        remaining = self.end_date - datetime.utcnow()
        return max(0, remaining.days)
