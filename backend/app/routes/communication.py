from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, timedelta
import json

from .. import db
from ..models.communication import (
    Notification, NotificationTemplate, Announcement, AnnouncementView, 
    Message, CommunicationPreference, NotificationType, NotificationPriority, 
    NotificationStatus, AnnouncementType, MessageType
)
from ..models.user import User
from ..models.rbac import AdminUser
from ..services.security_service import SecurityService
from ..services.audit_service import AuditService
from ..middleware.rbac_middleware import admin_required
from ..services.rate_limit_service import rate_limit_admin

# Initialize services
security_service = SecurityService()
audit_service = AuditService()

communication_bp = Blueprint('communication', __name__)


# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/notifications', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_notifications():
    """Get all notifications with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        notification_type = request.args.get('type')
        priority = request.args.get('priority')
        user_id = request.args.get('user_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Notification.query
        
        # Apply filters
        if status:
            query = query.filter(Notification.status == NotificationStatus(status))
        if notification_type:
            query = query.filter(Notification.type == NotificationType(notification_type))
        if priority:
            query = query.filter(Notification.priority == NotificationPriority(priority))
        if user_id:
            query = query.filter(Notification.user_id == user_id)
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Notification.created_at >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format'}), 400
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Notification.created_at <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format'}), 400
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Prepare response
        notifications = []
        for notification in pagination.items:
            notification_data = notification.to_dict()
            # Add user information
            if notification.user:
                notification_data['user'] = {
                    'id': notification.user.id,
                    'username': notification.user.username,
                    'email': notification.user.email,
                    'full_name': notification.user.full_name
                }
            # Add admin information
            if notification.admin_user:
                notification_data['admin_user'] = {
                    'id': notification.admin_user.id,
                    'username': notification.admin_user.username,
                    'full_name': notification.admin_user.full_name
                }
            notifications.append(notification_data)
        
        return jsonify({
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
        current_app.logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/notifications/<int:notification_id>', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_notification(notification_id):
    """Get specific notification details"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        notification_data = notification.to_dict()
        
        # Add user information
        if notification.user:
            notification_data['user'] = {
                'id': notification.user.id,
                'username': notification.user.username,
                'email': notification.user.email,
                'full_name': notification.user.full_name
            }
        
        # Add admin information
        if notification.admin_user:
            notification_data['admin_user'] = {
                'id': notification.admin_user.id,
                'username': notification.admin_user.username,
                'full_name': notification.admin_user.full_name
            }
        
        return jsonify(notification_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting notification {notification_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/notifications', methods=['POST'])
@jwt_required()
@admin_required
@rate_limit_admin
def create_notification():
    """Create a new notification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate notification type
        try:
            notification_type = NotificationType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid notification type'}), 400
        
        # Validate priority
        priority = NotificationPriority.NORMAL
        if 'priority' in data:
            try:
                priority = NotificationPriority(data['priority'])
            except ValueError:
                return jsonify({'error': 'Invalid priority'}), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get admin user ID from JWT
        admin_user_id = get_jwt_identity()
        
        # Create notification
        notification = Notification(
            user_id=data['user_id'],
            admin_user_id=admin_user_id,
            type=notification_type,
            priority=priority,
            title=data['title'],
            message=data['message'],
            template_id=data.get('template_id'),
            scheduled_at=datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00')) if data.get('scheduled_at') else None,
            metadata=data.get('metadata'),
            recipient_data=data.get('recipient_data')
        )
        
        db.session.add(notification)
        db.session.commit()
        
        # Log the action
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='create_notification',
            target_type='notification',
            target_id=str(notification.id),
            details=f"Created notification for user {data['user_id']}"
        )
        
        return jsonify({
            'message': 'Notification created successfully',
            'notification': notification.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating notification: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/notifications/<int:notification_id>/retry', methods=['POST'])
@jwt_required()
@admin_required
@rate_limit_admin
def retry_notification(notification_id):
    """Retry a failed notification"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        if not notification.can_retry:
            return jsonify({'error': 'Notification cannot be retried'}), 400
        
        # Reset notification for retry
        notification.status = NotificationStatus.PENDING
        notification.attempt_count = 0
        notification.error_message = None
        notification.failed_at = None
        
        db.session.commit()
        
        # Log the action
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='retry_notification',
            target_type='notification',
            target_id=str(notification_id),
            details=f"Retried notification for user {notification.user_id}"
        )
        
        return jsonify({
            'message': 'Notification queued for retry',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error retrying notification {notification_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
@admin_required
@rate_limit_admin
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        # Only allow deletion of pending or failed notifications
        if notification.status not in [NotificationStatus.PENDING, NotificationStatus.FAILED]:
            return jsonify({'error': 'Cannot delete sent notifications'}), 400
        
        db.session.delete(notification)
        db.session.commit()
        
        # Log the action
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='delete_notification',
            target_type='notification',
            target_id=str(notification_id),
            details=f"Deleted notification for user {notification.user_id}"
        )
        
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting notification {notification_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# NOTIFICATION TEMPLATE ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/notification-templates', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_notification_templates():
    """Get all notification templates"""
    try:
        templates = NotificationTemplate.query.filter_by(is_active=True).all()
        
        return jsonify({
            'templates': [template.to_dict() for template in templates]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting notification templates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/notification-templates', methods=['POST'])
@jwt_required()
@admin_required
@rate_limit_admin
def create_notification_template():
    """Create a new notification template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'title_template', 'message_template']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate notification type
        try:
            notification_type = NotificationType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid notification type'}), 400
        
        # Check if template name already exists
        existing_template = NotificationTemplate.query.filter_by(name=data['name']).first()
        if existing_template:
            return jsonify({'error': 'Template name already exists'}), 400
        
        # Get admin user ID from JWT
        admin_user_id = get_jwt_identity()
        
        # Create template
        template = NotificationTemplate(
            name=data['name'],
            type=notification_type,
            title_template=data['title_template'],
            message_template=data['message_template'],
            subject_template=data.get('subject_template'),
            priority=NotificationPriority(data.get('priority', 'normal')),
            max_attempts=data.get('max_attempts', 3),
            variables=data.get('variables'),
            default_metadata=data.get('default_metadata'),
            created_by=admin_user_id
        )
        
        db.session.add(template)
        db.session.commit()
        
        # Log the action
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='create_notification_template',
            target_type='notification_template',
            target_id=str(template.id),
            details=f"Created template: {data['name']}"
        )
        
        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating notification template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# ANNOUNCEMENT ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/announcements', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_announcements():
    """Get all announcements with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        announcement_type = request.args.get('type')
        is_active = request.args.get('is_active')
        is_published = request.args.get('is_published')
        is_global = request.args.get('is_global')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Announcement.query
        
        # Apply filters
        if announcement_type:
            query = query.filter(Announcement.type == AnnouncementType(announcement_type))
        if is_active is not None:
            query = query.filter(Announcement.is_active == (is_active.lower() == 'true'))
        if is_published is not None:
            query = query.filter(Announcement.is_published == (is_published.lower() == 'true'))
        if is_global is not None:
            query = query.filter(Announcement.is_global == (is_global.lower() == 'true'))
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Announcement.created_at >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format'}), 400
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Announcement.created_at <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format'}), 400
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Announcement.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Prepare response
        announcements = []
        for announcement in pagination.items:
            announcement_data = announcement.to_dict()
            # Add admin information
            if announcement.admin_user:
                announcement_data['admin_user'] = {
                    'id': announcement.admin_user.id,
                    'username': announcement.admin_user.username,
                    'full_name': announcement.admin_user.full_name
                }
            announcements.append(announcement_data)
        
        return jsonify({
            'announcements': announcements,
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
        current_app.logger.error(f"Error getting announcements: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/announcements/<int:announcement_id>', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_announcement(announcement_id):
    """Get specific announcement details"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        
        announcement_data = announcement.to_dict()
        
        # Add admin information
        if announcement.admin_user:
            announcement_data['admin_user'] = {
                'id': announcement.admin_user.id,
                'username': announcement.admin_user.username,
                'full_name': announcement.admin_user.full_name
            }
        
        # Add view statistics
        announcement_data['view_statistics'] = {
            'total_views': announcement.view_count,
            'total_clicks': announcement.click_count,
            'unique_viewers': db.session.query(func.count(func.distinct(AnnouncementView.user_id)))
                .filter(AnnouncementView.announcement_id == announcement_id).scalar()
        }
        
        return jsonify(announcement_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting announcement {announcement_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/announcements', methods=['POST'])
@jwt_required()
@admin_required
@rate_limit_admin
def create_announcement():
    """Create a new announcement"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'title', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate announcement type
        try:
            announcement_type = AnnouncementType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid announcement type'}), 400
        
        # Get admin user ID from JWT
        admin_user_id = get_jwt_identity()
        
        # Create announcement
        announcement = Announcement(
            admin_user_id=admin_user_id,
            type=announcement_type,
            title=data['title'],
            content=data['content'],
            summary=data.get('summary'),
            is_global=data.get('is_global', True),
            target_user_ids=data.get('target_user_ids'),
            target_user_groups=data.get('target_user_groups'),
            is_scheduled=data.get('is_scheduled', False),
            scheduled_at=datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00')) if data.get('scheduled_at') else None,
            expires_at=datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00')) if data.get('expires_at') else None,
            is_active=data.get('is_active', True),
            is_published=data.get('is_published', False),
            metadata=data.get('metadata')
        )
        
        # Set published_at if immediately published
        if announcement.is_published and not announcement.is_scheduled:
            announcement.published_at = datetime.utcnow()
        
        db.session.add(announcement)
        db.session.commit()
        
        # Log the action
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='create_announcement',
            target_type='announcement',
            target_id=str(announcement.id),
            details=f"Created announcement: {data['title']}"
        )
        
        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating announcement: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/announcements/<int:announcement_id>', methods=['PUT'])
@jwt_required()
@admin_required
@rate_limit_admin
def update_announcement(announcement_id):
    """Update an announcement"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        data = request.get_json()
        
        # Update fields
        if 'type' in data:
            try:
                announcement.type = AnnouncementType(data['type'])
            except ValueError:
                return jsonify({'error': 'Invalid announcement type'}), 400
        
        if 'title' in data:
            announcement.title = data['title']
        if 'content' in data:
            announcement.content = data['content']
        if 'summary' in data:
            announcement.summary = data['summary']
        if 'is_global' in data:
            announcement.is_global = data['is_global']
        if 'target_user_ids' in data:
            announcement.target_user_ids = data['target_user_ids']
        if 'target_user_groups' in data:
            announcement.target_user_groups = data['target_user_groups']
        if 'is_scheduled' in data:
            announcement.is_scheduled = data['is_scheduled']
        if 'scheduled_at' in data:
            announcement.scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00')) if data['scheduled_at'] else None
        if 'expires_at' in data:
            announcement.expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00')) if data['expires_at'] else None
        if 'is_active' in data:
            announcement.is_active = data['is_active']
        if 'is_published' in data:
            announcement.is_published = data['is_published']
            if data['is_published'] and not announcement.published_at:
                announcement.published_at = datetime.utcnow()
        if 'metadata' in data:
            announcement.metadata = data['metadata']
        
        db.session.commit()
        
        # Log the action
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='update_announcement',
            target_type='announcement',
            target_id=str(announcement_id),
            details=f"Updated announcement: {announcement.title}"
        )
        
        return jsonify({
            'message': 'Announcement updated successfully',
            'announcement': announcement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating announcement {announcement_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/announcements/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
@admin_required
@rate_limit_admin
def delete_announcement(announcement_id):
    """Delete an announcement"""
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        
        db.session.delete(announcement)
        db.session.commit()
        
        # Log the action
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='delete_announcement',
            target_type='announcement',
            target_id=str(announcement_id),
            details=f"Deleted announcement: {announcement.title}"
        )
        
        return jsonify({'message': 'Announcement deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting announcement {announcement_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# MESSAGING ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/messages', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_messages():
    """Get all messages with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        message_type = request.args.get('type')
        is_read = request.args.get('is_read')
        is_urgent = request.args.get('is_urgent')
        sender_id = request.args.get('sender_id', type=int)
        recipient_id = request.args.get('recipient_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Message.query
        
        # Apply filters
        if message_type:
            query = query.filter(Message.type == MessageType(message_type))
        if is_read is not None:
            query = query.filter(Message.is_read == (is_read.lower() == 'true'))
        if is_urgent is not None:
            query = query.filter(Message.is_urgent == (is_urgent.lower() == 'true'))
        if sender_id:
            query = query.filter(Message.sender_id == sender_id)
        if recipient_id:
            query = query.filter(Message.recipient_id == recipient_id)
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Message.created_at >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format'}), 400
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Message.created_at <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format'}), 400
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Message.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Prepare response
        messages = []
        for message in pagination.items:
            message_data = message.to_dict()
            # Add sender information
            if message.sender:
                message_data['sender'] = {
                    'id': message.sender.id,
                    'username': message.sender.username,
                    'email': message.sender.email,
                    'full_name': message.sender.full_name
                }
            # Add recipient information
            if message.recipient:
                message_data['recipient'] = {
                    'id': message.recipient.id,
                    'username': message.recipient.username,
                    'email': message.recipient.email,
                    'full_name': message.recipient.full_name
                }
            # Add admin sender information
            if message.admin_sender:
                message_data['admin_sender'] = {
                    'id': message.admin_sender.id,
                    'username': message.admin_sender.username,
                    'full_name': message.admin_sender.full_name
                }
            messages.append(message_data)
        
        return jsonify({
            'messages': messages,
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
        current_app.logger.error(f"Error getting messages: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/messages/<int:message_id>', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_message(message_id):
    """Get specific message details"""
    try:
        message = Message.query.get_or_404(message_id)
        
        message_data = message.to_dict()
        
        # Add sender information
        if message.sender:
            message_data['sender'] = {
                'id': message.sender.id,
                'username': message.sender.username,
                'email': message.sender.email,
                'full_name': message.sender.full_name
            }
        
        # Add recipient information
        if message.recipient:
            message_data['recipient'] = {
                'id': message.recipient.id,
                'username': message.recipient.username,
                'email': message.recipient.email,
                'full_name': message.recipient.full_name
            }
        
        # Add admin sender information
        if message.admin_sender:
            message_data['admin_sender'] = {
                'id': message.admin_sender.id,
                'username': message.admin_sender.username,
                'full_name': message.admin_sender.full_name
            }
        
        return jsonify(message_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting message {message_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/messages', methods=['POST'])
@jwt_required()
@admin_required
@rate_limit_admin
def send_message():
    """Send a message to a user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['recipient_id', 'type', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate message type
        try:
            message_type = MessageType(data['type'])
        except ValueError:
            return jsonify({'error': 'Invalid message type'}), 400
        
        # Check if recipient exists
        recipient = User.query.get(data['recipient_id'])
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
        
        # Get admin user ID from JWT
        admin_user_id = get_jwt_identity()
        
        # Create message
        message = Message(
            sender_id=None,  # Admin messages don't have a regular sender
            recipient_id=data['recipient_id'],
            admin_sender_id=admin_user_id,
            type=message_type,
            subject=data.get('subject'),
            content=data['content'],
            priority=NotificationPriority(data.get('priority', 'normal')),
            is_urgent=data.get('is_urgent', False),
            metadata=data.get('metadata')
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Log the action
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='send_message',
            target_type='message',
            target_id=str(message.id),
            details=f"Sent message to user {data['recipient_id']}"
        )
        
        return jsonify({
            'message': 'Message sent successfully',
            'message_data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending message: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# COMMUNICATION PREFERENCES ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/users/<int:user_id>/communication-preferences', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_user_communication_preferences(user_id):
    """Get user's communication preferences"""
    try:
        # Check if user exists
        user = User.query.get_or_404(user_id)
        
        preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Create default preferences
            preferences = CommunicationPreference(user_id=user_id)
            db.session.add(preferences)
            db.session.commit()
        
        return jsonify({
            'user_id': user_id,
            'preferences': preferences.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting communication preferences for user {user_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@communication_bp.route('/admin/users/<int:user_id>/communication-preferences', methods=['PUT'])
@jwt_required()
@admin_required
@rate_limit_admin
def update_user_communication_preferences(user_id):
    """Update user's communication preferences"""
    try:
        # Check if user exists
        user = User.query.get_or_404(user_id)
        
        preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Create new preferences
            preferences = CommunicationPreference(user_id=user_id)
            db.session.add(preferences)
        
        data = request.get_json()
        
        # Update fields
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
        
        # Log the action
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='update_communication_preferences',
            target_type='communication_preferences',
            target_id=str(user_id),
            details=f"Updated communication preferences for user {user_id}"
        )
        
        return jsonify({
            'message': 'Communication preferences updated successfully',
            'preferences': preferences.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating communication preferences for user {user_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# STATISTICS ENDPOINTS
# ============================================================================

@communication_bp.route('/admin/communication/statistics', methods=['GET'])
@jwt_required()
@admin_required
@rate_limit_admin
def get_communication_statistics():
    """Get communication statistics"""
    try:
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Notification statistics
        notification_stats = db.session.query(
            Notification.status,
            func.count(Notification.id).label('count')
        ).filter(
            Notification.created_at >= start_date
        ).group_by(Notification.status).all()
        
        # Announcement statistics
        announcement_stats = db.session.query(
            Announcement.type,
            func.count(Announcement.id).label('count'),
            func.sum(Announcement.view_count).label('total_views'),
            func.sum(Announcement.click_count).label('total_clicks')
        ).filter(
            Announcement.created_at >= start_date
        ).group_by(Announcement.type).all()
        
        # Message statistics
        message_stats = db.session.query(
            Message.type,
            func.count(Message.id).label('count'),
            func.sum(func.case([(Message.is_read == True, 1)], else_=0)).label('read_count')
        ).filter(
            Message.created_at >= start_date
        ).group_by(Message.type).all()
        
        # Prepare response
        stats = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'notifications': {
                'total': sum(stat.count for stat in notification_stats),
                'by_status': {stat.status.value: stat.count for stat in notification_stats}
            },
            'announcements': {
                'total': sum(stat.count for stat in announcement_stats),
                'by_type': {
                    stat.type.value: {
                        'count': stat.count,
                        'total_views': stat.total_views or 0,
                        'total_clicks': stat.total_clicks or 0
                    } for stat in announcement_stats
                }
            },
            'messages': {
                'total': sum(stat.count for stat in message_stats),
                'by_type': {
                    stat.type.value: {
                        'count': stat.count,
                        'read_count': stat.read_count or 0
                    } for stat in message_stats
                }
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting communication statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

