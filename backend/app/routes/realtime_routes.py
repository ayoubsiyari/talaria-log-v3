"""
Real-time update routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..services.realtime_service import realtime_service
from ..models.user_subscription import UserSubscription, SubscriptionStatus
from ..models.subscription import SubscriptionPlan

realtime_bp = Blueprint('realtime', __name__)

@realtime_bp.route('/updates', methods=['GET'])
@jwt_required()
def get_user_updates():
    """Get real-time updates for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's current subscription
        subscription = UserSubscription.query.filter_by(
            user_id=user_id,
            status=SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            return jsonify({'updates': [], 'message': 'No active subscription'}), 200
        
        # Get updates since last check
        since_str = request.args.get('since')
        since = None
        if since_str:
            try:
                since = datetime.fromisoformat(since_str)
            except ValueError:
                pass
        
        # Get updates for user's plan
        updates = realtime_service.get_updates_for_user(user_id, since)
        
        return jsonify({
            'updates': updates,
            'plan_id': subscription.plan_id,
            'plan_name': subscription.plan_name,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@realtime_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe_to_updates():
    """Subscribe user to real-time updates for their plan"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's current subscription
        subscription = UserSubscription.query.filter_by(
            user_id=user_id,
            status=SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            return jsonify({'error': 'No active subscription'}), 400
        
        # Subscribe user to their plan updates
        realtime_service.subscribe_user_to_plan(user_id, subscription.plan_id)
        
        return jsonify({
            'message': 'Subscribed to plan updates',
            'plan_id': subscription.plan_id,
            'plan_name': subscription.plan_name
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@realtime_bp.route('/unsubscribe', methods=['POST'])
@jwt_required()
def unsubscribe_from_updates():
    """Unsubscribe user from real-time updates"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's current subscription
        subscription = UserSubscription.query.filter_by(
            user_id=user_id,
            status=SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            return jsonify({'error': 'No active subscription'}), 400
        
        # Unsubscribe user from their plan updates
        realtime_service.unsubscribe_user_from_plan(user_id, subscription.plan_id)
        
        return jsonify({
            'message': 'Unsubscribed from plan updates',
            'plan_id': subscription.plan_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@realtime_bp.route('/plan/<int:plan_id>/subscribers', methods=['GET'])
@jwt_required()
def get_plan_subscribers(plan_id):
    """Get all subscribers for a plan (admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin (you can add proper admin check here)
        from ..models.user import User
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        subscribers = realtime_service.get_plan_subscribers(plan_id)
        
        return jsonify({
            'plan_id': plan_id,
            'subscribers': subscribers,
            'count': len(subscribers)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

