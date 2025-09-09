from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.services.rate_limit_service import rate_limit_admin
from app.models.rbac import AdminUser, UserRoleAssignment
from app.services.rbac_service import rbac_service
from app import db

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            admin_user_identity = get_jwt_identity()
            admin_user_id = int(admin_user_identity) if admin_user_identity is not None else None
            
            # Check if user is an admin
            admin_user = AdminUser.query.get(admin_user_id)
            if not admin_user or not admin_user.is_active:
                return jsonify({'error': 'Admin access required'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
    
    return decorated_function

def require_admin_permission(permission_name: str):
    """Decorator to require a specific permission for the current admin user."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            try:
                verify_jwt_in_request()
                admin_user_identity = get_jwt_identity()
                # Support string subjects in JWT by casting to int for DB lookups
                admin_user_id = int(admin_user_identity) if admin_user_identity is not None else None
                admin_user = AdminUser.query.get(admin_user_id)
                if not admin_user or not admin_user.is_active:
                    return jsonify({'error': 'Admin access required'}), 403
                if not rbac_service.admin_has_permission(admin_user_id, permission_name):
                    return jsonify({'error': 'Permission denied', 'missing': permission_name}), 403
                return f(*args, **kwargs)
            except Exception:
                return jsonify({'error': 'Authentication required'}), 401
        return wrapped
    return decorator

def super_admin_required(f):
    """Decorator to require super admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            admin_user_identity = get_jwt_identity()
            admin_user_id = int(admin_user_identity) if admin_user_identity is not None else None
            
            # Check if user is a super admin
            admin_user = AdminUser.query.get(admin_user_id)
            if not admin_user or not admin_user.is_active:
                return jsonify({'error': 'Super admin access required'}), 403
            
            # Check if user has super admin role
            super_admin_assignment = UserRoleAssignment.query.filter_by(
                admin_user_id=admin_user_id,
                role_id=1,  # Assuming super_admin role has ID 1
                is_active=True
            ).first()
            
            if not super_admin_assignment:
                return jsonify({'error': 'Super admin access required'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
    
    return decorated_function

