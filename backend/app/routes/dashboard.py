from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..middleware.subscription_middleware import require_active_subscription, get_subscription_info
from .. import db
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
@jwt_required()
@require_active_subscription
def get_dashboard():
    """Get user dashboard data - requires active subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get subscription info
        subscription_info = get_subscription_info(user.id)
        
        # Get dashboard data (this would include user's trading data, analytics, etc.)
        dashboard_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'subscription_status': user.subscription_status
            },
            'subscription': subscription_info,
            'analytics': {
                'total_trades': 0,  # Would be calculated from user's trading data
                'win_rate': 0,
                'total_profit': 0,
                'monthly_performance': []
            },
            'recent_activity': [],
            'quick_actions': [
                {'name': 'New Trade', 'action': 'create_trade'},
                {'name': 'View Analytics', 'action': 'view_analytics'},
                {'name': 'Manage Portfolio', 'action': 'manage_portfolio'}
            ]
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        return jsonify({'error': 'Failed to load dashboard'}), 500

@dashboard_bp.route('/api/dashboard/subscription-status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Get current subscription status - no subscription required"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subscription_info = get_subscription_info(user.id)
        
        return jsonify({
            'success': True,
            'subscription': subscription_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        return jsonify({'error': 'Failed to get subscription status'}), 500

@dashboard_bp.route('/api/dashboard/features', methods=['GET'])
@jwt_required()
@require_active_subscription
def get_available_features():
    """Get available features based on subscription - requires active subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subscription_info = get_subscription_info(user.id)
        
        # Define features based on subscription plan
        features = {
            'basic': [
                'trade_tracking',
                'basic_analytics',
                'portfolio_view',
                'trade_history'
            ],
            'professional': [
                'trade_tracking',
                'advanced_analytics',
                'portfolio_view',
                'trade_history',
                'risk_management',
                'performance_reports',
                'export_data'
            ],
            'enterprise': [
                'trade_tracking',
                'advanced_analytics',
                'portfolio_view',
                'trade_history',
                'risk_management',
                'performance_reports',
                'export_data',
                'team_management',
                'custom_reports',
                'api_access',
                'priority_support'
            ]
        }
        
        # Get features based on current plan
        plan_name = subscription_info.get('plan_name', 'basic').lower()
        available_features = features.get(plan_name, features['basic'])
        
        return jsonify({
            'success': True,
            'features': available_features,
            'plan': plan_name,
            'subscription': subscription_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting features: {e}")
        return jsonify({'error': 'Failed to get features'}), 500
