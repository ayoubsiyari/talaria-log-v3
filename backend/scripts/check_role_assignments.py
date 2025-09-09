#!/usr/bin/env python3
"""
Script to check role assignments for admin users
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment

def check_role_assignments():
    """Check role assignments for admin users"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Get all admin users
            admin_users = AdminUser.query.filter_by(is_active=True).all()
            
            print(f"✅ Found {len(admin_users)} active admin users:")
            print()
            
            for user in admin_users:
                print(f"👤 User: {user.username} (ID: {user.id})")
                print(f"   Email: {user.email}")
                print(f"   Is Super Admin: {user.is_super_admin}")
                
                # Get role assignments
                role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id).all()
                if role_assignments:
                    print(f"   Roles:")
                    for assignment in role_assignments:
                        role = AdminRole.query.get(assignment.role_id)
                        if role:
                            print(f"     - {role.name} (ID: {role.id})")
                else:
                    print(f"   No role assignments")
                print()
            
            # Check all roles
            print("🔍 Available Roles:")
            roles = AdminRole.query.all()
            for role in roles:
                print(f"   - {role.name} (ID: {role.id})")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    return True

if __name__ == '__main__':
    print("🚀 Checking role assignments...")
    success = check_role_assignments()
    if success:
        print("🎉 Check completed successfully!")
    else:
        print("❌ Check failed")
        sys.exit(1)
