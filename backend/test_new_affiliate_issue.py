#!/usr/bin/env python3
"""
Test script to reproduce the new affiliate referral code tracking issue
"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def test_new_affiliate_referral_tracking():
    """Test creating a new affiliate and testing their referral codes"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing New Affiliate Referral Code Issue")
        print("=" * 60)
        
        # Step 1: Create a new affiliate (simulating the UI creation process)
        print("1️⃣ Creating a new affiliate...")
        
        # Check if test affiliate already exists
        existing_affiliate = Affiliate.query.filter_by(email='testpartner@example.com').first()
        if existing_affiliate:
            print("   🧹 Cleaning up existing test affiliate...")
            # Delete existing referral codes first
            Coupon.query.filter_by(affiliate_id=existing_affiliate.id).delete()
            db.session.delete(existing_affiliate)
            db.session.commit()
        
        # Create new affiliate exactly like the frontend does
        new_affiliate_data = {
            'name': 'Test Partner',
            'email': 'testpartner@example.com',
            'category': 'Influencer',
            'commission_rate': 25.0,
            'status': 'pending'  # New affiliates start as pending
        }
        
        new_affiliate = Affiliate(**new_affiliate_data)
        db.session.add(new_affiliate)
        db.session.commit()
        
        print(f"   ✅ Created affiliate: {new_affiliate.name}")
        print(f"      ID: {new_affiliate.id}")
        print(f"      Email: {new_affiliate.email}")
        print(f"      Status: {new_affiliate.status}")
        print(f"      Commission Rate: {new_affiliate.commission_rate}%")
        print(f"      Initial stats: Referrals={new_affiliate.referrals}, Conversions={new_affiliate.conversions}, Earnings=${new_affiliate.total_earnings}")
        
        # Step 2: Generate referral codes for the new affiliate
        print(f"\n2️⃣ Generating referral codes for new affiliate...")
        
        try:
            # Generate first code using the Coupon.create_affiliate_code method
            code1 = Coupon.create_affiliate_code(
                affiliate_id=new_affiliate.id,
                discount_percent=10,
                description="Test referral code for new affiliate"
            )
            print(f"   ✅ Generated code 1: {code1.code}")
            print(f"      Discount: {code1.discount_percent}%")
            print(f"      Commission: {code1.affiliate_commission_percent}%")
            print(f"      Is Active: {code1.is_active}")
            print(f"      Affiliate ID: {code1.affiliate_id}")
            print(f"      Affiliate Name: {code1.affiliate.name if code1.affiliate else 'None'}")
            
            # Generate second code with custom name
            code2 = Coupon.create_affiliate_code(
                affiliate_id=new_affiliate.id,
                code="TESTPARTNER2024",
                discount_percent=15,
                description="Custom test referral code"
            )
            print(f"   ✅ Generated code 2: {code2.code}")
            print(f"      Discount: {code2.discount_percent}%")
            print(f"      Commission: {code2.affiliate_commission_percent}%")
            print(f"      Is Active: {code2.is_active}")
            print(f"      Affiliate ID: {code2.affiliate_id}")
            print(f"      Affiliate Name: {code2.affiliate.name if code2.affiliate else 'None'}")
            
        except Exception as e:
            print(f"   ❌ Failed to generate referral codes: {e}")
            return False
        
        # Step 3: Test referral code validation and tracking
        print(f"\n3️⃣ Testing referral code validation...")
        
        # Test the first code
        test_code = code1
        print(f"   Testing code: {test_code.code}")
        
        # Check validation
        if test_code.is_valid():
            print(f"   ✅ Code validation: PASSED")
        else:
            print(f"   ❌ Code validation: FAILED")
            return False
        
        # Check affiliate link
        if test_code.is_affiliate_code and test_code.affiliate_id == new_affiliate.id:
            print(f"   ✅ Affiliate linking: PASSED")
        else:
            print(f"   ❌ Affiliate linking: FAILED")
            print(f"      is_affiliate_code: {test_code.is_affiliate_code}")
            print(f"      affiliate_id: {test_code.affiliate_id} (expected: {new_affiliate.id})")
            return False
        
        # Step 4: Test order creation with referral code (simulate the issue)
        print(f"\n4️⃣ Testing order creation with referral code...")
        
        # Get initial state
        initial_usage = test_code.used_count
        initial_referrals = new_affiliate.referrals
        initial_conversions = new_affiliate.conversions
        initial_earnings = new_affiliate.total_earnings
        
        print(f"   Initial state:")
        print(f"     Code usage: {initial_usage}")
        print(f"     Affiliate referrals: {initial_referrals}")
        print(f"     Affiliate conversions: {initial_conversions}")
        print(f"     Affiliate earnings: ${initial_earnings}")
        
        # Simulate order creation (this calls record_referral)
        try:
            print(f"   Recording referral usage (order creation)...")
            test_code.record_referral()
            
            # Refresh the objects to get updated values
            db.session.refresh(test_code)
            db.session.refresh(new_affiliate)
            
            print(f"   After order creation:")
            print(f"     Code usage: {test_code.used_count}")
            print(f"     Affiliate referrals: {new_affiliate.referrals}")
            print(f"     Affiliate conversions: {new_affiliate.conversions}")
            print(f"     Affiliate earnings: ${new_affiliate.total_earnings}")
            
            # Verify referral tracking worked
            if (test_code.used_count == initial_usage + 1 and
                new_affiliate.referrals == initial_referrals + 1 and
                new_affiliate.conversions == initial_conversions and
                new_affiliate.total_earnings == initial_earnings):
                print(f"   ✅ Order creation referral tracking: PASSED")
                order_tracking_success = True
            else:
                print(f"   ❌ Order creation referral tracking: FAILED")
                order_tracking_success = False
            
        except Exception as e:
            print(f"   ❌ Error during referral tracking: {e}")
            order_tracking_success = False
        
        # Step 5: Test payment success with conversion tracking
        print(f"\n5️⃣ Testing payment success with conversion tracking...")
        
        try:
            payment_amount = 49.99
            expected_commission = test_code.calculate_affiliate_commission(payment_amount)
            
            print(f"   Processing payment: ${payment_amount}")
            print(f"   Expected commission: ${expected_commission:.2f}")
            
            # Get current state before conversion
            current_referrals = new_affiliate.referrals
            current_conversions = new_affiliate.conversions
            current_earnings = new_affiliate.total_earnings
            
            # Record conversion (payment success)
            test_code.record_conversion(payment_amount)
            
            # Refresh objects
            db.session.refresh(new_affiliate)
            
            print(f"   After payment success:")
            print(f"     Affiliate referrals: {new_affiliate.referrals}")
            print(f"     Affiliate conversions: {new_affiliate.conversions}")
            print(f"     Affiliate earnings: ${new_affiliate.total_earnings}")
            
            # Verify conversion tracking
            expected_final_earnings = current_earnings + expected_commission
            if (new_affiliate.referrals == current_referrals and
                new_affiliate.conversions == current_conversions + 1 and
                abs(new_affiliate.total_earnings - expected_final_earnings) < 0.01):
                print(f"   ✅ Payment success conversion tracking: PASSED")
                payment_tracking_success = True
            else:
                print(f"   ❌ Payment success conversion tracking: FAILED")
                print(f"      Expected earnings: ${expected_final_earnings:.2f}, Got: ${new_affiliate.total_earnings:.2f}")
                payment_tracking_success = False
            
        except Exception as e:
            print(f"   ❌ Error during conversion tracking: {e}")
            payment_tracking_success = False
        
        # Step 6: Test the scenario you described - new partner codes not working
        print(f"\n6️⃣ Testing the reported issue scenario...")
        
        # Create another code to test the issue
        try:
            issue_test_code = Coupon.create_affiliate_code(
                affiliate_id=new_affiliate.id,
                code="NEWPARTNER2024",
                discount_percent=20,
                description="Testing the reported issue"
            )
            
            print(f"   Created test code: {issue_test_code.code}")
            print(f"   Checking all properties...")
            print(f"     Is Active: {issue_test_code.is_active}")
            print(f"     Is Affiliate Code: {issue_test_code.is_affiliate_code}")
            print(f"     Affiliate ID: {issue_test_code.affiliate_id}")
            print(f"     Affiliate Object: {issue_test_code.affiliate.name if issue_test_code.affiliate else 'None'}")
            print(f"     Commission Rate: {issue_test_code.affiliate_commission_percent}%")
            
            # Test validation and discount application
            test_amount = 100.0
            if issue_test_code.is_valid():
                discount = test_amount * (issue_test_code.discount_percent / 100)
                final_amount = test_amount - discount
                commission = issue_test_code.calculate_affiliate_commission(test_amount)
                
                print(f"   Discount Calculation Test:")
                print(f"     Original: ${test_amount}")
                print(f"     Discount: ${discount}")
                print(f"     Final: ${final_amount}")
                print(f"     Commission: ${commission}")
                
                if discount > 0 and commission > 0:
                    print(f"   ✅ Discount and commission calculation: WORKING")
                    discount_works = True
                else:
                    print(f"   ❌ Discount or commission calculation: NOT WORKING")
                    discount_works = False
            else:
                print(f"   ❌ Code validation failed")
                discount_works = False
            
        except Exception as e:
            print(f"   ❌ Error creating issue test code: {e}")
            discount_works = False
        
        # Summary
        print(f"\n" + "=" * 60)
        print(f"📋 Test Summary for New Affiliate:")
        print(f"   Affiliate Creation: ✅ PASSED")
        print(f"   Code Generation: ✅ PASSED")
        print(f"   Code Validation: ✅ PASSED")
        print(f"   Discount Calculation: {'✅ PASSED' if discount_works else '❌ FAILED'}")
        print(f"   Referral Tracking (Order): {'✅ PASSED' if order_tracking_success else '❌ FAILED'}")
        print(f"   Conversion Tracking (Payment): {'✅ PASSED' if payment_tracking_success else '❌ FAILED'}")
        
        overall_success = discount_works and order_tracking_success and payment_tracking_success
        
        if overall_success:
            print(f"\n🎉 ALL TESTS PASSED - New affiliate codes are working correctly!")
            print(f"   If you're still experiencing issues, the problem might be:")
            print(f"   1. Frontend-backend integration")
            print(f"   2. Specific edge cases not covered in this test")
            print(f"   3. Database state inconsistencies")
        else:
            print(f"\n❌ SOME TESTS FAILED - Found issues with new affiliate codes!")
            print(f"   The issue appears to be in the referral/conversion tracking logic.")
        
        # Clean up test data
        print(f"\n🧹 Cleaning up test data...")
        try:
            # Delete referral codes first
            Coupon.query.filter_by(affiliate_id=new_affiliate.id).delete()
            # Delete affiliate
            db.session.delete(new_affiliate)
            db.session.commit()
            print(f"   ✅ Test data cleaned up")
        except Exception as e:
            print(f"   ⚠️  Warning: Could not clean up test data: {e}")
        
        return overall_success

if __name__ == '__main__':
    print("🚀 New Affiliate Issue Reproduction Test")
    print("=" * 80)
    
    try:
        success = test_new_affiliate_referral_tracking()
        print("\n" + "=" * 80)
        if success:
            print("✅ Test completed - No issues found with new affiliate codes")
        else:
            print("❌ Test completed - Issues found with new affiliate codes")
        print("=" * 80)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()