from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.user_subscription import UserSubscription, SubscriptionStatus, BillingCycle
from billing_cycle_mapper import map_plan_billing_cycle_to_user
from ..models.subscription import SubscriptionPlan
from .. import db
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
admin_user_mgmt_bp = Blueprint('admin_user_mgmt', __name__)

def get_user_subscription_status(user_id):
    """Get the current subscription status for a user"""
    try:
        # Get the most recent active subscription
        subscription = UserSubscription.query.filter_by(
            user_id=user_id
        ).order_by(UserSubscription.created_at.desc()).first()
        
        if not subscription:
            return 'no_subscription'
        
        # Check subscription status
        if subscription.status == SubscriptionStatus.ACTIVE:
            return 'active'
        elif subscription.status == SubscriptionStatus.TRIAL:
            return 'trial'
        elif subscription.status == SubscriptionStatus.EXPIRED:
            return 'expired'
        elif subscription.status == SubscriptionStatus.CANCELLED:
            return 'cancelled'
        elif subscription.status == SubscriptionStatus.PAST_DUE:
            return 'past_due'
        else:
            return 'no_subscription'
            
    except Exception as e:
        logger.error(f"Error getting subscription status for user {user_id}: {e}")
        return 'no_subscription'

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
            'plan_name': subscription.plan_name,
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

@admin_user_mgmt_bp.route('/users/stuck-on-plan-selection', methods=['GET'])
@jwt_required()
def get_users_stuck_on_plan_selection():
    """Get users who registered but haven't subscribed yet"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        days_threshold = request.args.get('days', 7, type=int)
        
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        # Get users who registered but have no subscription
        users_without_subscription = []
        
        # Get all users (including inactive ones who haven't paid)
        all_users = User.query.filter(
            User.created_at <= threshold_date
        ).limit(limit).offset(offset).all()
        
        for user in all_users:
            subscription_status = get_user_subscription_status(user.id)
            subscription_info = get_subscription_info(user.id)
            
            if subscription_status == 'no_subscription':
                stuck_reason = 'No subscription after registration'
                if not user.is_active:
                    stuck_reason = 'Account inactive - payment required'
                
                users_without_subscription.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'created_at': user.created_at.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'is_active': user.is_active,
                    'subscription_status': subscription_status,
                    'subscription_info': subscription_info,
                    'days_since_registration': (datetime.utcnow() - user.created_at).days,
                    'stuck_reason': stuck_reason
                })
        
        return jsonify({
            'success': True,
            'users': users_without_subscription,
            'total': len(users_without_subscription),
            'pagination': {
                'limit': limit,
                'offset': offset
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting users stuck on plan selection: {e}")
        return jsonify({'error': 'Failed to get users'}), 500

@admin_user_mgmt_bp.route('/users/expired-subscriptions', methods=['GET'])
@jwt_required()
def get_users_with_expired_subscriptions():
    """Get users with expired subscriptions"""
    try:
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get users with expired subscriptions
        expired_subscriptions = UserSubscription.query.filter(
            UserSubscription.status == SubscriptionStatus.EXPIRED
        ).limit(limit).offset(offset).all()
        
        users_with_expired = []
        for subscription in expired_subscriptions:
            user = subscription.user
            subscription_info = get_subscription_info(user.id)
            
            users_with_expired.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'subscription_id': subscription.id,
                'plan_name': subscription.plan_name,
                'expired_date': subscription.end_date.isoformat() if subscription.end_date else None,
                'subscription_status': 'expired',
                'subscription_info': subscription_info,
                'days_since_expired': (datetime.utcnow() - subscription.end_date).days if subscription.end_date else None
            })
        
        return jsonify({
            'success': True,
            'users': users_with_expired,
            'total': len(users_with_expired),
            'pagination': {
                'limit': limit,
                'offset': offset
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting users with expired subscriptions: {e}")
        return jsonify({'error': 'Failed to get users'}), 500

@admin_user_mgmt_bp.route('/users/assign-subscription', methods=['POST'])
@jwt_required()
def assign_subscription_to_user():
    """Manually assign a subscription plan to a user"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data or 'plan_id' not in data:
            return jsonify({'error': 'User ID and Plan ID are required'}), 400
        
        user_id = data['user_id']
        plan_id = data['plan_id']
        duration_days = data.get('duration_days', 30)  # Default 30 days
        is_trial = data.get('is_trial', False)
        admin_notes = data.get('admin_notes', '')
        auto_activate = data.get('auto_activate', False)
        expiration_date = data.get('expiration_date')
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Calculate dates
        start_date = datetime.utcnow()
        
        # Use provided expiration date or calculate from duration_days
        if expiration_date:
            try:
                end_date = datetime.strptime(expiration_date, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid expiration date format. Use YYYY-MM-DD'}), 400
        else:
            end_date = start_date + timedelta(days=duration_days)
        
        # Determine status
        if is_trial:
            status = SubscriptionStatus.TRIAL
        else:
            status = SubscriptionStatus.ACTIVE
        
        # Create subscription
        new_subscription = UserSubscription(
            user_id=user_id,
            plan_id=plan_id,
            subscription_id=f"admin_assigned_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            plan_name=plan.name,
            plan_type=plan.billing_cycle.value,
            status=status,
            amount=plan.price,
            currency='USD',
            billing_cycle=map_plan_billing_cycle_to_user(plan.billing_cycle),
            unit_amount=float(plan.price),
            total_amount=float(plan.price),
            start_date=start_date,
            end_date=end_date,
            trial_end=end_date if is_trial else None,
            admin_notes=admin_notes,
            created_by_admin=True
        )
        
        db.session.add(new_subscription)
        db.session.commit()
        
        # Update user subscription status and activation
        user.subscription_status = status.value
        if auto_activate:
            user.is_active = True
            user.subscription_status = 'active'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Subscription assigned successfully to {user.username}',
            'subscription': {
                'id': new_subscription.id,
                'plan_name': plan.name,
                'status': status.value,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'is_trial': is_trial,
                'admin_notes': admin_notes,
                'auto_activated': auto_activate
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error assigning subscription: {e}")
        return jsonify({'error': 'Failed to assign subscription'}), 500

@admin_user_mgmt_bp.route('/users/<int:user_id>/send-reminder', methods=['POST'])
@jwt_required()
def send_reminder_to_user(user_id):
    """Send a reminder message to a user"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        reminder_type = data.get('type', 'general')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Here you would typically integrate with your email service
        # For now, we'll just log the reminder
        logger.info(f"Reminder sent to user {user.email}: {message}")
        
        # You can add email sending logic here
        # Example: send_email(user.email, "Reminder", message)
        
        return jsonify({
            'success': True,
            'message': f'Reminder sent successfully to {user.email}',
            'reminder_type': reminder_type
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending reminder: {e}")
        return jsonify({'error': 'Failed to send reminder'}), 500

@admin_user_mgmt_bp.route('/users/<int:user_id>/subscription-history', methods=['GET'])
@jwt_required()
def get_user_subscription_history(user_id):
    """Get subscription history for a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all subscriptions for the user
        subscriptions = UserSubscription.query.filter_by(
            user_id=user_id
        ).order_by(UserSubscription.created_at.desc()).all()
        
        subscription_history = []
        for sub in subscriptions:
            subscription_history.append({
                'id': sub.id,
                'plan_name': sub.plan_name,
                'status': sub.status.value,
                'start_date': sub.start_date.isoformat() if sub.start_date else None,
                'end_date': sub.end_date.isoformat() if sub.end_date else None,
                'trial_end': sub.trial_end.isoformat() if sub.trial_end else None,
                'created_at': sub.created_at.isoformat(),
                'admin_notes': sub.admin_notes,
                'created_by_admin': sub.created_by_admin
            })
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'current_subscription_status': get_user_subscription_status(user.id)
            },
            'subscription_history': subscription_history
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting subscription history: {e}")
        return jsonify({'error': 'Failed to get subscription history'}), 500

@admin_user_mgmt_bp.route('/users/extend-subscription', methods=['POST'])
@jwt_required()
def extend_user_subscription():
    """Extend an existing subscription"""
    try:
        data = request.get_json()
        
        if not data or 'subscription_id' not in data or 'extension_days' not in data:
            return jsonify({'error': 'Subscription ID and extension days are required'}), 400
        
        subscription_id = data['subscription_id']
        extension_days = data['extension_days']
        admin_notes = data.get('admin_notes', '')
        
        # Get subscription
        subscription = UserSubscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        # Extend the subscription
        if subscription.end_date:
            subscription.end_date = subscription.end_date + timedelta(days=extension_days)
        else:
            subscription.end_date = datetime.utcnow() + timedelta(days=extension_days)
        
        # Update admin notes
        if admin_notes:
            subscription.admin_notes = f"{subscription.admin_notes or ''}\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}: Extended by {extension_days} days - {admin_notes}"
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Subscription extended by {extension_days} days',
            'subscription': {
                'id': subscription.id,
                'new_end_date': subscription.end_date.isoformat(),
                'admin_notes': subscription.admin_notes
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error extending subscription: {e}")
        return jsonify({'error': 'Failed to extend subscription'}), 500

@admin_user_mgmt_bp.route('/users/available-plans', methods=['GET'])
@jwt_required()
def get_available_plans():
    """Get all available subscription plans for admin assignment"""
    try:
        plans = SubscriptionPlan.query.filter_by(is_active=True).all()
        
        available_plans = []
        for plan in plans:
            available_plans.append({
                'id': plan.id,
                'name': plan.name,
                'description': plan.description,
                'price': float(plan.price),
                'billing_cycle': plan.billing_cycle.value,
                'features': plan.features,
                'is_popular': plan.is_popular,
                'trial_days': plan.trial_days
            })
        
        return jsonify({
            'success': True,
            'plans': available_plans
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting available plans: {e}")
        return jsonify({'error': 'Failed to get plans'}), 500

@admin_user_mgmt_bp.route('/users/subscription-stats', methods=['GET'])
@jwt_required()
def get_subscription_statistics():
    """Get subscription statistics for admin dashboard"""
    try:
        # Get total users (including inactive ones)
        total_users = User.query.count()
        
        # Get active users (who have paid)
        active_users = User.query.filter_by(is_active=True).count()
        
        # Get inactive users (who haven't paid yet)
        inactive_users = User.query.filter_by(is_active=False).count()
        
        # Get users with active subscriptions
        active_subscriptions = UserSubscription.query.filter_by(
            status=SubscriptionStatus.ACTIVE
        ).count()
        
        # Get users with trial subscriptions
        trial_subscriptions = UserSubscription.query.filter_by(
            status=SubscriptionStatus.TRIAL
        ).count()
        
        # Get users with expired subscriptions
        expired_subscriptions = UserSubscription.query.filter_by(
            status=SubscriptionStatus.EXPIRED
        ).count()
        
        # Get users without any subscription (including inactive users)
        users_without_subscription = 0
        all_users = User.query.all()  # Include all users, not just active ones
        for user in all_users:
            if get_user_subscription_status(user.id) == 'no_subscription':
                users_without_subscription += 1
        
        # Get recent registrations (last 7 days) - include all users
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_registrations = User.query.filter(
            User.created_at >= week_ago
        ).count()
        
        # Calculate conversion rate based on total users
        conversion_rate = round((active_subscriptions + trial_subscriptions) / total_users * 100, 2) if total_users > 0 else 0
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'active_subscriptions': active_subscriptions,
                'trial_subscriptions': trial_subscriptions,
                'expired_subscriptions': expired_subscriptions,
                'users_without_subscription': users_without_subscription,
                'recent_registrations': recent_registrations,
                'conversion_rate': conversion_rate,
                'payment_pending_users': inactive_users  # Users who need to complete payment
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting subscription statistics: {e}")
        return jsonify({'error': 'Failed to get statistics'}), 500

@admin_user_mgmt_bp.route('/plans', methods=['GET'])
@jwt_required()
def get_all_plans():
    """Get all subscription plans for admin management"""
    try:
        plans = SubscriptionPlan.query.order_by(SubscriptionPlan.sort_order, SubscriptionPlan.name).all()
        
        available_plans = []
        for plan in plans:
            available_plans.append({
                'id': plan.id,
                'name': plan.name,
                'description': plan.description,
                'price': float(plan.price),
                'billing_cycle': plan.billing_cycle.value,
                'features': plan.features,
                'sidebar_components': plan.sidebar_components,
                'max_users': plan.max_users,
                'max_projects': plan.max_projects,
                'storage_limit': plan.storage_limit,
                'is_popular': plan.is_popular,
                'is_active': plan.is_active,
                'visible_to_regular_users': plan.visible_to_regular_users,
                'visible_to_admin_users': plan.visible_to_admin_users,
                'sort_order': plan.sort_order,
                'trial_days': plan.trial_days,
                'trial_price': float(plan.trial_price) if plan.trial_price else 0.0,
                'created_at': plan.created_at.isoformat() if plan.created_at else None,
                'updated_at': plan.updated_at.isoformat() if plan.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'plans': available_plans
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting all plans: {e}")
        return jsonify({'error': 'Failed to get plans'}), 500

@admin_user_mgmt_bp.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Create a new subscription plan"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'price' not in data:
            return jsonify({'error': 'Name and price are required'}), 400
        
        # Create new plan
        new_plan = SubscriptionPlan(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            billing_cycle=data.get('billing_cycle', 'MONTHLY'),
            features=data.get('features', []),
            sidebar_components=data.get('sidebar_components', []),
            max_users=data.get('max_users'),
            max_projects=data.get('max_projects'),
            storage_limit=data.get('storage_limit'),
            is_popular=data.get('is_popular', False),
            is_active=data.get('is_active', True),
            visible_to_regular_users=data.get('visible_to_regular_users', True),
            visible_to_admin_users=data.get('visible_to_admin_users', True),
            sort_order=data.get('sort_order', 0),
            trial_days=data.get('trial_days', 0),
            trial_price=float(data.get('trial_price', 0.0))
        )
        
        db.session.add(new_plan)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Plan "{new_plan.name}" created successfully',
            'plan': {
                'id': new_plan.id,
                'name': new_plan.name,
                'description': new_plan.description,
                'price': float(new_plan.price),
                'billing_cycle': new_plan.billing_cycle.value,
                'features': new_plan.features,
                'sidebar_components': new_plan.sidebar_components,
                'max_users': new_plan.max_users,
                'max_projects': new_plan.max_projects,
                'storage_limit': new_plan.storage_limit,
                'is_popular': new_plan.is_popular,
                'is_active': new_plan.is_active,
                'visible_to_regular_users': new_plan.visible_to_regular_users,
                'visible_to_admin_users': new_plan.visible_to_admin_users,
                'sort_order': new_plan.sort_order,
                'trial_days': new_plan.trial_days,
                'trial_price': float(new_plan.trial_price) if new_plan.trial_price else 0.0,
                'created_at': new_plan.created_at.isoformat() if new_plan.created_at else None,
                'updated_at': new_plan.updated_at.isoformat() if new_plan.updated_at else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating plan: {e}")
        return jsonify({'error': 'Failed to create plan'}), 500

@admin_user_mgmt_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Update an existing subscription plan"""
    try:
        data = request.get_json()
        
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Update plan fields
        if 'name' in data:
            plan.name = data['name']
        if 'description' in data:
            plan.description = data['description']
        if 'price' in data:
            plan.price = float(data['price'])
        if 'billing_cycle' in data:
            plan.billing_cycle = data['billing_cycle']
        if 'features' in data:
            plan.features = data['features']
        if 'sidebar_components' in data:
            plan.sidebar_components = data['sidebar_components']
        if 'max_users' in data:
            plan.max_users = data['max_users']
        if 'max_projects' in data:
            plan.max_projects = data['max_projects']
        if 'storage_limit' in data:
            plan.storage_limit = data['storage_limit']
        if 'is_popular' in data:
            plan.is_popular = data['is_popular']
        if 'is_active' in data:
            plan.is_active = data['is_active']
        if 'visible_to_regular_users' in data:
            plan.visible_to_regular_users = data['visible_to_regular_users']
        if 'visible_to_admin_users' in data:
            plan.visible_to_admin_users = data['visible_to_admin_users']
        if 'sort_order' in data:
            plan.sort_order = data['sort_order']
        if 'trial_days' in data:
            plan.trial_days = data['trial_days']
        if 'trial_price' in data:
            plan.trial_price = float(data['trial_price'])
        
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Plan "{plan.name}" updated successfully',
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'price': float(plan.price),
                'billing_cycle': plan.billing_cycle.value,
                'is_active': plan.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating plan: {e}")
        return jsonify({'error': 'Failed to update plan'}), 500

@admin_user_mgmt_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete a subscription plan"""
    try:
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Check if plan has active subscriptions
        active_subscriptions = UserSubscription.query.filter_by(
            plan_id=plan_id,
            status=SubscriptionStatus.ACTIVE
        ).count()
        
        if active_subscriptions > 0:
            return jsonify({
                'error': f'Cannot delete plan. {active_subscriptions} active subscriptions exist.'
            }), 400
        
        plan_name = plan.name
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Plan "{plan_name}" deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting plan: {e}")
        return jsonify({'error': 'Failed to delete plan'}), 500

@admin_user_mgmt_bp.route('/plans/<int:plan_id>/hide', methods=['POST'])
@jwt_required()
def hide_plan(plan_id):
    """Hide a subscription plan from regular users (soft delete)"""
    try:
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Hide the plan from regular users
        plan.visible_to_regular_users = False
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Plan "{plan.name}" is now hidden from regular users',
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'visible_to_regular_users': plan.visible_to_regular_users,
                'is_active': plan.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error hiding plan: {e}")
        return jsonify({'error': 'Failed to hide plan'}), 500

@admin_user_mgmt_bp.route('/plans/<int:plan_id>/show', methods=['POST'])
@jwt_required()
def show_plan(plan_id):
    """Show a subscription plan to regular users"""
    try:
        # Get plan
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Show the plan to regular users
        plan.visible_to_regular_users = True
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Plan "{plan.name}" is now visible to regular users',
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'visible_to_regular_users': plan.visible_to_regular_users,
                'is_active': plan.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error showing plan: {e}")
        return jsonify({'error': 'Failed to show plan'}), 500

@admin_user_mgmt_bp.route('/users/send-message', methods=['POST'])
@jwt_required()
def send_message_to_user():
    """Send a message to a specific user or all users"""
    try:
        data = request.get_json()
        
        if not data or 'subject' not in data or 'message' not in data:
            return jsonify({'error': 'Subject and message are required'}), 400
        
        user_id = data.get('user_id')
        subject = data['subject']
        message = data['message']
        send_to = data.get('send_to', 'selected')
        
        # For now, we'll just log the message (in a real app, you'd send email/notification)
        if user_id:
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            logger.info(f"Message sent to user {user.username} ({user.email}): {subject} - {message}")
        else:
            logger.info(f"Message sent to all users: {subject} - {message}")
        
        return jsonify({
            'success': True,
            'message': f'Message sent successfully to {user.username if user_id else "all users"}'
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return jsonify({'error': 'Failed to send message'}), 500

@admin_user_mgmt_bp.route('/users/export', methods=['GET'])
@jwt_required()
def export_users():
    """Export users data in various formats"""
    try:
        format_type = request.args.get('format', 'csv')
        
        # Get all users
        users = User.query.all()
        
        if format_type == 'csv':
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone', 'Country', 'Status', 'Subscription', 'Created At', 'Last Login'])
            
            # Write data
            for user in users:
                writer.writerow([
                    user.id,
                    user.username,
                    user.email,
                    user.first_name or '',
                    user.last_name or '',
                    user.phone or '',
                    user.country or '',
                    'Active' if user.is_active else 'Inactive',
                    user.subscription_status or 'free',
                    user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',
                    user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else ''
                ])
            
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; filename=users-export-{datetime.utcnow().strftime("%Y%m%d")}.csv'}
            )
            
        elif format_type == 'json':
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'country': user.country,
                    'is_active': user.is_active,
                    'subscription_status': user.subscription_status,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                })
            
            return jsonify({
                'success': True,
                'users': users_data,
                'exported_at': datetime.utcnow().isoformat(),
                'total_users': len(users_data)
            }), 200
            
        elif format_type == 'xlsx':
            try:
                import pandas as pd
                from io import BytesIO
                
                # Create DataFrame
                data = []
                for user in users:
                    data.append({
                        'ID': user.id,
                        'Username': user.username,
                        'Email': user.email,
                        'First Name': user.first_name or '',
                        'Last Name': user.last_name or '',
                        'Phone': user.phone or '',
                        'Country': user.country or '',
                        'Status': 'Active' if user.is_active else 'Inactive',
                        'Subscription': user.subscription_status or 'free',
                        'Created At': user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',
                        'Last Login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else ''
                    })
                
                df = pd.DataFrame(data)
                
                # Create Excel file
                output = BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, sheet_name='Users', index=False)
                
                output.seek(0)
                return Response(
                    output.getvalue(),
                    mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={'Content-Disposition': f'attachment; filename=users-export-{datetime.utcnow().strftime("%Y%m%d")}.xlsx'}
                )
                
            except ImportError:
                return jsonify({'error': 'pandas and openpyxl are required for Excel export'}), 500
        
        else:
            return jsonify({'error': 'Unsupported format. Use csv, json, or xlsx'}), 400
        
    except Exception as e:
        logger.error(f"Error exporting users: {e}")
        return jsonify({'error': 'Failed to export users'}), 500

@admin_user_mgmt_bp.route('/users/bulk-action', methods=['POST'])
@jwt_required()
def bulk_action_users():
    """Perform bulk actions on multiple users"""
    try:
        data = request.get_json()
        
        if not data or 'user_ids' not in data or 'action' not in data:
            return jsonify({'error': 'User IDs and action are required'}), 400
        
        user_ids = data['user_ids']
        action = data['action']
        
        if not isinstance(user_ids, list) or len(user_ids) == 0:
            return jsonify({'error': 'User IDs must be a non-empty list'}), 400
        
        # Get current admin user
        current_admin_id = get_jwt_identity()
        from ..models.rbac import AdminUser
        current_admin = AdminUser.query.get(current_admin_id)
        
        if not current_admin:
            return jsonify({'error': 'Admin user not found'}), 404
        
        # For delete action, require super admin privileges and password confirmation
        if action == 'delete':
            # Check if user is super admin
            if not current_admin.is_super_admin:
                return jsonify({
                    'error': 'Access denied. Only super administrators can perform bulk user deletions.',
                    'requires_super_admin': True
                }), 403
            
            # Check for password confirmation
            if 'password' not in data:
                return jsonify({
                    'error': 'Password confirmation is required for bulk delete operations',
                    'requires_password': True
                }), 400
            
            # Verify password
            if not current_admin.check_password(data['password']):
                return jsonify({
                    'error': 'Invalid password. Please provide your correct password to confirm this action.',
                    'requires_password': True
                }), 401
            
            # Log the bulk delete action for security
            logger.warning(f"BULK DELETE ATTEMPT: Super admin {current_admin.username} (ID: {current_admin.id}) attempting to delete {len(user_ids)} users")
        
        # Get users
        users = User.query.filter(User.id.in_(user_ids)).all()
        
        # Check which users were found and which were not
        found_user_ids = [user.id for user in users]
        missing_user_ids = [uid for uid in user_ids if uid not in found_user_ids]
        
        if missing_user_ids:
            logger.warning(f"Some user IDs not found: {missing_user_ids}")
            # Continue with the users that were found instead of failing completely
        
        success_count = 0
        
        for user in users:
            try:
                if action == 'activate':
                    user.is_active = True
                    user.subscription_status = 'active'
                    success_count += 1
                    logger.info(f"Activated user: {user.username} (ID: {user.id})")
                elif action == 'deactivate':
                    user.is_active = False
                    user.subscription_status = 'inactive'
                    success_count += 1
                    logger.info(f"Deactivated user: {user.username} (ID: {user.id})")
                elif action == 'delete':
                    # Safety check - prevent deleting admin users
                    if user.is_admin:
                        logger.warning(f"Skipping admin user deletion: {user.username} (ID: {user.id})")
                        continue
                    
                    # Hard delete - handle all related data first
                    username = user.username
                    user_id = user.id
                    
                    try:
                        # Delete related records manually to avoid foreign key constraint issues
                        # Use try/except for each model to handle import issues gracefully
                        
                        # Delete subscriptions
                        try:
                            from ..models.user_subscription import UserSubscription
                            UserSubscription.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete subscriptions for user {user_id}: {e}")
                        
                        # Delete profile
                        try:
                            from ..models.user_profile import UserProfile
                            UserProfile.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete profile for user {user_id}: {e}")
                        
                        # Delete user journals
                        try:
                            from ..models.user_journal import UserJournal
                            UserJournal.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete user journals for user {user_id}: {e}")
                        
                        # Delete journal entries
                        try:
                            from ..models.journal import JournalEntry
                            JournalEntry.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete journal entries for user {user_id}: {e}")
                        
                        # Delete journal tags
                        try:
                            from ..models.journal import JournalTag
                            JournalTag.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete journal tags for user {user_id}: {e}")
                        
                        # Delete strategies
                        try:
                            from ..models.strategy import Strategy
                            Strategy.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete strategies for user {user_id}: {e}")
                        
                        # Delete portfolios
                        try:
                            from ..models.portfolio import Portfolio
                            Portfolio.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete portfolios for user {user_id}: {e}")
                        
                        # Delete support tickets
                        try:
                            from ..models.support import SupportTicket
                            SupportTicket.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete support tickets for user {user_id}: {e}")
                        
                        # Delete activity logs
                        try:
                            from ..models.activity import ActivityLog
                            ActivityLog.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete activity logs for user {user_id}: {e}")
                        
                        # Delete messages
                        try:
                            from ..models.communication import Message
                            Message.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete messages for user {user_id}: {e}")
                        
                        # Delete notifications
                        try:
                            from ..models.communication import Notification
                            Notification.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete notifications for user {user_id}: {e}")
                        
                        # Delete role assignments
                        try:
                            from ..models.rbac import UserRoleAssignment
                            UserRoleAssignment.query.filter_by(user_id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete role assignments for user {user_id}: {e}")
                        
                        # Now delete the user using raw SQL to ensure it works
                        db.session.execute(db.text(f"DELETE FROM users WHERE id = {user_id}"))
                        success_count += 1
                        logger.info(f"Deleted user: {username} (ID: {user_id})")
                        
                    except Exception as e:
                        logger.error(f"Error deleting user {user_id}: {e}")
                        continue
                else:
                    return jsonify({'error': f'Unsupported action: {action}'}), 400
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}")
                continue
        
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': f'Bulk action "{action}" completed successfully for {success_count} users',
            'processed_count': success_count,
            'total_count': len(user_ids)
        }
        
        # Add information about missing users if any
        if missing_user_ids:
            response_data['missing_users'] = missing_user_ids
            response_data['message'] += f' ({len(missing_user_ids)} users not found)'
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error performing bulk action: {e}")
        return jsonify({'error': 'Failed to perform bulk action'}), 500

@admin_user_mgmt_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    """Update user subscription status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data or 'subscription_status' not in data:
            return jsonify({'error': 'subscription_status is required'}), 400
        
        subscription_status = data['subscription_status']
        
        # Validate status
        valid_statuses = ['free', 'pending', 'active', 'trial', 'expired', 'cancelled']
        if subscription_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Update status
        user.subscription_status = subscription_status
        
        # If setting to active, also activate the user account
        if subscription_status == 'active':
            user.is_active = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'User status updated to {subscription_status}',
            'user': {
                'id': user.id,
                'username': user.username,
                'subscription_status': user.subscription_status,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user status: {e}")
        return jsonify({'error': 'Failed to update user status'}), 500

@admin_user_mgmt_bp.route('/subscriptions/update-expired', methods=['POST'])
@jwt_required()
def update_expired_subscriptions():
    """Update all expired subscriptions to EXPIRED status"""
    try:
        from ..services.subscription_service import SubscriptionService
        
        updated_count = SubscriptionService.update_expired_subscriptions()
        
        return jsonify({
            'success': True,
            'message': f'Updated {updated_count} expired subscriptions',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating expired subscriptions: {e}")
        return jsonify({'error': 'Failed to update expired subscriptions'}), 500

@admin_user_mgmt_bp.route('/subscriptions/expiring-soon', methods=['GET'])
@jwt_required()
def get_expiring_soon_subscriptions():
    """Get subscriptions that will expire within the specified days"""
    try:
        from ..services.subscription_service import SubscriptionService
        
        days_threshold = request.args.get('days', 7, type=int)
        expiring_subscriptions = SubscriptionService.get_expiring_soon_subscriptions(days_threshold)
        
        subscription_data = []
        for sub in expiring_subscriptions:
            user = User.query.get(sub.user_id)
            subscription_data.append({
                'subscription_id': sub.id,
                'user_id': sub.user_id,
                'user_email': user.email if user else 'Unknown',
                'user_name': f"{user.first_name} {user.last_name}" if user and user.first_name else user.username if user else 'Unknown',
                'plan_name': sub.plan_name,
                'end_date': sub.end_date.isoformat() if sub.end_date else None,
                'days_remaining': (sub.end_date - datetime.utcnow()).days if sub.end_date else None
            })
        
        return jsonify({
            'success': True,
            'subscriptions': subscription_data,
            'total': len(subscription_data),
            'days_threshold': days_threshold
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting expiring subscriptions: {e}")
        return jsonify({'error': 'Failed to get expiring subscriptions'}), 500

@admin_user_mgmt_bp.route('/subscriptions/summary', methods=['GET'])
@jwt_required()
def get_subscription_summary():
    """Get subscription summary statistics"""
    try:
        from ..services.subscription_service import SubscriptionService
        
        summary = SubscriptionService.get_subscription_summary()
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting subscription summary: {e}")
        return jsonify({'error': 'Failed to get subscription summary'}), 500
