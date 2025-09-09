#!/usr/bin/env python3
"""
Clear Promotions Script
=======================

This script clears all mock promotion data from the database.
Use this to start fresh with real data only.

Usage:
    python scripts/clear_promotions.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Promotion

def clear_promotions():
    """Clear all promotion data from the database"""
    app = create_app()
    
    with app.app_context():
        try:
            # Count existing promotions
            count = Promotion.query.count()
            print(f"Found {count} existing promotions")
            
            if count > 0:
                # Delete all promotions
                Promotion.query.delete()
                db.session.commit()
                print(f"✅ Successfully cleared {count} promotions from database")
            else:
                print("✅ Database is already clean - no promotions found")
                
            # Verify cleanup
            remaining = Promotion.query.count()
            print(f"📊 Remaining promotions: {remaining}")
            
        except Exception as e:
            print(f"❌ Error clearing promotions: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("🧹 Clearing all promotion data...")
    clear_promotions()
    print("✅ Done! Database is now clean and ready for real data.")
