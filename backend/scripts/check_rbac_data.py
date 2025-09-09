#!/usr/bin/env python3
"""
Script to check existing RBAC data in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.rbac import AdminRole, Permission, AdminUser, UserRoleAssignment
from app.models.user import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_data():
    """Check existing RBAC data"""
    app = create_app('development')
    
    with app.app_context():
        logger.info("Checking existing RBAC data...")
        
        # Check permissions
        permissions = Permission.query.all()
        logger.info(f"Found {len(permissions)} permissions")
        
        # Check roles
        roles = AdminRole.query.all()
        logger.info(f"Found {len(roles)} roles")
        
        for role in roles:
            logger.info(f"  - {role.name}: {role.display_name} ({len(role.permissions)} permissions)")
        
        # Check users
        users = User.query.all()
        logger.info(f"Found {len(users)} users")
        
        # Check role assignments
        assignments = UserRoleAssignment.query.all()
        logger.info(f"Found {len(assignments)} role assignments")
        
        # Show some sample data
        logger.info("\nSample permissions:")
        for perm in permissions[:5]:
            logger.info(f"  - {perm.name}: {perm.description}")
        
        logger.info("\nSample users:")
        for user in users[:5]:
            logger.info(f"  - {user.username}: {user.full_name}")
        
        logger.info("\nSample role assignments:")
        for assignment in assignments[:5]:
            user = User.query.get(assignment.user_id) if assignment.user_id else None
            role = AdminRole.query.get(assignment.role_id)
            logger.info(f"  - User: {user.username if user else 'Unknown'}, Role: {role.name if role else 'Unknown'}")

if __name__ == '__main__':
    check_data()
