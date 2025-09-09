#!/usr/bin/env python3
"""
Simple script to test coupon functionality without loading the full app
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db
from app.models.coupon import Coupon
from datetime import datetime

def test_coupons():
    """Test coupon functionality"""
    app = create_app('development')
    
    with app.app_context():
        try:
            print("=== TESTING COUPONS ===")
            
            # Check existing coupons
            coupons = Coupon.query.all()
            print(f"Found {len(coupons)} coupons:")
            
            for coupon in coupons:
                print(f"  - {coupon.code}: {coupon.discount_percent}% off")
                print(f"    Description: {coupon.description}")
                print(f"    Max uses: {coupon.max_uses}")
                print(f"    Used: {coupon.used_count}")
                print(f"    Active: {coupon.is_active}")
                print()
            
            # Test coupon validation
            if coupons:
                test_coupon = coupons[0]
                print(f"Testing validation for {test_coupon.code}:")
                print(f"  Valid: {test_coupon.is_valid()}")
                print(f"  Valid for plan 1: {test_coupon.is_valid(plan_id=1)}")
                print(f"  Valid for amount $10: {test_coupon.is_valid(amount=10.0)}")
                
                # Test discount calculation
                original_price = 29.99
                discounted_price = test_coupon.apply_discount(original_price)
                print(f"  Original price: ${original_price}")
                print(f"  Discounted price: ${discounted_price:.2f}")
                print(f"  Savings: ${original_price - discounted_price:.2f}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("🚀 Testing coupon functionality...")
    success = test_coupons()
    if success:
        print("\n🎉 Coupon test completed successfully!")
    else:
        print("\n❌ Coupon test failed")
        sys.exit(1)
