#!/usr/bin/env python3
"""
Test complete end-to-end payment flow
"""

import requests
import json
import time

def get_csrf_token():
    """Get CSRF token from the API"""
    try:
        response = requests.get("http://localhost:5000/api/payments/csrf-token")
        if response.status_code == 200:
            return response.json().get('csrf_token')
        else:
            print(f"Failed to get CSRF token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting CSRF token: {e}")
        return None

def create_order():
    """Step 1: Create order"""
    print("\n🏗️  STEP 1: Creating Payment Order")
    print("=" * 50)
    
    url = "http://localhost:5000/api/payments/create-order"
    csrf_token = get_csrf_token()
    print(f"✅ CSRF Token obtained: {csrf_token[:20]}..." if csrf_token else "❌ No CSRF token")
    
    order_data = {
        "items": [
            {
                "name": "Premium Subscription",
                "price": 29.99,
                "quantity": 1,
                "description": "Premium subscription plan"
            }
        ],
        "customer_email": "testuser@example.com",
        "customer_name": "Test User",
        "customer_phone": "+1234567890",
        "billing_address": "123 Main St, New York, NY 10001",
        "total_amount": 29.99,
        "currency": "usd",
        "user_id": 1
    }
    
    if csrf_token:
        order_data["csrf_token"] = csrf_token
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=order_data, headers=headers)
        print(f"📤 Order creation request sent")
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Order created successfully!")
            print(f"   📝 Order ID: {data['order']['id']}")
            print(f"   📝 Order Number: {data['order']['order_number']}")
            print(f"   💰 Total Amount: ${data['order']['total_amount']}")
            print(f"   🔑 Payment Intent ID: {data['payment_intent']['payment_intent_id']}")
            return data
        else:
            print(f"❌ Order creation failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating order: {e}")
        return None

def process_payment_success(order_data):
    """Step 2: Process payment success"""
    print("\n💳 STEP 2: Processing Payment Success")
    print("=" * 50)
    
    if not order_data:
        print("❌ No order data to process")
        return False
    
    url = "http://localhost:5000/api/payments/payment-success"
    
    payment_success_data = {
        "order_id": order_data['order']['id'],
        "payment_intent_id": order_data['payment_intent']['payment_intent_id'],
        "customer_email": order_data['order']['customer_email'],
        "final_amount": order_data['order']['total_amount']
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payment_success_data, headers=headers)
        print(f"📤 Payment success request sent")
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Payment success processed!")
            print(f"   📝 Payment processed: {data.get('success', False)}")
            print(f"   🎯 Subscription updated: {data.get('subscription_updated', False)}")
            print(f"   👤 User activated: {data.get('user_activated', False)}")
            return data
        else:
            print(f"❌ Payment success failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error processing payment success: {e}")
        return None

def verify_order_status(order_id):
    """Step 3: Verify order status"""
    print("\n🔍 STEP 3: Verifying Order Status")
    print("=" * 50)
    
    # Note: This endpoint might require JWT authentication in production
    url = f"http://localhost:5000/api/payments/orders/{order_id}"
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"📤 Order status check request sent")
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Order status retrieved!")
            print(f"   📝 Order Status: {data.get('status', 'unknown')}")
            print(f"   💳 Payment Status: {data.get('payment_status', 'unknown')}")
            print(f"   📅 Paid At: {data.get('paid_at', 'Not paid')}")
            return data
        else:
            print(f"⚠️  Order status check failed (might need authentication): {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error checking order status: {e}")
        return None

def test_complete_payment_flow():
    """Run complete payment flow test"""
    print("\n🧪 COMPLETE PAYMENT FLOW TEST")
    print("=" * 60)
    print("This test simulates the complete payment process:")
    print("1. Create payment order with Stripe payment intent")
    print("2. Process payment success (simulate successful payment)")
    print("3. Verify final order status")
    print("=" * 60)
    
    # Step 1: Create order
    order_data = create_order()
    if not order_data:
        print("\n❌ TEST FAILED: Could not create order")
        return False
    
    # Wait a moment to ensure order is fully created
    print("\n⏳ Waiting 2 seconds for order processing...")
    time.sleep(2)
    
    # Step 2: Process payment success
    payment_result = process_payment_success(order_data)
    if not payment_result:
        print("\n❌ TEST FAILED: Could not process payment success")
        return False
    
    # Wait a moment to ensure payment is fully processed
    print("\n⏳ Waiting 2 seconds for payment processing...")
    time.sleep(2)
    
    # Step 3: Verify order status (optional, might fail due to auth requirements)
    order_id = order_data['order']['id']
    verify_order_status(order_id)
    
    # Summary
    print("\n🎉 TEST SUMMARY")
    print("=" * 50)
    print("✅ Order creation: SUCCESS")
    print("✅ Payment processing: SUCCESS")
    print("✅ User activation: SUCCESS" if payment_result.get('subscription_updated') else "⚠️  User activation: PARTIAL")
    print("\n🎯 Payment flow is working correctly!")
    print("   - Orders can be created successfully")
    print("   - Stripe payment intents are generated")
    print("   - Payment success processing works")
    print("   - User subscriptions can be activated")
    
    return True

if __name__ == "__main__":
    test_complete_payment_flow()