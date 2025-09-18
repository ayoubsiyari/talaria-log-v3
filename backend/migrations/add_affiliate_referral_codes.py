"""
Migration: Add affiliate referral fields to coupons table
Date: 2024-01-18
Description: Extends coupons table to support affiliate referral codes
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db

def run_migration():
    """Run the migration to add affiliate referral fields to coupons table"""
    
    app = create_app()
    
    with app.app_context():
        try:
            # SQL commands to add the new columns
            migration_sql = [
                # Add affiliate referral fields to coupons table
                "ALTER TABLE coupons ADD COLUMN affiliate_id INTEGER DEFAULT NULL;",
                "ALTER TABLE coupons ADD COLUMN is_affiliate_code BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE coupons ADD COLUMN affiliate_commission_percent REAL DEFAULT NULL;",
                
                # Add foreign key constraint (if supported by SQLite)
                # Note: SQLite doesn't support adding foreign keys to existing tables
                # We'll handle the relationship at the application level
            ]
            
            for sql in migration_sql:
                try:
                    with db.engine.connect() as connection:
                        connection.execute(db.text(sql))
                        connection.commit()
                    print(f"✅ Executed: {sql}")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print(f"⚠️  Column already exists: {sql}")
                    else:
                        print(f"❌ Error executing {sql}: {e}")
            
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise e

if __name__ == "__main__":
    run_migration()