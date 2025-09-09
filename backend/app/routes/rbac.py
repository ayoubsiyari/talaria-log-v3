from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..services.rbac_service import rbac_service
from ..services.security_service import security_service
from ..services.audit_service import audit_service
from ..services.rate_limit_service import rate_limit_admin
from ..models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment
from ..models.user import User
from .. import db
import logging
import random

logger = logging.getLogger(__name__)

rbac_bp = Blueprint('rbac', __name__)

# Mock data functions
def generate_mock_roles():
    return [
        {
            'id': 1,
            'name': 'super_admin',
            'display_name': 'Super Administrator',
            'description': 'Full system access and control',
            'is_system_role': True,
            'is_active': True,
            'priority': 100,
            'permissions': ['*'],
            'assigned_users_count': 1,
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        },
        {
            'id': 2,
            'name': 'admin',
            'display_name': 'Administrator',
            'description': 'System administration and management',
            'is_system_role': True,
            'is_active': True,
            'priority': 80,
            'permissions': ['users.read', 'users.write', 'roles.read'],
            'assigned_users_count': 3,
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        },
        {
            'id': 3,
            'name': 'moderator',
            'display_name': 'Moderator',
            'description': 'Content moderation and user management',
            'is_system_role': False,
            'is_active': True,
            'priority': 50,
            'permissions': ['users.read', 'content.moderate'],
            'assigned_users_count': 5,
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }
    ]

def generate_mock_permissions():
    return [
        {
            'id': 1,
            'name': 'users.read',
            'description': 'Read user information',
            'category': 'users',
            'resource': 'users',
            'action': 'read',
            'is_active': True,
            'is_system_permission': True
        },
        {
            'id': 2,
            'name': 'users.write',
            'description': 'Create and update users',
            'category': 'users',
            'resource': 'users',
            'action': 'write',
            'is_active': True,
            'is_system_permission': True
        },
        {
            'id': 3,
            'name': 'roles.read',
            'description': 'Read role information',
            'category': 'rbac',
            'resource': 'roles',
            'action': 'read',
            'is_active': True,
            'is_system_permission': True
        },
        {
            'id': 4,
            'name': 'roles.write',
            'description': 'Create and update roles',
            'category': 'rbac',
            'resource': 'roles',
            'action': 'write',
            'is_active': True,
            'is_system_permission': True
        },
        {
            'id': 5,
            'name': 'content.moderate',
            'description': 'Moderate content',
            'category': 'content',
            'resource': 'content',
            'action': 'moderate',
            'is_active': True,
            'is_system_permission': False
        }
    ]

def generate_mock_assignments():
    return [
        {
            'id': 1,
            'user_id': 1,
            'role_id': 1,
            'role_name': 'Super Administrator',
            'assigned_by': 'System',
            'assigned_at': '2024-01-01T00:00:00',
            'expires_at': None,
            'is_active': True,
            'notes': 'System default assignment'
        },
        {
            'id': 2,
            'user_id': 2,
            'role_id': 2,
            'role_name': 'Administrator',
            'assigned_by': 'Super Admin',
            'assigned_at': '2024-01-02T00:00:00',
            'expires_at': '2024-12-31T23:59:59',
            'is_active': True,
            'notes': 'Temporary admin access'
        },
        {
            'id': 3,
            'user_id': 3,
            'role_id': 3,
            'role_name': 'Moderator',
            'assigned_by': 'Admin',
            'assigned_at': '2024-01-03T00:00:00',
            'expires_at': None,
            'is_active': True,
            'notes': 'Content moderation role'
        }
    ]

def generate_mock_rbac_statistics():
    return {
        'total_roles': 3,
        'total_permissions': 5,
        'active_assignments': 3,
        'expired_assignments': 0,
        'users_with_roles': 3,
        'roles_with_permissions': 3,
        'system_roles': 2,
        'custom_roles': 1,
        'recent_assignments': 2,
        'recent_role_changes': 1
    }

@rbac_bp.route('/api/admin/roles', methods=['GET'])
@jwt_required()
# @security_service.require_permission('roles.read')
# @rate_limit_admin
def get_roles():
    """Get all available administrative roles"""
    try:
        # Get query parameters
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        include_system = request.args.get('include_system', 'true').lower() == 'true'
        
        # Get roles from database
        roles = AdminRole.query
        
        if not include_inactive:
            roles = roles.filter_by(is_active=True)
        if not include_system:
            roles = roles.filter_by(is_system_role=False)
            
        roles = roles.order_by(AdminRole.priority.desc(), AdminRole.name).all()
        
        # Format response
        roles_data = []
        for role in roles:
            try:
                role_data = {
                    'id': role.id,
                    'name': role.name,
                    'display_name': role.display_name,
                    'description': role.description,
                    'is_system_role': role.is_system_role,
                    'is_active': role.is_active,
                    'priority': role.priority,
                    'permissions': [perm.name for perm in role.permissions if perm.is_active],
                    'assigned_users_count': len(role.user_assignments) if hasattr(role, 'user_assignments') else 0,
                    'created_at': role.created_at.isoformat() if role.created_at else None,
                    'updated_at': role.updated_at.isoformat() if role.updated_at else None
                }
                roles_data.append(role_data)
            except Exception as e:
                logger.error(f"Error formatting role {role.id}: {str(e)}")
                # Add basic role data without problematic fields
                role_data = {
                    'id': role.id,
                    'name': role.name,
                    'display_name': role.display_name,
                    'description': role.description,
                    'is_system_role': role.is_system_role,
                    'is_active': role.is_active,
                    'priority': role.priority,
                    'permissions': [],
                    'assigned_users_count': 0,
                    'created_at': None,
                    'updated_at': None
                }
                roles_data.append(role_data)
        
        return jsonify({
            'success': True,
            'roles': roles_data,
            'total': len(roles_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting roles: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get roles'
        }), 500

@rbac_bp.route('/api/admin/permissions', methods=['GET'])
@jwt_required()
# @security_service.require_permission('permissions.read')
# @rate_limit_admin
def get_permissions():
    """Get all available permissions"""
    try:
        # Get query parameters
        category = request.args.get('category')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        include_system = request.args.get('include_system', 'true').lower() == 'true'
        
        # Build query
        query = Permission.query
        
        if category:
            query = query.filter_by(category=category)
        if not include_inactive:
            query = query.filter_by(is_active=True)
        if not include_system:
            query = query.filter_by(is_system_permission=False)
            
        permissions = query.order_by(Permission.category, Permission.resource, Permission.action).all()
        
        # Format response
        permissions_data = []
        for permission in permissions:
            try:
                perm_data = {
                    'id': permission.id,
                    'name': permission.name,
                    'description': permission.description,
                    'category': permission.category,
                    'resource': permission.resource,
                    'action': permission.action,
                    'is_active': permission.is_active,
                    'is_system_permission': permission.is_system_permission,
                    'created_at': permission.created_at.isoformat() if permission.created_at else None,
                    # Some deployments may not have an 'updated_at' column on Permission; guard safely
                    'updated_at': (getattr(permission, 'updated_at', None).isoformat()
                                   if getattr(permission, 'updated_at', None) else None)
                }
                permissions_data.append(perm_data)
            except Exception as e:
                logger.error(f"Error formatting permission {permission.id}: {str(e)}")
                # Add basic permission data
                perm_data = {
                    'id': permission.id,
                    'name': permission.name,
                    'description': permission.description,
                    'category': permission.category,
                    'resource': permission.resource,
                    'action': permission.action,
                    'is_active': permission.is_active,
                    'is_system_permission': permission.is_system_permission,
                    'created_at': None,
                    'updated_at': None
                }
                permissions_data.append(perm_data)
        
        return jsonify({
            'success': True,
            'permissions': permissions_data,
            'total': len(permissions_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting permissions: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get permissions'
        }), 500

@rbac_bp.route('/api/admin/role-assignments', methods=['GET'])
@jwt_required()
# @security_service.require_permission('role_assignments.read')
# @rate_limit_admin
def get_role_assignments():
    """Get role assignments for current user based on their type"""
    try:
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        user_id = request.args.get('user_id')
        role_id = request.args.get('role_id')
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        
        # Determine if current user is admin or regular user
        admin_user = AdminUser.query.get(int(current_user_id))
        regular_user = User.query.get(int(current_user_id)) if not admin_user else None
        
        # Build query based on user type and permissions
        query = UserRoleAssignment.query
        
        # If specific user_id requested and user has permission, filter by it
        if user_id:
            query = query.filter_by(user_id=int(user_id))
        elif admin_user:
            # Admin users: get their admin assignments
            query = query.filter_by(admin_user_id=int(current_user_id))
        elif regular_user:
            # Regular users: get their user assignments only
            query = query.filter_by(user_id=int(current_user_id))
        else:
            # Unknown user type, return empty
            return jsonify({
                'success': True,
                'assignments': [],
                'total': 0,
                'message': 'User type not recognized'
            }), 200
        
        if role_id:
            query = query.filter_by(role_id=int(role_id))
        if not include_expired:
            query = query.filter_by(is_active=True)
            
        assignments = query.order_by(UserRoleAssignment.assigned_at.desc()).all()
        
        # Format response
        assignments_data = []
        for assignment in assignments:
            try:
                # Get role and user info
                role = AdminRole.query.get(assignment.role_id)
                user = User.query.get(assignment.user_id) if assignment.user_id else None
                admin_user = AdminUser.query.get(assignment.admin_user_id) if assignment.admin_user_id else None
                assigned_by_user = AdminUser.query.get(assignment.assigned_by) if assignment.assigned_by else None
                
                # Get role permissions
                role_permissions = []
                if role and role.permissions:
                    role_permissions = [perm.name for perm in role.permissions]
                
                # Determine the target user (admin or regular)
                target_user = admin_user if admin_user else user
                target_user_type = 'admin' if admin_user else 'regular'
                
                assignment_data = {
                    'id': assignment.id,
                    'user_id': assignment.user_id,
                    'admin_user_id': assignment.admin_user_id,
                    'role_id': assignment.role_id,
                    'role_name': role.name if role else 'unknown_role',
                    'user_type': target_user_type,
                    'role': {
                        'id': role.id if role else None,
                        'name': role.name if role else 'unknown_role',
                        'display_name': role.display_name if role else 'Unknown Role',
                        'description': role.description if role else None,
                        'permissions': role_permissions
                    } if role else None,
                    'user': {
                        'id': target_user.id if target_user else None,
                        'email': target_user.email if target_user else None,
                        'username': getattr(target_user, 'username', None),
                        'first_name': getattr(target_user, 'first_name', None),
                        'last_name': getattr(target_user, 'last_name', None)
                    } if target_user else None,
                    'assigned_by': assigned_by_user.username if assigned_by_user else 'System',
                    'assigned_by_username': assigned_by_user.username if assigned_by_user else 'System',
                    'assigned_at': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                    'expires_at': assignment.expires_at.isoformat() if assignment.expires_at else None,
                    'is_active': assignment.is_active,
                    'notes': assignment.notes,
                    'permissions': role_permissions
                }
                assignments_data.append(assignment_data)
            except Exception as e:
                logger.error(f"Error formatting assignment {assignment.id}: {str(e)}")
                # Add basic assignment data with error handling
                assignment_data = {
                    'id': assignment.id,
                    'user_id': assignment.user_id,
                    'admin_user_id': assignment.admin_user_id,
                    'role_id': assignment.role_id,
                    'role_name': 'Unknown Role',
                    'user_type': 'unknown',
                    'role': None,
                    'user': None,
                    'assigned_by': 'System',
                    'assigned_at': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                    'expires_at': assignment.expires_at.isoformat() if assignment.expires_at else None,
                    'is_active': assignment.is_active,
                    'notes': assignment.notes,
                    'permissions': []
                }
                assignments_data.append(assignment_data)
        
        return jsonify({
            'success': True,
            'assignments': assignments_data,
            'total': len(assignments_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting role assignments: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get role assignments'
        }), 500

@rbac_bp.route('/api/admin/rbac/statistics', methods=['GET'])
@jwt_required()
# @security_service.require_permission('rbac.statistics.read')
# @rate_limit_admin
def get_rbac_statistics():
    """Get RBAC system statistics"""
    try:
        # Get statistics from database
        total_roles = AdminRole.query.count()
        total_permissions = Permission.query.count()
        active_assignments = UserRoleAssignment.query.filter_by(is_active=True).count()
        expired_assignments = UserRoleAssignment.query.filter(
            UserRoleAssignment.expires_at < datetime.utcnow(),
            UserRoleAssignment.is_active == True
        ).count()
        
        # Get unique users with roles
        users_with_roles = db.session.query(UserRoleAssignment.user_id).distinct().count()
        
        # Get roles with permissions
        roles_with_permissions = db.session.query(AdminRole.id).join(
            AdminRole.permissions
        ).distinct().count()
        
        # Get system vs custom roles
        system_roles = AdminRole.query.filter_by(is_system_role=True).count()
        custom_roles = AdminRole.query.filter_by(is_system_role=False).count()
        
        # Get recent assignments (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_assignments = UserRoleAssignment.query.filter(
            UserRoleAssignment.assigned_at >= thirty_days_ago
        ).count()
        
        statistics = {
            'total_roles': total_roles,
            'total_permissions': total_permissions,
            'active_assignments': active_assignments,
            'expired_assignments': expired_assignments,
            'users_with_roles': users_with_roles,
            'roles_with_permissions': roles_with_permissions,
            'system_roles': system_roles,
            'custom_roles': custom_roles,
            'recent_assignments': recent_assignments,
            'recent_role_changes': 0  # TODO: Implement role change tracking
        }
        
        return jsonify({
            'success': True,
            'statistics': statistics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting RBAC statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get RBAC statistics'
        }), 500

@rbac_bp.route('/api/admin/rbac/activity', methods=['GET'])
@jwt_required()
def get_rbac_activity():
    """Get recent RBAC activity"""
    try:
        time_range = request.args.get('time_range', '7d')
        
        # Calculate date range
        if time_range == '1d':
            start_date = datetime.utcnow() - timedelta(days=1)
        elif time_range == '7d':
            start_date = datetime.utcnow() - timedelta(days=7)
        elif time_range == '30d':
            start_date = datetime.utcnow() - timedelta(days=30)
        elif time_range == '90d':
            start_date = datetime.utcnow() - timedelta(days=90)
        else:
            start_date = datetime.utcnow() - timedelta(days=7)
        
        # Get recent role assignments
        recent_assignments = db.session.query(
            UserRoleAssignment,
            AdminUser,
            AdminRole
        ).join(
            AdminUser, UserRoleAssignment.admin_user_id == AdminUser.id
        ).join(
            AdminRole, UserRoleAssignment.role_id == AdminRole.id
        ).filter(
            UserRoleAssignment.assigned_at >= start_date
        ).order_by(
            UserRoleAssignment.assigned_at.desc()
        ).limit(20).all()
        
        activities = []
        for assignment, user, role in recent_assignments:
            activities.append({
                'action': 'Role Assignment',
                'description': f'Role "{role.display_name or role.name}" assigned to {user.username}',
                'timestamp': assignment.assigned_at.isoformat(),
                'user': {
                    'name': user.username,
                    'email': user.email,
                    'avatar': None
                },
                'details': {
                    'role_name': role.name,
                    'role_display_name': role.display_name,
                    'assigned_by': assignment.assigned_by
                }
            })
        
        return jsonify({
            'success': True,
            'activities': activities
        }), 200
    except Exception as e:
        logger.error(f"Error getting RBAC activity: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get RBAC activity'
        }), 500

@rbac_bp.route('/api/admin/rbac/security-alerts', methods=['GET'])
@jwt_required()
def get_security_alerts():
    """Get security alerts related to RBAC"""
    try:
        alerts = []
        
        # Check for expired role assignments
        expired_assignments = UserRoleAssignment.query.filter(
            UserRoleAssignment.expires_at < datetime.utcnow(),
            UserRoleAssignment.is_active == True
        ).count()
        
        if expired_assignments > 0:
            alerts.append({
                'title': f'{expired_assignments} expired role assignments found',
                'severity': 'warning',
                'description': 'Some role assignments have expired but are still active',
                'timestamp': datetime.utcnow().isoformat()
            })
        
        # Check for users without roles
        users_without_roles = db.session.query(AdminUser.id).outerjoin(
            UserRoleAssignment, AdminUser.id == UserRoleAssignment.admin_user_id
        ).filter(
            UserRoleAssignment.id == None
        ).count()
        
        if users_without_roles > 0:
            alerts.append({
                'title': f'{users_without_roles} users without assigned roles',
                'severity': 'info',
                'description': 'Some admin users do not have any roles assigned',
                'timestamp': datetime.utcnow().isoformat()
            })
        
        # Check for roles without permissions
        roles_without_permissions = db.session.query(AdminRole.id).outerjoin(
            AdminRole.permissions
        ).group_by(AdminRole.id).having(
            db.func.count(Permission.id) == 0
        ).count()
        
        if roles_without_permissions > 0:
            alerts.append({
                'title': f'{roles_without_permissions} roles without permissions',
                'severity': 'warning',
                'description': 'Some roles exist but have no permissions assigned',
                'timestamp': datetime.utcnow().isoformat()
            })
        
        return jsonify({
            'success': True,
            'alerts': alerts
        }), 200
    except Exception as e:
        logger.error(f"Error getting security alerts: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get security alerts'
        }), 500

@rbac_bp.route('/api/admin/rbac/top-roles', methods=['GET'])
@jwt_required()
def get_top_roles():
    """Get roles with most assignments"""
    try:
        top_roles = db.session.query(
            AdminRole,
            db.func.count(UserRoleAssignment.id).label('assignments_count'),
            db.func.count(Permission.id).label('permissions_count')
        ).outerjoin(
            UserRoleAssignment, AdminRole.id == UserRoleAssignment.role_id
        ).outerjoin(
            AdminRole.permissions
        ).group_by(AdminRole.id).order_by(
            db.func.count(UserRoleAssignment.id).desc()
        ).limit(10).all()
        
        roles = []
        for role, assignments_count, permissions_count in top_roles:
            roles.append({
                'id': role.id,
                'name': role.name,
                'display_name': role.display_name,
                'description': role.description,
                'assignments_count': assignments_count or 0,
                'permissions_count': permissions_count or 0,
                'is_system_role': role.is_system_role,
                'created_at': role.created_at.isoformat() if role.created_at else None
            })
        
        return jsonify({
            'success': True,
            'roles': roles
        }), 200
    except Exception as e:
        logger.error(f"Error getting top roles: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get top roles'
        }), 500

@rbac_bp.route('/api/admin/rbac/permission-usage', methods=['GET'])
@jwt_required()
def get_permission_usage():
    """Get permission usage statistics"""
    try:
        # Get permissions with their usage count (how many roles have them)
        permission_usage = db.session.query(
            Permission,
            db.func.count(AdminRole.id).label('usage_count')
        ).outerjoin(
            Permission.roles
        ).group_by(Permission.id).order_by(
            db.func.count(AdminRole.id).desc()
        ).limit(20).all()
        
        total_roles = AdminRole.query.count()
        
        permissions = []
        for permission, usage_count in permission_usage:
            usage_percentage = (usage_count / total_roles * 100) if total_roles > 0 else 0
            permissions.append({
                'id': permission.id,
                'name': permission.name,
                'description': permission.description,
                'category': permission.category,
                'usage_count': usage_count or 0,
                'usage_percentage': round(usage_percentage, 1)
            })
        
        return jsonify({
            'success': True,
            'permissions': permissions
        }), 200
    except Exception as e:
        logger.error(f"Error getting permission usage: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get permission usage'
        }), 500

@rbac_bp.route('/api/admin/rbac/user-distribution', methods=['GET'])
@jwt_required()
def get_user_distribution():
    """Get user role distribution"""
    try:
        # Get role distribution
        role_distribution = db.session.query(
            AdminRole.name,
            AdminRole.display_name,
            db.func.count(UserRoleAssignment.id).label('user_count')
        ).join(
            UserRoleAssignment, AdminRole.id == UserRoleAssignment.role_id
        ).filter(
            UserRoleAssignment.is_active == True
        ).group_by(AdminRole.id, AdminRole.name, AdminRole.display_name).order_by(
            db.func.count(UserRoleAssignment.id).desc()
        ).all()
        
        total_assignments = sum(item.user_count for item in role_distribution)
        
        distribution = []
        for role_name, display_name, user_count in role_distribution:
            percentage = (user_count / total_assignments * 100) if total_assignments > 0 else 0
            distribution.append({
                'role_name': display_name or role_name,
                'user_count': user_count,
                'percentage': round(percentage, 1)
            })
        
        return jsonify({
            'success': True,
            'distribution': distribution
        }), 200
    except Exception as e:
        logger.error(f"Error getting user distribution: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get user distribution'
        }), 500
