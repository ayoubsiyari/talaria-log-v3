#!/usr/bin/env python3
"""
Test the complete payment flow
"""

import requests
import json
import time

def test_payment_flow():
    """Test the complete payment flow"""
    print("🧪 Testing complete payment flow...")
    
    base_url = "http://178.16.131.52:5000/api"
    
    # Step 1: Create an order
    print("\n1. Creating order...")
    order_data = {
        "customer_email": "test@example.com",
        "customer_name": "Test User",
        "items": [
            {
                "name": "Premium Subscription",
                "price": 99.99,
                "quantity": 1,
                "description": "Monthly premium subscription"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/payments/create-order",
            json=order_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 201:
            order = response.json()['order']
            print(f"✅ Order created: {order['id']}")
            
            # Step 2: Simulate payment success
            print("\n2. Simulating payment success...")
            payment_data = {
                "order_id": order['id'],
                "payment_intent_id": f"pi_test_{int(time.time())}",
                "customer_email": order['customer_email']
            }
            
            response = requests.post(
                f"{base_url}/payments/payment-success",
                json=payment_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"📊 Payment success response: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Payment success: {result}")
            else:
                print(f"❌ Payment success failed: {response.text}")
                
        else:
            print(f"❌ Order creation failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_payment_flow()

