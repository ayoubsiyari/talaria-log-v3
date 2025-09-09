from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from .. import db
import json


class UserActivityLog(db.Model):
    """User activity logs for comprehensive tracking and analytics"""
    __tablename__ = 'user_activity_logs'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Activity Information
    action_type = Column(String(100), nullable=False, index=True)  # login, logout, create_journal, update_profile, etc.
    action_category = Column(String(50), nullable=False, index=True)  # authentication, journal, profile, admin, etc.
    action_subcategory = Column(String(50), nullable=True, index=True)  # more specific categorization
    
    # Session and Request Information
    session_id = Column(String(255), nullable=True, index=True)
    request_id = Column(String(255), nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True, index=True)
    country_code = Column(String(3), nullable=True, index=True)
    city = Column(String(100), nullable=True)
    
    # Resource Information
    resource_type = Column(String(50), nullable=True, index=True)  # user, journal, strategy, etc.
    resource_id = Column(Integer, nullable=True, index=True)
    resource_name = Column(String(255), nullable=True)
    
    # Activity Details
    description = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)  # Flexible storage for action-specific data
    activity_metadata = Column(JSON, nullable=True)  # Additional context and metadata
    
    # Status and Result
    status = Column(String(20), default='success', index=True)  # success, failed, pending, etc.
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)  # Time taken for the action
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Partitioning support (for future implementation)
    partition_date = Column(String(10), nullable=True, index=True)  # YYYY-MM-DD format
    
    # Relationships
    # user = relationship('User', back_populates='activity_logs')
    # admin_user = relationship('AdminUser', back_populates='activity_logs')

    def __repr__(self):
        return f'<UserActivityLog {self.user_id}:{self.action_type}:{self.created_at}>'

    def to_dict(self):
        """Convert activity log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'admin_user_id': self.admin_user_id,
            'action_type': self.action_type,
            'action_category': self.action_category,
            'action_subcategory': self.action_subcategory,
            'session_id': self.session_id,
            'request_id': self.request_id,
            'user_agent': self.user_agent,
            'ip_address': self.ip_address,
            'country_code': self.country_code,
            'city': self.city,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'resource_name': self.resource_name,
            'description': self.description,
            'details': self.details,
            'metadata': self.activity_metadata,
            'status': self.status,
            'error_message': self.error_message,
            'duration_ms': self.duration_ms,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'partition_date': self.partition_date
        }

    @hybrid_property
    def is_successful(self):
        """Check if activity was successful"""
        return self.status == 'success'

    @hybrid_property
    def is_admin_activity(self):
        """Check if this is an admin user activity"""
        return self.admin_user_id is not None

    @hybrid_property
    def activity_summary(self):
        """Get a summary of the activity"""
        if self.description:
            return self.description
        return f"{self.action_type} on {self.resource_type or 'system'}"

    def set_partition_date(self):
        """Set partition date based on created_at"""
        if self.created_at:
            self.partition_date = self.created_at.strftime('%Y-%m-%d')

    def add_detail(self, key, value):
        """Add a detail to the JSON details field"""
        if self.details is None:
            self.details = {}
        self.details[key] = value

    def add_metadata(self, key, value):
        """Add metadata to the JSON metadata field"""
        if self.activity_metadata is None:
            self.activity_metadata = {}
        self.activity_metadata[key] = value


class ActivityAnalytics(db.Model):
    """Pre-computed analytics for activity data"""
    __tablename__ = 'activity_analytics'

    id = Column(Integer, primary_key=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Activity counts
    total_activities = Column(Integer, default=0)
    successful_activities = Column(Integer, default=0)
    failed_activities = Column(Integer, default=0)
    
    # Action type breakdown
    action_breakdown = Column(JSON, nullable=True)  # {action_type: count}
    category_breakdown = Column(JSON, nullable=True)  # {category: count}
    
    # Performance metrics
    avg_duration_ms = Column(Integer, nullable=True)
    max_duration_ms = Column(Integer, nullable=True)
    min_duration_ms = Column(Integer, nullable=True)
    
    # Geographic data
    unique_ips = Column(Integer, default=0)
    unique_countries = Column(Integer, default=0)
    country_breakdown = Column(JSON, nullable=True)  # {country_code: count}
    
    # Resource usage
    resource_breakdown = Column(JSON, nullable=True)  # {resource_type: count}
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<ActivityAnalytics {self.date}:{self.user_id or "global"}>'

    def to_dict(self):
        """Convert analytics to dictionary"""
        return {
            'id': self.id,
            'date': self.date,
            'user_id': self.user_id,
            'total_activities': self.total_activities,
            'successful_activities': self.successful_activities,
            'failed_activities': self.failed_activities,
            'action_breakdown': self.action_breakdown,
            'category_breakdown': self.category_breakdown,
            'avg_duration_ms': self.avg_duration_ms,
            'max_duration_ms': self.max_duration_ms,
            'min_duration_ms': self.min_duration_ms,
            'unique_ips': self.unique_ips,
            'unique_countries': self.unique_countries,
            'country_breakdown': self.country_breakdown,
            'resource_breakdown': self.resource_breakdown,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ActivityExport(db.Model):
    """Activity export jobs for compliance and audit"""
    __tablename__ = 'activity_exports'

    id = Column(Integer, primary_key=True)
    requested_by = Column(Integer, ForeignKey('admin_users.id'), nullable=False)
    
    # Export Configuration
    export_type = Column(String(50), nullable=False)  # user_activity, admin_activity, all_activity
    format = Column(String(20), default='csv')  # csv, json, excel
    
    # Filter Criteria
    user_ids = Column(JSON, nullable=True)  # List of user IDs to include
    date_from = Column(DateTime, nullable=True)
    date_to = Column(DateTime, nullable=True)
    action_types = Column(JSON, nullable=True)  # List of action types to include
    categories = Column(JSON, nullable=True)  # List of categories to include
    
    # Export Status
    status = Column(String(20), default='pending', index=True)  # pending, processing, completed, failed
    progress = Column(Integer, default=0)  # 0-100 percentage
    
    # File Information
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    record_count = Column(Integer, nullable=True)
    
    # Error Information
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # When the export file should be deleted

    def __repr__(self):
        return f'<ActivityExport {self.id}:{self.export_type}:{self.status}>'

    def to_dict(self):
        """Convert export to dictionary"""
        return {
            'id': self.id,
            'requested_by': self.requested_by,
            'export_type': self.export_type,
            'format': self.format,
            'user_ids': self.user_ids,
            'date_from': self.date_from.isoformat() if self.date_from else None,
            'date_to': self.date_to.isoformat() if self.date_to else None,
            'action_types': self.action_types,
            'categories': self.categories,
            'status': self.status,
            'progress': self.progress,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'record_count': self.record_count,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

    @hybrid_property
    def is_completed(self):
        """Check if export is completed"""
        return self.status == 'completed'

    @hybrid_property
    def is_failed(self):
        """Check if export failed"""
        return self.status == 'failed'

    @hybrid_property
    def is_expired(self):
        """Check if export file has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
