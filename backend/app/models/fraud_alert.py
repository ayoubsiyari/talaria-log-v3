"""
Fraud Alert Models
Handles fraud detection alerts and monitoring
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from .. import db
import enum

class AlertSeverity(enum.Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(enum.Enum):
    """Alert status"""
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"
    CONFIRMED_FRAUD = "confirmed_fraud"

class AlertType(enum.Enum):
    """Alert types"""
    VELOCITY_LIMIT = "velocity_limit"
    HIGH_RISK_BIN = "high_risk_bin"
    VPN_PROXY = "vpn_proxy"
    RAPID_SUBMISSION = "rapid_submission"
    SUSPICIOUS_IP = "suspicious_ip"
    CARD_VALIDATION = "card_validation"
    EMAIL_VALIDATION = "email_validation"
    GENERAL_FRAUD = "general_fraud"

class FraudAlert(db.Model):
    """Fraud alert model to track and manage fraud detection alerts"""
    __tablename__ = 'fraud_alerts'
    
    id = Column(Integer, primary_key=True)
    
    # Alert identification
    alert_id = Column(String(100), unique=True, nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), nullable=False, index=True)
    status = Column(Enum(AlertStatus), nullable=False, default=AlertStatus.PENDING, index=True)
    
    # Risk scoring
    risk_score = Column(Float, nullable=False)
    risk_factors = Column(JSON, nullable=True)  # Store risk factors as JSON
    
    # User and session information
    user_id = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    session_id = Column(String(255), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 compatible
    
    # Payment information
    payment_id = Column(Integer, ForeignKey('payments.id'), nullable=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(3), nullable=True, default='USD')
    
    # Card information (if applicable)
    card_last_four = Column(String(4), nullable=True)
    card_bin = Column(String(6), nullable=True)
    card_brand = Column(String(50), nullable=True)
    
    # Email information
    customer_email = Column(String(255), nullable=True, index=True)
    
    # Alert details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)  # Additional alert details
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Resolution information
    resolved_by = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Notification status
    notification_sent = Column(Boolean, default=False)
    notification_sent_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("AdminUser", foreign_keys=[user_id], backref="fraud_alerts")
    resolver = relationship("AdminUser", foreign_keys=[resolved_by], backref="resolved_fraud_alerts")
    payment = relationship("Payment", backref="fraud_alerts")
    order = relationship("Order", backref="fraud_alerts")
    
    def __repr__(self):
        return f'<FraudAlert {self.alert_id}: {self.alert_type.value} - {self.severity.value}>'
    
    def to_dict(self):
        """Convert alert to dictionary for API responses"""
        return {
            'id': self.id,
            'alert_id': self.alert_id,
            'alert_type': self.alert_type.value,
            'severity': self.severity.value,
            'status': self.status.value,
            'risk_score': self.risk_score,
            'risk_factors': self.risk_factors,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'payment_id': self.payment_id,
            'order_id': self.order_id,
            'amount': self.amount,
            'currency': self.currency,
            'card_last_four': self.card_last_four,
            'card_bin': self.card_bin,
            'card_brand': self.card_brand,
            'customer_email': self.customer_email,
            'title': self.title,
            'description': self.description,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
            'resolution_notes': self.resolution_notes,
            'notification_sent': self.notification_sent,
            'notification_sent_at': self.notification_sent_at.isoformat() if self.notification_sent_at else None
        }
    
    @classmethod
    def create_alert(cls, alert_type, severity, risk_score, title, description, **kwargs):
        """Create a new fraud alert"""
        from uuid import uuid4
        
        alert = cls(
            alert_id=f"FRAUD_{uuid4().hex[:12].upper()}",
            alert_type=alert_type,
            severity=severity,
            risk_score=risk_score,
            title=title,
            description=description,
            **kwargs
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return alert
    
    def resolve(self, resolved_by, resolution_notes=None, status=AlertStatus.RESOLVED):
        """Resolve the alert"""
        self.status = status
        self.resolved_by = resolved_by
        self.resolution_notes = resolution_notes
        self.resolved_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        db.session.commit()
    
    def mark_notification_sent(self):
        """Mark notification as sent"""
        self.notification_sent = True
        self.notification_sent_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        db.session.commit()

class FraudPattern(db.Model):
    """Fraud pattern model to track recurring fraud patterns"""
    __tablename__ = 'fraud_patterns'
    
    id = Column(Integer, primary_key=True)
    
    # Pattern identification
    pattern_type = Column(String(100), nullable=False, index=True)
    pattern_key = Column(String(255), nullable=False, index=True)  # e.g., IP address, email, BIN
    
    # Pattern statistics
    occurrence_count = Column(Integer, nullable=False, default=1)
    first_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Risk assessment
    risk_level = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.LOW)
    total_risk_score = Column(Float, nullable=False, default=0.0)
    average_risk_score = Column(Float, nullable=False, default=0.0)
    
    # Pattern details
    details = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_whitelisted = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<FraudPattern {self.pattern_type}: {self.pattern_key}>'
    
    def update_pattern(self, risk_score):
        """Update pattern statistics with new occurrence"""
        self.occurrence_count += 1
        self.last_seen = datetime.utcnow()
        self.total_risk_score += risk_score
        self.average_risk_score = self.total_risk_score / self.occurrence_count
        
        # Update risk level based on average score
        if self.average_risk_score >= 0.9:
            self.risk_level = AlertSeverity.CRITICAL
        elif self.average_risk_score >= 0.7:
            self.risk_level = AlertSeverity.HIGH
        elif self.average_risk_score >= 0.5:
            self.risk_level = AlertSeverity.MEDIUM
        else:
            self.risk_level = AlertSeverity.LOW
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert pattern to dictionary for API responses"""
        return {
            'id': self.id,
            'pattern_type': self.pattern_type,
            'pattern_key': self.pattern_key,
            'occurrence_count': self.occurrence_count,
            'first_seen': self.first_seen.isoformat() if self.first_seen else None,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'risk_level': self.risk_level.value,
            'total_risk_score': self.total_risk_score,
            'average_risk_score': self.average_risk_score,
            'details': self.details,
            'is_active': self.is_active,
            'is_whitelisted': self.is_whitelisted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
