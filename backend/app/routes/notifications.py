"""
Enhanced Notifications API Routes
Handles all notification-related endpoints for the ticket system
"""

from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime, timedelta
import logging

from ..models.communication import (
    Notification, NotificationTemplate, NotificationType, NotificationPriority, 
    NotificationStatus, CommunicationPreference
)
from ..models.rbac import AdminUser
from ..models.user import User
from ..services.ticket_notification_service import ticket_notification_service
from .. import db

logger = logging.getLogger(__name__)

# Create blueprint
notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user's notifications with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        notification_type = request.args.get('type')
        status = request.args.get('status')
        priority = request.args.get('priority')
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query
        query = Notification.query.filter_by(user_id=current_user_id)
        
        # Apply filters
        if notification_type:
            query = query.filter(Notification.type == notification_type)
        
        if status:
            query = query.filter(Notification.status == status)
        
        if priority:
            query = query.filter(Notification.priority == priority)
        
        if unread_only:
            query = query.filter(Notification.status == NotificationStatus.PENDING)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        notifications = [notification.to_dict() for notification in pagination.items]
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get notifications'}), 500


@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        current_user_id = get_jwt_identity()
        
        # Count unread notifications
        unread_count = Notification.query.filter_by(
            user_id=current_user_id,
            status=NotificationStatus.PENDING
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get unread count'}), 500


@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        current_user_id = get_jwt_identity()
        
        success = ticket_notification_service.mark_notification_read(
            notification_id, current_user_id
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notification marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Notification not found or already read'
            }), 404
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to mark notification as read'}), 500


@notifications_bp.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all user notifications as read"""
    try:
        current_user_id = get_jwt_identity()
        
        success = ticket_notification_service.mark_all_notifications_read(current_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'All notifications marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to mark notifications as read'
            }), 500
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to mark all notifications as read'}), 500


@notifications_bp.route('/notifications/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        current_user_id = get_jwt_identity()
        
        preferences = CommunicationPreference.query.filter_by(user_id=current_user_id).first()
        
        if not preferences:
            # Create default preferences
            preferences = CommunicationPreference(user_id=current_user_id)
            db.session.add(preferences)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'preferences': {
                'email_enabled': preferences.email_enabled,
                'email_frequency': preferences.email_frequency,
                'email_categories': preferences.email_categories,
                'sms_enabled': preferences.sms_enabled,
                'sms_frequency': preferences.sms_frequency,
                'sms_categories': preferences.sms_categories,
                'push_enabled': preferences.push_enabled,
                'push_categories': preferences.push_categories,
                'in_app_enabled': preferences.in_app_enabled,
                'in_app_categories': preferences.in_app_categories,
                'marketing_emails': preferences.marketing_emails,
                'marketing_sms': preferences.marketing_sms,
                'marketing_push': preferences.marketing_push,
                'quiet_hours_enabled': preferences.quiet_hours_enabled,
                'quiet_hours_start': preferences.quiet_hours_start,
                'quiet_hours_end': preferences.quiet_hours_end,
                'quiet_hours_timezone': preferences.quiet_hours_timezone,
                'preferred_language': preferences.preferred_language,
                'date_format': preferences.date_format,
                'time_format': preferences.time_format
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get notification preferences'}), 500


@notifications_bp.route('/notifications/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Update user's notification preferences"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        preferences = CommunicationPreference.query.filter_by(user_id=current_user_id).first()
        
        if not preferences:
            preferences = CommunicationPreference(user_id=current_user_id)
            db.session.add(preferences)
        
        # Update preferences
        if 'email_enabled' in data:
            preferences.email_enabled = data['email_enabled']
        if 'email_frequency' in data:
            preferences.email_frequency = data['email_frequency']
        if 'email_categories' in data:
            preferences.email_categories = data['email_categories']
        
        if 'sms_enabled' in data:
            preferences.sms_enabled = data['sms_enabled']
        if 'sms_frequency' in data:
            preferences.sms_frequency = data['sms_frequency']
        if 'sms_categories' in data:
            preferences.sms_categories = data['sms_categories']
        
        if 'push_enabled' in data:
            preferences.push_enabled = data['push_enabled']
        if 'push_categories' in data:
            preferences.push_categories = data['push_categories']
        
        if 'in_app_enabled' in data:
            preferences.in_app_enabled = data['in_app_enabled']
        if 'in_app_categories' in data:
            preferences.in_app_categories = data['in_app_categories']
        
        if 'marketing_emails' in data:
            preferences.marketing_emails = data['marketing_emails']
        if 'marketing_sms' in data:
            preferences.marketing_sms = data['marketing_sms']
        if 'marketing_push' in data:
            preferences.marketing_push = data['marketing_push']
        
        if 'quiet_hours_enabled' in data:
            preferences.quiet_hours_enabled = data['quiet_hours_enabled']
        if 'quiet_hours_start' in data:
            preferences.quiet_hours_start = data['quiet_hours_start']
        if 'quiet_hours_end' in data:
            preferences.quiet_hours_end = data['quiet_hours_end']
        if 'quiet_hours_timezone' in data:
            preferences.quiet_hours_timezone = data['quiet_hours_timezone']
        
        if 'preferred_language' in data:
            preferences.preferred_language = data['preferred_language']
        if 'date_format' in data:
            preferences.date_format = data['date_format']
        if 'time_format' in data:
            preferences.time_format = data['time_format']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification preferences updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update notification preferences'}), 500


@notifications_bp.route('/notifications/test', methods=['POST'])
@jwt_required()
def test_notification():
    """Send a test notification to the current user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        notification_type = data.get('type', 'in_app')
        title = data.get('title', 'Test Notification')
        message = data.get('message', 'This is a test notification')
        
        # Create test notification
        notification = Notification(
            user_id=current_user_id,
            type=NotificationType(notification_type),
            priority=NotificationPriority.NORMAL,
            title=title,
            message=message,
            status=NotificationStatus.PENDING
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Test notification sent successfully',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to send test notification'}), 500


@notifications_bp.route('/notifications/clear', methods=['POST'])
@jwt_required()
def clear_notifications():
    """Clear all user notifications"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get filter options
        notification_type = data.get('type')
        status = data.get('status')
        
        query = Notification.query.filter_by(user_id=current_user_id)
        
        if notification_type:
            query = query.filter(Notification.type == notification_type)
        
        if status:
            query = query.filter(Notification.status == status)
        
        # Delete notifications
        deleted_count = query.delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Cleared {deleted_count} notifications',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error clearing notifications: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to clear notifications'}), 500


@notifications_bp.route('/notifications/stats', methods=['GET'])
@jwt_required()
def get_notification_stats():
    """Get notification statistics for the user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get counts by type
        email_count = Notification.query.filter_by(
            user_id=current_user_id,
            type=NotificationType.EMAIL
        ).count()
        
        sms_count = Notification.query.filter_by(
            user_id=current_user_id,
            type=NotificationType.SMS
        ).count()
        
        push_count = Notification.query.filter_by(
            user_id=current_user_id,
            type=NotificationType.PUSH
        ).count()
        
        in_app_count = Notification.query.filter_by(
            user_id=current_user_id,
            type=NotificationType.IN_APP
        ).count()
        
        # Get counts by status
        pending_count = Notification.query.filter_by(
            user_id=current_user_id,
            status=NotificationStatus.PENDING
        ).count()
        
        delivered_count = Notification.query.filter_by(
            user_id=current_user_id,
            status=NotificationStatus.DELIVERED
        ).count()
        
        failed_count = Notification.query.filter_by(
            user_id=current_user_id,
            status=NotificationStatus.FAILED
        ).count()
        
        # Get counts by priority
        high_priority_count = Notification.query.filter_by(
            user_id=current_user_id,
            priority=NotificationPriority.HIGH
        ).count()
        
        normal_priority_count = Notification.query.filter_by(
            user_id=current_user_id,
            priority=NotificationPriority.NORMAL
        ).count()
        
        low_priority_count = Notification.query.filter_by(
            user_id=current_user_id,
            priority=NotificationPriority.LOW
        ).count()
        
        # Get recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = Notification.query.filter(
            Notification.user_id == current_user_id,
            Notification.created_at >= week_ago
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'by_type': {
                    'email': email_count,
                    'sms': sms_count,
                    'push': push_count,
                    'in_app': in_app_count
                },
                'by_status': {
                    'pending': pending_count,
                    'delivered': delivered_count,
                    'failed': failed_count
                },
                'by_priority': {
                    'high': high_priority_count,
                    'normal': normal_priority_count,
                    'low': low_priority_count
                },
                'recent_activity': {
                    'last_7_days': recent_count
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get notification stats'}), 500
