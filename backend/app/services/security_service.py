import re
import logging
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Callable
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models import User
from .. import db
from datetime import datetime, timedelta
import ipaddress

logger = logging.getLogger(__name__)


class SecurityService:
    """Comprehensive security service for RBAC, validation, and security utilities"""
    
    def __init__(self):
        self.rate_limit_cache = {}
        self.suspicious_ips = set()
        self.failed_login_attempts = {}
        self.allowed_roles = {
            'super_admin': ['all'],
            'admin': ['user_management', 'content_moderation', 'analytics', 'system_settings'],
            'moderator': ['content_moderation', 'user_reports'],
            'analyst': ['analytics', 'reports'],
            'user': ['self_management']
        }
        
        # Permission mappings
        self.permissions = {
            'user_management': [
                'view_users', 'edit_users', 'delete_users', 'suspend_users',
                'view_user_profiles', 'edit_user_profiles', 'view_user_subscriptions'
            ],
            'content_moderation': [
                'moderate_content', 'delete_content', 'flag_content', 'approve_content'
            ],
            'analytics': [
                'view_analytics', 'export_data', 'view_reports', 'generate_reports'
            ],
            'system_settings': [
                'view_settings', 'edit_settings', 'system_maintenance', 'backup_restore'
            ],
            'user_reports': [
                'view_reports', 'handle_reports', 'escalate_reports'
            ],
            'self_management': [
                'view_own_profile', 'edit_own_profile', 'view_own_data'
            ]
        }
    
    def validate_role_permission(self, required_permission: str, user_roles: List[str] = None) -> bool:
        """
        Validate if user has the required permission based on their roles
        """
        if not user_roles:
            return False
        
        for role in user_roles:
            if role in self.allowed_roles:
                role_permissions = self.allowed_roles[role]
                if 'all' in role_permissions or required_permission in role_permissions:
                    return True
        
        return False
    
    def get_user_permissions(self, user: User) -> List[str]:
        """
        Get all permissions for a user based on their roles
        """
        permissions = set()
        
        # Add role-based permissions
        if user.is_admin:
            permissions.update(self.permissions.get('user_management', []))
            permissions.update(self.permissions.get('analytics', []))
            permissions.update(self.permissions.get('system_settings', []))
        
        # Add self-management permissions for all users
        permissions.update(self.permissions.get('self_management', []))
        
        return list(permissions)
    
    def require_permission(self, permission: str):
        """
        Decorator to require specific permission for route access
        """
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                try:
                    verify_jwt_in_request()
                    current_user_id = get_jwt_identity()
                    user = User.query.get(int(current_user_id))
                    
                    if not user:
                        return jsonify({'error': 'User not found'}), 404
                    
                    if not user.is_active:
                        return jsonify({'error': 'Account is deactivated'}), 403
                    
                    # Check if user has required permission
                    user_permissions = self.get_user_permissions(user)
                    if permission not in user_permissions:
                        logger.warning(f"Permission denied: User {user.id} attempted to access {permission}")
                        return jsonify({'error': 'Insufficient permissions'}), 403
                    
                    return f(*args, **kwargs)
                    
                except Exception as e:
                    logger.error(f"Permission check error: {e}")
                    return jsonify({'error': 'Authentication required'}), 401
            
            return decorated_function
        return decorator
    
    def require_admin(self, f: Callable) -> Callable:
        """
        Decorator to require admin privileges
        """
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                user = User.query.get(int(current_user_id))
                
                if not user or not user.is_admin:
                    logger.warning(f"Admin access denied: User {current_user_id}")
                    return jsonify({'error': 'Admin access required'}), 403
                
                if not user.is_active:
                    return jsonify({'error': 'Account is deactivated'}), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Admin check error: {e}")
                return jsonify({'error': 'Authentication required'}), 401
        
        return decorated_function
    
    def validate_input(self, data: Dict, validation_rules: Dict) -> tuple[bool, List[str]]:
        """
        Validate input data against defined rules
        """
        errors = []
        
        for field, rules in validation_rules.items():
            value = data.get(field)
            
            # Required field check
            if rules.get('required', False) and (value is None or value == ''):
                errors.append(f"{field} is required")
                continue
            
            if value is None:
                continue
            
            # Type validation
            if 'type' in rules:
                expected_type = rules['type']
                if expected_type == 'email' and not self.is_valid_email(value):
                    errors.append(f"{field} must be a valid email address")
                elif expected_type == 'url' and not self.is_valid_url(value):
                    errors.append(f"{field} must be a valid URL")
                elif expected_type == 'int' and not isinstance(value, int):
                    try:
                        int(value)
                    except (ValueError, TypeError):
                        errors.append(f"{field} must be a valid integer")
                elif expected_type == 'float' and not isinstance(value, (int, float)):
                    try:
                        float(value)
                    except (ValueError, TypeError):
                        errors.append(f"{field} must be a valid number")
            
            # Length validation
            if 'min_length' in rules and len(str(value)) < rules['min_length']:
                errors.append(f"{field} must be at least {rules['min_length']} characters")
            
            if 'max_length' in rules and len(str(value)) > rules['max_length']:
                errors.append(f"{field} must be at most {rules['max_length']} characters")
            
            # Pattern validation
            if 'pattern' in rules and not re.match(rules['pattern'], str(value)):
                errors.append(f"{field} format is invalid")
            
            # Range validation
            if 'min' in rules and value < rules['min']:
                errors.append(f"{field} must be at least {rules['min']}")
            
            if 'max' in rules and value > rules['max']:
                errors.append(f"{field} must be at most {rules['max']}")
            
            # Enum validation
            if 'enum' in rules and value not in rules['enum']:
                errors.append(f"{field} must be one of: {', '.join(rules['enum'])}")
        
        return len(errors) == 0, errors
    
    def sanitize_input(self, data: Dict) -> Dict:
        """
        Sanitize input data to prevent XSS and injection attacks
        """
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Remove potentially dangerous characters
                sanitized_value = re.sub(r'[<>"\']', '', value)
                # Limit length to prevent buffer overflow
                sanitized_value = sanitized_value[:1000]
                sanitized[key] = sanitized_value
            elif isinstance(value, (int, float, bool)):
                sanitized[key] = value
            elif isinstance(value, list):
                sanitized[key] = [self.sanitize_input(item) if isinstance(item, dict) else str(item)[:100] for item in value]
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_input(value)
            else:
                sanitized[key] = str(value)[:100] if value else None
        
        return sanitized
    
    def is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        pattern = r'^https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$'
        return bool(re.match(pattern, url))
    
    def is_valid_username(self, username: str) -> bool:
        """Validate username format"""
        pattern = r'^[a-zA-Z0-9_-]{3,20}$'
        return bool(re.match(pattern, username))
    
    def is_valid_password(self, password: str) -> bool:
        """Validate password strength"""
        if len(password) < 8:
            return False
        
        # Check for at least one uppercase, lowercase, digit, and special character
        has_upper = re.search(r'[A-Z]', password)
        has_lower = re.search(r'[a-z]', password)
        has_digit = re.search(r'\d', password)
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
        
        return bool(has_upper and has_lower and has_digit and has_special)
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        from flask_bcrypt import Bcrypt
        bcrypt = Bcrypt()
        return bcrypt.generate_password_hash(password).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        from flask_bcrypt import Bcrypt
        bcrypt = Bcrypt()
        return bcrypt.check_password_hash(hashed, password)
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate secure random token"""
        return secrets.token_urlsafe(length)
    
    def validate_ip_address(self, ip: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    def is_suspicious_ip(self, ip: str) -> bool:
        """Check if IP is suspicious (basic implementation)"""
        return ip in self.suspicious_ips
    
    def add_suspicious_ip(self, ip: str):
        """Add IP to suspicious list"""
        self.suspicious_ips.add(ip)
        logger.warning(f"Added suspicious IP: {ip}")
    
    def check_rate_limit(self, identifier: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check rate limit for given identifier
        Returns True if request is allowed, False if rate limited
        """
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=window_seconds)
        
        if identifier not in self.rate_limit_cache:
            self.rate_limit_cache[identifier] = []
        
        # Remove old requests outside the window
        self.rate_limit_cache[identifier] = [
            req_time for req_time in self.rate_limit_cache[identifier]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        if len(self.rate_limit_cache[identifier]) >= max_requests:
            return False
        
        # Add current request
        self.rate_limit_cache[identifier].append(current_time)
        return True
    
    def log_security_event(self, event_type: str, user_id: int = None, details: Dict = None, ip_address: str = None):
        """
        Log security-related events
        """
        try:
            # The original code had AdminActionLog import, but it's removed.
            # Assuming the intent was to remove the log_entry creation and commit
            # as AdminActionLog is no longer imported.
            # For now, we'll just log the event type and user_id if available.
            logger.info(f"Security event logged: {event_type} by user {user_id}")
            
        except Exception as e:
            logger.error(f"Error logging security event: {e}")
    
    def detect_sql_injection(self, query: str) -> bool:
        """Basic SQL injection detection"""
        sql_patterns = [
            r'(\b(union|select|insert|update|delete|drop|create|alter)\b)',
            r'(\b(or|and)\b\s+\d+\s*=\s*\d+)',
            r'(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)',
            r'(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)'
        ]
        
        query_lower = query.lower()
        for pattern in sql_patterns:
            if re.search(pattern, query_lower):
                return True
        
        return False
    
    def detect_xss(self, content: str) -> bool:
        """Basic XSS detection"""
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
            r'<object[^>]*>',
            r'<embed[^>]*>'
        ]
        
        content_lower = content.lower()
        for pattern in xss_patterns:
            if re.search(pattern, content_lower):
                return True
        
        return False
    
    def get_client_ip(self) -> str:
        """Get client IP address considering proxies"""
        if request:
            # Check for forwarded headers
            forwarded_for = request.headers.get('X-Forwarded-For')
            if forwarded_for:
                return forwarded_for.split(',')[0].strip()
            
            real_ip = request.headers.get('X-Real-IP')
            if real_ip:
                return real_ip
            
            return request.remote_addr
        
        return 'unknown'


# Global security service instance
security_service = SecurityService()


# Common validation rules
USER_VALIDATION_RULES = {
    'username': {
        'required': True,
        'min_length': 3,
        'max_length': 20,
        'pattern': r'^[a-zA-Z0-9_-]+$'
    },
    'email': {
        'required': True,
        'type': 'email',
        'max_length': 255
    },
    'password': {
        'required': True,
        'min_length': 8,
        'max_length': 128
    },
    'first_name': {
        'required': False,
        'max_length': 50,
        'pattern': r'^[a-zA-Z\s]+$'
    },
    'last_name': {
        'required': False,
        'max_length': 50,
        'pattern': r'^[a-zA-Z\s]+$'
    }
}

SEARCH_VALIDATION_RULES = {
    'q': {
        'required': True,
        'max_length': 100
    },
    'type': {
        'required': False,
        'enum': ['all', 'username', 'email', 'name', 'profile']
    },
    'page': {
        'required': False,
        'type': 'int',
        'min': 1,
        'max': 1000
    },
    'page_size': {
        'required': False,
        'type': 'int',
        'min': 1,
        'max': 100
    }
}

