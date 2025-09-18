#!/usr/bin/env python3
"""
Test payment order creation endpoint
"""

import requests
import json

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

def test_create_order():
    url = "http://localhost:5000/api/payments/create-order"
    
    # Get CSRF token
    csrf_token = get_csrf_token()
    print(f"CSRF Token: {csrf_token[:20]}..." if csrf_token else "No CSRF token")
    
    # Sample order data with more realistic information to pass fraud detection
    order_data = {
        "items": [
            {
                "name": "Premium Subscription",
                "price": 29.99,
                "quantity": 1,
                "description": "Premium subscription plan"
            }
        ],
        "customer_email": "john.smith@gmail.com",
        "customer_name": "John Smith",
        "customer_phone": "+1234567890",
        "billing_address": "123 Main St, New York, NY 10001",
        "total_amount": 29.99,
        "currency": "usd",
        "user_id": 1
    }
    
    # Add CSRF token if available (not required in development)
    if csrf_token:
        order_data["csrf_token"] = csrf_token
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("Testing payment order creation...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(order_data, indent=2)}")
    
    try:
        response = requests.post(url, json=order_data, headers=headers)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
        except:
            print(response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_create_order()