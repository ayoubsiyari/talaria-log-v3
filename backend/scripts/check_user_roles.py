#!/usr/bin/env python3
"""
Script to check user roles and permissions.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment, Permission

def check_user_roles():
    """Check user roles and permissions"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Checking user roles and permissions...\n")
        
        # Get all admin users
        admin_users = AdminUser.query.all()
        
        for user in admin_users:
            print(f"👤 User: {user.username} (ID: {user.id})")
            print(f"   Email: {user.email}")
            print(f"   Is Super Admin: {user.is_super_admin}")
            print(f"   Account Type: {getattr(user, 'account_type', 'N/A')}")
            
            # Get user's role assignments
            role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id, is_active=True).all()
            
            if role_assignments:
                print(f"   📋 Assigned Roles:")
                for assignment in role_assignments:
                    role = assignment.role
                    print(f"      • {role.display_name} ({role.name})")
                    print(f"        Permissions ({len(role.permissions)}):")
                    for perm in role.permissions:
                        print(f"          - {perm.name}")
            else:
                print(f"   ❌ No role assignments found")
            
            print()
        
        # Show all available roles
        print("📊 Available Roles:")
        roles = AdminRole.query.all()
        for role in roles:
            print(f"   • {role.display_name} ({role.name})")
            print(f"     Permissions ({len(role.permissions)}):")
            for perm in role.permissions:
                print(f"       - {perm.name}")
            print()
        
        # Show all permissions
        print("🔐 All Permissions:")
        permissions = Permission.query.all()
        for perm in permissions:
            print(f"   • {perm.name} ({perm.category}.{perm.resource}.{perm.action})")

if __name__ == '__main__':
    check_user_roles()
