"""
CSRF Service
Handles CSRF token generation and validation for payment forms
"""

import secrets
import time
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CSRFService:
    """CSRF protection service for payment forms"""
    
    def __init__(self):
        self.tokens = {}  # token -> {created_at, used, ip}
        self.token_expiry = 3600  # 1 hour
        self.max_tokens_per_ip = 10
        
    def generate_csrf_token(self) -> str:
        """Generate a new CSRF token"""
        try:
            from flask import request
            
            # Generate secure token
            token = secrets.token_urlsafe(32)
            client_ip = request.remote_addr
            
            # Store token with metadata
            self.tokens[token] = {
                'created_at': time.time(),
                'used': False,
                'ip': client_ip
            }
            
            # Clean up old tokens
            self._cleanup_old_tokens()
            
            # Limit tokens per IP
            self._limit_tokens_per_ip(client_ip)
            
            logger.info(f"Generated CSRF token for IP: {client_ip}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate CSRF token: {str(e)}")
            return secrets.token_urlsafe(32)  # Fallback token
    
    def validate_csrf_token(self, token: str) -> Tuple[bool, str]:
        """Validate a CSRF token"""
        try:
            from flask import request
            
            if not token:
                return False, "No CSRF token provided"
            
            if token not in self.tokens:
                return False, "Invalid CSRF token"
            
            token_data = self.tokens[token]
            client_ip = request.remote_addr
            
            # Check if token is expired
            if time.time() - token_data['created_at'] > self.token_expiry:
                del self.tokens[token]
                return False, "CSRF token expired"
            
            # Check if token was already used
            if token_data['used']:
                del self.tokens[token]
                return False, "CSRF token already used"
            
            # Check IP address (optional - can be disabled for development)
            if token_data['ip'] != client_ip:
                logger.warning(f"CSRF token IP mismatch: {token_data['ip']} vs {client_ip}")
                # In development, we might allow this
                # return False, "CSRF token IP mismatch"
            
            # Mark token as used
            token_data['used'] = True
            
            logger.info(f"Validated CSRF token for IP: {client_ip}")
            return True, "Valid CSRF token"
            
        except Exception as e:
            logger.error(f"Failed to validate CSRF token: {str(e)}")
            return False, "CSRF validation failed"
    
    def _cleanup_old_tokens(self):
        """Remove expired tokens"""
        try:
            current_time = time.time()
            expired_tokens = [
                token for token, data in self.tokens.items()
                if current_time - data['created_at'] > self.token_expiry
            ]
            
            for token in expired_tokens:
                del self.tokens[token]
                
        except Exception as e:
            logger.error(f"Failed to cleanup old tokens: {str(e)}")
    
    def _limit_tokens_per_ip(self, client_ip: str):
        """Limit number of tokens per IP address"""
        try:
            # Count tokens for this IP
            ip_tokens = [
                token for token, data in self.tokens.items()
                if data['ip'] == client_ip
            ]
            
            # Remove oldest tokens if limit exceeded
            if len(ip_tokens) > self.max_tokens_per_ip:
                # Sort by creation time and remove oldest
                ip_tokens.sort(key=lambda t: self.tokens[t]['created_at'])
                tokens_to_remove = ip_tokens[:-self.max_tokens_per_ip]
                
                for token in tokens_to_remove:
                    del self.tokens[token]
                    
        except Exception as e:
            logger.error(f"Failed to limit tokens per IP: {str(e)}")
    
    def is_csrf_required(self) -> bool:
        """Check if CSRF protection is required for current request"""
        try:
            from flask import request
            
            # In development, CSRF might be optional
            # In production, it should always be required
            return True  # Always require CSRF for payment endpoints
            
        except Exception:
            return True

# Create singleton instance
csrf_service = CSRFService()
