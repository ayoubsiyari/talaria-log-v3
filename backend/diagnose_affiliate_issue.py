#!/usr/bin/env python3
"""
Comprehensive diagnostic tool to identify issues with new affiliate referral codes
Run this to debug the exact issue you're experiencing
"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon
from app.models.payment import Order
from datetime import datetime

def diagnose_affiliate_issue():
    """Comprehensive diagnosis of affiliate referral code issues"""
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Comprehensive Affiliate Referral Code Diagnosis")
        print("=" * 80)
        
        # Step 1: Check current database state
        print("1️⃣ Current Database State Analysis")
        print("-" * 50)
        
        # Get all affiliates
        all_affiliates = Affiliate.query.all()
        print(f"Total affiliates in database: {len(all_affiliates)}")
        
        for affiliate in all_affiliates:
            print(f"  {affiliate.name} (ID: {affiliate.id})")
            print(f"    Status: {affiliate.status}")
            print(f"    Commission Rate: {affiliate.commission_rate}%")
            print(f"    Stats: {affiliate.referrals} referrals, {affiliate.conversions} conversions, ${affiliate.total_earnings} earnings")
            
            # Get referral codes for this affiliate
            codes = Coupon.query.filter_by(affiliate_id=affiliate.id, is_affiliate_code=True).all()
            print(f"    Referral codes: {len(codes)}")
            for code in codes:
                print(f"      {code.code}: {code.used_count} uses, {code.discount_percent}% discount, Active: {code.is_active}")
            print()
        
        # Step 2: Identify "new" affiliates (recently created)
        print("2️⃣ New Affiliate Identification")
        print("-" * 50)
        
        # Consider affiliates created in the last 30 days as "new"
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        new_affiliates = Affiliate.query.filter(Affiliate.created_at >= thirty_days_ago).all()
        print(f"Affiliates created in last 30 days: {len(new_affiliates)}")
        
        problematic_affiliates = []
        
        for affiliate in new_affiliates:
            print(f"  NEW: {affiliate.name} (Created: {affiliate.created_at})")
            print(f"       Status: {affiliate.status}, Commission: {affiliate.commission_rate}%")
            
            # Check their codes
            codes = Coupon.query.filter_by(affiliate_id=affiliate.id, is_affiliate_code=True).all()
            print(f"       Codes: {len(codes)}")
            
            for code in codes:
                print(f"         {code.code}: Used {code.used_count} times")
                
                # Test if the code would work
                if code.is_valid() and code.is_affiliate_code and code.affiliate:
                    test_discount = 100.0 * (code.discount_percent / 100)
                    test_commission = code.calculate_affiliate_commission(100.0)
                    print(f"           Discount Test: ${test_discount} (Expected: >$0)")
                    print(f"           Commission Test: ${test_commission} (Expected: >$0)")
                    
                    if test_discount <= 0 or test_commission <= 0:
                        print(f"           ❌ ISSUE FOUND: Discount or commission calculation broken!")
                        problematic_affiliates.append((affiliate, code, "calculation_issue"))
                    else:
                        print(f"           ✅ Calculations working")
                else:
                    print(f"           ❌ ISSUE FOUND: Code validation failed!")
                    problematic_affiliates.append((affiliate, code, "validation_issue"))
            print()
        
        # Step 3: Test specific scenarios that might be causing issues
        print("3️⃣ Specific Issue Scenario Testing")
        print("-" * 50)
        
        # Test scenario: What if the issue is in the order creation flow?
        print("Testing order creation flow with newest affiliate...")
        
        if new_affiliates:
            newest_affiliate = max(new_affiliates, key=lambda x: x.created_at)
            print(f"Using affiliate: {newest_affiliate.name}")
            
            # Get or create a code for testing
            test_codes = Coupon.query.filter_by(
                affiliate_id=newest_affiliate.id, 
                is_affiliate_code=True
            ).all()
            
            if test_codes:
                test_code = test_codes[0]
                print(f"Using existing code: {test_code.code}")
            else:
                print("Creating new test code...")
                test_code = Coupon.create_affiliate_code(
                    affiliate_id=newest_affiliate.id,
                    discount_percent=15,
                    description="Diagnostic test code"
                )
                print(f"Created test code: {test_code.code}")
            
            # Now test the complete flow
            print(f"\nTesting complete referral flow:")
            
            # Initial state
            initial_usage = test_code.used_count
            initial_referrals = newest_affiliate.referrals
            initial_conversions = newest_affiliate.conversions
            initial_earnings = newest_affiliate.total_earnings
            
            print(f"Initial: Usage={initial_usage}, Referrals={initial_referrals}, Conversions={initial_conversions}, Earnings=${initial_earnings}")
            
            # Simulate order creation (discount applied + referral recorded)
            print("Simulating order creation...")
            
            # Test discount calculation
            order_amount = 50.0
            discount_amount = order_amount * (test_code.discount_percent / 100)
            final_amount = order_amount - discount_amount
            
            print(f"  Order: ${order_amount} -> ${discount_amount} discount -> ${final_amount} final")
            
            # This is what should happen in order creation
            test_code.record_referral()  # Should increment usage and referrals
            
            db.session.refresh(test_code)
            db.session.refresh(newest_affiliate)
            
            print(f"After order: Usage={test_code.used_count}, Referrals={newest_affiliate.referrals}, Conversions={newest_affiliate.conversions}, Earnings=${newest_affiliate.total_earnings}")
            
            # Simulate payment success (conversion + commission)
            print("Simulating payment success...")
            
            test_code.record_conversion(order_amount)  # Should increment conversions and earnings
            
            db.session.refresh(newest_affiliate)
            
            print(f"After payment: Usage={test_code.used_count}, Referrals={newest_affiliate.referrals}, Conversions={newest_affiliate.conversions}, Earnings=${newest_affiliate.total_earnings}")
            
            # Check if everything worked as expected
            usage_increased = test_code.used_count > initial_usage
            referrals_increased = newest_affiliate.referrals > initial_referrals  
            conversions_increased = newest_affiliate.conversions > initial_conversions
            earnings_increased = newest_affiliate.total_earnings > initial_earnings
            
            print(f"\nResults:")
            print(f"  Usage tracking: {'✅ WORKING' if usage_increased else '❌ BROKEN'}")
            print(f"  Referral tracking: {'✅ WORKING' if referrals_increased else '❌ BROKEN'}")
            print(f"  Conversion tracking: {'✅ WORKING' if conversions_increased else '❌ BROKEN'}")
            print(f"  Earnings tracking: {'✅ WORKING' if earnings_increased else '❌ BROKEN'}")
            
            if not (usage_increased and referrals_increased and conversions_increased and earnings_increased):
                problematic_affiliates.append((newest_affiliate, test_code, "tracking_issue"))
        
        # Step 4: Check for common integration issues
        print(f"\n4️⃣ Integration Issue Analysis")
        print("-" * 50)
        
        # Check if there are any orders in the system that used referral codes
        orders_with_referrals = Order.query.filter(Order.order_metadata.op('->>')('referral_code').isnot(None)).all()
        print(f"Orders with referral codes in metadata: {len(orders_with_referrals)}")
        
        for order in orders_with_referrals[-5:]:  # Show last 5
            referral_code = order.order_metadata.get('referral_code') if order.order_metadata else None
            affiliate_id = order.order_metadata.get('affiliate_id') if order.order_metadata else None
            print(f"  Order {order.order_number}: Code={referral_code}, Affiliate={affiliate_id}, Status={order.payment_status}")
        
        # Check promotion codes that might be misidentified as referral codes
        promotion_codes = Coupon.query.filter_by(is_affiliate_code=False).all()
        print(f"\nNon-affiliate promotion codes: {len(promotion_codes)}")
        for code in promotion_codes[:5]:  # Show first 5
            print(f"  {code.code}: {code.discount_percent}% discount, Used {code.used_count} times")
        
        # Step 5: Summary and recommendations
        print(f"\n" + "=" * 80)
        print(f"📋 DIAGNOSIS SUMMARY")
        print("=" * 80)
        
        if not problematic_affiliates:
            print("✅ NO ISSUES FOUND in backend logic")
            print("   All affiliate referral codes appear to be working correctly")
            print("\n💡 Possible causes of your issue:")
            print("   1. Frontend-Backend Integration Issue:")
            print("      - Check if frontend is sending referral codes correctly")
            print("      - Verify API endpoints are being called properly")
            print("      - Check browser network tab for failed requests")
            print("   2. Caching Issues:")
            print("      - Clear browser cache and try again")
            print("      - Check if there are any cached responses")
            print("   3. Race Conditions:")
            print("      - Multiple simultaneous requests might cause issues")
            print("   4. Database Transaction Issues:")
            print("      - Check if commits are happening properly")
            print("   5. Specific User Scenarios:")
            print("      - Test with different browsers/users")
            print("      - Check if issue is user-specific")
        else:
            print("❌ ISSUES FOUND:")
            for affiliate, code, issue_type in problematic_affiliates:
                print(f"   - {affiliate.name} ({code.code}): {issue_type}")
            
            print(f"\n🔧 RECOMMENDED FIXES:")
            for affiliate, code, issue_type in problematic_affiliates:
                if issue_type == "calculation_issue":
                    print(f"   - Fix calculation logic for {code.code}")
                elif issue_type == "validation_issue":
                    print(f"   - Fix validation logic for {code.code}")
                elif issue_type == "tracking_issue":
                    print(f"   - Fix tracking logic for {code.code}")
        
        print(f"\n🧪 NEXT STEPS TO DEBUG YOUR SPECIFIC ISSUE:")
        print("   1. Create a new affiliate partner through the UI")
        print("   2. Generate a referral code for them through the UI") 
        print("   3. Test the referral code with a real order")
        print("   4. Check the database after each step:")
        print("      - After code generation: Verify code exists and is linked")
        print("      - After order creation: Check if referrals increased")
        print("      - After payment: Check if conversions/earnings increased")
        print("   5. Enable debug logging to see exact API calls")
        
        return len(problematic_affiliates) == 0

if __name__ == '__main__':
    print("🚀 Affiliate Issue Diagnosis Tool")
    print("=" * 80)
    
    try:
        success = diagnose_affiliate_issue()
        print("\n" + "=" * 80)
        if success:
            print("🎯 Backend logic is working - Issue likely in integration/frontend")
        else:
            print("🐛 Found backend issues - See recommendations above")
        print("=" * 80)
    except Exception as e:
        print(f"\n❌ Diagnosis failed with error: {e}")
        import traceback
        traceback.print_exc()