#!/usr/bin/env python3
"""Check affiliate codes and stats"""

from app import create_app, db
from app.models.coupon import Coupon
from app.models.affiliate import Affiliate

def main():
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Checking Affiliate Referral Codes...")
        print("=" * 50)
        
        codes = Coupon.query.filter_by(is_affiliate_code=True).all()
        
        for code in codes:
            print(f"Code: {code.code}")
            print(f"  Used: {code.used_count} times")
            print(f"  Discount: {code.discount_percent}%")
            print(f"  Commission: {code.affiliate_commission_percent}%")
            print(f"  Affiliate: {code.affiliate.name if code.affiliate else 'None'}")
            print(f"  Active: {code.is_active}")
            print()
        
        print("🔍 Checking Affiliate Stats...")
        print("=" * 50)
        
        affiliates = Affiliate.query.all()
        
        for affiliate in affiliates:
            print(f"Affiliate: {affiliate.name}")
            print(f"  Email: {affiliate.email}")
            print(f"  Status: {affiliate.status}")
            print(f"  Commission Rate: {affiliate.commission_rate}%")
            print(f"  Total Earnings: ${affiliate.total_earnings}")
            print(f"  Referrals: {affiliate.referrals}")
            print(f"  Conversions: {affiliate.conversions}")
            print(f"  Conversion Rate: {affiliate.conversion_rate}%")
            print(f"  Performance: {affiliate.performance}")
            print()

if __name__ == '__main__':
    main()