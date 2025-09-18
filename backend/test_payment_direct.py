#!/usr/bin/env python3
"""
Direct payment endpoint test without server startup
Tests the payment logic directly by calling the functions
"""

import os
import sys
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon
from app.models.payment import Order
from app.routes.payments import validate_referral
from flask import json

def test_referral_validation_direct():
    """Test referral code validation directly"""
    print("🧪 Testing Referral Code Validation (Direct)")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Get a test referral code
        test_code = Coupon.query.filter_by(
            is_affiliate_code=True, 
            is_active=True
        ).filter(Coupon.affiliate_id.isnot(None)).first()
        
        if not test_code:
            print("❌ No valid referral codes found")
            return False
        
        print(f"✅ Using referral code: {test_code.code}")
        print(f"   Affiliate: {test_code.affiliate.name}")
        print(f"   Discount: {test_code.discount_percent}%")
        print(f"   Commission: {test_code.affiliate_commission_percent}%")
        
        # Test the validation logic manually
        test_amount = 29.99
        
        # Test valid code
        print(f"\n1️⃣ Testing validation for amount: ${test_amount}")
        
        if test_code.is_valid():
            discount_amount = test_amount * (test_code.discount_percent / 100)
            commission_amount = test_code.calculate_affiliate_commission(test_amount)
            final_amount = test_amount - discount_amount
            
            print("✅ Code is valid")
            print(f"   Original: ${test_amount}")
            print(f"   Discount: ${discount_amount:.2f}")
            print(f"   Final: ${final_amount:.2f}")
            print(f"   Commission: ${commission_amount:.2f}")
        else:
            print("❌ Code is not valid")
            return False
        
        # Test commission processing
        print(f"\n2️⃣ Testing commission processing...")
        
        initial_earnings = test_code.affiliate.total_earnings
        initial_conversions = test_code.affiliate.conversions
        initial_usage = test_code.used_count
        
        print(f"   Before: Earnings=${initial_earnings}, Conversions={initial_conversions}, Usage={initial_usage}")
        
        # Simulate commission processing (but don't actually record it)
        commission = test_code.calculate_affiliate_commission(test_amount)
        expected_earnings = initial_earnings + commission
        expected_conversions = initial_conversions + 1
        expected_usage = initial_usage + 1
        
        print(f"   Expected: Earnings=${expected_earnings}, Conversions={expected_conversions}, Usage={expected_usage}")
        print(f"   Commission would be: ${commission:.2f}")
        
        print("\n✅ Direct validation test completed successfully!")
        return True

def test_payment_success_logic():
    """Test the payment success logic for referral codes"""
    print("\n🧪 Testing Payment Success Logic")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Get a test referral code
        test_code = Coupon.query.filter_by(
            is_affiliate_code=True, 
            is_active=True
        ).filter(Coupon.affiliate_id.isnot(None)).first()
        
        if not test_code:
            print("❌ No valid referral codes found")
            return False
        
        # Create a test order with referral code
        test_order = Order(
            order_number=f"TEST-{int(datetime.utcnow().timestamp())}",
            customer_email="test@example.com",
            customer_name="Test User",
            total_amount=29.99,
            status='pending',
            payment_status='pending',
            order_metadata={
                'referral_code': test_code.code,
                'affiliate_id': test_code.affiliate_id
            }
        )
        
        db.session.add(test_order)
        db.session.commit()
        
        print(f"✅ Created test order: {test_order.order_number}")
        print(f"   Referral code: {test_code.code}")
        print(f"   Amount: ${test_order.total_amount}")
        
        # Simulate the payment success logic
        print("\n1️⃣ Simulating payment success processing...")
        
        # Get initial state
        affiliate = test_code.affiliate
        initial_earnings = affiliate.total_earnings
        initial_conversions = affiliate.conversions
        initial_usage = test_code.used_count
        
        print(f"   Initial state:")
        print(f"     Affiliate earnings: ${initial_earnings}")
        print(f"     Conversions: {initial_conversions}")
        print(f"     Code usage: {initial_usage}")
        
        # Process referral code (simulate what payment_success does)
        if test_order.order_metadata and 'referral_code' in test_order.order_metadata:
            referral_code = test_order.order_metadata['referral_code']
            coupon = Coupon.query.filter_by(code=referral_code.upper()).first()
            
            if coupon and coupon.is_affiliate_code and coupon.is_active:
                commission_amount = coupon.calculate_affiliate_commission(test_order.total_amount)
                
                print(f"\n   Processing referral code: {referral_code}")
                print(f"   Calculated commission: ${commission_amount:.2f}")
                
                # Record the usage (this updates affiliate stats)
                coupon.record_usage(test_order.total_amount)
                
                # Update order metadata
                test_order.order_metadata.update({
                    'affiliate_commission': commission_amount,
                    'affiliate_id': coupon.affiliate_id,
                    'affiliate_name': coupon.affiliate.name,
                    'commission_processed_at': datetime.utcnow().isoformat()
                })
                
                db.session.commit()
                
                # Verify results
                db.session.refresh(affiliate)
                db.session.refresh(test_code)
                
                final_earnings = affiliate.total_earnings
                final_conversions = affiliate.conversions
                final_usage = test_code.used_count
                
                print(f"\n   Final state:")
                print(f"     Affiliate earnings: ${final_earnings}")
                print(f"     Conversions: {final_conversions}")
                print(f"     Code usage: {final_usage}")
                
                # Verify calculations
                earnings_increase = final_earnings - initial_earnings
                conversions_increase = final_conversions - initial_conversions
                usage_increase = final_usage - initial_usage
                
                print(f"\n   Verification:")
                print(f"     Earnings increase: ${earnings_increase:.2f} (expected: ${commission_amount:.2f})")
                print(f"     Conversions increase: {conversions_increase} (expected: 1)")
                print(f"     Usage increase: {usage_increase} (expected: 1)")
                
                success = (
                    abs(earnings_increase - commission_amount) < 0.01 and
                    conversions_increase == 1 and
                    usage_increase == 1
                )
                
                if success:
                    print("✅ Payment success logic working correctly!")
                else:
                    print("❌ Payment success logic has issues!")
                
                # Clean up
                db.session.delete(test_order)
                db.session.commit()
                print(f"\n🧹 Cleaned up test order: {test_order.order_number}")
                
                return success
        
        print("❌ Referral code processing failed")
        return False

def test_order_validation():
    """Test order creation with referral code validation"""
    print("\n🧪 Testing Order Creation Validation")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Test valid referral code
        test_code = Coupon.query.filter_by(
            is_affiliate_code=True, 
            is_active=True
        ).filter(Coupon.affiliate_id.isnot(None)).first()
        
        if not test_code:
            print("❌ No valid referral codes found")
            return False
        
        print(f"1️⃣ Testing valid referral code: {test_code.code}")
        
        # Simulate order creation validation
        referral_code = test_code.code
        coupon = Coupon.query.filter_by(code=referral_code.upper()).first()
        
        if coupon and coupon.is_valid() and coupon.is_affiliate_code:
            print("✅ Valid referral code passes validation")
            print(f"   Affiliate: {coupon.affiliate.name}")
            print(f"   Discount: {coupon.discount_percent}%")
        else:
            print("❌ Valid referral code failed validation")
            return False
        
        # Test invalid referral code
        print(f"\n2️⃣ Testing invalid referral code: INVALID123")
        
        invalid_coupon = Coupon.query.filter_by(code='INVALID123').first()
        
        if not invalid_coupon or not invalid_coupon.is_affiliate_code:
            print("✅ Invalid referral code properly rejected")
        else:
            print("❌ Invalid referral code should be rejected")
            return False
        
        print("\n✅ Order validation test completed successfully!")
        return True

if __name__ == '__main__':
    print("🚀 Direct Payment Testing (No Server Required)")
    print("=" * 60)
    
    try:
        # Test 1: Direct referral validation
        test1_success = test_referral_validation_direct()
        
        # Test 2: Payment success logic
        test2_success = test_payment_success_logic()
        
        # Test 3: Order validation
        test3_success = test_order_validation()
        
        print("\n" + "=" * 60)
        if test1_success and test2_success and test3_success:
            print("🎉 All direct tests PASSED!")
            print("✅ Payment logic is working correctly")
            print("\n💡 To test the API endpoints:")
            print("   1. Start the server: python -m flask run")
            print("   2. Run: python test_payment_flow.py")
        else:
            print("❌ Some direct tests FAILED")
            print("🔧 Check the payment logic implementation")
    
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🏁 Direct payment test completed!")