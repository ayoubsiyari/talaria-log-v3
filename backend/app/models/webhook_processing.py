"""
Webhook Processing Models
Handles webhook processing records for idempotency and audit trails
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Index
from sqlalchemy.orm import relationship
from .. import db
import json

class WebhookProcessingRecord(db.Model):
    """Model to track webhook processing for idempotency"""
    __tablename__ = 'webhook_processing_records'
    
    id = Column(Integer, primary_key=True)
    
    # Webhook identification
    webhook_id = Column(String(255), unique=True, nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)  # stripe, paypal, etc.
    event_type = Column(String(100), nullable=True, index=True)
    
    # Processing status
    status = Column(String(50), nullable=False, default='processing', index=True)  # processing, completed, failed
    processing_result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Request information
    request_headers = Column(JSON, nullable=True)
    request_payload = Column(Text, nullable=True)  # Store as text for large payloads
    signature = Column(String(500), nullable=True)
    
    # Timestamps
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    
    # Retry information
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=5)
    
    # Additional metadata
    metadata = Column(JSON, nullable=True)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_webhook_provider_status', 'provider', 'status'),
        Index('idx_webhook_expires_at', 'expires_at'),
        Index('idx_webhook_received_at', 'received_at'),
    )
    
    def __repr__(self):
        return f'<WebhookProcessingRecord {self.webhook_id}: {self.provider} - {self.status}>'
    
    def to_dict(self):
        """Convert record to dictionary for API responses"""
        return {
            'id': self.id,
            'webhook_id': self.webhook_id,
            'provider': self.provider,
            'event_type': self.event_type,
            'status': self.status,
            'processing_result': self.processing_result,
            'error_message': self.error_message,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries,
            'metadata': self.metadata
        }
    
    @classmethod
    def create_record(cls, webhook_id: str, provider: str, event_type: str = None, 
                     request_headers: dict = None, request_payload: str = None, 
                     signature: str = None, idempotency_window: int = 300, 
                     auto_commit: bool = True):
        """Create a new webhook processing record"""
        expires_at = datetime.utcnow() + timedelta(seconds=idempotency_window)
        
        record = cls(
            webhook_id=webhook_id,
            provider=provider,
            event_type=event_type,
            request_headers=request_headers,
            request_payload=request_payload,
            signature=signature,
            expires_at=expires_at
        )
        
        db.session.add(record)
        
        if auto_commit:
            db.session.commit()
        
        return record
    
    def mark_completed(self, processing_result: dict = None, auto_commit: bool = True):
        """Mark webhook as completed"""
        self.status = 'completed'
        self.processing_result = processing_result
        self.processed_at = datetime.utcnow()
        
        if auto_commit:
            db.session.commit()
    
    def mark_failed(self, error_message: str, processing_result: dict = None):
        """Mark webhook as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.processing_result = processing_result
        self.processed_at = datetime.utcnow()
        
        db.session.commit()
    
    def increment_retry(self):
        """Increment retry count"""
        self.retry_count += 1
        db.session.commit()
    
    @classmethod
    def find_by_webhook_id(cls, webhook_id: str):
        """Find webhook processing record by webhook ID"""
        return cls.query.filter_by(webhook_id=webhook_id).first()
    
    @classmethod
    def cleanup_expired(cls, before_time: datetime = None):
        """Clean up expired webhook processing records"""
        if before_time is None:
            before_time = datetime.utcnow()
        
        expired_records = cls.query.filter(cls.expires_at < before_time).all()
        count = len(expired_records)
        
        for record in expired_records:
            db.session.delete(record)
        
        db.session.commit()
        return count
    
    @classmethod
    def get_stats(cls):
        """Get webhook processing statistics"""
        total = cls.query.count()
        completed = cls.query.filter_by(status='completed').count()
        failed = cls.query.filter_by(status='failed').count()
        processing = cls.query.filter_by(status='processing').count()
        
        return {
            'total': total,
            'completed': completed,
            'failed': failed,
            'processing': processing,
            'success_rate': (completed / total * 100) if total > 0 else 0
        }
