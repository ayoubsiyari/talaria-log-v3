#!/usr/bin/env python3
"""
Quick verification script to check if affiliate data exists
"""

import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.user_referral import UserReferral
from app.models.coupon import Coupon

def verify_data():
    """Verify affiliate and referral data exists"""
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Verifying Affiliate Data")
        print("=" * 50)
        
        # Check all affiliates
        affiliates = Affiliate.query.all()
        print(f"📊 Total affiliates: {len(affiliates)}")
        
        for affiliate in affiliates:
            print(f"\nAffiliate: {affiliate.name} (ID: {affiliate.id})")
            print(f"  Email: {affiliate.email}")
            print(f"  Status: {affiliate.status}")
            print(f"  Commission Rate: {affiliate.commission_rate}%")
            
            # Check referral codes
            codes = Coupon.query.filter_by(
                affiliate_id=affiliate.id,
                is_affiliate_code=True
            ).all()
            print(f"  Referral Codes: {len(codes)}")
            for code in codes:
                print(f"    • {code.code}: {code.used_count} uses, {code.discount_percent}% discount")
            
            # Check user referrals
            referrals = UserReferral.query.filter_by(affiliate_id=affiliate.id).all()
            print(f"  User Referrals: {len(referrals)}")
            for referral in referrals:
                status_icon = "💰" if referral.is_converted else "✅" if referral.registered_at else "👀"
                print(f"    {status_icon} {referral.user_name or referral.user_email}: {referral.status}")
                if referral.conversion_amount:
                    print(f"       → ${referral.conversion_amount} (Commission: ${referral.commission_earned})")
            print()

if __name__ == '__main__':
    verify_data()