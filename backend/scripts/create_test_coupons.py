#!/usr/bin/env python3
"""
Script to create test coupons
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.coupon import Coupon

def create_test_coupons():
    """Create test coupons"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Check if coupons already exist
            existing_coupons = Coupon.query.all()
            if existing_coupons:
                print(f"Found {len(existing_coupons)} existing coupons:")
                for coupon in existing_coupons:
                    print(f"  - {coupon.code}: {coupon.discount_percent}% off")
                return True
            
            # Create test coupons
            test_coupons = [
                {
                    'code': 'WELCOME10',
                    'description': 'Welcome discount - 10% off',
                    'discount_percent': 10.0,
                    'max_uses': 100,
                    'minimum_amount': 0.0
                },
                {
                    'code': 'SAVE20',
                    'description': 'Save 20% on any plan',
                    'discount_percent': 20.0,
                    'max_uses': 50,
                    'minimum_amount': 10.0
                },
                {
                    'code': 'FREETRIAL',
                    'description': 'Extended free trial',
                    'discount_percent': 100.0,
                    'max_uses': 25,
                    'minimum_amount': 0.0
                },
                {
                    'code': 'YEARLY25',
                    'description': '25% off yearly plans',
                    'discount_percent': 25.0,
                    'max_uses': 30,
                    'minimum_amount': 50.0
                }
            ]
            
            for coupon_data in test_coupons:
                coupon = Coupon(**coupon_data)
                db.session.add(coupon)
                print(f"✅ Created coupon: {coupon.code} ({coupon.discount_percent}% off)")
            
            db.session.commit()
            print(f"\n🎉 Successfully created {len(test_coupons)} test coupons!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating coupons: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("🚀 Creating test coupons...")
    success = create_test_coupons()
    if success:
        print("🎉 Coupon creation completed successfully!")
    else:
        print("❌ Coupon creation failed")
        sys.exit(1)
