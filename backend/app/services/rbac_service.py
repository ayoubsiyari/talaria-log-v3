from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from sqlalchemy.orm import joinedload
from sqlalchemy import and_, or_, desc
from .. import db
from ..models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment, RoleAuditLog
from ..models.user import User
from .security_service import security_service
from .audit_service import audit_service
import logging

logger = logging.getLogger(__name__)


class RBACService:
    """Role-Based Access Control service for managing roles and permissions"""
    
    def __init__(self):
        self.permission_cache = {}  # Simple in-memory cache
        self.role_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    def create_role(self, name: str, description: str = None, display_name: str = None, 
                   permissions: List[str] = None, created_by: int = None, 
                   is_system_role: bool = False, priority: int = 0) -> AdminRole:
        """Create a new administrative role"""
        try:
            # Validate input
            if not security_service.validate_input({'name': name}, {'name': 'required|max:100|unique:admin_roles'}):
                raise ValueError("Invalid role name")
            
            # Check if role already exists
            existing_role = AdminRole.query.filter_by(name=name).first()
            if existing_role:
                raise ValueError(f"Role '{name}' already exists")
            
            # Create role
            role = AdminRole(
                name=name,
                description=description,
                display_name=display_name or name,
                is_system_role=is_system_role,
                priority=priority,
                created_by=created_by
            )
            
            db.session.add(role)
            db.session.flush()  # Get the ID
            
            # Add permissions if provided
            if permissions:
                for perm_name in permissions:
                    permission = Permission.query.filter_by(name=perm_name, is_active=True).first()
                    if permission:
                        role.add_permission(permission, created_by)
                    else:
                        logger.warning(f"Permission '{perm_name}' not found for role '{name}'")
            
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=created_by,
                action='create_role',
                target_type='role',
                target_id=role.id,
                details={'name': name, 'description': description, 'permissions': permissions}
            )
            
            # Clear cache
            self._clear_cache()
            
            logger.info(f"Created role '{name}' with {len(permissions or [])} permissions")
            return role
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create role '{name}': {str(e)}")
            raise
    
    def update_role(self, role_id: int, updates: Dict, updated_by: int = None) -> AdminRole:
        """Update an existing role"""
        try:
            role = AdminRole.query.get(role_id)
            if not role:
                raise ValueError(f"Role with ID {role_id} not found")
            
            if role.is_system_role:
                raise ValueError("Cannot modify system roles")
            
            # Store old values for audit
            old_values = {
                'name': role.name,
                'description': role.description,
                'display_name': role.display_name,
                'priority': role.priority,
                'is_active': role.is_active
            }
            
            # Update fields
            if 'name' in updates:
                if not security_service.validate_input({'name': updates['name']}, {'name': 'required|max:100'}):
                    raise ValueError("Invalid role name")
                # Check for name conflicts
                existing = AdminRole.query.filter(AdminRole.name == updates['name'], AdminRole.id != role_id).first()
                if existing:
                    raise ValueError(f"Role name '{updates['name']}' already exists")
                role.name = updates['name']
            
            if 'description' in updates:
                role.description = updates['description']
            
            if 'display_name' in updates:
                role.display_name = updates['display_name']
            
            if 'priority' in updates:
                role.priority = updates['priority']
            
            if 'is_active' in updates:
                role.is_active = updates['is_active']
            
            # Update permissions if provided
            if 'permissions' in updates:
                current_permissions = {p.name for p in role.permissions}
                new_permissions = set(updates['permissions'])
                
                # Remove permissions not in new list
                for perm in role.permissions[:]:
                    if perm.name not in new_permissions:
                        role.remove_permission(perm)
                
                # Add new permissions
                for perm_name in new_permissions - current_permissions:
                    permission = Permission.query.filter_by(name=perm_name, is_active=True).first()
                    if permission:
                        role.add_permission(permission, updated_by)
                    else:
                        logger.warning(f"Permission '{perm_name}' not found")
            
            role.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=updated_by,
                action='update_role',
                target_type='role',
                target_id=role_id,
                details={'old_values': old_values, 'new_values': updates}
            )
            
            # Clear cache
            self._clear_cache()
            
            logger.info(f"Updated role '{role.name}'")
            return role
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update role {role_id}: {str(e)}")
            raise
    
    def delete_role(self, role_id: int, deleted_by: int = None) -> bool:
        """Delete a role (soft delete by setting is_active=False)"""
        try:
            role = AdminRole.query.get(role_id)
            if not role:
                raise ValueError(f"Role with ID {role_id} not found")
            
            if role.is_system_role:
                raise ValueError("Cannot delete system roles")
            
            # Check if role is assigned to any users
            active_assignments = UserRoleAssignment.query.filter_by(role_id=role_id, is_active=True).count()
            if active_assignments > 0:
                raise ValueError(f"Cannot delete role '{role.name}' - it is assigned to {active_assignments} users")
            
            # Soft delete
            role.is_active = False
            role.updated_at = datetime.utcnow()
            
            # Deactivate all assignments
            UserRoleAssignment.query.filter_by(role_id=role_id).update({'is_active': False})
            
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=deleted_by,
                action='delete_role',
                target_type='role',
                target_id=role_id,
                details={'role_name': role.name}
            )
            
            # Clear cache
            self._clear_cache()
            
            logger.info(f"Deleted role '{role.name}'")
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to delete role {role_id}: {str(e)}")
            raise
    
    def get_roles(self, include_inactive: bool = False, include_system: bool = True) -> List[AdminRole]:
        """Get all roles with optional filtering"""
        query = AdminRole.query
        
        if not include_inactive:
            query = query.filter_by(is_active=True)
        
        if not include_system:
            query = query.filter_by(is_system_role=False)
        
        return query.order_by(AdminRole.priority.desc(), AdminRole.name).all()
    
    def get_role(self, role_id: int) -> Optional[AdminRole]:
        """Get a specific role by ID"""
        return AdminRole.query.get(role_id)
    
    def get_role_by_name(self, name: str) -> Optional[AdminRole]:
        """Get a role by name"""
        return AdminRole.query.filter_by(name=name).first()
    
    def assign_role_to_user(self, user_id: int, role_id: int, assigned_by: int, 
                          expires_at: datetime = None, notes: str = None) -> UserRoleAssignment:
        """Assign a role to a user"""
        try:
            # Validate inputs
            user = User.query.get(user_id)
            if not user:
                raise ValueError(f"User with ID {user_id} not found")
            
            role = AdminRole.query.get(role_id)
            if not role or not role.is_active:
                raise ValueError(f"Role with ID {role_id} not found or inactive")
            
            # Check if assignment already exists
            existing = UserRoleAssignment.query.filter_by(
                user_id=user_id, role_id=role_id, is_active=True
            ).first()
            
            if existing:
                raise ValueError(f"User already has role '{role.name}'")
            
            # Create assignment
            assignment = UserRoleAssignment(
                user_id=user_id,
                role_id=role_id,
                assigned_by=assigned_by,
                expires_at=expires_at,
                notes=notes
            )
            
            db.session.add(assignment)
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=assigned_by,
                action='assign_role',
                target_type='assignment',
                target_id=assignment.id,
                details={'role_name': role.name, 'user_id': user_id, 'expires_at': expires_at, 'notes': notes}
            )
            
            logger.info(f"Assigned role '{role.name}' to user {user_id}")
            return assignment
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to assign role {role_id} to user {user_id}: {str(e)}")
            raise
    
    def assign_role_to_admin(self, admin_user_id: int, role_id: int, assigned_by: int,
                           expires_at: datetime = None, notes: str = None) -> UserRoleAssignment:
        """Assign a role to an admin user"""
        try:
            # Validate inputs
            admin_user = AdminUser.query.get(admin_user_id)
            if not admin_user:
                raise ValueError(f"Admin user with ID {admin_user_id} not found")
            
            role = AdminRole.query.get(role_id)
            if not role or not role.is_active:
                raise ValueError(f"Role with ID {role_id} not found or inactive")
            
            # Check if assignment already exists
            existing = UserRoleAssignment.query.filter_by(
                admin_user_id=admin_user_id, role_id=role_id, is_active=True
            ).first()
            
            if existing:
                raise ValueError(f"Admin user already has role '{role.name}'")
            
            # Create assignment
            assignment = UserRoleAssignment(
                admin_user_id=admin_user_id,
                role_id=role_id,
                assigned_by=assigned_by,
                expires_at=expires_at,
                notes=notes
            )
            
            db.session.add(assignment)
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=assigned_by,
                action='assign_role',
                target_type='assignment',
                target_id=assignment.id,
                details={'role_name': role.name, 'target_admin_id': admin_user_id, 'expires_at': expires_at, 'notes': notes}
            )
            
            logger.info(f"Assigned role '{role.name}' to admin user {admin_user_id}")
            return assignment
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to assign role {role_id} to admin user {admin_user_id}: {str(e)}")
            raise
    
    def revoke_role(self, assignment_id: int, revoked_by: int, reason: str = None) -> bool:
        """Revoke a role assignment"""
        try:
            assignment = UserRoleAssignment.query.get(assignment_id)
            if not assignment:
                raise ValueError(f"Role assignment with ID {assignment_id} not found")
            
            if not assignment.is_active:
                raise ValueError("Role assignment is already inactive")
            
            # Store info for audit
            role_name = assignment.role.name
            target_id = assignment.user_id or assignment.admin_user_id
            
            # Deactivate assignment
            assignment.is_active = False
            db.session.commit()
            
            # Log audit
            audit_service.log_admin_action(
                admin_user_id=revoked_by,
                action='revoke_role',
                target_type='role_assignment',
                target_id=str(assignment_id),
                details={'role_name': role_name, 'reason': reason, 'user_id': assignment.user_id, 'admin_user_id': assignment.admin_user_id}
            )
            
            logger.info(f"Revoked role '{role_name}' from user {target_id}")
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to revoke role assignment {assignment_id}: {str(e)}")
            raise
    
    def get_user_roles(self, user_id: int) -> List[UserRoleAssignment]:
        """Get all active role assignments for a user"""
        return UserRoleAssignment.query.filter_by(
            user_id=user_id, is_active=True
        ).options(joinedload('role')).all()
    
    def get_admin_roles(self, admin_user_id: int) -> List[UserRoleAssignment]:
        """Get all active role assignments for an admin user"""
        return UserRoleAssignment.query.filter_by(
            admin_user_id=admin_user_id, is_active=True
        ).options(joinedload('role')).all()
    
    def user_has_permission(self, user_id: int, permission_name: str) -> bool:
        """Check if a user has a specific permission through their roles"""
        cache_key = f"user_perm_{user_id}_{permission_name}"
        
        # Check cache first
        if cache_key in self.permission_cache:
            cache_time, result = self.permission_cache[cache_key]
            if datetime.utcnow() - cache_time < timedelta(seconds=self.cache_ttl):
                return result
        
        # Query database
        assignments = UserRoleAssignment.query.filter_by(
            user_id=user_id, is_active=True
        ).options(joinedload('role').joinedload('permissions')).all()
        
        has_permission = False
        for assignment in assignments:
            if assignment.is_expired:
                continue
            if assignment.role.is_active and assignment.role.has_permission(permission_name):
                has_permission = True
                break
        
        # Cache result
        self.permission_cache[cache_key] = (datetime.utcnow(), has_permission)
        
        return has_permission
    
    def admin_has_permission(self, admin_user_id: int, permission_name: str) -> bool:
        """Check if an admin user has a specific permission"""
        # Check if super admin
        admin_user = AdminUser.query.get(admin_user_id)
        if admin_user and admin_user.is_super_admin:
            return True
        
        cache_key = f"admin_perm_{admin_user_id}_{permission_name}"
        
        # Check cache first
        if cache_key in self.permission_cache:
            cache_time, result = self.permission_cache[cache_key]
            if datetime.utcnow() - cache_time < timedelta(seconds=self.cache_ttl):
                return result
        
        # Query database
        assignments = UserRoleAssignment.query.filter_by(
            admin_user_id=admin_user_id, is_active=True
        ).options(joinedload(UserRoleAssignment.role).joinedload(AdminRole.permissions)).all()
        
        has_permission = False
        for assignment in assignments:
            if assignment.is_expired:
                continue
            if assignment.role.is_active and assignment.role.has_permission(permission_name):
                has_permission = True
                break
        
        # Cache result
        self.permission_cache[cache_key] = (datetime.utcnow(), has_permission)
        
        return has_permission
    
    def get_user_permissions(self, user_id: int) -> Set[str]:
        """Get all permissions for a user"""
        assignments = UserRoleAssignment.query.filter_by(
            user_id=user_id, is_active=True
        ).options(joinedload(UserRoleAssignment.role).joinedload(AdminRole.permissions)).all()
        
        permissions = set()
        for assignment in assignments:
            if assignment.is_expired or not assignment.role.is_active:
                continue
            for perm in assignment.role.permissions:
                if perm.is_active:
                    permissions.add(perm.name)
        
        return permissions
    
    def get_admin_permissions(self, admin_user_id: int) -> Set[str]:
        """Get all permissions for an admin user"""
        # Check if super admin
        admin_user = AdminUser.query.get(admin_user_id)
        if admin_user and admin_user.is_super_admin:
            # Return all permissions for super admin
            return {perm.name for perm in Permission.query.filter_by(is_active=True).all()}
        
        assignments = UserRoleAssignment.query.filter_by(
            admin_user_id=admin_user_id, is_active=True
        ).options(joinedload(UserRoleAssignment.role).joinedload(AdminRole.permissions)).all()
        
        permissions = set()
        for assignment in assignments:
            if assignment.is_expired or not assignment.role.is_active:
                continue
            for perm in assignment.role.permissions:
                if perm.is_active:
                    permissions.add(perm.name)
        
        return permissions
    
    def get_expired_assignments(self) -> List[UserRoleAssignment]:
        """Get all expired role assignments"""
        return UserRoleAssignment.query.filter(
            and_(
                UserRoleAssignment.is_active == True,
                UserRoleAssignment.expires_at < datetime.utcnow()
            )
        ).all()
    
    def cleanup_expired_assignments(self) -> int:
        """Clean up expired role assignments"""
        expired = self.get_expired_assignments()
        count = len(expired)
        
        for assignment in expired:
            assignment.is_active = False
            logger.info(f"Deactivated expired role assignment {assignment.id}")
        
        if count > 0:
            db.session.commit()
            logger.info(f"Cleaned up {count} expired role assignments")
        
        return count
    
    def get_role_statistics(self) -> Dict:
        """Get statistics about roles and assignments"""
        total_roles = AdminRole.query.count()
        active_roles = AdminRole.query.filter_by(is_active=True).count()
        system_roles = AdminRole.query.filter_by(is_system_role=True).count()
        
        total_assignments = UserRoleAssignment.query.count()
        active_assignments = UserRoleAssignment.query.filter_by(is_active=True).count()
        expired_assignments = UserRoleAssignment.query.filter(
            and_(
                UserRoleAssignment.is_active == True,
                UserRoleAssignment.expires_at < datetime.utcnow()
            )
        ).count()
        
        return {
            'roles': {
                'total': total_roles,
                'active': active_roles,
                'system': system_roles,
                'custom': total_roles - system_roles
            },
            'assignments': {
                'total': total_assignments,
                'active': active_assignments,
                'expired': expired_assignments
            }
        }
    
    def _clear_cache(self):
        """Clear permission cache"""
        self.permission_cache.clear()
        self.role_cache.clear()


# Global RBAC service instance
rbac_service = RBACService()

