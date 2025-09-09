#!/usr/bin/env python3
"""
Create a demo promotion for testing QR code functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.promotion import Promotion
from datetime import datetime, timedelta

def create_demo_promotion():
    app = create_app('development')
    
    with app.app_context():
        # Check if demo promotion already exists
        existing = Promotion.query.filter_by(code='DEMO2024').first()
        if existing:
            print("Demo promotion already exists!")
            return existing
        
        # Create demo promotion
        demo_promotion = Promotion(
            name="Demo Summer Sale",
            description="Get 25% off your next purchase with this exclusive demo promotion!",
            code="DEMO2024",
            type="percentage",
            value=25.0,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            usage_limit=100,
            status="active"
        )
        
        db.session.add(demo_promotion)
        db.session.commit()
        
        print("✅ Demo promotion created successfully!")
        print(f"Code: {demo_promotion.code}")
        print(f"Value: {demo_promotion.value}% off")
        print(f"URL: http://localhost:5173/promo/{demo_promotion.code}")
        print(f"QR Code URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={demo_promotion.code}")
        
        return demo_promotion

if __name__ == "__main__":
    create_demo_promotion()
