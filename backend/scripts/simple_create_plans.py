#!/usr/bin/env python3
"""
Simple script to create test subscription plans
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

# Create a simple Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/talaria.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class BillingCycle(enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    billing_cycle = db.Column(db.Enum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    
    # Features
    features = db.Column(db.JSON, nullable=True)
    max_users = db.Column(db.Integer, nullable=True)
    max_projects = db.Column(db.Integer, nullable=True)
    storage_limit = db.Column(db.Integer, nullable=True)
    
    # Trial settings
    trial_days = db.Column(db.Integer, default=0)
    trial_price = db.Column(db.Float, default=0.0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def create_test_plans():
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
                'storage_limit': 1024,
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
                'storage_limit': 5120,
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
                'max_users': None,
                'max_projects': None,
                'storage_limit': 51200,
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
