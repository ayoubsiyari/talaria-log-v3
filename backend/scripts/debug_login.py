#!/usr/bin/env python3
"""
Debug script to test login logic step by step
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.rbac import AdminUser
from werkzeug.security import check_password_hash

def debug_login():
    """Debug the login process"""
    app = create_app('development')
    
    with app.app_context():
        try:
            print("=== DEBUGGING LOGIN ===")
            
            # Test email
            email = "admin@example.com"
            password = "admin123"
            
            print(f"\n1. Looking for admin user with email: {email}")
            
            # Check if admin exists
            admin = AdminUser.query.filter_by(email=email).first()
            if admin:
                print(f"✅ Found admin user:")
                print(f"  ID: {admin.id}")
                print(f"  Username: {admin.username}")
                print(f"  Email: {admin.email}")
                print(f"  Is Active: {admin.is_active}")
                print(f"  Is Super Admin: {admin.is_super_admin}")
                
                # Test password
                print(f"\n2. Testing password...")
                if admin.check_password(password):
                    print("✅ Password is correct!")
                    
                    # Test roles
                    print(f"\n3. Testing roles...")
                    try:
                        roles = [role.to_dict() for role in admin.assigned_roles]
                        print(f"✅ Found {len(roles)} roles:")
                        for role in roles:
                            print(f"  • {role.get('name', 'unknown')}")
                    except Exception as e:
                        print(f"❌ Error getting roles: {e}")
                        
                else:
                    print("❌ Password is incorrect!")
            else:
                print("❌ No admin user found with that email")
                
        except Exception as e:
            print(f"❌ Error during debug: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    debug_login()
