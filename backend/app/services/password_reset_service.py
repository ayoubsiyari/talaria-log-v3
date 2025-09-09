import logging
import secrets
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from flask import current_app, request, url_for
from .. import db
from ..models import User, PasswordResetToken
from .security_service import security_service
from .audit_service import audit_service

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Secure password reset service with token generation and email delivery"""
    
    def __init__(self):
        self.token_expiry_hours = 24  # Token expires in 24 hours
        self.max_active_tokens = 3  # Maximum active tokens per user
        self.token_length = 32  # Token length in bytes
    
    def initiate_password_reset(
        self,
        email: str,
        token_type: str = 'reset'
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Initiate password reset process
        Returns (success, reset_data, errors)
        """
        try:
            # Find user by email
            user = User.query.filter_by(email=email).first()
            if not user:
                # Don't reveal if user exists or not for security
                logger.info(f"Password reset attempted for non-existent email: {email}")
                return True, {'message': 'If the email exists, a reset link has been sent'}, []
            
            if not user.is_active:
                return False, {}, ['Account is deactivated']
            
            # Check for existing active tokens
            active_tokens = PasswordResetToken.query.filter_by(
                user_id=user.id,
                is_used=False,
                is_revoked=False
            ).filter(PasswordResetToken.expires_at > datetime.utcnow()).all()
            
            if len(active_tokens) >= self.max_active_tokens:
                # Revoke old tokens
                for token in active_tokens:
                    token.revoke()
                db.session.commit()
                logger.warning(f"Too many active reset tokens for user {user.id}, revoked old ones")
            
            # Generate secure token
            token = secrets.token_urlsafe(self.token_length)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Create token record
            reset_token = PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                token_type=token_type,
                expires_at=datetime.utcnow() + timedelta(hours=self.token_expiry_hours),
                ip_address=security_service.get_client_ip(),
                user_agent=request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            )
            
            db.session.add(reset_token)
            db.session.commit()
            
            # Generate reset URL
            reset_url = self._generate_reset_url(token, user.id)
            
            # Send email (implement email service integration)
            email_sent = self._send_reset_email(user.email, reset_url, user.username)
            
            # Audit log
            audit_service.log_authentication_event(
                user_id=user.id,
                event_type='password_reset_initiated',
                success=True,
                details={
                    'email': email,
                    'token_type': token_type,
                    'ip_address': security_service.get_client_ip()
                }
            )
            
            reset_data = {
                'message': 'Password reset link sent to your email',
                'expires_at': reset_token.expires_at.isoformat(),
                'email_sent': email_sent
            }
            
            logger.info(f"Password reset initiated for user {user.id}")
            return True, reset_data, []
            
        except Exception as e:
            logger.error(f"Error initiating password reset: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def validate_reset_token(self, token: str, user_id: int) -> Tuple[bool, Optional[PasswordResetToken], List[str]]:
        """
        Validate password reset token
        Returns (valid, token_object, errors)
        """
        try:
            # Hash the provided token
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Find token record
            reset_token = PasswordResetToken.query.filter_by(
                token_hash=token_hash,
                user_id=user_id
            ).first()
            
            if not reset_token:
                return False, None, ['Invalid or expired reset token']
            
            # Check if token is valid
            if not reset_token.is_valid:
                if reset_token.is_expired:
                    return False, None, ['Reset token has expired']
                elif reset_token.is_used:
                    return False, None, ['Reset token has already been used']
                elif reset_token.is_revoked:
                    return False, None, ['Reset token has been revoked']
                else:
                    return False, None, ['Invalid reset token']
            
            return True, reset_token, []
            
        except Exception as e:
            logger.error(f"Error validating reset token: {e}")
            return False, None, [str(e)]
    
    def reset_password(
        self,
        token: str,
        user_id: int,
        new_password: str
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Reset password using token
        Returns (success, result_data, errors)
        """
        try:
            # Validate token
            is_valid, reset_token, errors = self.validate_reset_token(token, user_id)
            if not is_valid:
                return False, {}, errors
            
            # Validate new password
            if not security_service.is_valid_password(new_password):
                return False, {}, ['Password does not meet security requirements']
            
            # Get user
            user = User.query.get(user_id)
            if not user:
                return False, {}, ['User not found']
            
            # Update password
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            
            # Mark token as used
            reset_token.mark_as_used()
            
            # Revoke all other active tokens for this user
            active_tokens = PasswordResetToken.query.filter_by(
                user_id=user.id,
                is_used=False,
                is_revoked=False
            ).all()
            
            for active_token in active_tokens:
                if active_token.id != reset_token.id:
                    active_token.revoke()
            
            db.session.commit()
            
            # Audit log
            audit_service.log_authentication_event(
                user_id=user.id,
                event_type='password_reset_completed',
                success=True,
                details={
                    'token_id': reset_token.id,
                    'ip_address': security_service.get_client_ip()
                }
            )
            
            result_data = {
                'message': 'Password successfully reset',
                'user_id': user.id,
                'reset_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Password reset completed for user {user.id}")
            return True, result_data, []
            
        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def admin_reset_password(
        self,
        user_id: int,
        new_password: str,
        admin_user_id: int
    ) -> Tuple[bool, Dict, List[str]]:
        """
        Admin-initiated password reset
        Returns (success, result_data, errors)
        """
        try:
            # Get user
            user = User.query.get(user_id)
            if not user:
                return False, {}, ['User not found']
            
            # Validate new password
            if not security_service.is_valid_password(new_password):
                return False, {}, ['Password does not meet security requirements']
            
            # Generate admin reset token
            token = secrets.token_urlsafe(self.token_length)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Create admin token record
            admin_token = PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                token_type='admin_reset',
                expires_at=datetime.utcnow() + timedelta(hours=1),  # Short expiry for admin resets
                ip_address=security_service.get_client_ip(),
                user_agent=request.headers.get('User-Agent', 'Unknown') if request else 'Unknown'
            )
            
            # Update password
            user.set_password(new_password)
            user.updated_at = datetime.utcnow()
            
            # Mark token as used immediately
            admin_token.mark_as_used()
            
            db.session.add(admin_token)
            db.session.commit()
            
            # Audit log
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='admin_password_reset',
                target_type='user',
                target_id=str(user_id),
                details={
                    'admin_user_id': admin_user_id,
                    'token_id': admin_token.id,
                    'ip_address': security_service.get_client_ip()
                },
                severity='high'
            )
            
            result_data = {
                'message': 'Password successfully reset by admin',
                'user_id': user.id,
                'admin_user_id': admin_user_id,
                'reset_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Admin password reset for user {user.id} by admin {admin_user_id}")
            return True, result_data, []
            
        except Exception as e:
            logger.error(f"Error in admin password reset: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def revoke_user_tokens(self, user_id: int, admin_user_id: int = None) -> Tuple[bool, Dict, List[str]]:
        """
        Revoke all active tokens for a user
        Returns (success, result_data, errors)
        """
        try:
            # Get active tokens
            active_tokens = PasswordResetToken.query.filter_by(
                user_id=user_id,
                is_used=False,
                is_revoked=False
            ).filter(PasswordResetToken.expires_at > datetime.utcnow()).all()
            
            revoked_count = 0
            for token in active_tokens:
                token.revoke()
                revoked_count += 1
            
            db.session.commit()
            
            # Audit log
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='tokens_revoked',
                target_type='user',
                target_id=str(user_id),
                details={
                    'revoked_count': revoked_count,
                    'user_id': user_id
                }
            )
            
            result_data = {
                'message': f'Revoked {revoked_count} active tokens',
                'user_id': user_id,
                'revoked_count': revoked_count
            }
            
            logger.info(f"Revoked {revoked_count} tokens for user {user_id}")
            return True, result_data, []
            
        except Exception as e:
            logger.error(f"Error revoking tokens: {e}")
            db.session.rollback()
            return False, {}, [str(e)]
    
    def get_user_tokens(self, user_id: int) -> List[Dict]:
        """
        Get all tokens for a user
        """
        try:
            tokens = PasswordResetToken.query.filter_by(user_id=user_id).order_by(
                PasswordResetToken.created_at.desc()
            ).all()
            
            return [token.to_dict() for token in tokens]
            
        except Exception as e:
            logger.error(f"Error getting user tokens: {e}")
            return []
    
    def cleanup_expired_tokens(self) -> int:
        """
        Clean up expired tokens
        Returns number of tokens cleaned up
        """
        try:
            expired_tokens = PasswordResetToken.query.filter(
                PasswordResetToken.expires_at < datetime.utcnow()
            ).all()
            
            cleaned_count = 0
            for token in expired_tokens:
                if not token.is_used:
                    token.revoke()
                    cleaned_count += 1
            
            db.session.commit()
            
            logger.info(f"Cleaned up {cleaned_count} expired tokens")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
            db.session.rollback()
            return 0
    
    def _generate_reset_url(self, token: str, user_id: int) -> str:
        """
        Generate password reset URL
        """
        # In a real application, this would use the frontend URL
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return f"{base_url}/reset-password?token={token}&user_id={user_id}"
    
    def _send_reset_email(self, email: str, reset_url: str, username: str) -> bool:
        """
        Send password reset email
        Returns True if email was sent successfully
        """
        try:
            # This is a placeholder for email service integration
            # In a real application, you would integrate with a service like SendGrid, Mailgun, etc.
            
            email_data = {
                'to': email,
                'subject': 'Password Reset Request',
                'template': 'password_reset',
                'data': {
                    'username': username,
                    'reset_url': reset_url,
                    'expires_in': f"{self.token_expiry_hours} hours"
                }
            }
            
            # Log email data for development
            logger.info(f"Password reset email would be sent: {email_data}")
            
            # TODO: Implement actual email sending
            # email_service.send_email(email_data)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending reset email: {e}")
            return False


# Global password reset service instance
password_reset_service = PasswordResetService()

