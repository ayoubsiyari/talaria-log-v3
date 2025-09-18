#!/usr/bin/env python3
"""
Test Stripe availability
"""

def test_stripe():
    try:
        import stripe
        print("✅ Stripe is available")
        
        # Check if Stripe is configured
        try:
            stripe.api_key = "test_key"  # Just to test if we can set it
            print("✅ Stripe can be configured")
        except Exception as e:
            print(f"❌ Stripe configuration error: {e}")
            
    except ImportError as e:
        print(f"❌ Stripe not available: {e}")
    except Exception as e:
        print(f"❌ Stripe error: {e}")

if __name__ == "__main__":
    test_stripe()










