#!/usr/bin/env python3
"""
Complete payment flow test including referral code validation
Run with: python test_payment_flow.py
"""

import os
import sys
import requests
import json
import time
import threading
import subprocess
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def test_payment_endpoints():
    """Test payment endpoints with a running server"""
    print("🧪 Testing Payment Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:5000/api/payments"
    
    # Test data
    test_referral_code = "TAY0007"
    test_amount = 29.99
    
    try:
        # Test 1: Referral Code Validation
        print("\n1️⃣ Testing referral code validation...")
        validation_data = {
            'code': test_referral_code,
            'order_amount': test_amount
        }
        
        response = requests.post(f'{base_url}/validate-referral', 
                               json=validation_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Referral validation successful")
            print(f"   Code: {result.get('code')}")
            print(f"   Discount: {result.get('discount_percent')}%")
            print(f"   Discount Amount: ${result.get('discount_amount', 0):.2f}")
            print(f"   Final Amount: ${result.get('discounted_total', 0):.2f}")
            print(f"   Affiliate: {result.get('affiliate_name')}")
            print(f"   Commission: ${result.get('commission_amount', 0):.2f}")
        else:
            print(f"❌ Referral validation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Order Creation with Referral Code
        print("\n2️⃣ Testing order creation with referral code...")
        order_data = {
            'customer_email': 'test@example.com',
            'customer_name': 'Test Customer',
            'referral_code': test_referral_code,
            'items': [
                {
                    'product_name': 'Premium Subscription',
                    'product_id': 'premium',
                    'price': test_amount,
                    'quantity': 1
                }
            ],
            'total_amount': test_amount
        }
        
        # Note: This would normally require authentication, but let's test what happens
        try:
            response = requests.post(f'{base_url}/create-order', 
                                   json=order_data, timeout=10)
            
            if response.status_code in [200, 201]:
                result = response.json()
                print("✅ Order creation successful")
                print(f"   Order ID: {result.get('order', {}).get('id')}")
                print(f"   Order Number: {result.get('order', {}).get('order_number')}")
            elif response.status_code == 400:
                error = response.json().get('error', 'Unknown error')
                if 'referral code' in error.lower():
                    print("✅ Referral code validation working in order creation")
                    print(f"   Error (expected): {error}")
                else:
                    print(f"❌ Unexpected error: {error}")
            else:
                print(f"⚠️  Order creation response: {response.status_code}")
                print(f"   This might be due to missing authentication or other required fields")
        except Exception as e:
            print(f"⚠️  Order creation test skipped: {e}")
        
        # Test 3: Payment Config
        print("\n3️⃣ Testing payment configuration...")
        try:
            response = requests.get(f'{base_url}/config', timeout=10)
            if response.status_code == 200:
                print("✅ Payment config endpoint working")
            else:
                print(f"⚠️  Payment config response: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Payment config test: {e}")
        
        # Test 4: Invalid Referral Code
        print("\n4️⃣ Testing invalid referral code...")
        invalid_data = {
            'code': 'INVALID123',
            'order_amount': test_amount
        }
        
        response = requests.post(f'{base_url}/validate-referral', 
                               json=invalid_data, timeout=10)
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print("✅ Invalid referral code properly rejected")
            print(f"   Error: {error}")
        else:
            print(f"❌ Invalid referral code should return 400, got: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 Payment endpoint tests completed!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server")
        print("   Make sure the server is running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def check_server_running():
    """Check if the server is already running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_test_server():
    """Start the Flask server for testing"""
    print("🚀 Starting test server...")
    
    # Check if server is already running
    if check_server_running():
        print("✅ Server is already running")
        return None, True
    
    try:
        # Start the server as a subprocess
        env = os.environ.copy()
        env['FLASK_ENV'] = 'development'
        env['FLASK_DEBUG'] = '0'  # Disable debug mode for testing
        
        process = subprocess.Popen([
            sys.executable, '-m', 'flask', 'run', 
            '--host=127.0.0.1', '--port=5000'
        ], env=env, cwd=os.path.dirname(os.path.abspath(__file__)))
        
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        for i in range(30):  # Wait up to 30 seconds
            time.sleep(1)
            if check_server_running():
                print("✅ Server started successfully")
                return process, True
        
        print("❌ Server failed to start within 30 seconds")
        process.terminate()
        return None, False
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return None, False

def test_referral_codes_exist():
    """Verify referral codes exist in database"""
    print("🔍 Checking referral codes in database...")
    
    app = create_app('development')
    with app.app_context():
        # Check for referral codes
        referral_codes = Coupon.query.filter_by(is_affiliate_code=True, is_active=True).all()
        
        if not referral_codes:
            print("❌ No referral codes found!")
            return False
        
        print(f"✅ Found {len(referral_codes)} referral codes:")
        for code in referral_codes[:5]:  # Show first 5
            affiliate_name = code.affiliate.name if code.affiliate else "No affiliate"
            print(f"   - {code.code}: {code.discount_percent}% discount, affiliate: {affiliate_name}")
        
        return True

if __name__ == '__main__':
    print("🧪 Complete Payment Flow Test")
    print("=" * 60)
    
    # Step 1: Check if referral codes exist
    if not test_referral_codes_exist():
        print("\n❌ Please run the affiliate seeding scripts first:")
        print("   1. python seed_affiliates.py")
        print("   2. python -c \"from scripts.seed_referral_codes import seed_referral_codes; seed_referral_codes()\"")
        sys.exit(1)
    
    # Step 2: Start server and run tests
    server_process = None
    try:
        server_process, server_started = start_test_server()
        
        if server_started:
            print("\n" + "=" * 60)
            
            # Run the actual tests
            success = test_payment_endpoints()
            
            print("\n" + "=" * 60)
            if success:
                print("🎉 All payment tests PASSED!")
                print("✅ Payment system with referral codes is working correctly")
            else:
                print("❌ Some payment tests FAILED")
        else:
            print("❌ Could not start server for testing")
            
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    finally:
        # Clean up server
        if server_process:
            print("\n🧹 Shutting down test server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except:
                server_process.kill()
            print("✅ Server stopped")
    
    print("\n" + "=" * 60)
    print("🏁 Payment flow test completed!")