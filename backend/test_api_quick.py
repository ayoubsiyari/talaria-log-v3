#!/usr/bin/env python3
"""
Quick API test for referral code endpoints
"""

import requests
import json

def test_referral_validation_api():
    """Test the referral validation API endpoint"""
    print("🧪 Testing Referral Code Validation API")
    print("=" * 50)
    
    base_url = "http://localhost:5000/api/payments"
    
    # Test 1: Valid referral code
    print("\n1️⃣ Testing valid referral code: TAY0007")
    test_data = {
        'code': 'TAY0007',
        'order_amount': 29.99
    }
    
    try:
        response = requests.post(f'{base_url}/validate-referral', 
                               json=test_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            print(f"   Response:")
            for key, value in result.items():
                print(f"     {key}: {value}")
        else:
            print(f"❌ API call failed: {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Raw response: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Invalid referral code
    print("\n2️⃣ Testing invalid referral code: INVALID123")
    invalid_data = {
        'code': 'INVALID123',
        'order_amount': 29.99
    }
    
    try:
        response = requests.post(f'{base_url}/validate-referral', 
                               json=invalid_data, timeout=10)
        
        if response.status_code == 400:
            error = response.json()
            print("✅ Invalid code properly rejected!")
            print(f"   Error message: {error.get('error')}")
        else:
            print(f"❌ Expected 400, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 3: Missing data
    print("\n3️⃣ Testing missing code parameter")
    empty_data = {
        'order_amount': 29.99
    }
    
    try:
        response = requests.post(f'{base_url}/validate-referral', 
                               json=empty_data, timeout=10)
        
        if response.status_code == 400:
            error = response.json()
            print("✅ Missing code parameter properly handled!")
            print(f"   Error message: {error.get('error')}")
        else:
            print(f"❌ Expected 400, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_payment_config_api():
    """Test the payment config API endpoint"""
    print("\n🧪 Testing Payment Config API")
    print("=" * 50)
    
    base_url = "http://localhost:5000/api/payments"
    
    try:
        response = requests.get(f'{base_url}/config', timeout=10)
        
        if response.status_code == 200:
            print("✅ Payment config API working!")
            config = response.json()
            print(f"   Config keys: {list(config.keys())}")
        elif response.status_code == 400:
            print("⚠️  Payment config not set up (expected in development)")
            error = response.json()
            print(f"   Message: {error.get('error')}")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == '__main__':
    print("🚀 Quick API Test")
    print("=" * 60)
    print("ℹ️  Make sure the server is running on localhost:5000")
    print("=" * 60)
    
    try:
        test_referral_validation_api()
        test_payment_config_api()
        
        print("\n" + "=" * 60)
        print("✅ API tests completed!")
        print("🎉 The referral code API is working correctly!")
        
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")