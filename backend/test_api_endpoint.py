#!/usr/bin/env python3
"""
Test the affiliate referrals API endpoint directly
"""

import sys
import os
import json

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.user_referral import UserReferral
from app.models.affiliate import Affiliate

def test_api():
    """Test the API endpoint logic"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing Affiliate Referrals API Logic")
        print("=" * 60)
        
        # Test for affiliate ID 9 (Test Marketing Pro)
        affiliate_id = 9
        affiliate = Affiliate.query.get(affiliate_id)
        
        if not affiliate:
            print(f"❌ Affiliate {affiliate_id} not found")
            return
            
        print(f"✅ Found affiliate: {affiliate.name}")
        
        # Test the query that the API endpoint uses
        query = UserReferral.query.filter_by(affiliate_id=affiliate_id)
        referrals = query.all()
        
        print(f"📊 Total referrals found: {len(referrals)}")
        
        for referral in referrals:
            print(f"  • {referral.user_name or referral.user_email}")
            print(f"    Code: {referral.coupon_code}")
            print(f"    Status: {referral.status}")
            print(f"    Referred: {referral.referred_at}")
            if referral.registered_at:
                print(f"    Registered: {referral.registered_at}")
            if referral.converted_at:
                print(f"    Converted: {referral.converted_at} (${referral.conversion_amount})")
            print()
        
        # Test summary calculations
        total_referrals = UserReferral.query.filter_by(affiliate_id=affiliate_id).count()
        total_registered = UserReferral.query.filter_by(
            affiliate_id=affiliate_id
        ).filter(UserReferral.registered_at.is_not(None)).count()
        total_converted = UserReferral.query.filter_by(
            affiliate_id=affiliate_id,
            is_converted=True
        ).count()
        
        from sqlalchemy import func
        from app import db
        total_commission = db.session.query(
            func.sum(UserReferral.commission_earned)
        ).filter(
            UserReferral.affiliate_id == affiliate_id,
            UserReferral.commission_earned.is_not(None)
        ).scalar() or 0.0
        
        print(f"📈 Summary Statistics:")
        print(f"  Total Referrals: {total_referrals}")
        print(f"  Total Registered: {total_registered}")
        print(f"  Total Converted: {total_converted}")
        print(f"  Total Commission: ${total_commission}")
        print(f"  Conversion Rate: {round((total_converted / total_referrals * 100) if total_referrals > 0 else 0, 1)}%")
        
        # Test API response format
        api_response = {
            'success': True,
            'data': [referral.to_dict() for referral in referrals],
            'summary': {
                'total_referrals': total_referrals,
                'total_registered': total_registered,
                'total_converted': total_converted,
                'total_commission': float(total_commission),
                'conversion_rate': round((total_converted / total_referrals * 100) if total_referrals > 0 else 0, 1)
            },
            'affiliate': {
                'id': affiliate.id,
                'name': affiliate.name,
                'email': affiliate.email,
                'commission_rate': affiliate.commission_rate
            }
        }
        
        print(f"\n🔗 API Response Preview:")
        print(f"  Success: {api_response['success']}")
        print(f"  Data Items: {len(api_response['data'])}")
        print(f"  Summary: {api_response['summary']}")
        
        # Test first referral data structure
        if api_response['data']:
            first_referral = api_response['data'][0]
            print(f"\n📋 First Referral Data:")
            for key, value in first_referral.items():
                if value is not None:
                    print(f"    {key}: {value}")

if __name__ == '__main__':
    test_api()