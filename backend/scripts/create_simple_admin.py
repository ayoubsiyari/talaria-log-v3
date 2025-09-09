#!/usr/bin/env python3
"""
Simple script to create an admin user for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from werkzeug.security import generate_password_hash

def create_simple_admin():
    """Create a simple admin user"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Check if admin already exists
            from app.models.rbac import AdminUser
            
            existing_admin = AdminUser.query.filter_by(email='admin@example.com').first()
            if existing_admin:
                print(f"✅ Admin user already exists:")
                print(f"  Username: {existing_admin.username}")
                print(f"  Email: {existing_admin.email}")
                print(f"  Is Super Admin: {existing_admin.is_super_admin}")
                return
            
            # Create new admin user
            admin_user = AdminUser(
                username='admin',
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                password_hash=generate_password_hash('admin123'),
                is_active=True,
                is_super_admin=True
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Admin user created successfully!")
            print(f"  Username: {admin_user.username}")
            print(f"  Email: {admin_user.email}")
            print(f"  Password: admin123")
            print(f"  Is Super Admin: {admin_user.is_super_admin}")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            db.session.rollback()

if __name__ == '__main__':
    create_simple_admin()
