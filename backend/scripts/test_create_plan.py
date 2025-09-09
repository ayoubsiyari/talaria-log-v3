#!/usr/bin/env python3
"""
Script to test plan creation directly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.subscription import SubscriptionPlan, BillingCycle
from app.services.subscription_service import SubscriptionService

def test_create_plan():
    """Test creating a plan directly"""
    app = create_app('development')
    
    with app.app_context():
        try:
            service = SubscriptionService()
            
            # Test plan data
            test_plan_data = {
                'name': 'Test Plan Direct',
                'description': 'Test plan created directly',
                'price': 25.99,
                'billing_cycle': 'monthly',
                'features': ['Test feature 1', 'Test feature 2'],
                'max_users': 10,
                'max_projects': 20,
                'storage_limit': 2048,
                'trial_days': 7,
                'trial_price': 0.0,
                'is_active': True,
                'is_popular': False,
                'sort_order': 5
            }
            
            print("Creating test plan...")
            plan = service.create_subscription_plan(test_plan_data)
            
            print(f"✅ Plan created successfully!")
            print(f"   ID: {plan.id}")
            print(f"   Name: {plan.name}")
            print(f"   Price: ${plan.price}")
            print(f"   Active: {plan.is_active}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating plan: {str(e)}")
            return False

if __name__ == '__main__':
    print("🚀 Testing plan creation...")
    success = test_create_plan()
    if success:
        print("🎉 Test completed successfully!")
    else:
        print("❌ Test failed")
        sys.exit(1)
