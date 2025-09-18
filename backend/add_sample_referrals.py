#!/usr/bin/env python3
"""
Add sample referrals to existing affiliates
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

def add_sample_referrals():
    """Add sample referrals to existing affiliates"""
    app = create_app('development')
    
    with app.app_context():
        print("📊 Adding Sample Referrals to Existing Affiliates")
        print("=" * 60)
        
        # Get affiliates without user referrals
        affiliates = Affiliate.query.all()
        
        for affiliate in affiliates:
            existing_referrals = UserReferral.query.filter_by(affiliate_id=affiliate.id).count()
            
            if existing_referrals == 0:
                print(f"\n🎯 Adding referrals for {affiliate.name} (ID: {affiliate.id})")
                
                # Get affiliate's first referral code
                codes = Coupon.query.filter_by(
                    affiliate_id=affiliate.id,
                    is_affiliate_code=True
                ).first()
                
                if not codes:
                    print(f"  ⚠️  No referral codes found, skipping...")
                    continue
                
                # Create some sample referrals
                sample_referrals = [
                    {
                        "email": f"customer1_{affiliate.id}@example.com",
                        "name": f"Customer One {affiliate.id}",
                        "status": "converted",
                        "amount": 89.00
                    },
                    {
                        "email": f"customer2_{affiliate.id}@example.com", 
                        "name": f"Customer Two {affiliate.id}",
                        "status": "registered"
                    },
                    {
                        "email": f"customer3_{affiliate.id}@example.com",
                        "name": f"Customer Three {affiliate.id}",
                        "status": "referred"
                    }
                ]
                
                created_count = 0
                for ref_data in sample_referrals:
                    try:
                        referral = UserReferral.create_referral(
                            affiliate_id=affiliate.id,
                            coupon_code=codes.code,
                            user_email=ref_data["email"],
                            user_name=ref_data["name"],
                            source="web",
                            medium="sample_data"
                        )
                        
                        # Set different dates for variety
                        days_ago = random.randint(1, 30)
                        referral.referred_at = datetime.utcnow() - timedelta(days=days_ago)
                        
                        if ref_data["status"] in ["registered", "converted"]:
                            referral.mark_registered()
                            referral.registered_at = referral.referred_at + timedelta(hours=random.randint(1, 48))
                        
                        if ref_data["status"] == "converted":
                            amount = ref_data["amount"]
                            commission = amount * (affiliate.commission_rate / 100)
                            referral.mark_converted(amount, commission)
                            referral.converted_at = referral.registered_at + timedelta(hours=random.randint(1, 24))
                            
                            # Update coupon usage
                            codes.record_conversion(amount)
                        
                        created_count += 1
                        print(f"  ✅ Created {ref_data['status']} referral: {ref_data['name']}")
                        
                    except Exception as e:
                        print(f"  ❌ Error creating referral: {e}")
                
                print(f"  📊 Created {created_count} referrals for {affiliate.name}")
                
            else:
                print(f"✅ {affiliate.name} already has {existing_referrals} referrals")
        
        # Commit all changes
        db.session.commit()
        print(f"\n🎉 Completed adding sample referrals!")
        
        # Show summary
        print(f"\n📈 Final Summary:")
        for affiliate in affiliates:
            referral_count = UserReferral.query.filter_by(affiliate_id=affiliate.id).count()
            converted_count = UserReferral.query.filter_by(affiliate_id=affiliate.id, is_converted=True).count()
            print(f"  • {affiliate.name}: {referral_count} referrals ({converted_count} converted)")

if __name__ == '__main__':
    add_sample_referrals()