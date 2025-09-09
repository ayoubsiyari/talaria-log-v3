"""
Admin User Management Routes with RBAC Protection
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.user import User
from ..models.rbac import AdminUser, UserRoleAssignment, AdminRole
from ..models.user_subscription import UserSubscription
from ..models.journal import JournalEntry
from ..middleware.rbac_middleware import require_permission, log_rbac_action
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
admin_users_bp = Blueprint('admin_users', __name__)

from sqlalchemy import union_all, select, literal_column, func, literal, false

@admin_users_bp.route('/debug/', methods=['GET'])
@jwt_required()
@require_permission('user_management.users.view')
def debug_users():
    """Debug endpoint to test user query"""
    try:
        # Simple query to test
        admin_count = db.session.query(AdminUser).count()
        user_count = db.session.query(User).count()
        
        # Test the exact same query as get_users
        from sqlalchemy import select, func, literal_column, union_all, literal
        
        user_query = select(
            User.id,
            User.username,
            User.email,
            literal_column("'regular'").label('account_type')
        ).where(User.id > 0)
        
        admin_query = select(
            AdminUser.id,
            AdminUser.username,
            AdminUser.email,
            literal_column("'admin'").label('account_type')
        ).where(AdminUser.id > 0)
        
        combined_query = union_all(user_query, admin_query).alias('all_users')
        count_query = select(func.count()).select_from(combined_query)
        total_results = db.session.execute(count_query).scalar_one()
        
        return jsonify({
            'admin_count': admin_count,
            'user_count': user_count,
            'combined_query_total': total_results,
            'success': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@admin_users_bp.route('/', methods=['GET'])
@jwt_required()
@require_permission('user_management.users.view')
def get_users():
    """Get all users (regular and admin) with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status_filter = request.args.get('status')
        subscription_filter = request.args.get('subscription_status')

        # Define columns for regular users
        user_query = select(
            User.id,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
            User.phone,
            User.country,
            User.is_active,
            User.is_verified,
            User.subscription_status,
            User.created_at,
            User.updated_at,
            User.last_login,
            literal_column("'regular'").label('account_type')
        ).where(User.id > 0) # Dummy where to allow appending filters

        # Define columns for admin users
        admin_query = select(
            AdminUser.id,
            AdminUser.username,
            AdminUser.email,
            AdminUser.first_name,
            AdminUser.last_name,
            literal_column("NULL").label('phone'),
            literal_column("NULL").label('country'),
            AdminUser.is_active,
            literal(True).label('is_verified'),
            literal_column("'N/A'").label('subscription_status'),
            AdminUser.created_at,
            AdminUser.updated_at,
            AdminUser.last_login,
            literal_column("'admin'").label('account_type')
        ).where(AdminUser.id > 0) # Dummy where

        # Apply search filter
        if search:
            user_query = user_query.where((User.username.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%')))
            admin_query = admin_query.where((AdminUser.username.ilike(f'%{search}%')) | (AdminUser.email.ilike(f'%{search}%')))
            logger.info(f"Applied search filter: {search}")

        # Apply status filter
        if status_filter == 'active':
            user_query = user_query.where(User.is_active == True)
            admin_query = admin_query.where(AdminUser.is_active == True)
            logger.info(f"Applied status filter: {status_filter}")
        elif status_filter == 'inactive':
            user_query = user_query.where(User.is_active == False)
            admin_query = admin_query.where(AdminUser.is_active == False)
            logger.info(f"Applied status filter: {status_filter}")
        else:
            logger.info(f"No status filter applied, status_filter: {status_filter}")

        # Apply subscription filter (only to regular users)
        if subscription_filter and subscription_filter != 'all':
            user_query = user_query.where(User.subscription_status == subscription_filter)
            # No equivalent for admin, so we can make the query return no results
            admin_query = admin_query.where(false())

        # Combine queries using UNION
        combined_query = union_all(user_query, admin_query).alias('all_users')
        
        # Count total results for pagination
        count_query = select(func.count()).select_from(combined_query)
        total_results = db.session.execute(count_query).scalar_one()
        
        # Debug logging
        logger.info(f"Total results from query: {total_results}")

        # Order and paginate
        final_query = select(combined_query.c).order_by(combined_query.c.created_at.desc()).limit(per_page).offset((page - 1) * per_page)
        
        results = db.session.execute(final_query).fetchall()
        logger.info(f"Results from final query: {len(results)}")

        # Get user IDs for role and journal queries
        user_ids = [u.id for u in results if u.account_type == 'regular']
        admin_ids = [u.id for u in results if u.account_type == 'admin']
        logger.info(f"User IDs: {user_ids}, Admin IDs: {admin_ids}")

        roles_map = {}
        if user_ids:
            # Query for regular user roles
            role_assignments = db.session.query(UserRoleAssignment.user_id, AdminRole.name).join(AdminRole).filter(UserRoleAssignment.user_id.in_(user_ids)).all()
            for user_id, role_name in role_assignments:
                roles_map.setdefault(f'regular_{user_id}', []).append(role_name)

        if admin_ids:
            # Query for admin user roles
            admin_role_assignments = db.session.query(UserRoleAssignment.admin_user_id, AdminRole.name).join(AdminRole).filter(UserRoleAssignment.admin_user_id.in_(admin_ids)).all()
            for admin_id, role_name in admin_role_assignments:
                roles_map.setdefault(f'admin_{admin_id}', []).append(role_name)

        # Optimized journal count fetching
        journal_counts = {}
        if user_ids:
            counts = db.session.query(
                JournalEntry.user_id,
                func.count(JournalEntry.id).label('count')
            ).filter(JournalEntry.user_id.in_(user_ids)).group_by(JournalEntry.user_id).all()
            journal_counts = {user_id: count for user_id, count in counts}

        def serialize_user(user_row):
            try:
                user_dict = dict(user_row._mapping)
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                if user_dict.get('updated_at'):
                    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
                if user_dict.get('last_login'):
                    user_dict['last_login'] = user_dict['last_login'].isoformat()
                user_dict['roles'] = roles_map.get(f"{user_dict['account_type']}_{user_dict['id']}", [])
                
                if user_dict['account_type'] == 'regular':
                    user_dict['journal_count'] = journal_counts.get(user_dict['id'], 0)
                else:
                    user_dict['journal_count'] = 0
                    
                return user_dict
            except Exception as e:
                logger.error(f"Error serializing user {user_row.id}: {e}")
                return None

        user_list = []
        logger.info(f"Starting serialization of {len(results)} results")
        for i, u in enumerate(results):
            logger.info(f"Serializing user {i+1}/{len(results)}: {u.username} ({u.email})")
            user_dict = serialize_user(u)
            if user_dict is not None:
                user_list.append(user_dict)
                logger.info(f"Successfully serialized user {i+1}")
            else:
                logger.error(f"Failed to serialize user {i+1}: {u}")
        
        logger.info(f"Successfully serialized {len(user_list)} users out of {len(results)} results")

        # Calculate pagination info
        total_pages = (total_results + per_page - 1) // per_page

        return jsonify({
            'users': user_list,
            'pagination': {
                'page': page,
                'pages': total_pages,
                'per_page': per_page,
                'total': total_results
            }
        }), 200

    except Exception as e:
        logger.error(f"Error getting all users: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to retrieve users', 'details': str(e)}), 500

@admin_users_bp.route('/<int:user_id>/', methods=['GET'])
@require_permission('user_management.users.view')
def get_user(user_id):
    """Get a specific user by ID"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user.to_dict()
        
        # Add detailed role information
        roles = []
        if hasattr(user, 'rbac_role_assignments'):
            for assignment in user.rbac_role_assignments:
                if assignment.is_active and assignment.role:
                    role_data = assignment.role.to_dict()
                    role_data.update({
                        'assignment_id': assignment.id,
                        'assigned_at': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                        'expires_at': assignment.expires_at.isoformat() if assignment.expires_at else None,
                        'notes': assignment.notes
                    })
                    roles.append(role_data)
        user_data['roles'] = roles
        
        # Add subscription history
        subscriptions = []
        for sub in user.subscriptions:
            subscriptions.append({
                'id': sub.id,
                'plan_name': sub.plan_name,
                'status': sub.status,
                'created_at': sub.created_at.isoformat() if sub.created_at else None,
                'expires_at': sub.expires_at.isoformat() if sub.expires_at else None
            })
        user_data['subscriptions'] = subscriptions
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {e}")
        return jsonify({'error': 'Failed to retrieve user'}), 500

@admin_users_bp.route('/', methods=['POST'])
@jwt_required()
@require_permission('user_management.users.create')
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()

        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        if not data or not all(key in data and data[key] for key in required_fields):
            missing_fields = [key for key in required_fields if key not in data or not data[key]]
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.email == data['email']) | (User.username == data['username'])
        ).first()
        
        if existing_user:
            return jsonify({'error': 'User with this email or username already exists'}), 409
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'].lower(),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            country=data.get('country'),
            is_active=data.get('is_active', True),
            is_verified=data.get('is_verified', False),
            subscription_status=data.get('subscription_status', 'free'),
            subscription_plan=data.get('subscription_plan')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log the action (simplified)
        try:
            log_rbac_action('create', 'user', user.id, {
                'username': user.username,
                'email': user.email
            })
        except Exception as log_error:
            logger.warning(f"Failed to log RBAC action: {log_error}")
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@admin_users_bp.route('/<int:user_id>/', methods=['PUT'])
@jwt_required()
@require_permission('user_management.users.edit')
def update_user(user_id):
    """Update a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        old_data = user.to_dict()
        
        # Update allowed fields
        if 'username' in data:
            # Check if username is already taken
            existing = User.query.filter(
                User.username == data['username'],
                User.id != user_id
            ).first()
            if existing:
                return jsonify({'error': 'Username already taken'}), 409
            user.username = data['username']
        
        if 'email' in data:
            # Check if email is already taken
            existing = User.query.filter(
                User.email == data['email'].lower(),
                User.id != user_id
            ).first()
            if existing:
                return jsonify({'error': 'Email already taken'}), 409
            user.email = data['email'].lower()
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'country' in data:
            user.country = data['country']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'is_verified' in data:
            user.is_verified = data['is_verified']
        if 'subscription_status' in data:
            user.subscription_status = data['subscription_status']
        if 'subscription_plan' in data:
            user.subscription_plan = data['subscription_plan']
        
        # Update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        log_rbac_action('update', 'user', user.id, {
            'old': old_data,
            'new': user.to_dict()
        })
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user'}), 500

@admin_users_bp.route('/<int:user_id>/suspend/', methods=['POST'])
@jwt_required()
@require_permission('user_management.users.suspend')
def suspend_user(user_id):
    """Suspend or activate a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        suspend = data.get('suspend', True)
        reason = data.get('reason', '')
        
        old_status = user.is_active
        user.is_active = not suspend
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the action
        log_rbac_action(
            'suspend' if suspend else 'activate', 
            'user', 
            user.id, 
            {
                'old_status': old_status,
                'new_status': user.is_active,
                'reason': reason
            }
        )
        
        action = 'suspended' if suspend else 'activated'
        return jsonify({
            'message': f'User {action} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error suspending user {user_id}: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user status'}), 500

@admin_users_bp.route('/<int:user_id>/', methods=['DELETE'])
@jwt_required()
@require_permission('user_management.users.delete')
def delete_user(user_id):
    """Delete a user (soft delete by deactivating)"""
    try:
        logger.info(f"Attempting to delete user {user_id}")
        
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"User {user_id} not found for deletion")
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has active subscriptions (with better error handling)
        try:
            # Allow deletion for most subscription statuses, only block for truly active ones
            blocked_statuses = ['active', 'premium']
            if user.subscription_status and user.subscription_status.lower() in blocked_statuses:
                logger.warning(f"Cannot delete user {user_id} - has active subscription status: {user.subscription_status}")
                return jsonify({
                    'error': f'Cannot delete user with active subscription ({user.subscription_status}). Cancel subscription first or set status to inactive.'
                }), 400
        except Exception as sub_error:
            logger.error(f"Error checking subscription for user {user_id}: {sub_error}")
            # Continue with deletion even if subscription check fails
        
        user_data = user.to_dict()
        logger.info(f"Deleting user {user_id}: {user.username} ({user.email})")
        
        # Soft delete - deactivate user and clear sensitive data
        user.is_active = False
        user.email = f"deleted_{user.id}_{user.email}"
        user.username = f"deleted_{user.id}_{user.username}"
        user.updated_at = datetime.utcnow()
        
        # Deactivate role assignments - query directly to avoid session issues
        try:
            from app.models.rbac import UserRoleAssignment
            role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id, is_active=True).all()
            for assignment in role_assignments:
                assignment.is_active = False
            logger.info(f"Deactivated {len(role_assignments)} role assignments for user {user_id}")
        except Exception as role_error:
            logger.error(f"Error deactivating role assignments for user {user_id}: {role_error}")
            # Continue with deletion even if role deactivation fails
        
        db.session.commit()
        logger.info(f"Successfully deleted user {user_id}")
        
        # Log the action
        try:
            log_rbac_action('delete', 'user', user.id, user_data)
        except Exception as log_error:
            logger.warning(f"Failed to log RBAC action for user deletion {user_id}: {log_error}")
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        import traceback
        logger.error(f"Delete user traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user', 'details': str(e)}), 500

@admin_users_bp.route('/debug/user/<int:user_id>/', methods=['GET'])
@jwt_required()
@require_permission('user_management.users.view')
def debug_user(user_id):
    """Debug endpoint to check user details and deletion status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check subscription status
        subscription_info = {
            'subscription_status': user.subscription_status,
            'can_delete': True,
            'delete_reason': None
        }
        
        blocked_statuses = ['active', 'premium']
        if user.subscription_status and user.subscription_status.lower() in blocked_statuses:
            subscription_info['can_delete'] = False
            subscription_info['delete_reason'] = f'User has active subscription: {user.subscription_status}'
        
        # Check role assignments
        try:
            from app.models.rbac import UserRoleAssignment
            role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id).all()
            role_info = [{'role_id': ra.role_id, 'is_active': ra.is_active} for ra in role_assignments]
        except Exception as e:
            role_info = f'Error getting roles: {str(e)}'
        
        debug_info = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'is_admin': user.is_admin,
            'subscription_info': subscription_info,
            'role_assignments': role_info,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }
        
        return jsonify(debug_info), 200
        
    except Exception as e:
        logger.error(f"Error debugging user {user_id}: {e}")
        return jsonify({'error': 'Failed to debug user', 'details': str(e)}), 500

@admin_users_bp.route('/stats/', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics for both regular and admin users"""
    try:
        # Regular user stats (excluding soft-deleted users)
        total_regular_users = User.query.filter(
            ~User.email.like('deleted_%')
        ).count()
        active_regular_users = User.query.filter(
            User.is_active.is_(True),
            ~User.email.like('deleted_%')
        ).count()
        verified_users = User.query.filter(
            User.is_verified.is_(True),
            ~User.email.like('deleted_%')
        ).count()

        # Admin user stats
        total_admin_users = AdminUser.query.count()
        active_admin_users = AdminUser.query.filter_by(is_active=True).count()

        # Count regular users with admin role assignments
        from ..models.rbac import UserRoleAssignment, AdminRole
        admin_roles = AdminRole.query.filter(AdminRole.name.in_(['super_admin', 'finance_team'])).all()
        admin_role_ids = [r.id for r in admin_roles]
        admin_assignments = UserRoleAssignment.query.filter(
            UserRoleAssignment.role_id.in_(admin_role_ids),
            UserRoleAssignment.user_id.isnot(None),  # Only regular users (not admin_users)
            UserRoleAssignment.is_active == True
        ).all()
        # Count unique users (not role assignments)
        unique_admin_user_ids = set([assignment.user_id for assignment in admin_assignments])
        regular_users_with_admin_roles = len(unique_admin_user_ids)

        # Stats for User Management (include both regular and admin users for total count)
        total_users = total_regular_users + total_admin_users
        active_users = active_regular_users + active_admin_users

        # Subscription stats (only for regular users, excluding soft-deleted)
        free_users = User.query.filter(
            User.subscription_status == 'free',
            ~User.email.like('deleted_%')
        ).count()
        active_subscribers = User.query.filter(
            User.subscription_status == 'active',
            ~User.email.like('deleted_%')
        ).count()
        expired_subscribers = User.query.filter(
            User.subscription_status == 'expired',
            ~User.email.like('deleted_%')
        ).count()

        # Recent registrations (last 30 days, only for regular users, excluding soft-deleted)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = User.query.filter(
            User.created_at >= thirty_days_ago,
            ~User.email.like('deleted_%')
        ).count()

        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'admin_users': regular_users_with_admin_roles,
                'free_users': free_users,
                'premium_users': active_subscribers,
                'suspended_users': (total_regular_users - active_regular_users) + (total_admin_users - active_admin_users),
                'new_users_this_month': recent_registrations,
                'new_users_this_week': recent_registrations,  # Simplified for now
                'new_users_today': recent_registrations,  # Simplified for now
                'users_with_roles': total_regular_users,  # Only regular users
                'users_without_roles': 0  # Simplified for now
            }
        }), 200

    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        return jsonify({'error': 'Failed to retrieve user statistics'}), 500

# Admin User Management
@admin_users_bp.route('/admin-users/', methods=['GET'])
@require_permission('user_management.users.view')
def get_admin_users():
    """Get all admin users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        admin_users = AdminUser.query.filter_by(is_active=True).order_by(
            AdminUser.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'admin_users': [admin.to_dict() for admin in admin_users.items],
            'pagination': {
                'page': admin_users.page,
                'pages': admin_users.pages,
                'per_page': admin_users.per_page,
                'total': admin_users.total
            }
        }), 200
        
    except Exception as e:
        logger.exception("Error getting all users:")
        return jsonify({'error': 'An unexpected error occurred while fetching users.'}), 500

@admin_users_bp.route('/admin-users/', methods=['POST'])
@require_permission('user_management.users.create')
def create_admin_user():
    """Create a new admin user"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['username', 'email', 'password']):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Check if admin user already exists
        existing_admin = AdminUser.query.filter(
            (AdminUser.email == data['email']) | (AdminUser.username == data['username'])
        ).first()
        
        if existing_admin:
            return jsonify({'error': 'Admin user with this email or username already exists'}), 409
        
        current_admin_id = get_jwt_identity()
        
        # Create new admin user
        admin_user = AdminUser(
            username=data['username'],
            email=data['email'].lower(),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            is_active=data.get('is_active', True),
            is_super_admin=data.get('is_super_admin', False)
        )
        admin_user.set_password(data['password'])
        
        db.session.add(admin_user)
        db.session.commit()
        
        # Log the action
        log_rbac_action('create', 'admin_user', admin_user.id, {
            'username': admin_user.username,
            'email': admin_user.email
        })
        
        return jsonify({
            'message': 'Admin user created successfully',
            'admin_user': admin_user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create admin user'}), 500

@admin_users_bp.route('/bulk-action/', methods=['POST'])
@jwt_required()
@require_permission('user_management.users.edit')
def bulk_action():
    """Perform bulk operations on users"""
    try:
        data = request.get_json()
        action = data.get('action')
        user_ids = data.get('user_ids', [])
        
        if not action or not user_ids:
            return jsonify({'error': 'Action and user_ids are required'}), 400
        
        users = User.query.filter(User.id.in_(user_ids)).all()
        
        if action == 'activate':
            for user in users:
                user.is_active = True
                user.updated_at = datetime.utcnow()
        elif action == 'deactivate':
            for user in users:
                user.is_active = False
                user.updated_at = datetime.utcnow()
        elif action == 'delete':
            for user in users:
                # Soft delete
                user.is_active = False
                user.email = f"deleted_{user.id}_{user.email}"
                user.username = f"deleted_{user.id}_{user.username}"
                user.updated_at = datetime.utcnow()
        elif action == 'activate_stuck_users':
            # Activate stuck users (pending subscription status and inactive)
            for user in users:
                if user.subscription_status == 'pending' and not user.is_active:
                    user.is_active = True
                    user.subscription_status = 'active'
                    user.updated_at = datetime.utcnow()
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        db.session.commit()
        
        # Log the action
        log_rbac_action('bulk_action', 'users', None, {
            'action': action,
            'user_ids': user_ids,
            'affected_count': len(users)
        })
        
        return jsonify({
            'message': f'Bulk action "{action}" completed successfully',
            'affected_count': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing bulk action: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to perform bulk action'}), 500

@admin_users_bp.route('/<int:user_id>/status', methods=['PUT'])
@jwt_required()
@require_permission('user_management.users.edit')
def update_user_status(user_id):
    """Update user subscription status and active status"""
    try:
        data = request.get_json()
        subscription_status = data.get('subscription_status')
        is_active = data.get('is_active')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if subscription_status is not None:
            user.subscription_status = subscription_status
        
        if is_active is not None:
            user.is_active = is_active
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        log_rbac_action('update_status', 'user', user_id, {
            'subscription_status': subscription_status,
            'is_active': is_active
        })
        
        return jsonify({
            'message': 'User status updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'subscription_status': user.subscription_status,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user status: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user status'}), 500
