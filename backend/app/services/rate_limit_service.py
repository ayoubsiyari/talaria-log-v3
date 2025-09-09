import logging
import time
from typing import Dict, Optional, Callable
from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
from .security_service import security_service
from .audit_service import audit_service
import json

logger = logging.getLogger(__name__)


class RateLimitService:
    """Comprehensive rate limiting service with multiple strategies"""
    
    def __init__(self):
        self.rate_limits = {
            # API endpoints
            'api_users': {'requests': 100, 'window': 3600},  # 100 requests per hour
            'api_search': {'requests': 50, 'window': 3600},  # 50 searches per hour
            'api_stats': {'requests': 30, 'window': 3600},   # 30 stats requests per hour
            
            # Authentication
            'auth_login': {'requests': 5, 'window': 300},    # 5 login attempts per 5 minutes
            'auth_register': {'requests': 3, 'window': 3600}, # 3 registrations per hour
            
            # Admin actions
            'admin_users': {'requests': 200, 'window': 3600}, # 200 admin actions per hour
            'admin_delete': {'requests': 10, 'window': 3600}, # 10 delete actions per hour
            
            # General
            'default': {'requests': 1000, 'window': 3600},   # 1000 requests per hour
            'strict': {'requests': 10, 'window': 300},       # 10 requests per 5 minutes
        }
        
        self.rate_limit_cache = {}
        self.blocked_ips = set()
        self.blocked_users = set()
    
    def get_rate_limit_config(self, endpoint: str) -> Dict:
        """
        Get rate limit configuration for an endpoint
        """
        # Check for specific endpoint configuration
        for key, config in self.rate_limits.items():
            if key in endpoint:
                return config
        
        # Return default configuration
        return self.rate_limits['default']
    
    def get_identifier(self, endpoint: str) -> str:
        """
        Get unique identifier for rate limiting
        """
        # Try to get user ID from JWT token
        try:
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()
            if user_id:
                return f"user:{user_id}:{endpoint}"
        except:
            pass
        
        # Fallback to IP address
        client_ip = security_service.get_client_ip()
        return f"ip:{client_ip}:{endpoint}"
    
    def check_rate_limit(self, endpoint: str) -> tuple[bool, Dict]:
        """
        Check if request is within rate limits
        Returns (allowed, rate_limit_info)
        """
        identifier = self.get_identifier(endpoint)
        config = self.get_rate_limit_config(endpoint)
        
        # Check if IP or user is blocked
        if self._is_blocked(identifier):
            return False, {
                'blocked': True,
                'reason': 'IP or user is blocked due to abuse',
                'retry_after': None
            }
        
        # Check rate limit
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=config['window'])
        
        if identifier not in self.rate_limit_cache:
            self.rate_limit_cache[identifier] = []
        
        # Remove old requests outside the window
        self.rate_limit_cache[identifier] = [
            req_time for req_time in self.rate_limit_cache[identifier]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        if len(self.rate_limit_cache[identifier]) >= config['requests']:
            # Calculate retry after time
            oldest_request = min(self.rate_limit_cache[identifier])
            retry_after = (oldest_request + timedelta(seconds=config['window']) - current_time).total_seconds()
            
            # Log rate limit violation
            self._log_rate_limit_violation(identifier, endpoint, config)
            
            return False, {
                'limit_exceeded': True,
                'requests': len(self.rate_limit_cache[identifier]),
                'limit': config['requests'],
                'window': config['window'],
                'retry_after': max(0, int(retry_after))
            }
        
        # Add current request
        self.rate_limit_cache[identifier].append(current_time)
        
        return True, {
            'remaining': config['requests'] - len(self.rate_limit_cache[identifier]),
            'limit': config['requests'],
            'reset_time': (current_time + timedelta(seconds=config['window'])).isoformat()
        }
    
    def rate_limit(self, endpoint: str = None):
        """
        Decorator for rate limiting routes
        """
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Determine endpoint
                route_endpoint = endpoint or request.endpoint
                
                # Check rate limit
                allowed, rate_limit_info = self.check_rate_limit(route_endpoint)
                
                if not allowed:
                    # Add rate limit headers
                    response = jsonify({
                        'error': 'Rate limit exceeded',
                        'details': rate_limit_info
                    }), 429
                    
                    if 'retry_after' in rate_limit_info and rate_limit_info['retry_after']:
                        response[0].headers['Retry-After'] = str(rate_limit_info['retry_after'])
                    
                    return response
                
                # Add rate limit headers to successful response
                response = f(*args, **kwargs)
                
                if isinstance(response, tuple):
                    response_obj, status_code = response
                else:
                    response_obj, status_code = response, 200
                
                # Add rate limit headers
                if hasattr(response_obj, 'headers'):
                    response_obj.headers['X-RateLimit-Limit'] = str(rate_limit_info['limit'])
                    response_obj.headers['X-RateLimit-Remaining'] = str(rate_limit_info['remaining'])
                    response_obj.headers['X-RateLimit-Reset'] = rate_limit_info['reset_time']
                
                return response
            
            return decorated_function
        return decorator
    
    def adaptive_rate_limit(self, base_endpoint: str, multiplier: float = 1.0):
        """
        Adaptive rate limiting based on user behavior and risk factors
        """
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Calculate adaptive limits
                adaptive_config = self._calculate_adaptive_limits(base_endpoint, multiplier)
                
                # Check rate limit with adaptive configuration
                identifier = self.get_identifier(base_endpoint)
                allowed, rate_limit_info = self._check_adaptive_rate_limit(identifier, adaptive_config)
                
                if not allowed:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'details': rate_limit_info
                    }), 429
                
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator
    
    def _calculate_adaptive_limits(self, endpoint: str, multiplier: float) -> Dict:
        """
        Calculate adaptive rate limits based on risk factors
        """
        base_config = self.get_rate_limit_config(endpoint)
        
        # Get user risk factors
        risk_multiplier = self._calculate_risk_multiplier()
        
        # Apply adaptive limits
        adaptive_config = {
            'requests': int(base_config['requests'] * multiplier * risk_multiplier),
            'window': base_config['window']
        }
        
        # Ensure minimum limits
        adaptive_config['requests'] = max(1, adaptive_config['requests'])
        
        return adaptive_config
    
    def _calculate_risk_multiplier(self) -> float:
        """
        Calculate risk multiplier based on user behavior
        """
        try:
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()
            
            if not user_id:
                return 0.5  # Lower limits for unauthenticated users
            
            # Get user activity summary
            activity_summary = audit_service.get_user_activity_summary(user_id, days=7)
            
            # Calculate risk based on suspicious activity
            suspicious_count = len(activity_summary.get('suspicious_activity', []))
            
            if suspicious_count > 10:
                return 0.1  # Very restrictive for high-risk users
            elif suspicious_count > 5:
                return 0.3  # Restrictive for medium-risk users
            elif suspicious_count > 0:
                return 0.7  # Slightly restrictive for low-risk users
            else:
                return 1.0  # Normal limits for trusted users
                
        except:
            return 0.5  # Default for unknown users
    
    def _check_adaptive_rate_limit(self, identifier: str, config: Dict) -> tuple[bool, Dict]:
        """
        Check rate limit with adaptive configuration
        """
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=config['window'])
        
        if identifier not in self.rate_limit_cache:
            self.rate_limit_cache[identifier] = []
        
        # Remove old requests
        self.rate_limit_cache[identifier] = [
            req_time for req_time in self.rate_limit_cache[identifier]
            if req_time > window_start
        ]
        
        # Check limit
        if len(self.rate_limit_cache[identifier]) >= config['requests']:
            return False, {
                'adaptive_limit_exceeded': True,
                'requests': len(self.rate_limit_cache[identifier]),
                'limit': config['requests']
            }
        
        # Add current request
        self.rate_limit_cache[identifier].append(current_time)
        
        return True, {
            'remaining': config['requests'] - len(self.rate_limit_cache[identifier]),
            'limit': config['requests']
        }
    
    def _is_blocked(self, identifier: str) -> bool:
        """
        Check if identifier is blocked
        """
        # Check if IP is blocked
        if identifier.startswith('ip:'):
            ip = identifier.split(':')[1]
            return ip in self.blocked_ips
        
        # Check if user is blocked
        if identifier.startswith('user:'):
            user_id = identifier.split(':')[1]
            return user_id in self.blocked_users
        
        return False
    
    def _log_rate_limit_violation(self, identifier: str, endpoint: str, config: Dict):
        """
        Log rate limit violation for monitoring
        """
        try:
            # Extract user ID or IP
            if identifier.startswith('user:'):
                user_id = int(identifier.split(':')[1])
                target_type = 'user'
            else:
                user_id = None
                target_type = 'ip'
            
            # Log the violation
            audit_service.log_security_event(
                event_type='rate_limit_violation',
                user_id=user_id,
                details={
                    'identifier': identifier,
                    'endpoint': endpoint,
                    'limit': config['requests'],
                    'window': config['window'],
                    'target_type': target_type
                },
                severity='warning'
            )
            
            # Check for repeated violations
            self._check_repeated_violations(identifier, endpoint)
            
        except Exception as e:
            logger.error(f"Error logging rate limit violation: {e}")
    
    def _check_repeated_violations(self, identifier: str, endpoint: str):
        """
        Check for repeated violations and apply penalties
        """
        # Get recent violations for this identifier
        recent_violations = audit_service.get_audit_logs(
            action='rate_limit_violation',
            start_date=datetime.utcnow() - timedelta(hours=1),
            limit=100
        )
        
        # Count violations for this identifier
        violation_count = 0
        for violation in recent_violations:
            try:
                details = json.loads(violation.details) if violation.details else {}
                if details.get('identifier') == identifier:
                    violation_count += 1
            except:
                continue
        
        # Apply penalties for repeated violations
        if violation_count >= 10:
            # Block IP or user for 24 hours
            if identifier.startswith('ip:'):
                ip = identifier.split(':')[1]
                self.blocked_ips.add(ip)
                logger.warning(f"Blocked IP {ip} due to repeated rate limit violations")
            elif identifier.startswith('user:'):
                user_id = identifier.split(':')[1]
                self.blocked_users.add(user_id)
                logger.warning(f"Blocked user {user_id} due to repeated rate limit violations")
    
    def get_rate_limit_stats(self, identifier: str = None) -> Dict:
        """
        Get rate limiting statistics
        """
        stats = {
            'total_identifiers': len(self.rate_limit_cache),
            'blocked_ips': len(self.blocked_ips),
            'blocked_users': len(self.blocked_users),
            'active_limits': {}
        }
        
        if identifier:
            if identifier in self.rate_limit_cache:
                requests = len(self.rate_limit_cache[identifier])
                stats['active_limits'][identifier] = {
                    'requests': requests,
                    'is_blocked': self._is_blocked(identifier)
                }
        
        return stats
    
    def cleanup_expired_entries(self):
        """
        Clean up expired rate limit entries
        """
        current_time = datetime.utcnow()
        cleaned_count = 0
        
        for identifier, requests in list(self.rate_limit_cache.items()):
            # Remove entries older than 24 hours
            cutoff_time = current_time - timedelta(hours=24)
            original_count = len(requests)
            
            self.rate_limit_cache[identifier] = [
                req_time for req_time in requests
                if req_time > cutoff_time
            ]
            
            if len(self.rate_limit_cache[identifier]) == 0:
                del self.rate_limit_cache[identifier]
            
            cleaned_count += original_count - len(self.rate_limit_cache.get(identifier, []))
        
        logger.info(f"Cleaned up {cleaned_count} expired rate limit entries")
        return cleaned_count


# Global rate limit service instance
rate_limit_service = RateLimitService()


# Common rate limit decorators
def rate_limit_users(f):
    """Rate limit for user management endpoints"""
    return rate_limit_service.rate_limit('api_users')(f)

def rate_limit_search(f):
    """Rate limit for search endpoints"""
    return rate_limit_service.rate_limit('api_search')(f)

def rate_limit_auth(f):
    """Rate limit for authentication endpoints"""
    return rate_limit_service.rate_limit('auth_login')(f)

def rate_limit_admin(f):
    """Rate limit for admin endpoints"""
    return rate_limit_service.rate_limit('admin_users')(f)

