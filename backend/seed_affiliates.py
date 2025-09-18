#!/usr/bin/env python3
"""
Seed script to populate affiliate data for testing purposes.
Run with: python seed_affiliates.py
"""

import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.affiliate import Affiliate

def seed_affiliates():
    """Seed the database with sample affiliate data."""
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing affiliate data...")
        Affiliate.query.delete()
        db.session.commit()
        
        # Sample affiliate data based on the frontend mock
        affiliates_data = [
            {
                'name': "TradingGuru Blog",
                'email': "contact@tradingguru.com",
                'status': "active",
                'join_date': datetime(2024, 1, 15),
                'commission_rate': 25.0,
                'total_earnings': 2450.75,
                'referrals': 89,
                'conversions': 34,
                'website': "https://tradingguru.com",
                'social_media': "@tradingguru",
                'category': "Blog",
                'performance': "excellent"
            },
            {
                'name': "FinanceInfluencer",
                'email': "partnerships@financeinfluencer.com",
                'status': "active",
                'join_date': datetime(2024, 2, 20),
                'commission_rate': 30.0,
                'total_earnings': 3890.20,
                'referrals': 156,
                'conversions': 67,
                'website': "https://financeinfluencer.com",
                'social_media': "@financeinfluencer",
                'category': "Influencer",
                'performance': "excellent"
            },
            {
                'name': "InvestmentPodcast",
                'email': "ads@investmentpodcast.com",
                'status': "pending",
                'join_date': datetime(2024, 8, 10),
                'commission_rate': 20.0,
                'total_earnings': 0,
                'referrals': 0,
                'conversions': 0,
                'website': "https://investmentpodcast.com",
                'social_media': "@investmentpodcast",
                'category': "Podcast",
                'performance': "new"
            },
            {
                'name': "CryptoTrader Pro",
                'email': "affiliate@cryptotraderpro.com",
                'status': "suspended",
                'join_date': datetime(2024, 3, 5),
                'commission_rate': 25.0,
                'total_earnings': 1234.50,
                'referrals': 45,
                'conversions': 12,
                'website': "https://cryptotraderpro.com",
                'social_media': "@cryptotraderpro",
                'category': "YouTube",
                'performance': "poor"
            },
            {
                'name': "StockMarket Daily",
                'email': "affiliate@stockmarketdaily.com",
                'status': "active",
                'join_date': datetime(2024, 4, 12),
                'commission_rate': 22.0,
                'total_earnings': 1876.30,
                'referrals': 78,
                'conversions': 29,
                'website': "https://stockmarketdaily.com",
                'social_media': "@stockmarketdaily",
                'category': "News",
                'performance': "good"
            },
            {
                'name': "TechInvestor",
                'email': "partnerships@techinvestor.com",
                'status': "active",
                'join_date': datetime(2024, 5, 18),
                'commission_rate': 28.0,
                'total_earnings': 3120.45,
                'referrals': 134,
                'conversions': 58,
                'website': "https://techinvestor.com",
                'social_media': "@techinvestor",
                'category': "Blog",
                'performance': "excellent"
            }
        ]
        
        print("Creating affiliate records...")
        for data in affiliates_data:
            affiliate = Affiliate(**data)
            # Calculate conversion rate and performance
            affiliate.update_conversion_rate()
            affiliate.calculate_performance()
            db.session.add(affiliate)
        
        # Commit all changes
        db.session.commit()
        
        print(f"✅ Successfully created {len(affiliates_data)} affiliate records!")
        
        # Verify the data
        total_count = Affiliate.query.count()
        active_count = Affiliate.query.filter_by(status='active').count()
        pending_count = Affiliate.query.filter_by(status='pending').count()
        suspended_count = Affiliate.query.filter_by(status='suspended').count()
        
        print(f"Summary:")
        print(f"  Total affiliates: {total_count}")
        print(f"  Active: {active_count}")
        print(f"  Pending: {pending_count}")
        print(f"  Suspended: {suspended_count}")

if __name__ == '__main__':
    seed_affiliates()