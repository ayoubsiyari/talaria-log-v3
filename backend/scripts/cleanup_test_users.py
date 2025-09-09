#!/usr/bin/env python3
"""
Script to clean up test users from the database.
This will remove users with 'deleted_' or 'test' in their username or email.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import AdminUser, UserRoleAssignment

def cleanup_test_users():
    """Remove test users from the database"""
    app = create_app()
    
    with app.app_context():
        print("🧹 Cleaning up test users...")
        
        # Find test users
        test_users = AdminUser.query.filter(
            db.or_(
                AdminUser.username.like('%deleted_%'),
                AdminUser.username.like('%test%'),
                AdminUser.email.like('%deleted_%'),
                AdminUser.email.like('%test%')
            )
        ).all()
        
        print(f"📋 Found {len(test_users)} test users to remove:")
        
        for user in test_users:
            print(f"   • {user.username} ({user.email})")
        
        if not test_users:
            print("✅ No test users found to clean up!")
            return
        
        # Confirm deletion
        response = input(f"\n❓ Do you want to delete these {len(test_users)} test users? (y/N): ")
        if response.lower() != 'y':
            print("❌ Cleanup cancelled.")
            return
        
        # Delete user role assignments first
        for user in test_users:
            UserRoleAssignment.query.filter_by(user_id=user.id).delete()
        
        # Delete the users
        for user in test_users:
            db.session.delete(user)
        
        # Commit changes
        db.session.commit()
        
        print(f"✅ Successfully removed {len(test_users)} test users!")
        
        # Show remaining users
        remaining_users = AdminUser.query.all()
        print(f"\n📊 Remaining users ({len(remaining_users)}):")
        for user in remaining_users:
            print(f"   • {user.username} ({user.email})")

if __name__ == '__main__':
    cleanup_test_users()
