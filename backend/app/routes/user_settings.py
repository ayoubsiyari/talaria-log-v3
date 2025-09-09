from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import User, UserProfile, UserLoginHistory
from ..services import (
    profile_service, password_reset_service, login_history_service,
    security_service, audit_service, rate_limit_service,
    rate_limit_users, rate_limit_auth
)
from datetime import datetime
import json

user_settings_bp = Blueprint('user_settings', __name__)


@user_settings_bp.route('/api/user/settings', methods=['GET'])
@jwt_required()
@rate_limit_users
def get_user_settings():
    """
    GET /api/user/settings - Get current user's settings
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
            db.session.commit()
        
        # Get user's active sessions
        active_sessions = UserLoginHistory.query.filter_by(
            user_id=user_id,
            is_successful=True
        ).order_by(UserLoginHistory.login_timestamp.desc()).limit(5).all()
        
        # Format sessions
        sessions = []
        for session in active_sessions:
            sessions.append({
                'id': session.id,
                'device_type': session.device_type or 'Unknown',
                'browser': session.browser or 'Unknown',
                'os': session.os or 'Unknown',
                'ip_address': session.ip_address,
                'location': f"{session.city or 'Unknown'}, {session.country or 'Unknown'}" if session.city or session.country else 'Unknown',
                'login_timestamp': session.login_timestamp.isoformat(),
                'is_current': session.session_id == request.headers.get('X-Session-ID', ''),
                'two_factor_used': session.two_factor_used
            })
        
        # Build settings object
        settings = {
            'profile': {
                'first_name': profile.first_name or '',
                'last_name': profile.last_name or '',
                'email': user.email,
                'phone_number': profile.phone_number or '',
                'display_name': profile.display_name or '',
                'bio': profile.bio or '',
                'avatar_url': profile.avatar_url,
                'timezone': profile.timezone or 'America/New_York',
                'country': profile.country or '',
                'city': profile.city or '',
                'state': profile.state or '',
                'postal_code': profile.postal_code or '',
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'gender': profile.gender or '',
                'occupation': profile.occupation or '',
                'company': profile.company or '',
                'job_title': profile.job_title or '',
                'industry': profile.industry or '',
                'years_experience': profile.years_experience or 0,
                'linkedin_url': profile.linkedin_url or '',
                'twitter_url': profile.twitter_url or '',
                'website_url': profile.website_url or '',
                'trading_experience': profile.trading_experience or 'beginner',
                'risk_tolerance': profile.risk_tolerance or 'medium',
                'preferred_markets': json.loads(profile.preferred_markets) if profile.preferred_markets else [],
                'investment_goals': json.loads(profile.investment_goals) if profile.investment_goals else [],
                'annual_income_range': profile.annual_income_range or '',
                'net_worth_range': profile.net_worth_range or '',
                'profile_visibility': profile.profile_visibility or 'public'
            },
            'notifications': {
                'email_notifications': profile.email_notifications,
                'sms_notifications': profile.sms_notifications,
                'marketing_emails': profile.marketing_emails,
                'weekly_reports': profile.preferences.get('weekly_reports', True),
                'push_notifications': profile.preferences.get('push_notifications', True),
                'security_alerts': profile.preferences.get('security_alerts', True),
                'trading_alerts': profile.preferences.get('trading_alerts', True)
            },
            'security': {
                'two_factor_enabled': profile.two_factor_enabled,
                'session_timeout': profile.preferences.get('session_timeout', 30),
                'login_notifications': profile.preferences.get('login_notifications', True),
                'password_change_required': user.password_change_required if hasattr(user, 'password_change_required') else False,
                'last_password_change': user.last_password_change.isoformat() if hasattr(user, 'last_password_change') and user.last_password_change else None
            },
            'system': {
                'timezone': profile.timezone or 'America/New_York',
                'date_format': profile.preferences.get('date_format', 'MM/DD/YYYY'),
                'currency': profile.preferences.get('currency', 'USD'),
                'language': profile.preferences.get('language', 'en'),
                'theme': profile.preferences.get('theme', 'light'),
                'compact_mode': profile.preferences.get('compact_mode', False),
                'auto_save': profile.preferences.get('auto_save', True),
                'data_retention_days': profile.preferences.get('data_retention_days', 365)
            },
            'active_sessions': sessions,
            'profile_completion': profile.profile_completion_percentage
        }
        
        return jsonify({
            'success': True,
            'settings': settings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/profile', methods=['PUT'])
@jwt_required()
@rate_limit_users
def update_profile_settings():
    """
    PUT /api/user/settings/profile - Update user profile settings
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate and sanitize input
        is_valid, sanitized_data, validation_errors = security_service.validate_input(data, {
            'first_name': {'max_length': 50, 'pattern': r'^[a-zA-Z\s]+$'},
            'last_name': {'max_length': 50, 'pattern': r'^[a-zA-Z\s]+$'},
            'display_name': {'max_length': 100, 'pattern': r'^[a-zA-Z0-9\s_-]+$'},
            'bio': {'max_length': 1000},
            'phone_number': {'pattern': r'^\+?[\d\s\-\(\)]+$'},
            'country': {'max_length': 100},
            'city': {'max_length': 100},
            'state': {'max_length': 100},
            'postal_code': {'max_length': 20},
            'timezone': {'max_length': 50},
            'trading_experience': {'enum': ['beginner', 'intermediate', 'advanced', 'expert']},
            'risk_tolerance': {'enum': ['low', 'medium', 'high']},
            'occupation': {'max_length': 100},
            'company': {'max_length': 100},
            'job_title': {'max_length': 100},
            'industry': {'max_length': 100},
            'years_experience': {'type': 'int', 'min': 0, 'max': 50},
            'linkedin_url': {'type': 'url'},
            'twitter_url': {'type': 'url'},
            'website_url': {'type': 'url'},
            'profile_visibility': {'enum': ['public', 'private', 'friends_only']},
            'gender': {'max_length': 20},
            'preferred_markets': {'type': 'json_array'},
            'investment_goals': {'type': 'json_array'},
            'annual_income_range': {'max_length': 50},
            'net_worth_range': {'max_length': 50}
        })
        
        if not is_valid:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Update profile fields
        for key, value in sanitized_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        # Update timestamps
        profile.updated_at = datetime.utcnow()
        profile.last_profile_update = datetime.utcnow()
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='profile_updated',
            details={'updated_fields': list(sanitized_data.keys())}
        )
        
        return jsonify({
            'success': True,
            'message': 'Profile settings updated successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/notifications', methods=['PUT'])
@jwt_required()
@rate_limit_users
def update_notification_settings():
    """
    PUT /api/user/settings/notifications - Update notification settings
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate input
        is_valid, sanitized_data, validation_errors = security_service.validate_input(data, {
            'email_notifications': {'type': 'bool'},
            'sms_notifications': {'type': 'bool'},
            'marketing_emails': {'type': 'bool'},
            'weekly_reports': {'type': 'bool'},
            'push_notifications': {'type': 'bool'},
            'security_alerts': {'type': 'bool'},
            'trading_alerts': {'type': 'bool'}
        })
        
        if not is_valid:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Update profile notification fields
        for key in ['email_notifications', 'sms_notifications', 'marketing_emails']:
            if key in sanitized_data:
                setattr(profile, key, sanitized_data[key])
        
        # Update preferences
        for key in ['weekly_reports', 'push_notifications', 'security_alerts', 'trading_alerts']:
            if key in sanitized_data:
                profile.update_preference(key, sanitized_data[key])
        
        # Update timestamps
        profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='notification_settings_updated',
            details={'updated_fields': list(sanitized_data.keys())}
        )
        
        return jsonify({
            'success': True,
            'message': 'Notification settings updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/security', methods=['PUT'])
@jwt_required()
@rate_limit_users
def update_security_settings():
    """
    PUT /api/user/settings/security - Update security settings
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate input
        is_valid, sanitized_data, validation_errors = security_service.validate_input(data, {
            'two_factor_enabled': {'type': 'bool'},
            'session_timeout': {'type': 'int', 'min': 5, 'max': 480},
            'login_notifications': {'type': 'bool'}
        })
        
        if not is_valid:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Update profile security fields
        if 'two_factor_enabled' in sanitized_data:
            profile.two_factor_enabled = sanitized_data['two_factor_enabled']
        
        # Update preferences
        for key in ['session_timeout', 'login_notifications']:
            if key in sanitized_data:
                profile.update_preference(key, sanitized_data[key])
        
        # Update timestamps
        profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='security_settings_updated',
            details={'updated_fields': list(sanitized_data.keys())}
        )
        
        return jsonify({
            'success': True,
            'message': 'Security settings updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/system', methods=['PUT'])
@jwt_required()
@rate_limit_users
def update_system_settings():
    """
    PUT /api/user/settings/system - Update system settings
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate input
        is_valid, sanitized_data, validation_errors = security_service.validate_input(data, {
            'timezone': {'max_length': 50},
            'date_format': {'enum': ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']},
            'currency': {'enum': ['USD', 'EUR', 'GBP', 'JPY', 'CAD']},
            'language': {'enum': ['en', 'es', 'fr', 'de', 'ja']},
            'theme': {'enum': ['light', 'dark', 'auto']},
            'compact_mode': {'type': 'bool'},
            'auto_save': {'type': 'bool'},
            'data_retention_days': {'type': 'int', 'min': 30, 'max': 1095}
        })
        
        if not is_valid:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Update profile timezone
        if 'timezone' in sanitized_data:
            profile.timezone = sanitized_data['timezone']
        
        # Update preferences
        for key in ['date_format', 'currency', 'language', 'theme', 'compact_mode', 'auto_save', 'data_retention_days']:
            if key in sanitized_data:
                profile.update_preference(key, sanitized_data[key])
        
        # Update timestamps
        profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='system_settings_updated',
            details={'updated_fields': list(sanitized_data.keys())}
        )
        
        return jsonify({
            'success': True,
            'message': 'System settings updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/password', methods=['PUT'])
@jwt_required()
@rate_limit_auth
def change_password():
    """
    PUT /api/user/settings/password - Change user password
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validate input
        if not all([current_password, new_password, confirm_password]):
            return jsonify({'error': 'All password fields are required'}), 400
        
        if new_password != confirm_password:
            return jsonify({'error': 'New passwords do not match'}), 400
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password
        if not security_service.is_valid_password(new_password):
            return jsonify({'error': 'Password does not meet security requirements'}), 400
        
        # Change password
        user.set_password(new_password)
        if hasattr(user, 'last_password_change'):
            user.last_password_change = datetime.utcnow()
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='password_changed',
            details={'password_changed': True}
        )
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
@rate_limit_auth
def revoke_session(session_id):
    """
    DELETE /api/user/settings/sessions/{session_id} - Revoke a specific session
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get session
        session = UserLoginHistory.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Mark session as ended
        session.logout_timestamp = datetime.utcnow()
        if session.login_timestamp:
            session.session_duration = int((session.logout_timestamp - session.login_timestamp).total_seconds())
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='session_revoked',
            details={'session_id': session_id}
        )
        
        return jsonify({
            'success': True,
            'message': 'Session revoked successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/sessions', methods=['DELETE'])
@jwt_required()
@rate_limit_auth
def revoke_all_sessions():
    """
    DELETE /api/user/settings/sessions - Revoke all sessions except current
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get current session ID
        current_session_id = request.headers.get('X-Session-ID', '')
        
        # Revoke all sessions except current
        sessions = UserLoginHistory.query.filter_by(
            user_id=user_id,
            is_successful=True
        ).filter(
            UserLoginHistory.session_id != current_session_id
        ).all()
        
        revoked_count = 0
        for session in sessions:
            session.logout_timestamp = datetime.utcnow()
            if session.login_timestamp:
                session.session_duration = int((session.logout_timestamp - session.login_timestamp).total_seconds())
            revoked_count += 1
        
        db.session.commit()
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='all_sessions_revoked',
            details={'revoked_count': revoked_count}
        )
        
        return jsonify({
            'success': True,
            'message': f'{revoked_count} sessions revoked successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_settings_bp.route('/api/user/settings/export', methods=['GET'])
@jwt_required()
@rate_limit_users
def export_user_data():
    """
    GET /api/user/settings/export - Export user data
    """
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        # Get login history
        login_history = UserLoginHistory.query.filter_by(user_id=user_id).limit(100).all()
        
        # Build export data
        export_data = {
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username if hasattr(user, 'username') else None,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None
            },
            'profile': profile.to_dict() if profile else None,
            'login_history': [session.to_dict() for session in login_history],
            'export_date': datetime.utcnow().isoformat()
        }
        
        # Audit log
        audit_service.log_user_action(
            user_id=user_id,
            action='data_exported',
            details={'export_type': 'user_data'}
        )
        
        return jsonify({
            'success': True,
            'data': export_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
