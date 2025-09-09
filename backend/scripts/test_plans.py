#!/usr/bin/env python3
"""
Script to test and display current subscription plans
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.subscription import SubscriptionPlan

def test_plans():
    """Test and display current subscription plans"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Get all plans
            plans = SubscriptionPlan.query.all()
            
            print(f"✅ Found {len(plans)} subscription plans:")
            print()
            
            for plan in plans:
                print(f"📋 Plan: {plan.name}")
                print(f"   ID: {plan.id}")
                print(f"   Price: ${plan.price}")
                print(f"   Billing Cycle: {plan.billing_cycle}")
                print(f"   Active: {plan.is_active}")
                print(f"   Popular: {plan.is_popular}")
                print(f"   Features: {plan.features}")
                print(f"   Max Users: {plan.max_users}")
                print(f"   Max Projects: {plan.max_projects}")
                print(f"   Storage Limit: {plan.storage_limit}")
                print(f"   Trial Days: {plan.trial_days}")
                print(f"   Created: {plan.created_at}")
                print()
            
            # Test API endpoint
            print("🔍 Testing API endpoint...")
            from app.services.subscription_service import SubscriptionService
            service = SubscriptionService()
            active_plans = service.get_active_plans()
            print(f"✅ Active plans via service: {len(active_plans)}")
            
            for plan in active_plans:
                plan_dict = plan.to_dict()
                print(f"   - {plan_dict['name']}: ${plan_dict['price']}")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    return True

if __name__ == '__main__':
    print("🚀 Testing subscription plans...")
    success = test_plans()
    if success:
        print("🎉 Test completed successfully!")
    else:
        print("❌ Test failed")
        sys.exit(1)
