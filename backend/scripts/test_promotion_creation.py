#!/usr/bin/env python3
"""
Test Promotion Creation Script
==============================

This script tests the promotion creation endpoint to see if it works correctly.

Usage:
    python scripts/test_promotion_creation.py
"""

import sys
import os
import requests
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import AdminUser, AdminRole, Permission, UserRoleAssignment

def test_promotion_creation():
    """Test the promotion creation endpoint"""
    app = create_app()
    
    with app.app_context():
        try:
            # First, let's check if we have a user with the right permissions
            print("🔍 Checking user permissions...")
            
            # Get the first admin user
            admin_user = AdminUser.query.filter_by(is_admin=True).first()
            if not admin_user:
                print("❌ No admin user found")
                return
            
            print(f"✅ Found admin user: {admin_user.email}")
            
            # Check user roles
            role_assignments = UserRoleAssignment.query.filter_by(user_id=admin_user.id).all()
            print(f"📋 User has {len(role_assignments)} role assignments")
            
            for assignment in role_assignments:
                role = assignment.role
                print(f"   - Role: {role.name}")
                
                # Check role permissions
                permissions = Permission.query.join(AdminRole.permissions).filter(AdminRole.id == role.id).all()
                print(f"     Permissions: {[p.name for p in permissions]}")
            
            # Check if user has promotion permissions
            promotion_permissions = Permission.query.filter(Permission.name.like('promotions%')).all()
            print(f"📋 Available promotion permissions: {[p.name for p in promotion_permissions]}")
            
            # Test creating a promotion directly in the database
            print("\n🧪 Testing direct promotion creation...")
            from app.models import Promotion
            from datetime import datetime
            
            test_promotion = Promotion(
                name="Test Campaign",
                description="Test description",
                code="TEST123",
                type="percentage",
                value=25.0,
                start_date=datetime.now(),
                status="active"
            )
            
            db.session.add(test_promotion)
            db.session.commit()
            print(f"✅ Successfully created test promotion with ID: {test_promotion.id}")
            
            # Clean up
            db.session.delete(test_promotion)
            db.session.commit()
            print("🧹 Cleaned up test promotion")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    print("🧪 Testing promotion creation...")
    test_promotion_creation()
    print("✅ Test completed!")
