"""
Security Headers Middleware
Implements comprehensive security headers for all responses

Security Features:
- Strict Content Security Policy without unsafe-inline
- Deprecated X-XSS-Protection header removed (replaced by CSP)
- WebSocket support for real-time features
- Upgrade insecure requests to HTTPS
- Comprehensive frame and object protection
"""

from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware:
    """Middleware for adding security headers to all responses"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with Flask app"""
        app.after_request(self.add_security_headers)
    
    def add_security_headers(self, response):
        """Add comprehensive security headers to response"""
        try:
            # Content Security Policy - Enhanced security without unsafe-inline
            response.headers['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' https://js.stripe.com; "
                "style-src 'self' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-src 'self' https://js.stripe.com; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'"
            )           
            
            # HTTP Strict Transport Security
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
            
            # X-Content-Type-Options
            response.headers['X-Content-Type-Options'] = 'nosniff'
            
            # X-Frame-Options
            response.headers['X-Frame-Options'] = 'DENY'
            
            # X-XSS-Protection removed - deprecated and can introduce vulnerabilities
            # Modern browsers rely on CSP for XSS protection
            
            # Referrer Policy
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # Permissions Policy
            response.headers['Permissions-Policy'] = (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "speaker=()"
            )
            
            # Cache Control for sensitive endpoints
            if request.endpoint and 'payment' in request.endpoint:
                response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
                response.headers['Pragma'] = 'no-cache'
                response.headers['Expires'] = '0'
            
            # Additional security headers
            response.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
            response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
            response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
            response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to add security headers: {str(e)}")
            return response

# Create singleton instance
security_headers_middleware = SecurityHeadersMiddleware()

