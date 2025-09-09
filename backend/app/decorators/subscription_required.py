"""
Subscription-based access control decorators
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..services.subscription_service import SubscriptionService
from ..models.user_subscription import SubscriptionStatus

def require_subscription(required_plan=None, required_components=None):
    """
    Decorator to require active subscription for API endpoints
    
    Args:
        required_plan: Specific plan name required (e.g., 'Professional', 'Enterprise')
        required_components: List of components user must have access to
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Get user's subscription
                subscription = SubscriptionService.get_user_subscription(user_id)
                
                # Check if user has active subscription
                if not subscription or not subscription.is_active:
                    return jsonify({
                        'error': 'Active subscription required',
                        'subscription_required': True,
                        'current_plan': None
                    }), 403
                
                # Check specific plan requirement
                if required_plan:
                    if not subscription.plan or subscription.plan.name != required_plan:
                        return jsonify({
                            'error': f'{required_plan} subscription required',
                            'subscription_required': True,
                            'current_plan': subscription.plan.name if subscription.plan else None,
                            'required_plan': required_plan
                        }), 403
                
                # Check component access
                if required_components:
                    user_components = subscription.plan.sidebar_components if subscription.plan else []
                    missing_components = [comp for comp in required_components if comp not in user_components]
                    
                    if missing_components:
                        return jsonify({
                            'error': 'Insufficient subscription level',
                            'subscription_required': True,
                            'current_plan': subscription.plan.name if subscription.plan else None,
                            'missing_components': missing_components,
                            'required_components': required_components
                        }), 403
                
                # Add subscription info to request context
                request.current_subscription = subscription
                request.user_plan = subscription.plan.name if subscription.plan else 'Basic'
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': f'Subscription validation failed: {str(e)}'}), 500
        
        return decorated_function
    return decorator

def require_component_access(component_id):
    """
    Decorator to require access to a specific component
    
    Args:
        component_id: Component ID that user must have access to
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Get user's subscription
                subscription = SubscriptionService.get_user_subscription(user_id)
                
                # Check if user has active subscription
                if not subscription or not subscription.is_active:
                    return jsonify({
                        'error': 'Active subscription required',
                        'component_id': component_id,
                        'subscription_required': True
                    }), 403
                
                # Check if user has access to the component
                user_components = subscription.plan.sidebar_components if subscription.plan else []
                
                if component_id not in user_components:
                    return jsonify({
                        'error': 'Component access denied',
                        'component_id': component_id,
                        'current_plan': subscription.plan.name if subscription.plan else 'Basic',
                        'subscription_required': True,
                        'upgrade_required': True
                    }), 403
                
                # Add subscription info to request context
                request.current_subscription = subscription
                request.user_plan = subscription.plan.name if subscription.plan else 'Basic'
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': f'Component access validation failed: {str(e)}'}), 500
        
        return decorated_function
    return decorator

def require_plan_level(min_plan_level):
    """
    Decorator to require minimum plan level
    
    Args:
        min_plan_level: Minimum plan level required ('basic', 'professional', 'enterprise')
    """
    plan_hierarchy = {
        'basic': 1,
        'professional': 2,
        'enterprise': 3
    }
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Get user's subscription
                subscription = SubscriptionService.get_user_subscription(user_id)
                
                # Check if user has active subscription
                if not subscription or not subscription.is_active:
                    return jsonify({
                        'error': 'Active subscription required',
                        'subscription_required': True
                    }), 403
                
                # Determine user's current plan level
                if not subscription.plan:
                    current_level = 1  # Basic
                else:
                    plan_name = subscription.plan.name.lower()
                    if 'enterprise' in plan_name:
                        current_level = 3
                    elif 'professional' in plan_name or 'pro' in plan_name:
                        current_level = 2
                    else:
                        current_level = 1
                
                # Check if user meets minimum level requirement
                required_level = plan_hierarchy.get(min_plan_level.lower(), 1)
                
                if current_level < required_level:
                    return jsonify({
                        'error': f'{min_plan_level.title()} subscription or higher required',
                        'current_plan': subscription.plan.name if subscription.plan else 'Basic',
                        'required_level': min_plan_level,
                        'subscription_required': True,
                        'upgrade_required': True
                    }), 403
                
                # Add subscription info to request context
                request.current_subscription = subscription
                request.user_plan = subscription.plan.name if subscription.plan else 'Basic'
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': f'Plan level validation failed: {str(e)}'}), 500
        
        return decorated_function
    return decorator
