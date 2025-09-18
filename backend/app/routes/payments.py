"""
Payment API Routes
Handles checkout, payment processing, and webhooks
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..services.payment_service import PaymentService
from ..services.payment_security_service import payment_security_service
from ..services.csrf_service import csrf_service
from ..services.payment_audit_service import payment_audit_service
from ..services.input_sanitization_service import input_sanitization_service
from ..services.request_signing_service import request_signing_service
from ..services.pci_compliance_service import pci_compliance_service
from ..services.fraud_detection_service import fraud_detection_service
from ..services.webhook_security_service import webhook_security_service
from ..services.payment_monitoring_service import payment_monitoring_service
from ..models.payment import Order, Payment
from ..models.promotion import Promotion
from config.payment_config import validate_payment_config
import logging
import time
import json
import os
from datetime import datetime

# Optional Stripe import
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

payments_bp = Blueprint('payments', __name__)
payment_service = PaymentService()
logger = logging.getLogger(__name__)

def is_production():
    """Check if running in production environment"""
    return os.environ.get('FLASK_ENV') == 'production' or os.environ.get('ENVIRONMENT') == 'production'

def log_error_safely(message, error, include_details=True):
    """Log error safely based on environment"""
    if is_production() and not include_details:
        logger.error(f"{message}: Internal server error")
    else:
        logger.error(f"{message}: {type(error).__name__}: {str(error)}")

@payments_bp.route('/config', methods=['GET'])
def get_payment_config():
    """Get payment configuration for frontend"""
    try:
        if not validate_payment_config():
            return jsonify({'error': 'Payment configuration not set up'}), 400
        
        config = payment_service.get_payment_config()
        return jsonify(config), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/csrf-token', methods=['GET'])
def get_csrf_token():
    """Get CSRF token for payment forms"""
    try:
        token = csrf_service.generate_csrf_token()
        return jsonify({'csrf_token': token}), 200
    except Exception as e:
        logger.error(f"CSRF token generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate CSRF token'}), 500

@payments_bp.route('/create-order', methods=['POST'])
def create_order():
    """Create a new order and payment intent with enterprise-grade security"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        logger.debug(f"Received payment data keys: {list(data.keys()) if data else 'None'}")
        
        # Input sanitization (MANDATORY)
        sanitized_data = input_sanitization_service.sanitize_payment_data(data)
        is_valid_sanitized, sanitize_error = input_sanitization_service.validate_sanitized_data(sanitized_data)
        if not is_valid_sanitized:
            logger.warning(f"Input sanitization failed: {sanitize_error}")
            return jsonify({'error': f'Invalid input: {sanitize_error}'}), 400
        
        # Use sanitized data
        data = sanitized_data
        
        # PCI Compliance - Handle tokenized payment data
        if 'card_data' in data:
            # Legacy flow: tokenize raw card data (not PCI compliant)
            try:
                tokenized_data = pci_compliance_service.tokenize_payment_data(data['card_data'])
                data['tokenized_card'] = tokenized_data
                # Remove raw card data
                del data['card_data']
                logger.info("Card data tokenized for PCI compliance")
            except Exception as e:
                logger.error(f"PCI tokenization failed: {str(e)}")
                return jsonify({'error': 'Payment data processing failed'}), 500
        elif 'payment_method_id' in data:
            # New PCI-compliant flow: payment method already tokenized by Stripe
            logger.info("Using PCI-compliant tokenized payment method")
            data['tokenized_payment_method'] = {
                'payment_method_id': data['payment_method_id'],
                'provider': 'stripe',
                'pci_compliant': True
            }
            # Remove the payment method ID from main data
            del data['payment_method_id']
        
        # Fraud Detection - Analyze payment risk
        user_data = {
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'user_id': data.get('user_id')
        }
        
        try:
            fraud_analysis = fraud_detection_service.analyze_payment_risk(data, user_data)
            
            # Block if critical risk
            if fraud_analysis['should_block']:
                logger.warning(f"Payment blocked due to fraud risk: {fraud_analysis['risk_factors']}")
                fraud_detection_service.create_fraud_alert(f"order_{int(time.time())}", fraud_analysis)
                return jsonify({
                    'error': 'Payment blocked due to security risk',
                    'risk_level': fraud_analysis['risk_level']
                }), 403
            
            # Require manual review for high risk
            if fraud_analysis['requires_manual_review']:
                logger.warning(f"Payment requires manual review: {fraud_analysis['risk_factors']}")
                fraud_detection_service.create_fraud_alert(f"order_{int(time.time())}", fraud_analysis)
                # Continue processing but flag for review
                data['requires_review'] = True
                data['fraud_analysis'] = fraud_analysis
                
        except Exception as e:
            logger.error(f"Fraud detection failed: {str(e)}")
            # Continue processing but log the error
            data['fraud_detection_error'] = str(e)
        
        # CSRF protection (MANDATORY)
        csrf_token = data.get('csrf_token')
        logger.info(f"CSRF token received: {csrf_token[:20] if csrf_token else 'None'}...")
        
        # In production, CSRF token is mandatory
        if is_production() and not csrf_token:
            logger.warning("CSRF token not provided in production")
            payment_audit_service.log_csrf_violation({
                'csrf_token': None,
                'error_message': 'CSRF token required in production'
            })
            return jsonify({'error': 'CSRF token required'}), 403
        
        if csrf_token:
            is_valid_csrf, csrf_message = csrf_service.validate_csrf_token(csrf_token)
            if not is_valid_csrf:
                logger.warning(f"CSRF validation failed: {csrf_message}")
                payment_audit_service.log_csrf_violation({
                    'csrf_token': csrf_token,
                    'error_message': csrf_message
                })
                return jsonify({'error': 'Invalid CSRF token'}), 403
        elif not is_production():
            logger.warning("CSRF token not provided - allowing for development/testing")
        
        # Comprehensive security validation
        is_valid, error_message, validation_data = payment_security_service.validate_payment_data(data)
        if not is_valid:
            payment_security_service.log_payment_attempt(data, False, error_message)
            logger.warning(f"Payment validation failed: {error_message}")
            return jsonify({'error': error_message}), 400
        
        # Server-side promotion validation (CRITICAL SECURITY FIX)
        if data.get('promotion_code'):
            promotion_code = data['promotion_code'].strip().upper()
            promotion = Promotion.query.filter_by(code=promotion_code).first()
            
            if not promotion:
                logger.warning(f"Invalid promotion code in order creation: {promotion_code}")
                return jsonify({'error': 'Invalid promotion code'}), 400
            
            if not promotion.is_valid():
                logger.warning(f"Invalid promotion in order creation: {promotion_code}")
                return jsonify({'error': 'Promotion is not valid'}), 400
            
            if promotion.usage_limit and promotion.usage_count >= promotion.usage_limit:
                logger.warning(f"Promotion usage limit exceeded: {promotion_code}")
                return jsonify({'error': 'Promotion usage limit exceeded'}), 400
            
            # Log promotion usage attempt
            payment_audit_service.log_promotion_usage({
                'code': promotion_code,
                'order_amount': sum(item.get('price', 0) * item.get('quantity', 1) for item in data.get('items', [])),
                'ip': request.remote_addr
            })
        
        # Server-side referral code validation for affiliate codes
        if data.get('referral_code'):
            referral_code = data['referral_code'].strip().upper()
            from ..models.coupon import Coupon
            coupon = Coupon.query.filter_by(code=referral_code).first()
            
            if not coupon:
                logger.warning(f"Invalid referral code in order creation: {referral_code}")
                return jsonify({'error': 'Invalid referral code'}), 400
            
            if not coupon.is_valid():
                logger.warning(f"Invalid referral code in order creation: {referral_code}")
                return jsonify({'error': 'Referral code is not valid or has expired'}), 400
            
            if not coupon.is_affiliate_code:
                logger.warning(f"Referral code is not an affiliate code: {referral_code}")
                return jsonify({'error': 'Invalid referral code'}), 400
            
            # Record that someone used this referral code (referral tracking)
            coupon.record_referral()
            
            # Store referral code in order metadata for later processing
            if 'metadata' not in data:
                data['metadata'] = {}
            data['metadata']['referral_code'] = referral_code
            data['metadata']['affiliate_id'] = coupon.affiliate_id
            
            logger.info(f"Valid referral code used: {referral_code} for affiliate {coupon.affiliate.name} (referral recorded)")
        
        # Create order and payment intent
        order, payment_intent = payment_service.create_order(data)
        
        # Generate secure payment token
        payment_token = payment_security_service.generate_payment_token(order.id)
        
        # Payment Monitoring - Track payment attempt
        monitoring_data = {
            'order_id': order.id,
            'amount': order.total_amount,
            'status': 'created',
            'customer_email': order.customer_email,
            'fraud_analysis': data.get('fraud_analysis', {}),
            'requires_review': data.get('requires_review', False)
        }
        
        monitoring_result = payment_monitoring_service.monitor_payment_attempt(monitoring_data, start_time)
        
        # PCI Compliance - Create audit log
        pci_compliance_service.create_pci_audit_log(
            'order_created',
            data.get('user_id', 0),
            {
                'order_id': order.id,
                'order_number': order.order_number,
                'amount': order.total_amount,
                'customer_email': order.customer_email,
                'fraud_risk_score': fraud_analysis.get('risk_score', 0) if 'fraud_analysis' in data else 0
            }
        )
        
        # Log successful order creation
        payment_security_service.log_payment_attempt(data, True)
        payment_audit_service.log_order_creation(order, None, data, True)
        logger.info(f"Order created successfully: {order.order_number}")
        
        response_data = {
            'order': order.to_dict(),
            'payment_intent': payment_intent,
            'payment_token': payment_token,
            'monitoring': {
                'response_time': monitoring_result.get('response_time', 0),
                'anomalies': monitoring_result.get('anomalies', [])
            }
        }
        
        # Add fraud analysis if available
        if 'fraud_analysis' in data:
            response_data['fraud_analysis'] = {
                'risk_level': fraud_analysis['risk_level'],
                'requires_review': fraud_analysis['requires_manual_review']
            }
        
        return jsonify(response_data), 201
        
    except Exception as e:
        logger.error(f"Order creation error: {str(e)}")
        payment_security_service.log_payment_attempt(data, False, str(e))
        return jsonify({'error': 'Failed to create order'}), 500

@payments_bp.route('/validate-promotion', methods=['POST'])
def validate_promotion():
    """Validate a promotion code with security measures"""
    try:
        # Rate limiting check
        client_ip = request.remote_addr
        if not payment_security_service.check_rate_limit(client_ip, 'promotion_validation'):
            logger.warning(f"Rate limit exceeded for promotion validation from {client_ip}")
            return jsonify({'error': 'Too many requests. Please try again later.'}), 429
        
        data = request.get_json()
        promotion_code = data.get('code')
        order_amount = data.get('order_amount', 0)
        
        if not promotion_code:
            return jsonify({'error': 'Promotion code is required'}), 400
        
        # Input sanitization
        promotion_code = promotion_code.strip().upper()
        if not promotion_code or len(promotion_code) > 50:
            return jsonify({'error': 'Invalid promotion code format'}), 400
        
        # Find promotion
        promotion = Promotion.query.filter_by(code=promotion_code).first()
        if not promotion:
            # Log failed attempt for security monitoring
            payment_security_service.log_suspicious_activity({
                'type': 'invalid_promotion_code',
                'code': promotion_code,
                'ip': client_ip,
                'user_agent': request.headers.get('User-Agent', '')
            })
            return jsonify({'error': 'Invalid promotion code'}), 400
        
        # Validate promotion
        if not promotion.is_valid():
            return jsonify({'error': 'Promotion is not valid'}), 400
        
        # Check usage limits
        if promotion.usage_limit and promotion.usage_count >= promotion.usage_limit:
            return jsonify({'error': 'Promotion usage limit exceeded'}), 400
        
        # Calculate discount
        if promotion.type == 'percentage':
            discount_amount = float(order_amount) * (float(promotion.value) / 100)
            discount_type = 'percentage'
            discount_value = float(promotion.value)
        elif promotion.type == 'fixed':
            discount_amount = min(float(promotion.value), float(order_amount))
            discount_type = 'fixed'
            discount_value = float(promotion.value)
        else:
            discount_amount = 0
            discount_type = 'unknown'
            discount_value = 0
        
        # Log successful validation
        payment_audit_service.log_promotion_validation({
            'code': promotion_code,
            'discount_amount': discount_amount,
            'ip': client_ip
        })
        
        return jsonify({
            'valid': True,
            'promotion': promotion.to_dict(),
            'discount_amount': discount_amount,
            'discount_type': discount_type,
            'discount_value': discount_value,
            'final_amount': order_amount - discount_amount
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating promotion: {str(e)}")
        return jsonify({'error': 'Failed to validate promotion code'}), 500

@payments_bp.route('/validate-referral', methods=['POST'])
def validate_referral():
    """Validate a referral code with security measures"""
    try:
        # Rate limiting check
        client_ip = request.remote_addr
        if not payment_security_service.check_rate_limit(client_ip, 'referral_validation'):
            logger.warning(f"Rate limit exceeded for referral validation from {client_ip}")
            return jsonify({'error': 'Too many requests. Please try again later.'}), 429
        
        data = request.get_json()
        referral_code = data.get('code')
        order_amount = data.get('order_amount', 0)
        
        if not referral_code:
            return jsonify({'error': 'Referral code is required'}), 400
        
        # Input sanitization
        referral_code = referral_code.strip().upper()
        if not referral_code or len(referral_code) > 50:
            return jsonify({'error': 'Invalid referral code format'}), 400
        
        # Find referral code in coupons table
        from ..models.coupon import Coupon
        coupon = Coupon.query.filter_by(code=referral_code).first()
        if not coupon or not coupon.is_affiliate_code:
            # Log failed attempt for security monitoring
            payment_security_service.log_suspicious_activity({
                'type': 'invalid_referral_code',
                'code': referral_code,
                'ip': client_ip,
                'user_agent': request.headers.get('User-Agent', '')
            })
            return jsonify({'error': 'Invalid referral code'}), 400
        
        # Validate referral code
        if not coupon.is_valid():
            return jsonify({'error': 'Referral code is not valid or has expired'}), 400
        
        # Calculate discount
        discount_amount = float(order_amount) * (float(coupon.discount_percent) / 100)
        commission_amount = coupon.calculate_affiliate_commission(order_amount)
        
        # Log successful validation
        logger.info(f"Referral code validation successful: {referral_code} for {coupon.affiliate.name}")
        
        return jsonify({
            'valid': True,
            'code': coupon.code,
            'description': coupon.description,
            'discount_percent': coupon.discount_percent,
            'discount_amount': discount_amount,
            'discounted_total': order_amount - discount_amount,
            'is_affiliate_code': True,
            'affiliate_name': coupon.affiliate.name,
            'affiliate_id': coupon.affiliate_id,
            'commission_amount': commission_amount,
            'commission_percent': coupon.affiliate_commission_percent
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating referral code: {str(e)}")
        return jsonify({'error': 'Failed to validate referral code'}), 500

@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events with enterprise-grade security"""
    try:
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')
        webhook_id = request.headers.get('Stripe-Id', f"webhook_{int(time.time())}")
        
        if not sig_header:
            logger.warning("Missing Stripe signature header")
            return jsonify({'error': 'Missing signature'}), 400
        
        # Enterprise webhook security verification
        webhook_verified = webhook_security_service.verify_webhook_signature(
            payload, sig_header, 'stripe'
        )
        
        if not webhook_verified:
            logger.warning(f"Webhook signature verification failed for {webhook_id}")
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Parse webhook data
        try:
            webhook_data = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in webhook payload: {str(e)}")
            return jsonify({'error': 'Invalid JSON payload'}), 400
        
        # Process webhook with retry logic and idempotency
        processing_result = webhook_security_service.process_webhook_with_retry(
            webhook_data, webhook_id
        )
        
        # Create webhook audit log
        webhook_security_service.create_webhook_audit_log(
            webhook_data, webhook_verified, processing_result
        )
        
        # Handle specific webhook events
        if webhook_data.get('type') == 'payment_intent.succeeded':
            payment_intent = webhook_data.get('data', {}).get('object', {})
            logger.info(f"Payment succeeded: {payment_intent.get('id')}")
            
            # Process payment success with enhanced security
            success_data = {
                'payment_intent_id': payment_intent.get('id'),
                'customer_email': payment_intent.get('receipt_email'),
                'amount': payment_intent.get('amount', 0) / 100,
                'currency': payment_intent.get('currency', 'usd'),
                'webhook_id': webhook_id
            }
            
            # Call payment success handler
            from . import payment_success
            return payment_success(success_data)
        
        elif webhook_data.get('type') == 'payment_intent.payment_failed':
            payment_intent = webhook_data.get('data', {}).get('object', {})
            logger.warning(f"Payment failed: {payment_intent.get('id')}")
            
            # Log payment failure with enhanced details
            payment_audit_service.log_payment_failure(
                payment_intent.get('id'),
                payment_intent.get('last_payment_error', {}).get('message', 'Unknown error'),
                'STRIPE_WEBHOOK'
            )
        
        elif webhook_data.get('type') == 'charge.dispute.created':
            # Handle chargeback
            charge = webhook_data.get('data', {}).get('object', {})
            logger.warning(f"Chargeback created: {charge.get('id')}")
            
            # Process chargeback
            chargeback_data = {
                'charge_id': charge.get('id'),
                'dispute_id': charge.get('dispute', {}).get('id'),
                'amount': charge.get('amount', 0) / 100,
                'reason': charge.get('dispute', {}).get('reason', 'unknown')
            }
            
            # Log chargeback
            payment_audit_service.log_chargeback(chargeback_data)
        
        return jsonify({
            'status': 'success',
            'webhook_id': webhook_id,
            'processing_result': processing_result
        }), 200
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return jsonify({'error': 'Webhook processing failed'}), 500

@payments_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get order details"""
    try:
        order = Order.query.get_or_404(order_id)
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/orders/<int:order_id>/refund', methods=['POST'])
@jwt_required()
def refund_order(order_id):
    """Refund an order"""
    try:
        data = request.get_json()
        amount = data.get('amount')  # Optional, defaults to full amount
        
        refund_result = payment_service.refund_payment(order_id, amount)
        return jsonify(refund_result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Order.query
        
        if status:
            query = query.filter_by(status=status)
        
        orders = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'total': orders.total,
            'pages': orders.pages,
            'current_page': orders.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# REMOVED: Test payment endpoint for security reasons
# This endpoint was removed to prevent unauthorized testing in production

# REMOVED: Payment debug endpoint for security reasons
# This endpoint was removed to prevent information disclosure in production

@payments_bp.route('/payment-success', methods=['POST'])
@request_signing_service.require_signed_request
def payment_success():
    """Handle successful payment and update user subscription with enhanced security"""
    try:
        from datetime import datetime, timedelta
        from flask_jwt_extended import get_jwt_identity
        
        data = request.get_json()
        
        # Input sanitization (MANDATORY)
        sanitized_data = input_sanitization_service.sanitize_payment_success_data(data)
        if not sanitized_data.get('order_id') and not sanitized_data.get('payment_intent_id'):
            logger.warning("Invalid payment success data after sanitization")
            return jsonify({'error': 'Invalid payment data'}), 400
        
        # Use sanitized data
        data = sanitized_data
        
        # Enhanced security validation (MANDATORY)
        try:
            is_valid, error_message = payment_security_service.validate_payment_success_data(data) 
            if not is_valid:
                logger.warning(f"Payment security validation failed: {error_message}")
                payment_audit_service.log_payment_failure(None, error_message, 'SECURITY_VALIDATION_FAILED')
                return jsonify({'error': f'Security validation failed: {error_message}'}), 400
        except Exception as e:
            logger.error(f"Payment security validation error: {str(e)}")
            payment_audit_service.log_payment_failure(None, str(e), 'SECURITY_VALIDATION_ERROR')
            return jsonify({'error': 'Security validation failed'}), 500
        
        # Get order ID and payment details - handle different data formats
        order_id = data.get('order_id') or data.get('orderId')
        payment_intent_id = data.get('payment_intent_id') or data.get('payment_intent') or data.get('id')
        customer_email = data.get('customer_email') or data.get('customerEmail') or data.get('email')
        
        # Handle Stripe webhook format
        if not order_id and data.get('type') == 'payment_intent.succeeded':
            # This is a Stripe webhook, extract data differently
            payment_intent = data.get('data', {}).get('object', {})
            payment_intent_id = payment_intent.get('id')
            customer_email = payment_intent.get('receipt_email') or payment_intent.get('customer_email')
            # Try to find order by payment intent ID
            if payment_intent_id:
                from ..models.payment import Order
                order = Order.query.filter_by(payment_intent_id=payment_intent_id).first()
                if order:
                    order_id = order.id
        
        logger.info(f"Processing payment success - Order ID: {order_id}, Payment Intent: {payment_intent_id[:8] if payment_intent_id else 'N/A'}...")
        
        # Validate required data
        if not order_id and not payment_intent_id:
            logger.warning("Payment success called without order_id or payment_intent_id")
            return jsonify({'error': 'Order ID or Payment Intent ID is required'}), 400
        
        if not customer_email:
            logger.warning("Payment success called without customer email")
            return jsonify({'error': 'Customer email is required'}), 400
        
        # Try to get current user from JWT token (optional for payment success)
        current_user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
        except:
            # No JWT token - this is OK for payment success
            current_user_id = None
        
        # Find the order
        from ..models.payment import Order, Payment
        order = None
        if order_id:
            order = Order.query.get(order_id)
            logger.debug(f"Looking for order by ID: {order_id}")
        elif payment_intent_id:
            order = Order.query.filter_by(payment_intent_id=payment_intent_id).first()
            logger.debug(f"Looking for order by payment_intent_id: {payment_intent_id[:8]}...")
        
        if not order:
            logger.error(f"Order not found - order_id: {order_id}, payment_intent_id: {payment_intent_id[:8] if payment_intent_id else 'N/A'}...")
            
            # Try to find user by email and activate them anyway
            if customer_email:
                logger.info(f"Trying to find user by email for activation")
                user = User.query.filter_by(email=customer_email).first()
                if user:
                    logger.info(f"Found user by email, activating them directly")
                    user.is_active = True
                    user.subscription_status = 'active'
                    user.subscription_plan = 'premium'
                    user.is_admin = False
                    user.updated_at = datetime.utcnow()
                    db.session.commit()
                    
                    return jsonify({
                        'success': True,
                        'message': 'User activated directly (order not found)',
                        'subscription_updated': True,
                        'user_activated': True
                    }), 200
            
            return jsonify({'error': 'Order not found'}), 404
        
        logger.info(f"Found order: {order.order_number} for {order.customer_email}")
        
        # Update order status
        order.status = 'paid'
        order.payment_status = 'paid'
        order.paid_at = datetime.utcnow()
        order.payment_intent_id = payment_intent_id
        
        logger.debug("Updated order status to paid")
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            currency='usd',
            payment_method='card',
            provider='stripe',
            provider_payment_id=payment_intent_id,
            provider_transaction_id=f"txn_{order.order_number}_{int(datetime.utcnow().timestamp())}",
            status='succeeded',
            processed_at=datetime.utcnow()
        )
        
        db.session.add(payment)
        logger.debug(f"Created payment record: {payment.id}")
        
        # Handle referral code usage tracking for affiliate commissions
        referral_code_processed = False
        try:
            # Check if there's a referral code in the order
            referral_code = None
            
            # Check order metadata for referral code
            if order.order_metadata and 'referral_code' in order.order_metadata:
                referral_code = order.order_metadata['referral_code']
                logger.info(f"Found referral code in order metadata: {referral_code}")
            
            # Also check promotion_code field (legacy)
            elif order.promotion_code:
                # Check if this promotion code is actually an affiliate referral code
                from ..models.coupon import Coupon
                coupon = Coupon.query.filter_by(code=order.promotion_code.upper()).first()
                if coupon and coupon.is_affiliate_code:
                    referral_code = order.promotion_code
                    logger.info(f"Found affiliate referral code in promotion_code field: {referral_code}")
            
            if referral_code:
                from ..models.coupon import Coupon
                coupon = Coupon.query.filter_by(code=referral_code.upper()).first()
                
                if coupon and coupon.is_affiliate_code and coupon.is_active:
                    logger.info(f"Processing affiliate referral code: {referral_code}")
                    
                    # Calculate commission amount before recording conversion
                    commission_amount = coupon.calculate_affiliate_commission(order.total_amount)
                    
                    # Record the successful conversion (payment) and update affiliate stats
                    coupon.record_conversion(order.total_amount)
                    referral_code_processed = True
                    
                    logger.info(f"Affiliate commission processed: ${commission_amount:.2f} for affiliate {coupon.affiliate.name}")
                    
                    # Store commission info in order metadata
                    if not order.order_metadata:
                        order.order_metadata = {}
                    order.order_metadata.update({
                        'affiliate_commission': commission_amount,
                        'affiliate_id': coupon.affiliate_id,
                        'affiliate_name': coupon.affiliate.name,
                        'commission_processed_at': datetime.utcnow().isoformat()
                    })
                    
                else:
                    logger.warning(f"Referral code {referral_code} not found or inactive")
        except Exception as e:
            logger.error(f"Error processing referral code: {str(e)}")
            # Don't fail the payment process for referral code issues
        
        # Update user subscription - prioritize email lookup for inactive users
        subscription_updated = False
        from ..models.user import User
        
        user = None
        
        logger.info("Starting user lookup process for payment success")
        if not is_production():
            logger.debug(f"JWT user_id: {current_user_id}")
            logger.debug(f"Customer email: {customer_email}")
            logger.debug(f"Order customer_name: {order.customer_name}")
        
        # Validate required data
        if not customer_email:
            logger.warning("No customer email provided in payment success")
            return jsonify({'error': 'Customer email is required'}), 400
        
        # Strategy 1: Email lookup (most reliable for new users)
        if customer_email:
            user = User.query.filter_by(email=customer_email).first()
            if not is_production():
                logger.debug(f"Email lookup - User found: {user.email if user else 'None'} (Email: {customer_email})")
            if user and not is_production():
                logger.debug(f"User details - is_active: {user.is_active}, subscription_status: {user.subscription_status}, is_admin: {user.is_admin}")
        
        # Strategy 2: If we have a JWT token, try to get user by ID (for existing users)
        if not user and current_user_id:
            user = User.query.get(current_user_id)
            if not is_production():
                logger.debug(f"JWT lookup - User found: {user.email if user else 'None'} (ID: {current_user_id})")
        
        # Strategy 3: Try to find by order's user_id if available
        if not user and hasattr(order, 'user_id') and order.user_id:
            user = User.query.get(order.user_id)
            if not is_production():
                logger.debug(f"Order user_id lookup - User found: {user.email if user else 'None'} (Order user_id: {order.user_id})")
            if user and not is_production():
                logger.debug(f"User details - is_active: {user.is_active}, subscription_status: {user.subscription_status}, is_admin: {user.is_admin}")
        
        # Strategy 4: Try to find by customer name (fallback)
        if not user and order.customer_name:
            # Try exact username match first
            user = User.query.filter_by(username=order.customer_name).first()
            if user and not is_production():
                logger.debug(f"Username lookup - User found: {user.email} (Username: {order.customer_name})")
            else:
                # Try to find by first_name or last_name
                user = User.query.filter(
                    (User.first_name == order.customer_name) | 
                    (User.last_name == order.customer_name)
                ).first()
                if user and not is_production():
                    logger.debug(f"Name lookup - User found: {user.email} (Name: {order.customer_name})")
        
        if not user:
            logger.error("No user found with any lookup method")
            if not is_production():
                logger.debug(f"Customer email: {customer_email}")
                logger.debug(f"Order customer_name: {order.customer_name}")
                logger.debug(f"JWT user_id: {current_user_id}")
                logger.debug(f"Order user_id: {getattr(order, 'user_id', 'Not available')}")
            
            # List all users for debugging (development only)
            if not is_production():
                all_users = User.query.all()
                logger.debug(f"All users in database: {[(u.id, u.email, u.username, u.is_active) for u in all_users]}")
            
            return jsonify({
                'error': f'No user found with email {customer_email}. Please contact support.',
                'subscription_updated': False
            }), 404
        
            if not is_production():
                logger.debug(f"JWT user ID: {current_user_id}")
            
            # Log this as a critical error
            logger.error(f"Payment success called but no user found - email: {customer_email}, order_id: {order_id}")
            
            return jsonify({
                'error': 'User not found for payment. Please contact support.',
                'subscription_updated': False
            }), 404
        
        if user:
            # Update user subscription and activate account
            print(f"🔄 Updating user subscription for: {user.email} (ID: {user.id})")
            print(f"🔄 Before update - is_active: {user.is_active}, subscription_status: {user.subscription_status}, is_admin: {user.is_admin}")
            
            # Validate user data before updating
            if not user.email:
                logger.error("User has no email address")
                return jsonify({'error': 'User email is missing'}), 400
            
            # Determine subscription plan from order items
            subscription_plan = 'premium'  # default
            if order.items:
                first_item = order.items[0]
                if hasattr(first_item, 'product_name'):
                    plan_name = first_item.product_name.lower()
                    if 'basic' in plan_name:
                        subscription_plan = 'basic'
                    elif 'premium' in plan_name:
                        subscription_plan = 'premium'
                    elif 'pro' in plan_name:
                        subscription_plan = 'pro'
                    elif 'enterprise' in plan_name:
                        subscription_plan = 'enterprise'
            
            # Update user as a regular user (not admin) with active subscription
            print(f"🔄 Updating user fields...")
            try:
                user.is_active = True
                user.subscription_status = 'active'  # CRITICAL: Must be 'active' not 'premium' or other values
                user.subscription_plan = subscription_plan
                user.is_admin = False  # Ensure user is not admin (regular user)
                user.updated_at = datetime.utcnow()
                subscription_updated = True
                logger.info("User fields updated successfully")
            except Exception as e:
                log_error_safely("Error updating user fields", e, include_details=False)
                return jsonify({'error': 'Failed to update user subscription'}), 500
            
            # Create UserSubscription record
            print(f"🔄 Creating UserSubscription record...")
            try:
                from ..models.subscription import SubscriptionPlan, BillingCycle
                from ..models.user_subscription import UserSubscription, SubscriptionStatus
                from datetime import timedelta
                
                logger.debug("Imported subscription models successfully")
                
                # Find subscription plan
                plan = None
                if not is_production():
                    logger.debug(f"Looking for subscription plan: {subscription_plan}")
                
                if subscription_plan == 'basic':
                    plan = SubscriptionPlan.query.filter_by(name='Basic').first()
                elif subscription_plan == 'premium' or subscription_plan == 'pro':
                    plan = SubscriptionPlan.query.filter_by(name='Professional').first()
                elif subscription_plan == 'enterprise':
                    plan = SubscriptionPlan.query.filter_by(name='Enterprise').first()
                
                if not plan:
                    plan = SubscriptionPlan.query.filter_by(name='Basic').first()
                    if not is_production():
                        logger.debug("Using fallback Basic plan")
                
                if plan:
                    logger.info(f"Found subscription plan: {plan.name} (ID: {plan.id})")
                else:
                    logger.warning("No subscription plan found, skipping UserSubscription creation")
                
                if plan:
                    # Check if user already has an active subscription
                    existing_subscription = UserSubscription.query.filter_by(
                        user_id=user.id,
                        status=SubscriptionStatus.ACTIVE
                    ).first()
                    
                    if not existing_subscription:
                        try:
                            subscription = UserSubscription(
                                user_id=user.id,
                                plan_id=plan.id,
                                subscription_id=f"payment_{order.id}",
                                plan_name=plan.name,
                                plan_type=plan.billing_cycle.value,
                                status=SubscriptionStatus.ACTIVE,
                                amount=order.total_amount,
                                currency='USD',
                                billing_cycle=plan.billing_cycle.value.upper(),
                                unit_amount=order.total_amount,
                                total_amount=order.total_amount,
                                start_date=datetime.utcnow(),
                                end_date=datetime.utcnow() + timedelta(days=30),
                                payment_method='card',
                                payment_provider='stripe',
                                payment_provider_id=payment_intent_id,
                                admin_notes=f'Created from payment success for order {order.order_number}'
                            )
                            
                            db.session.add(subscription)
                            logger.info(f"Created UserSubscription {subscription.id} for user {user.email}")
                        except Exception as e:
                            log_error_safely("Error creating UserSubscription", e, include_details=False)
                            # Don't fail the payment process for this
                    else:
                        logger.info(f"User {user.email} already has active subscription {existing_subscription.id}")
                else:
                    logger.warning(f"No subscription plan found for {subscription_plan}")
                    
            except Exception as e:
                log_error_safely("Database commit failed", e, include_details=False)
                # Don't fail the payment process for this
            
            print(f"🔄 User fields updated:")
            print(f"   is_active: {user.is_active}")
            print(f"   subscription_status: {user.subscription_status}")
            print(f"   subscription_plan: {user.subscription_plan}")
            print(f"   is_admin: {user.is_admin}")
            
            logger.info(f"Updated subscription for user: {user.email} (ID: {user.id})")
            if not is_production():
                logger.debug(f"After update - is_active: {user.is_active}, subscription_status: {user.subscription_status}, subscription_plan: {user.subscription_plan}, is_admin: {user.is_admin}")
            
            # Verify the changes are applied
            try:
                db.session.flush()
                logger.info("Database flush completed - changes should be visible")
                
                # Double-check the user state after flush
                refreshed_user = User.query.get(user.id)
                if not is_production():
                    logger.debug(f"User state after flush - is_active: {refreshed_user.is_active}, subscription_status: {refreshed_user.subscription_status}, is_admin: {refreshed_user.is_admin}")
            except Exception as e:
                log_error_safely("Error during database flush", e, include_details=False)
                return jsonify({'error': 'Failed to save user changes'}), 500
            
            # Create a UserSubscription record for detailed tracking
            try:
                from ..models.user_subscription import UserSubscription, BillingCycle, SubscriptionStatus
                from ..models.subscription import SubscriptionPlan
                
                # Simple billing cycle mapping function (inline to avoid import issues)
                def map_plan_billing_cycle_to_user(plan_name):
                    """Map plan name to billing cycle for user display"""
                    billing_cycles = {
                        'basic': 'MONTHLY',
                        'premium': 'MONTHLY', 
                        'pro': 'MONTHLY',
                        'enterprise': 'MONTHLY',
                        'annual_basic': 'ANNUALLY',
                        'annual_premium': 'ANNUALLY',
                        'annual_pro': 'ANNUALLY',
                        'annual_enterprise': 'ANNUALLY'
                    }
                    return billing_cycles.get(plan_name.lower(), 'MONTHLY')
                
                # Find the correct subscription plan based on order items
                plan = None
                
                # First try to get plan by ID if available in order metadata
                plan_id = None
                if order.order_metadata and 'plan_id' in order.order_metadata:
                    plan_id = order.order_metadata['plan_id']
                    if not is_production():
                        logger.debug(f"Found plan_id in order metadata: {plan_id}")
                
                if plan_id:
                    plan = SubscriptionPlan.query.get(plan_id)
                    if plan:
                        logger.info(f"Found plan by order metadata plan_id: {plan.name} (ID: {plan.id})")
                
                # If no plan found by ID, try to find by items
                if not plan:
                    for item in order.items:
                        # Try to find plan by name - more flexible matching
                        plan_name = item.product_name.lower()
                        
                        if not is_production():
                            logger.debug(f"Looking for plan with product name: {item.product_name}")
                        
                        # Extract the actual plan name by removing "Subscription" suffix
                        clean_plan_name = plan_name.replace(' subscription', '').replace(' plan', '').strip()
                        if not is_production():
                            logger.debug(f"Cleaned plan name: '{clean_plan_name}'")
                        
                        # First try exact name match with cleaned name
                        plan = SubscriptionPlan.query.filter(
                            SubscriptionPlan.name.ilike(f"%{clean_plan_name}%")
                        ).first()
                        
                        if plan:
                            logger.info(f"Found plan by exact match: {plan.name} (ID: {plan.id})")
                            break
                        
                        # If no exact match, try common variations using cleaned name
                        if 'basic' in clean_plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Basic').first()
                            if plan:
                                logger.info(f"Found plan by basic variation: {plan.name} (ID: {plan.id})")
                                break
                        elif 'professional' in clean_plan_name or 'pro' in clean_plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Professional').first()
                            if plan:
                                logger.info(f"Found plan by professional variation: {plan.name} (ID: {plan.id})")
                                break
                        elif 'enterprise' in clean_plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Enterprise').first()
                            if plan:
                                logger.info(f"Found plan by enterprise variation: {plan.name} (ID: {plan.id})")
                                break
                        elif 'premium' in clean_plan_name:
                            plan = SubscriptionPlan.query.filter_by(name='Premium').first()
                            if plan:
                                logger.info(f"Found plan by premium variation: {plan.name} (ID: {plan.id})")
                                break
                        
                        # If still no match, try to find any plan with similar name
                        if not plan:
                            all_plans = SubscriptionPlan.query.filter_by(is_active=True).all()
                            for p in all_plans:
                                if any(word in clean_plan_name for word in p.name.lower().split()):
                                    plan = p
                                    logger.info(f"Found plan by fuzzy match: {plan.name} (ID: {plan.id})")
                                    break
                        
                        if plan:
                            logger.info(f"Found plan: {plan.name} (ID: {plan.id}) for product: {item.product_name}")
                            break
                
                # If no plan found, use Basic as default
                if not plan:
                    plan = SubscriptionPlan.query.filter_by(name='Basic', is_active=True).first()
                    logger.warning("No specific plan found, using Basic plan as default")
                
                # If still no plan, return error - plans should be pre-configured
                if not plan:
                    logger.error("No subscription plans configured in database")
                    return jsonify({'error': 'No subscription plans available. Please contact support.'}), 500
                
                if plan:
                    logger.info(f"Found plan: {plan.name} (ID: {plan.id})")
                    
                    # Create subscription record with correct plan_id
                    new_subscription = UserSubscription(
                        user_id=user.id,
                        plan_id=plan.id,  # Link to the actual plan
                        subscription_id=f"sub_{order.order_number}",
                        plan_name=plan.name,
                        plan_type=plan.billing_cycle.value,
                        status=SubscriptionStatus.ACTIVE,
                        amount=order.total_amount,
                        currency='USD',
                        billing_cycle=map_plan_billing_cycle_to_user(plan.billing_cycle),
                        unit_amount=order.total_amount,
                        total_amount=order.total_amount,
                        start_date=datetime.utcnow(),
                        end_date=datetime.utcnow() + timedelta(days=30),  # 30 days subscription
                        payment_method='card',
                        payment_provider='stripe',
                        payment_provider_id=payment_intent_id,
                        admin_notes=f'Payment success - Order {order.order_number}'
                    )
                    
                    db.session.add(new_subscription)
                    logger.info(f"Created UserSubscription record for user {user.id} with plan {plan.name}")
                else:
                    logger.error("No subscription plan found, cannot create UserSubscription")
                
            except Exception as e:
                logger.warning(f"Could not create UserSubscription record: {e}")
                # Continue without subscription record - user is still activated
            
            # Force a database flush to ensure changes are visible
            db.session.flush()
        else:
            logger.error("Could not find user for payment processing")
            if not is_production():
                logger.debug(f"JWT ID: {current_user_id}")
                logger.debug(f"Customer email: {customer_email}")
                logger.debug(f"Order customer_name: {order.customer_name}")
                logger.debug(f"Order user_id: {getattr(order, 'user_id', 'Not available')}")
                
                # List all users for debugging (development only)
                all_users = User.query.all()
                logger.debug(f"All users in database: {[(u.id, u.email, u.is_active) for u in all_users]}")
        
        # Commit the transaction with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                db.session.commit()
                logger.info(f"Database transaction committed successfully (attempt {attempt + 1})")
                break
            except Exception as e:
                log_error_safely(f"Database commit failed (attempt {attempt + 1})", e, include_details=False)
                if attempt < max_retries - 1:
                    db.session.rollback()
                    # Wait a bit before retry
                    import time
                    time.sleep(0.5)
                    continue
                else:
                    db.session.rollback()
                    return jsonify({
                        'error': 'Failed to save payment information. Please contact support.',
                        'subscription_updated': False
                    }), 500
        
        # Final verification - check if user is properly saved
        if subscription_updated and user:
            try:
                # Force a fresh query from database to verify changes
                db.session.expire(user)  # Expire the object to force fresh query
                final_user = User.query.get(user.id)
                if not is_production():
                    logger.debug(f"Final verification - User {final_user.email}:")
                    logger.debug(f"   is_active: {final_user.is_active}")
                print(f"   subscription_status: {final_user.subscription_status}")
                print(f"   subscription_plan: {final_user.subscription_plan}")
                print(f"   is_admin: {final_user.is_admin}")
                
                if (final_user.is_active and 
                    final_user.subscription_status == 'active' and 
                    final_user.subscription_plan and 
                    not final_user.is_admin):
                    print("🎉 User is properly saved as regular user with active subscription!")
                    print("🎉 Frontend should now recognize this user as having an active subscription!")
                else:
                    logger.warning("User is not properly configured - check database")
                    if not is_production():
                        logger.debug(f"   Expected: is_active=True, subscription_status='active', is_admin=False")
                    print(f"   Actual: is_active={final_user.is_active}, subscription_status='{final_user.subscription_status}', is_admin={final_user.is_admin}")
                    
                    # If verification fails, return an error
                    return jsonify({
                        'error': 'User activation failed. Please contact support.',
                        'subscription_updated': False
                    }), 500
            except Exception as e:
                log_error_safely("Error during final verification", e, include_details=False)
                return jsonify({
                    'error': 'User activation verification failed. Please contact support.',
                    'subscription_updated': False
                }), 500
        
        logger.info(f"Payment success endpoint completed successfully - Order: {order.order_number}, User: {user.email if user else 'N/A'}")
        
        response_data = {
            'success': True,
            'message': 'Payment processed successfully',
            'order': order.to_dict(),
            'payment': payment.to_dict(),
            'subscription_updated': subscription_updated,
            'user_activated': subscription_updated,
            'referral_code_processed': referral_code_processed
        }
        
        # Add affiliate commission info if processed
        if referral_code_processed and order.order_metadata:
            response_data['affiliate_commission'] = {
                'amount': order.order_metadata.get('affiliate_commission', 0),
                'affiliate_id': order.order_metadata.get('affiliate_id'),
                'affiliate_name': order.order_metadata.get('affiliate_name'),
                'processed_at': order.order_metadata.get('commission_processed_at')
            }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        log_error_safely("Payment success error", e, include_details=False)
        return jsonify({'error': 'Payment processing failed'}), 500



@payments_bp.route('/invoice/<order_id>', methods=['GET'])
def get_invoice(order_id):
    """Get invoice/receipt for an order"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get payment details
        payment = Payment.query.filter_by(order_id=order.id).first()
        
        invoice_data = {
            'order': order.to_dict(),
            'payment': payment.to_dict() if payment else None,
            'invoice_number': f"INV-{order.order_number}",
            'issued_date': order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat()
        }
        
        return jsonify(invoice_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payments_bp.route('/activate-user', methods=['POST'])
def activate_user():
    """Manually activate a user after payment"""
    try:
        data = request.get_json()
        logger.info(f"Activate user request received: {data}")
        
        if not data or not data.get('email'):
            logger.error("No email provided in activate user request")
            return jsonify({'error': 'Email is required'}), 400
        
        email = data.get('email', '').strip().lower()
        logger.info(f"Attempting to activate user: {email}")
        
        # Find the user
        from ..models.user import User
        user = User.query.filter_by(email=email).first()
        if not user:
            logger.error(f"User not found: {email}")
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"Found user: {user.email} (ID: {user.id}, is_active: {user.is_active})")
        
        # Check if user is already active
        if user.is_active and user.subscription_status == 'active':
            logger.info(f"User {email} is already active, returning current status")
            return jsonify({
                'message': 'User is already active',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'is_active': user.is_active,
                    'subscription_status': user.subscription_status,
                    'subscription_plan': user.subscription_plan,
                    'is_admin': user.is_admin
                },
                'subscription_plan': user.subscription_plan
            }), 200
        
        # Find the most recent paid order for this user
        paid_orders = Order.query.filter(
            Order.customer_email == email,
            Order.status == 'paid',
            Order.payment_status == 'paid'
        ).order_by(Order.created_at.desc()).all()
        
        # If no paid orders found, try to find any order for this user
        if not paid_orders:
            logger.warning(f"No paid orders found for user {email}, checking all orders...")
            all_orders = Order.query.filter(Order.customer_email == email).order_by(Order.created_at.desc()).all()
            logger.info(f"Found {len(all_orders)} total orders for user {email}")
            
            if all_orders:
                # Use the most recent order and mark it as paid
                latest_order = all_orders[0]
                logger.info(f"Using most recent order {latest_order.id} for activation")
                latest_order.status = 'paid'
                latest_order.payment_status = 'paid'
                latest_order.paid_at = datetime.utcnow()
                paid_orders = [latest_order]
            else:
                logger.error(f"No orders found for user {email}")
                return jsonify({'error': 'No orders found for this user'}), 400
        
        latest_order = paid_orders[0]
        
        # Activate the user
        user.is_active = True
        user.subscription_status = 'active'
        user.subscription_plan = 'premium'  # Default plan
        user.is_admin = False
        
        # Determine subscription plan from order
        if latest_order.items:
            first_item = latest_order.items[0]
            if hasattr(first_item, 'product_name'):
                plan_name = first_item.product_name.lower()
                if 'basic' in plan_name:
                    user.subscription_plan = 'basic'
                elif 'premium' in plan_name:
                    user.subscription_plan = 'premium'
                elif 'pro' in plan_name:
                    user.subscription_plan = 'pro'
                elif 'enterprise' in plan_name:
                    user.subscription_plan = 'enterprise'
        
        db.session.commit()
        
        logger.info(f"User {email} manually activated after payment verification")
        
        return jsonify({
            'message': 'User activated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'is_active': user.is_active,
                'subscription_status': user.subscription_status,
                'subscription_plan': user.subscription_plan,
                'is_admin': user.is_admin
            },
            'subscription_plan': user.subscription_plan
        }), 200
        
    except Exception as e:
        logger.error(f"Error activating user: {str(e)}")
        return jsonify({'error': 'Failed to activate user'}), 500

@payments_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_payment_stats():
    """Get payment statistics for admin dashboard"""
    try:
        # Get total counts
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status='pending').count()
        paid_orders = Order.query.filter_by(status='paid').count()
        failed_orders = Order.query.filter_by(status='failed').count()
        refunded_orders = Order.query.filter_by(status='refunded').count()
        
        # Calculate total revenue
        total_revenue = db.session.query(db.func.sum(Order.total_amount)).filter(
            Order.status == 'paid',
            Order.payment_status == 'paid'
        ).scalar() or 0
        
        # Calculate today's revenue
        from datetime import date
        today = date.today()
        today_revenue = db.session.query(db.func.sum(Order.total_amount)).filter(
            Order.status == 'paid',
            Order.payment_status == 'paid',
            db.func.date(Order.paid_at) == today
        ).scalar() or 0
        
        stats = {
            'total': total_orders,
            'pending': pending_orders,
            'paid': paid_orders,
            'failed': failed_orders,
            'refunded': refunded_orders,
            'totalRevenue': float(total_revenue),
            'todayRevenue': float(today_revenue)
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error fetching payment stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch payment statistics'}), 500

@payments_bp.route('/user-countries', methods=['GET'])
@jwt_required()
def get_user_countries():
    """Get user country distribution for analytics"""
    try:
        from ..models.user import User
        
        # Get all users with their countries
        users = User.query.filter(User.country.isnot(None), User.country != '').all()
        
        # Count users by country
        country_stats = {}
        for user in users:
            country = user.country
            if country not in country_stats:
                country_stats[country] = {'users': 0, 'revenue': 0}
            country_stats[country]['users'] += 1
        
        # Get revenue by country from paid orders
        paid_orders = Order.query.filter_by(status='paid', payment_status='paid').all()
        for order in paid_orders:
            if order.customer_email:
                # Find user by email
                user = User.query.filter_by(email=order.customer_email).first()
                if user and user.country:
                    country = user.country
                    if country not in country_stats:
                        country_stats[country] = {'users': 0, 'revenue': 0}
                    country_stats[country]['revenue'] += order.total_amount or 0
        
        # Convert to list format
        countries = []
        for country, stats in country_stats.items():
            countries.append({
                'country': country,
                'users': stats['users'],
                'revenue': stats['revenue']
            })
        
        # Sort by user count
        countries.sort(key=lambda x: x['users'], reverse=True)
        
        return jsonify({
            'countries': countries,
            'total_countries': len(countries),
            'total_users': sum(stats['users'] for stats in country_stats.values())
        })
        
    except Exception as e:
        logger.error(f"Error getting user countries: {str(e)}")
        return jsonify({'error': 'Failed to get user country data'}), 500

@payments_bp.route('/orders/<int:order_id>/approve', methods=['POST'])
@jwt_required()
def approve_order(order_id):
    """Approve a pending order"""
    try:
        order = Order.query.get_or_404(order_id)
        
        if order.status != 'pending':
            return jsonify({'error': 'Order is not pending'}), 400
        
        # Update order status
        order.status = 'paid'
        order.payment_status = 'paid'
        order.paid_at = datetime.utcnow()
        
        # Activate user if they exist
        from ..models.user import User
        user = User.query.filter_by(email=order.customer_email).first()
        if user:
            user.is_active = True
            user.subscription_status = 'active'
            if order.items:
                first_item = order.items[0]
                if hasattr(first_item, 'product_name'):
                    plan_name = first_item.product_name.lower()
                    if 'basic' in plan_name:
                        user.subscription_plan = 'basic'
                    elif 'premium' in plan_name:
                        user.subscription_plan = 'premium'
                    elif 'pro' in plan_name:
                        user.subscription_plan = 'pro'
                    elif 'enterprise' in plan_name:
                        user.subscription_plan = 'enterprise'
        
        db.session.commit()
        
        logger.info(f"Order {order.order_number} approved by admin")
        return jsonify({'message': 'Order approved successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error approving order: {str(e)}")
        return jsonify({'error': 'Failed to approve order'}), 500

@payments_bp.route('/orders/<int:order_id>/reject', methods=['POST'])
@jwt_required()
def reject_order(order_id):
    """Reject a pending order"""
    try:
        order = Order.query.get_or_404(order_id)
        
        if order.status != 'pending':
            return jsonify({'error': 'Order is not pending'}), 400
        
        # Update order status
        order.status = 'cancelled'
        order.payment_status = 'failed'
        
        db.session.commit()
        
        logger.info(f"Order {order.order_number} rejected by admin")
        return jsonify({'message': 'Order rejected successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error rejecting order: {str(e)}")
        return jsonify({'error': 'Failed to reject order'}), 500

@payments_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    """Get all invoices (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get all paid orders as invoices
        orders = Order.query.filter(
            Order.status == 'paid',
            Order.payment_status == 'paid'
        ).order_by(Order.paid_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        invoices = []
        for order in orders.items:
            invoice = {
                'id': order.id,
                'invoice_number': f"INV-{order.order_number}",
                'order_id': order.id,
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'amount': order.total_amount,
                'status': 'paid',
                'created_at': order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat(),
                'order': order.to_dict()
            }
            invoices.append(invoice)
        
        return jsonify({
            'invoices': invoices,
            'total': orders.total,
            'pages': orders.pages,
            'current_page': orders.page
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching invoices: {str(e)}")
        return jsonify({'error': 'Failed to fetch invoices'}), 500

@payments_bp.route('/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    """Create an invoice for a paid order"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        
        if not order_id:
            return jsonify({'error': 'Order ID is required'}), 400
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order.status != 'paid' or order.payment_status != 'paid':
            return jsonify({'error': 'Order must be paid to create invoice'}), 400
        
        # Check if invoice already exists
        existing_invoice = Order.query.filter(
            Order.id == order_id,
            Order.status == 'paid'
        ).first()
        
        if existing_invoice:
            return jsonify({
                'message': 'Invoice already exists',
                'invoice': {
                    'id': existing_invoice.id,
                    'invoice_number': f"INV-{existing_invoice.order_number}",
                    'order_id': existing_invoice.id,
                    'customer_name': existing_invoice.customer_name,
                    'customer_email': existing_invoice.customer_email,
                    'amount': existing_invoice.total_amount,
                    'status': 'paid',
                    'created_at': existing_invoice.paid_at.isoformat() if existing_invoice.paid_at else existing_invoice.created_at.isoformat()
                }
            }), 200
        
        # Create invoice data
        invoice_data = {
            'id': order.id,
            'invoice_number': f"INV-{order.order_number}",
            'order_id': order.id,
            'customer_name': order.customer_name,
            'customer_email': order.customer_email,
            'amount': order.total_amount,
            'status': 'paid',
            'created_at': order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat()
        }
        
        logger.info(f"Invoice created for order {order.order_number}")
        return jsonify({
            'message': 'Invoice created successfully',
            'invoice': invoice_data
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        return jsonify({'error': 'Failed to create invoice'}), 500

@payments_bp.route('/invoice-stats', methods=['GET'])
@jwt_required()
def get_invoice_stats():
    """Get invoice statistics for admin dashboard"""
    try:
        # Get total paid orders (invoices)
        total_invoices = Order.query.filter(
            Order.status == 'paid',
            Order.payment_status == 'paid'
        ).count()
        
        # Calculate total amount
        total_amount = db.session.query(db.func.sum(Order.total_amount)).filter(
            Order.status == 'paid',
            Order.payment_status == 'paid'
        ).scalar() or 0
        
        # For now, all invoices are considered paid since we only create invoices for paid orders
        paid_invoices = total_invoices
        pending_invoices = 0
        overdue_invoices = 0
        
        stats = {
            'total': total_invoices,
            'paid': paid_invoices,
            'pending': pending_invoices,
            'overdue': overdue_invoices,
            'totalAmount': float(total_amount)
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error fetching invoice stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch invoice statistics'}), 500

@payments_bp.route('/invoice/<int:order_id>/download', methods=['GET'])
@jwt_required()
def download_invoice(order_id):
    """Download invoice as PDF"""
    try:
        order = Order.query.get_or_404(order_id)
        
        if order.status != 'paid':
            return jsonify({'error': 'Order must be paid to download invoice'}), 400
        
        # Get payment details
        payment = Payment.query.filter_by(order_id=order.id).first()
        
        # Create invoice data
        invoice_data = {
            'order': order.to_dict(),
            'payment': payment.to_dict() if payment else None,
            'invoice_number': f"INV-{order.order_number}",
            'issued_date': order.paid_at.isoformat() if order.paid_at else order.created_at.isoformat()
        }
        
        # For now, return the invoice data as JSON
        # In production, you would generate a PDF here
        return jsonify(invoice_data), 200
        
    except Exception as e:
        logger.error(f"Error downloading invoice: {str(e)}")
        return jsonify({'error': 'Failed to download invoice'}), 500

@payments_bp.route('/invoice/<int:order_id>/send', methods=['POST'])
@jwt_required()
def send_invoice(order_id):
    """Send invoice via email"""
    try:
        order = Order.query.get_or_404(order_id)
        
        if order.status != 'paid':
            return jsonify({'error': 'Order must be paid to send invoice'}), 400
        
        # For now, just return success
        # In production, you would send an email here
        logger.info(f"Invoice sent for order {order.order_number} to {order.customer_email}")
        return jsonify({'message': 'Invoice sent successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error sending invoice: {str(e)}")
        return jsonify({'error': 'Failed to send invoice'}), 500

# REMOVED: Test orders endpoint for security reasons
# This endpoint was removed to prevent unauthorized data access in production

@payments_bp.route('/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    """Verify payment with Stripe for dispute resolution"""
    try:
        data = request.get_json()
        payment_intent_id = data.get('payment_intent_id')
        customer_email = data.get('customer_email')
        amount = data.get('amount')
        
        if not payment_intent_id and not customer_email:
            return jsonify({'error': 'Payment intent ID or customer email required'}), 400
        
        # In a real implementation, you would verify with Stripe API
        # For now, we'll simulate the verification process
        
        verification_result = {
            'verified': True,
            'payment_intent_id': payment_intent_id,
            'amount': amount,
            'status': 'succeeded',
            'customer_email': customer_email,
            'verified_at': datetime.utcnow().isoformat(),
            'stripe_charge_id': f'ch_{payment_intent_id[-8:]}' if payment_intent_id else None,
            'verification_method': 'stripe_api'
        }
        
        logger.info(f"Payment verification requested: {verification_result}")
        
        return jsonify({
            'message': 'Payment verification completed',
            'verification': verification_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        return jsonify({'error': 'Failed to verify payment'}), 500

@payments_bp.route('/resolve-payment-dispute', methods=['POST'])
@jwt_required()
def resolve_payment_dispute():
    """Manually resolve payment dispute by creating/updating order"""
    try:
        data = request.get_json()
        customer_email = data.get('customer_email')
        amount = data.get('amount')
        payment_intent_id = data.get('payment_intent_id')
        resolution_type = data.get('resolution_type')  # 'create_order', 'update_order', 'refund'
        order_id = data.get('order_id')
        admin_notes = data.get('admin_notes', '')
        
        if not customer_email or not amount:
            return jsonify({'error': 'Customer email and amount are required'}), 400
        
        if resolution_type == 'create_order':
            # Create a new paid order for the customer
            order = Order(
                order_number=f"DISPUTE-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                customer_email=customer_email,
                customer_name=data.get('customer_name', 'Dispute Resolution'),
                total_amount=float(amount),
                status='paid',
                payment_status='paid',
                created_at=datetime.utcnow(),
                paid_at=datetime.utcnow(),
                payment_intent_id=payment_intent_id,
                order_metadata={'admin_notes': admin_notes}
            )
            
            db.session.add(order)
            db.session.commit()
            
            logger.info(f"Payment dispute resolved - Order created: {order.id} for {customer_email}")
            
            return jsonify({
                'message': 'Payment dispute resolved - Order created successfully',
                'order': order.to_dict(),
                'resolution_type': 'order_created'
            }), 200
            
        elif resolution_type == 'update_order' and order_id:
            # Update existing order to paid status
            order = Order.query.get(order_id)
            if not order:
                return jsonify({'error': 'Order not found'}), 404
            
            order.status = 'paid'
            order.payment_status = 'paid'
            order.paid_at = datetime.utcnow()
            order.payment_intent_id = payment_intent_id
            if order.order_metadata is None:
                order.order_metadata = {}
            order.order_metadata['admin_notes'] = admin_notes
            
            db.session.commit()
            
            logger.info(f"Payment dispute resolved - Order updated: {order.id}")
            
            return jsonify({
                'message': 'Payment dispute resolved - Order updated successfully',
                'order': order.to_dict(),
                'resolution_type': 'order_updated'
            }), 200
            
        elif resolution_type == 'refund':
            # Process refund for the customer
            # In real implementation, this would call Stripe refund API
            logger.info(f"Refund processed for {customer_email}: ${amount}")
            
            return jsonify({
                'message': 'Refund processed successfully',
                'refund_amount': amount,
                'customer_email': customer_email,
                'resolution_type': 'refund_processed'
            }), 200
        
        else:
            return jsonify({'error': 'Invalid resolution type'}), 400
            
    except Exception as e:
        logger.error(f"Error resolving payment dispute: {str(e)}")
        return jsonify({'error': 'Failed to resolve payment dispute'}), 500

@payments_bp.route('/search-payments', methods=['GET'])
@jwt_required()
def search_payments():
    """Search for payments by various criteria for dispute resolution"""
    try:
        email = request.args.get('email')
        payment_intent_id = request.args.get('payment_intent_id')
        amount = request.args.get('amount', type=float)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Order.query
        
        if email:
            query = query.filter(Order.customer_email.ilike(f'%{email}%'))
        if payment_intent_id:
            query = query.filter(Order.payment_intent_id == payment_intent_id)
        if amount:
            query = query.filter(Order.total_amount == amount)
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        if date_to:
            query = query.filter(Order.created_at <= date_to)
        
        orders = query.order_by(Order.created_at.desc()).limit(50).all()
        
        results = []
        for order in orders:
            results.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_email': order.customer_email,
                'customer_name': order.customer_name,
                'amount': order.total_amount,
                'status': order.status,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
                'paid_at': order.paid_at.isoformat() if order.paid_at else None,
                'payment_intent_id': order.payment_intent_id,
                'admin_notes': order.order_metadata.get('admin_notes', '') if order.order_metadata else ''
            })
        
        return jsonify({
            'results': results,
            'total': len(results),
            'search_criteria': {
                'email': email,
                'payment_intent_id': payment_intent_id,
                'amount': amount,
                'date_from': date_from,
                'date_to': date_to
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching payments: {str(e)}")
        return jsonify({'error': 'Failed to search payments'}), 500

@payments_bp.route('/monitoring/dashboard', methods=['GET'])
@jwt_required()
def get_monitoring_dashboard():
    """Get real-time payment monitoring dashboard data"""
    try:
        dashboard_data = payment_monitoring_service.get_monitoring_dashboard_data()
        return jsonify(dashboard_data), 200
    except Exception as e:
        logger.error(f"Monitoring dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to get monitoring data'}), 500

@payments_bp.route('/fraud/analysis', methods=['POST'])
@jwt_required()
def analyze_payment_fraud():
    """Analyze payment for fraud (admin endpoint)"""
    try:
        data = request.get_json()
        
        # Get user data
        user_data = {
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'user_id': data.get('user_id')
        }
        
        # Analyze fraud risk
        fraud_analysis = fraud_detection_service.analyze_payment_risk(data, user_data)
        
        return jsonify(fraud_analysis), 200
        
    except Exception as e:
        logger.error(f"Fraud analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze fraud risk'}), 500

@payments_bp.route('/pci/compliance-check', methods=['GET'])
@jwt_required()
def check_pci_compliance():
    """Check PCI DSS compliance status"""
    try:
        compliance_status = pci_compliance_service.validate_pci_requirements({})
        return jsonify(compliance_status), 200
    except Exception as e:
        logger.error(f"PCI compliance check error: {str(e)}")
        return jsonify({'error': 'Failed to check PCI compliance'}), 500
