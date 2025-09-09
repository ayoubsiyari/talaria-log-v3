#!/usr/bin/env python3
"""
Script to assign test roles to users for testing the role-based system.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment

def assign_test_roles():
    """Assign test roles to users"""
    app = create_app()
    
    with app.app_context():
        # Get all roles
        system_admin_role = AdminRole.query.filter_by(name='system_administrator').first()
        marketing_role = AdminRole.query.filter_by(name='marketing_team').first()
        finance_role = AdminRole.query.filter_by(name='finance_team').first()
        support_role = AdminRole.query.filter_by(name='support_team').first()
        
        if not all([system_admin_role, marketing_role, finance_role, support_role]):
            print("❌ Some roles are missing. Please run setup_clean_roles.py first.")
            return
        
        # Get all admin users
        admin_users = AdminUser.query.all()
        
        if not admin_users:
            print("❌ No admin users found in the database.")
            return
        
        print(f"Found {len(admin_users)} admin users")
        
        # Assign roles to users (cycling through the 4 roles)
        roles = [system_admin_role, marketing_role, finance_role, support_role]
        role_names = ['System Administrator', 'Marketing Team', 'Finance Team', 'Support Team']
        
        for i, user in enumerate(admin_users):
            # Clear existing role assignments
            UserRoleAssignment.query.filter_by(user_id=user.id).delete()
            
            # Assign a role (cycle through the 4 roles)
            role_index = i % len(roles)
            role = roles[role_index]
            
            assignment = UserRoleAssignment(
                user_id=user.id,
                role_id=role.id,
                assigned_by=user.id,  # Self-assigned for testing
                is_active=True
            )
            db.session.add(assignment)
            
            print(f"✅ Assigned {role_names[role_index]} role to user: {user.username}")
        
        # Commit all assignments
        db.session.commit()
        
        print(f"\n✅ Successfully assigned roles to {len(admin_users)} users!")
        print("\n📊 Role Distribution:")
        for i, role_name in enumerate(role_names):
            count = UserRoleAssignment.query.filter_by(role_id=roles[i].id).count()
            print(f"   • {role_name}: {count} users")

if __name__ == '__main__':
    assign_test_roles()
