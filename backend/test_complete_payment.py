#!/usr/bin/env python3
"""
Test the complete payment flow including user activation
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.payment import Order

def test_user_payment_flow():
    """Test the complete payment flow that simulates what frontend test payment does"""
    print("🧪 Testing Complete Payment Flow")
    print("=" * 60)
    
    app = create_app('development')
    base_url = "http://localhost:5000/api"
    
    with app.app_context():
        # Step 1: Find a pending user to test with
        pending_users = User.query.filter_by(subscription_status='pending', is_active=False).limit(5).all()
        
        if not pending_users:
            print("❌ No pending users found. Creating a test user...")
            
            # Create a test user
            test_user = User(
                email=f"test_{int(datetime.utcnow().timestamp())}@example.com",
                username=f"testuser_{int(datetime.utcnow().timestamp())}",
                password_hash="dummy_hash",
                first_name="Test",
                last_name="User",
                subscription_status='pending',
                is_active=False
            )
            
            db.session.add(test_user)
            db.session.commit()
            
            test_user_email = test_user.email
            print(f"✅ Created test user: {test_user_email}")
        else:
            test_user = pending_users[0]
            test_user_email = test_user.email
            print(f"✅ Using existing pending user: {test_user_email}")
        
        print(f"📋 Initial user state:")
        print(f"   Email: {test_user.email}")
        print(f"   Active: {test_user.is_active}")
        print(f"   Subscription: {test_user.subscription_status}")
        
    # Step 2: Test the complete flow via API (simulating what frontend does)
    try:
        print(f"\n🔧 Testing payment flow for user: {test_user_email}")
        
        # Create order
        print("1️⃣ Creating order...")
        order_data = {
            'customer_email': test_user_email,
            'customer_name': 'Test User',
            'items': [
                {
                    'name': 'Premium Subscription',
                    'price': 29.99,
                    'quantity': 1,
                    'description': 'Test subscription purchase'
                }
            ]
        }
        
        response = requests.post(f'{base_url}/payments/create-order', json=order_data, timeout=10)
        
        if response.status_code in [200, 201]:
            order_result = response.json()
            print("✅ Order created successfully")
            print(f"   Order ID: {order_result['order']['id']}")
            print(f"   Order Number: {order_result['order']['order_number']}")
            order_id = order_result['order']['id']
        else:
            print(f"❌ Order creation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        # Process payment success
        print("\n2️⃣ Processing payment success...")
        payment_data = {
            'order_id': order_id,
            'payment_intent_id': f'pi_test_{int(datetime.utcnow().timestamp())}',
            'customer_email': test_user_email,
            'final_amount': 29.99
        }
        
        response = requests.post(f'{base_url}/payments/payment-success', json=payment_data, timeout=10)
        
        if response.status_code == 200:
            payment_result = response.json()
            print("✅ Payment success processed")
            print(f"   Success: {payment_result.get('success')}")
            print(f"   Subscription Updated: {payment_result.get('subscription_updated')}")
            print(f"   User Activated: {payment_result.get('user_activated')}")
            
            if payment_result.get('referral_code_processed'):
                print(f"   Referral Code Processed: {payment_result.get('referral_code_processed')}")
                if payment_result.get('affiliate_commission'):
                    comm = payment_result.get('affiliate_commission')
                    print(f"   Affiliate Commission: ${comm.get('amount', 0):.2f} for {comm.get('affiliate_name')}")
        else:
            print(f"❌ Payment success failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        # Step 3: Verify user was activated
        print("\n3️⃣ Verifying user activation...")
        with app.app_context():
            # Refresh user from database
            updated_user = User.query.filter_by(email=test_user_email).first()
            
            if updated_user:
                print(f"📋 Final user state:")
                print(f"   Email: {updated_user.email}")
                print(f"   Active: {updated_user.is_active}")
                print(f"   Subscription: {updated_user.subscription_status}")
                print(f"   Plan: {updated_user.subscription_plan}")
                print(f"   Admin: {updated_user.is_admin}")
                
                if updated_user.is_active and updated_user.subscription_status == 'active':
                    print("🎉 USER SUCCESSFULLY ACTIVATED!")
                    print("✅ The user can now log in with an active subscription")
                    return True
                else:
                    print("❌ User was not properly activated")
                    return False
            else:
                print("❌ Could not find user after payment")
                return False
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the server is running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Complete Payment Flow Test")
    print("=" * 60)
    print("ℹ️  This simulates exactly what the frontend test payment button does")
    print("=" * 60)
    
    success = test_user_payment_flow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 COMPLETE PAYMENT FLOW TEST PASSED!")
        print("✅ Users will be properly activated when they use the test payment button")
        print("✅ They can then log in with an active subscription")
    else:
        print("❌ PAYMENT FLOW TEST FAILED!")
        print("🔧 Check the server logs and payment endpoints")
    
    print("=" * 60)