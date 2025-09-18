"""
Webhook Audit Log Models
Handles webhook audit logging for security and compliance
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Index
from sqlalchemy.orm import relationship
from .. import db
import json

class WebhookAuditLog(db.Model):
    """Model to track webhook audit logs for security and compliance"""
    __tablename__ = 'webhook_audit_logs'
    
    id = Column(Integer, primary_key=True)
    
    # Webhook identification
    webhook_id = Column(String(255), nullable=True, index=True)
    provider = Column(String(50), nullable=False, index=True)  # stripe, paypal, etc.
    event_type = Column(String(100), nullable=True, index=True)
    
    # Request information
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    request_headers = Column(JSON, nullable=True)  # Filtered headers
    request_payload = Column(Text, nullable=True)  # Store as text for large payloads
    
    # Security information
    verification_status = Column(Boolean, nullable=False, index=True)
    signature_valid = Column(Boolean, nullable=True)
    signature_header = Column(String(500), nullable=True)
    
    # Processing information
    processing_status = Column(String(50), nullable=False, index=True)  # success, failed, duplicate
    processing_result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing information
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True, index=True)
    processing_duration_ms = Column(Integer, nullable=True)  # Processing time in milliseconds
    
    # Additional metadata
    metadata = Column(JSON, nullable=True)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_webhook_provider_status', 'provider', 'processing_status'),
        Index('idx_webhook_verification_status', 'verification_status'),
        Index('idx_webhook_received_at', 'received_at'),
        Index('idx_webhook_ip_address', 'ip_address'),
    )
    
    def __repr__(self):
        return f'<WebhookAuditLog {self.webhook_id}: {self.provider} - {self.processing_status}>'
    
    def to_dict(self):
        """Convert audit log to dictionary for API responses"""
        return {
            'id': self.id,
            'webhook_id': self.webhook_id,
            'provider': self.provider,
            'event_type': self.event_type,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_headers': self.request_headers,
            'verification_status': self.verification_status,
            'signature_valid': self.signature_valid,
            'processing_status': self.processing_status,
            'processing_result': self.processing_result,
            'error_message': self.error_message,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'processing_duration_ms': self.processing_duration_ms,
            'metadata': self.metadata
        }
    
    @classmethod
    def create_audit_log(cls, webhook_id: str, provider: str, event_type: str = None,
                        ip_address: str = None, user_agent: str = None, 
                        request_headers: dict = None, request_payload: str = None,
                        verification_status: bool = False, signature_valid: bool = None,
                        signature_header: str = None, processing_status: str = 'pending',
                        processing_result: dict = None, error_message: str = None,
                        processing_duration_ms: int = None, metadata: dict = None):
        """Create a new webhook audit log entry"""
        
        audit_log = cls(
            webhook_id=webhook_id,
            provider=provider,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            request_headers=request_headers,
            request_payload=request_payload,
            verification_status=verification_status,
            signature_valid=signature_valid,
            signature_header=signature_header,
            processing_status=processing_status,
            processing_result=processing_result,
            error_message=error_message,
            processing_duration_ms=processing_duration_ms,
            metadata=metadata
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        return audit_log
    
    def update_processing_result(self, processing_status: str, processing_result: dict = None, 
                               error_message: str = None, processing_duration_ms: int = None):
        """Update audit log with processing results"""
        self.processing_status = processing_status
        self.processing_result = processing_result
        self.error_message = error_message
        self.processing_duration_ms = processing_duration_ms
        self.processed_at = datetime.utcnow()
        
        db.session.commit()
    
    @classmethod
    def get_audit_stats(cls, hours: int = 24):
        """Get webhook audit statistics for the last N hours"""
        from datetime import timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        total = cls.query.filter(cls.received_at >= cutoff_time).count()
        verified = cls.query.filter(
            cls.received_at >= cutoff_time,
            cls.verification_status == True
        ).count()
        successful = cls.query.filter(
            cls.received_at >= cutoff_time,
            cls.processing_status == 'success'
        ).count()
        failed = cls.query.filter(
            cls.received_at >= cutoff_time,
            cls.processing_status == 'failed'
        ).count()
        duplicates = cls.query.filter(
            cls.received_at >= cutoff_time,
            cls.processing_status == 'duplicate'
        ).count()
        
        return {
            'total_webhooks': total,
            'verified_webhooks': verified,
            'successful_webhooks': successful,
            'failed_webhooks': failed,
            'duplicate_webhooks': duplicates,
            'verification_rate': (verified / total * 100) if total > 0 else 0,
            'success_rate': (successful / total * 100) if total > 0 else 0,
            'time_period_hours': hours
        }
    
    @classmethod
    def cleanup_old_logs(cls, older_than_days: int = 30):
        """Clean up old audit logs"""
        from datetime import timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(days=older_than_days)
        old_logs = cls.query.filter(cls.received_at < cutoff_time).all()
        count = len(old_logs)
        
        for log in old_logs:
            db.session.delete(log)
        
        db.session.commit()
        return count
