#!/usr/bin/env python3
"""
Test script to verify the referral code flow functionality
Run with: python test_referral_flow.py
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon
from app.models.payment import Order

def test_referral_code_flow():
    """Test the complete referral code flow"""
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    with app.app_context():
        print("🧪 Testing Referral Code Flow")
        print("=" * 50)
        
        # Step 1: Verify we have affiliates and referral codes
        affiliates = Affiliate.query.filter_by(status='active').all()
        print(f"📊 Found {len(affiliates)} active affiliates")
        
        if not affiliates:
            print("❌ No active affiliates found. Run seed_affiliates.py and seed referral codes first")
            return False
        
        # Step 2: Get referral codes
        referral_codes = Coupon.query.filter_by(is_affiliate_code=True, is_active=True).all()
        print(f"📊 Found {len(referral_codes)} active referral codes")
        
        if not referral_codes:
            print("❌ No active referral codes found. Generate referral codes first")
            return False
        
        # Step 3: Test with the first referral code that has an affiliate
        test_code = None
        affiliate = None
        
        for code in referral_codes:
            if code.affiliate_id and code.affiliate:
                test_code = code
                affiliate = code.affiliate
                break
        
        if not test_code or not affiliate:
            print("❌ No referral codes with valid affiliate found. Check the seeded data")
            return False
        
        print(f"\n🧪 Testing with referral code: {test_code.code}")
        print(f"   Affiliate: {affiliate.name}")
        print(f"   Discount: {test_code.discount_percent}%")
        print(f"   Commission: {test_code.affiliate_commission_percent}%")
        
        # Step 4: Test code validation
        print("\n1️⃣ Testing referral code validation...")
        
        # Simulate validation request
        test_amount = 29.99
        discount_amount = test_amount * (test_code.discount_percent / 100)
        commission_amount = test_code.calculate_affiliate_commission(test_amount)
        
        print(f"   Original amount: ${test_amount}")
        print(f"   Discount amount: ${discount_amount:.2f}")
        print(f"   Final amount: ${test_amount - discount_amount:.2f}")
        print(f"   Expected commission: ${commission_amount:.2f}")
        
        # Step 5: Test order creation with referral code
        print("\n2️⃣ Testing order creation...")
        
        # Create a test order with referral code
        test_order = Order(
            order_number=f"TEST-{int(datetime.utcnow().timestamp())}",
            customer_email="test@example.com",
            customer_name="Test User",
            total_amount=test_amount,
            status='pending',
            payment_status='pending',
            order_metadata={
                'referral_code': test_code.code,
                'affiliate_id': affiliate.id
            }
        )
        
        db.session.add(test_order)
        db.session.commit()
        print(f"   Created test order: {test_order.order_number}")
        
        # Step 6: Simulate payment success and test commission processing
        print("\n3️⃣ Testing commission processing...")
        
        # Record initial affiliate stats
        initial_earnings = affiliate.total_earnings
        initial_conversions = affiliate.conversions
        initial_usage_count = test_code.used_count
        
        print(f"   Initial affiliate earnings: ${initial_earnings}")
        print(f"   Initial conversions: {initial_conversions}")
        print(f"   Initial code usage: {initial_usage_count}")
        
        # Process the referral code usage (simulate payment success)
        test_code.record_usage(test_amount)
        db.session.refresh(affiliate)  # Refresh to get updated values
        db.session.refresh(test_code)
        
        # Verify the results
        final_earnings = affiliate.total_earnings
        final_conversions = affiliate.conversions
        final_usage_count = test_code.used_count
        
        print(f"   Final affiliate earnings: ${final_earnings}")
        print(f"   Final conversions: {final_conversions}")
        print(f"   Final code usage: {final_usage_count}")
        
        # Step 7: Verify calculations
        print("\n4️⃣ Verifying calculations...")
        
        earnings_increase = final_earnings - initial_earnings
        conversions_increase = final_conversions - initial_conversions
        usage_increase = final_usage_count - initial_usage_count
        
        print(f"   Earnings increase: ${earnings_increase:.2f} (expected: ${commission_amount:.2f})")
        print(f"   Conversions increase: {conversions_increase} (expected: 1)")
        print(f"   Usage increase: {usage_increase} (expected: 1)")
        
        # Check if calculations are correct
        success = True
        if abs(earnings_increase - commission_amount) > 0.01:  # Allow for small floating point differences
            print("   ❌ Earnings calculation incorrect!")
            success = False
        else:
            print("   ✅ Earnings calculation correct")
        
        if conversions_increase != 1:
            print("   ❌ Conversions not incremented!")
            success = False
        else:
            print("   ✅ Conversions incremented correctly")
        
        if usage_increase != 1:
            print("   ❌ Usage count not incremented!")
            success = False
        else:
            print("   ✅ Usage count incremented correctly")
        
        # Step 8: Test updated performance rating
        print(f"\n5️⃣ Testing performance calculations...")
        affiliate.update_conversion_rate()
        affiliate.calculate_performance()
        
        print(f"   Conversion rate: {affiliate.conversion_rate}%")
        print(f"   Performance rating: {affiliate.performance}")
        
        # Clean up test order
        db.session.delete(test_order)
        db.session.commit()
        print(f"\n🧹 Cleaned up test order: {test_order.order_number}")
        
        print("\n" + "=" * 50)
        if success:
            print("🎉 All referral code tests PASSED!")
            print("✅ Affiliate commission system is working correctly")
        else:
            print("❌ Some tests FAILED - check the calculations above")
        
        return success

def test_api_endpoints():
    """Test the API endpoints (requires running server)"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 50)
    print("ℹ️  Note: Server must be running on localhost:5000 for API tests")
    
    try:
        # Test referral code validation endpoint
        test_data = {
            'code': 'TAY0007',  # Sample code that exists with affiliate
            'order_amount': 29.99
        }
        
        response = requests.post('http://localhost:5000/api/payments/validate-referral', 
                               json=test_data, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Referral validation endpoint working")
            print(f"   Code: {result.get('code')}")
            print(f"   Discount: {result.get('discount_percent')}%")
            print(f"   Affiliate: {result.get('affiliate_name')}")
        else:
            print(f"❌ Referral validation endpoint failed: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not test API endpoints: {e}")
        print("   Make sure the server is running on localhost:5000")

if __name__ == '__main__':
    print("🚀 Starting Referral Code Flow Tests")
    print("=" * 60)
    
    success = test_referral_code_flow()
    test_api_endpoints()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Test completed successfully!")
        print("✅ The referral code system is ready for production use")
    else:
        print("❌ Test completed with errors")
        print("🔧 Please fix the issues before using the system")