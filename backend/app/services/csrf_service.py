"""
CSRF Service
Handles CSRF token generation and validation for payment forms
"""

import secrets
import time
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import logging
from flask import current_app

logger = logging.getLogger(__name__)

class CSRFService:
    """CSRF protection service for payment forms"""
    
    def __init__(self):
        self.tokens = {}  # token -> {created_at, used, ip}
        self.token_expiry = 3600  # 1 hour
        self.max_tokens_per_ip = 10
        self._validate_configuration()
    
    def _validate_configuration(self):
        """Validate that required configuration is present"""
        try:
            from flask import current_app
            secret_key = current_app.config['SECRET_KEY']  # Must match generation logic
            if not secret_key or secret_key == 'dev-secret-key-change-in-production':
                raise ValueError(
                    "SECRET_KEY is not properly configured. "
                    "This is required for CSRF token security. "
                    "Please set a strong, unique SECRET_KEY in your configuration."
                )
        except RuntimeError:
            # Flask application context not available during import
            # This is normal during module loading
            pass
        
    def _ensure_secret_key_configured(self):
        """Ensure SECRET_KEY is properly configured at runtime"""
        secret_key = current_app.config.get('SECRET_KEY')
        if not secret_key or secret_key == 'dev-secret-key-change-in-production':
            raise ValueError(
                "SECRET_KEY is not properly configured. "
                "This is required for CSRF token security. "
                "Please set a strong, unique SECRET_KEY in your configuration."
            )
        return secret_key

    def generate_csrf_token(self) -> str:
        """Generate a cryptographically secure CSRF token"""
        try:
            from flask import request
            from flask import current_app
            import hmac
            import hashlib
            import hashlib
            
            # Ensure SECRET_KEY is properly configured
            secret_key = self._ensure_secret_key_configured()
            
            # Generate secure token with HMAC
            random_data = secrets.token_hex(32)
            client_ip = request.remote_addr
            timestamp = str(int(time.time()))
            
            # Create HMAC-based token for integrity
            token_data = f"{random_data}:{client_ip}:{timestamp}"
            token_signature = hmac.new(
                secret_key.encode(),
                token_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Combine data with signature
            token = f"{token_data}:{token_signature}"
            
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
            
            logger.info(f"Generated secure CSRF token for IP: {client_ip}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate CSRF token: {str(e)}")
            raise  # Re-raise to handle error properly at the caller level
    
    def validate_csrf_token(self, token: str) -> Tuple[bool, str]:
        """Validate a CSRF token with HMAC verification"""
        try:
            from flask import request
            import hmac
            import hashlib
            
            if not token:
                return False, "No CSRF token provided"
            
            # Ensure SECRET_KEY is properly configured
            secret_key = self._ensure_secret_key_configured()
            
            # Verify token format
            if ':' not in token or token.count(':') != 3:
                return False, "Invalid CSRF token format"
            
            # Extract token components
            parts = token.split(':')
            if len(parts) != 4:
                return False, "Invalid CSRF token structure"
            
            random_data, stored_ip, timestamp, signature = parts
            
            # Verify HMAC signature
            token_data = f"{random_data}:{stored_ip}:{timestamp}"
            expected_signature = hmac.new(
                secret_key.encode(),
                token_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                return False, "Invalid CSRF token signature"
            
            # Check if token exists in our store
            if token not in self.tokens:
                return False, "CSRF token not found in store"
            
            token_data_store = self.tokens[token]
            client_ip = request.remote_addr
            
            # Check if token is expired
            if time.time() - token_data_store['created_at'] > self.token_expiry:
                del self.tokens[token]
                return False, "CSRF token expired"
            
            # Check if token was already used
            if token_data_store['used']:
                del self.tokens[token]
                return False, "CSRF token already used"
            
            # Verify IP address (mandatory for security)
            # Allow localhost IPs for testing
            if stored_ip != client_ip and not (stored_ip in ['127.0.0.1', '::1'] and client_ip in ['127.0.0.1', '::1']):
                logger.warning(f"CSRF token IP mismatch: {stored_ip} vs {client_ip}")
                return False, "CSRF token IP mismatch"
            
            # Mark token as used
            token_data_store['used'] = True
            
            logger.info(f"Validated secure CSRF token for IP: {client_ip}")
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
