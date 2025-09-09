import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from flask import request, g
from ..models import User, AdminActionLog
from .. import db
from .security_service import security_service

logger = logging.getLogger(__name__)


class AuditService:
    """Enhanced audit logging service for comprehensive security tracking"""
    
    def __init__(self):
        self.sensitive_fields = {
            'password', 'password_hash', 'token', 'api_key', 'secret',
            'credit_card', 'ssn', 'social_security', 'phone', 'address'
        }
    
    def log_admin_action(
        self,
        admin_user_id: int,
        action: str,
        target_type: str = None,
        target_id: str = None,
        details: Dict = None,
        ip_address: str = None,
        user_agent: str = None,
        severity: str = 'info'
    ):
        """
        Log admin action with comprehensive details
        """
        try:
            # Sanitize sensitive data
            sanitized_details = self._sanitize_sensitive_data(details) if details else None
            
            # Get additional context
            client_ip = ip_address or security_service.get_client_ip()
            user_agent = user_agent or request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            
            # Create audit log entry
            log_entry = AdminActionLog(
                admin_user_id=admin_user_id,
                action=action,
                target_type=target_type,
                target_id=str(target_id) if target_id else None,
                details=json.dumps(sanitized_details) if sanitized_details else None,
                ip_address=client_ip,
                created_at=datetime.utcnow()
            )
            
            db.session.add(log_entry)
            db.session.commit()
            
            # Log to application logger based on severity
            log_message = f"Admin action: {action} by user {admin_user_id} on {target_type}:{target_id}"
            if severity == 'high':
                logger.warning(log_message)
            elif severity == 'critical':
                logger.error(log_message)
            else:
                logger.info(log_message)
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Error logging admin action: {e}")
            return None
    
    def log_user_action(
        self,
        user_id: int,
        action: str,
        target_type: str = None,
        target_id: str = None,
        details: Dict = None,
        ip_address: str = None,
        severity: str = 'info'
    ):
        """
        Log user action (non-admin)
        """
        try:
            # Sanitize sensitive data
            sanitized_details = self._sanitize_sensitive_data(details) if details else None
            
            # Get additional context
            client_ip = ip_address or security_service.get_client_ip()
            user_agent = request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            
            # Create audit log entry
            log_entry = AdminActionLog(
                admin_user_id=user_id,  # Using admin_user_id field for regular users too
                action=action,
                target_type=target_type,
                target_id=str(target_id) if target_id else None,
                details=json.dumps(sanitized_details) if sanitized_details else None,
                ip_address=client_ip,
                created_at=datetime.utcnow()
            )
            
            db.session.add(log_entry)
            db.session.commit()
            
            # Log to application logger
            log_message = f"User action: {action} by user {user_id} on {target_type}:{target_id}"
            if severity == 'high':
                logger.warning(log_message)
            elif severity == 'critical':
                logger.error(log_message)
            else:
                logger.info(log_message)
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Error logging user action: {e}")
            return None
    
    def log_security_event(
        self,
        event_type: str,
        user_id: int = None,
        details: Dict = None,
        ip_address: str = None,
        severity: str = 'warning'
    ):
        """
        Log security-related events
        """
        return self.log_admin_action(
            admin_user_id=user_id or 0,
            action=event_type,
            target_type='security',
            target_id='system',
            details=details,
            ip_address=ip_address,
            severity=severity
        )
    
    def log_data_access(
        self,
        user_id: int,
        data_type: str,
        record_id: str = None,
        access_type: str = 'read',
        details: Dict = None
    ):
        """
        Log data access events
        """
        action = f"{access_type}_{data_type}"
        return self.log_user_action(
            user_id=user_id,
            action=action,
            target_type=data_type,
            target_id=record_id,
            details=details,
            severity='info'
        )
    
    def log_authentication_event(
        self,
        user_id: int,
        event_type: str,  # login, logout, failed_login, password_change, etc.
        success: bool = True,
        details: Dict = None,
        ip_address: str = None
    ):
        """
        Log authentication-related events
        """
        severity = 'warning' if not success else 'info'
        if event_type in ['failed_login', 'brute_force_attempt', 'account_locked']:
            severity = 'high'
        
        return self.log_user_action(
            user_id=user_id,
            action=event_type,
            target_type='authentication',
            target_id='system',
            details=details,
            ip_address=ip_address,
            severity=severity
        )
    
    def log_api_access(
        self,
        user_id: int,
        endpoint: str,
        method: str,
        status_code: int,
        response_time: float = None,
        details: Dict = None
    ):
        """
        Log API access events
        """
        severity = 'info'
        if status_code >= 400:
            severity = 'warning'
        if status_code >= 500:
            severity = 'error'
        
        api_details = {
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'response_time': response_time,
            **(details or {})
        }
        
        return self.log_user_action(
            user_id=user_id,
            action='api_access',
            target_type='api',
            target_id=endpoint,
            details=api_details,
            severity=severity
        )
    
    def get_audit_logs(
        self,
        user_id: int = None,
        action: str = None,
        target_type: str = None,
        severity: str = None,
        start_date: datetime = None,
        end_date: datetime = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AdminActionLog]:
        """
        Retrieve audit logs with filtering
        """
        query = AdminActionLog.query
        
        if user_id:
            query = query.filter(AdminActionLog.admin_user_id == user_id)
        
        if action:
            query = query.filter(AdminActionLog.action == action)
        
        if target_type:
            query = query.filter(AdminActionLog.target_type == target_type)
        
        if severity:
            query = query.filter(AdminActionLog.severity == severity)
        
        if start_date:
            query = query.filter(AdminActionLog.created_at >= start_date)
        
        if end_date:
            query = query.filter(AdminActionLog.created_at <= end_date)
        
        return query.order_by(AdminActionLog.created_at.desc()).offset(offset).limit(limit).all()
    
    def get_security_events(
        self,
        days: int = 7,
        severity: str = None
    ) -> List[AdminActionLog]:
        """
        Get security events from the last N days
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        query = AdminActionLog.query.filter(
            AdminActionLog.target_type == 'security',
            AdminActionLog.created_at >= start_date
        )
        
        if severity:
            query = query.filter(AdminActionLog.severity == severity)
        
        return query.order_by(AdminActionLog.created_at.desc()).all()
    
    def get_user_activity_summary(
        self,
        user_id: int,
        days: int = 30
    ) -> Dict:
        """
        Get activity summary for a user
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all logs for user
        logs = AdminActionLog.query.filter(
            AdminActionLog.admin_user_id == user_id,
            AdminActionLog.created_at >= start_date
        ).all()
        
        # Analyze activity
        activity_summary = {
            'total_actions': len(logs),
            'actions_by_type': {},
            'actions_by_severity': {},
            'recent_activity': [],
            'suspicious_activity': []
        }
        
        for log in logs:
            # Count by action type
            action_type = log.action.split('_')[0] if '_' in log.action else log.action
            activity_summary['actions_by_type'][action_type] = activity_summary['actions_by_type'].get(action_type, 0) + 1
            
            # Count by severity
            activity_summary['actions_by_severity'][log.severity] = activity_summary['actions_by_severity'].get(log.severity, 0) + 1
            
            # Recent activity (last 10 actions)
            if len(activity_summary['recent_activity']) < 10:
                activity_summary['recent_activity'].append({
                    'action': log.action,
                    'target_type': log.target_type,
                    'target_id': log.target_id,
                    'created_at': log.created_at.isoformat(),
                    'severity': log.severity
                })
            
            # Suspicious activity
            if log.severity in ['high', 'critical']:
                activity_summary['suspicious_activity'].append({
                    'action': log.action,
                    'target_type': log.target_type,
                    'target_id': log.target_id,
                    'created_at': log.created_at.isoformat(),
                    'severity': log.severity,
                    'ip_address': log.ip_address
                })
        
        return activity_summary
    
    def get_system_security_summary(self, days: int = 7) -> Dict:
        """
        Get system-wide security summary
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get security events
        security_logs = AdminActionLog.query.filter(
            AdminActionLog.target_type == 'security',
            AdminActionLog.created_at >= start_date
        ).all()
        
        # Get failed login attempts
        failed_logins = AdminActionLog.query.filter(
            AdminActionLog.action == 'failed_login',
            AdminActionLog.created_at >= start_date
        ).all()
        
        # Get suspicious IPs
        suspicious_ips = set()
        for log in security_logs:
            if log.ip_address and log.severity in ['high', 'critical']:
                suspicious_ips.add(log.ip_address)
        
        summary = {
            'total_security_events': len(security_logs),
            'failed_login_attempts': len(failed_logins),
            'suspicious_ips': len(suspicious_ips),
            'events_by_severity': {},
            'events_by_action': {},
            'top_suspicious_ips': []
        }
        
        # Analyze events
        for log in security_logs:
            summary['events_by_severity'][log.severity] = summary['events_by_severity'].get(log.severity, 0) + 1
            summary['events_by_action'][log.action] = summary['events_by_action'].get(log.action, 0) + 1
        
        # Get top suspicious IPs
        ip_counts = {}
        for log in security_logs:
            if log.ip_address and log.severity in ['high', 'critical']:
                ip_counts[log.ip_address] = ip_counts.get(log.ip_address, 0) + 1
        
        summary['top_suspicious_ips'] = sorted(
            [{'ip': ip, 'count': count} for ip, count in ip_counts.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:10]
        
        return summary
    
    def _sanitize_sensitive_data(self, data: Dict) -> Dict:
        """
        Remove or mask sensitive data from audit logs
        """
        if not data:
            return data
        
        sanitized = {}
        for key, value in data.items():
            key_lower = key.lower()
            
            # Check if field contains sensitive data
            is_sensitive = any(sensitive in key_lower for sensitive in self.sensitive_fields)
            
            if is_sensitive:
                if isinstance(value, str):
                    # Mask sensitive string data
                    if len(value) > 4:
                        sanitized[key] = value[:2] + '*' * (len(value) - 4) + value[-2:]
                    else:
                        sanitized[key] = '*' * len(value)
                else:
                    sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    def cleanup_old_logs(self, days_to_keep: int = 90):
        """
        Clean up old audit logs to prevent database bloat
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            # Delete old logs
            deleted_count = AdminActionLog.query.filter(
                AdminActionLog.created_at < cutoff_date
            ).delete()
            
            db.session.commit()
            
            logger.info(f"Cleaned up {deleted_count} old audit logs (older than {days_to_keep} days)")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old audit logs: {e}")
            db.session.rollback()
            return 0


# Global audit service instance
audit_service = AuditService()

