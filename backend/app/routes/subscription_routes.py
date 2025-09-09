"""
Subscription API Routes
Handles subscription management, plans, and billing
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..services.subscription_service import SubscriptionService
from ..services.realtime_service import realtime_service
from ..models.subscription import SubscriptionPlan, SubscriptionInvoice
from ..models.user_subscription import UserSubscription
from ..models.rbac import AdminUser
from ..models.user import User
from ..models.coupon import Coupon
from datetime import datetime
from ..models.subscription import BillingCycle, SubscriptionStatus
import uuid

# Optional Stripe import
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

subscription_bp = Blueprint('subscription', __name__)
subscription_service = SubscriptionService()

@subscription_bp.route('/validate-coupon', methods=['POST'])
@jwt_required()
def validate_coupon():
    """Validate a coupon code"""
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id')
        
        if not coupon_code:
            return jsonify({'error': 'Coupon code is required'}), 400
        
        # Find coupon
        coupon = Coupon.query.filter_by(code=coupon_code.upper()).first()
        if not coupon:
            return jsonify({'error': 'Invalid coupon code'}), 404
        
        # Get plan details for validation
        plan = None
        if plan_id:
            plan = SubscriptionPlan.query.get(plan_id)
            if not plan:
                return jsonify({'error': 'Invalid plan ID'}), 404
        
        # Validate coupon
        if not coupon.is_valid(plan_id=plan_id, amount=plan.price if plan else None):
            return jsonify({'error': 'Coupon is not valid for this plan'}), 400
        
        return jsonify({
            'coupon': coupon.to_dict(),
            'discount_amount': plan.price * (coupon.discount_percent / 100) if plan else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/test', methods=['GET', 'OPTIONS'])
def test_cors():
    """Test endpoint for CORS"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'message': 'CORS test successful',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@subscription_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """Get all active subscription plans"""
    try:
        plans = subscription_service.get_active_plans()
        return jsonify({
            'plans': [plan.to_dict() for plan in plans]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/plans/<int:plan_id>', methods=['GET'])
def get_subscription_plan(plan_id):
    """Get specific subscription plan"""
    try:
        plan = subscription_service.get_plan_by_id(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        return jsonify(plan.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/plans', methods=['POST'])
@jwt_required()
def create_subscription_plan():
    """Create a new subscription plan (admin only)"""
    try:
        print("=== CREATE SUBSCRIPTION PLAN ===")
        
        # Check if user is admin
        user_id = get_jwt_identity()
        print(f"User ID: {user_id}")
        
        user = AdminUser.query.get(user_id)
        print(f"User found: {user is not None}")
        print(f"User is super admin: {user.is_super_admin if user else False}")
        
        # Check if user has permission to create plans
        can_create_plans = False
        
        if user:
            # Super admin can always create plans
            if user.is_super_admin:
                can_create_plans = True
                print("✅ User is super admin")
            else:
                # Check role assignments
                from app.models.rbac import UserRoleAssignment, AdminRole
                role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id).all()
                
                for assignment in role_assignments:
                    role = AdminRole.query.get(assignment.role_id)
                    if role and role.name in ['system_administrator', 'marketing_team']:
                        can_create_plans = True
                        print(f"✅ User has {role.name} role")
                        break
        
        if not can_create_plans:
            print("❌ User doesn't have permission to create plans")
            return jsonify({'error': 'Admin access required. You need System Administrator or Marketing Team role.'}), 403
        
        data = request.get_json()
        print(f"Received data: {data}")
        
        # Validate required fields
        required_fields = ['name', 'price', 'billing_cycle']
        for field in required_fields:
            if field not in data:
                print(f"❌ Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        print("✅ All required fields present")
        
        plan = subscription_service.create_subscription_plan(data)
        print(f"✅ Plan created with ID: {plan.id}")
        
        return jsonify(plan.to_dict()), 201
    except Exception as e:
        print(f"❌ Error creating plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_subscription_plan(plan_id):
    """Update a subscription plan (admin only)"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = AdminUser.query.get(user_id)
        
        # Check if user has permission to update plans
        can_update_plans = False
        
        if user:
            # Super admin can always update plans
            if user.is_super_admin:
                can_update_plans = True
            else:
                # Check role assignments
                from app.models.rbac import UserRoleAssignment, AdminRole
                role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id).all()
                
                for assignment in role_assignments:
                    role = AdminRole.query.get(assignment.role_id)
                    if role and role.name in ['system_administrator', 'marketing_team']:
                        can_update_plans = True
                        break
        
        if not can_update_plans:
            return jsonify({'error': 'Admin access required. You need System Administrator or Marketing Team role.'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'price', 'billing_cycle']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        plan = subscription_service.get_plan_by_id(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Update plan
        plan.name = data['name']
        plan.description = data.get('description', plan.description)
        plan.price = float(data['price'])
        plan.billing_cycle = BillingCycle(data['billing_cycle'])
        plan.features = data.get('features', plan.features)
        plan.sidebar_components = data.get('sidebar_components', plan.sidebar_components)
        plan.max_users = data.get('max_users')
        plan.max_projects = data.get('max_projects')
        plan.storage_limit = data.get('storage_limit')
        plan.trial_days = data.get('trial_days', 0)
        plan.trial_price = float(data.get('trial_price', 0))
        plan.is_active = data.get('is_active', True)
        plan.is_popular = data.get('is_popular', False)
        plan.visible_to_regular_users = data.get('visible_to_regular_users', True)
        plan.visible_to_admin_users = data.get('visible_to_admin_users', True)
        plan.sort_order = data.get('sort_order', 0)
        plan.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Broadcast real-time update to all users on this plan
        try:
            realtime_service.broadcast_plan_update(
                plan_id=plan_id,
                update_type='sidebar_components_updated',
                data={
                    'plan_name': plan.name,
                    'sidebar_components': plan.sidebar_components,
                    'updated_by': user_id,
                    'updated_at': plan.updated_at.isoformat()
                }
            )
            current_app.logger.info(f"Broadcasted sidebar update for plan {plan_id} to {len(realtime_service.get_plan_subscribers(plan_id))} users")
        except Exception as e:
            current_app.logger.error(f"Failed to broadcast plan update: {str(e)}")
        
        return jsonify(plan.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_subscription_plan(plan_id):
    """Delete a subscription plan (admin only)"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = AdminUser.query.get(user_id)
        
        # Check if user has permission to delete plans
        can_delete_plans = False
        
        if user:
            # Super admin can always delete plans
            if user.is_super_admin:
                can_delete_plans = True
            else:
                # Check role assignments
                from app.models.rbac import UserRoleAssignment, AdminRole
                role_assignments = UserRoleAssignment.query.filter_by(user_id=user.id).all()
                
                for assignment in role_assignments:
                    role = AdminRole.query.get(assignment.role_id)
                    if role and role.name in ['system_administrator', 'marketing_team']:
                        can_delete_plans = True
                        break
        
        if not can_delete_plans:
            return jsonify({'error': 'Admin access required. You need System Administrator or Marketing Team role.'}), 403
        
        plan = subscription_service.get_plan_by_id(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Check if plan has active subscriptions
        active_subscriptions = UserSubscription.query.filter_by(
            plan_id=plan_id,
            status=SubscriptionStatus.ACTIVE
        ).count()
        
        if active_subscriptions > 0:
            return jsonify({'error': f'Cannot delete plan with {active_subscriptions} active subscriptions'}), 400
        
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({'message': 'Plan deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def create_subscription():
    """Create a new user subscription"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'plan_id' not in data:
            return jsonify({'error': 'Plan ID is required'}), 400
        
        plan_id = data['plan_id']
        payment_method_id = data.get('payment_method_id')
        
        subscription, result = subscription_service.create_user_subscription(
            user_id, plan_id, payment_method_id
        )
        
        return jsonify(result), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/my-subscription', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get current user's subscription"""
    try:
        user_id = get_jwt_identity()
        subscription = subscription_service.get_user_subscription(user_id)
        
        if not subscription:
            return jsonify({'subscription': None}), 200
        
        return jsonify({
            'subscription': subscription.to_dict(),
            'invoices': [invoice.to_dict() for invoice in subscription.invoices]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel user's subscription"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        subscription = subscription_service.get_user_subscription(user_id)
        if not subscription:
            return jsonify({'error': 'No active subscription found'}), 404
        
        cancel_at_period_end = data.get('cancel_at_period_end', True)
        cancelled_subscription = subscription_service.cancel_subscription(
            subscription.id, cancel_at_period_end
        )
        
        return jsonify({
            'message': 'Subscription cancelled successfully',
            'subscription': cancelled_subscription.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """Upgrade user's subscription"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'new_plan_id' not in data:
            return jsonify({'error': 'New plan ID is required'}), 400
        
        subscription = subscription_service.get_user_subscription(user_id)
        if not subscription:
            return jsonify({'error': 'No active subscription found'}), 404
        
        upgraded_subscription = subscription_service.upgrade_subscription(
            subscription.id, data['new_plan_id']
        )
        
        return jsonify({
            'message': 'Subscription upgraded successfully',
            'subscription': upgraded_subscription.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_subscription_invoices():
    """Get user's subscription invoices"""
    try:
        user_id = get_jwt_identity()
        subscription = subscription_service.get_user_subscription(user_id)
        
        if not subscription:
            return jsonify({'invoices': []}), 200
        
        invoices = subscription_service.get_subscription_invoices(subscription.id)
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
def get_all_subscriptions():
    """Get all user subscriptions (admin only)"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = AdminUser.query.get(user_id)
        
        if not user or not user.is_super_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        subscriptions = UserSubscription.query.all()
        return jsonify({
            'subscriptions': [sub.to_dict() for sub in subscriptions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_subscription_analytics():
    """Get subscription analytics (admin only)"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = AdminUser.query.get(user_id)
        
        if not user or not user.is_super_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        analytics = subscription_service.get_subscription_analytics()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/webhook', methods=['POST'])
def stripe_subscription_webhook():
    """Handle Stripe subscription webhooks"""
    try:
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')
        
        # Verify webhook signature
        try:
            import stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, subscription_service.stripe_config['webhook_secret']
            )
        except ValueError as e:
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError as e:
            return jsonify({'error': 'Invalid signature'}), 400
        
        # Handle the event
        if event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            current_app.logger.info(f"Subscription created: {subscription.id}")
            
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            current_app.logger.info(f"Subscription updated: {subscription.id}")
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            current_app.logger.info(f"Subscription deleted: {subscription.id}")
            
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            current_app.logger.info(f"Invoice payment succeeded: {invoice.id}")
            
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            current_app.logger.info(f"Invoice payment failed: {invoice.id}")
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Webhook error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/test-plans', methods=['POST'])
def create_test_plans():
    """Create test subscription plans (development only)"""
    try:
        # Check if plans already exist
        existing_plans = SubscriptionPlan.query.count()
        if existing_plans > 0:
            return jsonify({'message': 'Test plans already exist'}), 200
        
        # Create test plans
        test_plans = [
            {
                'name': 'Basic',
                'description': 'Perfect for small teams',
                'price': 29.99,
                'billing_cycle': 'monthly',
                'features': ['Up to 5 users', 'Basic analytics', 'Email support'],
                'max_users': 5,
                'max_projects': 10,
                'storage_limit': 1024,  # 1GB
                'trial_days': 14,
                'trial_price': 0.0,
                'is_popular': False,
                'sort_order': 1
            },
            {
                'name': 'Professional',
                'description': 'Great for growing businesses',
                'price': 99.99,
                'billing_cycle': 'monthly',
                'features': ['Up to 25 users', 'Advanced analytics', 'Priority support', 'API access'],
                'max_users': 25,
                'max_projects': 50,
                'storage_limit': 5120,  # 5GB
                'trial_days': 14,
                'trial_price': 0.0,
                'is_popular': True,
                'sort_order': 2
            },
            {
                'name': 'Enterprise',
                'description': 'For large organizations',
                'price': 299.99,
                'billing_cycle': 'monthly',
                'features': ['Unlimited users', 'Custom analytics', '24/7 support', 'Custom integrations'],
                'max_users': None,  # Unlimited
                'max_projects': None,  # Unlimited
                'storage_limit': 51200,  # 50GB
                'trial_days': 30,
                'trial_price': 0.0,
                'is_popular': False,
                'sort_order': 3
            }
        ]
        
        created_plans = []
        for plan_data in test_plans:
            plan = subscription_service.create_subscription_plan(plan_data)
            created_plans.append(plan.to_dict())
        
        return jsonify({
            'message': 'Test plans created successfully',
            'plans': created_plans
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for subscription"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'plan_id' not in data:
            return jsonify({'error': 'Plan ID is required'}), 400
        
        plan_id = data['plan_id']
        success_url = data.get('success_url', 'http://localhost:5173/subscription/success')
        cancel_url = data.get('cancel_url', 'http://localhost:5173/subscription/cancel')
        promotion_code = data.get('promotion_code')
        
        # Get plan
        plan = subscription_service.get_plan_by_id(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Get user
        user = AdminUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate promotion code if provided
        promotion = None
        if promotion_code:
            from ..models.promotion import Promotion
            promotion = Promotion.query.filter_by(code=promotion_code.upper()).first()
            if not promotion or not promotion.is_valid():
                return jsonify({'error': 'Invalid or expired promotion code'}), 400
        
        # Create Stripe checkout session
        import stripe
        stripe.api_key = subscription_service.stripe_config['secret_key']
        
        session_data = {
            'customer_email': user.email,
            'line_items': [{
                'price': subscription_service._get_stripe_price_id(plan),
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'metadata': {
                'user_id': user_id,
                'plan_id': plan_id
            }
        }
        
        # Add promotion code if valid
        if promotion:
            session_data['discounts'] = [{
                'coupon': promotion.code
            }]
            session_data['metadata']['promotion_code'] = promotion.code
            session_data['metadata']['promotion_id'] = promotion.id
        
        # Add trial if available
        if plan.trial_days > 0:
            session_data['subscription_data'] = {
                'trial_period_days': plan.trial_days
            }
        
        session = stripe.checkout.Session.create(**session_data)
        
        return jsonify({
            'session_id': session.id,
            'url': session.url
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/mock-success', methods=['GET'])
def mock_payment_success():
    """Mock payment success endpoint that activates the user"""
    try:
        # Get parameters from URL
        session_id = request.args.get('session_id')
        plan_id = request.args.get('plan_id')
        final_price = request.args.get('final_price')
        user_id = request.args.get('user_id')
        
        if not all([session_id, plan_id, user_id]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Create subscription record
        from datetime import datetime, timedelta
        from ..models.user_subscription import BillingCycle, SubscriptionStatus
        from billing_cycle_mapper import map_plan_billing_cycle_to_user
        
        new_subscription = UserSubscription(
            user_id=user.id,
            plan_id=plan.id,
            subscription_id=f"mock_{session_id}",
            plan_name=plan.name,
            plan_type=plan.billing_cycle.value,
            status=SubscriptionStatus.ACTIVE,
            amount=float(final_price),
            currency='USD',
            billing_cycle=map_plan_billing_cycle_to_user(plan.billing_cycle),
            unit_amount=float(final_price),
            total_amount=float(final_price),
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),  # 30 days for mock
            payment_method='mock_payment',
            payment_provider='mock',
            payment_provider_id=session_id,
            admin_notes='Mock payment - user activated'
        )
        
        # Activate user only after payment is completed
        user.is_active = True
        user.subscription_status = 'active'
        
        db.session.add(new_subscription)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment completed successfully! Your account has been activated.',
            'user': {
                'id': user.id,
                'email': user.email,
                'is_active': user.is_active,
                'subscription_status': user.subscription_status
            },
            'subscription': {
                'plan_name': plan.name,
                'status': 'active',
                'amount': final_price
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/mock-checkout', methods=['POST'])
@jwt_required()
def create_mock_checkout():
    """Create a mock checkout session for testing (no Stripe required)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'plan_id' not in data:
            return jsonify({'error': 'Plan ID is required'}), 400
        
        plan_id = data['plan_id']
        promotion_code = data.get('promotion_code')
        success_url = data.get('success_url', 'http://localhost:5176/subscription/success')
        cancel_url = data.get('cancel_url', 'http://localhost:5176/subscription/cancel')
        
        # Get plan
        plan = subscription_service.get_plan_by_id(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Get user (use provided user_id or JWT identity)
        target_user_id = data.get('user_id', user_id)
        user = User.query.get(target_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Calculate final price with promotion
        final_price = plan.price
        promotion_info = None
        
        if promotion_code:
            from ..models.promotion import Promotion
            promotion = Promotion.query.filter_by(code=promotion_code.upper()).first()
            if promotion and promotion.is_valid():
                if promotion.type == 'percentage':
                    discount_amount = float(plan.price) * (float(promotion.value) / 100)
                    final_price = float(plan.price) - discount_amount
                elif promotion.type == 'fixed':
                    final_price = max(0, float(plan.price) - float(promotion.value))
                promotion_info = promotion.to_dict()
        
        # Create mock checkout session
        session_id = f"mock_session_{uuid.uuid4().hex[:8]}"
        
        return jsonify({
            'session_id': session_id,
            'url': f"{success_url}?session_id={session_id}&plan_id={plan_id}&final_price={final_price}&user_id={user.id}",
            'mock_data': {
                'plan_name': plan.name,
                'original_price': plan.price,
                'final_price': final_price,
                'promotion_applied': promotion_info,
                'user_email': user.email,
                'checkout_url': f"{success_url}?session_id={session_id}&plan_id={plan_id}&final_price={final_price}&user_id={user.id}"
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/sidebar/user-components', methods=['GET'])
@jwt_required()
def get_user_sidebar_components():
    """Get sidebar components based on user's subscription plan"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's current subscription
        user_subscription = subscription_service.get_user_subscription(user_id)
        
        # Initialize default values for users without subscriptions
        subscription_level = 'none'
        plan_name = 'No Subscription'
        user_components = []
        
        # Define available components for different subscription levels
        all_components = {
            'none': [
                {
                    'id': 'dashboard',
                    'label': 'Dashboard',
                    'group': 'Main',
                    'description': 'Your personal dashboard',
                    'required': True
                },
                {
                    'id': 'subscription',
                    'label': 'My Subscription',
                    'group': 'Account',
                    'description': 'Manage your plan',
                    'required': True
                },
                {
                    'id': 'profile',
                    'label': 'Profile Settings',
                    'group': 'Account',
                    'description': 'Update your profile',
                    'required': True
                },
                {
                    'id': 'help-support',
                    'label': 'Help & Support',
                    'group': 'Support',
                    'description': 'Get help and support',
                    'required': True
                }
            ],
            'basic': [
                {
                    'id': 'dashboard',
                    'label': 'Dashboard',
                    'group': 'Main',
                    'description': 'Your personal dashboard',
                    'required': True
                },
                {
                    'id': 'journal',
                    'label': 'Trading Journal',
                    'group': 'Trading',
                    'description': 'Track your trades and performance',
                    'required': True
                },
                {
                    'id': 'subscription',
                    'label': 'My Subscription',
                    'group': 'Account',
                    'description': 'Manage your plan',
                    'required': True
                },
                {
                    'id': 'profile',
                    'label': 'Profile Settings',
                    'group': 'Account',
                    'description': 'Update your profile',
                    'required': True
                },
                {
                    'id': 'help-support',
                    'label': 'Help & Support',
                    'group': 'Support',
                    'description': 'Get help and support',
                    'required': True
                }
            ],
            'premium': [
                {
                    'id': 'dashboard',
                    'label': 'Dashboard',
                    'group': 'Main',
                    'description': 'Your personal dashboard',
                    'required': True
                },
                {
                    'id': 'journal',
                    'label': 'Trading Journal',
                    'group': 'Trading',
                    'description': 'Track your trades and performance',
                    'required': True
                },
                {
                    'id': 'analytics',
                    'label': 'Analytics',
                    'group': 'Trading',
                    'description': 'View trading analytics and reports',
                    'required': False
                },
                {
                    'id': 'chart',
                    'label': 'Trading Charts',
                    'group': 'Trading',
                    'description': 'Live market charts',
                    'required': False
                },
                {
                    'id': 'portfolio',
                    'label': 'Portfolio',
                    'group': 'Trading',
                    'description': 'Manage your portfolio',
                    'required': False
                },
                {
                    'id': 'subscription',
                    'label': 'My Subscription',
                    'group': 'Account',
                    'description': 'Manage your plan',
                    'required': True
                },
                {
                    'id': 'profile',
                    'label': 'Profile Settings',
                    'group': 'Account',
                    'description': 'Update your profile',
                    'required': True
                },
                {
                    'id': 'help-support',
                    'label': 'Help & Support',
                    'group': 'Support',
                    'description': 'Get help and support',
                    'required': True
                }
            ],
            'enterprise': [
                {
                    'id': 'dashboard',
                    'label': 'Dashboard',
                    'group': 'Main',
                    'description': 'Your personal dashboard',
                    'required': True
                },
                {
                    'id': 'journal',
                    'label': 'Trading Journal',
                    'group': 'Trading',
                    'description': 'Track your trades and performance',
                    'required': True
                },
                {
                    'id': 'analytics',
                    'label': 'Analytics',
                    'group': 'Trading',
                    'description': 'View trading analytics and reports',
                    'required': False
                },
                {
                    'id': 'advanced-analytics',
                    'label': 'Advanced Analytics',
                    'group': 'Trading',
                    'description': 'Advanced trading analytics and insights',
                    'required': False
                },
                {
                    'id': 'chart',
                    'label': 'Trading Charts',
                    'group': 'Trading',
                    'description': 'Live market charts',
                    'required': False
                },
                {
                    'id': 'portfolio',
                    'label': 'Portfolio',
                    'group': 'Trading',
                    'description': 'Manage your portfolio',
                    'required': False
                },
                {
                    'id': 'api-access',
                    'label': 'API Access',
                    'group': 'Advanced',
                    'description': 'Access to trading APIs',
                    'required': False
                },
                {
                    'id': 'subscription',
                    'label': 'My Subscription',
                    'group': 'Account',
                    'description': 'Manage your plan',
                    'required': True
                },
                {
                    'id': 'profile',
                    'label': 'Profile Settings',
                    'group': 'Account',
                    'description': 'Update your profile',
                    'required': True
                },
                {
                    'id': 'priority-support',
                    'label': 'Priority Support',
                    'group': 'Support',
                    'description': 'Priority customer support',
                    'required': False
                },
                {
                    'id': 'help-support',
                    'label': 'Help & Support',
                    'group': 'Support',
                    'description': 'Get help and support',
                    'required': True
                }
            ]
        }
        
        # Determine user's subscription level
        if not user_subscription or not user_subscription.is_active:
            # No active subscription - show basic components only
            subscription_level = 'basic'
            plan_name = 'Basic (No Subscription)'
        else:
            # Get plan name and map to subscription level
            plan_name = user_subscription.plan.name.lower() if user_subscription.plan else 'basic'
            
            if 'enterprise' in plan_name:
                subscription_level = 'enterprise'
            elif 'premium' in plan_name or 'pro' in plan_name:
                subscription_level = 'premium'
            else:
                subscription_level = 'basic'
        
        # Component mapping for converting IDs to full component objects
        component_map = {
            'dashboard': {
                'id': 'dashboard',
                'label': 'Dashboard',
                'group': 'Main',
                'description': 'Your personal dashboard',
                'required': True
            },
            'journal': {
                'id': 'journal',
                'label': 'Trading Journal',
                'group': 'Trading',
                'description': 'Track your trades and performance',
                'required': False
            },
            'analytics': {
                'id': 'analytics',
                'label': 'Analytics',
                'group': 'Trading',
                'description': 'View trading analytics and reports',
                'required': False
            },
            'advanced-analytics': {
                'id': 'advanced-analytics',
                'label': 'Advanced Analytics',
                'group': 'Trading',
                'description': 'Advanced trading analytics',
                'required': False
            },
            'chart': {
                'id': 'chart',
                'label': 'Chart Trading',
                'group': 'Trading',
                'description': 'Advanced charting tools',
                'required': False
            },
            'portfolio': {
                'id': 'portfolio',
                'label': 'Portfolio',
                'group': 'Trading',
                'description': 'Portfolio management',
                'required': False
            },
            'subscription': {
                'id': 'subscription',
                'label': 'My Subscription',
                'group': 'Account',
                'description': 'Manage your plan',
                'required': True
            },
            'profile': {
                'id': 'profile',
                'label': 'Profile Settings',
                'group': 'Account',
                'description': 'Update your profile',
                'required': True
            },
            'settings': {
                'id': 'settings',
                'label': 'Settings',
                'group': 'Account',
                'description': 'User settings',
                'required': False
            },
            'api-access': {
                'id': 'api-access',
                'label': 'API Access',
                'group': 'Advanced',
                'description': 'Access to trading APIs',
                'required': False
            },
            'priority-support': {
                'id': 'priority-support',
                'label': 'Priority Support',
                'group': 'Support',
                'description': 'Priority customer support',
                'required': False
            },
            'help-support': {
                'id': 'help-support',
                'label': 'Help & Support',
                'group': 'Support',
                'description': 'Get help and support',
                'required': True
            }
        }
        
        # Determine subscription level and components based on user's subscription
        if user_subscription and user_subscription.plan and user_subscription.is_active:
            # User has an active subscription
            plan_name = user_subscription.plan.name
            subscription_level = 'active'
            
            # Use the plan's actual sidebar_components
            plan_components = user_subscription.plan.sidebar_components or []
            
            # Convert plan's sidebar_components to full component objects
            user_components = []
            for component_id in plan_components:
                if component_id in component_map:
                    user_components.append(component_map[component_id])
            
            # If no components found in plan, fall back to basic
            if not user_components:
                plan_name_lower = plan_name.lower()
                if 'enterprise' in plan_name_lower:
                    subscription_level = 'enterprise'
                elif 'premium' in plan_name_lower or 'pro' in plan_name_lower:
                    subscription_level = 'premium'
                else:
                    subscription_level = 'basic'
                user_components = all_components.get(subscription_level, all_components['basic'])
        else:
            # User has no active subscription - use 'none' level
            subscription_level = 'none'
            plan_name = 'No Subscription'
            user_components = all_components['none']
        
        return jsonify({
            'components': user_components,
            'subscription_level': subscription_level,
            'plan_name': plan_name
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/sidebar/check-component/<component_id>', methods=['GET'])
@jwt_required()
def check_component_availability(component_id):
    """Check if a specific component is available to the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's current subscription
        user_subscription = subscription_service.get_user_subscription(user_id)
        
        # Define component availability by subscription level
        component_availability = {
            'none': ['dashboard', 'subscription', 'profile', 'help-support'],
            'basic': ['dashboard', 'journal', 'subscription', 'profile', 'help-support'],
            'premium': ['dashboard', 'journal', 'analytics', 'chart', 'portfolio', 'subscription', 'profile', 'help-support'],
            'enterprise': ['dashboard', 'journal', 'analytics', 'advanced-analytics', 'chart', 'portfolio', 'api-access', 'subscription', 'profile', 'priority-support', 'help-support']
        }
        
        # Determine user's subscription level
        if not user_subscription or not user_subscription.is_active:
            subscription_level = 'none'
        else:
            plan_name = user_subscription.plan.name.lower() if user_subscription.plan else 'basic'
            
            if 'enterprise' in plan_name:
                subscription_level = 'enterprise'
            elif 'premium' in plan_name or 'pro' in plan_name:
                subscription_level = 'premium'
            else:
                subscription_level = 'basic'
        
        # Check if component is available
        available_components = component_availability.get(subscription_level, component_availability['none'])
        is_available = component_id in available_components
        
        return jsonify({
            'is_available': is_available,
            'subscription_level': subscription_level,
            'component_id': component_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
