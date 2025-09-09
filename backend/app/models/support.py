"""
Support System Models
Defines models for support tickets, categories, and related functionality
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
import enum
from .. import db


class TicketStatus(enum.Enum):
    """Ticket status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(enum.Enum):
    """Ticket priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SupportCategory(db.Model):
    """Support ticket categories"""
    __tablename__ = 'support_categories'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    color = Column(String(7), default='#3b82f6')  # Hex color code
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tickets = relationship('SupportTicket', back_populates='category', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<SupportCategory {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'ticket_count': len(self.tickets) if self.tickets else 0
        }


class SupportTicket(db.Model):
    """Support tickets"""
    __tablename__ = 'support_tickets'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    
    # User information
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user_email = Column(String(120), nullable=False)  # Store email even if user is deleted
    user_name = Column(String(100), nullable=False)
    
    # Assignment
    assigned_to = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    category_id = Column(Integer, ForeignKey('support_categories.id'), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    hidden_from_user_at = Column(DateTime, nullable=True)  # When ticket should be hidden from users (24h after closing)
    
    # Rating system
    user_rating = Column(Integer, nullable=True)  # 1-5 stars from user
    user_feedback = Column(Text, nullable=True)  # User's feedback text
    rated_at = Column(DateTime, nullable=True)  # When the rating was given
    
    # Relationships
    user = relationship('User', backref='support_tickets')
    assigned_admin = relationship('AdminUser', backref='assigned_tickets')
    category = relationship('SupportCategory', back_populates='tickets')
    messages = relationship('SupportMessage', back_populates='ticket', cascade='all, delete-orphan')
    attachments = relationship('SupportAttachment', back_populates='ticket', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<SupportTicket {self.ticket_number}>'
    
    @hybrid_property
    def is_overdue(self):
        """Check if ticket is overdue based on priority"""
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return False
        
        hours_since_created = (datetime.utcnow() - self.created_at).total_seconds() / 3600
        
        # Define SLA hours based on priority
        sla_hours = {
            TicketPriority.URGENT: 2,
            TicketPriority.HIGH: 8,
            TicketPriority.MEDIUM: 24,
            TicketPriority.LOW: 72
        }
        
        return hours_since_created > sla_hours.get(self.priority, 24)
    
    def generate_ticket_number(self):
        """Generate unique ticket number"""
        import random
        import string
        
        # Format: TKT-YYYYMMDD-XXXX
        date_str = datetime.utcnow().strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.digits, k=4))
        return f"TKT-{date_str}-{random_str}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'subject': self.subject,
            'description': self.description,
            'status': self.status.value if self.status else None,
            'priority': self.priority.value if self.priority else None,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_name': self.user_name,
            'assigned_to': self.assigned_to,
            'assigned_admin': {
                'id': self.assigned_admin.id,
                'username': self.assigned_admin.username,
                'full_name': self.assigned_admin.full_name
            } if self.assigned_admin else None,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'hidden_from_user_at': self.hidden_from_user_at.isoformat() if self.hidden_from_user_at else None,
            'user_rating': self.user_rating,
            'user_feedback': self.user_feedback,
            'rated_at': self.rated_at.isoformat() if self.rated_at else None,
            'is_overdue': self.is_overdue,
            'message_count': len(self.messages) if self.messages else 0,
            'attachment_count': len(self.attachments) if self.attachments else 0
        }


class SupportMessage(db.Model):
    """Messages/replies in support tickets"""
    __tablename__ = 'support_messages'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id'), nullable=False)
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal notes vs customer-visible
    
    # Author information
    admin_user_id = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    author_name = Column(String(100), nullable=False)
    author_email = Column(String(120), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)  # When the message was read by admin
    
    # Relationships
    ticket = relationship('SupportTicket', back_populates='messages')
    admin_user = relationship('AdminUser', backref='support_messages')
    user = relationship('User', backref='support_messages')
    attachments = relationship('SupportAttachment', back_populates='message')
    
    def __repr__(self):
        return f'<SupportMessage {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'message': self.message,
            'is_internal': self.is_internal,
            'admin_user_id': self.admin_user_id,
            'user_id': self.user_id,
            'author_name': self.author_name,
            'author_email': self.author_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_admin_reply': self.admin_user_id is not None
        }


class SupportAttachment(db.Model):
    """File attachments for support tickets"""
    __tablename__ = 'support_attachments'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id'), nullable=False)
    message_id = Column(Integer, ForeignKey('support_messages.id'), nullable=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    uploaded_by_admin = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ticket = relationship('SupportTicket', back_populates='attachments')
    message = relationship('SupportMessage', back_populates='attachments')
    
    def __repr__(self):
        return f'<SupportAttachment {self.original_filename}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'uploaded_by': self.uploaded_by,
            'uploaded_by_admin': self.uploaded_by_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TicketAssignmentHistory(db.Model):
    """Track assignment history for support tickets"""
    __tablename__ = 'ticket_assignment_history'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id'), nullable=False)
    assigned_to = Column(Integer, ForeignKey('admin_users.id'), nullable=True)  # None means unassigned
    assigned_by = Column(Integer, ForeignKey('admin_users.id'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    previous_assignment = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    reason = Column(String(500), nullable=True)  # Reason for assignment change
    
    # Relationships
    ticket = relationship('SupportTicket')
    assigned_to_admin = relationship('AdminUser', foreign_keys=[assigned_to])
    assigned_by_admin = relationship('AdminUser', foreign_keys=[assigned_by])
    previous_admin = relationship('AdminUser', foreign_keys=[previous_assignment])
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'assigned_to': self.assigned_to,
            'assigned_by': self.assigned_by,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'previous_assignment': self.previous_assignment,
            'reason': self.reason
        }
