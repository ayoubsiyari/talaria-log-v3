"""
Payment Security Service
Handles payment security validation and fraud detection
"""

import re
import time
from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class PaymentSecurityService:
    """Payment security service for validation and fraud detection"""
    
    def __init__(self):
        self.suspicious_ips = set()
        self.rate_limits = {}  # IP -> {count, last_request}
        self.max_requests_per_minute = 10
        self.blocked_ips = set()
        
    def validate_payment_data(self, data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """Validate payment data for security and completeness"""
        try:
            # Required fields validation
            required_fields = ['customer_email', 'customer_name', 'items']
            for field in required_fields:
                if field not in data or not data[field]:
                    return False, f"Missing required field: {field}", {}
            
            # Email validation
            email = data.get('customer_email', '').strip()
            if not self._is_valid_email(email):
                return False, "Invalid email format", {}
            
            # Items validation
            items = data.get('items', [])
            if not isinstance(items, list) or len(items) == 0:
                return False, "At least one item is required", {}
            
            # Validate each item
            for i, item in enumerate(items):
                if not isinstance(item, dict):
                    return False, f"Invalid item format at index {i}", {}
                
                required_item_fields = ['name', 'price']
                for field in required_item_fields:
                    if field not in item:
                        return False, f"Item {i} missing required field: {field}", {}
                
                # Price validation
                try:
                    price = float(item['price'])
                    if price <= 0:
                        return False, f"Item {i} price must be greater than 0", {}
                    if price > 10000:  # Maximum amount check
                        return False, f"Item {i} price exceeds maximum allowed amount", {}
                except (ValueError, TypeError):
                    return False, f"Item {i} has invalid price format", {}
            
            # Customer name validation
            customer_name = data.get('customer_name', '').strip()
            if len(customer_name) < 2:
                return False, "Customer name must be at least 2 characters", {}
            
            if len(customer_name) > 100:
                return False, "Customer name is too long", {}
            
            # Check for suspicious patterns
            if self._detect_suspicious_patterns(data):
                return False, "Suspicious payment pattern detected", {}
            
            # Rate limiting check
            if not self._check_rate_limit():
                return False, "Too many requests. Please try again later.", {}
            
            return True, "Valid payment data", {
                'validated_at': datetime.utcnow().isoformat(),
                'customer_email': email,
                'items_count': len(items),
                'total_amount': sum(float(item['price']) for item in items)
            }
            
        except Exception as e:
            logger.error(f"Payment validation error: {str(e)}")
            return False, "Payment validation failed", {}
    
    def validate_payment_success_data(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate payment success data"""
        try:
            required_fields = ['order_id', 'payment_intent_id', 'customer_email']
            for field in required_fields:
                if field not in data or not data[field]:
                    return False, f"Missing required field: {field}"
            
            # Order ID validation
            order_id = data.get('order_id')
            if not isinstance(order_id, int) or order_id <= 0:
                return False, "Invalid order ID"
            
            # Payment intent ID validation
            payment_intent_id = data.get('payment_intent_id', '').strip()
            if not payment_intent_id or len(payment_intent_id) < 10:
                return False, "Invalid payment intent ID"
            
            # Email validation
            email = data.get('customer_email', '').strip()
            if not self._is_valid_email(email):
                return False, "Invalid email format"
            
            return True, "Valid payment success data"
            
        except Exception as e:
            logger.error(f"Payment success validation error: {str(e)}")
            return False, "Payment success validation failed"
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _detect_suspicious_patterns(self, data: Dict[str, Any]) -> bool:
        """Detect suspicious payment patterns"""
        try:
            # Check for test data patterns
            email = data.get('customer_email', '').lower()
            if any(test_pattern in email for test_pattern in ['test@', 'fake@', 'dummy@']):
                return True
            
            # Check for suspicious item names
            items = data.get('items', [])
            for item in items:
                name = item.get('name', '').lower()
                if any(suspicious in name for suspicious in ['test', 'fake', 'dummy', 'hack']):
                    return True
            
            return False
            
        except Exception:
            return False
    
    def _check_rate_limit(self) -> bool:
        """Check if request is within rate limits"""
        try:
            from flask import request
            client_ip = request.remote_addr
            
            current_time = time.time()
            
            # Clean old entries
            self.rate_limits = {
                ip: data for ip, data in self.rate_limits.items()
                if current_time - data['last_request'] < 60
            }
            
            # Check current IP
            if client_ip in self.rate_limits:
                if self.rate_limits[client_ip]['count'] >= self.max_requests_per_minute:
                    return False
                self.rate_limits[client_ip]['count'] += 1
            else:
                self.rate_limits[client_ip] = {'count': 1, 'last_request': current_time}
            
            return True
            
        except Exception:
            return True  # Allow request if rate limiting fails
    
    def log_payment_attempt(self, data: Dict[str, Any], success: bool, error_message: str = None):
        """Log payment attempt for security monitoring"""
        try:
            from flask import request
            
            log_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', ''),
                'success': success,
                'customer_email': data.get('customer_email', ''),
                'error_message': error_message,
                'items_count': len(data.get('items', [])),
                'total_amount': sum(float(item.get('price', 0)) for item in data.get('items', []))
            }
            
            logger.info(f"Payment attempt: {log_data}")
            
        except Exception as e:
            logger.error(f"Failed to log payment attempt: {str(e)}")
    
    def generate_payment_token(self, order_id: int) -> str:
        """Generate a secure payment token"""
        import secrets
        import hashlib
        
        # Create a secure token based on order ID and timestamp
        timestamp = str(int(time.time()))
        random_data = secrets.token_hex(16)
        token_data = f"{order_id}:{timestamp}:{random_data}"
        
        # Hash the token data
        token_hash = hashlib.sha256(token_data.encode()).hexdigest()
        
        return f"pay_{token_hash[:32]}"
    
    def detect_suspicious_activity(self) -> bool:
        """Detect if current request is suspicious"""
        try:
            from flask import request
            client_ip = request.remote_addr
            
            # Check if IP is blocked
            if client_ip in self.blocked_ips:
                return True
            
            # Check rate limits
            if not self._check_rate_limit():
                self.blocked_ips.add(client_ip)
                return True
            
            return False
            
        except Exception:
            return False

# Create singleton instance
payment_security_service = PaymentSecurityService()
