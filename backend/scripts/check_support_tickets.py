#!/usr/bin/env python3
"""
Check support tickets in the database
"""

import sys
import os

# Add the parent directory to the path so we can import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.support import SupportTicket, SupportMessage, SupportCategory

def check_support_tickets():
    """Check support tickets in the database"""
    
    app = create_app()
    
    with app.app_context():
        print("🔍 Checking Support Tickets in Database")
        print("=" * 50)
        
        # Check tickets
        total_tickets = SupportTicket.query.count()
        print(f"Total tickets: {total_tickets}")
        
        if total_tickets > 0:
            print("\n📋 Sample tickets:")
            tickets = SupportTicket.query.limit(5).all()
            for ticket in tickets:
                print(f"  - ID: {ticket.id}, Subject: {ticket.subject}, Assigned: {ticket.assigned_to}, Status: {ticket.status}")
        
        # Check assigned tickets
        assigned_tickets = SupportTicket.query.filter(SupportTicket.assigned_to.isnot(None)).count()
        print(f"\nAssigned tickets: {assigned_tickets}")
        
        # Check categories
        total_categories = SupportCategory.query.count()
        print(f"Total categories: {total_categories}")
        
        # Check messages
        total_messages = SupportMessage.query.count()
        print(f"Total messages: {total_messages}")
        
        return total_tickets > 0

if __name__ == "__main__":
    try:
        has_tickets = check_support_tickets()
        if has_tickets:
            print("\n✅ Database has support tickets")
        else:
            print("\n⚠️  No support tickets found in database")
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)
