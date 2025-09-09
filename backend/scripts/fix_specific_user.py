#!/usr/bin/env python3
"""
Script to fix the specific superadmin user who has finance_team role but is_super_admin=True.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import AdminUser

def fix_superadmin_user():
    """Fix the superadmin user who has finance_team role"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Fixing superadmin user...")
        
        # Find the superadmin user
        user = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
        
        if user:
            print(f"👤 Found user: {user.username} ({user.email})")
            print(f"   Current is_super_admin: {user.is_super_admin}")
            print(f"   Assigned roles: {[role.name for role in user.assigned_roles]}")
            
            # Check if user has finance_team role
            has_finance_role = any(role.name == 'finance_team' for role in user.assigned_roles)
            
            if has_finance_role and user.is_super_admin:
                print(f"   ❌ User has finance_team role but is_super_admin=True - FIXING")
                user.is_super_admin = False
                db.session.add(user)
                db.session.commit()
                print(f"   ✅ Fixed! is_super_admin is now False")
            else:
                print(f"   ✅ User already has correct settings")
        else:
            print(f"❌ User not found")
        
        # Verify the fix
        user = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
        if user:
            print(f"\n📊 Verification:")
            print(f"   • {user.username} ({user.email})")
            print(f"   • is_super_admin: {user.is_super_admin}")
            print(f"   • roles: {[role.name for role in user.assigned_roles]}")

if __name__ == '__main__':
    fix_superadmin_user()
