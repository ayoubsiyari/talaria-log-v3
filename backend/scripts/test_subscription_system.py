#!/usr/bin/env python3
"""
Simple test script to verify subscription system is working
"""

import requests
import json

def test_subscription_system():
    """Test the subscription system endpoints"""
    base_url = "http://localhost:5000/api"
    
    print("=== TESTING SUBSCRIPTION SYSTEM ===")
    
    # Test 1: Get subscription plans
    print("\n1. Testing GET /subscription/plans...")
    try:
        response = requests.get(f"{base_url}/subscription/plans")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('plans', []))} plans")
            for plan in data.get('plans', []):
                print(f"   - {plan.get('name')}: ${plan.get('price')}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Test CORS endpoint
    print("\n2. Testing CORS endpoint...")
    try:
        response = requests.get(f"{base_url}/subscription/test")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ CORS test successful")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n🎉 Subscription system test completed!")

if __name__ == '__main__':
    test_subscription_system()
