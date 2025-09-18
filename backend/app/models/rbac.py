from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from werkzeug.security import generate_password_hash, check_password_hash
from .. import db
import json


# Association table for many-to-many relationship between roles and permissions
role_permissions = Table(
    'role_permissions',
    db.metadata,
    Column('role_id', Integer, ForeignKey('admin_roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
    Column('granted_at', DateTime, default=datetime.utcnow),
    Column('granted_by', Integer, ForeignKey('admin_users.id')),
    Column('is_active', Boolean, default=True)
)


class AdminRole(db.Model):
    """Administrative roles for RBAC system"""
    __tablename__ = 'admin_roles'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    display_name = Column(String(150), nullable=True)
    is_system_role = Column(Boolean, default=False)  # System roles cannot be deleted
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher priority roles override lower ones
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('admin_users.id'))
    
    # Relationships
    permissions = relationship('Permission', secondary=role_permissions)
    user_assignments = relationship('UserRoleAssignment', back_populates='role', cascade='all, delete-orphan')
    created_by_admin = relationship('AdminUser', foreign_keys=[created_by], back_populates='created_roles')
    
    def __repr__(self):
        return f'<AdminRole {self.name}>'
    
    @hybrid_property
    def permission_names(self):
        """Get list of permission names for this role"""
        return [perm.name for perm in self.permissions if perm.is_active]
    
    @hybrid_property
    def assigned_users_count(self):
        """Get count of users assigned to this role"""
        try:
            return len([ua for ua in self.user_assignments if ua.is_active])
        except Exception:
            # If there's an issue with the relationship, return 0
            return 0
    
    def has_permission(self, permission_name):
        """Check if role has a specific permission"""
        return any(perm.name == permission_name and perm.is_active for perm in self.permissions)
    
    def add_permission(self, permission, granted_by=None):
        """Add a permission to this role"""
        if permission not in self.permissions:
            # Rely on SQLAlchemy relationship to create the association row.
            # The association table's server-side defaults will populate fields like
            # granted_at and is_active. We intentionally avoid a second manual insert
            # to prevent duplicate primary key errors.
            self.permissions.append(permission)
    
    def remove_permission(self, permission):
        """Remove a permission from this role"""
        if permission in self.permissions:
            # Remove the association row via the relationship. We avoid soft-deleting
            # here to ensure the role no longer exposes the permission via the
            # relationship and permission checks.
            self.permissions.remove(permission)

    def to_dict(self):
        """Convert role to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'is_system_role': self.is_system_role,
            'is_active': self.is_active,
            'priority': self.priority,
            'permissions': self.permission_names,
            'assigned_users_count': self.assigned_users_count
        }


class Permission(db.Model):
    """Permissions for RBAC system"""
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # e.g., 'user_management', 'system_admin'
    resource = Column(String(100), nullable=False)  # e.g., 'users', 'roles', 'system'
    action = Column(String(50), nullable=False)  # e.g., 'read', 'write', 'delete'
    is_system_permission = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    roles = relationship('AdminRole', secondary=role_permissions, back_populates='permissions')
    
    def __repr__(self):
        return f'<Permission {self.name}>'
    
    @hybrid_property
    def full_name(self):
        """Get full permission name in format: category.resource.action"""
        return f"{self.category}.{self.resource}.{self.action}"
    
    @hybrid_property
    def display_name(self):
        """Get human-readable permission name"""
        return f"{self.action.title()} {self.resource.replace('_', ' ').title()}"


class AdminUser(db.Model):
    """Administrator user accounts"""
    __tablename__ = 'admin_users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_assignments = relationship('UserRoleAssignment', foreign_keys='UserRoleAssignment.admin_user_id', back_populates='admin_user', cascade='all, delete-orphan')
    assigned_roles_by_admin = relationship('UserRoleAssignment', foreign_keys='UserRoleAssignment.assigned_by')
    created_roles = relationship('AdminRole', foreign_keys='AdminRole.created_by', back_populates='created_by_admin')
    
    def __repr__(self):
        return f'<AdminUser {self.username}>'
    
    @hybrid_property
    def full_name(self):
        """Get admin user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    @hybrid_property
    def assigned_roles(self):
        """Get list of active roles assigned to this admin"""
        return [ua.role for ua in self.user_assignments if ua.is_active and ua.role.is_active]
    
    @hybrid_property
    def all_permissions(self):
        """Get all permissions from assigned roles"""
        permissions = set()
        for role in self.assigned_roles:
            permissions.update(role.permissions)
        return list(permissions)
    
    def has_permission(self, permission_name):
        """Check if admin user has a specific permission"""
        if self.is_super_admin:
            return True
        return any(perm.name == permission_name for perm in self.all_permissions)
    
    def has_role(self, role_name):
        """Check if admin user has a specific role"""
        return any(role.name == role_name for role in self.assigned_roles)
    
    def is_locked(self):
        """Check if admin account is locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False
    
    def set_password(self, password):
        """Set admin user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check admin user password"""
        # Handle both string and bytes password hashes
        if isinstance(self.password_hash, bytes):
            password_hash = self.password_hash.decode('utf-8')
        else:
            password_hash = self.password_hash
        return check_password_hash(password_hash, password)

    def to_dict(self):
        """Convert admin user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'is_super_admin': self.is_super_admin,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'roles': [role.to_dict() for role in self.assigned_roles]
        }


class UserRoleAssignment(db.Model):
    """Assignment of roles to users (both regular users and admin users)"""
    __tablename__ = 'user_role_assignments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id', ondelete='CASCADE'), nullable=True)
    role_id = Column(Integer, ForeignKey('admin_roles.id', ondelete='CASCADE'), nullable=False)
    assigned_by = Column(Integer, ForeignKey('admin_users.id'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='rbac_role_assignments')
    admin_user = relationship('AdminUser', foreign_keys=[admin_user_id], back_populates='user_assignments')
    role = relationship('AdminRole', back_populates='user_assignments')
    assigned_by_admin = relationship('AdminUser', foreign_keys=[assigned_by])
    
    def __repr__(self):
        return f'<UserRoleAssignment {self.user_id if self.user_id else self.admin_user_id}:{self.role.name}>'
    
    @hybrid_property
    def is_expired(self):
        """Check if role assignment has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
    
    @hybrid_property
    def is_valid(self):
        """Check if role assignment is valid (active and not expired)"""
        return self.is_active and not self.is_expired and self.role.is_active


class RoleAuditLog(db.Model):
    """Audit log for role and permission changes"""
    __tablename__ = 'role_audit_logs'
    
    id = Column(Integer, primary_key=True)
    action = Column(String(50), nullable=False)  # 'create', 'update', 'delete', 'assign', 'revoke'
    resource_type = Column(String(50), nullable=False)  # 'role', 'permission', 'assignment'
    resource_id = Column(Integer, nullable=True)
    admin_user_id = Column(Integer, ForeignKey('admin_users.id'), nullable=False)
    target_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    target_admin_id = Column(Integer, ForeignKey('admin_users.id'), nullable=True)
    changes = Column(db.JSON, nullable=True)  # Store before/after values
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    admin_user = relationship('AdminUser', foreign_keys=[admin_user_id])
    target_user = relationship('User', foreign_keys=[target_user_id])
    target_admin = relationship('AdminUser', foreign_keys=[target_admin_id])
    
    def __repr__(self):
        return f'<RoleAuditLog {self.action}:{self.resource_type}:{self.resource_id}>'
    
    @hybrid_property
    def target_identifier(self):
        """Get target user/admin identifier"""
        if self.target_user_id:
            return f"user:{self.target_user_id}"
        elif self.target_admin_id:
            return f"admin:{self.target_admin_id}"
        return None
