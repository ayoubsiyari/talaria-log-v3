#!/usr/bin/env python3
"""
Script to test all subscription plans functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.subscription import SubscriptionPlan, BillingCycle
from app.services.subscription_service import SubscriptionService

def test_all_plans():
    """Test all subscription plans functionality"""
    app = create_app('development')
    
    with app.app_context():
        try:
            service = SubscriptionService()
            
            print("=== TESTING SUBSCRIPTION PLANS ===")
            
            # 1. Get all plans
            print("\n1. Getting all plans...")
            all_plans = SubscriptionPlan.query.all()
            print(f"Found {len(all_plans)} plans in database:")
            
            for plan in all_plans:
                print(f"   - {plan.name}: ${plan.price} ({plan.billing_cycle.value}) - Active: {plan.is_active}")
            
            # 2. Get active plans
            print("\n2. Getting active plans...")
            active_plans = service.get_active_plans()
            print(f"Found {len(active_plans)} active plans:")
            
            for plan in active_plans:
                print(f"   - {plan.name}: ${plan.price} ({plan.billing_cycle.value})")
            
            # 3. Create a test plan if none exist
            if len(all_plans) == 0:
                print("\n3. No plans found, creating test plans...")
                
                test_plans = [
                    {
                        'name': 'Basic Plan',
                        'description': 'Perfect for getting started',
                        'price': 9.99,
                        'billing_cycle': 'monthly',
                        'features': ['Basic features', 'Email support'],
                        'max_users': 1,
                        'max_projects': 10,
                        'storage_limit': 1024,
                        'trial_days': 7,
                        'trial_price': 0.0,
                        'is_active': True,
                        'is_popular': False,
                        'sort_order': 1
                    },
                    {
                        'name': 'Professional Plan',
                        'description': 'Great for professionals',
                        'price': 29.99,
                        'billing_cycle': 'monthly',
                        'features': ['All Basic features', 'Priority support', 'Advanced analytics'],
                        'max_users': 5,
                        'max_projects': 50,
                        'storage_limit': 5120,
                        'trial_days': 14,
                        'trial_price': 0.0,
                        'is_active': True,
                        'is_popular': True,
                        'sort_order': 2
                    },
                    {
                        'name': 'Enterprise Plan',
                        'description': 'For large organizations',
                        'price': 99.99,
                        'billing_cycle': 'monthly',
                        'features': ['All Professional features', 'Dedicated support', 'Custom integrations'],
                        'max_users': 100,
                        'max_projects': 1000,
                        'storage_limit': 51200,
                        'trial_days': 30,
                        'trial_price': 0.0,
                        'is_active': True,
                        'is_popular': False,
                        'sort_order': 3
                    }
                ]
                
                for plan_data in test_plans:
                    plan = service.create_subscription_plan(plan_data)
                    print(f"   ✅ Created: {plan.name}")
            
            # 4. Test API endpoint
            print("\n4. Testing API endpoint...")
            from flask import Flask
            test_app = Flask(__name__)
            test_app.config['TESTING'] = True
            
            with test_app.test_client() as client:
                response = client.get('/api/subscription/plans')
                print(f"   API Response Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.get_json()
                    print(f"   API Plans Count: {len(data.get('plans', []))}")
                else:
                    print(f"   API Error: {response.data.decode()}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("🚀 Testing all subscription plans functionality...")
    success = test_all_plans()
    if success:
        print("\n🎉 All tests completed successfully!")
    else:
        print("\n❌ Tests failed")
        sys.exit(1)
