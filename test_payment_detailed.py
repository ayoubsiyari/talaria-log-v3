#!/usr/bin/env python3
"""
Detailed test of payment success endpoint
"""

def test_payment_success_detailed():
    """Test the payment success function with detailed error handling"""
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
                    'order_id': 'test_order_123',
                    'payment_intent_id': 'pi_test_123',
                    'customer_email': 'test@example.com'
                }),
                content_type='application/json'
            ):
                print("🧪 Testing payment success endpoint with detailed error handling...")
                
                # Import the payment success function
                from app.routes.payments import payment_success
                
                print("✅ Payment success function imported")
                
                # Call the function and catch any errors
                try:
                    result = payment_success()
                    print(f"✅ Payment success result: {result}")
                    print(f"✅ Status code: {result[1] if isinstance(result, tuple) else 'Not a tuple'}")
                except Exception as e:
                    print(f"❌ Error calling payment_success: {e}")
                    import traceback
                    print(f"❌ Traceback: {traceback.format_exc()}")
                
    except Exception as e:
        print(f"❌ Setup error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_payment_success_detailed()