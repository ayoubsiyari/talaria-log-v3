#!/usr/bin/env python3
"""
Script to check admin user status
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.rbac import AdminUser

def check_admin_users():
    """Check admin users and their status"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Get all admin users
            admin_users = AdminUser.query.all()
            
            print(f"✅ Found {len(admin_users)} admin users:")
            print()
            
            for user in admin_users:
                print(f"👤 User: {user.username}")
                print(f"   ID: {user.id}")
                print(f"   Email: {user.email}")
                print(f"   Is Super Admin: {user.is_super_admin}")
                print(f"   Is Active: {user.is_active}")
                print(f"   Created: {user.created_at}")
                print()
            
            # Check for super admins
            super_admins = AdminUser.query.filter_by(is_super_admin=True).all()
            print(f"🔑 Super Admins: {len(super_admins)}")
            for admin in super_admins:
                print(f"   - {admin.username} ({admin.email})")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    return True

if __name__ == '__main__':
    print("🚀 Checking admin users...")
    success = check_admin_users()
    if success:
        print("🎉 Check completed successfully!")
    else:
        print("❌ Check failed")
        sys.exit(1)
