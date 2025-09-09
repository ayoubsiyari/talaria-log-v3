#!/usr/bin/env python3
"""
Script to set up a clean 4-role system for the admin dashboard.
This creates 4 specific roles with their corresponding permissions.
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import Permission, AdminRole, AdminUser

def setup_clean_roles():
    """Set up clean 4-role system"""
    app = create_app()
    
    with app.app_context():
        # Clear existing roles and permissions (except super_admin)
        print("Cleaning existing roles and permissions...")
        
        # Keep super_admin role, delete others
        AdminRole.query.filter(AdminRole.name != 'super_admin').delete()
        
        # Clear all permissions
        Permission.query.delete()
        
        # Commit the cleanup
        db.session.commit()
        
        # Define the 4 clean roles
        roles_data = [
            {
                'name': 'system_administrator',
                'display_name': 'System Administrator',
                'description': 'Full system access - can see all dashboard sections',
                'priority': 100,
                'permissions': [
                    'dashboard.view_all',
                    'users.manage',
                    'roles.manage',
                    'finance.view',
                    'finance.manage',
                    'marketing.view',
                    'marketing.manage',
                    'support.view',
                    'support.manage',
                    'system.settings',
                    'system.logs'
                ]
            },
            {
                'name': 'marketing_team',
                'display_name': 'Marketing Team',
                'description': 'Marketing and content management access',
                'priority': 80,
                'permissions': [
                    'dashboard.view_marketing',
                    'marketing.view',
                    'marketing.manage',
                    'content.view',
                    'content.manage',
                    'promotions.view',
                    'promotions.manage',
                    'analytics.view'
                ]
            },
            {
                'name': 'finance_team',
                'display_name': 'Finance Team',
                'description': 'Financial data and payment management access',
                'priority': 80,
                'permissions': [
                    'dashboard.view_finance',
                    'finance.view',
                    'finance.manage',
                    'payments.view',
                    'payments.process',
                    'invoices.view',
                    'invoices.create',
                    'reports.view',
                    'analytics.view'
                ]
            },
            {
                'name': 'support_team',
                'display_name': 'Support Team',
                'description': 'User support and customer service access',
                'priority': 80,
                'permissions': [
                    'dashboard.view_support',
                    'support.view',
                    'support.manage',
                    'users.view',
                    'users.edit',
                    'tickets.view',
                    'tickets.respond',
                    'notifications.send'
                ]
            }
        ]
        
        # Create permissions first
        all_permissions = set()
        for role_data in roles_data:
            all_permissions.update(role_data['permissions'])
        
        permissions_map = {}
        for perm_name in all_permissions:
            # Parse permission name to get category and action
            parts = perm_name.split('.')
            if len(parts) >= 2:
                category = parts[0]
                action = parts[1]
                resource = '.'.join(parts[2:]) if len(parts) > 2 else action
            else:
                category = 'general'
                action = perm_name
                resource = perm_name
            
            permission = Permission(
                name=perm_name,
                description=f"Permission to {action} {resource}",
                category=category,
                resource=resource,
                action=action,
                is_system_permission=True,
                is_active=True
            )
            db.session.add(permission)
            permissions_map[perm_name] = permission
            print(f"Created permission: {perm_name}")
        
        # Create roles
        for role_data in roles_data:
            role = AdminRole(
                name=role_data['name'],
                display_name=role_data['display_name'],
                description=role_data['description'],
                priority=role_data['priority'],
                is_system_role=True,
                is_active=True
            )
            db.session.add(role)
            db.session.flush()  # Get the role ID
            
            # Assign permissions to role
            for perm_name in role_data['permissions']:
                if perm_name in permissions_map:
                    role.permissions.append(permissions_map[perm_name])
            
            print(f"Created role: {role_data['display_name']} with {len(role_data['permissions'])} permissions")
        
        # Commit everything
        db.session.commit()
        
        print(f"\n✅ Clean role system created successfully!")
        print(f"📊 Summary:")
        print(f"   • Roles: {AdminRole.query.count()}")
        print(f"   • Permissions: {Permission.query.count()}")
        
        # Show role details
        for role in AdminRole.query.all():
            print(f"\n👥 {role.display_name}:")
            print(f"   • Name: {role.name}")
            print(f"   • Permissions: {len(role.permissions)}")
            for perm in role.permissions:
                print(f"     - {perm.name}")

if __name__ == '__main__':
    setup_clean_roles()
