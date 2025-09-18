"""
Create sample affiliate referral codes for testing
"""

import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def create_sample_codes():
    """Create sample referral codes for existing affiliates"""
    
    app = create_app()
    
    with app.app_context():
        try:
            # Get all active affiliates
            affiliates = Affiliate.query.filter_by(status='active').all()
            
            print(f"Found {len(affiliates)} active affiliates")
            
            for affiliate in affiliates:
                # Check if affiliate already has codes
                existing_codes = Coupon.query.filter_by(
                    affiliate_id=affiliate.id,
                    is_affiliate_code=True
                ).count()
                
                if existing_codes == 0:
                    # Create a primary referral code for this affiliate
                    try:
                        referral_code = Coupon.create_affiliate_code(
                            affiliate_id=affiliate.id,
                            discount_percent=10,  # 10% discount for customers
                            description=f"Get 10% off with {affiliate.name}'s referral code"
                        )
                        
                        print(f"✅ Created referral code '{referral_code.code}' for {affiliate.name}")
                        
                        # Optionally create a second code with different discount
                        if affiliate.commission_rate >= 25:  # High commission affiliates get premium codes
                            premium_code = Coupon.create_affiliate_code(
                                affiliate_id=affiliate.id,
                                code=f"PREMIUM{affiliate.id:04d}",
                                discount_percent=15,  # 15% discount
                                description=f"Premium 15% discount from {affiliate.name}"
                            )
                            print(f"✅ Created premium code '{premium_code.code}' for {affiliate.name}")
                            
                    except Exception as e:
                        print(f"❌ Error creating code for {affiliate.name}: {e}")
                else:
                    print(f"⚠️  {affiliate.name} already has {existing_codes} referral code(s)")
            
            # Create some general promotional codes that aren't affiliate-specific
            general_codes = [
                {
                    'code': 'WELCOME10',
                    'description': 'Welcome discount for new users',
                    'discount_percent': 10,
                    'max_uses': 100
                },
                {
                    'code': 'SAVE20',
                    'description': 'Limited time 20% discount',
                    'discount_percent': 20,
                    'max_uses': 50
                }
            ]
            
            for code_data in general_codes:
                existing = Coupon.query.filter_by(code=code_data['code']).first()
                if not existing:
                    general_coupon = Coupon(
                        code=code_data['code'],
                        description=code_data['description'],
                        discount_percent=code_data['discount_percent'],
                        max_uses=code_data['max_uses'],
                        is_affiliate_code=False,
                        is_active=True
                    )
                    db.session.add(general_coupon)
                    print(f"✅ Created general coupon '{code_data['code']}'")
                else:
                    print(f"⚠️  General coupon '{code_data['code']}' already exists")
            
            db.session.commit()
            print("\n🎉 Sample referral codes created successfully!")
            
            # Show summary
            total_affiliate_codes = Coupon.query.filter_by(is_affiliate_code=True).count()
            total_general_codes = Coupon.query.filter_by(is_affiliate_code=False).count()
            
            print(f"\n📊 Summary:")
            print(f"   - Affiliate referral codes: {total_affiliate_codes}")
            print(f"   - General coupon codes: {total_general_codes}")
            print(f"   - Total codes: {total_affiliate_codes + total_general_codes}")
            
        except Exception as e:
            print(f"❌ Error creating sample codes: {e}")
            db.session.rollback()
            raise e

if __name__ == "__main__":
    create_sample_codes()