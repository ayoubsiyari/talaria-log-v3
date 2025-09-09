#!/usr/bin/env python3
"""
Script to add a test subscription plan directly to the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.subscription import SubscriptionPlan, BillingCycle

def add_test_plan():
    """Add a test subscription plan"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Check if test plan already exists
            existing_plan = SubscriptionPlan.query.filter_by(name='Test Plan').first()
            if existing_plan:
                print(f"✅ Test plan already exists with ID: {existing_plan.id}")
                return True
            
            # Create test plan
            test_plan = SubscriptionPlan(
                name='Test Plan',
                description='A test subscription plan for debugging',
                price=19.99,
                billing_cycle=BillingCycle.MONTHLY,
                features=[
                    'Test feature 1',
                    'Test feature 2',
                    'Test feature 3'
                ],
                max_users=10,
                max_projects=20,
                storage_limit=2048,
                trial_days=7,
                trial_price=0.0,
                is_active=True,
                is_popular=False,
                sort_order=4
            )
            
            db.session.add(test_plan)
            db.session.commit()
            
            print(f"✅ Successfully created test plan with ID: {test_plan.id}")
            print(f"   Name: {test_plan.name}")
            print(f"   Price: ${test_plan.price}")
            print(f"   Active: {test_plan.is_active}")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating test plan: {str(e)}")
            return False

if __name__ == '__main__':
    print("🚀 Adding test subscription plan...")
    success = add_test_plan()
    if success:
        print("🎉 Test plan added successfully!")
    else:
        print("❌ Failed to add test plan")
        sys.exit(1)
