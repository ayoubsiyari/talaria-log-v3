#!/usr/bin/env python3
"""
Test script for Staff Log API endpoint
"""

import requests
import json
import sys
import os

# Add the parent directory to the path so we can import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_staff_log_api():
    """Test the staff log API endpoint"""
    
    # Base URL
    base_url = "http://localhost:5000"
    
    # Test login first
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    print(f"Login data: {login_data}")
    
    print("🔐 Testing login...")
    login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    
    print(f"Login response status: {login_response.status_code}")
    print(f"Login response text: {login_response.text}")
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    try:
        login_result = login_response.json()
        print(f"Login result: {login_result}")
        
        # Check if login was successful (different response format)
        if login_result.get('message') != 'Login successful':
            print(f"❌ Login failed: {login_result.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ Failed to parse login response: {e}")
        return False
    
    access_token = login_result.get('access_token')
    print(f"✅ Login successful! Token: {access_token[:20]}...")
    
    # Test staff log endpoint
    print("\n📊 Testing Staff Log API...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test the assignments endpoint
    assignments_response = requests.get(f"{base_url}/api/support/assignments", headers=headers)
    
    print(f"Status Code: {assignments_response.status_code}")
    print(f"Response Headers: {dict(assignments_response.headers)}")
    
    if assignments_response.status_code == 200:
        result = assignments_response.json()
        print(f"✅ Staff Log API working!")
        print(f"Success: {result.get('success')}")
        print(f"Total assignments: {result.get('total', 0)}")
        print(f"Assignments: {len(result.get('assignments', []))}")
        
        if result.get('assignments'):
            print("\n📋 Sample assignment:")
            sample = result['assignments'][0]
            for key, value in sample.items():
                print(f"  {key}: {value}")
        
        return True
    else:
        print(f"❌ Staff Log API failed: {assignments_response.status_code}")
        print(f"Response: {assignments_response.text}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Staff Log API Endpoint")
    print("=" * 50)
    
    try:
        success = test_staff_log_api()
        if success:
            print("\n🎉 All tests passed!")
        else:
            print("\n💥 Tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test failed with exception: {str(e)}")
        sys.exit(1)
