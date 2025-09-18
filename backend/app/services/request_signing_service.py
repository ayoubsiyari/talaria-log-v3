"""
Request Signing Service
Handles HMAC request signing for critical endpoints
"""

import hmac
import hashlib
import time
import json
from typing import Dict, Any, Optional, Tuple
from flask import request, current_app, jsonify
import logging

logger = logging.getLogger(__name__)

class RequestSigningService:
    """Service for signing and verifying requests with HMAC"""
    
    def __init__(self):
        self.signature_header = 'X-Request-Signature'
        self.timestamp_header = 'X-Request-Timestamp'
        self.max_timestamp_skew = 300  # 5 minutes
        
    def generate_signature(self, data: str, secret_key: str, timestamp: int) -> str:
        """Generate HMAC signature for request data"""
        try:
            # Create payload with timestamp
            payload = f"{timestamp}:{data}"
            
            # Generate HMAC signature
            signature = hmac.new(
                secret_key.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return signature
            
        except Exception as e:
            logger.error(f"Failed to generate signature: {str(e)}")
            raise ValueError(f"Failed to generate signature: {str(e)}")
    
    def verify_signature(self, data: str, signature: str, timestamp: int, secret_key: str) -> bool:
        """Verify HMAC signature"""
        try:
            # Check timestamp freshness
            current_time = int(time.time())
            if abs(current_time - timestamp) > self.max_timestamp_skew:
                logger.warning(f"Request timestamp too old: {current_time - timestamp}s")
                return False
            
            # Generate expected signature
            expected_signature = self.generate_signature(data, secret_key, timestamp)
            
            # Compare signatures securely
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Failed to verify signature: {str(e)}")
            return False
    
    def sign_request_data(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Sign request data and return headers"""
        try:
            secret_key = current_app.config.get('SECRET_KEY')
            if not secret_key:
                raise ValueError("SECRET_KEY not configured")
            timestamp = int(time.time())
            
            # Convert data to JSON string
            data_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
            
            # Generate signature
            signature = self.generate_signature(data_str, secret_key, timestamp)
            
            return {
                self.signature_header: signature,
                self.timestamp_header: str(timestamp)
            }
            
        except Exception as e:
            logger.error(f"Failed to sign request data: {str(e)}")
            raise ValueError(f"Failed to sign request data: {str(e)}")
    
    def verify_request_signature(self) -> Tuple[bool, str]:
        """Verify incoming request signature"""
        try:
            # Get headers
            signature = request.headers.get(self.signature_header)
            timestamp_str = request.headers.get(self.timestamp_header)
            
            if not signature or not timestamp_str:
                return False, "Missing signature or timestamp headers"
            
            # Parse timestamp
            try:
                timestamp = int(timestamp_str)
            except ValueError:
                return False, "Invalid timestamp format"
            
            # Get request data
            if request.is_json:
                data = request.get_json()
                data_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
            else:
                data_str = request.get_data(as_text=True)
            
            # Get secret key
            secret_key = current_app.config.get('SECRET_KEY')
            if not secret_key:
                return False, "SECRET_KEY not configured"
            
            # Verify signature
            if self.verify_signature(data_str, signature, timestamp, secret_key):
                return True, "Valid signature"
            else:
                return False, "Invalid signature"
                
        except Exception as e:
            logger.error(f"Failed to verify request signature: {str(e)}")
            return False, "Signature verification failed"
    
    def require_signed_request(self, f):
        """Decorator to require signed requests"""
        from functools import wraps
        import os
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if we're in development mode
            is_development = (
                os.environ.get('FLASK_ENV') == 'development' or 
                os.environ.get('ENVIRONMENT') == 'development' or
                current_app.config.get('DEBUG', False)
            )
            
            if is_development:
                # In development, check for signature but don't enforce it
                is_valid, message = self.verify_request_signature()
                if not is_valid:
                    logger.warning(f"Development mode: Request signature verification failed: {message}")
                    logger.warning("Development mode: Allowing unsigned request to proceed")
                    # Continue to execute the function
                else:
                    logger.info("Development mode: Request signature is valid")
                    
                return f(*args, **kwargs)
            else:
                # In production, enforce signature requirement
                is_valid, message = self.verify_request_signature()
                if not is_valid:
                    logger.warning(f"Production mode: Request signature verification failed: {message}")
                    return jsonify({'error': 'Invalid request signature'}), 403
                
                return f(*args, **kwargs)
        
        return decorated_function

# Create singleton instance
request_signing_service = RequestSigningService()
