import logging
import json
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from flask import request
from .. import db
from ..models import User, UserLoginHistory
from .security_service import security_service
from .audit_service import audit_service

logger = logging.getLogger(__name__)


class LoginHistoryService:
    """Comprehensive login history service with IP geolocation and device fingerprinting"""
    
    def __init__(self):
        self.suspicious_patterns = {
            'multiple_failed_logins': 5,  # Number of failed logins to trigger suspicion
            'unusual_location': True,  # Flag logins from unusual locations
            'rapid_successive_logins': 3,  # Number of rapid successive logins
            'time_threshold_minutes': 5  # Time window for rapid logins
        }
    
    def log_login_attempt(
        self,
        user_id: int,
        is_successful: bool,
        failure_reason: str = None,
        session_id: str = None,
        token_id: str = None,
        two_factor_used: bool = False
    ) -> UserLoginHistory:
        """
        Log a login attempt with comprehensive details
        """
        try:
            # Get client information
            client_ip = security_service.get_client_ip()
            user_agent = request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            
            # Extract device information from user agent
            device_info = self._parse_user_agent(user_agent)
            
            # Get geolocation information
            geo_info = self._get_geolocation(client_ip)
            
            # Check for suspicious activity
            is_suspicious = self._check_suspicious_activity(user_id, client_ip, is_successful)
            
            # Create login history entry
            login_entry = UserLoginHistory(
                user_id=user_id,
                login_timestamp=datetime.utcnow(),
                ip_address=client_ip,
                user_agent=user_agent,
                device_fingerprint=self._generate_device_fingerprint(user_agent, client_ip),
                device_type=device_info.get('device_type', 'unknown'),
                browser=device_info.get('browser', 'unknown'),
                os=device_info.get('os', 'unknown'),
                country=geo_info.get('country'),
                city=geo_info.get('city'),
                region=geo_info.get('region'),
                latitude=geo_info.get('latitude'),
                longitude=geo_info.get('longitude'),
                is_successful=is_successful,
                is_suspicious=is_suspicious,
                failure_reason=failure_reason,
                two_factor_used=two_factor_used,
                session_id=session_id,
                token_id=token_id
            )
            
            db.session.add(login_entry)
            db.session.commit()
            
            # Log to audit system
            if is_successful:
                audit_service.log_authentication_event(
                    user_id=user_id,
                    event_type='login_successful',
                    success=True,
                    details={
                        'ip_address': client_ip,
                        'device_type': device_info.get('device_type'),
                        'browser': device_info.get('browser'),
                        'location': f"{geo_info.get('city', 'Unknown')}, {geo_info.get('country', 'Unknown')}",
                        'two_factor_used': two_factor_used
                    }
                )
            else:
                audit_service.log_authentication_event(
                    user_id=user_id,
                    event_type='login_failed',
                    success=False,
                    details={
                        'ip_address': client_ip,
                        'failure_reason': failure_reason,
                        'device_type': device_info.get('device_type')
                    }
                )
            
            # If suspicious, log security event
            if is_suspicious:
                audit_service.log_security_event(
                    event_type='suspicious_login_attempt',
                    user_id=user_id,
                    details={
                        'ip_address': client_ip,
                        'user_agent': user_agent,
                        'is_successful': is_successful,
                        'location': geo_info
                    },
                    severity='high'
                )
            
            logger.info(f"Login attempt logged for user {user_id}: {'successful' if is_successful else 'failed'}")
            return login_entry
            
        except Exception as e:
            logger.error(f"Error logging login attempt: {e}")
            db.session.rollback()
            return None
    
    def log_logout(
        self,
        user_id: int,
        session_id: str = None,
        token_id: str = None
    ) -> bool:
        """
        Log user logout
        """
        try:
            # Find the most recent login entry for this session
            query = UserLoginHistory.query.filter_by(user_id=user_id, is_successful=True)
            
            if session_id:
                query = query.filter_by(session_id=session_id)
            elif token_id:
                query = query.filter_by(token_id=token_id)
            else:
                # Find the most recent successful login without logout timestamp
                query = query.filter(UserLoginHistory.logout_timestamp.is_(None))
            
            login_entry = query.order_by(UserLoginHistory.login_timestamp.desc()).first()
            
            if login_entry:
                login_entry.logout_timestamp = datetime.utcnow()
                if login_entry.login_timestamp:
                    login_entry.session_duration = int(
                        (login_entry.logout_timestamp - login_entry.login_timestamp).total_seconds()
                    )
                
                db.session.commit()
                
                # Log to audit system
                audit_service.log_authentication_event(
                    user_id=user_id,
                    event_type='logout',
                    success=True,
                    details={
                        'session_duration': login_entry.session_duration,
                        'ip_address': login_entry.ip_address
                    }
                )
                
                logger.info(f"Logout logged for user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error logging logout: {e}")
            db.session.rollback()
            return False
    
    def get_login_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        include_suspicious: bool = True,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[Dict]:
        """
        Get user login history with filtering
        """
        try:
            query = UserLoginHistory.query.filter_by(user_id=user_id)
            
            if not include_suspicious:
                query = query.filter_by(is_suspicious=False)
            
            if start_date:
                query = query.filter(UserLoginHistory.login_timestamp >= start_date)
            
            if end_date:
                query = query.filter(UserLoginHistory.login_timestamp <= end_date)
            
            history = query.order_by(UserLoginHistory.login_timestamp.desc()).offset(offset).limit(limit).all()
            
            return [entry.to_dict() for entry in history]
            
        except Exception as e:
            logger.error(f"Error getting login history: {e}")
            return []
    
    def get_login_statistics(self, user_id: int, days: int = 30) -> Dict:
        """
        Get login statistics for a user
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get all login attempts in the period
            login_attempts = UserLoginHistory.query.filter(
                UserLoginHistory.user_id == user_id,
                UserLoginHistory.login_timestamp >= start_date
            ).all()
            
            # Calculate statistics
            total_attempts = len(login_attempts)
            successful_logins = len([l for l in login_attempts if l.is_successful])
            failed_logins = total_attempts - successful_logins
            suspicious_attempts = len([l for l in login_attempts if l.is_suspicious])
            
            # Get unique locations
            locations = {}
            for login in login_attempts:
                location_key = f"{login.city}, {login.country}" if login.city and login.country else "Unknown"
                locations[location_key] = locations.get(location_key, 0) + 1
            
            # Get unique devices
            devices = {}
            for login in login_attempts:
                device_key = f"{login.browser} on {login.os}"
                devices[device_key] = devices.get(device_key, 0) + 1
            
            # Get login frequency by day
            daily_logins = {}
            for login in login_attempts:
                date_key = login.login_timestamp.strftime('%Y-%m-%d')
                daily_logins[date_key] = daily_logins.get(date_key, 0) + 1
            
            statistics = {
                'total_attempts': total_attempts,
                'successful_logins': successful_logins,
                'failed_logins': failed_logins,
                'success_rate': (successful_logins / total_attempts * 100) if total_attempts > 0 else 0,
                'suspicious_attempts': suspicious_attempts,
                'unique_locations': len(locations),
                'unique_devices': len(devices),
                'top_locations': sorted(locations.items(), key=lambda x: x[1], reverse=True)[:5],
                'top_devices': sorted(devices.items(), key=lambda x: x[1], reverse=True)[:5],
                'daily_logins': daily_logins,
                'period_days': days
            }
            
            return statistics
            
        except Exception as e:
            logger.error(f"Error getting login statistics: {e}")
            return {}
    
    def get_suspicious_activity(self, user_id: int, days: int = 7) -> List[Dict]:
        """
        Get suspicious login activity for a user
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            suspicious_logins = UserLoginHistory.query.filter(
                UserLoginHistory.user_id == user_id,
                UserLoginHistory.is_suspicious == True,
                UserLoginHistory.login_timestamp >= start_date
            ).order_by(UserLoginHistory.login_timestamp.desc()).all()
            
            return [login.to_dict() for login in suspicious_logins]
            
        except Exception as e:
            logger.error(f"Error getting suspicious activity: {e}")
            return []
    
    def _parse_user_agent(self, user_agent: str) -> Dict:
        """
        Parse user agent string to extract device information
        """
        try:
            # Simple user agent parsing (in production, use a library like user-agents)
            user_agent_lower = user_agent.lower()
            
            device_info = {
                'device_type': 'desktop',
                'browser': 'unknown',
                'os': 'unknown'
            }
            
            # Detect device type
            if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
                device_info['device_type'] = 'mobile'
            elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
                device_info['device_type'] = 'tablet'
            
            # Detect browser
            if 'chrome' in user_agent_lower:
                device_info['browser'] = 'Chrome'
            elif 'firefox' in user_agent_lower:
                device_info['browser'] = 'Firefox'
            elif 'safari' in user_agent_lower:
                device_info['browser'] = 'Safari'
            elif 'edge' in user_agent_lower:
                device_info['browser'] = 'Edge'
            elif 'opera' in user_agent_lower:
                device_info['browser'] = 'Opera'
            
            # Detect OS
            if 'windows' in user_agent_lower:
                device_info['os'] = 'Windows'
            elif 'mac' in user_agent_lower or 'darwin' in user_agent_lower:
                device_info['os'] = 'macOS'
            elif 'linux' in user_agent_lower:
                device_info['os'] = 'Linux'
            elif 'android' in user_agent_lower:
                device_info['os'] = 'Android'
            elif 'ios' in user_agent_lower or 'iphone' in user_agent_lower:
                device_info['os'] = 'iOS'
            
            return device_info
            
        except Exception as e:
            logger.error(f"Error parsing user agent: {e}")
            return {'device_type': 'unknown', 'browser': 'unknown', 'os': 'unknown'}
    
    def _get_geolocation(self, ip_address: str) -> Dict:
        """
        Get geolocation information for IP address
        """
        try:
            # This is a placeholder for geolocation service integration
            # In production, use a service like MaxMind, IP2Location, or similar
            
            # For development, return mock data
            geo_info = {
                'country': 'Unknown',
                'city': 'Unknown',
                'region': 'Unknown',
                'latitude': None,
                'longitude': None
            }
            
            # Mock data for common IPs
            if ip_address in ['127.0.0.1', 'localhost']:
                geo_info.update({
                    'country': 'Local',
                    'city': 'Localhost',
                    'region': 'Development'
                })
            elif ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('172.'):
                geo_info.update({
                    'country': 'Private Network',
                    'city': 'Private',
                    'region': 'Internal'
                })
            
            # TODO: Implement actual geolocation service
            # Example with a geolocation service:
            # geo_service = GeoLocationService()
            # geo_info = geo_service.get_location(ip_address)
            
            return geo_info
            
        except Exception as e:
            logger.error(f"Error getting geolocation: {e}")
            return {
                'country': 'Unknown',
                'city': 'Unknown',
                'region': 'Unknown',
                'latitude': None,
                'longitude': None
            }
    
    def _generate_device_fingerprint(self, user_agent: str, ip_address: str) -> str:
        """
        Generate a device fingerprint for tracking
        """
        try:
            # Create a fingerprint based on user agent and IP
            fingerprint_data = f"{user_agent}|{ip_address}"
            return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
        except Exception as e:
            logger.error(f"Error generating device fingerprint: {e}")
            return "unknown"
    
    def _check_suspicious_activity(self, user_id: int, ip_address: str, is_successful: bool) -> bool:
        """
        Check if the login attempt is suspicious
        """
        try:
            # Get recent login attempts for this user
            recent_attempts = UserLoginHistory.query.filter(
                UserLoginHistory.user_id == user_id,
                UserLoginHistory.login_timestamp >= datetime.utcnow() - timedelta(minutes=30)
            ).all()
            
            # Check for multiple failed logins
            failed_attempts = [a for a in recent_attempts if not a.is_successful]
            if len(failed_attempts) >= self.suspicious_patterns['multiple_failed_logins']:
                return True
            
            # Check for rapid successive logins
            if len(recent_attempts) >= self.suspicious_patterns['rapid_successive_logins']:
                # Check if they're within the time threshold
                time_threshold = datetime.utcnow() - timedelta(minutes=self.suspicious_patterns['time_threshold_minutes'])
                rapid_attempts = [a for a in recent_attempts if a.login_timestamp >= time_threshold]
                if len(rapid_attempts) >= self.suspicious_patterns['rapid_successive_logins']:
                    return True
            
            # Check for unusual location (simplified check)
            if self.suspicious_patterns['unusual_location']:
                # Get user's common login locations
                common_locations = db.session.query(
                    UserLoginHistory.country,
                    UserLoginHistory.city
                ).filter(
                    UserLoginHistory.user_id == user_id,
                    UserLoginHistory.is_successful == True,
                    UserLoginHistory.login_timestamp >= datetime.utcnow() - timedelta(days=30)
                ).group_by(
                    UserLoginHistory.country,
                    UserLoginHistory.city
                ).all()
                
                # If this is a new location and user has previous logins, flag as suspicious
                if common_locations and is_successful:
                    current_location = (None, None)  # Would be set from geolocation
                    if current_location not in common_locations:
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking suspicious activity: {e}")
            return False


# Global login history service instance
login_history_service = LoginHistoryService()

