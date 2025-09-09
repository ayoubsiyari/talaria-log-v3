"""
Admin RBAC Routes - Role and Permission Management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment, RoleAuditLog
from ..models.user import User
from ..middleware.rbac_middleware import (
    require_permission, require_role, admin_required, super_admin_required, log_rbac_action
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
admin_rbac_bp = Blueprint('admin_rbac', __name__)

# Role Management Routes
@admin_rbac_bp.route('/roles', methods=['GET'])
@require_permission('roles.view')
def get_roles():
    """Get all roles with their permissions"""
    try:
        roles = AdminRole.query.filter_by(is_active=True).all()
        
        return jsonify({
            'roles': [role.to_dict() for role in roles]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting roles: {e}")
        return jsonify({'error': 'Failed to retrieve roles'}), 500

@admin_rbac_bp.route('/roles', methods=['POST'])
@require_permission('roles.create')
def create_role():
    """Create a new role"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Role name is required'}), 400
        
        # Check if role already exists
        existing_role = AdminRole.query.filter_by(name=data['name']).first()
        if existing_role:
            return jsonify({'error': 'Role with this name already exists'}), 409
        
        current_admin_id = get_jwt_identity()
        
        role = AdminRole(
            name=data['name'],
            display_name=data.get('display_name'),
            description=data.get('description'),
            priority=data.get('priority', 0),
            created_by=int(current_admin_id)
        )
        
        db.session.add(role)
        db.session.commit()
        
        # Log the action
        log_rbac_action('create', 'role', role.id, {
            'name': role.name,
            'display_name': role.display_name
        })
        
        return jsonify({
            'message': 'Role created successfully',
            'role': role.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating role: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create role'}), 500

@admin_rbac_bp.route('/roles/<int:role_id>', methods=['PUT'])
@require_permission('roles.edit')
def update_role(role_id):
    """Update a role"""
    try:
        role = AdminRole.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        if role.is_system_role:
            return jsonify({'error': 'Cannot modify system roles'}), 403
        
        data = request.get_json()
        old_data = role.to_dict()
        
        if 'name' in data:
            role.name = data['name']
        if 'display_name' in data:
            role.display_name = data['display_name']
        if 'description' in data:
            role.description = data['description']
        if 'priority' in data:
            role.priority = data['priority']
        
        role.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        log_rbac_action('update', 'role', role.id, {
            'old': old_data,
            'new': role.to_dict()
        })
        
        return jsonify({
            'message': 'Role updated successfully',
            'role': role.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating role: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update role'}), 500

@admin_rbac_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@require_permission('roles.delete')
def delete_role(role_id):
    """Delete a role"""
    try:
        role = AdminRole.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        if role.is_system_role:
            return jsonify({'error': 'Cannot delete system roles'}), 403
        
        # Check if role is assigned to any users
        active_assignments = UserRoleAssignment.query.filter_by(
            role_id=role_id, 
            is_active=True
        ).count()
        
        if active_assignments > 0:
            return jsonify({
                'error': f'Cannot delete role. It is assigned to {active_assignments} users.'
            }), 400
        
        role_data = role.to_dict()
        role.is_active = False
        db.session.commit()
        
        # Log the action
        log_rbac_action('delete', 'role', role.id, role_data)
        
        return jsonify({'message': 'Role deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting role: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete role'}), 500

# Permission Management Routes
@admin_rbac_bp.route('/permissions', methods=['GET'])
@require_permission('roles.view')
def get_permissions():
    """Get all permissions"""
    try:
        permissions = Permission.query.filter_by(is_active=True).all()
        
        # Group permissions by category
        grouped_permissions = {}
        for perm in permissions:
            if perm.category not in grouped_permissions:
                grouped_permissions[perm.category] = []
            grouped_permissions[perm.category].append({
                'id': perm.id,
                'name': perm.name,
                'description': perm.description,
                'resource': perm.resource,
                'action': perm.action,
                'display_name': perm.display_name
            })
        
        return jsonify({
            'permissions': grouped_permissions,
            'total_count': len(permissions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting permissions: {e}")
        return jsonify({'error': 'Failed to retrieve permissions'}), 500

@admin_rbac_bp.route('/roles/<int:role_id>/permissions', methods=['POST'])
@require_permission('roles.edit')
def assign_permissions_to_role(role_id):
    """Assign permissions to a role"""
    try:
        role = AdminRole.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        data = request.get_json()
        permission_ids = data.get('permission_ids', [])
        
        if not permission_ids:
            return jsonify({'error': 'No permissions specified'}), 400
        
        # Get permissions
        permissions = Permission.query.filter(
            Permission.id.in_(permission_ids),
            Permission.is_active == True
        ).all()
        
        if len(permissions) != len(permission_ids):
            return jsonify({'error': 'Some permissions not found'}), 404
        
        # Clear existing permissions and add new ones
        role.permissions.clear()
        for permission in permissions:
            role.add_permission(permission)
        
        db.session.commit()
        
        # Log the action
        log_rbac_action('assign_permissions', 'role', role.id, {
            'role_name': role.name,
            'permission_ids': permission_ids,
            'permission_names': [p.name for p in permissions]
        })
        
        return jsonify({
            'message': 'Permissions assigned successfully',
            'role': role.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error assigning permissions: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to assign permissions'}), 500

# User Role Assignment Routes
@admin_rbac_bp.route('/users/<int:user_id>/roles', methods=['POST'])
@require_permission('roles.assign')
def assign_role_to_user(user_id):
    """Assign a role to a user"""
    try:
        data = request.get_json()
        role_id = data.get('role_id')
        expires_at = data.get('expires_at')
        notes = data.get('notes')
        
        if not role_id:
            return jsonify({'error': 'Role ID is required'}), 400
        
        # Check if user exists (regular user or admin user)
        user = User.query.get(user_id)
        admin_user = AdminUser.query.get(user_id)
        
        if not user and not admin_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if role exists
        role = AdminRole.query.get(role_id)
        if not role or not role.is_active:
            return jsonify({'error': 'Role not found or inactive'}), 404
        
        current_admin_id = get_jwt_identity()
        
        # Check if assignment already exists
        existing_assignment = UserRoleAssignment.query.filter_by(
            user_id=user_id if user else None,
            admin_user_id=user_id if admin_user else None,
            role_id=role_id,
            is_active=True
        ).first()
        
        if existing_assignment:
            return jsonify({'error': 'User already has this role assigned'}), 409
        
        # Create new assignment
        assignment = UserRoleAssignment(
            user_id=user_id if user else None,
            admin_user_id=user_id if admin_user else None,
            role_id=role_id,
            assigned_by=int(current_admin_id),
            expires_at=datetime.fromisoformat(expires_at) if expires_at else None,
            notes=notes
        )
        
        db.session.add(assignment)
        db.session.commit()
        
        # Log the action
        log_rbac_action('assign_role', 'user_role_assignment', assignment.id, {
            'user_id': user_id,
            'role_name': role.name,
            'expires_at': expires_at,
            'notes': notes
        })
        
        return jsonify({
            'message': 'Role assigned successfully',
            'assignment_id': assignment.id
        }), 201
        
    except Exception as e:
        logger.error(f"Error assigning role to user: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to assign role'}), 500

@admin_rbac_bp.route('/users/<int:user_id>/roles/<int:role_id>', methods=['DELETE'])
@require_permission('roles.assign')
def revoke_role_from_user(user_id, role_id):
    """Revoke a role from a user"""
    try:
        # Find the active assignment
        assignment = UserRoleAssignment.query.filter_by(
            user_id=user_id,
            role_id=role_id,
            is_active=True
        ).first()
        
        if not assignment:
            # Try admin user assignment
            assignment = UserRoleAssignment.query.filter_by(
                admin_user_id=user_id,
                role_id=role_id,
                is_active=True
            ).first()
        
        if not assignment:
            return jsonify({'error': 'Role assignment not found'}), 404
        
        assignment.is_active = False
        db.session.commit()
        
        # Log the action
        log_rbac_action('revoke_role', 'user_role_assignment', assignment.id, {
            'user_id': user_id,
            'role_name': assignment.role.name
        })
        
        return jsonify({'message': 'Role revoked successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error revoking role: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to revoke role'}), 500

@admin_rbac_bp.route('/users/<int:user_id>/roles', methods=['GET'])
@require_permission('users.view')
def get_user_roles(user_id):
    """Get roles assigned to a user"""
    try:
        # Get assignments for both regular users and admin users
        assignments = UserRoleAssignment.query.filter(
            ((UserRoleAssignment.user_id == user_id) | 
             (UserRoleAssignment.admin_user_id == user_id)),
            UserRoleAssignment.is_active == True
        ).all()
        
        roles = []
        for assignment in assignments:
            if assignment.role and assignment.role.is_active:
                role_data = assignment.role.to_dict()
                role_data.update({
                    'assignment_id': assignment.id,
                    'assigned_at': assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                    'expires_at': assignment.expires_at.isoformat() if assignment.expires_at else None,
                    'notes': assignment.notes
                })
                roles.append(role_data)
        
        return jsonify({'roles': roles}), 200
        
    except Exception as e:
        logger.error(f"Error getting user roles: {e}")
        return jsonify({'error': 'Failed to retrieve user roles'}), 500

# Audit Log Routes
@admin_rbac_bp.route('/audit-logs', methods=['GET'])
@require_permission('settings.view')
def get_audit_logs():
    """Get RBAC audit logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action_filter = request.args.get('action')
        resource_type_filter = request.args.get('resource_type')
        
        query = RoleAuditLog.query
        
        if action_filter:
            query = query.filter(RoleAuditLog.action == action_filter)
        if resource_type_filter:
            query = query.filter(RoleAuditLog.resource_type == resource_type_filter)
        
        logs = query.order_by(RoleAuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [{
                'id': log.id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'admin_user': {
                    'id': log.admin_user.id,
                    'username': log.admin_user.username,
                    'email': log.admin_user.email
                } if log.admin_user else None,
                'changes': log.changes,
                'ip_address': log.ip_address,
                'created_at': log.created_at.isoformat() if log.created_at else None
            } for log in logs.items],
            'pagination': {
                'page': logs.page,
                'pages': logs.pages,
                'per_page': logs.per_page,
                'total': logs.total
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}")
        return jsonify({'error': 'Failed to retrieve audit logs'}), 500
