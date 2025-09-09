"""
Subscription Middleware for checking subscription status and blocking access without payment
"""

from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..models.user import User
from ..models.user_subscription import UserSubscription
from ..models.subscription import SubscriptionStatus
from .. import db
import logging

logger = logging.getLogger(__name__)

def require_active_subscription(f):
    """Decorator to require an active subscription for access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            if not current_user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get user
            user = User.query.get(int(current_user_id))
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is active
            if not user.is_active:
                return jsonify({'error': 'Account is suspended'}), 403
            
            # Check subscription status
            subscription_status = get_user_subscription_status(user.id)
            
            if subscription_status == 'no_subscription':
                return jsonify({
                    'error': 'Active subscription required',
                    'message': 'Please subscribe to access this feature',
                    'subscription_required': True,
                    'redirect_to': '/subscription'
                }), 402  # Payment Required
            
            elif subscription_status == 'expired':
                return jsonify({
                    'error': 'Subscription expired',
                    'message': 'Your subscription has expired. Please renew to continue.',
                    'subscription_required': True,
                    'redirect_to': '/subscription'
                }), 402
            
            elif subscription_status == 'cancelled':
                return jsonify({
                    'error': 'Subscription cancelled',
                    'message': 'Your subscription has been cancelled. Please resubscribe to continue.',
                    'subscription_required': True,
                    'redirect_to': '/subscription'
                }), 402
            
            elif subscription_status == 'past_due':
                return jsonify({
                    'error': 'Payment past due',
                    'message': 'Your payment is past due. Please update your payment method.',
                    'subscription_required': True,
                    'redirect_to': '/subscription'
                }), 402
            
            # Subscription is active, allow access
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Error in subscription middleware: {e}")
            return jsonify({'error': 'Subscription verification failed'}), 500
    
    return decorated_function

def require_trial_or_subscription(f):
    """Decorator to require either trial or active subscription"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            if not current_user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get user
            user = User.query.get(int(current_user_id))
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is active
            if not user.is_active:
                return jsonify({'error': 'Account is suspended'}), 403
            
            # Check subscription status
            subscription_status = get_user_subscription_status(user.id)
            
            # Allow access if user has trial or active subscription
            if subscription_status in ['trial', 'active']:
                return f(*args, **kwargs)
            
            # Block access for other statuses
            return jsonify({
                'error': 'Subscription required',
                'message': 'Please subscribe or start your trial to access this feature',
                'subscription_required': True,
                'redirect_to': '/subscription'
            }), 402
            
        except Exception as e:
            logger.error(f"Error in trial/subscription middleware: {e}")
            return jsonify({'error': 'Subscription verification failed'}), 500
    
    return decorated_function

def get_user_subscription_status(user_id):
    """Get the current subscription status for a user"""
    try:
        from ..services.subscription_service import SubscriptionService
        return SubscriptionService.get_subscription_status(user_id)
    except Exception as e:
        logger.error(f"Error getting subscription status for user {user_id}: {e}")
        return 'no_subscription'

def check_subscription_access(user_id, feature=None):
    """Check if user has access to a specific feature based on subscription"""
    try:
        subscription_status = get_user_subscription_status(user_id)
        
        # Basic access check
        if subscription_status in ['active', 'trial']:
            return True, subscription_status
        
        # Feature-specific checks can be added here
        if feature:
            # Add feature-specific logic here
            pass
        
        return False, subscription_status
        
    except Exception as e:
        logger.error(f"Error checking subscription access for user {user_id}: {e}")
        return False, 'error'

def get_subscription_info(user_id):
    """Get detailed subscription information for a user"""
    try:
        subscription = UserSubscription.query.filter_by(
            user_id=user_id
        ).order_by(UserSubscription.created_at.desc()).first()
        
        if not subscription:
            return {
                'has_subscription': False,
                'status': 'no_subscription',
                'message': 'No subscription found'
            }
        
        return {
            'has_subscription': True,
            'status': subscription.status.value,
            'plan_name': subscription.plan.name if subscription.plan else None,
            'plan_price': float(subscription.plan.price) if subscription.plan else None,
            'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
            'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
            'trial_end': subscription.trial_end.isoformat() if subscription.trial_end else None,
            'is_trial': subscription.status == SubscriptionStatus.TRIAL,
            'is_active': subscription.status == SubscriptionStatus.ACTIVE,
            'message': f"Subscription: {subscription.status.value}"
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription info for user {user_id}: {e}")
        return {
            'has_subscription': False,
            'status': 'error',
            'message': 'Error retrieving subscription information'
        }
