#!/usr/bin/env python3
"""
Debug script for Staff Log API endpoint
"""

import sys
import os

# Add the parent directory to the path so we can import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.support import SupportTicket, SupportMessage, SupportCategory
from app.models.rbac import AdminUser
from app.models.user import User
from sqlalchemy import desc

def debug_staff_log():
    """Debug the staff log functionality"""
    
    app = create_app()
    
    with app.app_context():
        print("🔍 Debugging Staff Log Functionality")
        print("=" * 50)
        
        try:
            # Test the query that's failing
            print("1. Testing basic query...")
            query = SupportTicket.query.filter(
                SupportTicket.assigned_to.isnot(None)
            )
            
            total = query.count()
            print(f"   Total assigned tickets: {total}")
            
            if total > 0:
                print("2. Testing pagination...")
                tickets = query.order_by(desc(SupportTicket.updated_at)).limit(5).all()
                print(f"   Found {len(tickets)} tickets")
                
                print("3. Testing assignment processing...")
                for i, ticket in enumerate(tickets):
                    print(f"   Ticket {i+1}: ID={ticket.id}, Assigned={ticket.assigned_to}")
                    
                    # Test the assignment processing logic
                    assigned_user_email = None
                    if ticket.assigned_to:
                        # Try to find admin user first
                        assigned_admin = AdminUser.query.get(ticket.assigned_to)
                        if assigned_admin:
                            assigned_user_email = assigned_admin.email
                            print(f"     Found admin: {assigned_admin.email}")
                        else:
                            # Try to find regular user
                            assigned_user = User.query.get(ticket.assigned_to)
                            if assigned_user:
                                assigned_user_email = assigned_user.email
                                print(f"     Found user: {assigned_user.email}")
                            else:
                                print(f"     No user found for ID: {ticket.assigned_to}")
                    
                    print(f"     Final email: {assigned_user_email}")
                    
                    # Test response time calculation
                    response_time = None
                    if ticket.messages:
                        print(f"     Messages count: {len(ticket.messages)}")
                        first_message = min(ticket.messages, key=lambda m: m.created_at)
                        first_admin_reply = next((m for m in ticket.messages if m.admin_user_id is not None), None)
                        
                        if first_admin_reply and first_message.created_at < first_admin_reply.created_at:
                            time_diff = first_admin_reply.created_at - first_message.created_at
                            hours = int(time_diff.total_seconds() // 3600)
                            minutes = int((time_diff.total_seconds() % 3600) // 60)
                            response_time = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
                            print(f"     Response time: {response_time}")
                    
                    # Test assignment object creation
                    assignment = {
                        'id': ticket.id,
                        'ticket_id': f"TKT-{ticket.id:03d}",
                        'ticket_subject': ticket.subject,
                        'assigned_by': 'System',
                        'assigned_to': assigned_user_email or f"User ID: {ticket.assigned_to}",
                        'assigned_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
                        'status': ticket.status,
                        'priority': ticket.priority,
                        'response_time': response_time,
                        'resolution_time': None,
                        'customer_rating': ticket.user_rating,
                        'category': ticket.category.name if ticket.category else None
                    }
                    print(f"     Assignment object created successfully")
                    
            print("\n✅ All tests passed!")
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = debug_staff_log()
        if success:
            print("\n🎉 Debug completed successfully!")
        else:
            print("\n💥 Debug failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Debug failed with exception: {str(e)}")
        sys.exit(1)
