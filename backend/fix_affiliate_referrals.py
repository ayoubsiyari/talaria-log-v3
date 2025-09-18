#!/usr/bin/env python3
"""Fix existing affiliate referral counts"""

from app import create_app, db
from app.models.affiliate import Affiliate

def main():
    app = create_app('development')
    
    with app.app_context():
        print("🔧 Fixing Affiliate Referral Counts...")
        print("=" * 50)
        
        # Get Taylor affiliate
        taylor = Affiliate.query.filter_by(name='taylor').first()
        if not taylor:
            print("❌ Taylor affiliate not found")
            return
        
        print(f"Before fix:")
        print(f"  Referrals: {taylor.referrals}")
        print(f"  Conversions: {taylor.conversions}")
        print(f"  Conversion Rate: {taylor.conversion_rate}%")
        print(f"  Performance: {taylor.performance}")
        
        # Fix referrals count - since they have 3 conversions, they should have 3 referrals
        # (each successful payment came from a referral)
        taylor.referrals = taylor.conversions
        
        # Recalculate performance metrics
        taylor.update_conversion_rate()
        taylor.calculate_performance()
        
        # Save changes
        db.session.commit()
        
        print(f"\nAfter fix:")
        print(f"  Referrals: {taylor.referrals}")
        print(f"  Conversions: {taylor.conversions}")
        print(f"  Conversion Rate: {taylor.conversion_rate}%")
        print(f"  Performance: {taylor.performance}")
        
        print("\n✅ Affiliate referral counts fixed!")

if __name__ == '__main__':
    main()