#!/usr/bin/env python3
"""
RBAC System Seed Data Script
Creates initial roles, permissions, and role-permission assignments
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import AdminRole, Permission, AdminUser
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_permissions():
    """Create all system permissions"""
    permissions_data = [
        # User Management
        ('users.view', 'user_management', 'users', 'view', 'View user list and profiles'),
        ('users.create', 'user_management', 'users', 'create', 'Create new users'),
        ('users.edit', 'user_management', 'users', 'edit', 'Edit user information'),
        ('users.delete', 'user_management', 'users', 'delete', 'Delete users'),
        ('users.suspend', 'user_management', 'users', 'suspend', 'Suspend/activate accounts'),
        
        # Subscription Management
        ('subscriptions.view', 'subscription_management', 'subscriptions', 'view', 'View subscription data'),
        ('subscriptions.create', 'subscription_management', 'subscriptions', 'create', 'Create subscriptions'),
        ('subscriptions.edit', 'subscription_management', 'subscriptions', 'edit', 'Modify subscriptions'),
        ('subscriptions.cancel', 'subscription_management', 'subscriptions', 'cancel', 'Cancel subscriptions'),
        
        # Content Management
        ('content.view', 'content_management', 'content', 'view', 'View content'),
        ('content.create', 'content_management', 'content', 'create', 'Create content'),
        ('content.edit', 'content_management', 'content', 'edit', 'Edit content'),
        ('content.delete', 'content_management', 'content', 'delete', 'Delete content'),
        ('content.publish', 'content_management', 'content', 'publish', 'Publish content'),
        
        # Trading Data
        ('trades.view', 'trading_data', 'trades', 'view', 'View trading data'),
        ('trades.edit', 'trading_data', 'trades', 'edit', 'Edit trading records'),
        ('trades.delete', 'trading_data', 'trades', 'delete', 'Delete trading data'),
        
        # Analytics
        ('analytics.view', 'analytics', 'analytics', 'view', 'View analytics dashboard'),
        ('analytics.export', 'analytics', 'analytics', 'export', 'Export analytics reports'),
        ('analytics.revenue', 'analytics', 'analytics', 'revenue', 'View revenue analytics'),
        ('reports.view', 'analytics', 'reports', 'view', 'View reports'),
        ('reports.export', 'analytics', 'reports', 'export', 'Export reports'),
        ('reports.financial', 'analytics', 'reports', 'financial', 'Generate financial reports'),
        
        # Payment Management
        ('payments.view', 'payment_management', 'payments', 'view', 'View payment information'),
        ('payments.process', 'payment_management', 'payments', 'process', 'Process payments'),
        ('invoices.create', 'payment_management', 'invoices', 'create', 'Create invoices'),
        
        # System Settings
        ('settings.view', 'system', 'settings', 'view', 'View system settings'),
        ('settings.edit', 'system', 'settings', 'edit', 'Edit system settings'),
        ('system.settings', 'system', 'system', 'settings', 'Access all system settings'),
        ('system.backup', 'system', 'system', 'backup', 'Create system backups'),
        ('system.logs', 'system', 'system', 'logs', 'View system logs'),
        
        # Permission Management
        ('permissions.manage', 'role_management', 'permissions', 'manage', 'Manage all permissions'),
        
        # Role Management
        ('roles.view', 'role_management', 'roles', 'view', 'View roles and permissions'),
        ('roles.create', 'role_management', 'roles', 'create', 'Create new roles'),
        ('roles.edit', 'role_management', 'roles', 'edit', 'Edit roles and permissions'),
        ('roles.delete', 'role_management', 'roles', 'delete', 'Delete roles'),
        ('roles.assign', 'role_management', 'roles', 'assign', 'Assign roles to users'),
        ('roles.manage', 'role_management', 'roles', 'manage', 'Manage all roles'),
        
        # Communication
        ('notifications.send', 'communication', 'notifications', 'send', 'Send notifications'),
        ('messages.send', 'communication', 'messages', 'send', 'Send messages'),
        ('announcements.create', 'communication', 'announcements', 'create', 'Create announcements'),
        
        # Support
        ('support.view', 'support', 'support', 'view', 'View support tickets'),
        ('support.respond', 'support', 'support', 'respond', 'Respond to support tickets'),
        ('support.escalate', 'support', 'support', 'escalate', 'Escalate support tickets'),
    ]
    
    created_permissions = {}
    
    for name, category, resource, action, description in permissions_data:
        # Check if permission already exists
        existing_perm = Permission.query.filter_by(name=name).first()
        if existing_perm:
            print(f"Permission '{name}' already exists, skipping...")
            created_permissions[name] = existing_perm
            continue
            
        permission = Permission(
            name=name,
            category=category,
            resource=resource,
            action=action,
            description=description,
            is_system_permission=True,
            is_active=True
        )
        
        db.session.add(permission)
        created_permissions[name] = permission
        print(f"Created permission: {name}")
    
    db.session.commit()
    return created_permissions

def create_roles():
    """Create system roles"""
    roles_data = [
        ('super_admin', 'Super Administrator', 'Full system access with all permissions', True, 100),
        ('system_administrator', 'System Administrator', 'Full system access and management', True, 95),
        ('admin', 'Administrator', 'System administrator with most permissions', True, 90),
        ('marketing_team', 'Marketing Team', 'Content creation and analytics access', True, 85),
        ('user_manager', 'User Manager', 'Manages users and subscriptions', True, 80),
        ('support_team', 'Support Team', 'Customer support and user management', True, 75),
        ('content_manager', 'Content Manager', 'Manages content and communications', True, 70),
        ('finance_team', 'Finance Team', 'Financial operations and reporting', True, 65),
        ('support_agent', 'Support Agent', 'Handles customer support', True, 60),
        ('analyst', 'Data Analyst', 'Views analytics and generates reports', True, 50),
        ('viewer', 'Viewer', 'Read-only access to most data', True, 40),
    ]
    
    created_roles = {}
    
    for name, display_name, description, is_system, priority in roles_data:
        # Check if role already exists
        existing_role = AdminRole.query.filter_by(name=name).first()
        if existing_role:
            print(f"Role '{name}' already exists, skipping...")
            created_roles[name] = existing_role
            continue
            
        role = AdminRole(
            name=name,
            display_name=display_name,
            description=description,
            is_system_role=is_system,
            is_active=True,
            priority=priority
        )
        
        db.session.add(role)
        created_roles[name] = role
        print(f"Created role: {name}")
    
    db.session.commit()
    return created_roles

def assign_permissions_to_roles(roles, permissions):
    """Assign permissions to roles based on role hierarchy"""
    
    # Super Admin gets all permissions
    super_admin = roles['super_admin']
    for perm in permissions.values():
        super_admin.add_permission(perm)
    print(f"Assigned all permissions to super_admin")
    
    # Admin gets most permissions (except some system settings)
    admin = roles['admin']
    admin_permissions = [p for name, p in permissions.items() if name != 'settings.edit']
    for perm in admin_permissions:
        admin.add_permission(perm)
    print(f"Assigned {len(admin_permissions)} permissions to admin")
    
    # User Manager gets user and subscription management permissions
    user_manager = roles['user_manager']
    user_manager_perms = [
        'users.view', 'users.create', 'users.edit', 'users.suspend',
        'subscriptions.view', 'subscriptions.create', 'subscriptions.edit', 'subscriptions.cancel',
        'analytics.view', 'reports.view', 'support.view'
    ]
    for perm_name in user_manager_perms:
        if perm_name in permissions:
            user_manager.add_permission(permissions[perm_name])
    print(f"Assigned {len(user_manager_perms)} permissions to user_manager")
    
    # Content Manager gets content and communication permissions
    content_manager = roles['content_manager']
    content_manager_perms = [
        'content.view', 'content.create', 'content.edit', 'content.delete',
        'notifications.send', 'messages.send', 'announcements.create',
        'analytics.view', 'users.view'
    ]
    for perm_name in content_manager_perms:
        if perm_name in permissions:
            content_manager.add_permission(permissions[perm_name])
    print(f"Assigned {len(content_manager_perms)} permissions to content_manager")
    
    # Support Agent gets support and limited user permissions
    support_agent = roles['support_agent']
    support_agent_perms = [
        'users.view', 'users.edit', 'subscriptions.view',
        'support.view', 'support.respond', 'support.escalate',
        'messages.send', 'notifications.send'
    ]
    for perm_name in support_agent_perms:
        if perm_name in permissions:
            support_agent.add_permission(permissions[perm_name])
    print(f"Assigned {len(support_agent_perms)} permissions to support_agent")
    
    # Analyst gets analytics and reporting permissions
    analyst = roles['analyst']
    analyst_perms = [
        'analytics.view', 'reports.view', 'reports.export',
        'trades.view', 'users.view', 'subscriptions.view'
    ]
    for perm_name in analyst_perms:
        if perm_name in permissions:
            analyst.add_permission(permissions[perm_name])
    print(f"Assigned {len(analyst_perms)} permissions to analyst")
    
    # Viewer gets read-only permissions
    viewer = roles['viewer']
    viewer_perms = [
        'users.view', 'subscriptions.view', 'content.view',
        'trades.view', 'analytics.view', 'reports.view'
    ]
    for perm_name in viewer_perms:
        if perm_name in permissions:
            viewer.add_permission(permissions[perm_name])
    print(f"Assigned {len(viewer_perms)} permissions to viewer")
    
    db.session.commit()

def assign_new_team_permissions(roles, permissions):
    """Assign permissions to new team roles with specific access controls"""
    
    # Marketing Team Role
    # ✅ Allowed: content.view, content.create, content.edit, analytics.view, analytics.export
    # ❌ Denied: users.delete, system.settings
    if 'marketing_team' in roles:
        marketing_team = roles['marketing_team']
        marketing_perms = [
            'content.view', 'content.create', 'content.edit',
            'analytics.view', 'analytics.export'
        ]
        for perm_name in marketing_perms:
            if perm_name in permissions:
                marketing_team.add_permission(permissions[perm_name])
        print(f"✅ Marketing Team: Assigned {len(marketing_perms)} permissions")
    
    # Support Team Role
    # ✅ Allowed: users.view, users.edit, subscriptions.view, subscriptions.cancel, notifications.send
    # ❌ Denied: users.delete, system.backup
    if 'support_team' in roles:
        support_team = roles['support_team']
        support_team_perms = [
            'users.view', 'users.edit',
            'subscriptions.view', 'subscriptions.cancel',
            'notifications.send'
        ]
        for perm_name in support_team_perms:
            if perm_name in permissions:
                support_team.add_permission(permissions[perm_name])
        print(f"✅ Support Team: Assigned {len(support_team_perms)} permissions")
    
    # Finance Team Role
    # ✅ Allowed: payments.view, payments.process, invoices.create, reports.financial, analytics.revenue
    # ❌ Denied: users.create, content.publish
    if 'finance_team' in roles:
        finance_team = roles['finance_team']
        finance_team_perms = [
            'payments.view', 'payments.process',
            'invoices.create', 'reports.financial',
            'analytics.revenue'
        ]
        for perm_name in finance_team_perms:
            if perm_name in permissions:
                finance_team.add_permission(permissions[perm_name])
        print(f"✅ Finance Team: Assigned {len(finance_team_perms)} permissions")
    
    # System Administrator Role (Full Access)
    # ✅ All permissions including: system.settings, system.backup, system.logs, roles.manage, permissions.manage
    if 'system_administrator' in roles:
        system_admin = roles['system_administrator']
        for perm in permissions.values():
            system_admin.add_permission(perm)
        print(f"✅ System Administrator: Assigned ALL permissions (Full Access)")
    
    db.session.commit()

def create_super_admin_user():
    """Create initial super admin user"""
    # Check if super admin already exists
    existing_admin = AdminUser.query.filter_by(username='superadmin').first()
    if existing_admin:
        print("Super admin user already exists, skipping...")
        return existing_admin
    
    # Get super_admin role
    super_admin_role = AdminRole.query.filter_by(name='super_admin').first()
    if not super_admin_role:
        print("ERROR: Super admin role not found!")
        return None
    
    # Create super admin user
    admin_user = AdminUser(
        username='superadmin',
        email='admin@talaria.com',
        first_name='Super',
        last_name='Admin',
        is_active=True,
        is_super_admin=True
    )
    admin_user.set_password('TalariaAdmin2024!')  # Change this in production!
    
    db.session.add(admin_user)
    db.session.commit()
    
    # Assign super admin role
    from app.models.rbac import UserRoleAssignment
    role_assignment = UserRoleAssignment(
        admin_user_id=admin_user.id,
        role_id=super_admin_role.id,
        assigned_by=admin_user.id,  # Self-assigned for initial setup
        is_active=True
    )
    
    db.session.add(role_assignment)
    db.session.commit()
    
    print(f"Created super admin user: {admin_user.username}")
    print(f"Email: {admin_user.email}")
    print(f"Password: TalariaAdmin2024! (CHANGE THIS IN PRODUCTION!)")
    
    return admin_user

def main():
    """Main function to seed RBAC data"""
    app = create_app()
    
    with app.app_context():
        print("Starting RBAC data seeding...")
        
        # Create permissions
        print("\n1. Creating permissions...")
        permissions = create_permissions()
        
        # Create roles
        print("\n2. Creating roles...")
        roles = create_roles()
        
        # Assign permissions to roles
        print("\n3. Assigning permissions to roles...")
        assign_permissions_to_roles(roles, permissions)
        
        # Create new team roles with specific permissions
        assign_new_team_permissions(roles, permissions)
        
        # Create super admin user
        print("\n4. Creating super admin user...")
        super_admin = create_super_admin_user()
        
        print("\n✅ RBAC system seeding completed successfully!")
        print("\nSummary:")
        print(f"- Created {len(permissions)} permissions")
        print(f"- Created {len(roles)} roles")
        print(f"- Created super admin user: superadmin")
        print("\n🔐 Login credentials:")
        print("Username: superadmin")
        print("Email: admin@talaria.com")
        print("Password: TalariaAdmin2024!")
        print("\n⚠️  IMPORTANT: Change the default password in production!")

if __name__ == '__main__':
    main()
