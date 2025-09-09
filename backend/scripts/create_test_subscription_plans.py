#!/usr/bin/env python3
"""
Create test subscription plans for the system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.subscription import SubscriptionPlan, BillingCycle

def create_test_plans():
    app = create_app('development')
    
    with app.app_context():
        # Check if plans already exist
        existing_plans = SubscriptionPlan.query.count()
        if existing_plans > 0:
            print("Test plans already exist!")
            return
        
        # Create test plans
        test_plans = [
            {
                'name': 'Basic',
                'description': 'Perfect for small teams',
                'price': 29.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Up to 5 users',
                    'Basic analytics',
                    'Email support',
                    'Core trading features',
                    'Basic reporting'
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
                'description': 'Great for growing businesses',
                'price': 99.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Up to 25 users',
                    'Advanced analytics',
                    'Priority support',
                    'API access',
                    'Advanced reporting',
                    'Custom integrations',
                    'Team collaboration',
                    'Advanced trading tools'
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
                'description': 'For large organizations',
                'price': 299.99,
                'billing_cycle': BillingCycle.MONTHLY,
                'features': [
                    'Unlimited users',
                    'Custom analytics',
                    '24/7 support',
                    'Custom integrations',
                    'Advanced security',
                    'Dedicated account manager',
                    'Custom training',
                    'White-label options',
                    'Advanced compliance',
                    'Multi-region support'
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
        
        db.session.commit()
        
        print("✅ Test subscription plans created successfully!")
        print(f"Created {len(created_plans)} plans:")
        
        for plan in created_plans:
            print(f"  - {plan.name}: ${plan.price}/month")
            print(f"    Features: {', '.join(plan.features[:3])}...")
            print()

if __name__ == '__main__':
    create_test_plans()
