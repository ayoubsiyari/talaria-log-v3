from flask import request, g, jsonify
from functools import wraps
import time
import hashlib
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """Security middleware for the Flask application"""
    
    def __init__(self, app):
        self.app = app
        self.setup_security_headers()
        self.setup_rate_limiting()
        self.setup_request_logging()
    
    def setup_security_headers(self):
        """Add security headers to all responses"""
        @self.app.after_request
        def add_security_headers(response):
            # Security Headers
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
            
            # Remove server information
            response.headers.pop('Server', None)
            
            return response
    
    def setup_rate_limiting(self):
        """Setup rate limiting for API endpoints"""
        # Temporarily disable rate limiting for development
        print("Rate limiting disabled for development")
        self.limiter = None
        return
        
        try:
            self.limiter = Limiter(
                app=self.app,
                key_func=get_remote_address,
                default_limits=["200 per day", "50 per hour"],
                storage_uri="redis://localhost:6379/0"
            )
        except Exception as e:
            print(f"Warning: Rate limiting disabled - Redis not available: {e}")
            self.limiter = None
        
        # Specific rate limits for sensitive endpoints
        @self.app.before_request
        def rate_limit_sensitive_endpoints():
            if self.limiter is None:
                return  # Skip rate limiting if Redis is not available
            
            if request.path.startswith('/api/auth/login'):
                # Stricter limits for login attempts
                if not self.limiter.test("5 per minute"):
                    return jsonify({'error': 'Too many login attempts. Please try again later.'}), 429
            
            elif request.path.startswith('/api/auth/register'):
                # Limit registration attempts
                if not self.limiter.test("3 per hour"):
                    return jsonify({'error': 'Too many registration attempts. Please try again later.'}), 429
    
    def setup_request_logging(self):
        """Log all requests for security monitoring"""
        @self.app.before_request
        def log_request():
            g.start_time = time.time()
            
            # Log request details (excluding sensitive data)
            log_data = {
                'method': request.method,
                'path': request.path,
                'ip': self.get_client_ip(),
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            logger.info(f"Request: {log_data}")
        
        @self.app.after_request
        def log_response(response):
            if hasattr(g, 'start_time'):
                duration = time.time() - g.start_time
                logger.info(f"Response: {response.status_code} - {duration:.3f}s")
            
            return response
    
    def get_client_ip(self):
        """Get the real client IP address"""
        # Check for proxy headers
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr
    
    def validate_input(self, data, allowed_fields=None):
        """Validate and sanitize input data"""
        if not data:
            return False, "No data provided"
        
        # Check for SQL injection patterns
        sql_patterns = [
            r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
            r'(\b(OR|AND)\b\s+\d+\s*=\s*\d+)',
            r'(\b(OR|AND)\b\s+\'[^\']*\'\s*=\s*\'[^\']*\')',
            r'(\b(OR|AND)\b\s+\d+\s*=\s*\d+\s*--)',
            r'(\b(OR|AND)\b\s+\'[^\']*\'\s*=\s*\'[^\']*\'--)',
        ]
        
        data_str = str(data).upper()
        for pattern in sql_patterns:
            if re.search(pattern, data_str, re.IGNORECASE):
                return False, "Invalid input detected"
        
        # Check for XSS patterns
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
            r'<object[^>]*>',
            r'<embed[^>]*>',
        ]
        
        data_str = str(data)
        for pattern in xss_patterns:
            if re.search(pattern, data_str, re.IGNORECASE):
                return False, "Invalid input detected"
        
        return True, "Valid input"

def require_api_key(f):
    """Decorator to require API key for sensitive endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != 'your-api-key-here':
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_https(f):
    """Decorator to require HTTPS in production"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.headers.get('X-Forwarded-Proto') == 'https' or request.is_secure:
            return f(*args, **kwargs)
        return jsonify({'error': 'HTTPS required'}), 403
    return decorated_function

def sanitize_filename(filename):
    """Sanitize filename to prevent path traversal attacks"""
    # Remove any path traversal attempts
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove any non-alphanumeric characters except dots and hyphens
    filename = re.sub(r'[^a-zA-Z0-9.-]', '', filename)
    
    return filename
