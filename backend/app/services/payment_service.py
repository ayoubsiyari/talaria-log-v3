"""
Payment Service
Handles payment processing with Stripe and other providers
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from flask import current_app
from .. import db
from ..models.payment import Order, OrderItem, Payment
from ..models.promotion import Promotion
from config.payment_config import get_payment_config, validate_payment_config

# Optional Stripe import
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

class PaymentService:
    """Payment processing service with Stripe integration"""
    
    def __init__(self):
        self.stripe_config = get_payment_config('stripe')
        if STRIPE_AVAILABLE and stripe:
            stripe.api_key = self.stripe_config['secret_key']
            stripe.api_version = self.stripe_config['api_version']
    
    def create_order(self, order_data: Dict[str, Any]) -> Tuple[Order, Dict[str, Any]]:
        """Create a new order with items and apply promotions"""
        try:
            # Generate unique order number
            order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Create order
            order = Order(
                order_number=order_number,
                user_id=order_data.get('user_id'),
                customer_email=order_data['customer_email'],
                customer_name=order_data['customer_name'],
                payment_provider='stripe'
            )
            
            # Add order items
            for item_data in order_data['items']:
                item = OrderItem(
                    product_name=item_data['name'],
                    product_id=item_data.get('product_id'),
                    description=item_data.get('description'),
                    unit_price=float(item_data['price']),
                    quantity=item_data.get('quantity', 1),
                    total_price=float(item_data['price']) * item_data.get('quantity', 1)
                )
                order.items.append(item)
            
            # Calculate initial totals first
            order.calculate_totals()
            
            # Apply promotion if provided
            if order_data.get('promotion_code'):
                promotion = self.apply_promotion(order, order_data['promotion_code'])
                if promotion:
                    order.promotion = promotion
                    order.promotion_code = promotion.code
                    # Recalculate totals after applying promotion
                    order.calculate_totals()
            
            # Save order
            db.session.add(order)
            db.session.commit()
            
            # Create Stripe payment intent
            payment_intent = self.create_payment_intent(order)
            
            return order, payment_intent
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to create order: {str(e)}")
    
    def apply_promotion(self, order: Order, promotion_code: str) -> Optional[Promotion]:
        """Apply promotion code to order"""
        try:
            # Find promotion
            promotion = Promotion.query.filter_by(code=promotion_code.upper()).first()
            if not promotion:
                raise Exception("Invalid promotion code")
            
            # Validate promotion
            if not promotion.is_valid():
                raise Exception("Promotion is not valid")
            
            # Check usage limits
            if promotion.usage_limit and promotion.usage_count >= promotion.usage_limit:
                raise Exception("Promotion usage limit exceeded")
            
            # Set promotion details (discount calculation will be done in calculate_totals)
            if promotion.type == 'percentage':
                order.discount_percentage = float(promotion.value)
            elif promotion.type == 'fixed':
                order.discount_fixed = float(promotion.value)
            
            # Update promotion usage
            promotion.increment_usage()
            
            return promotion
            
        except Exception as e:
            raise Exception(f"Failed to apply promotion: {str(e)}")
    
    def create_payment_intent(self, order: Order) -> Dict[str, Any]:
        """Create Stripe payment intent"""
        try:
            if not STRIPE_AVAILABLE:
                raise Exception("Stripe is not available. Please install stripe package.")
            
            # Convert amount to cents (Stripe requirement)
            amount_cents = int(order.total_amount * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=self.stripe_config['currency'],
                metadata={
                    'order_number': order.order_number,
                    'order_id': order.id,
                    'customer_email': order.customer_email
                },
                description=f"Order {order.order_number}",
                receipt_email=order.customer_email
            )
            
            # Update order with payment intent
            order.payment_intent_id = payment_intent.id
            db.session.commit()
            
            return {
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'amount': order.total_amount,
                'currency': self.stripe_config['currency']
            }
            
        except Exception as e:
            raise Exception(f"Failed to create payment intent: {str(e)}")
    
    def process_payment_success(self, payment_intent_id: str) -> Order:
        """Process successful payment"""
        try:
            if not STRIPE_AVAILABLE:
                raise Exception("Stripe is not available. Please install stripe package.")
            
            # Get payment intent from Stripe
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Find order
            order = Order.query.filter_by(payment_intent_id=payment_intent_id).first()
            if not order:
                raise Exception("Order not found")
            
            # Update order status
            order.status = 'paid'
            order.payment_status = 'paid'
            order.paid_at = datetime.utcnow()
            
            # Create payment record
            payment = Payment(
                order_id=order.id,
                amount=order.total_amount,
                currency=self.stripe_config['currency'],
                payment_method='card',
                provider='stripe',
                provider_payment_id=payment_intent_id,
                provider_transaction_id=payment_intent.charges.data[0].id if payment_intent.charges.data else None,
                status='succeeded',
                processed_at=datetime.utcnow(),
                metadata={
                    'payment_intent': payment_intent.to_dict()
                }
            )
            
            db.session.add(payment)
            
            # Create UserSubscription record if this is a subscription order
            self._create_user_subscription_from_order(order)
            
            db.session.commit()
            
            return order
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to process payment: {str(e)}")
    
    def _create_user_subscription_from_order(self, order: Order):
        """Create UserSubscription record from order"""
        try:
            from ..models.user import User
            from ..models.subscription import SubscriptionPlan
            from ..models.user_subscription import UserSubscription, SubscriptionStatus, BillingCycle
            from datetime import timedelta
            from billing_cycle_mapper import map_plan_billing_cycle_to_user
            
            # Find user
            user = None
            if order.user_id:
                user = User.query.get(order.user_id)
            elif order.customer_email:
                user = User.query.filter_by(email=order.customer_email).first()
            
            if not user:
                current_app.logger.warning(f"No user found for order {order.id}")
                return
            
            # Find subscription plan from order items
            plan = None
            for item in order.items:
                if 'subscription' in item.product_name.lower() or 'plan' in item.product_name.lower():
                    # Try to find plan by name - more flexible matching
                    plan_name = item.product_name.lower()
                    
                    # First try exact name match
                    plan = SubscriptionPlan.query.filter(
                        SubscriptionPlan.name.ilike(f"%{item.product_name}%")
                    ).first()
                    
                    # If no exact match, try common variations
                    if not plan:
                        if 'basic' in plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Basic').first()
                        elif 'professional' in plan_name or 'pro' in plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Professional').first()
                        elif 'enterprise' in plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Enterprise').first()
                        elif 'premium' in plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Premium').first()
                    
                    # If still no match, try to find any plan with similar name
                    if not plan:
                        all_plans = SubscriptionPlan.query.filter_by(is_active=True).all()
                        for p in all_plans:
                            if any(word in plan_name for word in p.name.lower().split()):
                                plan = p
                                break
                    
                    if plan:
                        current_app.logger.info(f"Found plan: {plan.name} (ID: {plan.id}) for product: {item.product_name}")
                        break
            
            # If no plan found, use Basic as default
            if not plan:
                plan = SubscriptionPlan.query.filter_by(name='Basic').first()
                if not plan:
                    current_app.logger.warning(f"No subscription plan found for order {order.id}")
                    return
            
            # Create UserSubscription
            subscription = UserSubscription(
                user_id=user.id,
                plan_id=plan.id,
                subscription_id=f"stripe_{order.payment_intent_id}",
                plan_name=plan.name,
                plan_type=plan.billing_cycle.value,
                status=SubscriptionStatus.ACTIVE,
                amount=order.total_amount,
                currency='USD',
                billing_cycle=map_plan_billing_cycle_to_user(plan.billing_cycle),
                unit_amount=order.total_amount,
                total_amount=order.total_amount,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),  # 30 days for now
                payment_method='card',
                payment_provider='stripe',
                payment_provider_id=order.payment_intent_id,
                admin_notes=f'Created from order {order.order_number}'
            )
            
            # Activate user
            user.is_active = True
            user.subscription_status = 'active'
            
            db.session.add(subscription)
            current_app.logger.info(f"Created subscription {subscription.id} for user {user.email} from order {order.id}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to create subscription from order {order.id}: {str(e)}")
            # Don't raise - this shouldn't break the payment process
    
    def process_payment_failure(self, payment_intent_id: str, failure_reason: str) -> Order:
        """Process failed payment"""
        try:
            # Find order
            order = Order.query.filter_by(payment_intent_id=payment_intent_id).first()
            if not order:
                raise Exception("Order not found")
            
            # Update order status
            order.payment_status = 'failed'
            
            # Create payment record
            payment = Payment(
                order_id=order.id,
                amount=order.total_amount,
                currency=self.stripe_config['currency'],
                payment_method='card',
                provider='stripe',
                provider_payment_id=payment_intent_id,
                status='failed',
                failure_reason=failure_reason,
                processed_at=datetime.utcnow()
            )
            
            db.session.add(payment)
            db.session.commit()
            
            return order
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to process payment failure: {str(e)}")
    
    def refund_payment(self, order_id: int, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund payment"""
        try:
            if not STRIPE_AVAILABLE:
                raise Exception("Stripe is not available. Please install stripe package.")
            
            order = Order.query.get(order_id)
            if not order:
                raise Exception("Order not found")
            
            payment = Payment.query.filter_by(order_id=order_id, status='succeeded').first()
            if not payment:
                raise Exception("Payment not found")
            
            # Create refund in Stripe
            refund_amount = int((amount or order.total_amount) * 100)
            refund = stripe.Refund.create(
                payment_intent=payment.provider_payment_id,
                amount=refund_amount
            )
            
            # Update order status
            order.status = 'refunded'
            
            # Create refund payment record
            refund_payment = Payment(
                order_id=order.id,
                amount=-(amount or order.total_amount),
                currency=self.stripe_config['currency'],
                payment_method='refund',
                provider='stripe',
                provider_payment_id=refund.id,
                status='succeeded',
                processed_at=datetime.utcnow(),
                metadata={
                    'refund': refund.to_dict(),
                    'original_payment_id': payment.provider_payment_id
                }
            )
            
            db.session.add(refund_payment)
            db.session.commit()
            
            return {
                'refund_id': refund.id,
                'amount': amount or order.total_amount,
                'status': 'succeeded'
            }
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to refund payment: {str(e)}")
    
    def get_payment_config(self) -> Dict[str, Any]:
        """Get payment configuration for frontend"""
        return {
            'publishable_key': self.stripe_config['publishable_key'],
            'currency': self.stripe_config['currency'],
            'supported_currencies': ['usd', 'eur', 'gbp']
        }
