#!/usr/bin/env python3
"""
Test payment success endpoint directly
"""

def test_payment_success_direct():
    """Test the payment success function directly"""
    try:
        # Set up Flask app context
        import sys
        sys.path.append('/var/www/talaria-admin/backend')
        
        from app import create_app
        from flask import request
        import json
        
        app = create_app()
        
        with app.app_context():
            with app.test_request_context(
                '/api/payments/payment-success',
                method='POST',
                data=json.dumps({
                    'order_id': 'test_order',
                    'payment_intent_id': 'test_pi',
                    'customer_email': 'test@example.com'
                }),
                content_type='application/json'
            ):
                print("🧪 Testing payment success endpoint directly...")
                
                # Import the payment success function
                from app.routes.payments import payment_success
                
                print("✅ Payment success function imported")
                
                # Call the function
                result = payment_success()
                print(f"✅ Payment success result: {result}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_payment_success_direct()










