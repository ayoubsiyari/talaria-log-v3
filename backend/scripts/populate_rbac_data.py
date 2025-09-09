#!/usr/bin/env python3
"""
Script to populate the database with initial RBAC data for development/testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment
from app.models.user import User
from app.services.rbac_service import rbac_service
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_permissions():
    """Create initial permissions"""
    permissions_data = [
        # User Management
        {'name': 'user_management.users.view', 'description': 'View user list', 'category': 'user_management', 'resource': 'users', 'action': 'view'},
        {'name': 'user_management.users.create', 'description': 'Create new users', 'category': 'user_management', 'resource': 'users', 'action': 'create'},
        {'name': 'user_management.users.edit', 'description': 'Edit user information', 'category': 'user_management', 'resource': 'users', 'action': 'edit'},
        {'name': 'user_management.users.delete', 'description': 'Delete users', 'category': 'user_management', 'resource': 'users', 'action': 'delete'},
        {'name': 'user_management.users.activate', 'description': 'Activate user accounts', 'category': 'user_management', 'resource': 'users', 'action': 'activate'},
        {'name': 'user_management.users.suspend', 'description': 'Suspend user accounts', 'category': 'user_management', 'resource': 'users', 'action': 'suspend'},
        
        # RBAC Management
        {'name': 'rbac_management.roles.view', 'description': 'View roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'view'},
        {'name': 'rbac_management.roles.create', 'description': 'Create new roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'create'},
        {'name': 'rbac_management.roles.edit', 'description': 'Edit roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'edit'},
        {'name': 'rbac_management.roles.delete', 'description': 'Delete roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'delete'},
        {'name': 'rbac_management.permissions.view', 'description': 'View permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'view'},
        {'name': 'rbac_management.permissions.create', 'description': 'Create permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'create'},
        {'name': 'rbac_management.permissions.edit', 'description': 'Edit permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'edit'},
        {'name': 'rbac_management.permissions.delete', 'description': 'Delete permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'delete'},
        {'name': 'rbac_management.assignments.view', 'description': 'View role assignments', 'category': 'rbac_management', 'resource': 'assignments', 'action': 'view'},
        {'name': 'rbac_management.assignments.create', 'description': 'Create role assignments', 'category': 'rbac_management', 'resource': 'assignments', 'action': 'create'},
        {'name': 'rbac_management.assignments.edit', 'description': 'Edit role assignments', 'category': 'rbac_management', 'resource': 'assignments', 'action': 'edit'},
        {'name': 'rbac_management.assignments.delete', 'description': 'Delete role assignments', 'category': 'rbac_management', 'resource': 'assignments', 'action': 'delete'},
        
        # System Administration
        {'name': 'system_admin.system.view', 'description': 'View system information', 'category': 'system_admin', 'resource': 'system', 'action': 'view'},
        {'name': 'system_admin.settings.view', 'description': 'View system settings', 'category': 'system_admin', 'resource': 'settings', 'action': 'view'},
        {'name': 'system_admin.settings.edit', 'description': 'Edit system settings', 'category': 'system_admin', 'resource': 'settings', 'action': 'edit'},
        {'name': 'system_admin.backup.create', 'description': 'Create system backups', 'category': 'system_admin', 'resource': 'backup', 'action': 'create'},
        {'name': 'system_admin.backup.restore', 'description': 'Restore system backups', 'category': 'system_admin', 'resource': 'backup', 'action': 'restore'},
        {'name': 'system_admin.logs.view', 'description': 'View system logs', 'category': 'system_admin', 'resource': 'logs', 'action': 'view'},
        {'name': 'system_admin.maintenance.perform', 'description': 'Perform system maintenance', 'category': 'system_admin', 'resource': 'maintenance', 'action': 'perform'},
        
        # Content Management
        {'name': 'content_management.content.view', 'description': 'View content', 'category': 'content_management', 'resource': 'content', 'action': 'view'},
        {'name': 'content_management.content.create', 'description': 'Create content', 'category': 'content_management', 'resource': 'content', 'action': 'create'},
        {'name': 'content_management.content.edit', 'description': 'Edit content', 'category': 'content_management', 'resource': 'content', 'action': 'edit'},
        {'name': 'content_management.content.delete', 'description': 'Delete content', 'category': 'content_management', 'resource': 'content', 'action': 'delete'},
        {'name': 'content_management.content.publish', 'description': 'Publish content', 'category': 'content_management', 'resource': 'content', 'action': 'publish'},
        {'name': 'content_management.content.moderate', 'description': 'Moderate content', 'category': 'content_management', 'resource': 'content', 'action': 'moderate'},
        
        # Analytics
        {'name': 'analytics.reports.view', 'description': 'View analytics reports', 'category': 'analytics', 'resource': 'reports', 'action': 'view'},
        {'name': 'analytics.reports.create', 'description': 'Create analytics reports', 'category': 'analytics', 'resource': 'reports', 'action': 'create'},
        {'name': 'analytics.reports.export', 'description': 'Export analytics reports', 'category': 'analytics', 'resource': 'reports', 'action': 'export'},
        {'name': 'analytics.dashboards.view', 'description': 'View analytics dashboards', 'category': 'analytics', 'resource': 'dashboards', 'action': 'view'},
        {'name': 'analytics.dashboards.create', 'description': 'Create analytics dashboards', 'category': 'analytics', 'resource': 'dashboards', 'action': 'create'},
        
        # Subscription Management
        {'name': 'subscription_management.subscriptions.view', 'description': 'View subscriptions', 'category': 'subscription_management', 'resource': 'subscriptions', 'action': 'view'},
        {'name': 'subscription_management.subscriptions.create', 'description': 'Create subscriptions', 'category': 'subscription_management', 'resource': 'subscriptions', 'action': 'create'},
        {'name': 'subscription_management.subscriptions.edit', 'description': 'Edit subscriptions', 'category': 'subscription_management', 'resource': 'subscriptions', 'action': 'edit'},
        {'name': 'subscription_management.subscriptions.cancel', 'description': 'Cancel subscriptions', 'category': 'subscription_management', 'resource': 'subscriptions', 'action': 'cancel'},
        {'name': 'subscription_management.plans.view', 'description': 'View subscription plans', 'category': 'subscription_management', 'resource': 'plans', 'action': 'view'},
        {'name': 'subscription_management.plans.create', 'description': 'Create subscription plans', 'category': 'subscription_management', 'resource': 'plans', 'action': 'create'},
        
        # Communication
        {'name': 'communication.notifications.view', 'description': 'View notifications', 'category': 'communication', 'resource': 'notifications', 'action': 'view'},
        {'name': 'communication.notifications.send', 'description': 'Send notifications', 'category': 'communication', 'resource': 'notifications', 'action': 'send'},
        {'name': 'communication.messages.view', 'description': 'View messages', 'category': 'communication', 'resource': 'messages', 'action': 'view'},
        {'name': 'communication.messages.send', 'description': 'Send messages', 'category': 'communication', 'resource': 'messages', 'action': 'send'},
        
        # Financial Management
        {'name': 'financial.payments.view', 'description': 'View payments', 'category': 'financial', 'resource': 'payments', 'action': 'view'},
        {'name': 'financial.payments.process', 'description': 'Process payments', 'category': 'financial', 'resource': 'payments', 'action': 'process'},
        {'name': 'financial.invoices.view', 'description': 'View invoices', 'category': 'financial', 'resource': 'invoices', 'action': 'view'},
        {'name': 'financial.invoices.create', 'description': 'Create invoices', 'category': 'financial', 'resource': 'invoices', 'action': 'create'},
        {'name': 'financial.refunds.view', 'description': 'View refunds', 'category': 'financial', 'resource': 'refunds', 'action': 'view'},
        {'name': 'financial.refunds.process', 'description': 'Process refunds', 'category': 'financial', 'resource': 'refunds', 'action': 'process'},
        
        # Security
        {'name': 'security.alerts.view', 'description': 'View security alerts', 'category': 'security', 'resource': 'alerts', 'action': 'view'},
        {'name': 'security.alerts.respond', 'description': 'Respond to security alerts', 'category': 'security', 'resource': 'alerts', 'action': 'respond'},
        {'name': 'security.audit.view', 'description': 'View security audit logs', 'category': 'security', 'resource': 'audit', 'action': 'view'},
        {'name': 'security.threats.view', 'description': 'View security threats', 'category': 'security', 'resource': 'threats', 'action': 'view'},
        {'name': 'security.threats.investigate', 'description': 'Investigate security threats', 'category': 'security', 'resource': 'threats', 'action': 'investigate'},
        
        # Database Management
        {'name': 'database.backups.view', 'description': 'View database backups', 'category': 'database', 'resource': 'backups', 'action': 'view'},
        {'name': 'database.backups.create', 'description': 'Create database backups', 'category': 'database', 'resource': 'backups', 'action': 'create'},
        {'name': 'database.backups.restore', 'description': 'Restore database backups', 'category': 'database', 'resource': 'backups', 'action': 'restore'},
        {'name': 'database.migrations.view', 'description': 'View database migrations', 'category': 'database', 'resource': 'migrations', 'action': 'view'},
        {'name': 'database.migrations.run', 'description': 'Run database migrations', 'category': 'database', 'resource': 'migrations', 'action': 'run'},
    ]
    
    created_permissions = []
    for perm_data in permissions_data:
        # Check if permission already exists
        existing = Permission.query.filter_by(name=perm_data['name']).first()
        if not existing:
            permission = Permission(
                name=perm_data['name'],
                description=perm_data['description'],
                category=perm_data['category'],
                resource=perm_data['resource'],
                action=perm_data['action'],
                is_active=True,
                is_system_permission=True
            )
            db.session.add(permission)
            created_permissions.append(permission)
            logger.info(f"Created permission: {perm_data['name']}")
        else:
            created_permissions.append(existing)
            logger.info(f"Permission already exists: {perm_data['name']}")
    
    db.session.commit()
    logger.info(f"Created {len(created_permissions)} permissions")
    return created_permissions

def create_roles():
    """Create initial roles"""
    roles_data = [
        {
            'name': 'super_admin',
            'display_name': 'Super Administrator',
            'description': 'Complete system access and control',
            'is_system_role': True,
            'priority': 100,
            'permissions': [
                'user_management.users.view', 'user_management.users.create', 'user_management.users.edit', 'user_management.users.delete',
                'user_management.users.activate', 'user_management.users.suspend',
                'rbac_management.roles.view', 'rbac_management.roles.create', 'rbac_management.roles.edit', 'rbac_management.roles.delete',
                'rbac_management.permissions.view', 'rbac_management.permissions.create', 'rbac_management.permissions.edit', 'rbac_management.permissions.delete',
                'rbac_management.assignments.view', 'rbac_management.assignments.create', 'rbac_management.assignments.edit', 'rbac_management.assignments.delete',
                'system_admin.system.view', 'system_admin.settings.view', 'system_admin.settings.edit', 'system_admin.backup.create',
                'system_admin.backup.restore', 'system_admin.logs.view', 'system_admin.maintenance.perform',
                'content_management.content.view', 'content_management.content.create', 'content_management.content.edit', 'content_management.content.delete',
                'content_management.content.publish', 'content_management.content.moderate',
                'analytics.reports.view', 'analytics.reports.create', 'analytics.reports.export', 'analytics.dashboards.view', 'analytics.dashboards.create',
                'subscription_management.subscriptions.view', 'subscription_management.subscriptions.create', 'subscription_management.subscriptions.edit',
                'subscription_management.subscriptions.cancel', 'subscription_management.plans.view', 'subscription_management.plans.create',
                'communication.notifications.view', 'communication.notifications.send', 'communication.messages.view', 'communication.messages.send',
                'financial.payments.view', 'financial.payments.process', 'financial.invoices.view', 'financial.invoices.create',
                'financial.refunds.view', 'financial.refunds.process',
                'security.alerts.view', 'security.alerts.respond', 'security.audit.view', 'security.threats.view', 'security.threats.investigate',
                'database.backups.view', 'database.backups.create', 'database.backups.restore', 'database.migrations.view', 'database.migrations.run'
            ]
        },
        {
            'name': 'admin',
            'display_name': 'Administrator',
            'description': 'System administration and management',
            'is_system_role': True,
            'priority': 80,
            'permissions': [
                'user_management.users.view', 'user_management.users.create', 'user_management.users.edit', 'user_management.users.activate', 'user_management.users.suspend',
                'rbac_management.roles.view', 'rbac_management.assignments.view', 'rbac_management.assignments.create', 'rbac_management.assignments.edit',
                'system_admin.system.view', 'system_admin.settings.view', 'system_admin.logs.view',
                'content_management.content.view', 'content_management.content.create', 'content_management.content.edit', 'content_management.content.publish',
                'analytics.reports.view', 'analytics.reports.export', 'analytics.dashboards.view',
                'subscription_management.subscriptions.view', 'subscription_management.subscriptions.edit',
                'communication.notifications.view', 'communication.notifications.send',
                'financial.payments.view', 'financial.invoices.view',
                'security.alerts.view', 'security.audit.view'
            ]
        },
        {
            'name': 'user_manager',
            'display_name': 'User Manager',
            'description': 'Manage user accounts and permissions',
            'is_system_role': False,
            'priority': 60,
            'permissions': [
                'user_management.users.view', 'user_management.users.create', 'user_management.users.edit', 'user_management.users.activate', 'user_management.users.suspend',
                'rbac_management.assignments.view', 'rbac_management.assignments.create', 'rbac_management.assignments.edit',
                'analytics.reports.view'
            ]
        },
        {
            'name': 'content_manager',
            'display_name': 'Content Manager',
            'description': 'Manage content and publications',
            'is_system_role': False,
            'priority': 50,
            'permissions': [
                'content_management.content.view', 'content_management.content.create', 'content_management.content.edit', 'content_management.content.publish', 'content_management.content.moderate',
                'analytics.reports.view'
            ]
        },
        {
            'name': 'moderator',
            'display_name': 'Moderator',
            'description': 'Moderate user-generated content',
            'is_system_role': False,
            'priority': 40,
            'permissions': [
                'content_management.content.view', 'content_management.content.moderate',
                'user_management.users.view'
            ]
        },
        {
            'name': 'viewer',
            'display_name': 'Viewer',
            'description': 'View-only access to basic information',
            'is_system_role': False,
            'priority': 20,
            'permissions': [
                'user_management.users.view',
                'content_management.content.view',
                'analytics.reports.view'
            ]
        },
        {
            'name': 'user',
            'display_name': 'User',
            'description': 'Standard user access',
            'is_system_role': True,
            'priority': 10,
            'permissions': [
                'content_management.content.view'
            ]
        }
    ]
    
    created_roles = []
    for role_data in roles_data:
        # Check if role already exists
        existing = AdminRole.query.filter_by(name=role_data['name']).first()
        if not existing:
            role = AdminRole(
                name=role_data['name'],
                display_name=role_data['display_name'],
                description=role_data['description'],
                is_system_role=role_data['is_system_role'],
                priority=role_data['priority'],
                is_active=True
            )
            db.session.add(role)
            db.session.flush()  # Get the role ID
            
            # Assign permissions
            for perm_name in role_data['permissions']:
                permission = Permission.query.filter_by(name=perm_name).first()
                if permission:
                    role.permissions.append(permission)
            
            created_roles.append(role)
            logger.info(f"Created role: {role_data['name']} with {len(role_data['permissions'])} permissions")
        else:
            created_roles.append(existing)
            logger.info(f"Role already exists: {role_data['name']}")
    
    db.session.commit()
    logger.info(f"Created {len(created_roles)} roles")
    return created_roles

def create_sample_users():
    """Create sample users for testing"""
    users_data = [
        {'username': 'superadmin', 'email': 'superadmin@example.com', 'full_name': 'Super Administrator', 'role': 'super_admin'},
        {'username': 'admin', 'email': 'admin@example.com', 'full_name': 'System Administrator', 'role': 'admin'},
        {'username': 'usermanager', 'email': 'usermanager@example.com', 'full_name': 'User Manager', 'role': 'user_manager'},
        {'username': 'contentmanager', 'email': 'contentmanager@example.com', 'full_name': 'Content Manager', 'role': 'content_manager'},
        {'username': 'moderator1', 'email': 'moderator1@example.com', 'full_name': 'Content Moderator 1', 'role': 'moderator'},
        {'username': 'moderator2', 'email': 'moderator2@example.com', 'full_name': 'Content Moderator 2', 'role': 'moderator'},
        {'username': 'viewer1', 'email': 'viewer1@example.com', 'full_name': 'Viewer User 1', 'role': 'viewer'},
        {'username': 'viewer2', 'email': 'viewer2@example.com', 'full_name': 'Viewer User 2', 'role': 'viewer'},
        {'username': 'user1', 'email': 'user1@example.com', 'full_name': 'Regular User 1', 'role': 'user'},
        {'username': 'user2', 'email': 'user2@example.com', 'full_name': 'Regular User 2', 'role': 'user'},
        {'username': 'user3', 'email': 'user3@example.com', 'full_name': 'Regular User 3', 'role': 'user'},
        {'username': 'user4', 'email': 'user4@example.com', 'full_name': 'Regular User 4', 'role': 'user'},
        {'username': 'user5', 'email': 'user5@example.com', 'full_name': 'Regular User 5', 'role': 'user'},
    ]
    
    created_users = []
    for user_data in users_data:
        # Check if user already exists
        existing = User.query.filter_by(email=user_data['email']).first()
        if not existing:
            # Split full_name into first_name and last_name
            name_parts = user_data['full_name'].split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True
            )
            user.set_password('password123')  # Set a default password
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            # Assign role
            role = AdminRole.query.filter_by(name=user_data['role']).first()
            if role:
                assignment = UserRoleAssignment(
                    user_id=user.id,
                    role_id=role.id,
                    assigned_by=1,  # Default to first admin user
                    assigned_at=datetime.utcnow(),
                    is_active=True
                )
                db.session.add(assignment)
            
            created_users.append(user)
            logger.info(f"Created user: {user_data['username']} with role {user_data['role']}")
        else:
            created_users.append(existing)
            logger.info(f"User already exists: {user_data['email']}")
    
    db.session.commit()
    logger.info(f"Created {len(created_users)} users")
    return created_users

def main():
    """Main function to populate the database"""
    app = create_app('development')
    
    with app.app_context():
        logger.info("Starting RBAC data population...")
        
        # Create permissions
        permissions = create_permissions()
        
        # Create roles
        roles = create_roles()
        
        # Create sample users
        users = create_sample_users()
        
        logger.info("RBAC data population completed successfully!")
        logger.info(f"Created {len(permissions)} permissions, {len(roles)} roles, and {len(users)} users")

if __name__ == '__main__':
    main()
