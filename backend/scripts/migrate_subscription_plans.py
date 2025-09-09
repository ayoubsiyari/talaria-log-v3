#!/usr/bin/env python3
"""
Migration script to add missing columns to subscription_plans table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app, db

def migrate_subscription_plans():
    """Add missing columns to subscription_plans table"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Add missing columns if they don't exist
            with db.engine.connect() as conn:
                # Check if columns exist
                result = conn.execute(db.text("PRAGMA table_info(subscription_plans)"))
                columns = [row[1] for row in result.fetchall()]
                
                print(f"Current columns: {columns}")
                
                # Add missing columns
                if 'max_projects' not in columns:
                    print("Adding max_projects column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN max_projects INTEGER"))
                
                if 'storage_limit' not in columns:
                    print("Adding storage_limit column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN storage_limit INTEGER"))
                
                if 'trial_days' not in columns:
                    print("Adding trial_days column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN trial_days INTEGER DEFAULT 0"))
                
                if 'trial_price' not in columns:
                    print("Adding trial_price column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN trial_price FLOAT DEFAULT 0.0"))
                
                if 'is_popular' not in columns:
                    print("Adding is_popular column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN is_popular BOOLEAN DEFAULT FALSE"))
                
                if 'sort_order' not in columns:
                    print("Adding sort_order column...")
                    conn.execute(db.text("ALTER TABLE subscription_plans ADD COLUMN sort_order INTEGER DEFAULT 0"))
                
                conn.commit()
                print("✅ Migration completed successfully!")
                
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            return False
        
        return True

if __name__ == '__main__':
    print("🚀 Migrating subscription_plans table...")
    success = migrate_subscription_plans()
    if success:
        print("🎉 Migration completed successfully!")
    else:
        print("❌ Migration failed")
        sys.exit(1)
