#!/usr/bin/env python3
"""
Fix orphaned referral codes by linking them to appropriate affiliates
"""

from app import create_app, db
from app.models.affiliate import Affiliate
from app.models.coupon import Coupon

def fix_orphaned_referral_codes():
    """Find and fix orphaned referral codes"""
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Finding orphaned referral codes...")
        
        # Get all active affiliates
        affiliates = Affiliate.query.filter_by(status='active').all()
        print(f"Found {len(affiliates)} active affiliates:")
        for affiliate in affiliates:
            print(f"  - {affiliate.name} (commission: {affiliate.commission_rate}%)")
        
        # Map of code patterns to affiliate names (adjust based on your data)
        code_mapping = {
            'STO': 'stoneman',
            'TEC': 'techlead', 
            'PREMIUM': 'taylor',  # assuming taylor handles premium codes
            'TAY': 'taylor',
            'AYM': 'ayman'
        }
        
        # Find orphaned codes
        orphaned_codes = Coupon.query.filter_by(
            is_affiliate_code=True, 
            is_active=True, 
            affiliate_id=None
        ).all()
        
        print(f"\n🔧 Found {len(orphaned_codes)} orphaned referral codes:")
        
        fixed_codes = []
        
        for code in orphaned_codes:
            print(f"\n  Code: {code.code}")
            print(f"    Discount: {code.discount_percent}%")
            print(f"    Commission: {code.affiliate_commission_percent}%")
            
            # Try to match code to affiliate
            affiliate = None
            
            # First, try pattern matching
            for pattern, affiliate_name in code_mapping.items():
                if code.code.startswith(pattern):
                    affiliate = Affiliate.query.filter_by(name=affiliate_name).first()
                    if affiliate:
                        print(f"    → Matched to {affiliate.name} by pattern '{pattern}'")
                        break
            
            # If no pattern match, use the first active affiliate as fallback
            if not affiliate and affiliates:
                affiliate = affiliates[0]  # Use first active affiliate
                print(f"    → Assigned to {affiliate.name} (fallback)")
            
            if affiliate:
                # Link the code to the affiliate
                code.affiliate_id = affiliate.id
                
                # Set commission if not already set
                if not code.affiliate_commission_percent:
                    code.affiliate_commission_percent = affiliate.commission_rate
                    print(f"    → Set commission to {affiliate.commission_rate}%")
                
                db.session.add(code)
                fixed_codes.append((code.code, affiliate.name))
                print(f"    ✅ Linked to {affiliate.name}")
            else:
                print(f"    ❌ Could not find affiliate to link to")
        
        if fixed_codes:
            db.session.commit()
            print(f"\n✅ Successfully fixed {len(fixed_codes)} referral codes:")
            for code_name, affiliate_name in fixed_codes:
                print(f"  {code_name} → {affiliate_name}")
        else:
            print("\n⚠️  No codes needed fixing")
        
        # Verify the fix
        print(f"\n🔍 Verification - checking for remaining orphaned codes...")
        remaining_orphaned = Coupon.query.filter_by(
            is_affiliate_code=True, 
            is_active=True, 
            affiliate_id=None
        ).count()
        
        if remaining_orphaned == 0:
            print("✅ All referral codes are now properly linked to affiliates!")
        else:
            print(f"⚠️  {remaining_orphaned} codes still need manual linking")
        
        return len(fixed_codes)

if __name__ == '__main__':
    print("🚀 Fixing Orphaned Referral Codes")
    print("=" * 50)
    
    try:
        fixed_count = fix_orphaned_referral_codes()
        print(f"\n🎉 Process completed! Fixed {fixed_count} referral codes.")
        print("\n💡 Now all referral codes should properly track usage when used in orders!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()