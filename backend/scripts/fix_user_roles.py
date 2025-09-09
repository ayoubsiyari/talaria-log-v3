#!/usr/bin/env python3
"""
Script to fix user roles by setting is_super_admin to False for users with specific team roles.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import AdminUser, AdminRole

def fix_user_roles():
    """Fix user roles by setting is_super_admin to False for team-specific users"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Fixing user roles...")
        
        # Get all users
        users = AdminUser.query.all()
        
        for user in users:
            print(f"\n👤 User: {user.username} ({user.email})")
            print(f"   Current is_super_admin: {user.is_super_admin}")
            print(f"   Assigned roles: {[role.name for role in user.assigned_roles]}")
            
            # Check if user has specific team roles
            has_team_role = any(role.name in ['marketing_team', 'finance_team', 'support_team'] for role in user.assigned_roles)
            has_system_admin_role = any(role.name == 'system_administrator' for role in user.assigned_roles)
            
            if has_team_role and not has_system_admin_role:
                if user.is_super_admin:
                    print(f"   ❌ User has team role but is_super_admin=True - FIXING")
                    user.is_super_admin = False
                    db.session.add(user)
                else:
                    print(f"   ✅ User already has correct is_super_admin=False")
            elif has_system_admin_role:
                print(f"   ✅ User has system_administrator role - keeping is_super_admin=True")
            else:
                print(f"   ⚠️  User has no specific roles assigned")
        
        # Commit changes
        db.session.commit()
        print(f"\n✅ User roles fixed!")
        
        # Show updated user list
        print(f"\n📊 Updated user list:")
        users = AdminUser.query.all()
        for user in users:
            print(f"   • {user.username} ({user.email}) - is_super_admin: {user.is_super_admin}")

if __name__ == '__main__':
    fix_user_roles()
