#!/usr/bin/env python3
"""
Test script to check login endpoint
"""

import requests
import json

def test_login():
    """Test the login endpoint"""
    base_url = "http://localhost:5000/api"
    
    print("=== TESTING LOGIN ENDPOINT ===")
    
    # Test 1: Check if server is running
    print("\n1. Testing server connectivity...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print(f"❌ Server error: {response.text}")
    except Exception as e:
        print(f"❌ Server connection error: {e}")
        return
    
    # Test 2: Test login endpoint
    print("\n2. Testing login endpoint...")
    try:
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful")
        elif response.status_code == 401:
            print("❌ Invalid credentials")
        elif response.status_code == 500:
            print("❌ Server error during login")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Login test error: {e}")
    
    print("\n🎉 Login test completed!")

if __name__ == '__main__':
    test_login()
