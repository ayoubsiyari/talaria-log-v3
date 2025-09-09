"""
RBAC Middleware for permission checking and role-based access control
"""

from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..models.rbac import AdminUser, UserRoleAssignment
from ..models.user import User
from .. import db
import logging

logger = logging.getLogger(__name__)

def get_current_user_permissions():
    """Get permissions for the current authenticated user"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return []
        
        # Try to get admin user first
        admin_user = AdminUser.query.get(int(current_user_id))
        if admin_user:
            # Check if admin user is suspended
            if not admin_user.is_active:
                return []
                
            if admin_user.is_super_admin:
                # Super admin has all permissions
                from ..models.rbac import Permission
                return [perm.name for perm in Permission.query.filter_by(is_active=True).all()]
            
            # Get permissions from assigned roles
            permissions = set()
            for assignment in admin_user.user_assignments:
                if assignment.is_valid:  # Active and not expired
                    for permission in assignment.role.permissions:
                        if permission.is_active:
                            permissions.add(permission.name)
            return list(permissions)
        
        # Try regular user with role assignments
        user = User.query.get(int(current_user_id))
        if user:
            # Check if user is suspended
            if not user.is_active:
                return []
                
            if hasattr(user, 'rbac_role_assignments'):
                permissions = set()
                for assignment in user.rbac_role_assignments:
                    if assignment.is_valid:
                        for permission in assignment.role.permissions:
                            if permission.is_active:
                                permissions.add(permission.name)
                return list(permissions)
        
        return []
        
    except Exception as e:
        logger.error(f"Error getting user permissions: {e}")
        return []

def has_permission(permission_name):
    """Check if current user has a specific permission"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return False
        
        # Try admin user first
        admin_user = AdminUser.query.get(int(current_user_id))
        if admin_user:
            # Check if admin user is suspended
            if not admin_user.is_active:
                return False
            return admin_user.has_permission(permission_name)
        
        # Try regular user
        user = User.query.get(int(current_user_id))
        if user:
            # Check if user is suspended
            if not user.is_active:
                return False
                
            if hasattr(user, 'rbac_role_assignments'):
                for assignment in user.rbac_role_assignments:
                    if assignment.is_valid and assignment.role.has_permission(permission_name):
                        return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking permission {permission_name}: {e}")
        return False

def require_permission(permission_name):
    """Decorator to require a specific permission"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            if not has_permission(permission_name):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_permission': permission_name
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_any_permission(*permission_names):
    """Decorator to require any of the specified permissions"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            if not any(has_permission(perm) for perm in permission_names):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_permissions': list(permission_names)
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_all_permissions(*permission_names):
    """Decorator to require all of the specified permissions"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            if not all(has_permission(perm) for perm in permission_names):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_permissions': list(permission_names)
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_name):
    """Decorator to require a specific role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                
                # Try admin user first
                admin_user = AdminUser.query.get(int(current_user_id))
                if admin_user and admin_user.has_role(role_name):
                    return f(*args, **kwargs)
                
                # Try regular user
                user = User.query.get(int(current_user_id))
                if user and hasattr(user, 'rbac_role_assignments'):
                    for assignment in user.rbac_role_assignments:
                        if assignment.is_valid and assignment.role.name == role_name:
                            return f(*args, **kwargs)
                
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_role': role_name
                }), 403
                
            except Exception as e:
                logger.error(f"Error checking role {role_name}: {e}")
                return jsonify({'error': 'Permission check failed'}), 500
                
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator to require admin access (any admin role)"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            
            # Check if user is an admin user
            admin_user = AdminUser.query.get(int(current_user_id))
            if admin_user and admin_user.is_active:
                return f(*args, **kwargs)
            
            # Check if regular user has admin roles
            user = User.query.get(int(current_user_id))
            if user and (user.is_admin or (hasattr(user, 'rbac_role_assignments') and user.rbac_role_assignments)):
                return f(*args, **kwargs)
            
            return jsonify({'error': 'Admin access required'}), 403
            
        except Exception as e:
            logger.error(f"Error in admin_required: {e}")
            return jsonify({'error': 'Permission check failed'}), 500
            
    return decorated_function

def super_admin_required(f):
    """Decorator to require super admin access"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            admin_user = AdminUser.query.get(int(current_user_id))
            
            if not admin_user or not admin_user.is_super_admin:
                return jsonify({'error': 'Super admin access required'}), 403
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Error in super_admin_required: {e}")
            return jsonify({'error': 'Permission check failed'}), 500
            
    return decorated_function

class RBACMiddleware:
    """RBAC Middleware class for Flask applications"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with Flask app"""
        app.before_request(self.before_request)
        
        # Add permission checking functions to template globals
        @app.template_global()
        def user_has_permission(permission_name):
            return has_permission(permission_name)
        
        @app.template_global()
        def get_user_permissions():
            return get_current_user_permissions()
    
    def before_request(self):
        """Run before each request to set up RBAC context"""
        try:
            # Skip RBAC for auth endpoints and static files
            if (request.endpoint and 
                (request.endpoint.startswith('auth.') or 
                 request.endpoint.startswith('static') or
                 request.endpoint in ['health_check', 'index'])):
                return
            
            # Try to get current user and set in g
            try:
                verify_jwt_in_request(optional=True)
                current_user_id = get_jwt_identity()
                
                if current_user_id:
                    # Try admin user first
                    admin_user = AdminUser.query.get(int(current_user_id))
                    if admin_user:
                        # Check if admin user is suspended
                        if not admin_user.is_active:
                            return jsonify({'error': 'Admin account is suspended. Please contact support.'}), 403
                        g.current_admin = admin_user
                        g.current_user_permissions = get_current_user_permissions()
                        return
                    
                    # Try regular user
                    user = User.query.get(int(current_user_id))
                    if user:
                        # Check if user is suspended
                        if not user.is_active:
                            return jsonify({'error': 'Account is suspended. Please contact support.'}), 403
                        g.current_user = user
                        g.current_user_permissions = get_current_user_permissions()
                        return
                        
            except Exception:
                # No valid JWT token, continue without user context
                pass
                
        except Exception as e:
            logger.error(f"Error in RBAC middleware: {e}")

# Audit logging for RBAC actions
def log_rbac_action(action, resource_type, resource_id=None, changes=None):
    """Log RBAC-related actions for audit purposes"""
    try:
        from ..models.rbac import RoleAuditLog
        
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return
        
        admin_user = AdminUser.query.get(int(current_user_id))
        if not admin_user:
            return
        
        audit_log = RoleAuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            admin_user_id=admin_user.id,
            changes=changes,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
    except Exception as e:
        logger.error(f"Error logging RBAC action: {e}")
        db.session.rollback()
