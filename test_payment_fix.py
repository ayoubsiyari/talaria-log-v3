#!/usr/bin/env python3
"""
Test payment fix
"""

import requests
import json
import time

def test_payment_success():
    """Test the payment success endpoint"""
    print("🧪 Testing payment success endpoint...")
    
    # Test data
    test_data = {
        "order_id": "test_order_123",
        "payment_intent_id": "pi_test_123",
        "customer_email": "test@example.com"
    }
    
    # Make request to payment success endpoint
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

def test_login():
    """Test login endpoint"""
    print("🧪 Testing login endpoint...")
    
    # Test data
    test_data = {
        "email": "test@example.com",
        "password": "testpassword"
    }
    
    # Make request to login endpoint
    try:
        response = requests.post(
            "http://178.16.131.52:5000/api/auth/login",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login endpoint is working!")
            print(f"📊 Response: {response.json()}")
        elif response.status_code == 402:
            print("⚠️ Login requires payment (expected for test user)")
        else:
            print(f"❌ Login endpoint failed: {response.status_code}")
            print(f"📊 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")

def main():
    """Main test function"""
    print("🚀 Starting payment fix tests...")
    
    # Wait a bit for the application to start
    print("⏳ Waiting for application to start...")
    time.sleep(5)
    
    # Test payment success endpoint
    test_payment_success()
    
    # Test login endpoint
    test_login()
    
    print("🎉 Payment fix tests completed!")

if __name__ == "__main__":
    main()

