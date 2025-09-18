"""
Input Sanitization Service
Handles comprehensive input sanitization and validation for security
"""

import html
import re
from typing import Any, Dict, List, Optional, Union, Tuple
import logging

logger = logging.getLogger(__name__)

class InputSanitizationService:
    """Service for sanitizing and validating user inputs"""
    
    def __init__(self):
        # Basic HTML sanitization without external dependencies
        self.max_string_length = 1000
        
        # Regex patterns for validation
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?[\d\s\-\(\)]{10,20}$')
        self.name_pattern = re.compile(r'^[a-zA-Z0-9\s\-\'\._]{2,100}$')
        self.alphanumeric_pattern = re.compile(r'^[a-zA-Z0-9\s\-_\.]{1,100}$')
        
    def sanitize_string(self, value: str, max_length: int = 255) -> str:
        """Sanitize a string input"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes and control characters
        value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
        
        # HTML escape
        value = html.escape(value, quote=True)
        
        # Trim whitespace
        value = value.strip()
        
        # Limit length
        if len(value) > max_length:
            value = value[:max_length]
            
        return value
    
    def sanitize_email(self, email: str) -> Optional[str]:
        """Sanitize and validate email address"""
        if not email:
            return None
            
        email = email.strip().lower()
        
        # Basic validation
        if not self.email_pattern.match(email):
            return None
            
        # Sanitize
        email = self.sanitize_string(email, 254)
        
        return email if self.email_pattern.match(email) else None
    
    def sanitize_name(self, name: str) -> Optional[str]:
        """Sanitize and validate name"""
        if not name:
            logger.warning(f"sanitize_name: No name provided")
            return None
            
        name = name.strip()
        logger.debug(f"sanitize_name: Input name: '{name}'")
        
        # Basic validation
        if not self.name_pattern.match(name):
            logger.warning(f"sanitize_name: Name '{name}' does not match pattern")
            return None
            
        # Sanitize
        sanitized_name = self.sanitize_string(name, 100)
        logger.debug(f"sanitize_name: Sanitized name: '{sanitized_name}'")
        
        result = sanitized_name if self.name_pattern.match(sanitized_name) else None
        logger.debug(f"sanitize_name: Final result: '{result}'")
        return result
    
    def sanitize_phone(self, phone: str) -> Optional[str]:
        """Sanitize and validate phone number"""
        if not phone:
            return None
            
        phone = phone.strip()
        
        # Remove all non-digit characters except + at start
        cleaned = re.sub(r'[^\d\+]', '', phone)
        
        # Basic validation - check length and format
        if len(cleaned) < 10:
            return None
            
        # Validate cleaned phone matches a stricter pattern
        clean_phone_pattern = re.compile(r'^\+?\d{10,15}$')
        return cleaned if clean_phone_pattern.match(cleaned) else None
    
    def sanitize_amount(self, amount: Union[str, int, float]) -> Optional[float]:
        """Sanitize and validate monetary amount"""
        if amount is None:
            return None
            
        try:
            # Convert to float
            if isinstance(amount, str):
                amount = float(amount.strip())
            else:
                amount = float(amount)
                
            # Validate range
            if amount < 0 or amount > 100000:  # Max $100,000
                return None
                
            # Round to 2 decimal places
            return round(amount, 2)
            
        except (ValueError, TypeError):
            return None
    
    def sanitize_integer(self, value: Union[str, int], min_val: int = 0, max_val: int = 2147483647) -> Optional[int]:
        """Sanitize and validate integer"""
        if value is None:
            return None
            
        try:
            if isinstance(value, str):
                value = int(value.strip())
            else:
                value = int(value)
                
            if min_val <= value <= max_val:
                return value
            return None
            
        except (ValueError, TypeError):
            return None
    
    def sanitize_payment_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payment data"""
        sanitized = {}
        
        logger.debug(f"sanitize_payment_data: Input data keys: {list(data.keys())}")
        logger.debug(f"sanitize_payment_data: customer_name input: '{data.get('customer_name')}'")
        
        # Required fields
        sanitized['customer_email'] = self.sanitize_email(data.get('customer_email'))
        sanitized['customer_name'] = self.sanitize_name(data.get('customer_name'))
        
        logger.debug(f"sanitize_payment_data: customer_name output: '{sanitized['customer_name']}'")
        
        # Items validation
        items = data.get('items', [])
        if isinstance(items, list):
            sanitized_items = []
            for item in items:
                if isinstance(item, dict):
                    sanitized_item = {
                        'name': self.sanitize_string(item.get('name', ''), 255),
                        'price': self.sanitize_amount(item.get('price')),
                        'quantity': self.sanitize_integer(item.get('quantity', 1), 1, 100),
                        'description': self.sanitize_string(item.get('description', ''), 500)
                    }
                    
                    # Only add if valid
                    if sanitized_item['name'] and sanitized_item['price'] is not None:
                        sanitized_items.append(sanitized_item)
            
            sanitized['items'] = sanitized_items
        
        # Optional fields
        if 'promotion_code' in data:
            sanitized['promotion_code'] = self.sanitize_string(data['promotion_code'], 50)
        
        if 'user_id' in data:
            sanitized['user_id'] = self.sanitize_integer(data['user_id'])
        
        # PCI-compliant payment method ID (tokenized by Stripe)
        if 'payment_method_id' in data:
            sanitized['payment_method_id'] = self.sanitize_string(data['payment_method_id'], 255)
        
        # Additional customer fields for PCI-compliant flow
        if 'customer_phone' in data:
            sanitized['customer_phone'] = self.sanitize_string(data['customer_phone'], 50)
        
        if 'billing_address' in data:
            sanitized['billing_address'] = self.sanitize_string(data['billing_address'], 500)
        
        return sanitized
    
    def sanitize_payment_success_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payment success data"""
        sanitized = {}
        
        # Order ID
        sanitized['order_id'] = self.sanitize_integer(data.get('order_id') or data.get('orderId'))
        
        # Payment intent ID
        payment_intent_id = data.get('payment_intent_id') or data.get('payment_intent') or data.get('id')
        if payment_intent_id:
            sanitized['payment_intent_id'] = self.sanitize_string(str(payment_intent_id), 255)
        
        # Customer email
        customer_email = data.get('customer_email') or data.get('customerEmail') or data.get('email')
        sanitized['customer_email'] = self.sanitize_email(customer_email)
        
        return sanitized
    
    def validate_sanitized_data(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate sanitized data"""
        # Check required fields
        if not data.get('customer_email'):
            return False, "Valid customer email is required"
        
        if not data.get('customer_name'):
            return False, "Valid customer name is required"
        
        # Check items
        items = data.get('items', [])
        if not items:
            return False, "At least one item is required"
        
        for i, item in enumerate(items):
            if not item.get('name'):
                return False, f"Item {i} name is required"
            if item.get('price') is None or item.get('price') <= 0:
                return False, f"Item {i} must have a valid price"
        
        return True, "Data is valid"

# Create singleton instance
input_sanitization_service = InputSanitizationService()
