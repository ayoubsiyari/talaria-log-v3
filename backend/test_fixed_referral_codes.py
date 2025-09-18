#!/usr/bin/env python3
"""
Test the fixed referral codes to ensure they now properly track usage
"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def test_fixed_referral_code():
    """Test a previously orphaned referral code"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing Fixed Referral Code Usage")
        print("=" * 50)
        
        # Test STO0005 (previously orphaned)
        test_code = Coupon.query.filter_by(code='STO0005').first()
        if not test_code:
            print("❌ STO0005 code not found")
            return False
        
        print(f"Testing code: {test_code.code}")
        print(f"Affiliate: {test_code.affiliate.name if test_code.affiliate else 'None'}")
        print(f"Discount: {test_code.discount_percent}%")
        print(f"Commission: {test_code.affiliate_commission_percent}%")
        
        # Get initial state
        affiliate = test_code.affiliate
        initial_referrals = affiliate.referrals
        initial_conversions = affiliate.conversions
        initial_earnings = affiliate.total_earnings
        initial_usage = test_code.used_count
        
        print(f"\n📊 Initial State:")
        print(f"   Code usage: {initial_usage}")
        print(f"   Affiliate referrals: {initial_referrals}")
        print(f"   Affiliate conversions: {initial_conversions}")
        print(f"   Affiliate earnings: ${initial_earnings}")
        
        # Test 1: Record a referral (order creation)
        print(f"\n1️⃣ Testing order creation (referral tracking)...")
        try:
            test_code.record_referral()
            
            # Refresh the data
            db.session.refresh(test_code)
            db.session.refresh(affiliate)
            
            print(f"   Code usage: {test_code.used_count} (expected: {initial_usage + 1})")
            print(f"   Affiliate referrals: {affiliate.referrals} (expected: {initial_referrals + 1})")
            print(f"   Affiliate conversions: {affiliate.conversions} (expected: {initial_conversions})")
            print(f"   Affiliate earnings: ${affiliate.total_earnings} (expected: ${initial_earnings})")
            
            # Verify referral was recorded correctly
            if (test_code.used_count == initial_usage + 1 and
                affiliate.referrals == initial_referrals + 1 and
                affiliate.conversions == initial_conversions and
                affiliate.total_earnings == initial_earnings):
                print("   ✅ Referral tracking working correctly!")
                referral_test_passed = True
            else:
                print("   ❌ Referral tracking has issues!")
                referral_test_passed = False
            
        except Exception as e:
            print(f"   ❌ Error during referral test: {e}")
            referral_test_passed = False
        
        # Test 2: Record a conversion (payment success)
        print(f"\n2️⃣ Testing payment success (conversion tracking)...")
        try:
            test_amount = 29.99
            expected_commission = test_code.calculate_affiliate_commission(test_amount)
            
            print(f"   Processing payment of ${test_amount}")
            print(f"   Expected commission: ${expected_commission:.2f}")
            
            # Get current state before conversion
            current_referrals = affiliate.referrals
            current_conversions = affiliate.conversions
            current_earnings = affiliate.total_earnings
            
            test_code.record_conversion(test_amount)
            
            # Refresh the data
            db.session.refresh(affiliate)
            
            print(f"   Affiliate referrals: {affiliate.referrals} (expected: {current_referrals})")
            print(f"   Affiliate conversions: {affiliate.conversions} (expected: {current_conversions + 1})")
            print(f"   Affiliate earnings: ${affiliate.total_earnings} (expected: ${current_earnings + expected_commission:.2f})")
            
            # Verify conversion was recorded correctly
            expected_final_earnings = current_earnings + expected_commission
            if (affiliate.referrals == current_referrals and
                affiliate.conversions == current_conversions + 1 and
                abs(affiliate.total_earnings - expected_final_earnings) < 0.01):
                print("   ✅ Conversion tracking working correctly!")
                conversion_test_passed = True
            else:
                print("   ❌ Conversion tracking has issues!")
                conversion_test_passed = False
            
        except Exception as e:
            print(f"   ❌ Error during conversion test: {e}")
            conversion_test_passed = False
        
        # Test 3: Test validation in order creation context
        print(f"\n3️⃣ Testing order creation validation...")
        try:
            # Simulate what happens in the payment route
            if test_code.is_valid() and test_code.is_affiliate_code and test_code.affiliate:
                print(f"   ✅ Code passes validation checks")
                print(f"   ✅ Is affiliate code: {test_code.is_affiliate_code}")
                print(f"   ✅ Has affiliate: {test_code.affiliate.name}")
                validation_test_passed = True
            else:
                print(f"   ❌ Code fails validation checks")
                validation_test_passed = False
        except Exception as e:
            print(f"   ❌ Error during validation test: {e}")
            validation_test_passed = False
        
        # Summary
        print(f"\n📋 Test Summary:")
        print(f"   Referral tracking: {'✅ PASS' if referral_test_passed else '❌ FAIL'}")
        print(f"   Conversion tracking: {'✅ PASS' if conversion_test_passed else '❌ FAIL'}")
        print(f"   Validation: {'✅ PASS' if validation_test_passed else '❌ FAIL'}")
        
        overall_success = referral_test_passed and conversion_test_passed and validation_test_passed
        
        if overall_success:
            print(f"\n🎉 {test_code.code} is now working correctly!")
            print(f"   - Discounts will be applied ✅")
            print(f"   - Referrals will be tracked ✅") 
            print(f"   - Conversions will be tracked ✅")
            print(f"   - Commissions will be calculated ✅")
        else:
            print(f"\n❌ {test_code.code} still has issues")
        
        return overall_success

if __name__ == '__main__':
    print("🚀 Testing Fixed Referral Codes")
    print("=" * 60)
    
    try:
        success = test_fixed_referral_code()
        print("\n" + "=" * 60)
        if success:
            print("🎉 SUCCESS: The orphaned referral code fix is working!")
            print("✅ Users can now use referral codes and tracking will work properly")
        else:
            print("❌ FAILURE: There are still issues with referral code tracking")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()