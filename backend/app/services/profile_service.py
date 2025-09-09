import logging
import os
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import current_app, request
from .. import db
from ..models import User, UserProfile, ProfileChangeHistory, UserLoginHistory, PasswordResetToken
from .security_service import security_service
from .audit_service import audit_service

logger = logging.getLogger(__name__)


class ProfileService:
    """Comprehensive profile management service with CRUD operations and security"""
    
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        self.upload_folder = 'uploads/avatars'
        
        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def get_user_profile(self, user_id: int, include_changes: bool = False) -> Optional[Dict]:
        """
        Get user profile with optional change history
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return None
            
            profile = user.profile
            if not profile:
                # Create default profile if it doesn't exist
                profile = self.create_default_profile(user_id)
            
            profile_data = profile.to_dict()
            
            if include_changes:
                # Get recent profile changes
                changes = ProfileChangeHistory.query.filter_by(
                    profile_id=profile.id
                ).order_by(ProfileChangeHistory.created_at.desc()).limit(10).all()
                
                profile_data['recent_changes'] = [change.to_dict() for change in changes]
            
            return profile_data
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    def create_default_profile(self, user_id: int) -> UserProfile:
        """
        Create a default profile for a user
        """
        try:
            profile = UserProfile(
                user_id=user_id,
                profile_visibility='public',
                email_notifications=True,
                sms_notifications=False,
                marketing_emails=False,
                two_factor_enabled=False,
                preferences={}
            )
            
            db.session.add(profile)
            db.session.commit()
            
            logger.info(f"Created default profile for user {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating default profile: {e}")
            db.session.rollback()
            raise
    
    def update_user_profile(
        self,
        user_id: int,
        profile_data: Dict,
        admin_user_id: int = None,
        validate_only: bool = False
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Update user profile with validation and audit logging
        Returns (success, updated_profile, errors)
        """
        try:
            # Get user and profile
            user = User.query.get(user_id)
            if not user:
                return False, {}, ['User not found']
            
            profile = user.profile
            if not profile:
                profile = self.create_default_profile(user_id)
            
            # Validate input data
            validation_errors = self._validate_profile_data(profile_data)
            if validation_errors:
                return False, {}, validation_errors
            
            # Sanitize input data
            sanitized_data = security_service.sanitize_input(profile_data)
            
            if validate_only:
                return True, sanitized_data, []
            
            # Store old values for audit
            old_values = {}
            for key in sanitized_data.keys():
                if hasattr(profile, key):
                    old_values[key] = getattr(profile, key)
            
            # Update profile fields
            for key, value in sanitized_data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            
            # Update timestamps
            profile.updated_at = datetime.utcnow()
            profile.last_profile_update = datetime.utcnow()
            
            # Log changes
            if old_values:
                change_log = ProfileChangeHistory(
                    profile_id=profile.id,
                    admin_user_id=admin_user_id,
                    changed_fields=list(sanitized_data.keys()),
                    old_values=old_values,
                    new_values=sanitized_data,
                    change_type='profile_update',
                    ip_address=security_service.get_client_ip(),
                    user_agent=request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
                )
                db.session.add(change_log)
            
            # Audit log the action
            audit_service.log_admin_action(
                admin_user_id=admin_user_id or user_id,
                action='profile_updated',
                target_type='user_profile',
                target_id=str(user_id),
                details={
                    'changed_fields': list(sanitized_data.keys()),
                    'user_id': user_id
                }
            )
            
            db.session.commit()
            
            logger.info(f"Profile updated for user {user_id}")
            return True, profile.to_dict(), []
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def upload_avatar(
        self,
        user_id: int,
        file,
        admin_user_id: int = None
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Upload and process user avatar
        Returns (success, avatar_data, errors)
        """
        try:
            # Validate file
            if not file:
                return False, {}, ['No file provided']
            
            # Check file extension
            filename = secure_filename(file.filename)
            if not filename or '.' not in filename:
                return False, {}, ['Invalid filename']
            
            extension = filename.rsplit('.', 1)[1].lower()
            if extension not in self.allowed_extensions:
                return False, {}, [f'File type not allowed. Allowed types: {", ".join(self.allowed_extensions)}']
            
            # Check file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size > self.max_file_size:
                return False, {}, [f'File too large. Maximum size: {self.max_file_size // (1024*1024)}MB']
            
            # Get user profile
            user = User.query.get(user_id)
            if not user:
                return False, {}, ['User not found']
            
            profile = user.profile
            if not profile:
                profile = self.create_default_profile(user_id)
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_hash = hashlib.md5(f"{user_id}_{timestamp}".encode()).hexdigest()[:8]
            new_filename = f"avatar_{user_id}_{file_hash}_{timestamp}.{extension}"
            
            # Save file
            file_path = os.path.join(self.upload_folder, new_filename)
            file.save(file_path)
            
            # Update profile
            old_avatar = profile.avatar_filename
            profile.avatar_url = f"/uploads/avatars/{new_filename}"
            profile.avatar_filename = new_filename
            profile.avatar_upload_date = datetime.utcnow()
            profile.updated_at = datetime.utcnow()
            
            # Log the change
            change_log = ProfileChangeHistory(
                profile_id=profile.id,
                admin_user_id=admin_user_id,
                changed_fields=['avatar_url', 'avatar_filename', 'avatar_upload_date'],
                old_values={'avatar_filename': old_avatar},
                new_values={'avatar_filename': new_filename},
                change_type='avatar_upload',
                ip_address=security_service.get_client_ip(),
                user_agent=request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            )
            db.session.add(change_log)
            
            # Audit log
            audit_service.log_admin_action(
                admin_user_id=admin_user_id or user_id,
                action='avatar_uploaded',
                target_type='user_profile',
                target_id=str(user_id),
                details={'filename': new_filename, 'file_size': file_size}
            )
            
            db.session.commit()
            
            avatar_data = {
                'avatar_url': profile.avatar_url,
                'avatar_filename': profile.avatar_filename,
                'avatar_upload_date': profile.avatar_upload_date.isoformat()
            }
            
            logger.info(f"Avatar uploaded for user {user_id}: {new_filename}")
            return True, avatar_data, []
            
        except Exception as e:
            logger.error(f"Error uploading avatar: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def delete_avatar(self, user_id: int, admin_user_id: int = None) -> Tuple[bool, List[str]]:
        """
        Delete user avatar
        Returns (success, errors)
        """
        try:
            user = User.query.get(user_id)
            if not user or not user.profile:
                return False, ['User or profile not found']
            
            profile = user.profile
            old_avatar = profile.avatar_filename
            
            if not old_avatar:
                return False, ['No avatar to delete']
            
            # Delete file from filesystem
            file_path = os.path.join(self.upload_folder, old_avatar)
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Update profile
            profile.avatar_url = None
            profile.avatar_filename = None
            profile.avatar_upload_date = None
            profile.updated_at = datetime.utcnow()
            
            # Log the change
            change_log = ProfileChangeHistory(
                profile_id=profile.id,
                admin_user_id=admin_user_id,
                changed_fields=['avatar_url', 'avatar_filename', 'avatar_upload_date'],
                old_values={'avatar_filename': old_avatar},
                new_values={'avatar_filename': None},
                change_type='avatar_deleted',
                ip_address=security_service.get_client_ip(),
                user_agent=request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            )
            db.session.add(change_log)
            
            # Audit log
            audit_service.log_admin_action(
                admin_user_id=admin_user_id or user_id,
                action='avatar_deleted',
                target_type='user_profile',
                target_id=str(user_id),
                details={'deleted_filename': old_avatar}
            )
            
            db.session.commit()
            
            logger.info(f"Avatar deleted for user {user_id}: {old_avatar}")
            return True, []
            
        except Exception as e:
            logger.error(f"Error deleting avatar: {e}")
            db.session.rollback()
            return False, [str(e)]
    
    def get_profile_changes(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get profile change history
        """
        try:
            user = User.query.get(user_id)
            if not user or not user.profile:
                return []
            
            changes = ProfileChangeHistory.query.filter_by(
                profile_id=user.profile.id
            ).order_by(ProfileChangeHistory.created_at.desc()).offset(offset).limit(limit).all()
            
            return [change.to_dict() for change in changes]
            
        except Exception as e:
            logger.error(f"Error getting profile changes: {e}")
            return []
    
    def get_login_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        include_suspicious: bool = True
    ) -> List[Dict]:
        """
        Get user login history
        """
        try:
            query = UserLoginHistory.query.filter_by(user_id=user_id)
            
            if not include_suspicious:
                query = query.filter_by(is_suspicious=False)
            
            history = query.order_by(UserLoginHistory.login_timestamp.desc()).offset(offset).limit(limit).all()
            
            return [entry.to_dict() for entry in history]
            
        except Exception as e:
            logger.error(f"Error getting login history: {e}")
            return []
    
    def _validate_profile_data(self, data: Dict) -> List[str]:
        """
        Validate profile data
        """
        errors = []
        
        # Define validation rules
        validation_rules = {
            'first_name': {
                'max_length': 50,
                'pattern': r'^[a-zA-Z\s]+$'
            },
            'last_name': {
                'max_length': 50,
                'pattern': r'^[a-zA-Z\s]+$'
            },
            'display_name': {
                'max_length': 100,
                'pattern': r'^[a-zA-Z0-9\s_-]+$'
            },
            'bio': {
                'max_length': 1000
            },
            'phone_number': {
                'pattern': r'^\+?[\d\s\-\(\)]+$'
            },
            'linkedin_url': {
                'type': 'url'
            },
            'twitter_url': {
                'type': 'url'
            },
            'website_url': {
                'type': 'url'
            },
            'trading_experience': {
                'enum': ['beginner', 'intermediate', 'advanced', 'expert']
            },
            'risk_tolerance': {
                'enum': ['low', 'medium', 'high']
            },
            'profile_visibility': {
                'enum': ['public', 'private', 'friends_only']
            }
        }
        
        # Validate each field
        for field, value in data.items():
            if field in validation_rules:
                rules = validation_rules[field]
                
                # Length validation
                if 'max_length' in rules and len(str(value)) > rules['max_length']:
                    errors.append(f"{field} must be at most {rules['max_length']} characters")
                
                # Pattern validation
                if 'pattern' in rules and not security_service._validate_pattern(str(value), rules['pattern']):
                    errors.append(f"{field} format is invalid")
                
                # Type validation
                if 'type' in rules:
                    if rules['type'] == 'url' and not security_service.is_valid_url(value):
                        errors.append(f"{field} must be a valid URL")
                
                # Enum validation
                if 'enum' in rules and value not in rules['enum']:
                    errors.append(f"{field} must be one of: {', '.join(rules['enum'])}")
        
        return errors


# Global profile service instance
profile_service = ProfileService()

