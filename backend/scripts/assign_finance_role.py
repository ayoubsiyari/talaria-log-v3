#!/usr/bin/env python3
"""
Script to assign the finance_team role to the aminsiyari user.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import AdminUser, AdminRole, UserRoleAssignment

def assign_finance_role():
    """Assign finance_team role to aminsiyari user"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Assigning finance role to aminsiyari...")
        
        # Find the user
        user = AdminUser.query.filter_by(email='aminsiyari@gmail.com').first()
        if not user:
            print("❌ User aminsiyari@gmail.com not found")
            return
        
        # Find the finance_team role
        finance_role = AdminRole.query.filter_by(name='finance_team').first()
        if not finance_role:
            print("❌ Finance team role not found")
            return
        
        print(f"👤 Found user: {user.username} ({user.email})")
        print(f"🎯 Found role: {finance_role.display_name} ({finance_role.name})")
        
        # Check if user already has this role
        existing_assignment = UserRoleAssignment.query.filter_by(
            user_id=user.id,
            role_id=finance_role.id
        ).first()
        
        if existing_assignment:
            print("✅ User already has finance_team role")
        else:
            # Create new assignment
            assignment = UserRoleAssignment(
                user_id=user.id,
                role_id=finance_role.id,
                assigned_by=1  # Assuming admin user ID 1
            )
            db.session.add(assignment)
            db.session.commit()
            print("✅ Successfully assigned finance_team role to user")
        
        # Verify the assignment
        user = AdminUser.query.filter_by(email='aminsiyari@gmail.com').first()
        print(f"\n📊 Verification:")
        print(f"   • User: {user.username} ({user.email})")
        print(f"   • is_super_admin: {user.is_super_admin}")
        print(f"   • Assigned roles: {[role.name for role in user.assigned_roles]}")

if __name__ == '__main__':
    assign_finance_role()
