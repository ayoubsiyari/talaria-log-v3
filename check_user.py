#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app, db
from app.models.user import User
from app.models.subscription import UserSubscription, SubscriptionPlan

def check_user(email):
    app = create_app('production')
    with app.app_context():
        try:
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"❌ User {email} not found")
                return
            
            print(f"✅ User found: {user.email}")
            print(f"   ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Is Active: {user.is_active}")
            print(f"   Subscription Status: {user.subscription_status}")
            print(f"   Account Type: {user.account_type}")
            print(f"   Created: {user.created_at}")
            print(f"   Last Login: {user.last_login}")
            
            # Check active subscription
            subscription = UserSubscription.query.filter_by(user_id=user.id, is_active=True).first()
            if subscription:
                print(f"\n✅ Active Subscription Found:")
                print(f"   Subscription ID: {subscription.id}")
                print(f"   Plan ID: {subscription.plan_id}")
                print(f"   Start Date: {subscription.start_date}")
                print(f"   End Date: {subscription.end_date}")
                
                if subscription.plan:
                    print(f"   Plan Name: {subscription.plan.name}")
                    print(f"   Plan Type: {subscription.plan.plan_type}")
                    print(f"   Plan Price: {subscription.plan.price}")
                else:
                    print("   ❌ Plan not found")
            else:
                print(f"\n❌ No active subscription found")
                
                # Check all subscriptions for this user
                all_subs = UserSubscription.query.filter_by(user_id=user.id).all()
                if all_subs:
                    print(f"   Found {len(all_subs)} total subscriptions:")
                    for sub in all_subs:
                        print(f"     - ID: {sub.id}, Active: {sub.is_active}, Plan: {sub.plan_id}")
                else:
                    print("   No subscriptions at all")
                    
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_user("rimrima@gmail.com")

