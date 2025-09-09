from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import User, UserProfile
from ..services import (
    profile_service, password_reset_service, login_history_service,
    security_service, audit_service, rate_limit_service,
    rate_limit_users, rate_limit_search, rate_limit_auth
)
from ..middleware.subscription_middleware import require_active_subscription, require_trial_or_subscription
from datetime import datetime

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/api/admin/users/<int:user_id>/profile', methods=['GET'])
@jwt_required()
@require_active_subscription
@security_service.require_permission('view_user_profiles')
@rate_limit_users
def get_user_profile(user_id):
    """
    GET /api/admin/users/{id}/profile - Retrieve detailed user profile information
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get profile with change history
        profile_data = profile_service.get_user_profile(user_id, include_changes=True)
        
        if not profile_data:
            return jsonify({'error': 'User or profile not found'}), 404
        
        # Audit log the access
        audit_service.log_data_access(
            user_id=admin_user_id,
            data_type='user_profile',
            record_id=str(user_id),
            access_type='read',
            details={'admin_access': True}
        )
        
        return jsonify({
            'success': True,
            'profile': profile_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/profile', methods=['PUT'])
@jwt_required()
@security_service.require_permission('edit_user_profiles')
@rate_limit_users
def update_user_profile(user_id):
    """
    PUT /api/admin/users/{id}/profile - Update user profile with validation
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
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
            'email_notifications': {'type': 'bool'},
            'sms_notifications': {'type': 'bool'},
            'marketing_emails': {'type': 'bool'},
            'two_factor_enabled': {'type': 'bool'}
        })
        
        if not is_valid:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # Update profile
        success, updated_profile, errors = profile_service.update_user_profile(
            user_id=user_id,
            profile_data=sanitized_data,
            admin_user_id=admin_user_id
        )
        
        if not success:
            return jsonify({'error': 'Failed to update profile', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': updated_profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/profile/avatar', methods=['POST'])
@jwt_required()
@security_service.require_permission('edit_user_profiles')
@rate_limit_users
def upload_avatar(user_id):
    """
    POST /api/admin/users/{id}/profile/avatar - Upload user avatar
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Check if file was uploaded
        if 'avatar' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Upload avatar
        success, avatar_data, errors = profile_service.upload_avatar(
            user_id=user_id,
            file=file,
            admin_user_id=admin_user_id
        )
        
        if not success:
            return jsonify({'error': 'Failed to upload avatar', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'avatar': avatar_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/profile/avatar', methods=['DELETE'])
@jwt_required()
@security_service.require_permission('edit_user_profiles')
@rate_limit_users
def delete_avatar(user_id):
    """
    DELETE /api/admin/users/{id}/profile/avatar - Delete user avatar
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Delete avatar
        success, errors = profile_service.delete_avatar(
            user_id=user_id,
            admin_user_id=admin_user_id
        )
        
        if not success:
            return jsonify({'error': 'Failed to delete avatar', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Avatar deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/password-reset', methods=['POST'])
@jwt_required()
@security_service.require_permission('edit_users')
@rate_limit_auth
def initiate_password_reset(user_id):
    """
    POST /api/admin/users/{id}/password-reset - Initiate password reset process
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get request data
        data = request.get_json() or {}
        token_type = data.get('token_type', 'admin_reset')
        
        # Get user email
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Initiate password reset
        success, reset_data, errors = password_reset_service.initiate_password_reset(
            email=user.email,
            token_type=token_type
        )
        
        if not success:
            return jsonify({'error': 'Failed to initiate password reset', 'details': errors}), 400
        
        # Audit log
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='password_reset_initiated',
            target_type='user',
            target_id=str(user_id),
            details={'token_type': token_type}
        )
        
        return jsonify({
            'success': True,
            'message': 'Password reset initiated successfully',
            'reset_data': reset_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/password-reset', methods=['PUT'])
@jwt_required()
@security_service.require_permission('edit_users')
@rate_limit_auth
def admin_reset_password(user_id):
    """
    PUT /api/admin/users/{id}/password-reset - Admin password reset
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get request data
        data = request.get_json()
        if not data or 'new_password' not in data:
            return jsonify({'error': 'New password is required'}), 400
        
        new_password = data['new_password']
        
        # Validate password
        if not security_service.is_valid_password(new_password):
            return jsonify({'error': 'Password does not meet security requirements'}), 400
        
        # Reset password
        success, result_data, errors = password_reset_service.admin_reset_password(
            user_id=user_id,
            new_password=new_password,
            admin_user_id=admin_user_id
        )
        
        if not success:
            return jsonify({'error': 'Failed to reset password', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully',
            'result': result_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/login-history', methods=['GET'])
@jwt_required()
@security_service.require_permission('view_user_profiles')
@rate_limit_search
def get_login_history(user_id):
    """
    GET /api/admin/users/{id}/login-history - Retrieve user login history
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        include_suspicious = request.args.get('include_suspicious', 'true').lower() == 'true'
        days = request.args.get('days', 30, type=int)
        
        # Validate parameters
        if limit > 100:
            limit = 100
        if days > 365:
            days = 365
        
        # Get login history
        login_history = login_history_service.get_login_history(
            user_id=user_id,
            limit=limit,
            offset=offset,
            include_suspicious=include_suspicious
        )
        
        # Get login statistics
        statistics = login_history_service.get_login_statistics(user_id, days=days)
        
        # Get suspicious activity
        suspicious_activity = login_history_service.get_suspicious_activity(user_id, days=7)
        
        # Audit log the access
        audit_service.log_data_access(
            user_id=admin_user_id,
            data_type='login_history',
            record_id=str(user_id),
            access_type='read',
            details={'admin_access': True, 'limit': limit, 'offset': offset}
        )
        
        return jsonify({
            'success': True,
            'login_history': login_history,
            'statistics': statistics,
            'suspicious_activity': suspicious_activity,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'total': len(login_history)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/profile/changes', methods=['GET'])
@jwt_required()
@security_service.require_permission('view_user_profiles')
@rate_limit_search
def get_profile_changes(user_id):
    """
    GET /api/admin/users/{id}/profile/changes - Get profile change history
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Validate parameters
        if limit > 100:
            limit = 100
        
        # Get profile changes
        changes = profile_service.get_profile_changes(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        # Audit log the access
        audit_service.log_data_access(
            user_id=admin_user_id,
            data_type='profile_changes',
            record_id=str(user_id),
            access_type='read',
            details={'admin_access': True, 'limit': limit, 'offset': offset}
        )
        
        return jsonify({
            'success': True,
            'changes': changes,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'total': len(changes)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/tokens', methods=['GET'])
@jwt_required()
@security_service.require_permission('view_user_profiles')
@rate_limit_search
def get_user_tokens(user_id):
    """
    GET /api/admin/users/{id}/tokens - Get user password reset tokens
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Get user tokens
        tokens = password_reset_service.get_user_tokens(user_id)
        
        # Audit log the access
        audit_service.log_data_access(
            user_id=admin_user_id,
            data_type='user_tokens',
            record_id=str(user_id),
            access_type='read',
            details={'admin_access': True}
        )
        
        return jsonify({
            'success': True,
            'tokens': tokens
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/tokens', methods=['DELETE'])
@jwt_required()
@security_service.require_permission('edit_users')
@rate_limit_auth
def revoke_user_tokens(user_id):
    """
    DELETE /api/admin/users/{id}/tokens - Revoke all active tokens for user
    """
    try:
        # Get current admin user
        admin_user_id = get_jwt_identity()
        
        # Revoke tokens
        success, result_data, errors = password_reset_service.revoke_user_tokens(
            user_id=user_id,
            admin_user_id=admin_user_id
        )
        
        if not success:
            return jsonify({'error': 'Failed to revoke tokens', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Tokens revoked successfully',
            'result': result_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/api/admin/users/<int:user_id>/profile/validate', methods=['POST'])
@jwt_required()
@security_service.require_permission('view_user_profiles')
@rate_limit_users
def validate_profile_data(user_id):
    """
    POST /api/admin/users/{id}/profile/validate - Validate profile data without saving
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate profile data
        success, validated_data, errors = profile_service.update_user_profile(
            user_id=user_id,
            profile_data=data,
            validate_only=True
        )
        
        if not success:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        return jsonify({
            'success': True,
            'message': 'Profile data is valid',
            'validated_data': validated_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

