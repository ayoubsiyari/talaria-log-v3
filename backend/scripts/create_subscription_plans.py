#!/usr/bin/env python3
"""
Script to create test subscription plans using the Flask app context
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.subscription import SubscriptionPlan, BillingCycle

def create_test_plans():
    """Create test subscription plans"""
    app = create_app('development')
    
    with app.app_context():
        # Check if plans already exist
        existing_plans = SubscriptionPlan.query.count()
        if existing_plans > 0:
            print(f"✅ {existing_plans} subscription plans already exist")
            return
        
        # Create test plans
        test_plans = [
            {
                'name': 'Basic',
                'description': 'Perfect for small teams and individual users',
                'price': 29.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Up to 5 users',
                    'Basic analytics',
                    'Email support',
                    'Standard features'
                ],
                'max_users': 5,
                'max_projects': 10,
                'storage_limit': 1024,  # 1GB
                'trial_days': 14,
                'trial_price': 0.0,
                'is_popular': False,
                'sort_order': 1
            },
            {
                'name': 'Professional',
                'description': 'Great for growing businesses and teams',
                'price': 99.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Up to 25 users',
                    'Advanced analytics',
                    'Priority support',
                    'API access',
                    'Custom integrations'
                ],
                'max_users': 25,
                'max_projects': 50,
                'storage_limit': 5120,  # 5GB
                'trial_days': 14,
                'trial_price': 0.0,
                'is_popular': True,
                'sort_order': 2
            },
            {
                'name': 'Enterprise',
                'description': 'For large organizations with advanced needs',
                'price': 299.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Unlimited users',
                    'Custom analytics',
                    '24/7 support',
                    'Custom integrations',
                    'Dedicated account manager',
                    'Advanced security features'
                ],
                'max_users': None,  # Unlimited
                'max_projects': None,  # Unlimited
                'storage_limit': 51200,  # 50GB
                'trial_days': 30,
                'trial_price': 0.0,
                'is_popular': False,
                'sort_order': 3
            }
        ]
        
        created_plans = []
        for plan_data in test_plans:
            plan = SubscriptionPlan(**plan_data)
            db.session.add(plan)
            created_plans.append(plan)
        
        try:
            db.session.commit()
            print(f"✅ Successfully created {len(created_plans)} subscription plans:")
            for plan in created_plans:
                print(f"   - {plan.name}: ${plan.price}/{plan.billing_cycle.value}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating plans: {str(e)}")
            return False
        
        return True

if __name__ == '__main__':
    print("🚀 Creating test subscription plans...")
    success = create_test_plans()
    if success:
        print("🎉 Subscription plans created successfully!")
    else:
        print("❌ Failed to create subscription plans")
        sys.exit(1)
