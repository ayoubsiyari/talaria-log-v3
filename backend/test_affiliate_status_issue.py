#!/usr/bin/env python3
"""
Test if affiliate status (pending vs active) affects referral code tracking
"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def test_affiliate_status_impact():
    """Test if affiliate status affects referral tracking"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing Affiliate Status Impact on Referral Tracking")
        print("=" * 70)
        
        # Clean up any existing test affiliates
        existing_affiliates = Affiliate.query.filter(
            Affiliate.email.in_(['pending@test.com', 'active@test.com'])
        ).all()
        
        for affiliate in existing_affiliates:
            Coupon.query.filter_by(affiliate_id=affiliate.id).delete()
            db.session.delete(affiliate)
        db.session.commit()
        
        # Test 1: Create PENDING affiliate and test
        print("1️⃣ Testing PENDING affiliate...")
        pending_affiliate = Affiliate(
            name='Pending Partner',
            email='pending@test.com',
            category='Influencer',
            commission_rate=25.0,
            status='pending'  # This is the default for new affiliates
        )
        db.session.add(pending_affiliate)
        db.session.commit()
        
        print(f"   Created pending affiliate: {pending_affiliate.name} (Status: {pending_affiliate.status})")
        
        # Generate referral code for pending affiliate
        pending_code = Coupon.create_affiliate_code(
            affiliate_id=pending_affiliate.id,
            code="PENDING2024",
            discount_percent=10,
            description="Code for pending affiliate"
        )
        
        print(f"   Generated code: {pending_code.code}")
        
        # Test referral tracking for pending affiliate
        initial_referrals = pending_affiliate.referrals
        initial_earnings = pending_affiliate.total_earnings
        
        print(f"   Initial stats: Referrals={initial_referrals}, Earnings=${initial_earnings}")
        
        # Test discount calculation
        test_amount = 100.0
        discount = test_amount * (pending_code.discount_percent / 100)
        commission = pending_code.calculate_affiliate_commission(test_amount)
        
        print(f"   Discount test: ${test_amount} -> ${discount} discount, ${commission} commission")
        
        # Test referral tracking
        pending_code.record_referral()
        db.session.refresh(pending_affiliate)
        
        print(f"   After referral: Referrals={pending_affiliate.referrals}, Earnings=${pending_affiliate.total_earnings}")
        
        # Test conversion tracking  
        pending_code.record_conversion(test_amount)
        db.session.refresh(pending_affiliate)
        
        print(f"   After conversion: Referrals={pending_affiliate.referrals}, Earnings=${pending_affiliate.total_earnings}")
        
        pending_works = (pending_affiliate.referrals > initial_referrals and 
                        pending_affiliate.total_earnings > initial_earnings and
                        discount > 0 and commission > 0)
        
        print(f"   Status: {'✅ WORKING' if pending_works else '❌ NOT WORKING'}")
        
        # Test 2: Create ACTIVE affiliate and test
        print(f"\n2️⃣ Testing ACTIVE affiliate...")
        active_affiliate = Affiliate(
            name='Active Partner',
            email='active@test.com',
            category='Influencer', 
            commission_rate=25.0,
            status='active'
        )
        db.session.add(active_affiliate)
        db.session.commit()
        
        print(f"   Created active affiliate: {active_affiliate.name} (Status: {active_affiliate.status})")
        
        # Generate referral code for active affiliate
        active_code = Coupon.create_affiliate_code(
            affiliate_id=active_affiliate.id,
            code="ACTIVE2024",
            discount_percent=10,
            description="Code for active affiliate"
        )
        
        print(f"   Generated code: {active_code.code}")
        
        # Test referral tracking for active affiliate
        initial_referrals = active_affiliate.referrals
        initial_earnings = active_affiliate.total_earnings
        
        print(f"   Initial stats: Referrals={initial_referrals}, Earnings=${initial_earnings}")
        
        # Test discount calculation
        discount = test_amount * (active_code.discount_percent / 100)
        commission = active_code.calculate_affiliate_commission(test_amount)
        
        print(f"   Discount test: ${test_amount} -> ${discount} discount, ${commission} commission")
        
        # Test referral tracking
        active_code.record_referral()
        db.session.refresh(active_affiliate)
        
        print(f"   After referral: Referrals={active_affiliate.referrals}, Earnings=${active_affiliate.total_earnings}")
        
        # Test conversion tracking
        active_code.record_conversion(test_amount)
        db.session.refresh(active_affiliate)
        
        print(f"   After conversion: Referrals={active_affiliate.referrals}, Earnings=${active_affiliate.total_earnings}")
        
        active_works = (active_affiliate.referrals > initial_referrals and 
                       active_affiliate.total_earnings > initial_earnings and
                       discount > 0 and commission > 0)
        
        print(f"   Status: {'✅ WORKING' if active_works else '❌ NOT WORKING'}")
        
        # Test 3: Check what happens in order creation with different statuses
        print(f"\n3️⃣ Testing order creation logic with different statuses...")
        
        # Simulate order creation validation logic from payments.py
        def test_order_validation(code, status_name):
            print(f"   Testing {status_name} code: {code.code}")
            
            # This is the exact validation from payments.py
            if not code:
                print(f"      ❌ Code not found")
                return False
            
            if not code.is_valid():
                print(f"      ❌ Code validation failed")
                return False
            
            if not code.is_affiliate_code:
                print(f"      ❌ Not an affiliate code")
                return False
                
            if not code.affiliate:
                print(f"      ❌ No affiliate linked")
                return False
                
            print(f"      ✅ All validations passed")
            print(f"      Affiliate Status: {code.affiliate.status}")
            
            # Check if there's any status-based logic that could be blocking
            affiliate_active = code.affiliate.status == 'active'
            print(f"      Affiliate Active: {affiliate_active}")
            
            return True
        
        test_order_validation(pending_code, "PENDING")
        test_order_validation(active_code, "ACTIVE")
        
        # Summary
        print(f"\n" + "=" * 70)
        print(f"📋 Status Impact Test Results:")
        print(f"   PENDING Affiliate Tracking: {'✅ WORKING' if pending_works else '❌ NOT WORKING'}")
        print(f"   ACTIVE Affiliate Tracking: {'✅ WORKING' if active_works else '❌ NOT WORKING'}")
        
        if pending_works and active_works:
            print(f"\n✅ CONCLUSION: Affiliate status does NOT affect referral tracking")
            print(f"   Both pending and active affiliates work correctly")
        elif not pending_works and active_works:
            print(f"\n❌ CONCLUSION: PENDING affiliates don't work!")
            print(f"   This could be your issue - new affiliates start as 'pending'")
        elif pending_works and not active_works:
            print(f"\n❌ CONCLUSION: ACTIVE affiliates don't work!")
            print(f"   This is unexpected")
        else:
            print(f"\n❌ CONCLUSION: Neither status works!")
            print(f"   There's a deeper issue")
        
        # Clean up
        print(f"\n🧹 Cleaning up...")
        Coupon.query.filter_by(affiliate_id=pending_affiliate.id).delete()
        Coupon.query.filter_by(affiliate_id=active_affiliate.id).delete()
        db.session.delete(pending_affiliate)
        db.session.delete(active_affiliate)
        db.session.commit()
        print(f"   ✅ Cleaned up")
        
        return pending_works and active_works

if __name__ == '__main__':
    print("🚀 Testing Affiliate Status Impact")
    print("=" * 80)
    
    try:
        success = test_affiliate_status_impact()
        print("\n" + "=" * 80)
        if success:
            print("✅ Status is not the issue - both pending and active work")
        else:
            print("❌ Status IS the issue - there's a difference in behavior")
        print("=" * 80)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()