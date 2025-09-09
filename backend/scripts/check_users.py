#!/usr/bin/env python3
"""
Script to check what users exist in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.rbac import AdminUser
from app.models.user import User

def check_users():
    """Check what users exist in the database"""
    app = create_app('development')
    
    with app.app_context():
        print("=== CHECKING USERS ===")
        
        # Check admin users
        print("\n1. Admin Users:")
        admin_users = AdminUser.query.all()
        if admin_users:
            for user in admin_users:
                print(f"  • ID: {user.id}")
                print(f"    Username: {user.username}")
                print(f"    Email: {user.email}")
                print(f"    Is Super Admin: {user.is_super_admin}")
                print(f"    Is Active: {user.is_active}")
                print()
        else:
            print("  ❌ No admin users found")
        
        # Check regular users
        print("\n2. Regular Users:")
        users = User.query.all()
        if users:
            for user in users:
                print(f"  • ID: {user.id}")
                print(f"    Username: {user.username}")
                print(f"    Email: {user.email}")
                print(f"    Is Admin: {user.is_admin}")
                print(f"    Is Active: {user.is_active}")
                print()
        else:
            print("  ❌ No regular users found")
        
        print("🎉 User check completed!")

if __name__ == '__main__':
    check_users()
