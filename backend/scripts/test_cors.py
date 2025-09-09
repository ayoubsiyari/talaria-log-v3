#!/usr/bin/env python3
"""
Script to test CORS functionality
"""

import requests
import json

def test_cors():
    """Test CORS functionality"""
    base_url = "http://localhost:5000"
    
    # Test 1: Simple GET request
    print("Testing simple GET request...")
    try:
        response = requests.get(f"{base_url}/api/subscription/test")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: OPTIONS request (preflight)
    print("Testing OPTIONS request (preflight)...")
    try:
        headers = {
            'Origin': 'http://localhost:5173',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
        response = requests.options(f"{base_url}/api/subscription/test", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 3: POST request with CORS headers
    print("Testing POST request with CORS headers...")
    try:
        headers = {
            'Origin': 'http://localhost:5173',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
        }
        data = {
            'name': 'Test Plan',
            'price': 29.99,
            'billing_cycle': 'monthly'
        }
        response = requests.post(f"{base_url}/api/subscription/plans", headers=headers, json=data)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    print("🚀 Testing CORS functionality...")
    test_cors()
    print("🎉 CORS test completed!")
