"""
Protected content routes that require subscription validation
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators.subscription_required import require_component_access, require_plan_level
from ..services.subscription_service import SubscriptionService

protected_bp = Blueprint('protected_content', __name__)

@protected_bp.route('/analytics', methods=['GET'])
@jwt_required()
@require_component_access('analytics')
def get_analytics_data():
    """Get analytics data - requires Professional or Enterprise plan"""
    try:
        user_id = get_jwt_identity()
        
        # Mock analytics data (replace with real data)
        analytics_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'analytics': {
                'total_trades': 150,
                'win_rate': 0.65,
                'profit_loss': 2500.50,
                'monthly_performance': [
                    {'month': 'Jan', 'profit': 1200.00},
                    {'month': 'Feb', 'profit': 800.50},
                    {'month': 'Mar', 'profit': 500.00}
                ],
                'top_strategies': [
                    {'name': 'Swing Trading', 'profit': 1500.00},
                    {'name': 'Day Trading', 'profit': 1000.50}
                ]
            }
        }
        
        return jsonify({
            'success': True,
            'data': analytics_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/chart', methods=['GET'])
@jwt_required()
@require_component_access('chart')
def get_chart_data():
    """Get chart data - requires Professional or Enterprise plan"""
    try:
        user_id = get_jwt_identity()
        
        # Mock chart data (replace with real data)
        chart_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'charts': {
                'price_data': [
                    {'time': '2024-01-01', 'price': 100.00},
                    {'time': '2024-01-02', 'price': 102.50},
                    {'time': '2024-01-03', 'price': 98.75}
                ],
                'indicators': {
                    'sma_20': 100.25,
                    'sma_50': 99.80,
                    'rsi': 45.5
                }
            }
        }
        
        return jsonify({
            'success': True,
            'data': chart_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/portfolio', methods=['GET'])
@jwt_required()
@require_component_access('portfolio')
def get_portfolio_data():
    """Get portfolio data - requires Professional or Enterprise plan"""
    try:
        user_id = get_jwt_identity()
        
        # Mock portfolio data (replace with real data)
        portfolio_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'portfolio': {
                'total_value': 50000.00,
                'cash': 10000.00,
                'investments': 40000.00,
                'holdings': [
                    {'symbol': 'AAPL', 'shares': 100, 'value': 15000.00},
                    {'symbol': 'GOOGL', 'shares': 50, 'value': 15000.00},
                    {'symbol': 'MSFT', 'shares': 200, 'value': 10000.00}
                ],
                'performance': {
                    'daily_change': 250.00,
                    'daily_change_percent': 0.5,
                    'total_gain_loss': 5000.00
                }
            }
        }
        
        return jsonify({
            'success': True,
            'data': portfolio_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/advanced-analytics', methods=['GET'])
@jwt_required()
@require_component_access('advanced-analytics')
def get_advanced_analytics_data():
    """Get advanced analytics data - requires Enterprise plan only"""
    try:
        user_id = get_jwt_identity()
        
        # Mock advanced analytics data (replace with real data)
        advanced_analytics_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'advanced_analytics': {
                'risk_metrics': {
                    'sharpe_ratio': 1.85,
                    'max_drawdown': 0.12,
                    'var_95': 0.05
                },
                'correlation_matrix': {
                    'AAPL': {'GOOGL': 0.75, 'MSFT': 0.60},
                    'GOOGL': {'AAPL': 0.75, 'MSFT': 0.80},
                    'MSFT': {'AAPL': 0.60, 'GOOGL': 0.80}
                },
                'machine_learning_insights': {
                    'prediction_accuracy': 0.78,
                    'recommended_actions': [
                        'Consider reducing position size in AAPL',
                        'Increase exposure to defensive stocks'
                    ]
                }
            }
        }
        
        return jsonify({
            'success': True,
            'data': advanced_analytics_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/api-access', methods=['GET'])
@jwt_required()
@require_component_access('api-access')
def get_api_access_info():
    """Get API access information - requires Enterprise plan only"""
    try:
        user_id = get_jwt_identity()
        
        # Mock API access data (replace with real data)
        api_access_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'api_access': {
                'api_key': f'ak_live_{user_id}_' + 'x' * 20,  # Mock API key
                'rate_limit': {
                    'requests_per_minute': 1000,
                    'requests_per_day': 100000
                },
                'endpoints': [
                    'GET /api/v1/trades',
                    'POST /api/v1/trades',
                    'GET /api/v1/portfolio',
                    'GET /api/v1/analytics'
                ],
                'documentation_url': 'https://api.talaria.com/docs',
                'webhook_url': f'https://api.talaria.com/webhooks/{user_id}'
            }
        }
        
        return jsonify({
            'success': True,
            'data': api_access_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/priority-support', methods=['GET'])
@jwt_required()
@require_component_access('priority-support')
def get_priority_support_info():
    """Get priority support information - requires Enterprise plan only"""
    try:
        user_id = get_jwt_identity()
        
        # Mock priority support data (replace with real data)
        priority_support_data = {
            'user_id': user_id,
            'plan': request.user_plan,
            'priority_support': {
                'support_channels': [
                    '24/7 Live Chat',
                    'Priority Email Support',
                    'Phone Support',
                    'Dedicated Account Manager'
                ],
                'response_times': {
                    'chat': 'Immediate',
                    'email': 'Within 1 hour',
                    'phone': 'Within 15 minutes'
                },
                'account_manager': {
                    'name': 'Sarah Johnson',
                    'email': 'sarah.johnson@talaria.com',
                    'phone': '+1-555-0123'
                },
                'support_tickets': [
                    {
                        'id': 'TICKET-001',
                        'subject': 'API Integration Help',
                        'status': 'Resolved',
                        'priority': 'High'
                    }
                ]
            }
        }
        
        return jsonify({
            'success': True,
            'data': priority_support_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@protected_bp.route('/subscription-status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Get current user's subscription status and component access"""
    try:
        user_id = get_jwt_identity()
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return jsonify({
                'has_subscription': False,
                'subscription_status': 'none',
                'plan_name': 'None',
                'components': [],
                'subscription_required': True
            }), 200
        
        components = subscription.plan.sidebar_components if subscription.plan else []
        
        return jsonify({
            'has_subscription': True,
            'subscription_status': subscription.status.value,
            'plan_name': subscription.plan.name if subscription.plan else 'Unknown',
            'components': components,
            'is_active': subscription.is_active,
            'subscription_required': not subscription.is_active
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
