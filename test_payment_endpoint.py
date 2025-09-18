#!/usr/bin/env python3
"""
Test payment endpoint directly
"""

import requests
import json

def test_payment_success():
    """Test the payment success endpoint"""
    print("🧪 Testing payment success endpoint...")
    
    # Test data that matches what frontend sends
    test_data = {
        "order_id": "test_order_123",
        "payment_intent_id": "pi_test_123",
        "customer_email": "test@example.com"
    }
    
    try:
        response = requests.post(
            "http://178.16.131.52:5000/api/payments/payment-success",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Payment success endpoint is working!")
            print(f"📊 Response: {response.json()}")
        else:
            print(f"❌ Payment success endpoint failed: {response.status_code}")
            print(f"📊 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing payment success: {e}")

def test_payment_debug():
    """Test the payment debug endpoint"""
    print("🧪 Testing payment debug endpoint...")
    
    test_data = {"test": "data"}
    
    try:
        response = requests.post(
            "http://178.16.131.52:5000/api/payments/payment-debug",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Debug response status: {response.status_code}")
        print(f"📊 Debug response: {response.text}")
        
    except Exception as e:
        print(f"❌ Error testing debug endpoint: {e}")

if __name__ == "__main__":
    print("🚀 Starting payment endpoint tests...")
    test_payment_debug()
    test_payment_success()
    print("🎉 Tests completed!")

