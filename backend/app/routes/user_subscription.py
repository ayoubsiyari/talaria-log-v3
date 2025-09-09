"""
User Subscription Routes
Handles user subscription status and management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.user import User

user_subscription_bp = Blueprint('user_subscription', __name__)

@user_subscription_bp.route('/users/<int:user_id>/subscription', methods=['GET'])
@jwt_required()
def get_user_subscription(user_id):
    """Get user subscription status"""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()
        
        # Check if user is accessing their own data or is admin
        if current_user_id != user_id:
            # For now, allow any authenticated user to check any subscription
            # In production, you might want to restrict this to admins only
            pass
        
        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return subscription information
        subscription_data = {
            'user_id': user.id,
            'email': user.email,
            'subscription_status': user.subscription_status,
            'subscription_plan': user.subscription_plan,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }
        
        return jsonify(subscription_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_subscription_bp.route('/users/me/subscription', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get current user's subscription status"""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()
        
        # Find the user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return subscription information
        subscription_data = {
            'user_id': user.id,
            'email': user.email,
            'subscription_status': user.subscription_status,
            'subscription_plan': user.subscription_plan,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }
        
        # Add debug information
        print(f"🔍 Subscription API called for user: {user.email} (ID: {user.id})")
        print(f"🔍 User subscription_status: {user.subscription_status}")
        print(f"🔍 User is_active: {user.is_active}")
        print(f"🔍 User subscription_plan: {user.subscription_plan}")
        
        return jsonify(subscription_data), 200
        
    except Exception as e:
        print(f"❌ Error in get_my_subscription: {e}")
        return jsonify({'error': str(e)}), 500
