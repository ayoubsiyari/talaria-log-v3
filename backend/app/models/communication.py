from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from .. import db
import enum


class NotificationType(enum.Enum):
    """Notification types for different communication channels"""
    EMAIL = 'email'
    SMS = 'sms'
    PUSH = 'push'
    IN_APP = 'in_app'
    WEBHOOK = 'webhook'


class NotificationPriority(enum.Enum):
    """Notification priority levels"""
    LOW = 'low'
    NORMAL = 'normal'
    HIGH = 'high'
    URGENT = 'urgent'


class NotificationStatus(enum.Enum):
    """Notification delivery status"""
    PENDING = 'pending'
    SENT = 'sent'
    DELIVERED = 'delivered'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


class AnnouncementType(enum.Enum):
    """Announcement types"""
    SYSTEM_MAINTENANCE = 'system_maintenance'
    FEATURE_UPDATE = 'feature_update'
    SECURITY_ALERT = 'security_alert'
    GENERAL = 'general'
    PROMOTIONAL = 'promotional'


class MessageType(enum.Enum):
    """Message types for internal messaging"""
    SUPPORT = 'support'
    ADMIN = 'admin'
    SYSTEM = 'system'
    NOTIFICATION = 'notification'


class Notification(db.Model):
    """User notifications for various communication channels"""
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Notification Details
    type = Column(Enum(NotificationType), nullable=False, index=True)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    template_id = Column(String(100), nullable=True, index=True)  # For templated notifications
    
    # Delivery Information
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING, index=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    sent_at = Column(DateTime, nullable=True, index=True)
    delivered_at = Column(DateTime, nullable=True, index=True)
    failed_at = Column(DateTime, nullable=True, index=True)
    
    # Delivery Attempts
    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    last_attempt_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    notification_metadata = Column(JSON, nullable=True)  # Additional data for the notification
    recipient_data = Column(JSON, nullable=True)  # Recipient-specific data (email, phone, etc.)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='notifications')
    admin_user = relationship('AdminUser', back_populates='sent_notifications')

    def __repr__(self):
        return f'<Notification {self.id}:{self.type.value}:{self.status.value}>'

    def to_dict(self):
        """Convert notification to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'admin_user_id': self.admin_user_id,
            'type': self.type.value,
            'priority': self.priority.value,
            'title': self.title,
            'message': self.message,
            'template_id': self.template_id,
            'status': self.status.value,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'failed_at': self.failed_at.isoformat() if self.failed_at else None,
            'attempt_count': self.attempt_count,
            'max_attempts': self.max_attempts,
            'last_attempt_at': self.last_attempt_at.isoformat() if self.last_attempt_at else None,
            'error_message': self.error_message,
            'metadata': self.notification_metadata,
            'recipient_data': self.recipient_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @hybrid_property
    def is_pending(self):
        """Check if notification is pending delivery"""
        return self.status == NotificationStatus.PENDING

    @hybrid_property
    def is_sent(self):
        """Check if notification has been sent"""
        return self.status in [NotificationStatus.SENT, NotificationStatus.DELIVERED]

    @hybrid_property
    def is_failed(self):
        """Check if notification delivery failed"""
        return self.status == NotificationStatus.FAILED

    @hybrid_property
    def can_retry(self):
        """Check if notification can be retried"""
        return (self.status == NotificationStatus.FAILED and 
                self.attempt_count < self.max_attempts)


class NotificationTemplate(db.Model):
    """Templates for reusable notifications"""
    __tablename__ = 'notification_templates'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    type = Column(Enum(NotificationType), nullable=False, index=True)
    
    # Template Content
    title_template = Column(String(255), nullable=False)
    message_template = Column(Text, nullable=False)
    subject_template = Column(String(255), nullable=True)  # For email notifications
    
    # Template Configuration
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL)
    max_attempts = Column(Integer, default=3)
    is_active = Column(Boolean, default=True, index=True)
    
    # Variables and Placeholders
    template_variables = Column(JSON, nullable=True)  # Available variables for the template
    default_metadata = Column(JSON, nullable=True)  # Default metadata for notifications
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('admin_users.id', ondelete='SET NULL'), nullable=True)

    def __repr__(self):
        return f'<NotificationTemplate {self.name}:{self.type.value}>'

    def to_dict(self):
        """Convert template to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type.value,
            'title_template': self.title_template,
            'message_template': self.message_template,
            'subject_template': self.subject_template,
            'priority': self.priority.value,
            'max_attempts': self.max_attempts,
            'is_active': self.is_active,
            'variables': self.template_variables,
            'default_metadata': self.default_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }


class Announcement(db.Model):
    """System announcements and broadcasts"""
    __tablename__ = 'announcements'

    id = Column(Integer, primary_key=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Announcement Details
    type = Column(Enum(AnnouncementType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(String(500), nullable=True)
    
    # Visibility and Targeting
    is_global = Column(Boolean, default=True, index=True)  # Show to all users
    target_user_ids = Column(JSON, nullable=True)  # Specific user IDs to target
    target_user_groups = Column(JSON, nullable=True)  # User groups to target (premium, free, etc.)
    
    # Scheduling
    is_scheduled = Column(Boolean, default=False, index=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_published = Column(Boolean, default=False, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    
    # Engagement Tracking
    view_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    
    # Metadata
    announcement_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    admin_user = relationship('AdminUser', back_populates='created_announcements')
    user_views = relationship('AnnouncementView', back_populates='announcement', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Announcement {self.id}:{self.type.value}:{self.title}>'

    def to_dict(self):
        """Convert announcement to dictionary"""
        return {
            'id': self.id,
            'admin_user_id': self.admin_user_id,
            'type': self.type.value,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'is_global': self.is_global,
            'target_user_ids': self.target_user_ids,
            'target_user_groups': self.target_user_groups,
            'is_scheduled': self.is_scheduled,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'view_count': self.view_count,
            'click_count': self.click_count,
            'metadata': self.announcement_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @hybrid_property
    def is_visible(self):
        """Check if announcement is currently visible"""
        now = datetime.utcnow()
        if not self.is_active or not self.is_published:
            return False
        if self.scheduled_at and self.scheduled_at > now:
            return False
        if self.expires_at and self.expires_at < now:
            return False
        return True


class AnnouncementView(db.Model):
    """Track user views of announcements"""
    __tablename__ = 'announcement_views'

    id = Column(Integer, primary_key=True)
    announcement_id = Column(Integer, ForeignKey('announcements.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # View Information
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Engagement
    time_spent_seconds = Column(Integer, nullable=True)
    clicked = Column(Boolean, default=False)
    clicked_at = Column(DateTime, nullable=True)
    
    # Relationships
    announcement = relationship('Announcement', back_populates='user_views')
    user = relationship('User', back_populates='announcement_views')

    def __repr__(self):
        return f'<AnnouncementView {self.announcement_id}:{self.user_id}:{self.viewed_at}>'

    def to_dict(self):
        """Convert view to dictionary"""
        return {
            'id': self.id,
            'announcement_id': self.announcement_id,
            'user_id': self.user_id,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'time_spent_seconds': self.time_spent_seconds,
            'clicked': self.clicked,
            'clicked_at': self.clicked_at.isoformat() if self.clicked_at else None
        }


class Message(db.Model):
    """Internal messaging system"""
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    admin_sender_id = Column(Integer, ForeignKey('admin_users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Message Details
    type = Column(Enum(MessageType), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime, nullable=True, index=True)
    is_archived = Column(Boolean, default=False, index=True)
    archived_at = Column(DateTime, nullable=True, index=True)
    
    # Priority and Flags
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL, index=True)
    is_urgent = Column(Boolean, default=False, index=True)
    
    # Metadata
    message_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = relationship('User', foreign_keys=[sender_id], back_populates='sent_messages')
    recipient = relationship('User', foreign_keys=[recipient_id], back_populates='received_messages')
    admin_sender = relationship('AdminUser', back_populates='sent_messages')

    def __repr__(self):
        return f'<Message {self.id}:{self.sender_id}->{self.recipient_id}:{self.type.value}>'

    def to_dict(self):
        """Convert message to dictionary"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'admin_sender_id': self.admin_sender_id,
            'type': self.type.value,
            'subject': self.subject,
            'content': self.content,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_archived': self.is_archived,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None,
            'priority': self.priority.value,
            'is_urgent': self.is_urgent,
            'metadata': self.message_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @hybrid_property
    def is_from_admin(self):
        """Check if message is from an admin"""
        return self.admin_sender_id is not None


class CommunicationPreference(db.Model):
    """User communication preferences and settings"""
    __tablename__ = 'communication_preferences'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Email Preferences
    email_enabled = Column(Boolean, default=True, index=True)
    email_frequency = Column(String(20), default='immediate', index=True)  # immediate, daily, weekly
    email_categories = Column(JSON, nullable=True)  # Which categories to receive emails for
    
    # SMS Preferences
    sms_enabled = Column(Boolean, default=False, index=True)
    sms_frequency = Column(String(20), default='urgent_only', index=True)  # urgent_only, daily, weekly
    sms_categories = Column(JSON, nullable=True)
    
    # Push Notification Preferences
    push_enabled = Column(Boolean, default=True, index=True)
    push_categories = Column(JSON, nullable=True)
    
    # In-App Notification Preferences
    in_app_enabled = Column(Boolean, default=True, index=True)
    in_app_categories = Column(JSON, nullable=True)
    
    # Marketing Preferences
    marketing_emails = Column(Boolean, default=False, index=True)
    marketing_sms = Column(Boolean, default=False, index=True)
    marketing_push = Column(Boolean, default=False, index=True)
    
    # Quiet Hours
    quiet_hours_enabled = Column(Boolean, default=False, index=True)
    quiet_hours_start = Column(String(5), nullable=True)  # HH:MM format
    quiet_hours_end = Column(String(5), nullable=True)  # HH:MM format
    quiet_hours_timezone = Column(String(50), nullable=True)
    
    # Language and Format
    preferred_language = Column(String(10), default='en', index=True)
    date_format = Column(String(20), default='MM/DD/YYYY')
    time_format = Column(String(10), default='12h')  # 12h, 24h
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='communication_preferences')

    def __repr__(self):
        return f'<CommunicationPreference {self.user_id}>'

    def to_dict(self):
        """Convert preferences to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email_enabled': self.email_enabled,
            'email_frequency': self.email_frequency,
            'email_categories': self.email_categories,
            'sms_enabled': self.sms_enabled,
            'sms_frequency': self.sms_frequency,
            'sms_categories': self.sms_categories,
            'push_enabled': self.push_enabled,
            'push_categories': self.push_categories,
            'in_app_enabled': self.in_app_enabled,
            'in_app_categories': self.in_app_categories,
            'marketing_emails': self.marketing_emails,
            'marketing_sms': self.marketing_sms,
            'marketing_push': self.marketing_push,
            'quiet_hours_enabled': self.quiet_hours_enabled,
            'quiet_hours_start': self.quiet_hours_start,
            'quiet_hours_end': self.quiet_hours_end,
            'quiet_hours_timezone': self.quiet_hours_timezone,
            'preferred_language': self.preferred_language,
            'date_format': self.date_format,
            'time_format': self.time_format,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @hybrid_property
    def is_in_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled:
            return False
        # This would need to be implemented with timezone handling
        return False


# Create indexes for better query performance
Index('idx_notifications_user_status', Notification.user_id, Notification.status)
Index('idx_notifications_type_status', Notification.type, Notification.status)
Index('idx_notifications_scheduled', Notification.scheduled_at, Notification.status)
Index('idx_announcements_visible', Announcement.is_active, Announcement.is_published, Announcement.scheduled_at, Announcement.expires_at)
Index('idx_messages_recipient_unread', Message.recipient_id, Message.is_read)
Index('idx_messages_sender_created', Message.sender_id, Message.created_at)
Index('idx_announcement_views_user_announcement', AnnouncementView.user_id, AnnouncementView.announcement_id)
