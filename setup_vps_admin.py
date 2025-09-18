#!/usr/bin/env python3
"""
VPS Admin Setup Script
Creates the super admin user with all permissions on the VPS
"""

import os
import sys
from dotenv import load_dotenv

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
load_dotenv()

from backend.app import create_app, db
from backend.app.models.user import User
from backend.app.models.rbac import AdminUser, AdminRole, Permission, UserRoleAssignment, RoleAuditLog

def setup_vps_admin():
    """Setup super admin user with all permissions on VPS"""
    app = create_app('production')
    
    with app.app_context():
        print("🗄️ Creating database tables...")
        db.create_all()
        
        print("👤 Creating super admin user...")
        # Check if super admin already exists
        existing_admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
        if existing_admin:
            print("ℹ️ Super admin already exists, updating...")
            existing_admin.password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2u'  # superadmin123456
            existing_admin.is_active = True
            existing_admin.is_verified = True
            existing_admin.first_name = 'Super'
            existing_admin.last_name = 'Admin'
            db.session.commit()
            admin_user = existing_admin
        else:
            # Create new super admin
            admin_user = AdminUser(
                email='superadmin@talaria.com',
                password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2u',  # superadmin123456
                first_name='Super',
                last_name='Admin',
                is_active=True,
                is_verified=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Super admin created: superadmin@talaria.com")
        
        print("🔐 Setting up roles and permissions...")
        
        # Create super admin role
        super_admin_role = AdminRole.query.filter_by(name='super_admin').first()
        if not super_admin_role:
            super_admin_role = AdminRole(
                name='super_admin',
                description='Full system access with all permissions',
                is_system_role=True
            )
            db.session.add(super_admin_role)
            db.session.commit()
            print("✅ Super admin role created")
        
        # Create all permissions
        permissions_data = [
            # User Management
            {'name': 'user_management', 'description': 'Manage regular users'},
            {'name': 'user_create', 'description': 'Create new users'},
            {'name': 'user_read', 'description': 'View user details'},
            {'name': 'user_update', 'description': 'Update user information'},
            {'name': 'user_delete', 'description': 'Delete users'},
            {'name': 'user_export', 'description': 'Export user data'},
            
            # Admin User Management
            {'name': 'admin_user_management', 'description': 'Manage admin users'},
            {'name': 'admin_user_create', 'description': 'Create admin users'},
            {'name': 'admin_user_read', 'description': 'View admin user details'},
            {'name': 'admin_user_update', 'description': 'Update admin users'},
            {'name': 'admin_user_delete', 'description': 'Delete admin users'},
            
            # Subscription Management
            {'name': 'subscription_management', 'description': 'Manage subscriptions'},
            {'name': 'subscription_analytics', 'description': 'View subscription analytics'},
            {'name': 'subscription_plans', 'description': 'Manage subscription plans'},
            {'name': 'subscription_export', 'description': 'Export subscription data'},
            
            # RBAC Management
            {'name': 'rbac_management', 'description': 'Manage roles and permissions'},
            {'name': 'role_create', 'description': 'Create roles'},
            {'name': 'role_read', 'description': 'View roles'},
            {'name': 'role_update', 'description': 'Update roles'},
            {'name': 'role_delete', 'description': 'Delete roles'},
            {'name': 'permission_assign', 'description': 'Assign permissions'},
            
            # Dashboard Access
            {'name': 'dashboard_access', 'description': 'Access main dashboard'},
            {'name': 'analytics_access', 'description': 'Access analytics'},
            {'name': 'reports_access', 'description': 'Access reports'},
            
            # System Administration
            {'name': 'system_admin', 'description': 'System administration'},
            {'name': 'database_access', 'description': 'Database access'},
            {'name': 'logs_access', 'description': 'Access system logs'},
            {'name': 'settings_access', 'description': 'Access system settings'},
            
            # Communication
            {'name': 'communication_management', 'description': 'Manage communications'},
            {'name': 'notifications_send', 'description': 'Send notifications'},
            {'name': 'announcements_create', 'description': 'Create announcements'},
            
            # Support Management
            {'name': 'support_management', 'description': 'Manage support tickets'},
            {'name': 'ticket_read', 'description': 'View support tickets'},
            {'name': 'ticket_update', 'description': 'Update support tickets'},
            {'name': 'ticket_assign', 'description': 'Assign support tickets'},
            
            # Financial Management
            {'name': 'financial_access', 'description': 'Access financial data'},
            {'name': 'revenue_analytics', 'description': 'View revenue analytics'},
            {'name': 'payment_management', 'description': 'Manage payments'},
            
            # Content Management
            {'name': 'content_management', 'description': 'Manage content'},
            {'name': 'promotions_manage', 'description': 'Manage promotions'},
            {'name': 'marketing_access', 'description': 'Access marketing tools'},
        ]
        
        for perm_data in permissions_data:
            if not Permission.query.filter_by(name=perm_data['name']).first():
                permission = Permission(**perm_data)
                db.session.add(permission)
        
        db.session.commit()
        print("✅ All permissions created")
        
        # Assign all permissions to super admin role
        all_permissions = Permission.query.all()
        for permission in all_permissions:
            if permission not in super_admin_role.permissions:
                super_admin_role.permissions.append(permission)
        
        db.session.commit()
        print("✅ All permissions assigned to super admin role")
        
        # Assign super admin role to admin user
        existing_assignment = UserRoleAssignment.query.filter_by(
            user_id=admin_user.id,
            role_id=super_admin_role.id
        ).first()
        
        if not existing_assignment:
            assignment = UserRoleAssignment(
                user_id=admin_user.id,
                role_id=super_admin_role.id,
                assigned_by=admin_user.id,
                is_active=True
            )
            db.session.add(assignment)
            db.session.commit()
            print("✅ Super admin role assigned to admin user")
        
        # Create audit log entry
        audit_log = RoleAuditLog(
            user_id=admin_user.id,
            role_id=super_admin_role.id,
            action='assigned',
            assigned_by=admin_user.id,
            details='Initial super admin setup'
        )
        db.session.add(audit_log)
        db.session.commit()
        
        print("✅ Audit log created")
        
        # Show final status
        print(f"\n📊 Database Statistics:")
        print(f"   Users: {User.query.count()}")
        print(f"   Admin Users: {AdminUser.query.count()}")
        print(f"   Roles: {AdminRole.query.count()}")
        print(f"   Permissions: {Permission.query.count()}")
        print(f"   Role Assignments: {UserRoleAssignment.query.count()}")
        
        print(f"\n🎉 VPS Admin Setup Completed Successfully!")
        print(f"🔑 Login Credentials:")
        print(f"   Email: superadmin@talaria.com")
        print(f"   Password: superadmin123456")
        print(f"   Permissions: ALL (Super Admin)")

if __name__ == '__main__':
    setup_vps_admin()
