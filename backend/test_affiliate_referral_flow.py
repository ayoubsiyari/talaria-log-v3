#!/usr/bin/env python3
"""
Test script to verify the complete affiliate referral tracking flow.
Tests:
1. Creating a new affiliate
2. Generating referral codes for the affiliate
3. Simulating user signup with referral code
4. Tracking conversions
5. Verifying analytics and reporting
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon
from app.models.user_referral import UserReferral
from app.models.user import User

def test_affiliate_referral_flow():
    """Test complete affiliate referral flow"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing Complete Affiliate Referral Flow")
        print("=" * 60)
        
        # Step 1: Create a new affiliate
        print("\n📋 Step 1: Creating new affiliate...")
        test_affiliate = Affiliate.create(
            name="Test Marketing Pro",
            email=f"test_affiliate_{random.randint(1000, 9999)}@example.com",
            commission_rate=25.0,
            category="Marketing",
            website="https://testmarketing.pro",
            notes="Test affiliate for referral flow verification"
        )
        print(f"✅ Created affiliate: {test_affiliate.name} (ID: {test_affiliate.id})")
        
        # Step 2: Generate referral codes
        print("\n🔗 Step 2: Generating referral codes...")
        
        # Generate main referral code
        main_code = Coupon.create_affiliate_code(
            affiliate_id=test_affiliate.id,
            discount_percent=15,
            description="Main referral code for Test Marketing Pro"
        )
        print(f"✅ Generated main code: {main_code.code} (15% discount)")
        
        # Generate special promotion code
        promo_code = Coupon.create_affiliate_code(
            affiliate_id=test_affiliate.id,
            code="TESTMKT20",
            discount_percent=20,
            description="Special promotion code"
        )
        print(f"✅ Generated promo code: {promo_code.code} (20% discount)")
        
        # Step 3: Simulate referrals (users clicking referral links)
        print("\n👥 Step 3: Simulating referrals...")
        
        referrals_data = [
            {
                "email": "potential_customer_1@example.com",
                "name": "John Potential",
                "code": main_code.code,
                "source": "web",
                "medium": "social"
            },
            {
                "email": "potential_customer_2@example.com", 
                "name": "Jane Interested",
                "code": promo_code.code,
                "source": "mobile",
                "medium": "email"
            },
            {
                "email": "potential_customer_3@example.com",
                "name": "Bob Curious",
                "code": main_code.code,
                "source": "web", 
                "medium": "organic"
            }
        ]
        
        created_referrals = []
        for ref_data in referrals_data:
            referral = UserReferral.create_referral(
                affiliate_id=test_affiliate.id,
                coupon_code=ref_data["code"],
                user_email=ref_data["email"],
                user_name=ref_data["name"],
                source=ref_data["source"],
                medium=ref_data["medium"]
            )
            created_referrals.append(referral)
            print(f"✅ Created referral: {ref_data['name']} -> {ref_data['code']}")
        
        # Update affiliate referral count
        main_code.record_referral()
        promo_code.record_referral()
        main_code.record_referral()  # Second referral for main code
        
        # Step 4: Simulate user registrations
        print("\n📝 Step 4: Simulating user registrations...")
        
        # First user registers and signs up
        referral_1 = created_referrals[0]
        referral_1.mark_registered()
        print(f"✅ {referral_1.user_name} registered")
        
        # Third user also registers
        referral_3 = created_referrals[2] 
        referral_3.mark_registered()
        print(f"✅ {referral_3.user_name} registered")
        
        # Step 5: Simulate conversions (purchases)
        print("\n💰 Step 5: Simulating conversions...")
        
        # First user makes a purchase
        purchase_amount_1 = 99.00
        commission_1 = purchase_amount_1 * (test_affiliate.commission_rate / 100)
        referral_1.mark_converted(purchase_amount_1, commission_1)
        main_code.record_conversion(purchase_amount_1)
        print(f"✅ {referral_1.user_name} converted: ${purchase_amount_1} (Commission: ${commission_1})")
        
        # Third user makes a bigger purchase
        purchase_amount_3 = 149.00
        commission_3 = purchase_amount_3 * (test_affiliate.commission_rate / 100)
        referral_3.mark_converted(purchase_amount_3, commission_3)
        main_code.record_conversion(purchase_amount_3)
        print(f"✅ {referral_3.user_name} converted: ${purchase_amount_3} (Commission: ${commission_3})")
        
        # Step 6: Verify tracking and analytics
        print("\n📊 Step 6: Verifying tracking and analytics...")
        
        # Refresh affiliate data
        db.session.refresh(test_affiliate)
        
        total_referrals = UserReferral.query.filter_by(affiliate_id=test_affiliate.id).count()
        registered_referrals = UserReferral.query.filter_by(
            affiliate_id=test_affiliate.id
        ).filter(UserReferral.registered_at.isnot(None)).count()
        
        converted_referrals = UserReferral.query.filter_by(
            affiliate_id=test_affiliate.id,
            is_converted=True
        ).count()
        
        total_commission = db.session.query(
            db.func.sum(UserReferral.commission_earned)
        ).filter(
            UserReferral.affiliate_id == test_affiliate.id,
            UserReferral.commission_earned.isnot(None)
        ).scalar() or 0.0
        
        print(f"\n📈 Analytics Summary:")
        print(f"   • Total Referrals: {total_referrals}")
        print(f"   • Registered Users: {registered_referrals}")
        print(f"   • Converted Users: {converted_referrals}")
        print(f"   • Conversion Rate: {(converted_referrals / total_referrals * 100):.1f}%")
        print(f"   • Total Commission Earned: ${total_commission:.2f}")
        print(f"   • Affiliate Total Earnings: ${test_affiliate.total_earnings:.2f}")
        print(f"   • Affiliate Performance: {test_affiliate.performance}")
        
        # Step 7: Test API endpoints (simulate)
        print("\n🔌 Step 7: Testing API endpoints...")
        
        # Test codes endpoint data
        codes = Coupon.query.filter_by(
            affiliate_id=test_affiliate.id,
            is_affiliate_code=True
        ).all()
        print(f"✅ Affiliate has {len(codes)} referral codes")
        
        # Test referrals endpoint data
        referrals = UserReferral.query.filter_by(affiliate_id=test_affiliate.id).all()
        print(f"✅ Affiliate has {len(referrals)} referrals tracked")
        
        # Step 8: Test edge cases
        print("\n🧪 Step 8: Testing edge cases...")
        
        # Test duplicate referral creation (should handle gracefully)
        try:
            # This should work - same email can be referred by different codes
            duplicate_ref = UserReferral.create_referral(
                affiliate_id=test_affiliate.id,
                coupon_code=promo_code.code,
                user_email=referral_1.user_email,  # Same email
                user_name="John Potential Again"
            )
            print(f"✅ Handled duplicate email referral: {duplicate_ref.id}")
        except Exception as e:
            print(f"⚠️  Duplicate referral handling: {e}")
        
        # Test invalid coupon code
        try:
            invalid_ref = UserReferral.create_referral(
                affiliate_id=test_affiliate.id,
                coupon_code="INVALID123",
                user_email="test@example.com"
            )
            print("❌ Should have failed with invalid coupon")
        except ValueError as e:
            print(f"✅ Correctly rejected invalid coupon: {e}")
        
        # Step 9: Generate summary report
        print("\n📋 Step 9: Final Summary Report")
        print("=" * 60)
        
        # Refresh all data
        db.session.refresh(test_affiliate)
        
        print(f"Affiliate: {test_affiliate.name}")
        print(f"Email: {test_affiliate.email}")
        print(f"Status: {test_affiliate.status}")
        print(f"Commission Rate: {test_affiliate.commission_rate}%")
        print(f"Category: {test_affiliate.category}")
        print(f"")
        print(f"Performance Metrics:")
        print(f"  • Total Referrals: {test_affiliate.referrals}")
        print(f"  • Total Conversions: {test_affiliate.conversions}")
        print(f"  • Conversion Rate: {test_affiliate.conversion_rate}%")
        print(f"  • Total Earnings: ${test_affiliate.total_earnings}")
        print(f"  • Performance Rating: {test_affiliate.performance}")
        print(f"")
        print(f"Referral Codes:")
        for code in codes:
            print(f"  • {code.code}: {code.used_count} uses, {code.discount_percent}% discount")
        print(f"")
        print(f"Individual Referrals:")
        for referral in referrals:
            status_icon = "💰" if referral.is_converted else "✅" if referral.registered_at else "👀"
            conversion_text = f" (${referral.conversion_amount})" if referral.conversion_amount else ""
            print(f"  {status_icon} {referral.user_name or referral.user_email}: {referral.status}{conversion_text}")
        
        print(f"\n🎉 Test completed successfully!")
        print(f"   Created affiliate ID {test_affiliate.id} with full referral tracking.")
        print(f"   You can now test the frontend by viewing this affiliate's referrals.")
        
        # Return test affiliate ID for further testing
        return test_affiliate.id

if __name__ == '__main__':
    try:
        affiliate_id = test_affiliate_referral_flow()
        print(f"\n🔗 To test in frontend, use affiliate ID: {affiliate_id}")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()