#!/usr/bin/env python3
"""Test complete referral flow: generation -> order creation -> payment success"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon
from app.models.payment import Order
from datetime import datetime
import json

def test_referral_code_generation():
    """Test generating new referral codes"""
    print("🧪 Testing Referral Code Generation")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Get Taylor affiliate
        taylor = Affiliate.query.filter_by(name='taylor').first()
        if not taylor:
            print("❌ Taylor affiliate not found")
            return False
        
        print(f"Generating new referral code for {taylor.name}...")
        
        # Test auto-generated code
        try:
            new_code = Coupon.create_affiliate_code(
                affiliate_id=taylor.id,
                discount_percent=15,
                description="Test auto-generated code"
            )
            print(f"✅ Auto-generated code: {new_code.code}")
            print(f"   Discount: {new_code.discount_percent}%")
            print(f"   Commission: {new_code.affiliate_commission_percent}%")
            print(f"   Affiliate: {new_code.affiliate.name}")
            print(f"   Active: {new_code.is_active}")
        except Exception as e:
            print(f"❌ Auto-generation failed: {e}")
            return False
        
        # Test custom code
        try:
            custom_code = Coupon.create_affiliate_code(
                affiliate_id=taylor.id,
                code="TAYLOR2025",
                discount_percent=25,
                commission_percent=30,
                description="Custom test code"
            )
            print(f"✅ Custom code: {custom_code.code}")
            print(f"   Discount: {custom_code.discount_percent}%")
            print(f"   Commission: {custom_code.affiliate_commission_percent}%")
            print(f"   Affiliate: {custom_code.affiliate.name}")
            print(f"   Active: {custom_code.is_active}")
        except Exception as e:
            print(f"❌ Custom code generation failed: {e}")
            return False
        
        print("✅ Referral code generation working correctly!")
        return True

def test_order_creation_with_referral():
    """Test order creation with referral code (should increment referrals)"""
    print("\n🧪 Testing Order Creation with Referral Code")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Use existing TAY0007 code
        code = Coupon.query.filter_by(code='TAY0007').first()
        if not code:
            print("❌ TAY0007 code not found")
            return False
        
        affiliate = code.affiliate
        initial_referrals = affiliate.referrals
        initial_conversions = affiliate.conversions
        initial_earnings = affiliate.total_earnings
        initial_usage = code.used_count
        
        print(f"Before order creation:")
        print(f"  Code usage: {initial_usage}")
        print(f"  Referrals: {initial_referrals}")
        print(f"  Conversions: {initial_conversions}")
        print(f"  Earnings: ${initial_earnings}")
        
        # Simulate order creation (this should increment referrals)
        try:
            print(f"Recording referral usage for code: {code.code}")
            code.record_referral()
            
            # Refresh data
            db.session.refresh(affiliate)
            db.session.refresh(code)
            
            print(f"After order creation:")
            print(f"  Code usage: {code.used_count}")
            print(f"  Referrals: {affiliate.referrals}")
            print(f"  Conversions: {affiliate.conversions}")
            print(f"  Earnings: ${affiliate.total_earnings}")
            
            # Verify only referrals increased
            if (code.used_count == initial_usage + 1 and
                affiliate.referrals == initial_referrals + 1 and
                affiliate.conversions == initial_conversions and
                affiliate.total_earnings == initial_earnings):
                print("✅ Order creation correctly recorded referral only!")
                return True
            else:
                print("❌ Order creation logic has issues!")
                return False
                
        except Exception as e:
            print(f"❌ Order creation failed: {e}")
            return False

def test_payment_success_with_conversion():
    """Test payment success (should increment conversions and earnings)"""
    print("\n🧪 Testing Payment Success with Conversion")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        # Use TAY0007 code
        code = Coupon.query.filter_by(code='TAY0007').first()
        if not code:
            print("❌ TAY0007 code not found")
            return False
        
        affiliate = code.affiliate
        initial_referrals = affiliate.referrals
        initial_conversions = affiliate.conversions
        initial_earnings = affiliate.total_earnings
        
        print(f"Before payment success:")
        print(f"  Referrals: {initial_referrals}")
        print(f"  Conversions: {initial_conversions}")
        print(f"  Earnings: ${initial_earnings}")
        
        # Simulate payment success (this should increment conversions and earnings)
        try:
            amount = 49.99
            expected_commission = code.calculate_affiliate_commission(amount)
            print(f"Processing payment of ${amount} (expected commission: ${expected_commission:.2f})")
            
            code.record_conversion(amount)
            
            # Refresh data
            db.session.refresh(affiliate)
            
            print(f"After payment success:")
            print(f"  Referrals: {affiliate.referrals}")
            print(f"  Conversions: {affiliate.conversions}")
            print(f"  Earnings: ${affiliate.total_earnings}")
            print(f"  Conversion Rate: {affiliate.conversion_rate}%")
            print(f"  Performance: {affiliate.performance}")
            
            # Verify conversion was recorded correctly
            expected_earnings = initial_earnings + expected_commission
            if (affiliate.referrals == initial_referrals and  # referrals unchanged
                affiliate.conversions == initial_conversions + 1 and  # conversions +1
                abs(affiliate.total_earnings - expected_earnings) < 0.01):  # earnings increased
                print("✅ Payment success correctly recorded conversion!")
                return True
            else:
                print("❌ Payment success logic has issues!")
                return False
                
        except Exception as e:
            print(f"❌ Payment success failed: {e}")
            return False

def test_conversion_rate_calculation():
    """Test that conversion rate is calculated correctly"""
    print("\n🧪 Testing Conversion Rate Calculation")
    print("=" * 50)
    
    app = create_app('development')
    
    with app.app_context():
        affiliate = Affiliate.query.filter_by(name='taylor').first()
        
        print(f"Current stats:")
        print(f"  Referrals: {affiliate.referrals}")
        print(f"  Conversions: {affiliate.conversions}")
        print(f"  Conversion Rate: {affiliate.conversion_rate}%")
        print(f"  Performance: {affiliate.performance}")
        
        # Add another referral without conversion to test the calculation
        code = Coupon.query.filter_by(code='TAY0007').first()
        if code:
            code.record_referral()
        else:
            print("❌ TAY0007 code not found")
            return False
        
        db.session.refresh(affiliate)
        
        print(f"After adding another referral (no conversion):")
        print(f"  Referrals: {affiliate.referrals}")
        print(f"  Conversions: {affiliate.conversions}")
        print(f"  Conversion Rate: {affiliate.conversion_rate}%")
        print(f"  Performance: {affiliate.performance}")
        
        # Calculate expected conversion rate
        if affiliate.referrals > 0:
            expected_rate = round((affiliate.conversions / affiliate.referrals) * 100, 1)
            if abs(affiliate.conversion_rate - expected_rate) < 0.1:
                print(f"✅ Conversion rate calculated correctly: {affiliate.conversion_rate}%")
                return True
            else:
                print(f"❌ Conversion rate incorrect. Expected: {expected_rate}%, Got: {affiliate.conversion_rate}%")
                return False
        else:
            print("❌ No referrals to calculate conversion rate")
            return False

def main():
    print("🚀 Testing Complete Referral Flow")
    print("=" * 60)
    
    try:
        # Test 1: Generate referral codes
        test1_success = test_referral_code_generation()
        
        # Test 2: Order creation (referral tracking)  
        test2_success = test_order_creation_with_referral()
        
        # Test 3: Payment success (conversion tracking)
        test3_success = test_payment_success_with_conversion()
        
        # Test 4: Conversion rate calculation
        test4_success = test_conversion_rate_calculation()
        
        print("\n" + "=" * 60)
        if all([test1_success, test2_success, test3_success, test4_success]):
            print("🎉 All tests PASSED!")
            print("✅ Complete referral flow is working correctly")
            print("\n📊 Flow Summary:")
            print("1. ✅ Code generation works")
            print("2. ✅ Order creation records referrals")  
            print("3. ✅ Payment success records conversions & earnings")
            print("4. ✅ Conversion rates calculate correctly")
        else:
            print("❌ Some tests FAILED")
            results = [
                ("Code generation", test1_success),
                ("Order creation", test2_success), 
                ("Payment success", test3_success),
                ("Conversion rate", test4_success)
            ]
            for test_name, passed in results:
                status = "✅" if passed else "❌"
                print(f"   {status} {test_name}")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🏁 Complete referral flow test completed!")

if __name__ == '__main__':
    main()