#!/usr/bin/env python3
"""
Production Database Setup Script
Creates the production database and initial data
"""

import os
import sys
from dotenv import load_dotenv

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
load_dotenv()

from backend.app import create_app, db
from backend.app.models.user import User
from backend.app.models.rbac import AdminUser, AdminRole, Permission

def setup_production_database():
    """Setup production database with initial data"""
    app = create_app('production')
    
    with app.app_context():
        print("🗄️ Creating database tables...")
        db.create_all()
        
        print("👤 Creating super admin user...")
        # Check if super admin already exists
        if not AdminUser.query.filter_by(email='superadmin@talaria.com').first():
            super_admin = AdminUser(
                email='superadmin@talaria.com',
                password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2u',  # superadmin123456
                first_name='Super',
                last_name='Admin',
                is_active=True,
                is_verified=True
            )
            db.session.add(super_admin)
            db.session.commit()
            print("✅ Super admin created: superadmin@talaria.com")
        else:
            print("ℹ️ Super admin already exists")
        
        print("🔐 Setting up roles and permissions...")
        # Create basic roles if they don't exist
        roles_data = [
            {'name': 'super_admin', 'description': 'Full system access'},
            {'name': 'admin', 'description': 'Administrative access'},
            {'name': 'user_manager', 'description': 'User management access'},
            {'name': 'content_manager', 'description': 'Content management access'}
        ]
        
        for role_data in roles_data:
            if not AdminRole.query.filter_by(name=role_data['name']).first():
                role = AdminRole(**role_data)
                db.session.add(role)
        
        db.session.commit()
        print("✅ Database setup completed successfully!")
        
        # Show database info
        print(f"\n📊 Database Statistics:")
        print(f"   Users: {User.query.count()}")
        print(f"   Admin Users: {AdminUser.query.count()}")
        print(f"   Roles: {AdminRole.query.count()}")
        print(f"   Permissions: {Permission.query.count()}")

if __name__ == '__main__':
    setup_production_database()
