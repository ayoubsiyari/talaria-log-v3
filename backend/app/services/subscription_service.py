"""
Subscription Service for managing subscription lifecycle and expiration
"""

from datetime import datetime, timedelta
from ..models.user_subscription import UserSubscription, SubscriptionStatus
from ..models.subscription import SubscriptionPlan, BillingCycle
from ..models.user import User
from .. import db
import logging

logger = logging.getLogger(__name__)

class SubscriptionService:
    """Service for managing subscription lifecycle and expiration"""
    
    @staticmethod
    def get_active_plans():
        """Get all active subscription plans"""
        try:
            return SubscriptionPlan.query.filter_by(is_active=True).order_by(SubscriptionPlan.sort_order).all()
        except Exception as e:
            logger.error(f"Error getting active plans: {e}")
            return []
    
    @staticmethod
    def get_plan_by_id(plan_id):
        """Get a subscription plan by ID"""
        try:
            return SubscriptionPlan.query.get(plan_id)
        except Exception as e:
            logger.error(f"Error getting plan {plan_id}: {e}")
            return None
    
    @staticmethod
    def create_subscription_plan(data):
        """Create a new subscription plan"""
        try:
            # Validate billing cycle
            billing_cycle = data.get('billing_cycle', 'monthly')
            if billing_cycle not in [bc.value for bc in BillingCycle]:
                raise ValueError(f"Invalid billing cycle: {billing_cycle}")
            
            # Create new plan
            plan = SubscriptionPlan(
                name=data['name'],
                description=data.get('description', ''),
                price=float(data['price']),
                billing_cycle=BillingCycle(billing_cycle),
                features=data.get('features', []),
                sidebar_components=data.get('sidebar_components', []),
                max_users=data.get('max_users'),
                max_projects=data.get('max_projects'),
                storage_limit=data.get('storage_limit'),
                trial_days=data.get('trial_days', 0),
                trial_price=data.get('trial_price', 0.0),
                is_active=data.get('is_active', True),
                is_popular=data.get('is_popular', False),
                visible_to_regular_users=data.get('visible_to_regular_users', True),
                visible_to_admin_users=data.get('visible_to_admin_users', True),
                sort_order=data.get('sort_order', 0)
            )
            
            db.session.add(plan)
            db.session.commit()
            
            logger.info(f"Created subscription plan: {plan.name}")
            return plan
            
        except Exception as e:
            logger.error(f"Error creating subscription plan: {e}")
            db.session.rollback()
            raise e
    
    @staticmethod
    def update_subscription_plan(plan_id, data):
        """Update an existing subscription plan"""
        try:
            plan = SubscriptionPlan.query.get(plan_id)
            if not plan:
                raise ValueError("Plan not found")
            
            # Update fields
            if 'name' in data:
                plan.name = data['name']
            if 'description' in data:
                plan.description = data['description']
            if 'price' in data:
                plan.price = float(data['price'])
            if 'billing_cycle' in data:
                billing_cycle = data['billing_cycle']
                if billing_cycle not in [bc.value for bc in BillingCycle]:
                    raise ValueError(f"Invalid billing cycle: {billing_cycle}")
                plan.billing_cycle = BillingCycle(billing_cycle)
            if 'features' in data:
                plan.features = data['features']
            if 'max_users' in data:
                plan.max_users = data['max_users']
            if 'max_projects' in data:
                plan.max_projects = data['max_projects']
            if 'storage_limit' in data:
                plan.storage_limit = data['storage_limit']
            if 'trial_days' in data:
                plan.trial_days = data['trial_days']
            if 'trial_price' in data:
                plan.trial_price = data['trial_price']
            if 'is_active' in data:
                plan.is_active = data['is_active']
            if 'is_popular' in data:
                plan.is_popular = data['is_popular']
            if 'sort_order' in data:
                plan.sort_order = data['sort_order']
            
            plan.updated_at = datetime.utcnow()
            db.session.commit()
            
            logger.info(f"Updated subscription plan: {plan.name}")
            return plan
            
        except Exception as e:
            logger.error(f"Error updating subscription plan {plan_id}: {e}")
            db.session.rollback()
            raise e
    
    @staticmethod
    def delete_subscription_plan(plan_id):
        """Delete a subscription plan"""
        try:
            plan = SubscriptionPlan.query.get(plan_id)
            if not plan:
                raise ValueError("Plan not found")
            
            # Check if plan has active subscriptions
            active_subscriptions = UserSubscription.query.filter_by(
                plan_id=plan_id,
                status=SubscriptionStatus.ACTIVE
            ).count()
            
            if active_subscriptions > 0:
                raise ValueError(f"Cannot delete plan with {active_subscriptions} active subscriptions")
            
            db.session.delete(plan)
            db.session.commit()
            
            logger.info(f"Deleted subscription plan: {plan.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting subscription plan {plan_id}: {e}")
            db.session.rollback()
            raise e
    
    @staticmethod
    def update_expired_subscriptions():
        """Update all expired subscriptions to EXPIRED status"""
        try:
            # Find all active subscriptions that have expired
            expired_subscriptions = UserSubscription.query.filter(
                UserSubscription.status == SubscriptionStatus.ACTIVE,
                UserSubscription.end_date < datetime.utcnow()
            ).all()
            
            updated_count = 0
            for subscription in expired_subscriptions:
                # Update subscription status
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.updated_at = datetime.utcnow()
                
                # Update user subscription status
                user = User.query.get(subscription.user_id)
                if user:
                    user.subscription_status = 'expired'
                    user.updated_at = datetime.utcnow()
                
                updated_count += 1
                logger.info(f"Marked subscription {subscription.id} as expired for user {subscription.user_id}")
            
            if updated_count > 0:
                db.session.commit()
                logger.info(f"Updated {updated_count} expired subscriptions")
            
            return updated_count
            
        except Exception as e:
            logger.error(f"Error updating expired subscriptions: {e}")
            db.session.rollback()
            return 0
    
    @staticmethod
    def check_and_update_subscription_status(subscription_id):
        """Check and update a specific subscription's status based on expiration"""
        try:
            subscription = UserSubscription.query.get(subscription_id)
            if not subscription:
                return False, "Subscription not found"
            
            # Check if subscription has expired
            if subscription.end_date and datetime.utcnow() > subscription.end_date:
                if subscription.status != SubscriptionStatus.EXPIRED:
                    subscription.status = SubscriptionStatus.EXPIRED
                    subscription.updated_at = datetime.utcnow()
                    
                    # Update user subscription status
                    user = User.query.get(subscription.user_id)
                    if user:
                        user.subscription_status = 'expired'
                        user.updated_at = datetime.utcnow()
                    
                    db.session.commit()
                    logger.info(f"Updated subscription {subscription_id} to expired status")
                    return True, "Subscription marked as expired"
            
            return True, "Subscription status is current"
            
        except Exception as e:
            logger.error(f"Error checking subscription {subscription_id}: {e}")
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def get_subscription_status(user_id):
        """Get current subscription status for a user with expiration check"""
        try:
            subscription = UserSubscription.query.filter_by(
                user_id=user_id
            ).order_by(UserSubscription.created_at.desc()).first()
            
            if not subscription:
                return 'no_subscription'
            
            # Check if subscription has expired
            if subscription.end_date and datetime.utcnow() > subscription.end_date:
                if subscription.status != SubscriptionStatus.EXPIRED:
                    # Update to expired status
                    subscription.status = SubscriptionStatus.EXPIRED
                    subscription.updated_at = datetime.utcnow()
                    
                    # Update user status
                    user = User.query.get(user_id)
                    if user:
                        user.subscription_status = 'expired'
                        user.updated_at = datetime.utcnow()
                    
                    db.session.commit()
                    return 'expired'
            
            return subscription.status.value
            
        except Exception as e:
            logger.error(f"Error getting subscription status for user {user_id}: {e}")
            return 'error'
    
    @staticmethod
    def get_expiring_soon_subscriptions(days_threshold=7):
        """Get subscriptions that will expire within the specified days"""
        try:
            threshold_date = datetime.utcnow() + timedelta(days=days_threshold)
            
            expiring_subscriptions = UserSubscription.query.filter(
                UserSubscription.status == SubscriptionStatus.ACTIVE,
                UserSubscription.end_date <= threshold_date,
                UserSubscription.end_date > datetime.utcnow()
            ).all()
            
            return expiring_subscriptions
            
        except Exception as e:
            logger.error(f"Error getting expiring subscriptions: {e}")
            return []
    
    @staticmethod
    def extend_subscription(subscription_id, extension_days, admin_notes=None):
        """Extend a subscription by the specified number of days"""
        try:
            subscription = UserSubscription.query.get(subscription_id)
            if not subscription:
                return False, "Subscription not found"
            
            # Calculate new end date
            if subscription.end_date:
                new_end_date = subscription.end_date + timedelta(days=extension_days)
            else:
                new_end_date = datetime.utcnow() + timedelta(days=extension_days)
            
            # Update subscription
            subscription.end_date = new_end_date
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.updated_at = datetime.utcnow()
            
            # Update admin notes
            if admin_notes:
                current_notes = subscription.admin_notes or ""
                timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                subscription.admin_notes = f"{current_notes}\n{timestamp}: Extended by {extension_days} days - {admin_notes}"
            
            # Update user status
            user = User.query.get(subscription.user_id)
            if user:
                user.subscription_status = 'active'
                user.is_active = True
                user.updated_at = datetime.utcnow()
            
            db.session.commit()
            logger.info(f"Extended subscription {subscription_id} by {extension_days} days")
            return True, f"Subscription extended by {extension_days} days"
            
        except Exception as e:
            logger.error(f"Error extending subscription {subscription_id}: {e}")
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def get_user_subscription(user_id):
        """Get user's current active subscription"""
        try:
            # Get the most recent subscription for the user
            subscription = UserSubscription.query.filter_by(
                user_id=user_id
            ).order_by(UserSubscription.created_at.desc()).first()
            
            if not subscription:
                return None
            
            # Check if subscription has expired
            if subscription.end_date and datetime.utcnow() > subscription.end_date:
                if subscription.status != SubscriptionStatus.EXPIRED:
                    # Update to expired status
                    subscription.status = SubscriptionStatus.EXPIRED
                    subscription.updated_at = datetime.utcnow()
                    
                    # Update user status
                    user = User.query.get(user_id)
                    if user:
                        user.subscription_status = 'expired'
                        user.updated_at = datetime.utcnow()
                    
                    db.session.commit()
                    return None  # Return None for expired subscriptions
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error getting user subscription for user {user_id}: {e}")
            return None
    
    @staticmethod
    def get_subscription_summary():
        """Get summary of subscription statuses"""
        try:
            total_subscriptions = UserSubscription.query.count()
            active_subscriptions = UserSubscription.query.filter_by(
                status=SubscriptionStatus.ACTIVE
            ).count()
            expired_subscriptions = UserSubscription.query.filter_by(
                status=SubscriptionStatus.EXPIRED
            ).count()
            trial_subscriptions = UserSubscription.query.filter_by(
                status=SubscriptionStatus.TRIAL
            ).count()
            
            # Count subscriptions expiring soon (next 7 days)
            expiring_soon = len(SubscriptionService.get_expiring_soon_subscriptions(7))
            
            return {
                'total_subscriptions': total_subscriptions,
                'active_subscriptions': active_subscriptions,
                'expired_subscriptions': expired_subscriptions,
                'trial_subscriptions': trial_subscriptions,
                'expiring_soon': expiring_soon
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription summary: {e}")
            return {}
