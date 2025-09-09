#!/usr/bin/env python3
"""
Direct API test to see the actual error
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
from flask_jwt_extended import create_access_token

def test_direct_api():
    """Test the API logic directly"""
    
    app = create_app()
    
    with app.app_context():
        print("🔍 Testing Staff Log API Logic Directly")
        print("=" * 50)
        
        try:
            # Simulate the API logic
            print("1. Getting query parameters...")
            page = 1
            per_page = 50
            
            print("2. Building query...")
            query = SupportTicket.query.filter(
                SupportTicket.assigned_to.isnot(None)
            )
            
            print("3. Getting total count...")
            total = query.count()
            print(f"   Total: {total}")
            
            print("4. Applying pagination and sorting...")
            query = query.order_by(desc(SupportTicket.updated_at))
            tickets = query.offset((page - 1) * per_page).limit(per_page).all()
            print(f"   Found {len(tickets)} tickets")
            
            print("5. Processing assignments...")
            assignments = []
            for i, ticket in enumerate(tickets):
                print(f"   Processing ticket {i+1}: ID={ticket.id}")
                
                # Calculate response time
                response_time = None
                if ticket.messages:
                    first_message = min(ticket.messages, key=lambda m: m.created_at)
                    first_admin_reply = next((m for m in ticket.messages if m.admin_user_id is not None), None)
                    
                    if first_admin_reply and first_message.created_at < first_admin_reply.created_at:
                        time_diff = first_admin_reply.created_at - first_message.created_at
                        hours = int(time_diff.total_seconds() // 3600)
                        minutes = int((time_diff.total_seconds() % 3600) // 60)
                        response_time = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
                
                # Get assigned user email
                assigned_user_email = None
                if ticket.assigned_to:
                    # Try to find admin user first
                    assigned_admin = AdminUser.query.get(ticket.assigned_to)
                    if assigned_admin:
                        assigned_user_email = assigned_admin.email
                    else:
                        # Try to find regular user
                        assigned_user = User.query.get(ticket.assigned_to)
                        if assigned_user:
                            assigned_user_email = assigned_user.email
                
                assignment = {
                    'id': ticket.id,
                    'ticket_id': f"TKT-{ticket.id:03d}",
                    'ticket_subject': ticket.subject,
                    'assigned_by': 'System',
                    'assigned_to': assigned_user_email or f"User ID: {ticket.assigned_to}",
                    'assigned_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
                    'status': ticket.status.value if ticket.status else None,
                    'priority': ticket.priority.value if ticket.priority else None,
                    'response_time': response_time,
                    'resolution_time': None,
                    'customer_rating': ticket.user_rating,
                    'category': ticket.category.name if ticket.category else None
                }
                assignments.append(assignment)
                print(f"     Created assignment: {assignment['ticket_id']} -> {assignment['assigned_to']}")
            
            print(f"\n✅ Successfully processed {len(assignments)} assignments")
            
            # Test JSON serialization
            print("6. Testing JSON serialization...")
            import json
            json_result = {
                'success': True,
                'assignments': assignments,
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
            
            json_str = json.dumps(json_result, indent=2)
            print(f"   JSON serialization successful, length: {len(json_str)}")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    try:
        success = test_direct_api()
        if success:
            print("\n🎉 Direct API test completed successfully!")
        else:
            print("\n💥 Direct API test failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Direct API test failed with exception: {str(e)}")
        sys.exit(1)
