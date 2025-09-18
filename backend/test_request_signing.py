#!/usr/bin/env python3
"""
Test request signing to verify frontend/backend compatibility
"""

import requests
import json
import time
import hmac
import hashlib

def generate_signature(data_str, secret_key, timestamp):
    """Generate HMAC signature (matching backend logic)"""
    payload = f"{timestamp}:{data_str}"
    signature = hmac.new(
        secret_key.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature

def test_signed_payment_success():
    """Test payment success with proper request signing"""
    print("\n🔐 TESTING REQUEST SIGNING")
    print("=" * 50)
    
    # Test data
    test_data = {
        "order_id": 170,  # Use the order ID from our previous test
        "payment_intent_id": "pi_3S8oHD1KM2bTDpXu0TDC79W5",
        "customer_email": "testuser@example.com",
        "final_amount": 32.389199999999995
    }
    
    # Backend configuration
    secret_key = "your-secret-key-here"  # Must match backend SECRET_KEY
    timestamp = int(time.time())
    
    # Create JSON string exactly like backend does
    data_str = json.dumps(test_data, sort_keys=True, separators=(',', ':'))
    print(f"📋 Data string: {data_str}")
    
    # Generate signature
    signature = generate_signature(data_str, secret_key, timestamp)
    print(f"🔑 Signature: {signature}")
    print(f"⏰ Timestamp: {timestamp}")
    
    # Prepare request headers
    headers = {
        'Content-Type': 'application/json',
        'X-Request-Signature': signature,
        'X-Request-Timestamp': str(timestamp)
    }
    
    # Make signed request
    url = "http://localhost:5000/api/payments/payment-success"
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"\n📤 Signed request sent")
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Signed request successful!")
            print(f"   💳 Payment processed: {data.get('success', False)}")
            print(f"   🎯 Subscription updated: {data.get('subscription_updated', False)}")
            print(f"   👤 User activated: {data.get('user_activated', False)}")
            return True
        elif response.status_code == 403:
            print(f"❌ Request signature still invalid: {response.text}")
            return False
        elif response.status_code == 404:
            print(f"⚠️  Order not found (expected for old test data): {response.text}")
            print("✅ Request signing is working (just no matching order)")
            return True
        else:
            print(f"⚠️  Other error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error making signed request: {e}")
        return False

def test_unsigned_request():
    """Test that unsigned requests are properly rejected"""
    print("\n🚫 TESTING UNSIGNED REQUEST REJECTION")
    print("=" * 50)
    
    test_data = {
        "order_id": 170,
        "payment_intent_id": "pi_test_123",
        "customer_email": "test@example.com"
    }
    
    headers = {
        'Content-Type': 'application/json'
        # No signature headers
    }
    
    url = "http://localhost:5000/api/payments/payment-success"
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"📤 Unsigned request sent")
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ Unsigned request properly rejected!")
            print(f"   📝 Error: {response.json().get('error', 'Unknown')}")
            return True
        else:
            print(f"❌ Unsigned request was not rejected: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error making unsigned request: {e}")
        return False

if __name__ == "__main__":
    print("\n🧪 REQUEST SIGNING VERIFICATION TEST")
    print("=" * 60)
    print("This test verifies that request signing is working correctly")
    print("between the frontend and backend.")
    print("=" * 60)
    
    # Test 1: Unsigned request should be rejected
    unsigned_test = test_unsigned_request()
    
    # Test 2: Signed request should be accepted (or give proper error)
    signed_test = test_signed_payment_success()
    
    # Summary
    print("\n🎯 TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Unsigned request rejection: {'PASS' if unsigned_test else 'FAIL'}")
    print(f"✅ Signed request acceptance: {'PASS' if signed_test else 'FAIL'}")
    
    if unsigned_test and signed_test:
        print("\n🎉 Request signing is working correctly!")
        print("The frontend should now be able to make successful payment success requests.")
    else:
        print("\n❌ Request signing needs further debugging.")
        print("Check the signature generation logic and secret key matching.")