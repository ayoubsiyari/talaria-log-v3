"""
Payment Audit Service
Handles payment audit logging and monitoring
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PaymentAuditService:
    """Payment audit service for logging and monitoring"""
    
    def __init__(self):
        self.audit_log_path = "logs/payment_audit.log"
        self._ensure_log_directory()
    
    def _ensure_log_directory(self):
        """Ensure log directory exists"""
        try:
            os.makedirs(os.path.dirname(self.audit_log_path), exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create log directory: {str(e)}")
    
    def log_order_creation(self, order, user, order_data: Dict[str, Any], success: bool):
        """Log order creation event"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'order_creation',
                'success': success,
                'order_id': order.id if order else None,
                'order_number': order.order_number if order else None,
                'user_id': user.id if user else None,
                'customer_email': order_data.get('customer_email'),
                'total_amount': order.total_amount if order else None,
                'items_count': len(order_data.get('items', [])),
                'promotion_code': order_data.get('promotion_code'),
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log order creation: {str(e)}")
    
    def log_payment_processing(self, payment, order, success: bool, error_message: str = None):
        """Log payment processing event"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'payment_processing',
                'success': success,
                'payment_id': payment.id if payment else None,
                'order_id': order.id if order else None,
                'order_number': order.order_number if order else None,
                'amount': payment.amount if payment else None,
                'currency': payment.currency if payment else None,
                'provider': payment.provider if payment else None,
                'provider_payment_id': payment.provider_payment_id if payment else None,
                'status': payment.status if payment else None,
                'error_message': error_message,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log payment processing: {str(e)}")
    
    def log_csrf_violation(self, violation_data: Dict[str, Any]):
        """Log CSRF violation attempt"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'csrf_violation',
                'csrf_token': violation_data.get('csrf_token'),
                'error_message': violation_data.get('error_message'),
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log CSRF violation: {str(e)}")
    
    def log_payment_success(self, order, payment, user):
        """Log successful payment"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'payment_success',
                'order_id': order.id if order else None,
                'order_number': order.order_number if order else None,
                'payment_id': payment.id if payment else None,
                'user_id': user.id if user else None,
                'amount': payment.amount if payment else None,
                'currency': payment.currency if payment else None,
                'provider': payment.provider if payment else None,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log payment success: {str(e)}")
    
    def log_payment_failure(self, order, error_message: str, error_code: str = None):
        """Log payment failure"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'payment_failure',
                'order_id': order.id if order else None,
                'order_number': order.order_number if order else None,
                'error_message': error_message,
                'error_code': error_code,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log payment failure: {str(e)}")
    
    def log_subscription_update(self, user, old_status: str, new_status: str, order_id: int = None):
        """Log subscription status update"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'subscription_update',
                'user_id': user.id if user else None,
                'user_email': user.email if user else None,
                'old_status': old_status,
                'new_status': new_status,
                'order_id': order_id,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log subscription update: {str(e)}")
    
    def log_refund(self, order, payment, refund_amount: float, refund_reason: str = None):
        """Log refund processing"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'refund',
                'order_id': order.id if order else None,
                'order_number': order.order_number if order else None,
                'payment_id': payment.id if payment else None,
                'refund_amount': refund_amount,
                'refund_reason': refund_reason,
                'ip_address': self._get_client_ip(),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log refund: {str(e)}")
    
    def _write_audit_log(self, audit_entry: Dict[str, Any]):
        """Write audit entry to log file"""
        try:
            with open(self.audit_log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(audit_entry) + '\n')
                
        except Exception as e:
            logger.error(f"Failed to write audit log: {str(e)}")
    
    def _get_client_ip(self) -> str:
        """Get client IP address"""
        try:
            from flask import request
            return request.remote_addr or 'unknown'
        except Exception:
            return 'unknown'
    
    def _get_user_agent(self) -> str:
        """Get user agent string"""
        try:
            from flask import request
            return request.headers.get('User-Agent', 'unknown')
        except Exception:
            return 'unknown'
    
    def get_audit_logs(self, event_type: str = None, limit: int = 100) -> list:
        """Get audit logs (for admin purposes)"""
        try:
            logs = []
            with open(self.audit_log_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        if not event_type or log_entry.get('event_type') == event_type:
                            logs.append(log_entry)
                    except json.JSONDecodeError:
                        continue
            
            # Return most recent logs first
            logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return logs[:limit]
            
        except FileNotFoundError:
            return []
        except Exception as e:
            logger.error(f"Failed to get audit logs: {str(e)}")
            return []

    def log_promotion_validation(self, validation_data: Dict[str, Any]):
        """Log promotion code validation"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'promotion_validation',
                'code': validation_data.get('code', '')[:10] + '...',
                'discount_amount': validation_data.get('discount_amount'),
                'ip_address': validation_data.get('ip'),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log promotion validation: {str(e)}")
    
    def log_promotion_usage(self, usage_data: Dict[str, Any]):
        """Log promotion code usage in order creation"""
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'promotion_usage',
                'code': usage_data.get('code', '')[:10] + '...',
                'order_amount': usage_data.get('order_amount'),
                'ip_address': usage_data.get('ip'),
                'user_agent': self._get_user_agent()
            }
            
            self._write_audit_log(audit_entry)
            
        except Exception as e:
            logger.error(f"Failed to log promotion usage: {str(e)}")

# Create singleton instance
payment_audit_service = PaymentAuditService()
