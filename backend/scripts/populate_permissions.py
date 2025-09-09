#!/usr/bin/env python3
"""
Script to populate basic permissions and roles for the RBAC system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.rbac import Permission, AdminRole

def create_basic_permissions():
    """Create basic permissions if they don't exist"""
    app = create_app()
    
    with app.app_context():
        # Define basic permissions
        basic_permissions = [
            # RBAC Management
            {'name': 'rbac_management.roles.view', 'description': 'View roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'view'},
            {'name': 'rbac_management.roles.create', 'description': 'Create roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'create'},
            {'name': 'rbac_management.roles.edit', 'description': 'Edit roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'edit'},
            {'name': 'rbac_management.roles.delete', 'description': 'Delete roles', 'category': 'rbac_management', 'resource': 'roles', 'action': 'delete'},
            {'name': 'rbac_management.permissions.view', 'description': 'View permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'view'},
            {'name': 'rbac_management.permissions.assign', 'description': 'Assign permissions', 'category': 'rbac_management', 'resource': 'permissions', 'action': 'assign'},
            {'name': 'rbac_management.assignments.view', 'description': 'View role assignments', 'category': 'rbac_management', 'resource': 'assignments', 'action': 'view'},
            
            # User Management
            {'name': 'user_management.users.view', 'description': 'View users', 'category': 'user_management', 'resource': 'users', 'action': 'view'},
            {'name': 'user_management.users.create', 'description': 'Create users', 'category': 'user_management', 'resource': 'users', 'action': 'create'},
            {'name': 'user_management.users.edit', 'description': 'Edit users', 'category': 'user_management', 'resource': 'users', 'action': 'edit'},
            {'name': 'user_management.users.delete', 'description': 'Delete users', 'category': 'user_management', 'resource': 'users', 'action': 'delete'},
            
            # Finance
            {'name': 'finance.view', 'description': 'View finance data', 'category': 'finance', 'resource': 'finance', 'action': 'view'},
            {'name': 'finance.payments.view', 'description': 'View payments', 'category': 'finance', 'resource': 'payments', 'action': 'view'},
            {'name': 'finance.payments.process', 'description': 'Process payments', 'category': 'finance', 'resource': 'payments', 'action': 'process'},
            
            # Marketing
            {'name': 'marketing.view', 'description': 'View marketing data', 'category': 'marketing', 'resource': 'marketing', 'action': 'view'},
            {'name': 'marketing.promotions.view', 'description': 'View promotions', 'category': 'marketing', 'resource': 'promotions', 'action': 'view'},
            {'name': 'marketing.promotions.create', 'description': 'Create promotions', 'category': 'marketing', 'resource': 'promotions', 'action': 'create'},
            
            # Support
            {'name': 'support.view', 'description': 'View support data', 'category': 'support', 'resource': 'support', 'action': 'view'},
            {'name': 'support.tickets.view', 'description': 'View support tickets', 'category': 'support', 'resource': 'tickets', 'action': 'view'},
            {'name': 'support.tickets.create', 'description': 'Create support tickets', 'category': 'support', 'resource': 'tickets', 'action': 'create'},
            {'name': 'support.tickets.respond', 'description': 'Respond to tickets', 'category': 'support', 'resource': 'tickets', 'action': 'respond'},
            {'name': 'support.tickets.delete', 'description': 'Delete support tickets', 'category': 'support', 'resource': 'tickets', 'action': 'delete'},
        ]
    
        created_count = 0
        for perm_data in basic_permissions:
            # Check if permission already exists
            existing = Permission.query.filter_by(name=perm_data['name']).first()
            if not existing:
                permission = Permission(
                    name=perm_data['name'],
                    description=perm_data['description'],
                    category=perm_data['category'],
                    resource=perm_data['resource'],
                    action=perm_data['action'],
                    is_system_permission=True,
                    is_active=True
                )
                db.session.add(permission)
                created_count += 1
                print(f"Created permission: {perm_data['name']}")
            else:
                print(f"Permission already exists: {perm_data['name']}")
    
        if created_count > 0:
            db.session.commit()
            print(f"\nCreated {created_count} new permissions")
        else:
            print("\nAll permissions already exist")
        
        # Create basic roles if they don't exist
        basic_roles = [
            {'name': 'super_admin', 'display_name': 'Super Administrator', 'description': 'Full system access', 'priority': 100},
            {'name': 'admin', 'display_name': 'Administrator', 'description': 'System administrator', 'priority': 90},
            {'name': 'user_manager', 'display_name': 'User Manager', 'description': 'Manage user accounts', 'priority': 80},
            {'name': 'content_manager', 'display_name': 'Content Manager', 'description': 'Manage content and marketing', 'priority': 70},
            {'name': 'analyst', 'display_name': 'Analyst', 'description': 'View analytics and reports', 'priority': 60},
            {'name': 'support_agent', 'display_name': 'Support Agent', 'description': 'Handle support requests', 'priority': 50},
            {'name': 'viewer', 'display_name': 'Viewer', 'description': 'Read-only access', 'priority': 40},
        ]
        
        role_created_count = 0
        for role_data in basic_roles:
            existing = AdminRole.query.filter_by(name=role_data['name']).first()
            if not existing:
                role = AdminRole(
                    name=role_data['name'],
                    display_name=role_data['display_name'],
                    description=role_data['description'],
                    priority=role_data['priority'],
                    is_system_role=True,
                    is_active=True
                )
                db.session.add(role)
                role_created_count += 1
                print(f"Created role: {role_data['name']}")
            else:
                print(f"Role already exists: {role_data['name']}")
    
        if role_created_count > 0:
            db.session.commit()
            print(f"\nCreated {role_created_count} new roles")
        else:
            print("\nAll roles already exist")

if __name__ == '__main__':
    create_basic_permissions()






