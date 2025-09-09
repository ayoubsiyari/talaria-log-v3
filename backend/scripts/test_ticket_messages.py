#!/usr/bin/env python3
"""
Test script to check ticket messages
"""
import requests
import json

def test_ticket_messages():
    """Test ticket messages functionality"""
    
    base_url = "http://localhost:5000"
    
    print("🔍 Testing Ticket Messages")
    print("=" * 50)
    
    # Login as admin
    login_data = {
        "email": "admin@talaria.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        token = login_response.json()['access_token']
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        print("✅ Login successful")
        
        # Get all tickets
        print("\n1. Getting all tickets...")
        tickets_response = requests.get(f"{base_url}/api/support/tickets", headers=headers)
        
        if tickets_response.status_code == 200:
            tickets_data = tickets_response.json()
            tickets = tickets_data.get('tickets', [])
            print(f"✅ Found {len(tickets)} tickets")
            
            if tickets:
                # Get the first ticket with messages
                ticket_with_messages = None
                for ticket in tickets:
                    if ticket.get('message_count', 0) > 0:
                        ticket_with_messages = ticket
                        break
                
                if ticket_with_messages:
                    print(f"\n2. Testing ticket with messages: {ticket_with_messages['id']}")
                    print(f"   Subject: {ticket_with_messages['subject']}")
                    print(f"   Message count: {ticket_with_messages.get('message_count', 0)}")
                    
                    # Get full ticket data
                    ticket_response = requests.get(f"{base_url}/api/support/tickets/{ticket_with_messages['id']}", headers=headers)
                    
                    if ticket_response.status_code == 200:
                        ticket_data = ticket_response.json()
                        if ticket_data.get('success'):
                            ticket = ticket_data.get('ticket', {})
                            messages = ticket.get('messages', [])
                            print(f"✅ Ticket loaded successfully")
                            print(f"   Messages in response: {len(messages)}")
                            
                            for i, message in enumerate(messages[:3]):  # Show first 3 messages
                                print(f"   Message {i+1}:")
                                print(f"     ID: {message.get('id')}")
                                print(f"     Author: {message.get('author_name', 'Unknown')}")
                                print(f"     Is admin reply: {message.get('is_admin_reply', False)}")
                                print(f"     Message: {message.get('message', 'No content')[:50]}...")
                                print(f"     Created: {message.get('created_at')}")
                        else:
                            print(f"❌ Failed to load ticket: {ticket_data.get('error')}")
                    else:
                        print(f"❌ Failed to get ticket: {ticket_response.status_code}")
                else:
                    print("\n2. No tickets with messages found")
                    
                    # Create a test message
                    print("\n3. Creating a test message...")
                    if tickets:
                        test_ticket = tickets[0]
                        message_data = {
                            "message": "This is a test message from the admin",
                            "is_internal": False
                        }
                        
                        message_response = requests.post(
                            f"{base_url}/api/support/tickets/{test_ticket['id']}/messages", 
                            json=message_data, 
                            headers=headers
                        )
                        
                        if message_response.status_code == 201:
                            print("✅ Test message created successfully")
                            
                            # Now get the ticket again to see the message
                            ticket_response = requests.get(f"{base_url}/api/support/tickets/{test_ticket['id']}", headers=headers)
                            if ticket_response.status_code == 200:
                                ticket_data = ticket_response.json()
                                if ticket_data.get('success'):
                                    ticket = ticket_data.get('ticket', {})
                                    messages = ticket.get('messages', [])
                                    print(f"✅ Ticket now has {len(messages)} messages")
                                    
                                    for i, message in enumerate(messages):
                                        print(f"   Message {i+1}:")
                                        print(f"     ID: {message.get('id')}")
                                        print(f"     Author: {message.get('author_name', 'Unknown')}")
                                        print(f"     Is admin reply: {message.get('is_admin_reply', False)}")
                                        print(f"     Message: {message.get('message', 'No content')}")
                                        print(f"     Created: {message.get('created_at')}")
                        else:
                            print(f"❌ Failed to create test message: {message_response.status_code}")
                            print(f"   Response: {message_response.text}")
            else:
                print("❌ No tickets found")
        else:
            print(f"❌ Failed to get tickets: {tickets_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ticket_messages()
