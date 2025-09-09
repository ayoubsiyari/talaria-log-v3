from .. import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    """User model for authentication and basic user information"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Basic user information
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    country = db.Column(db.String(100))
    
    # Account status
    is_active = db.Column(db.Boolean, default=True, index=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # New fields for enhanced functionality
    last_login = db.Column(db.DateTime, nullable=True, index=True)
    subscription_status = db.Column(db.String(50), default='free', index=True)
    subscription_plan = db.Column(db.String(50), nullable=True)
    last_message_read_at = db.Column(db.DateTime, nullable=True, index=True)
    
    # Relationships
    profile = db.relationship('UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    subscriptions = db.relationship('UserSubscription', back_populates='user', cascade='all, delete-orphan')
    rbac_role_assignments = db.relationship('UserRoleAssignment', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'country': self.country,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'subscription_status': self.subscription_status,
            'subscription_plan': self.subscription_plan
        }
    
    @property
    def full_name(self):
        """Get full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username
    
    @property
    def display_name(self):
        """Get display name (profile display name or fallback to full name)"""
        if self.profile and self.profile.display_name:
            return self.profile.display_name
        return self.full_name
    
    @property
    def profile_completion_percentage(self):
        """Get profile completion percentage"""
        if self.profile:
            return self.profile.profile_completion_percentage
        return 0
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def get_active_subscription(self):
        """Get active subscription if any"""
        if self.subscriptions:
            for subscription in self.subscriptions:
                if subscription.is_active:
                    return subscription
        return None
    
    def has_subscription(self, plan_name=None):
        """Check if user has active subscription"""
        active_sub = self.get_active_subscription()
        if not active_sub:
            return False
        if plan_name:
            return active_sub.plan_name == plan_name
        return True 