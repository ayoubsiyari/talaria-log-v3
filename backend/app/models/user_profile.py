from .. import db
from datetime import datetime
import json
from sqlalchemy.ext.hybrid import hybrid_property


class UserProfile(db.Model):
    """Enhanced user profile model with comprehensive profile management"""
    
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    
    # Basic Profile Information
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    avatar_filename = db.Column(db.String(255))
    avatar_upload_date = db.Column(db.DateTime)
    
    # Personal Information
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    display_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    phone_number = db.Column(db.String(20))
    
    # Location Information
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    timezone = db.Column(db.String(50))
    
    # Trading Information
    trading_experience = db.Column(db.String(50))  # beginner, intermediate, advanced, expert
    preferred_markets = db.Column(db.Text)  # JSON array of market preferences
    risk_tolerance = db.Column(db.String(20))  # low, medium, high
    investment_goals = db.Column(db.Text)  # JSON array of goals
    annual_income_range = db.Column(db.String(50))
    net_worth_range = db.Column(db.String(50))
    
    # Professional Information
    occupation = db.Column(db.String(100))
    company = db.Column(db.String(100))
    job_title = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    years_experience = db.Column(db.Integer)
    
    # Social Media Links
    linkedin_url = db.Column(db.String(255))
    twitter_url = db.Column(db.String(255))
    website_url = db.Column(db.String(255))
    
    # Preferences (stored as JSON for flexibility)
    preferences = db.Column(db.JSON, default={})
    
    # Security and Privacy Settings
    profile_visibility = db.Column(db.String(20), default='public')  # public, private, friends_only
    email_notifications = db.Column(db.Boolean, default=True)
    sms_notifications = db.Column(db.Boolean, default=False)
    marketing_emails = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    
    # Profile Status
    is_verified = db.Column(db.Boolean, default=False)
    verification_date = db.Column(db.DateTime)
    verification_method = db.Column(db.String(50))  # email, phone, id_document
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_profile_update = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='profile', uselist=False)
    profile_changes = db.relationship('ProfileChangeHistory', back_populates='profile', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(UserProfile, self).__init__(**kwargs)
        if not self.preferences:
            self.preferences = {}
    
    def to_dict(self):
        """Convert profile to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'display_name': self.display_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'phone_number': self.phone_number,
            'country': self.country,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'timezone': self.timezone,
            'trading_experience': self.trading_experience,
            'preferred_markets': json.loads(self.preferred_markets) if self.preferred_markets else [],
            'risk_tolerance': self.risk_tolerance,
            'investment_goals': json.loads(self.investment_goals) if self.investment_goals else [],
            'annual_income_range': self.annual_income_range,
            'net_worth_range': self.net_worth_range,
            'occupation': self.occupation,
            'company': self.company,
            'job_title': self.job_title,
            'industry': self.industry,
            'years_experience': self.years_experience,
            'linkedin_url': self.linkedin_url,
            'twitter_url': self.twitter_url,
            'website_url': self.website_url,
            'preferences': self.preferences,
            'profile_visibility': self.profile_visibility,
            'email_notifications': self.email_notifications,
            'sms_notifications': self.sms_notifications,
            'marketing_emails': self.marketing_emails,
            'two_factor_enabled': self.two_factor_enabled,
            'is_verified': self.is_verified,
            'verification_date': self.verification_date.isoformat() if self.verification_date else None,
            'verification_method': self.verification_method,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_profile_update': self.last_profile_update.isoformat() if self.last_profile_update else None
        }
    
    def update_preference(self, key: str, value):
        """Update a specific preference"""
        if not self.preferences:
            self.preferences = {}
        self.preferences[key] = value
        self.updated_at = datetime.utcnow()
    
    def get_preference(self, key: str, default=None):
        """Get a specific preference"""
        return self.preferences.get(key, default) if self.preferences else default
    
    def remove_preference(self, key: str):
        """Remove a specific preference"""
        if self.preferences and key in self.preferences:
            del self.preferences[key]
            self.updated_at = datetime.utcnow()
    
    @hybrid_property
    def full_name(self):
        """Get full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return None
    
    @hybrid_property
    def display_name_or_full_name(self):
        """Get display name or fallback to full name"""
        return self.display_name or self.full_name
    
    @hybrid_property
    def profile_completion_percentage(self):
        """Calculate profile completion percentage"""
        required_fields = [
            'first_name', 'last_name', 'bio', 'country', 'city',
            'trading_experience', 'risk_tolerance', 'occupation'
        ]
        
        optional_fields = [
            'date_of_birth', 'phone_number', 'preferred_markets',
            'investment_goals', 'company', 'job_title', 'linkedin_url'
        ]
        
        total_fields = len(required_fields) + len(optional_fields)
        completed_fields = 0
        
        # Check required fields (weighted more heavily)
        for field in required_fields:
            if getattr(self, field):
                completed_fields += 2  # Required fields count double
        
        # Check optional fields
        for field in optional_fields:
            if getattr(self, field):
                completed_fields += 1
        
        return min(100, int((completed_fields / (len(required_fields) * 2 + len(optional_fields))) * 100))
    
    def update_profile(self, data: dict, admin_user_id: int = None):
        """Update profile with change tracking"""
        
        # Store old values for change tracking
        old_values = {}
        for key, value in data.items():
            if hasattr(self, key):
                old_values[key] = getattr(self, key)
        
        # Update fields
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        # Update timestamps
        self.updated_at = datetime.utcnow()
        self.last_profile_update = datetime.utcnow()
        
        # Log changes
        if old_values:
            change_log = ProfileChangeHistory(
                profile_id=self.id,
                admin_user_id=admin_user_id,
                changed_fields=list(data.keys()),
                old_values=old_values,
                new_values=data,
                change_type='profile_update'
            )
            db.session.add(change_log)
    
    def __repr__(self):
        return f'<UserProfile {self.user_id}>'


class ProfileChangeHistory(db.Model):
    """Track profile changes for audit purposes"""
    
    __tablename__ = 'profile_change_history'
    
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    # Change details
    changed_fields = db.Column(db.JSON)  # List of field names that changed
    old_values = db.Column(db.JSON)  # Previous values
    new_values = db.Column(db.JSON)  # New values
    change_type = db.Column(db.String(50))  # profile_update, admin_edit, bulk_update, etc.
    
    # Metadata
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    profile = db.relationship('UserProfile', back_populates='profile_changes')
    admin_user = db.relationship('User', foreign_keys=[admin_user_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'admin_user_id': self.admin_user_id,
            'changed_fields': self.changed_fields,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'change_type': self.change_type,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ProfileChangeHistory {self.profile_id} - {self.change_type}>'


class UserLoginHistory(db.Model):
    """Track user login history with security information"""
    
    __tablename__ = 'user_login_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Login details
    login_timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    logout_timestamp = db.Column(db.DateTime)
    session_duration = db.Column(db.Integer)  # Duration in seconds
    
    # Security information
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.Text)
    device_fingerprint = db.Column(db.String(255))
    device_type = db.Column(db.String(50))  # desktop, mobile, tablet
    browser = db.Column(db.String(100))
    os = db.Column(db.String(100))
    
    # Geolocation
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    region = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Security flags
    is_successful = db.Column(db.Boolean, default=True)
    is_suspicious = db.Column(db.Boolean, default=False)
    failure_reason = db.Column(db.String(255))
    two_factor_used = db.Column(db.Boolean, default=False)
    
    # Session information
    session_id = db.Column(db.String(255))
    token_id = db.Column(db.String(255))
    
    # Relationships
    user = db.relationship('User', backref='login_history')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'login_timestamp': self.login_timestamp.isoformat(),
            'logout_timestamp': self.logout_timestamp.isoformat() if self.logout_timestamp else None,
            'session_duration': self.session_duration,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'device_fingerprint': self.device_fingerprint,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'country': self.country,
            'city': self.city,
            'region': self.region,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_successful': self.is_successful,
            'is_suspicious': self.is_suspicious,
            'failure_reason': self.failure_reason,
            'two_factor_used': self.two_factor_used,
            'session_id': self.session_id,
            'token_id': self.token_id
        }
    
    def __repr__(self):
        return f'<UserLoginHistory {self.user_id} - {self.login_timestamp}>'


class PasswordResetToken(db.Model):
    """Secure password reset tokens with expiration"""
    
    __tablename__ = 'password_reset_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Token details
    token_hash = db.Column(db.String(255), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(20), default='reset')  # reset, change, admin_reset
    
    # Security
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    used_at = db.Column(db.DateTime)
    is_used = db.Column(db.Boolean, default=False)
    is_revoked = db.Column(db.Boolean, default=False)
    
    # Metadata
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='password_reset_tokens')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'token_type': self.token_type,
            'expires_at': self.expires_at.isoformat(),
            'used_at': self.used_at.isoformat() if self.used_at else None,
            'is_used': self.is_used,
            'is_revoked': self.is_revoked,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat()
        }
    
    @property
    def is_expired(self):
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if token is valid and not used"""
        return not self.is_expired and not self.is_used and not self.is_revoked
    
    def mark_as_used(self):
        """Mark token as used"""
        self.is_used = True
        self.used_at = datetime.utcnow()
    
    def revoke(self):
        """Revoke token"""
        self.is_revoked = True
    
    def __repr__(self):
        return f'<PasswordResetToken {self.user_id} - {self.token_type}>'
