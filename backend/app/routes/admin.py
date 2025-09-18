from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
# from ..services.rbac_service import rbac_service
from ..middleware.rbac_middleware import require_permission
# from ..services.security_service import security_service
# from ..services.audit_service import audit_service
# from ..services.rate_limit_service import rate_limit_admin
from sqlalchemy import or_
from ..models import User
from ..models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment
from ..services.rbac_service import rbac_service
from ..models.user import User
from ..models.activity import UserActivityLog
# from ..models.subscription import Subscription  # Not available yet
from .. import db
import logging
import random
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload
import time

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

# Mock data for development - replace with real database queries
def generate_mock_system_stats():
    """Generate mock system statistics for development"""
    return {
        'system_status': 'online',
        'uptime': random.randint(99, 100),
        'cpu_usage': random.randint(20, 80),
        'memory_usage': random.randint(30, 70),
        'disk_usage': random.randint(40, 90),
        'active_sessions': random.randint(50, 200),
        'failed_logins': random.randint(0, 10),
        'security_score': random.randint(85, 98),
        'system_load': random.randint(20, 60),
        'storage_used': random.randint(50, 80),
        'database_connections': random.randint(10, 50),
        'api_requests_per_minute': random.randint(100, 500)
    }

# RBAC Overview Endpoints expected by frontend
@admin_bp.route('/rbac/statistics', methods=['GET'])
@jwt_required()
def get_rbac_statistics():
    """Return RBAC statistics consumed by RBACOverview.jsx under key 'statistics'."""
    try:
        # Basic real counts from DB
        total_roles = db.session.query(AdminRole).count()
        total_permissions = db.session.query(Permission).count()
        active_assignments = db.session.query(UserRoleAssignment).filter_by(is_active=True).count()

        statistics = {
            'total_roles': total_roles,
            'total_permissions': total_permissions,
            'active_assignments': active_assignments,
            # Placeholder growth/health metrics for now
            'roles_growth': 0,
            'permissions_growth': 0,
            'assignments_growth': 0,
            'security_score': 95,
            'security_trend': 'up',
            'avg_response_time': 45,
        }

        return jsonify({
            'success': True,
            'statistics': statistics
        }), 200
    except Exception as e:
        logger.error(f"Error getting RBAC statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve RBAC statistics'
        }), 500

@admin_bp.route('/rbac/security-alerts', methods=['GET'])
@jwt_required()
def get_rbac_security_alerts():
    """Alias endpoint for security alerts used by RBACOverview.jsx."""
    try:
        alerts = generate_mock_security_alerts()
        return jsonify({
            'success': True,
            'alerts': alerts
        }), 200
    except Exception as e:
        logger.error(f"Error getting RBAC security alerts: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve RBAC security alerts'
        }), 500

def generate_mock_user_stats():
    """Generate mock user statistics for development"""
    return {
        'total_users': random.randint(1000, 5000),
        'active_users': random.randint(800, 4000),
        'suspended_users': random.randint(10, 50),
        'new_users_today': random.randint(5, 25),
        'new_users_this_week': random.randint(30, 150),
        'new_users_this_month': random.randint(100, 500),
        'users_with_roles': random.randint(200, 800),
        'users_without_roles': random.randint(200, 1000),
        'premium_users': random.randint(100, 500),
        'free_users': random.randint(800, 3500)
    }

def generate_mock_recent_activity():
    """Generate mock recent activity data"""
    activities = [
        {'action': 'User Created', 'description': 'New user account created', 'user': 'John Doe', 'timestamp': '2024-01-15T10:30:00Z'},
        {'action': 'Role Assigned', 'description': 'Admin role assigned to user', 'user': 'Jane Smith', 'timestamp': '2024-01-15T09:15:00Z'},
        {'action': 'Permission Updated', 'description': 'User management permissions modified', 'user': 'Admin User', 'timestamp': '2024-01-15T08:45:00Z'},
        {'action': 'System Backup', 'description': 'Automated system backup completed', 'user': 'System', 'timestamp': '2024-01-15T08:00:00Z'},
        {'action': 'Security Alert', 'description': 'Failed login attempt detected', 'user': 'Security System', 'timestamp': '2024-01-15T07:30:00Z'},
        {'action': 'User Suspended', 'description': 'User account suspended for policy violation', 'user': 'Admin User', 'timestamp': '2024-01-15T06:15:00Z'},
        {'action': 'Role Created', 'description': 'New moderator role created', 'user': 'Super Admin', 'timestamp': '2024-01-15T05:45:00Z'},
        {'action': 'Database Maintenance', 'description': 'Scheduled database optimization completed', 'user': 'System', 'timestamp': '2024-01-15T05:00:00Z'},
        {'action': 'User Activated', 'description': 'Suspended user account reactivated', 'user': 'Admin User', 'timestamp': '2024-01-15T04:30:00Z'},
        {'action': 'Permission Audit', 'description': 'Comprehensive permission audit completed', 'user': 'Security Team', 'timestamp': '2024-01-15T04:00:00Z'}
    ]
    return activities

def generate_mock_security_alerts():
    """Generate mock security alerts"""
    alerts = [
        {'title': 'Multiple Failed Login Attempts', 'severity': 'warning', 'timestamp': '2024-01-15T10:30:00Z'},
        {'title': 'Unusual API Activity Detected', 'severity': 'info', 'timestamp': '2024-01-15T09:15:00Z'},
        {'title': 'Database Connection Limit Reached', 'severity': 'critical', 'timestamp': '2024-01-15T08:45:00Z'},
        {'title': 'Suspicious IP Address Blocked', 'severity': 'warning', 'timestamp': '2024-01-15T08:00:00Z'},
        {'title': 'SSL Certificate Expiring Soon', 'severity': 'info', 'timestamp': '2024-01-15T07:30:00Z'}
    ]
    return alerts

def generate_mock_rbac_activity():
    """Generate mock RBAC activity data"""
    activities = [
        {'action': 'Role Created', 'description': 'Content Moderator role created', 'user': {'name': 'Super Admin'}, 'timestamp': '2024-01-15T10:30:00Z'},
        {'action': 'Permission Assigned', 'description': 'User management permissions added to Admin role', 'user': {'name': 'Admin User'}, 'timestamp': '2024-01-15T09:15:00Z'},
        {'action': 'Role Assignment', 'description': 'Moderator role assigned to user John Doe', 'user': {'name': 'Admin User'}, 'timestamp': '2024-01-15T08:45:00Z'},
        {'action': 'Permission Revoked', 'description': 'System admin permissions removed from User role', 'user': {'name': 'Super Admin'}, 'timestamp': '2024-01-15T08:00:00Z'},
        {'action': 'Role Updated', 'description': 'Editor role permissions modified', 'user': {'name': 'Admin User'}, 'timestamp': '2024-01-15T07:30:00Z'},
        {'action': 'Assignment Expired', 'description': 'Temporary role assignment expired for user Jane Smith', 'user': {'name': 'System'}, 'timestamp': '2024-01-15T07:00:00Z'},
        {'action': 'Role Deleted', 'description': 'Unused Test role deleted', 'user': {'name': 'Super Admin'}, 'timestamp': '2024-01-15T06:30:00Z'},
        {'action': 'Bulk Assignment', 'description': 'Viewer role assigned to 15 users', 'user': {'name': 'Admin User'}, 'timestamp': '2024-01-15T06:00:00Z'},
        {'action': 'Permission Audit', 'description': 'Comprehensive permission audit completed', 'user': {'name': 'Security Team'}, 'timestamp': '2024-01-15T05:30:00Z'},
        {'action': 'Role Cloned', 'description': 'Admin role cloned to create Super Admin role', 'user': {'name': 'Super Admin'}, 'timestamp': '2024-01-15T05:00:00Z'}
    ]
    return activities

def generate_mock_top_roles():
    """Generate mock top roles data"""
    return [
        {'id': 1, 'name': 'user', 'display_name': 'User', 'assignments_count': 2500, 'permissions_count': 5},
        {'id': 2, 'name': 'admin', 'display_name': 'Administrator', 'assignments_count': 150, 'permissions_count': 25},
        {'id': 3, 'name': 'moderator', 'display_name': 'Moderator', 'assignments_count': 75, 'permissions_count': 15},
        {'id': 4, 'name': 'editor', 'display_name': 'Editor', 'assignments_count': 45, 'permissions_count': 12},
        {'id': 5, 'name': 'viewer', 'display_name': 'Viewer', 'assignments_count': 200, 'permissions_count': 3}
    ]

def generate_mock_permission_usage():
    """Generate mock permission usage data"""
    return [
        {'id': 1, 'name': 'user_management.users.view', 'usage_count': 1500, 'usage_percentage': 85},
        {'id': 2, 'name': 'content_management.content.view', 'usage_count': 1200, 'usage_percentage': 68},
        {'id': 3, 'name': 'analytics.reports.view', 'usage_count': 800, 'usage_percentage': 45},
        {'id': 4, 'name': 'rbac_management.roles.view', 'usage_count': 600, 'usage_percentage': 34},
        {'id': 5, 'name': 'system_admin.settings.view', 'usage_count': 400, 'usage_percentage': 23}
    ]

def generate_mock_user_distribution():
    """Generate mock user role distribution data"""
    return [
        {'role_name': 'User', 'user_count': 2500, 'percentage': 65},
        {'role_name': 'Administrator', 'user_count': 150, 'percentage': 4},
        {'role_name': 'Moderator', 'user_count': 75, 'percentage': 2},
        {'role_name': 'Editor', 'user_count': 45, 'percentage': 1},
        {'role_name': 'Viewer', 'user_count': 200, 'percentage': 5},
        {'role_name': 'No Role', 'user_count': 1000, 'percentage': 23}
    ]

def generate_mock_subscription_overview():
    """Generate mock subscription overview data"""
    return {
        'total_subscriptions': random.randint(800, 2000),
        'active_subscriptions': random.randint(700, 1800),
        'cancelled_subscriptions': random.randint(50, 200),
        'expired_subscriptions': random.randint(20, 100),
        'revenue_this_month': random.randint(50000, 200000),
        'revenue_this_year': random.randint(500000, 2000000),
        'subscription_growth': random.randint(5, 25),
        'churn_rate': random.uniform(2, 8),
        'average_subscription_value': random.randint(50, 200),
        'top_plan': 'Premium',
        'top_plan_subscribers': random.randint(300, 800)
    }

# System Statistics Endpoints
@admin_bp.route('/system/stats', methods=['GET'])
@jwt_required()
def get_system_stats():
    """Get system statistics"""
    try:
        stats = generate_mock_system_stats()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='system_stats',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting system stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve system statistics'
        }), 500

@admin_bp.route('/users/stats', methods=['GET'])
@jwt_required()
@require_permission('user_management.users.view')
def get_user_stats():
    """Get real user statistics from DB"""
    try:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        week_ago = now - timedelta(days=7)
        month_start = datetime(now.year, now.month, 1)

        # Count both regular users and admin users
        from ..models.rbac import AdminUser
        
        # Count both regular users and admin users (excluding soft-deleted)
        total_regular_users = db.session.query(func.count(User.id)).filter(~User.email.like('deleted_%')).scalar() or 0
        total_admin_users = db.session.query(func.count(AdminUser.id)).scalar() or 0
        total_users = total_regular_users + total_admin_users  # Include both for Dashboard
        
        active_regular_users = db.session.query(func.count(User.id)).filter(
            User.is_active.is_(True),
            ~User.email.like('deleted_%')
        ).scalar() or 0
        active_admin_users = db.session.query(func.count(AdminUser.id)).filter(AdminUser.is_active.is_(True)).scalar() or 0
        active_users = active_regular_users + active_admin_users  # Include both for Dashboard
        
        suspended_regular_users = db.session.query(func.count(User.id)).filter(
            User.is_active.is_(False),
            ~User.email.like('deleted_%')
        ).scalar() or 0
        suspended_admin_users = db.session.query(func.count(AdminUser.id)).filter(AdminUser.is_active.is_(False)).scalar() or 0
        suspended_users = suspended_regular_users + suspended_admin_users  # Include both for Dashboard
        new_users_today = db.session.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
        new_users_this_week = db.session.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
        new_users_this_month = db.session.query(func.count(User.id)).filter(User.created_at >= month_start).scalar() or 0
        users_with_roles = (
            db.session.query(func.count(func.distinct(UserRoleAssignment.user_id)))
            .filter(UserRoleAssignment.user_id.isnot(None), UserRoleAssignment.is_active.is_(True))
            .scalar() or 0
        )
        users_without_roles = max(total_users - users_with_roles, 0)
        premium_users = db.session.query(func.count(User.id)).filter(User.subscription_status == 'premium').scalar() or 0

        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'suspended_users': suspended_users,
            'new_users_today': new_users_today,
            'new_users_this_week': new_users_this_week,
            'new_users_this_month': new_users_this_month,
            'users_with_roles': users_with_roles,
            'users_without_roles': users_without_roles,
            'premium_users': premium_users,
            'free_users': max(total_users - premium_users, 0),
        }

        return jsonify({'success': True, 'stats': stats}), 200
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve user statistics'}), 500

@admin_bp.route('/activity/recent', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Get recent system activity"""
    try:
        activities = generate_mock_recent_activity()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='recent_activity',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'activities': activities
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting recent activity: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve recent activity'
        }), 500

@admin_bp.route('/security/alerts', methods=['GET'])
@jwt_required()
def get_security_alerts():
    """Get security alerts"""
    try:
        alerts = generate_mock_security_alerts()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='security_alerts',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'alerts': alerts
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting security alerts: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve security alerts'
        }), 500

# RBAC Analytics Endpoints
@admin_bp.route('/rbac/activity', methods=['GET'])
@jwt_required()
def get_rbac_activity():
    """Get RBAC activity"""
    try:
        time_range = request.args.get('time_range', '7d')
        activities = generate_mock_rbac_activity()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='rbac_activity',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'activities': activities
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting RBAC activity: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve RBAC activity'
        }), 500

@admin_bp.route('/rbac/top-roles', methods=['GET'])
@jwt_required()
def get_top_roles():
    """Get top roles by usage"""
    try:
        roles = generate_mock_top_roles()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='top_roles',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'roles': roles
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting top roles: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve top roles'
        }), 500

@admin_bp.route('/rbac/permission-usage', methods=['GET'])
@jwt_required()
def get_permission_usage():
    """Get permission usage statistics"""
    try:
        permissions = generate_mock_permission_usage()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='permission_usage',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'permissions': permissions
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting permission usage: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve permission usage'
        }), 500

@admin_bp.route('/rbac/user-distribution', methods=['GET'])
@jwt_required()
def get_user_distribution():
    """Get user role distribution"""
    try:
        distribution = generate_mock_user_distribution()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='user_distribution',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'distribution': distribution
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user distribution: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve user distribution'
        }), 500

# Subscription Endpoints
@admin_bp.route('/subscriptions/overview', methods=['GET'])
@jwt_required()
def get_subscription_overview():
    """Get subscription overview"""
    try:
        overview = generate_mock_subscription_overview()
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='subscription_overview',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'overview': overview
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting subscription overview: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve subscription overview'
        }), 500

# System Actions
@admin_bp.route('/system/<action>', methods=['POST'])
@jwt_required()
def perform_system_action(action):
    """Perform system actions like backup, maintenance, etc."""
    try:
        data = request.get_json() or {}
        target_id = data.get('target_id')
        
        # Log the action (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_admin_action(
        #     admin_user_id=admin_user_id,
        #     action=f'system_{action}',
        #     resource_type='system',
        #     details={'action': action, 'target_id': target_id}
        # )
        
        # Mock successful response
        return jsonify({
            'success': True,
            'message': f'{action} completed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing system action {action}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to perform {action}'
        }), 500

# User Management Endpoints
@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@require_permission('user_management.users.create')
def create_user():
    """Create a new user from admin dashboard"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        is_admin = data.get('is_admin', False)
        
        # Validate input
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password cannot be empty'}), 400
        
        # Check if user already exists in either table
        if User.query.filter_by(email=email).first() or AdminUser.query.filter_by(email=email).first():
            return jsonify({'error': 'User with this email already exists'}), 409
        
        if User.query.filter_by(username=username).first() or AdminUser.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already taken'}), 409

        if is_admin:
            # Create an AdminUser
            new_user = AdminUser(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_super_admin=False # Or based on another form field
            )
            new_user.set_password(password)
            resource_type = 'admin_users'
        else:
            # Create a regular User
            new_user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True,  # Admin-created users are automatically verified
                is_admin=False # A regular user created by an admin is not an admin.
            )
            new_user.set_password(password)
            resource_type = 'users'

        db.session.add(new_user)
        db.session.commit()

        # Log the action
        admin_user_id = get_jwt_identity()
        try:
            from ..services.audit_service import audit_service
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='create_user',
                resource_type=resource_type,
                details={
                    'created_user_id': new_user.id,
                    'username': username,
                    'email': email,
                    'is_admin': is_admin
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log user creation: {e}")

        user_dict = new_user.to_dict()

        return jsonify({
            'message': 'User created successfully',
            'user': user_dict
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_permission('user_management.users.view')
def list_users():
    """List, paginate, search, and filter users."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search_term = request.args.get('search', '').strip()
        status_filter = request.args.get('status', 'all').strip().lower()

        # Base query
        query = User.query

        # Apply status filter
        if status_filter == 'active':
            query = query.filter(User.is_active.is_(True))
        elif status_filter == 'suspended':
            query = query.filter(User.is_active.is_(False))
        
        # Apply search term
        if search_term:
            search_filter = or_(
                User.username.ilike(f'%{search_term}%'),
                User.email.ilike(f'%{search_term}%'),
                User.first_name.ilike(f'%{search_term}%'),
                User.last_name.ilike(f'%{search_term}%')
            )
            query = query.filter(search_filter)

        pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        users = pagination.items

        # The to_dict() method on the User model already provides all necessary fields, including subscription_status.
        # We should not use subscription_status as a role field to avoid confusion.
        # The frontend should use the actual role assignments from the database.
        users_data = []
        for user in users:
            user_dict = user.to_dict()
            # Get actual roles from role assignments, not from subscription_status
            user_roles = [ua.role.name for ua in user.rbac_role_assignments if ua.is_active and ua.role and ua.role.is_active]
            user_dict['roles'] = user_roles
            user_dict['role'] = user_roles[0] if user_roles else 'No Role'  # For backward compatibility
            users_data.append(user_dict)

        return jsonify({
            'success': True,
            'users': users_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            }
        }), 200

    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        print(f"ERROR IN LIST_USERS: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve users'}), 500


# Permission Retrieval Endpoints
@admin_bp.route('/me/permissions', methods=['GET'])
@jwt_required()
def get_my_permissions():
    """Return effective permissions for the current admin user."""
    try:
        admin_user_id = get_jwt_identity()
        perms = sorted(list(rbac_service.get_admin_permissions(admin_user_id)))
        return jsonify({'success': True, 'permissions': perms}), 200
    except Exception as e:
        logger.error(f"Error getting my permissions: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve permissions'}), 500



@admin_bp.route('/users/<int:user_id>/permissions', methods=['GET'])
@jwt_required()
def get_user_permissions(user_id: int):
    """Return effective permissions for a specific end user."""
    try:
        perms = sorted(list(rbac_service.get_user_permissions(user_id)))
        return jsonify({'success': True, 'permissions': perms, 'user_id': user_id}), 200
    except Exception as e:
        logger.error(f"Error getting user {user_id} permissions: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve user permissions'}), 500

# Roles Endpoint (for dropdowns)
@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
def list_roles():
    """List roles, optionally including inactive roles."""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        q = db.session.query(AdminRole)
        if not include_inactive:
            q = q.filter(AdminRole.is_active.is_(True))
        roles = q.order_by(AdminRole.priority.desc(), AdminRole.name.asc()).all()

        def serialize_role(r: AdminRole):
            # Get permissions for this role
            permissions = []
            try:
                # Get permissions through role-permission relationship
                if hasattr(r, 'permissions') and r.permissions:
                    permissions = [p.name for p in r.permissions if p.name]
                else:
                    # Fallback: query permissions directly
                    from ..models.rbac import RolePermission
                    role_permissions = db.session.query(RolePermission).filter_by(role_id=r.id).all()
                    permissions = [rp.permission.name for rp in role_permissions if rp.permission and rp.permission.name]
            except Exception as e:
                logger.warning(f"Could not load permissions for role {r.id}: {e}")
                permissions = []
            
            # Get user count for this role (both regular users and admin users)
            assigned_users_count = 0
            try:
                assigned_users_count = db.session.query(UserRoleAssignment).filter(
                    UserRoleAssignment.role_id == r.id,
                    UserRoleAssignment.is_active == True
                ).count()
            except Exception as e:
                logger.warning(f"Could not load user count for role {r.id}: {e}")
                assigned_users_count = 0
            
            return {
                'id': r.id,
                'name': r.name,
                'display_name': r.display_name or r.name.title(),
                'description': r.description,
                'is_active': r.is_active,
                'is_system_role': r.is_system_role,
                'priority': r.priority,
                'permissions': permissions,
                'assigned_users_count': assigned_users_count,
            }

        return jsonify({'success': True, 'roles': [serialize_role(r) for r in roles]}), 200
    except Exception as e:
        logger.error(f"Error listing roles: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve roles'}), 500

@admin_bp.route('/roles', methods=['POST'])
@jwt_required()
@require_permission('rbac_management.roles.create')
def create_role():
    """Create a new role"""
    try:
        data = request.get_json()
        name = data.get('name')
        display_name = data.get('display_name')
        description = data.get('description', '')
        priority = data.get('priority', 0)
        
        if not name:
            return jsonify({'success': False, 'error': 'Role name is required'}), 400
        
        # Check if role already exists
        existing_role = AdminRole.query.filter_by(name=name).first()
        if existing_role:
            return jsonify({'success': False, 'error': 'Role with this name already exists'}), 400
        
        # Create new role
        new_role = AdminRole(
            name=name,
            display_name=display_name or name.title(),
            description=description,
            priority=priority,
            is_system_role=False,
            is_active=True
        )
        
        db.session.add(new_role)
        db.session.commit()
        
        # Serialize the new role
        def serialize_role(r):
            return {
                'id': r.id,
                'name': r.name,
                'display_name': r.display_name or r.name.title(),
                'description': r.description,
                'is_active': r.is_active,
                'is_system_role': r.is_system_role,
                'priority': r.priority,
                'permissions': [],
                'assigned_users_count': 0,
            }
        
        return jsonify({'success': True, 'role': serialize_role(new_role)}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating role: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to create role'}), 500

@admin_bp.route('/roles/<int:role_id>', methods=['PUT'])
@jwt_required()
@require_permission('rbac_management.roles.edit')
def update_role(role_id):
    """Update an existing role"""
    try:
        data = request.get_json()
        role = AdminRole.query.get(role_id)
        
        if not role:
            return jsonify({'success': False, 'error': 'Role not found'}), 404
        
        # Don't allow editing system roles
        if role.is_system_role:
            return jsonify({'success': False, 'error': 'Cannot edit system roles'}), 400
        
        # Update fields
        if 'display_name' in data:
            role.display_name = data['display_name']
        if 'description' in data:
            role.description = data['description']
        if 'priority' in data:
            role.priority = data['priority']
        if 'is_active' in data:
            role.is_active = data['is_active']
        
        db.session.commit()
        
        # Serialize the updated role
        def serialize_role(r):
            permissions = []
            try:
                if hasattr(r, 'permissions') and r.permissions:
                    permissions = [p.name for p in r.permissions if p.name]
            except Exception as e:
                logger.warning(f"Could not load permissions for role {r.id}: {e}")
            
            assigned_users_count = 0
            try:
                assigned_users_count = db.session.query(UserRoleAssignment).filter(
                    UserRoleAssignment.role_id == r.id,
                    UserRoleAssignment.is_active == True
                ).count()
            except Exception as e:
                logger.warning(f"Could not load user count for role {r.id}: {e}")
            
            return {
                'id': r.id,
                'name': r.name,
                'display_name': r.display_name or r.name.title(),
                'description': r.description,
                'is_active': r.is_active,
                'is_system_role': r.is_system_role,
                'priority': r.priority,
                'permissions': permissions,
                'assigned_users_count': assigned_users_count,
            }
        
        return jsonify({'success': True, 'role': serialize_role(role)}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating role: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update role'}), 500

@admin_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
@require_permission('rbac_management.roles.delete')
def delete_role(role_id):
    """Delete a role"""
    try:
        role = AdminRole.query.get(role_id)
        
        if not role:
            return jsonify({'success': False, 'error': 'Role not found'}), 404
        
        # Don't allow deleting system roles
        if role.is_system_role:
            return jsonify({'success': False, 'error': 'Cannot delete system roles'}), 400
        
        # Check if role has assigned users
        assigned_users = db.session.query(UserRoleAssignment).filter(
            UserRoleAssignment.role_id == role_id,
            UserRoleAssignment.is_active == True
        ).count()
        
        if assigned_users > 0:
            return jsonify({'success': False, 'error': f'Cannot delete role with {assigned_users} assigned users'}), 400
        
        db.session.delete(role)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Role deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting role: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete role'}), 500

@admin_bp.route('/roles/<int:role_id>/permissions', methods=['POST'])
@jwt_required()
@require_permission('rbac_management.roles.edit')
def assign_permissions_to_role(role_id):
    """Assign permissions to a role"""
    try:
        data = request.get_json()
        permission_ids = data.get('permission_ids', [])
        
        role = AdminRole.query.get(role_id)
        if not role:
            return jsonify({'success': False, 'error': 'Role not found'}), 404
        
        # Get permissions
        permissions = Permission.query.filter(Permission.id.in_(permission_ids)).all()
        
        # Clear existing permissions and assign new ones
        role.permissions = permissions
        
        db.session.commit()
        
        # Serialize the updated role
        def serialize_role(r):
            permissions = []
            try:
                if hasattr(r, 'permissions') and r.permissions:
                    permissions = [p.name for p in r.permissions if p.name]
            except Exception as e:
                logger.warning(f"Could not load permissions for role {r.id}: {e}")
            
            assigned_users_count = 0
            try:
                assigned_users_count = db.session.query(UserRoleAssignment).filter(
                    UserRoleAssignment.role_id == r.id,
                    UserRoleAssignment.is_active == True
                ).count()
            except Exception as e:
                logger.warning(f"Could not load user count for role {r.id}: {e}")
            
            return {
                'id': r.id,
                'name': r.name,
                'display_name': r.display_name or r.name.title(),
                'description': r.description,
                'is_active': r.is_active,
                'is_system_role': r.is_system_role,
                'priority': r.priority,
                'permissions': permissions,
                'assigned_users_count': assigned_users_count,
            }
        
        return jsonify({'success': True, 'role': serialize_role(role)}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error assigning permissions to role: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to assign permissions'}), 500

# Role Assignments Endpoints
@admin_bp.route('/role-assignments', methods=['GET'])
@jwt_required()
def list_role_assignments():
    """List role assignments with nested user and role info."""
    try:
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

        assignments = (
            db.session.query(UserRoleAssignment)
            .outerjoin(UserRoleAssignment.role)
            .options(
                joinedload(UserRoleAssignment.user),
                joinedload(UserRoleAssignment.admin_user),
                joinedload(UserRoleAssignment.role)
            )
            .order_by(UserRoleAssignment.id.desc())
            .all()
        )

        items = []
        for a in assignments:
            # Filter by active/expired flags
            is_expired = False
            if a.expires_at:
                is_expired = datetime.utcnow() > a.expires_at
            if not include_inactive and not a.is_active:
                continue
            if not include_expired and is_expired:
                continue

            # Skip assignments where the role does not exist
            if not a.role:
                logger.warning(f"Skipping role assignment ID {a.id} due to missing role (role_id: {a.role_id})")
                continue

            # Prefer ORM relationships to avoid extra queries
            user_obj = a.user or a.admin_user

            if isinstance(user_obj, User):
                user_payload = {
                    'id': user_obj.id,
                    'name': user_obj.full_name,
                    'email': user_obj.email,
                    'status': 'active' if user_obj.is_active else 'suspended',
                }
                admin_user_payload = None
            elif isinstance(user_obj, AdminUser):
                display_name = getattr(user_obj, 'full_name', None) or getattr(user_obj, 'username', None) or getattr(user_obj, 'email', None)
                user_payload = None
                admin_user_payload = {
                    'id': user_obj.id,
                    'name': display_name,
                    'email': getattr(user_obj, 'email', None),
                    'status': 'active' if getattr(user_obj, 'is_active', True) else 'suspended',
                }
            else:
                user_payload = None
                admin_user_payload = None

            role = a.role
            role_payload = {
                'id': role.id if role else None,
                'name': role.name if role else None,
                'display_name': (role.display_name or (role.name.title() if role and role.name else None)) if role else None,
                'is_system_role': role.is_system_role if role else False,
            }

            items.append({
                'id': a.id,
                'user': user_payload,
                'admin_user': admin_user_payload,
                'role': role_payload,
                'is_active': a.is_active,
                'is_expired': is_expired,
                'assigned_at': a.assigned_at.isoformat() if getattr(a, 'assigned_at', None) else None,
                'expires_at': a.expires_at.isoformat() if a.expires_at else None,
                'notes': getattr(a, 'notes', None),
            })

        return jsonify({'success': True, 'assignments': items, 'count': len(items)}), 200
    except Exception as e:
        logger.error(f"Error listing role assignments: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve role assignments'}), 500

@admin_bp.route('/role-assignments', methods=['POST'])
@jwt_required()
def create_role_assignment():
    """Create a new role assignment for a user."""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        role_id = int(data.get('role_id')) if data.get('role_id') is not None else None
        expires_at = data.get('expires_at')
        notes = data.get('notes')
        is_active = bool(data.get('is_active', True))

        if not user_id or not role_id:
            return jsonify({'success': False, 'error': 'user_id and role_id are required'}), 400

        admin_user_id = get_jwt_identity()

        # Determine if this is a regular user or admin user
        from ..models.user import User
        regular_user = User.query.get(user_id)
        admin_user = AdminUser.query.get(user_id)
        
        if admin_user:
            # This is an admin user
            assignment = UserRoleAssignment(
                admin_user_id=user_id,
                role_id=role_id,
                assigned_by=admin_user_id,
                is_active=is_active,
            )
        elif regular_user:
            # This is a regular user
            assignment = UserRoleAssignment(
                user_id=user_id,
                role_id=role_id,
                assigned_by=admin_user_id,
                is_active=is_active,
            )
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if expires_at:
            try:
                assignment.expires_at = datetime.strptime(expires_at, '%Y-%m-%d')
            except Exception:
                pass
        if hasattr(assignment, 'notes'):
            assignment.notes = notes

        db.session.add(assignment)
        db.session.commit()
        return jsonify({'success': True, 'id': assignment.id}), 201
    except Exception as e:
        logger.error(f"Error creating role assignment: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create role assignment'}), 500

@admin_bp.route('/role-assignments/<int:assignment_id>', methods=['PUT'])
@jwt_required()
@require_permission('rbac_management.assignments.edit')
def update_role_assignment(assignment_id: int):
    """Update an existing role assignment"""
    try:
        data = request.get_json() or {}
        assignment = db.session.query(UserRoleAssignment).get(assignment_id)
        if not assignment:
            return jsonify({'success': False, 'error': 'Assignment not found'}), 404

        if 'user_id' in data:
            assignment.user_id = data['user_id']
        if 'role_id' in data:
            assignment.role_id = int(data['role_id'])
        if 'is_active' in data:
            assignment.is_active = bool(data['is_active'])
        if 'expires_at' in data:
            expires_at = data.get('expires_at')
            if expires_at:
                try:
                    assignment.expires_at = datetime.strptime(expires_at, '%Y-%m-%d')
                except Exception:
                    assignment.expires_at = None
            else:
                assignment.expires_at = None
        if 'notes' in data and hasattr(assignment, 'notes'):
            assignment.notes = data['notes']

        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error updating role assignment {assignment_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update role assignment'}), 500

@admin_bp.route('/role-assignments/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
@require_permission('rbac_management.assignments.delete')
def delete_role_assignment(assignment_id: int):
    """Revoke (delete) a role assignment"""
    try:
        assignment = db.session.query(UserRoleAssignment).get(assignment_id)
        if not assignment:
            return jsonify({'success': False, 'error': 'Assignment not found'}), 404
        db.session.delete(assignment)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error deleting role assignment {assignment_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to revoke assignment'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id: int):
    """Get a single user's details"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user exists
        u = db.session.query(User).get(user_id)
        if not u:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Basic authorization: users can view their own data or if they have admin privileges
        current_user = db.session.query(User).get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'error': 'Current user not found'}), 404
        
        # Allow if viewing own data or if current user is admin
        if current_user_id != user_id and not (current_user.is_admin or current_user.is_super_admin):
            # Check if user has any admin role
            admin_roles = ['super_admin', 'admin', 'system_administrator', 'user_manager']
            has_admin_role = any(
                ua.role.name in admin_roles 
                for ua in current_user.rbac_role_assignments 
                if ua.is_active and ua.role and ua.role.is_active
            )
            
            if not has_admin_role:
                return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
        
        d = u.to_dict()
        d['name'] = u.full_name
        d['full_name'] = u.full_name
        d['status'] = 'active' if u.is_active else 'suspended'
        d['last_login_at'] = u.last_login.isoformat() if u.last_login else None
        d['roles'] = [ua.role.name for ua in u.rbac_role_assignments if ua.is_active and ua.role and ua.role.is_active]
        return jsonify(d), 200
    except Exception as e:
        logger.error(f"Error getting user detail {user_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PATCH', 'PUT'])
@jwt_required()
@require_permission('user_management.users.edit')
def update_user(user_id: int):
    """Update a user. Supports partial updates for common fields and role assignments."""
    try:
        u = db.session.query(User).get(user_id)
        if not u:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        data = request.get_json() or {}
        
        # Handle role assignments if provided
        if 'role_ids' in data:
            role_ids = data.get('role_ids', [])
            current_admin_id = get_jwt_identity()
            
            logger.info(f"Processing role assignments for user {user_id}: {role_ids}")
            logger.info(f"Current admin ID: {current_admin_id}")
            
            # Clear existing role assignments for this user
            existing_assignments = db.session.query(UserRoleAssignment).filter(
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.is_active == True
            ).all()
            
            logger.info(f"Found {len(existing_assignments)} existing role assignments to deactivate")
            
            for assignment in existing_assignments:
                assignment.is_active = False
                logger.info(f"Deactivated role assignment: {assignment.role.name if assignment.role else 'Unknown'}")
            
            # Add new role assignments
            for role_id in role_ids:
                role = db.session.query(AdminRole).get(role_id)
                if role and role.is_active:
                    logger.info(f"Processing role assignment for role: {role.name} (ID: {role_id})")
                    
                    # Check if assignment already exists (inactive)
                    existing = db.session.query(UserRoleAssignment).filter(
                        UserRoleAssignment.user_id == user_id,
                        UserRoleAssignment.role_id == role_id
                    ).first()
                    
                    if existing:
                        # Reactivate existing assignment
                        existing.is_active = True
                        logger.info(f"Reactivated existing role assignment for role: {role.name}")
                    else:
                        # Create new assignment
                        assignment = UserRoleAssignment(
                            user_id=user_id,
                            role_id=role_id,
                            assigned_by=current_admin_id,
                            is_active=True
                        )
                        db.session.add(assignment)
                        logger.info(f"Created new role assignment for role: {role.name}")
                else:
                    logger.warning(f"Role with ID {role_id} not found or inactive")
        
        # Allowed fields for basic user updates
        updatable = {
            'first_name', 'last_name', 'email', 'username',
            'is_active', 'is_verified', 'is_admin', 'subscription_status',
            'phone', 'country', 'admin_notes'
        }
        for key, value in data.items():
            if key in updatable:
                setattr(u, key, value)

        u.updated_at = datetime.utcnow()
        
        logger.info(f"Committing changes for user {user_id}")
        db.session.commit()
        logger.info(f"Successfully committed changes for user {user_id}")

        d = u.to_dict()
        d['name'] = u.full_name
        d['full_name'] = u.full_name
        d['status'] = 'active' if u.is_active else 'suspended'
        d['last_login_at'] = u.last_login.isoformat() if u.last_login else None
        d['roles'] = [ua.role.name for ua in u.rbac_role_assignments if ua.is_active and ua.role and ua.role.is_active]
        return jsonify(d), 200
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update user'}), 500

@admin_bp.route('/users/<int:user_id>/contact', methods=['POST'])
@jwt_required()
@require_permission('user_management.users.view')
def contact_user(user_id: int):
    """Contact a user via email, notification, or create support ticket"""
    try:
        user = db.session.query(User).get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        data = request.get_json() or {}
        method = data.get('method', 'email')
        subject = data.get('subject', '')
        message = data.get('message', '')

        if not subject or not message:
            return jsonify({'success': False, 'error': 'Subject and message are required'}), 400

        # Get admin user info
        admin_user_id = get_jwt_identity()
        admin_user = db.session.query(AdminUser).get(admin_user_id)

        if method == 'email':
            # Send email to user
            # This would integrate with your email service
            logger.info(f"Email sent to {user.email} from {admin_user.email}: {subject}")
            
        elif method == 'notification':
            # Send in-app notification
            # This would integrate with your notification system
            logger.info(f"In-app notification sent to user {user.id}: {subject}")
            
        elif method == 'ticket':
            # Create support ticket
            from ..models.support import SupportTicket, TicketStatus, TicketPriority
            
            ticket = SupportTicket(
                ticket_number=f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                subject=subject,
                description=message,
                status=TicketStatus.OPEN,
                priority=TicketPriority.MEDIUM,
                user_id=user.id,
                user_email=user.email,
                user_name=user.full_name or user.username,
                assigned_to=admin_user_id
            )
            
            db.session.add(ticket)
            db.session.commit()
            
            logger.info(f"Support ticket created for user {user.id}: {ticket.ticket_number}")

        return jsonify({
            'success': True,
            'message': f'Message sent successfully via {method}'
        }), 200

    except Exception as e:
        logger.error(f"Error contacting user {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to contact user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_permission('user_management.users.delete')
def delete_user(user_id: int):
    """Delete a user"""
    try:
        u = db.session.query(User).get(user_id)
        if not u:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        db.session.delete(u)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to delete user'}), 500

# Bulk Operations
@admin_bp.route('/permissions/bulk', methods=['POST'])
@jwt_required()
def bulk_permission_operations():
    """Perform bulk operations on permissions"""
    try:
        data = request.get_json()
        operation = data.get('operation')
        permission_ids = data.get('permission_ids', [])
        role_id = data.get('role_id')
        
        # Log the bulk operation
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action=f'bulk_permission_{operation}',
            resource_type='permissions',
            details={
                'operation': operation,
                'permission_ids': permission_ids,
                'role_id': role_id
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'Bulk {operation} completed successfully',
            'affected_count': len(permission_ids)
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing bulk permission operation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to perform bulk operation'
        }), 500

@admin_bp.route('/role-assignments/bulk', methods=['POST'])
@jwt_required()
def bulk_role_assignment_operations():
    """Perform bulk operations on role assignments"""
    try:
        data = request.get_json()
        operation = data.get('operation')
        assignment_ids = data.get('assignment_ids', [])
        role_id = data.get('role_id')
        
        # Log the bulk operation
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action=f'bulk_assignment_{operation}',
            resource_type='role_assignments',
            details={
                'operation': operation,
                'assignment_ids': assignment_ids,
                'role_id': role_id
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'Bulk {operation} completed successfully',
            'affected_count': len(assignment_ids)
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing bulk role assignment operation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to perform bulk operation'
        }), 500

# Activity Search
@admin_bp.route('/activity/search', methods=['GET'])
@jwt_required()
def search_activity():
    """Search activity logs"""
    try:
        per_page = request.args.get('per_page', 10, type=int)
        
        # Mock activity data
        activities = generate_mock_recent_activity()[:per_page]
        
        # Log audit (commented out to avoid errors)
        # admin_user_id = get_jwt_identity()
        # audit_service.log_data_access(
        #     admin_user_id=admin_user_id,
        #     resource_type='activity_search',
        #     action='read',
        #     ip_address=security_service.get_client_ip(request)
        # )
        
        return jsonify({
            'success': True,
            'activities': activities,
            'count': len(activities)
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching activity: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to search activity'
        }), 500

# Permission Management Endpoints
@admin_bp.route('/permissions', methods=['GET'])
@jwt_required()
def list_permissions():
    """List all permissions with filtering and pagination"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category = request.args.get('category')
        resource = request.args.get('resource')
        action = request.args.get('action')
        search = request.args.get('search')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        include_system = request.args.get('include_system', 'true').lower() == 'true'
        
        # Build query
        query = Permission.query
        
        # Apply filters
        if category:
            query = query.filter(Permission.category == category)
        if resource:
            query = query.filter(Permission.resource == resource)
        if action:
            query = query.filter(Permission.action == action)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Permission.name.ilike(search_term),
                    Permission.description.ilike(search_term),
                    Permission.category.ilike(search_term),
                    Permission.resource.ilike(search_term),
                    Permission.action.ilike(search_term)
                )
            )
        if not include_inactive:
            query = query.filter(Permission.is_active == True)
        if not include_system:
            query = query.filter(Permission.is_system_permission == False)
            
        # Apply pagination
        pagination = query.order_by(Permission.category, Permission.resource, Permission.action).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        permissions_data = []
        for permission in pagination.items:
            # Get roles that have this permission
            roles_with_permission = []
            try:
                roles_with_permission = [
                    {
                        'id': role.id,
                        'name': role.name,
                        'display_name': role.display_name or role.name.title()
                    }
                    for role in permission.roles if role.is_active
                ]
            except Exception as e:
                logger.warning(f"Could not load roles for permission {permission.id}: {e}")
            
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
                'roles_with_permission': roles_with_permission,
                'roles_count': len(roles_with_permission),
                'display_name': f"{permission.action.title()} {permission.resource.replace('_', ' ').title()}"
            }
            permissions_data.append(perm_data)
        
        return jsonify({
            'success': True,
            'permissions': permissions_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing permissions: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve permissions'}), 500

@admin_bp.route('/permissions/categories', methods=['GET'])
@jwt_required()
@require_permission('rbac_management.permissions.view')
def get_permission_categories():
    """Get all permission categories with their resources and actions"""
    try:
        # Get all permissions
        permissions = Permission.query.filter_by(is_active=True).all()
        
        # Group by category
        categories = {}
        for permission in permissions:
            category = permission.category
            if category not in categories:
                categories[category] = {
                    'name': category,
                    'resources': {},
                    'permissions_count': 0
                }
            
            resource = permission.resource
            if resource not in categories[category]['resources']:
                categories[category]['resources'][resource] = {
                    'name': resource,
                    'actions': [],
                    'permissions_count': 0
                }
            
            categories[category]['resources'][resource]['actions'].append({
                'name': permission.action,
                'permission_name': permission.name,
                'description': permission.description
            })
            categories[category]['resources'][resource]['permissions_count'] += 1
            categories[category]['permissions_count'] += 1
        
        # Convert to list format
        categories_list = []
        for category_name, category_data in categories.items():
            resources_list = []
            for resource_name, resource_data in category_data['resources'].items():
                resources_list.append({
                    'name': resource_name,
                    'actions': resource_data['actions'],
                    'permissions_count': resource_data['permissions_count']
                })
            
            categories_list.append({
                'name': category_name,
                'resources': resources_list,
                'permissions_count': category_data['permissions_count']
            })
        
        return jsonify({
            'success': True,
            'categories': categories_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting permission categories: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve permission categories'}), 500

@admin_bp.route('/permissions/assign', methods=['POST'])
@jwt_required()
@require_permission('rbac_management.permissions.assign')
def assign_permission_to_roles():
    """Assign a permission to multiple roles"""
    try:
        data = request.get_json()
        permission_name = data.get('permission_name')
        role_ids = data.get('role_ids', [])
        
        if not permission_name or not role_ids:
            return jsonify({'success': False, 'error': 'permission_name and role_ids are required'}), 400
        
        # Get the permission
        permission = Permission.query.filter_by(name=permission_name, is_active=True).first()
        if not permission:
            return jsonify({'success': False, 'error': 'Permission not found'}), 404
        
        # Get the roles
        roles = AdminRole.query.filter(AdminRole.id.in_(role_ids), AdminRole.is_active == True).all()
        if len(roles) != len(role_ids):
            return jsonify({'success': False, 'error': 'One or more roles not found'}), 404
        
        admin_user_id = get_jwt_identity()
        assigned_count = 0
        
        for role in roles:
            if permission not in role.permissions:
                role.add_permission(permission)
                assigned_count += 1
        
        db.session.commit()
        
        # Log the action
        try:
            from ..services.audit_service import audit_service
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='assign_permission',
                resource_type='permissions',
                details={
                    'permission_name': permission_name,
                    'role_ids': role_ids,
                    'assigned_count': assigned_count
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log permission assignment: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Permission assigned to {assigned_count} roles',
            'assigned_count': assigned_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error assigning permission: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to assign permission'}), 500

@admin_bp.route('/permissions/revoke', methods=['POST'])
@jwt_required()
@require_permission('rbac_management.permissions.revoke')
def revoke_permission_from_roles():
    """Revoke a permission from multiple roles"""
    try:
        data = request.get_json()
        permission_name = data.get('permission_name')
        role_ids = data.get('role_ids', [])
        
        if not permission_name or not role_ids:
            return jsonify({'success': False, 'error': 'permission_name and role_ids are required'}), 400
        
        # Get the permission
        permission = Permission.query.filter_by(name=permission_name, is_active=True).first()
        if not permission:
            return jsonify({'success': False, 'error': 'Permission not found'}), 404
        
        # Get the roles
        roles = AdminRole.query.filter(AdminRole.id.in_(role_ids), AdminRole.is_active == True).all()
        if len(roles) != len(role_ids):
            return jsonify({'success': False, 'error': 'One or more roles not found'}), 404
        
        admin_user_id = get_jwt_identity()
        revoked_count = 0
        
        for role in roles:
            if permission in role.permissions:
                role.remove_permission(permission)
                revoked_count += 1
        
        db.session.commit()
        
        # Log the action
        try:
            from ..services.audit_service import audit_service
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='revoke_permission',
                resource_type='permissions',
                details={
                    'permission_name': permission_name,
                    'role_ids': role_ids,
                    'revoked_count': revoked_count
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log permission revocation: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Permission revoked from {revoked_count} roles',
            'revoked_count': revoked_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error revoking permission: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to revoke permission'}), 500

@admin_bp.route('/permissions/templates', methods=['GET'])
@jwt_required()
@require_permission('rbac_management.permissions.view')
def get_permission_templates():
    """Get predefined permission templates"""
    try:
        templates = [
            {
                'id': 'super_admin',
                'name': 'Super Administrator',
                'description': 'Full system access with all permissions',
                'permissions': [
                    'user_management.*',
                    'rbac_management.*',
                    'system_admin.*',
                    'content_management.*',
                    'analytics.*',
                    'subscription_management.*',
                    'communication.*',
                    'security.*',
                    'promotions.*',
                    'database.*'
                ],
                'roles': ['super_admin']
            },
            {
                'id': 'admin',
                'name': 'Administrator',
                'description': 'General administrative access',
                'permissions': [
                    'user_management.users.*',
                    'user_management.profiles.*',
                    'rbac_management.roles.view',
                    'rbac_management.assignments.*',
                    'system_admin.settings.view',
                    'content_management.*',
                    'analytics.reports.*',
                    'subscription_management.subscriptions.*',
                    'communication.notifications.*',
                    'security.access.*'
                ],
                'roles': ['admin']
            },
            {
                'id': 'user_manager',
                'name': 'User Manager',
                'description': 'Manage users and their profiles',
                'permissions': [
                    'user_management.users.*',
                    'user_management.profiles.*',
                    'user_management.accounts.*',
                    'rbac_management.assignments.view',
                    'analytics.users.*'
                ],
                'roles': ['user_manager']
            },
            {
                'id': 'content_manager',
                'name': 'Content Manager',
                'description': 'Manage content and media',
                'permissions': [
                    'content_management.*',
                    'user_management.users.view',
                    'analytics.content.*',
                    'promotions.*'
                ],
                'roles': ['content_manager']
            },
            {
                'id': 'analyst',
                'name': 'Analyst',
                'description': 'View analytics and reports',
                'permissions': [
                    'analytics.*',
                    'user_management.users.view',
                    'content_management.content.view'
                ],
                'roles': ['analyst']
            },
            {
                'id': 'support_agent',
                'name': 'Support Agent',
                'description': 'Basic support and user management',
                'permissions': [
                    'user_management.users.view',
                    'user_management.profiles.view',
                    'communication.notifications.*',
                    'subscription_management.subscriptions.view'
                ],
                'roles': ['support_agent']
            },
            {
                'id': 'viewer',
                'name': 'Viewer',
                'description': 'Read-only access to basic information',
                'permissions': [
                    'user_management.users.view',
                    'analytics.reports.view',
                    'content_management.content.view'
                ],
                'roles': ['viewer']
            }
        ]
        
        return jsonify({
            'success': True,
            'templates': templates
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting permission templates: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve permission templates'}), 500

@admin_bp.route('/permissions/templates/apply', methods=['POST'])
@jwt_required()
@require_permission('rbac_management.permissions.assign')
def apply_permission_template():
    """Apply a permission template to roles"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        
        if not template_id:
            return jsonify({'success': False, 'error': 'template_id is required'}), 400
        
        # Get the template
        templates = [
            {
                'id': 'super_admin',
                'name': 'Super Administrator',
                'description': 'Full system access with all permissions',
                'permissions': [
                    'user_management.*',
                    'rbac_management.*',
                    'system_admin.*',
                    'content_management.*',
                    'analytics.*',
                    'subscription_management.*',
                    'communication.*',
                    'security.*',
                    'promotions.*',
                    'database.*'
                ],
                'roles': ['super_admin']
            },
            {
                'id': 'admin',
                'name': 'Administrator',
                'description': 'General administrative access',
                'permissions': [
                    'user_management.users.*',
                    'user_management.profiles.*',
                    'rbac_management.roles.view',
                    'rbac_management.assignments.*',
                    'system_admin.settings.view',
                    'content_management.*',
                    'analytics.reports.*',
                    'subscription_management.subscriptions.*',
                    'communication.notifications.*',
                    'security.access.*'
                ],
                'roles': ['admin']
            },
            {
                'id': 'user_manager',
                'name': 'User Manager',
                'description': 'Manage users and their profiles',
                'permissions': [
                    'user_management.users.*',
                    'user_management.profiles.*',
                    'user_management.accounts.*',
                    'rbac_management.assignments.view',
                    'analytics.users.*'
                ],
                'roles': ['user_manager']
            },
            {
                'id': 'content_manager',
                'name': 'Content Manager',
                'description': 'Manage content and media',
                'permissions': [
                    'content_management.*',
                    'user_management.users.view',
                    'analytics.content.*',
                    'promotions.*'
                ],
                'roles': ['content_manager']
            },
            {
                'id': 'analyst',
                'name': 'Analyst',
                'description': 'View analytics and reports',
                'permissions': [
                    'analytics.*',
                    'user_management.users.view',
                    'content_management.content.view'
                ],
                'roles': ['analyst']
            },
            {
                'id': 'support_agent',
                'name': 'Support Agent',
                'description': 'Basic support and user management',
                'permissions': [
                    'user_management.users.view',
                    'user_management.profiles.view',
                    'communication.notifications.*',
                    'subscription_management.subscriptions.view'
                ],
                'roles': ['support_agent']
            },
            {
                'id': 'viewer',
                'name': 'Viewer',
                'description': 'Read-only access to basic information',
                'permissions': [
                    'user_management.users.view',
                    'analytics.reports.view',
                    'content_management.content.view'
                ],
                'roles': ['viewer']
            }
        ]
        
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Get all permissions
        all_permissions = Permission.query.filter_by(is_active=True).all()
        permission_map = {p.name: p for p in all_permissions}
        
        # Get roles to apply template to
        roles = AdminRole.query.filter(AdminRole.name.in_(template['roles']), AdminRole.is_active == True).all()
        
        admin_user_id = get_jwt_identity()
        applied_count = 0
        
        for role in roles:
            # Clear existing permissions
            role.permissions.clear()
            
            # Add template permissions
            for perm_pattern in template['permissions']:
                if perm_pattern.endswith('.*'):
                    # Wildcard pattern - add all permissions in category
                    category = perm_pattern[:-2]  # Remove '.*'
                    category_permissions = [p for p in all_permissions if p.category == category]
                    for perm in category_permissions:
                        role.add_permission(perm)
                else:
                    # Specific permission
                    if perm_pattern in permission_map:
                        role.add_permission(permission_map[perm_pattern])
            
            applied_count += 1
        
        db.session.commit()
        
        # Log the action
        try:
            from ..services.audit_service import audit_service
            audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='apply_permission_template',
                resource_type='permissions',
                details={
                    'template_id': template_id,
                    'template_name': template['name'],
                    'roles_applied': [role.name for role in roles],
                    'permissions_count': len(template['permissions'])
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log template application: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Template applied to {applied_count} roles',
            'template_name': template['name'],
            'roles_applied': [role.name for role in roles],
            'permissions_count': len(template['permissions'])
        }), 200
        
    except Exception as e:
        logger.error(f"Error applying permission template: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to apply permission template'}), 500


# Admin User Management Endpoints
@admin_bp.route('/admin-users', methods=['GET'])
@jwt_required()
@require_permission('admin.users.read')
def get_admin_users():
    """Get all admin users"""
    try:
        admin_users = db.session.query(AdminUser).options(
            joinedload(AdminUser.user_assignments).joinedload(UserRoleAssignment.role)
        ).all()
        
        result = []
        for user in admin_users:
            user_data = user.to_dict()
            # Add roles information
            user_data['roles'] = [
                assignment.role.to_dict() 
                for assignment in user.user_assignments 
                if assignment.is_active and assignment.role.is_active
            ]
            result.append(user_data)
        
        return jsonify({
            'success': True,
            'admin_users': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching admin users: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch admin users'}), 500


@admin_bp.route('/admin-users', methods=['POST'])
@jwt_required()
@require_permission('admin.users.create')
def create_admin_user():
    """Create a new admin user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Check if username or email already exists
        existing_user = db.session.query(AdminUser).filter(
            or_(AdminUser.username == data['username'], AdminUser.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 400
        
        # Create new admin user
        admin_user = AdminUser(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            is_active=data.get('is_active', True),
            is_super_admin=data.get('is_super_admin', False)
        )
        admin_user.set_password(data['password'])
        
        db.session.add(admin_user)
        db.session.flush()  # Get the user ID
        
        # Assign roles if provided
        role_ids = data.get('role_ids', [])
        current_admin_id = get_jwt_identity()
        
        for role_id in role_ids:
            role = db.session.query(AdminRole).get(role_id)
            if role and role.is_active:
                assignment = UserRoleAssignment(
                    admin_user_id=admin_user.id,
                    role_id=role_id,
                    assigned_by=current_admin_id,
                    is_active=True
                )
                db.session.add(assignment)
        
        db.session.commit()
        
        # Return created user with roles
        user_data = admin_user.to_dict()
        user_data['roles'] = [
            assignment.role.to_dict() 
            for assignment in admin_user.user_assignments 
            if assignment.is_active and assignment.role.is_active
        ]
        
        return jsonify({
            'success': True,
            'message': 'Admin user created successfully',
            'admin_user': user_data
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create admin user'}), 500


@admin_bp.route('/admin-users/<int:user_id>', methods=['PUT'])
@jwt_required()
@require_permission('admin.users.update')
def update_admin_user(user_id):
    """Update an admin user"""
    try:
        admin_user = db.session.query(AdminUser).get(user_id)
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 404
        
        data = request.get_json()
        
        # Update basic fields
        if 'username' in data:
            # Check if username is already taken by another user
            existing = db.session.query(AdminUser).filter(
                AdminUser.username == data['username'],
                AdminUser.id != user_id
            ).first()
            if existing:
                return jsonify({'success': False, 'error': 'Username already exists'}), 400
            admin_user.username = data['username']
        
        if 'email' in data:
            # Check if email is already taken by another user
            existing = db.session.query(AdminUser).filter(
                AdminUser.email == data['email'],
                AdminUser.id != user_id
            ).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already exists'}), 400
            admin_user.email = data['email']
        
        if 'first_name' in data:
            admin_user.first_name = data['first_name']
        if 'last_name' in data:
            admin_user.last_name = data['last_name']
        if 'is_active' in data:
            admin_user.is_active = data['is_active']
        if 'is_super_admin' in data:
            admin_user.is_super_admin = data['is_super_admin']
        
        # Update password if provided
        if data.get('password'):
            admin_user.set_password(data['password'])
        
        # Update roles if provided
        if 'role_ids' in data:
            current_admin_id = get_jwt_identity()
            
            # Deactivate existing role assignments
            for assignment in admin_user.user_assignments:
                assignment.is_active = False
            
            # Add new role assignments
            for role_id in data['role_ids']:
                role = db.session.query(AdminRole).get(role_id)
                if role and role.is_active:
                    # Check if assignment already exists
                    existing_assignment = db.session.query(UserRoleAssignment).filter_by(
                        admin_user_id=user_id,
                        role_id=role_id
                    ).first()
                    
                    if existing_assignment:
                        existing_assignment.is_active = True
                        existing_assignment.assigned_by = current_admin_id
                        existing_assignment.assigned_at = datetime.utcnow()
                    else:
                        assignment = UserRoleAssignment(
                            admin_user_id=user_id,
                            role_id=role_id,
                            assigned_by=current_admin_id,
                            is_active=True
                        )
                        db.session.add(assignment)
        
        admin_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Refresh the admin_user to get updated relationships
        db.session.refresh(admin_user)
        
        # Return updated user with roles
        user_data = admin_user.to_dict()
        user_data['roles'] = [
            assignment.role.to_dict() 
            for assignment in admin_user.user_assignments 
            if assignment.is_active and assignment.role.is_active
        ]
        
        return jsonify({
            'success': True,
            'message': 'Admin user updated successfully',
            'admin_user': user_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating admin user: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update admin user'}), 500


@admin_bp.route('/admin-users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_permission('admin.users.delete')
def delete_admin_user(user_id):
    """Delete an admin user"""
    try:
        admin_user = db.session.query(AdminUser).get(user_id)
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 404
        
        # Don't allow deletion of super admins (safety measure)
        if admin_user.is_super_admin:
            return jsonify({'success': False, 'error': 'Cannot delete super admin users'}), 403
        
        # Don't allow self-deletion
        current_admin_id = get_jwt_identity()
        if admin_user.id == current_admin_id:
            return jsonify({'success': False, 'error': 'Cannot delete your own account'}), 403
        
        db.session.delete(admin_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Admin user deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting admin user: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to delete admin user'}), 500


@admin_bp.route('/admin-users/search', methods=['GET'])
@jwt_required()
@require_permission('admin.users.read')
def search_admin_users():
    """Search admin users"""
    try:
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query is required'}), 400
        
        # Search in username, email, first_name, last_name
        admin_users = db.session.query(AdminUser).options(
            joinedload(AdminUser.user_assignments).joinedload(UserRoleAssignment.role)
        ).filter(
            or_(
                AdminUser.username.ilike(f'%{query}%'),
                AdminUser.email.ilike(f'%{query}%'),
                AdminUser.first_name.ilike(f'%{query}%'),
                AdminUser.last_name.ilike(f'%{query}%')
            )
        ).all()
        
        result = []
        for user in admin_users:
            user_data = user.to_dict()
            user_data['roles'] = [
                assignment.role.to_dict() 
                for assignment in user.user_assignments 
                if assignment.is_active and assignment.role.is_active
            ]
            result.append(user_data)
        
        return jsonify({
            'success': True,
            'admin_users': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching admin users: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to search admin users'}), 500


@admin_bp.route('/admin-users/stats', methods=['GET'])
@jwt_required()
@require_permission('admin.users.read')
def get_admin_user_stats():
    """Get admin user statistics"""
    try:
        total_admins = db.session.query(AdminUser).count()
        active_admins = db.session.query(AdminUser).filter_by(is_active=True).count()
        super_admins = db.session.query(AdminUser).filter_by(is_super_admin=True).count()
        inactive_admins = total_admins - active_admins
        
        return jsonify({
            'success': True,
            'stats': {
                'total_admins': total_admins,
                'active_admins': active_admins,
                'inactive_admins': inactive_admins,
                'super_admins': super_admins
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching admin user stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch admin user stats'}), 500

@admin_bp.route('/dashboard/user-growth-trend', methods=['GET'])
@jwt_required()
def get_user_growth_trend():
    """Get user growth trend data for the last 8 months"""
    try:
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        
        # Get data for the last 8 months
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=240)  # 8 months
        
        # Query user registrations by month
        monthly_data = db.session.query(
            extract('year', User.created_at).label('year'),
            extract('month', User.created_at).label('month'),
            func.count(User.id).label('new_users')
        ).filter(
            User.created_at >= start_date,
            ~User.email.like('deleted_%')
        ).group_by(
            extract('year', User.created_at),
            extract('month', User.created_at)
        ).order_by('year', 'month').all()
        
        # Calculate cumulative users and growth rates
        cumulative_users = 0
        growth_data = []
        
        for i, (year, month, new_users) in enumerate(monthly_data):
            cumulative_users += new_users
            
            # Calculate growth rate (percentage increase from previous month)
            if i > 0:
                prev_cumulative = cumulative_users - new_users
                growth_rate = ((new_users / prev_cumulative) * 100) if prev_cumulative > 0 else 0
            else:
                growth_rate = 0
            
            # Format month name
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            month_name = month_names[month - 1]
            
            growth_data.append({
                'month': month_name,
                'users': cumulative_users,
                'growth': round(growth_rate, 1)
            })
        
        return jsonify({
            'success': True,
            'data': growth_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user growth trend: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve user growth trend'
        }), 500

@admin_bp.route('/dashboard/revenue-data', methods=['GET'])
@jwt_required()
def get_revenue_data():
    """Get revenue and subscription data for the last 8 months"""
    try:
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        from ..models.subscription import RevenueSnapshot, SubscriptionMetrics
        
        # Get data for the last 8 months
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=240)  # 8 months
        
        # Query revenue snapshots
        revenue_data = db.session.query(
            extract('year', RevenueSnapshot.snapshot_date).label('year'),
            extract('month', RevenueSnapshot.snapshot_date).label('month'),
            func.sum(RevenueSnapshot.total_revenue).label('revenue'),
            func.sum(RevenueSnapshot.mrr).label('mrr')
        ).filter(
            RevenueSnapshot.snapshot_date >= start_date,
            RevenueSnapshot.period_type == 'monthly'
        ).group_by(
            extract('year', RevenueSnapshot.snapshot_date),
            extract('month', RevenueSnapshot.snapshot_date)
        ).order_by('year', 'month').all()
        
        # Query subscription metrics
        subscription_data = db.session.query(
            extract('year', SubscriptionMetrics.date).label('year'),
            extract('month', SubscriptionMetrics.date).label('month'),
            func.sum(SubscriptionMetrics.active_subscriptions).label('subscriptions')
        ).filter(
            SubscriptionMetrics.date >= start_date
        ).group_by(
            extract('year', SubscriptionMetrics.date),
            extract('month', SubscriptionMetrics.date)
        ).order_by('year', 'month').all()
        
        # Combine and format data
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        revenue_result = []
        for year, month, revenue, mrr in revenue_data:
            month_name = month_names[month - 1]
            revenue_result.append({
                'month': month_name,
                'revenue': float(revenue or 0),
                'subscriptions': 0  # Will be filled from subscription data
            })
        
        # Fill in subscription counts
        for year, month, subscriptions in subscription_data:
            month_name = month_names[month - 1]
            for item in revenue_result:
                if item['month'] == month_name:
                    item['subscriptions'] = int(subscriptions or 0)
                    break
        
        return jsonify({
            'success': True,
            'data': revenue_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting revenue data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve revenue data'
        }), 500

@admin_bp.route('/dashboard/user-distribution', methods=['GET'])
@jwt_required()
def get_dashboard_user_distribution():
    """Get user distribution by status"""
    try:
        from sqlalchemy import func
        
        # Count users by status
        active_users = db.session.query(func.count(User.id)).filter(
            User.is_active.is_(True),
            ~User.email.like('deleted_%')
        ).scalar() or 0
        
        inactive_users = db.session.query(func.count(User.id)).filter(
            User.is_active.is_(False),
            ~User.email.like('deleted_%')
        ).scalar() or 0
        
        # Count admin users
        from ..models.rbac import AdminUser
        active_admin_users = db.session.query(func.count(AdminUser.id)).filter(
            AdminUser.is_active.is_(True)
        ).scalar() or 0
        
        inactive_admin_users = db.session.query(func.count(AdminUser.id)).filter(
            AdminUser.is_active.is_(False)
        ).scalar() or 0
        
        distribution = [
            {
                'name': 'Active Users',
                'value': active_users + active_admin_users,
                'color': '#10b981'
            },
            {
                'name': 'Inactive Users',
                'value': inactive_users + inactive_admin_users,
                'color': '#f59e0b'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': distribution
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user distribution: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve user distribution'
        }), 500

@admin_bp.route('/dashboard/role-distribution', methods=['GET'])
@jwt_required()
def get_role_distribution():
    """Get user distribution by roles"""
    try:
        from sqlalchemy import func
        from ..models.rbac import AdminRole, UserRoleAssignment
        
        # Get role counts
        role_counts = db.session.query(
            AdminRole.name,
            func.count(UserRoleAssignment.id).label('count')
        ).join(
            UserRoleAssignment, AdminRole.id == UserRoleAssignment.role_id
        ).filter(
            UserRoleAssignment.is_active.is_(True)
        ).group_by(AdminRole.name).all()
        
        # Count users without roles
        total_users = db.session.query(func.count(User.id)).filter(
            ~User.email.like('deleted_%')
        ).scalar() or 0
        
        users_with_roles = sum(count for _, count in role_counts)
        users_without_roles = max(total_users - users_with_roles, 0)
        
        distribution = []
        
        # Add users with roles
        colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#10b981']
        for i, (role_name, count) in enumerate(role_counts):
            distribution.append({
                'name': role_name,
                'value': count,
                'color': colors[i % len(colors)]
            })
        
        # Add users without roles
        if users_without_roles > 0:
            distribution.append({
                'name': 'No Role Assigned',
                'value': users_without_roles,
                'color': '#6b7280'
            })
        
        return jsonify({
            'success': True,
            'data': distribution
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting role distribution: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve role distribution'
        }), 500

@admin_bp.route('/dashboard/activity-trend', methods=['GET'])
@jwt_required()
def get_activity_trend():
    """Get comprehensive activity trend data by hour"""
    try:
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        from ..models.activity import UserActivityLog
        
        # Get today's date
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Query comprehensive activity by hour for today
        hourly_activity = db.session.query(
            extract('hour', UserActivityLog.created_at).label('hour'),
            func.count(UserActivityLog.id).label('actions'),
            func.count(func.distinct(UserActivityLog.user_id)).label('unique_users')
        ).filter(
            UserActivityLog.created_at >= today_start,
            UserActivityLog.created_at <= today_end
        ).group_by(
            extract('hour', UserActivityLog.created_at)
        ).order_by('hour').all()
        
        # Query login activities specifically
        hourly_logins = db.session.query(
            extract('hour', UserActivityLog.created_at).label('hour'),
            func.count(UserActivityLog.id).label('logins')
        ).filter(
            UserActivityLog.created_at >= today_start,
            UserActivityLog.created_at <= today_end,
            UserActivityLog.action_type == 'login'
        ).group_by(
            extract('hour', UserActivityLog.created_at)
        ).order_by('hour').all()
        
        # Query failed logins
        hourly_failed_logins = db.session.query(
            extract('hour', UserActivityLog.created_at).label('hour'),
            func.count(UserActivityLog.id).label('failed_logins')
        ).filter(
            UserActivityLog.created_at >= today_start,
            UserActivityLog.created_at <= today_end,
            UserActivityLog.action_type == 'login',
            UserActivityLog.status == 'failed'
        ).group_by(
            extract('hour', UserActivityLog.created_at)
        ).order_by('hour').all()
        
        # Query activity by category
        activity_by_category = db.session.query(
            UserActivityLog.action_category,
            func.count(UserActivityLog.id).label('count')
        ).filter(
            UserActivityLog.created_at >= today_start,
            UserActivityLog.created_at <= today_end
        ).group_by(
            UserActivityLog.action_category
        ).all()
        
        # Query geographic activity
        geographic_activity = db.session.query(
            UserActivityLog.country_code,
            func.count(UserActivityLog.id).label('count')
        ).filter(
            UserActivityLog.created_at >= today_start,
            UserActivityLog.created_at <= today_end,
            UserActivityLog.country_code.isnot(None)
        ).group_by(
            UserActivityLog.country_code
        ).order_by(func.count(UserActivityLog.id).desc()).limit(10).all()
        
        # Create hourly data structure
        activity_data = []
        for hour in range(24):
            hour_str = f"{hour:02d}:00"
            
            # Find matching data
            actions = next((row.actions for row in hourly_activity if row.hour == hour), 0)
            logins = next((row.logins for row in hourly_logins if row.hour == hour), 0)
            failed_logins = next((row.failed_logins for row in hourly_failed_logins if row.hour == hour), 0)
            unique_users = next((row.unique_users for row in hourly_activity if row.hour == hour), 0)
            
            activity_data.append({
                'hour': hour_str,
                'logins': logins,
                'failed_logins': failed_logins,
                'actions': actions,
                'unique_users': unique_users,
                'success_rate': round((logins - failed_logins) / max(logins, 1) * 100, 1)
            })
        
        # Format category data
        category_data = [
            {
                'name': row.action_category or 'Unknown',
                'value': row.count,
                'color': get_category_color(row.action_category)
            }
            for row in activity_by_category
        ]
        
        # Format geographic data
        geographic_data = [
            {
                'name': row.country_code or 'Unknown',
                'value': row.count,
                'color': get_country_color(row.country_code)
            }
            for row in geographic_activity
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'hourly_data': activity_data,
                'category_data': category_data,
                'geographic_data': geographic_data,
                'summary': {
                    'total_actions': sum(row.actions for row in hourly_activity),
                    'total_logins': sum(row.logins for row in hourly_logins),
                    'total_failed_logins': sum(row.failed_logins for row in hourly_failed_logins),
                    'unique_users_today': len(set(row.unique_users for row in hourly_activity if row.unique_users > 0))
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting activity trend: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve activity trend'
        }), 500

def get_category_color(category):
    """Get color for activity category"""
    colors = {
        'authentication': '#ef4444',
        'dashboard': '#3b82f6',
        'profile': '#10b981',
        'journal': '#8b5cf6',
        'settings': '#f59e0b',
        'admin': '#06b6d4'
    }
    return colors.get(category, '#6b7280')

def get_country_color(country_code):
    """Get color for country"""
    colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#a855f7', '#ec4899']
    if country_code:
        return colors[hash(country_code) % len(colors)]
    return '#6b7280'

@admin_bp.route('/dashboard/system-metrics', methods=['GET'])
@jwt_required()
def get_system_metrics():
    """Get enhanced system metrics"""
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        # Get real system metrics
        now = datetime.utcnow()
        today_start = datetime.combine(now.date(), datetime.min.time())
        
        # Active sessions (users who logged in today)
        active_sessions = db.session.query(func.count(func.distinct(UserActivityLog.user_id))).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= today_start
        ).scalar() or 0
        
        # Failed logins (last 24 hours)
        failed_logins = db.session.query(func.count(UserActivityLog.id)).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.status == 'failed',
            UserActivityLog.created_at >= now - timedelta(hours=24)
        ).scalar() or 0
        
        # Database connections (approximate)
        db_connections = db.session.execute("SELECT count(*) FROM pg_stat_activity").scalar() or 0
        
        # Generate realistic system metrics
        import random
        import psutil
        
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory_usage = psutil.virtual_memory().percent
            disk_usage = psutil.disk_usage('/').percent
        except:
            # Fallback to mock data if psutil is not available
            cpu_usage = random.randint(20, 80)
            memory_usage = random.randint(30, 70)
            disk_usage = random.randint(40, 90)
        
        # Calculate security score based on various factors
        security_score = 95  # Base score
        if failed_logins > 10:
            security_score -= 10
        elif failed_logins > 5:
            security_score -= 5
        
        metrics = [
            {
                'name': 'CPU Usage',
                'value': round(cpu_usage),
                'color': '#3b82f6'
            },
            {
                'name': 'Memory Usage',
                'value': round(memory_usage),
                'color': '#10b981'
            },
            {
                'name': 'Disk Usage',
                'value': round(disk_usage),
                'color': '#f59e0b'
            },
            {
                'name': 'Active Sessions',
                'value': active_sessions,
                'color': '#8b5cf6'
            },
            {
                'name': 'Failed Logins',
                'value': failed_logins,
                'color': '#ef4444'
            },
            {
                'name': 'DB Connections',
                'value': db_connections,
                'color': '#06b6d4'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': metrics,
            'security_score': security_score
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting system metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve system metrics'
        }), 500

@admin_bp.route('/dashboard/security-metrics', methods=['GET'])
@jwt_required()
def get_security_metrics():
    """Get security metrics"""
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_week = now - timedelta(days=7)
        
        # Failed logins
        failed_logins_24h = db.session.query(func.count(UserActivityLog.id)).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.status == 'failed',
            UserActivityLog.created_at >= last_24h
        ).scalar() or 0
        
        # Active sessions
        active_sessions = db.session.query(func.count(func.distinct(UserActivityLog.user_id))).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= last_24h
        ).scalar() or 0
        
        # Suspicious activities (multiple failed logins from same IP)
        suspicious_ips = db.session.query(
            UserActivityLog.ip_address,
            func.count(UserActivityLog.id).label('failed_attempts')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.status == 'failed',
            UserActivityLog.created_at >= last_24h,
            UserActivityLog.ip_address.isnot(None)
        ).group_by(UserActivityLog.ip_address).having(
            func.count(UserActivityLog.id) > 5
        ).count()
        
        # Calculate security score
        security_score = 95  # Base score
        if failed_logins_24h > 20:
            security_score -= 15
        elif failed_logins_24h > 10:
            security_score -= 10
        elif failed_logins_24h > 5:
            security_score -= 5
        
        if suspicious_ips > 5:
            security_score -= 10
        elif suspicious_ips > 2:
            security_score -= 5
        
        security_metrics = [
            {
                'name': 'Security Score',
                'value': max(security_score, 0),
                'color': '#10b981'
            },
            {
                'name': 'Failed Logins (24h)',
                'value': failed_logins_24h,
                'color': '#ef4444'
            },
            {
                'name': 'Active Sessions',
                'value': active_sessions,
                'color': '#3b82f6'
            },
            {
                'name': 'Suspicious IPs',
                'value': suspicious_ips,
                'color': '#f59e0b'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': security_metrics
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting security metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve security metrics'
        }), 500

@admin_bp.route('/dashboard/login-analytics', methods=['GET'])
@jwt_required()
def get_login_analytics():
    """Get comprehensive login analytics"""
    try:
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        from ..models.activity import UserActivityLog
        
        # Get date range (last 7 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        # Daily login trends
        daily_logins = db.session.query(
            func.date(UserActivityLog.created_at).label('date'),
            func.count(UserActivityLog.id).label('total_logins'),
            func.count(func.distinct(UserActivityLog.user_id)).label('unique_users'),
            func.count(func.case([(UserActivityLog.status == 'failed', 1)])).label('failed_logins')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= start_date,
            UserActivityLog.created_at <= end_date
        ).group_by(
            func.date(UserActivityLog.created_at)
        ).order_by('date').all()
        
        # Login success rate by hour
        hourly_success_rate = db.session.query(
            extract('hour', UserActivityLog.created_at).label('hour'),
            func.count(UserActivityLog.id).label('total_attempts'),
            func.count(func.case([(UserActivityLog.status == 'success', 1)])).label('successful_logins')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= start_date,
            UserActivityLog.created_at <= end_date
        ).group_by(
            extract('hour', UserActivityLog.created_at)
        ).order_by('hour').all()
        
        # Device analytics (based on user agent)
        device_analytics = db.session.query(
            func.case([
                (UserActivityLog.user_agent.like('%Mobile%'), 'Mobile'),
                (UserActivityLog.user_agent.like('%Tablet%'), 'Tablet'),
                (UserActivityLog.user_agent.like('%Windows%'), 'Windows'),
                (UserActivityLog.user_agent.like('%Mac%'), 'Mac'),
                (UserActivityLog.user_agent.like('%Linux%'), 'Linux'),
                (UserActivityLog.user_agent.like('%Android%'), 'Android'),
                (UserActivityLog.user_agent.like('%iPhone%'), 'iPhone'),
                (UserActivityLog.user_agent.like('%iPad%'), 'iPad')
            ], else_='Other').label('device_type'),
            func.count(UserActivityLog.id).label('count')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= start_date,
            UserActivityLog.created_at <= end_date
        ).group_by('device_type').order_by(func.count(UserActivityLog.id).desc()).all()
        
        # Browser analytics
        browser_analytics = db.session.query(
            func.case([
                (UserActivityLog.user_agent.like('%Chrome%'), 'Chrome'),
                (UserActivityLog.user_agent.like('%Firefox%'), 'Firefox'),
                (UserActivityLog.user_agent.like('%Safari%'), 'Safari'),
                (UserActivityLog.user_agent.like('%Edge%'), 'Edge'),
                (UserActivityLog.user_agent.like('%Opera%'), 'Opera')
            ], else_='Other').label('browser'),
            func.count(UserActivityLog.id).label('count')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.created_at >= start_date,
            UserActivityLog.created_at <= end_date
        ).group_by('browser').order_by(func.count(UserActivityLog.id).desc()).all()
        
        # Failed login patterns
        failed_login_patterns = db.session.query(
            UserActivityLog.ip_address,
            func.count(UserActivityLog.id).label('failed_attempts'),
            func.count(func.distinct(UserActivityLog.user_id)).label('unique_users')
        ).filter(
            UserActivityLog.action_type == 'login',
            UserActivityLog.status == 'failed',
            UserActivityLog.created_at >= start_date,
            UserActivityLog.created_at <= end_date
        ).group_by(
            UserActivityLog.ip_address
        ).having(
            func.count(UserActivityLog.id) > 1
        ).order_by(func.count(UserActivityLog.id).desc()).limit(10).all()
        
        # Format daily data
        daily_data = []
        for row in daily_logins:
            success_rate = round((row.total_logins - row.failed_logins) / max(row.total_logins, 1) * 100, 1)
            daily_data.append({
                'date': row.date.strftime('%Y-%m-%d'),
                'total_logins': row.total_logins,
                'unique_users': row.unique_users,
                'failed_logins': row.failed_logins,
                'success_rate': success_rate
            })
        
        # Format hourly success rate data
        hourly_data = []
        for row in hourly_success_rate:
            success_rate = round(row.successful_logins / max(row.total_attempts, 1) * 100, 1)
            hourly_data.append({
                'hour': f"{row.hour:02d}:00",
                'total_attempts': row.total_attempts,
                'successful_logins': row.successful_logins,
                'success_rate': success_rate
            })
        
        # Format device data
        device_data = [
            {
                'name': row.device_type,
                'value': row.count,
                'color': get_device_color(row.device_type)
            }
            for row in device_analytics
        ]
        
        # Format browser data
        browser_data = [
            {
                'name': row.browser,
                'value': row.count,
                'color': get_browser_color(row.browser)
            }
            for row in browser_analytics
        ]
        
        # Format failed login patterns
        failed_patterns = [
            {
                'ip_address': row.ip_address,
                'failed_attempts': row.failed_attempts,
                'unique_users': row.unique_users,
                'risk_level': 'High' if row.failed_attempts > 10 else 'Medium' if row.failed_attempts > 5 else 'Low'
            }
            for row in failed_login_patterns
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'daily_trends': daily_data,
                'hourly_success_rate': hourly_data,
                'device_analytics': device_data,
                'browser_analytics': browser_data,
                'failed_patterns': failed_patterns,
                'summary': {
                    'total_logins_week': sum(row.total_logins for row in daily_logins),
                    'unique_users_week': len(set(row.unique_users for row in daily_logins if row.unique_users > 0)),
                    'total_failed_logins': sum(row.failed_logins for row in daily_logins),
                    'overall_success_rate': round(
                        (sum(row.total_logins for row in daily_logins) - sum(row.failed_logins for row in daily_logins)) / 
                        max(sum(row.total_logins for row in daily_logins), 1) * 100, 1
                    )
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting login analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve login analytics'
        }), 500

def get_device_color(device_type):
    """Get color for device type"""
    colors = {
        'Mobile': '#3b82f6',
        'Tablet': '#8b5cf6',
        'Windows': '#10b981',
        'Mac': '#f59e0b',
        'Linux': '#ef4444',
        'Android': '#06b6d4',
        'iPhone': '#f97316',
        'iPad': '#84cc16'
    }
    return colors.get(device_type, '#6b7280')

def get_browser_color(browser):
    """Get color for browser"""
    colors = {
        'Chrome': '#4285f4',
        'Firefox': '#ff7139',
        'Safari': '#006cff',
        'Edge': '#0078d4',
        'Opera': '#ff1b2d'
    }
    return colors.get(browser, '#6b7280')

@admin_bp.route('/affiliates/analytics', methods=['GET'])
@jwt_required()
def get_affiliates_analytics():
    """Get affiliates analytics data."""
    try:
        # Get date range from query parameters
        range_param = request.args.get('range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if range_param == '7d':
            start_date = end_date - timedelta(days=7)
        elif range_param == '30d':
            start_date = end_date - timedelta(days=30)
        elif range_param == '90d':
            start_date = end_date - timedelta(days=90)
        elif range_param == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Mock affiliate data for now
        analytics_data = {
            'total_affiliates': 45,
            'active_affiliates': 32,
            'total_commission': 23400,
            'average_commission_rate': 15.5,
            'top_performers': [
                {
                    'name': 'John Smith',
                    'commission': 3200,
                    'referrals': 45,
                    'conversion_rate': 12.5
                },
                {
                    'name': 'Sarah Johnson',
                    'commission': 2800,
                    'referrals': 38,
                    'conversion_rate': 11.2
                },
                {
                    'name': 'Mike Davis',
                    'commission': 2400,
                    'referrals': 32,
                    'conversion_rate': 10.8
                },
                {
                    'name': 'Lisa Wilson',
                    'commission': 2100,
                    'referrals': 28,
                    'conversion_rate': 9.5
                }
            ],
            'monthly_data': [
                {'month': 'Jan', 'commission': 3200, 'referrals': 45},
                {'month': 'Feb', 'commission': 3800, 'referrals': 52},
                {'month': 'Mar', 'commission': 4200, 'referrals': 58},
                {'month': 'Apr', 'commission': 3900, 'referrals': 54},
                {'month': 'May', 'commission': 4800, 'referrals': 67},
                {'month': 'Jun', 'commission': 5200, 'referrals': 72}
            ]
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch affiliates analytics: {str(e)}'}), 500

# Temporary test route without JWT for debugging
@admin_bp.route('/affiliates/test', methods=['GET'])
def test_affiliates():
    """Test endpoint to check affiliate data without authentication."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliates = Affiliate.query.all()
        
        return jsonify({
            'success': True,
            'message': 'Test endpoint working',
            'count': len(affiliates),
            'data': [affiliate.to_dict() for affiliate in affiliates]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Test endpoint error: {str(e)}'
        }), 500

# Affiliate CRUD Endpoints
@admin_bp.route('/affiliates', methods=['GET'])
@jwt_required()
def get_affiliates():
    """Get all affiliates with optional filtering and search."""
    try:
        from ..models.affiliate import Affiliate
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('q', '', type=str)
        status = request.args.get('status', '', type=str)
        
        # Build query
        query = Affiliate.query
        
        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    Affiliate.name.ilike(f'%{search}%'),
                    Affiliate.email.ilike(f'%{search}%'),
                    Affiliate.category.ilike(f'%{search}%')
                )
            )
        
        # Apply status filter
        if status and status != 'all':
            query = query.filter(Affiliate.status == status)
        
        # Apply pagination
        affiliates = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [affiliate.to_dict() for affiliate in affiliates.items],
            'pagination': {
                'page': page,
                'pages': affiliates.pages,
                'per_page': per_page,
                'total': affiliates.total,
                'has_next': affiliates.has_next,
                'has_prev': affiliates.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching affiliates: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch affiliates'
        }), 500

@admin_bp.route('/affiliates', methods=['POST'])
@jwt_required()
def create_affiliate():
    """Create a new affiliate."""
    try:
        from ..models.affiliate import Affiliate
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['name', 'email']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Check if email already exists
        existing_affiliate = Affiliate.query.filter_by(email=data['email']).first()
        if existing_affiliate:
            return jsonify({'success': False, 'error': 'Email already exists'}), 409
        
        # Create new affiliate
        affiliate = Affiliate.create(
            name=data['name'],
            email=data['email'],
            commission_rate=data.get('commissionRate', 20.0),
            website=data.get('website'),
            social_media=data.get('socialMedia'),
            category=data.get('category', 'Other'),
            notes=data.get('notes')
        )
        
        return jsonify({
            'success': True,
            'data': affiliate.to_dict(),
            'message': 'Affiliate created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create affiliate'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>', methods=['GET'])
@jwt_required()
def get_affiliate(affiliate_id):
    """Get a specific affiliate by ID."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        return jsonify({
            'success': True,
            'data': affiliate.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch affiliate'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>', methods=['PUT'])
@jwt_required()
def update_affiliate(affiliate_id):
    """Update an affiliate."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Check if email update conflicts with existing affiliate
        if 'email' in data and data['email'] != affiliate.email:
            existing = Affiliate.query.filter_by(email=data['email']).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already exists'}), 409
        
        # Update fields
        updateable_fields = [
            'name', 'email', 'commission_rate', 'total_earnings', 'referrals', 
            'conversions', 'website', 'social_media', 'category', 'notes'
        ]
        
        update_data = {}
        for field in updateable_fields:
            snake_case_field = field
            camel_case_field = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(field.split('_')))
            
            if camel_case_field in data:
                update_data[snake_case_field] = data[camel_case_field]
            elif field in data:
                update_data[snake_case_field] = data[field]
        
        # Recalculate conversion rate if referrals or conversions changed
        if 'referrals' in update_data or 'conversions' in update_data:
            affiliate.referrals = update_data.get('referrals', affiliate.referrals)
            affiliate.conversions = update_data.get('conversions', affiliate.conversions)
            affiliate.update_conversion_rate()
            affiliate.calculate_performance()
        
        affiliate.update(**update_data)
        
        return jsonify({
            'success': True,
            'data': affiliate.to_dict(),
            'message': 'Affiliate updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update affiliate'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>', methods=['DELETE'])
@jwt_required()
def delete_affiliate(affiliate_id):
    """Delete an affiliate."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        affiliate.delete()
        
        return jsonify({
            'success': True,
            'message': 'Affiliate deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete affiliate'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>/approve', methods=['POST'])
@jwt_required()
def approve_affiliate(affiliate_id):
    """Approve a pending affiliate."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        affiliate.update(status='active')
        
        return jsonify({
            'success': True,
            'data': affiliate.to_dict(),
            'message': 'Affiliate approved successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error approving affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to approve affiliate'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>/suspend', methods=['POST'])
@jwt_required()
def suspend_affiliate(affiliate_id):
    """Suspend an active affiliate."""
    try:
        from ..models.affiliate import Affiliate
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        affiliate.update(status='suspended')
        
        return jsonify({
            'success': True,
            'data': affiliate.to_dict(),
            'message': 'Affiliate suspended successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error suspending affiliate: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to suspend affiliate'
        }), 500

# Affiliate Referral Code Endpoints
@admin_bp.route('/affiliates/<int:affiliate_id>/generate-code', methods=['POST'])
@jwt_required()
def generate_affiliate_code(affiliate_id):
    """Generate a new referral code for an affiliate."""
    try:
        from ..models.affiliate import Affiliate
        from ..models.coupon import Coupon
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        data = request.get_json() or {}
        
        # Extract parameters
        custom_code = data.get('code')
        discount_percent = data.get('discount_percent', 10)
        commission_percent = data.get('commission_percent', affiliate.commission_rate)
        description = data.get('description')
        
        # Check if custom code already exists
        if custom_code:
            existing = Coupon.query.filter_by(code=custom_code).first()
            if existing:
                return jsonify({
                    'success': False, 
                    'error': 'Code already exists'
                }), 409
        
        # Create the referral code
        referral_code = Coupon.create_affiliate_code(
            affiliate_id=affiliate_id,
            code=custom_code,
            discount_percent=discount_percent,
            commission_percent=commission_percent,
            description=description
        )
        
        return jsonify({
            'success': True,
            'data': referral_code.to_dict(),
            'message': 'Referral code generated successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error generating affiliate code: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate referral code'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>/codes', methods=['GET'])
@jwt_required()
def get_affiliate_codes(affiliate_id):
    """Get all referral codes for an affiliate."""
    try:
        from ..models.affiliate import Affiliate
        from ..models.coupon import Coupon
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        
        # Get all referral codes for this affiliate
        codes = Coupon.query.filter_by(
            affiliate_id=affiliate_id,
            is_affiliate_code=True
        ).order_by(Coupon.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [code.to_dict() for code in codes],
            'affiliate': {
                'id': affiliate.id,
                'name': affiliate.name,
                'email': affiliate.email,
                'commission_rate': affiliate.commission_rate
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching affiliate codes: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch referral codes'
        }), 500

@admin_bp.route('/affiliates/<int:affiliate_id>/referrals', methods=['GET'])
@jwt_required()
def get_affiliate_referrals(affiliate_id):
    """Get all referrals for an affiliate."""
    try:
        from ..models.affiliate import Affiliate
        from ..models.user_referral import UserReferral
        from ..models.coupon import Coupon
        from ..models.user import User
        from sqlalchemy import or_
        
        affiliate = Affiliate.query.get_or_404(affiliate_id)
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status', '')  # all, referred, registered, converted
        
        # Build query for user referrals
        query = UserReferral.query.filter_by(affiliate_id=affiliate_id)
        
        # Apply status filter
        if status_filter == 'referred':
            query = query.filter(
                UserReferral.registered_at.is_(None),
                UserReferral.is_converted == False
            )
        elif status_filter == 'registered':
            query = query.filter(
                UserReferral.registered_at.is_not(None),
                UserReferral.is_converted == False
            )
        elif status_filter == 'converted':
            query = query.filter(UserReferral.is_converted == True)
        
        # Apply pagination
        referrals_paginated = query.order_by(UserReferral.referred_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # For backward compatibility, also get users who used affiliate codes directly
        # This is for cases where UserReferral records might not exist yet
        affiliate_codes = Coupon.query.filter_by(
            affiliate_id=affiliate_id,
            is_affiliate_code=True
        ).all()
        
        # Get users from subscriptions that used these codes (if payment system tracks it)
        # This is a fallback for existing data before UserReferral model existed
        legacy_referrals = []
        if affiliate_codes and referrals_paginated.total == 0:
            # This would need to be implemented based on your payment system
            # For now, we'll use mock data to show the structure
            pass
        
        # Calculate summary stats
        total_referrals = UserReferral.query.filter_by(affiliate_id=affiliate_id).count()
        total_registered = UserReferral.query.filter_by(
            affiliate_id=affiliate_id
        ).filter(UserReferral.registered_at.is_not(None)).count()
        total_converted = UserReferral.query.filter_by(
            affiliate_id=affiliate_id,
            is_converted=True
        ).count()
        total_commission = db.session.query(
            db.func.sum(UserReferral.commission_earned)
        ).filter(
            UserReferral.affiliate_id == affiliate_id,
            UserReferral.commission_earned.is_not(None)
        ).scalar() or 0.0
        
        return jsonify({
            'success': True,
            'data': [referral.to_dict() for referral in referrals_paginated.items],
            'pagination': {
                'page': page,
                'pages': referrals_paginated.pages,
                'per_page': per_page,
                'total': referrals_paginated.total,
                'has_next': referrals_paginated.has_next,
                'has_prev': referrals_paginated.has_prev
            },
            'summary': {
                'total_referrals': total_referrals,
                'total_registered': total_registered,
                'total_converted': total_converted,
                'total_commission': float(total_commission),
                'conversion_rate': round((total_converted / total_referrals * 100) if total_referrals > 0 else 0, 1)
            },
            'affiliate': {
                'id': affiliate.id,
                'name': affiliate.name,
                'email': affiliate.email,
                'commission_rate': affiliate.commission_rate
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching affiliate referrals: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch affiliate referrals'
        }), 500

@admin_bp.route('/referral-codes/<int:code_id>', methods=['DELETE'])
@jwt_required()
def delete_referral_code(code_id):
    """Delete/deactivate a referral code."""
    try:
        from ..models.coupon import Coupon
        
        code = Coupon.query.filter_by(
            id=code_id, 
            is_affiliate_code=True
        ).first_or_404()
        
        # Deactivate instead of delete to preserve analytics
        code.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Referral code deactivated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting referral code: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete referral code'
        }), 500

@admin_bp.route('/referral-codes/validate', methods=['POST'])
def validate_referral_code():
    """Validate a referral code (public endpoint for checkout)."""
    try:
        from ..models.coupon import Coupon
        
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        code = data['code'].upper().strip()
        amount = data.get('amount', 0)
        plan_id = data.get('plan_id')
        
        # Find the coupon
        coupon = Coupon.query.filter_by(code=code, is_active=True).first()
        
        if not coupon:
            return jsonify({
                'success': False,
                'error': 'Invalid referral code'
            }), 404
        
        # Validate the coupon
        if not coupon.is_valid(plan_id=plan_id, amount=amount):
            return jsonify({
                'success': False,
                'error': 'Referral code is not valid or has expired'
            }), 400
        
        # Calculate discount
        discounted_amount = coupon.apply_discount(amount) if amount else 0
        discount_amount = amount - discounted_amount if amount else 0
        
        return jsonify({
            'success': True,
            'data': {
                'code': coupon.code,
                'description': coupon.description,
                'discount_percent': coupon.discount_percent,
                'discount_amount': discount_amount,
                'discounted_total': discounted_amount,
                'is_affiliate_code': coupon.is_affiliate_code,
                'affiliate_name': coupon.affiliate.name if coupon.affiliate else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating referral code: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to validate referral code'
        }), 500

@admin_bp.route('/subscriptions/analytics', methods=['GET'])
@jwt_required()
def get_subscriptions_analytics():
    """Get subscriptions analytics data."""
    try:
        # Get date range from query parameters
        range_param = request.args.get('range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if range_param == '7d':
            start_date = end_date - timedelta(days=7)
        elif range_param == '30d':
            start_date = end_date - timedelta(days=30)
        elif range_param == '90d':
            start_date = end_date - timedelta(days=90)
        elif range_param == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get subscription plans
        from ..models.subscription import SubscriptionPlan
        from ..models.user_subscription import UserSubscription
        
        plans = SubscriptionPlan.query.filter_by(is_active=True).all()
        
        # Calculate analytics
        mrr = 124580  # Mock MRR
        arr = mrr * 12
        active_subscriptions = UserSubscription.query.filter_by(status='active').count()
        churn_rate = 2.4  # Mock churn rate
        conversion_rate = 64.1  # Mock conversion rate
        
        # Get plans data
        plans_data = []
        for plan in plans:
            subscribers = UserSubscription.query.filter_by(
                subscription_plan_id=plan.id,
                status='active'
            ).count()
            
            revenue = float(plan.price) * subscribers
            growth = 12.5  # Mock growth rate
            
            plans_data.append({
                'name': plan.name,
                'subscribers': subscribers,
                'revenue': revenue,
                'growth': growth
            })
        
        # Generate monthly data
        monthly_data = [
            {'month': 'Jan', 'mrr': 98000, 'subscriptions': 6500},
            {'month': 'Feb', 'mrr': 105000, 'subscriptions': 6800},
            {'month': 'Mar', 'mrr': 112000, 'subscriptions': 7200},
            {'month': 'Apr', 'mrr': 118000, 'subscriptions': 7600},
            {'month': 'May', 'mrr': 122000, 'subscriptions': 8000},
            {'month': 'Jun', 'mrr': 124580, 'subscriptions': 8234}
        ]
        
        analytics_data = {
            'mrr': mrr,
            'arr': arr,
            'active_subscriptions': active_subscriptions,
            'churn_rate': churn_rate,
            'conversion_rate': conversion_rate,
            'plans': plans_data,
            'monthly_data': monthly_data
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch subscriptions analytics: {str(e)}'}), 500

@admin_bp.route('/marketing/overview', methods=['GET'])
@jwt_required()
def get_marketing_overview():
    """Get marketing overview data."""
    try:
        # Get date range from query parameters
        range_param = request.args.get('range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if range_param == '7d':
            start_date = end_date - timedelta(days=7)
        elif range_param == '30d':
            start_date = end_date - timedelta(days=30)
        elif range_param == '90d':
            start_date = end_date - timedelta(days=90)
        elif range_param == '1y':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Mock overview data
        overview_data = {
            'total_revenue': 193400,
            'total_conversions': 1245,
            'total_campaigns': 12,
            'total_affiliates': 45,
            'roi': 3.2,
            'customer_acquisition_cost': 45.2,
            'lifetime_value': 156.8,
            'monthly_growth': 15.3
        }
        
        return jsonify(overview_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch marketing overview: {str(e)}'}), 500

# Support Ticket Management Endpoints
@admin_bp.route('/support/tickets', methods=['GET'])
@jwt_required()
def list_support_tickets():
    """List all support tickets with filtering and pagination."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        priority = request.args.get('priority')
        category = request.args.get('category')
        search = request.args.get('search')

        # Mock data for demonstration (replace with database queries)
        mock_tickets = [
            {
                'id': 1,
                'title': 'Payment processing issue',
                'description': 'User is unable to complete payment for premium subscription',
                'user': {
                    'name': 'John Doe',
                    'email': 'john.doe@example.com',
                    'username': 'johndoe'
                },
                'status': 'open',
                'priority': 'high',
                'category': 'billing',
                'created_at': '2024-01-15T10:30:00Z',
                'updated_at': '2024-01-15T14:20:00Z',
                'assigned_to': 'Support Team',
                'messages': [
                    {
                        'id': 1,
                        'sender': 'John Doe',
                        'message': 'I\'m trying to upgrade to premium but the payment keeps failing',
                        'timestamp': '2024-01-15T10:30:00Z',
                        'is_customer': True
                    },
                    {
                        'id': 2,
                        'sender': 'Support Agent',
                        'message': 'I can see the issue. Let me help you resolve this payment problem.',
                        'timestamp': '2024-01-15T14:20:00Z',
                        'is_customer': False
                    }
                ]
            },
            {
                'id': 2,
                'title': 'Account access problem',
                'description': 'User cannot log into their account after password reset',
                'user': {
                    'name': 'Jane Smith',
                    'email': 'jane.smith@example.com',
                    'username': 'janesmith'
                },
                'status': 'in_progress',
                'priority': 'medium',
                'category': 'account',
                'created_at': '2024-01-14T09:15:00Z',
                'updated_at': '2024-01-15T11:45:00Z',
                'assigned_to': 'Support Team',
                'messages': [
                    {
                        'id': 1,
                        'sender': 'Jane Smith',
                        'message': 'I reset my password but still can\'t log in',
                        'timestamp': '2024-01-14T09:15:00Z',
                        'is_customer': True
                    }
                ]
            },
            {
                'id': 3,
                'title': 'Feature request',
                'description': 'User requesting new trading journal features',
                'user': {
                    'name': 'Mike Johnson',
                    'email': 'mike.johnson@example.com',
                    'username': 'mikejohnson'
                },
                'status': 'closed',
                'priority': 'low',
                'category': 'feature',
                'created_at': '2024-01-13T16:20:00Z',
                'updated_at': '2024-01-15T08:30:00Z',
                'assigned_to': 'Support Team',
                'messages': [
                    {
                        'id': 1,
                        'sender': 'Mike Johnson',
                        'message': 'Would love to see more chart types in the trading journal',
                        'timestamp': '2024-01-13T16:20:00Z',
                        'is_customer': True
                    },
                    {
                        'id': 2,
                        'sender': 'Support Agent',
                        'message': 'Thank you for the suggestion. We\'ll consider this for future updates.',
                        'timestamp': '2024-01-15T08:30:00Z',
                        'is_customer': False
                    }
                ]
            }
        ]

        # Apply filters
        filtered_tickets = mock_tickets

        if status and status != 'all':
            filtered_tickets = [t for t in filtered_tickets if t['status'] == status]

        if priority and priority != 'all':
            filtered_tickets = [t for t in filtered_tickets if t['priority'] == priority]

        if category and category != 'all':
            filtered_tickets = [t for t in filtered_tickets if t['category'] == category]

        if search:
            search_lower = search.lower()
            filtered_tickets = [t for t in filtered_tickets if 
                search_lower in t['title'].lower() or 
                search_lower in t['description'].lower() or
                search_lower in t['user']['name'].lower() or
                search_lower in t['user']['email'].lower()]

        # Calculate pagination
        total = len(filtered_tickets)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_tickets = filtered_tickets[start_idx:end_idx]

        return jsonify({
            'success': True,
            'tickets': paginated_tickets,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        logger.error(f"Error listing support tickets: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve support tickets'}), 500

@admin_bp.route('/support/tickets', methods=['POST'])
@jwt_required()
def create_support_ticket():
    """Create a new support ticket."""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['title', 'description', 'user']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        # Mock ticket creation (replace with database insertion)
        new_ticket = {
            'id': int(time.time()),  # Simple ID generation
            'title': data['title'],
            'description': data['description'],
            'user': data['user'],
            'status': 'open',
            'priority': data.get('priority', 'medium'),
            'category': data.get('category', 'technical'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'assigned_to': 'Support Team',
            'messages': [
                {
                    'id': 1,
                    'sender': data['user'].get('name', 'Customer'),
                    'message': data['description'],
                    'timestamp': datetime.utcnow().isoformat(),
                    'is_customer': True
                }
            ]
        }

        return jsonify({
            'success': True,
            'ticket': new_ticket,
            'message': 'Support ticket created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to create support ticket'}), 500

@admin_bp.route('/support/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_support_ticket(ticket_id):
    """Update a support ticket."""
    try:
        data = request.get_json() or {}
        
        # Mock ticket update (replace with database update)
        # In a real implementation, you would fetch the ticket from database
        # and update the specific fields
        
        return jsonify({
            'success': True,
            'message': f'Support ticket {ticket_id} updated successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error updating support ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update support ticket'}), 500

@admin_bp.route('/support/tickets/<int:ticket_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_ticket(ticket_id):
    """Add a response to a support ticket."""
    try:
        data = request.get_json() or {}
        
        if 'message' not in data:
            return jsonify({'success': False, 'error': 'Message is required'}), 400

        # Mock response addition (replace with database update)
        # In a real implementation, you would add the message to the ticket's messages array
        
        return jsonify({
            'success': True,
            'message': 'Response added successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error responding to ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to add response'}), 500

@admin_bp.route('/support/tickets/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_support_ticket(ticket_id):
    """Delete a support ticket."""
    try:
        # Mock ticket deletion (replace with database deletion)
        
        return jsonify({
            'success': True,
            'message': f'Support ticket {ticket_id} deleted successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error deleting support ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete support ticket'}), 500


