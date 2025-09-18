#!/usr/bin/env python3
"""Reset affiliate data to correct state"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def main():
    app = create_app('development')
    
    with app.app_context():
        print("🔧 Resetting Affiliate Data to Correct State...")
        print("=" * 50)
        
        # Get Taylor affiliate
        taylor = Affiliate.query.filter_by(name='taylor').first()
        if not taylor:
            print("❌ Taylor affiliate not found")
            return
        
        # Get the TAY0007 code
        tay_code = Coupon.query.filter_by(code='TAY0007').first()
        if not tay_code:
            print("❌ TAY0007 code not found")
            return
        
        print(f"Current state:")
        print(f"  Code used: {tay_code.used_count} times")
        print(f"  Taylor referrals: {taylor.referrals}")
        print(f"  Taylor conversions: {taylor.conversions}")
        print(f"  Taylor earnings: ${taylor.total_earnings}")
        print(f"  Taylor conversion rate: {taylor.conversion_rate}%")
        print(f"  Taylor performance: {taylor.performance}")
        
        # Reset to zero since our tests were creating both referrals and conversions
        # In the new logic, referrals happen during order creation, conversions during payment success
        print(f"\n🔄 Resetting to clean state...")
        
        # Reset affiliate stats
        taylor.referrals = 0
        taylor.conversions = 0
        taylor.total_earnings = 0.0
        taylor.conversion_rate = 0.0
        taylor.performance = 'new'
        
        # Reset code usage count
        tay_code.used_count = 0
        
        # Save changes
        db.session.commit()
        
        print(f"After reset:")
        print(f"  Code used: {tay_code.used_count} times")
        print(f"  Taylor referrals: {taylor.referrals}")
        print(f"  Taylor conversions: {taylor.conversions}")
        print(f"  Taylor earnings: ${taylor.total_earnings}")
        print(f"  Taylor conversion rate: {taylor.conversion_rate}%")
        print(f"  Taylor performance: {taylor.performance}")
        
        print("\n✅ Affiliate data reset to clean state!")
        print("Now you can test the new logic properly:")
        print("1. Order creation with referral code -> increments referrals")
        print("2. Payment success -> increments conversions and earnings")

if __name__ == '__main__':
    main()