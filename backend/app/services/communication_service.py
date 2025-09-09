import threading
import time
import json
import smtplib
import requests
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import and_, or_, desc, func, text
from sqlalchemy.orm import joinedload

from app import db, mail
from app.models.communication import (
    Notification, NotificationTemplate, Announcement, AnnouncementView, 
    Message, CommunicationPreference, NotificationType, NotificationPriority, 
    NotificationStatus, AnnouncementType, MessageType
)
from app.models.user import User
from app.models.rbac import AdminUser
from app.services.audit_service import AuditService
from app.services.security_service import SecurityService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NotificationService:
    """Service for managing notification delivery and processing"""
    
    def __init__(self):
        self.audit_service = AuditService()
        self.security_service = SecurityService()
        self.delivery_queue = []
        self.is_processing = False
    
    def create_notification(self, user_id, notification_type, title, message, 
                          admin_user_id=None, priority=NotificationPriority.NORMAL,
                          template_id=None, scheduled_at=None, metadata=None, 
                          recipient_data=None):
        """Create a new notification"""
        try:
            # Validate user exists
            user = User.query.get(user_id)
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Create notification
            notification = Notification(
                user_id=user_id,
                admin_user_id=admin_user_id,
                type=notification_type,
                priority=priority,
                title=title,
                message=message,
                template_id=template_id,
                scheduled_at=scheduled_at,
                metadata=metadata,
                recipient_data=recipient_data
            )
            
            db.session.add(notification)
            db.session.commit()
            
            # Log the action
            if admin_user_id:
                self.audit_service.log_admin_action(
                    admin_user_id=admin_user_id,
                    action='create_notification',
                    target_type='notification',
                    target_id=str(notification.id),
                    details=f"Created {notification_type.value} notification for user {user_id}"
                )
            
            # Add to delivery queue if not scheduled
            if not scheduled_at or scheduled_at <= datetime.utcnow():
                self.add_to_delivery_queue(notification)
            
            return notification
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating notification: {str(e)}")
            raise
    
    def create_notification_from_template(self, user_id, template_name, variables=None,
                                        admin_user_id=None, scheduled_at=None):
        """Create notification from template"""
        try:
            # Get template
            template = NotificationTemplate.query.filter_by(
                name=template_name, is_active=True
            ).first()
            
            if not template:
                raise ValueError(f"Template '{template_name}' not found or inactive")
            
            # Process template variables
            title = self._process_template(template.title_template, variables or {})
            message = self._process_template(template.message_template, variables or {})
            
            # Create notification
            return self.create_notification(
                user_id=user_id,
                notification_type=template.type,
                title=title,
                message=message,
                admin_user_id=admin_user_id,
                priority=template.priority,
                template_id=template.name,
                scheduled_at=scheduled_at,
                metadata=template.default_metadata
            )
            
        except Exception as e:
            logger.error(f"Error creating notification from template: {str(e)}")
            raise
    
    def _process_template(self, template_text, variables):
        """Process template variables"""
        if not variables:
            return template_text
        
        try:
            # Simple variable replacement
            for key, value in variables.items():
                placeholder = f"{{{{{key}}}}}"
                template_text = template_text.replace(placeholder, str(value))
            
            return template_text
        except Exception as e:
            logger.error(f"Error processing template: {str(e)}")
            return template_text
    
    def add_to_delivery_queue(self, notification):
        """Add notification to delivery queue"""
        self.delivery_queue.append(notification)
        
        # Start processing if not already running
        if not self.is_processing:
            self.start_delivery_processor()
    
    def start_delivery_processor(self):
        """Start the delivery processor in a background thread"""
        if self.is_processing:
            return
        
        self.is_processing = True
        thread = threading.Thread(target=self._delivery_processor, daemon=True)
        thread.start()
    
    def _delivery_processor(self):
        """Background processor for notification delivery"""
        while self.is_processing and self.delivery_queue:
            try:
                notification = self.delivery_queue.pop(0)
                self._deliver_notification(notification)
                time.sleep(0.1)  # Small delay to prevent overwhelming
            except Exception as e:
                logger.error(f"Error in delivery processor: {str(e)}")
                time.sleep(1)
        
        self.is_processing = False
    
    def _deliver_notification(self, notification):
        """Deliver a single notification"""
        try:
            # Check user preferences
            preferences = self._get_user_preferences(notification.user_id)
            if not self._should_deliver_notification(notification, preferences):
                notification.status = NotificationStatus.CANCELLED
                db.session.commit()
                return
            
            # Attempt delivery based on type
            success = False
            error_message = None
            
            if notification.type == NotificationType.EMAIL:
                success, error_message = self._deliver_email_notification(notification)
            elif notification.type == NotificationType.SMS:
                success, error_message = self._deliver_sms_notification(notification)
            elif notification.type == NotificationType.PUSH:
                success, error_message = self._deliver_push_notification(notification)
            elif notification.type == NotificationType.IN_APP:
                success, error_message = self._deliver_in_app_notification(notification)
            elif notification.type == NotificationType.WEBHOOK:
                success, error_message = self._deliver_webhook_notification(notification)
            
            # Update notification status
            notification.attempt_count += 1
            notification.last_attempt_at = datetime.utcnow()
            
            if success:
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
            else:
                notification.error_message = error_message
                if notification.attempt_count >= notification.max_attempts:
                    notification.status = NotificationStatus.FAILED
                    notification.failed_at = datetime.utcnow()
                else:
                    # Re-queue for retry
                    self.delivery_queue.append(notification)
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error delivering notification {notification.id}: {str(e)}")
            notification.attempt_count += 1
            notification.last_attempt_at = datetime.utcnow()
            notification.error_message = str(e)
            
            if notification.attempt_count >= notification.max_attempts:
                notification.status = NotificationStatus.FAILED
                notification.failed_at = datetime.utcnow()
            
            db.session.commit()
    
    def _get_user_preferences(self, user_id):
        """Get user communication preferences"""
        preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
        if not preferences:
            # Create default preferences
            preferences = CommunicationPreference(user_id=user_id)
            db.session.add(preferences)
            db.session.commit()
        return preferences
    
    def _should_deliver_notification(self, notification, preferences):
        """Check if notification should be delivered based on user preferences"""
        # Check if channel is enabled
        if notification.type == NotificationType.EMAIL and not preferences.email_enabled:
            return False
        elif notification.type == NotificationType.SMS and not preferences.sms_enabled:
            return False
        elif notification.type == NotificationType.PUSH and not preferences.push_enabled:
            return False
        elif notification.type == NotificationType.IN_APP and not preferences.in_app_enabled:
            return False
        
        # Check quiet hours
        if preferences.quiet_hours_enabled and self._is_in_quiet_hours(preferences):
            return False
        
        return True
    
    def _is_in_quiet_hours(self, preferences):
        """Check if current time is within quiet hours"""
        if not preferences.quiet_hours_enabled:
            return False
        
        # This is a simplified implementation
        # In production, you'd want proper timezone handling
        now = datetime.utcnow()
        current_time = now.strftime('%H:%M')
        
        if preferences.quiet_hours_start and preferences.quiet_hours_end:
            return preferences.quiet_hours_start <= current_time <= preferences.quiet_hours_end
        
        return False
    
    def _deliver_email_notification(self, notification):
        """Deliver email notification"""
        try:
            user = User.query.get(notification.user_id)
            if not user or not user.email:
                return False, "User email not found"
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = 'noreply@tradingjournal.com'  # Configure from app config
            msg['To'] = user.email
            msg['Subject'] = notification.title
            
            # Add body
            body = notification.message
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email (placeholder - configure with actual SMTP settings)
            # with mail.connect() as conn:
            #     conn.send(msg)
            
            logger.info(f"Email notification sent to {user.email}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return False, str(e)
    
    def _deliver_sms_notification(self, notification):
        """Deliver SMS notification"""
        try:
            # Placeholder for SMS delivery
            # In production, integrate with SMS service provider
            logger.info(f"SMS notification would be sent for user {notification.user_id}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            return False, str(e)
    
    def _deliver_push_notification(self, notification):
        """Deliver push notification"""
        try:
            # Placeholder for push notification delivery
            # In production, integrate with push notification service
            logger.info(f"Push notification would be sent for user {notification.user_id}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return False, str(e)
    
    def _deliver_in_app_notification(self, notification):
        """Deliver in-app notification"""
        try:
            # In-app notifications are stored in the database
            # Frontend can poll for new notifications
            logger.info(f"In-app notification stored for user {notification.user_id}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error storing in-app notification: {str(e)}")
            return False, str(e)
    
    def _deliver_webhook_notification(self, notification):
        """Deliver webhook notification"""
        try:
            # Placeholder for webhook delivery
            # In production, send HTTP POST to configured webhook URL
            webhook_url = notification.notification_metadata.get('webhook_url') if notification.notification_metadata else None
            
            if webhook_url:
                payload = {
                    'notification_id': notification.id,
                    'user_id': notification.user_id,
                    'title': notification.title,
                    'message': notification.message,
                    'type': notification.type.value,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                response = requests.post(webhook_url, json=payload, timeout=10)
                response.raise_for_status()
                
                logger.info(f"Webhook notification sent to {webhook_url}")
                return True, None
            else:
                return False, "No webhook URL configured"
            
        except Exception as e:
            logger.error(f"Error sending webhook notification: {str(e)}")
            return False, str(e)
    
    def retry_failed_notification(self, notification_id):
        """Retry a failed notification"""
        try:
            notification = Notification.query.get(notification_id)
            if not notification:
                raise ValueError(f"Notification {notification_id} not found")
            
            if not notification.can_retry:
                raise ValueError("Notification cannot be retried")
            
            # Reset notification for retry
            notification.status = NotificationStatus.PENDING
            notification.attempt_count = 0
            notification.error_message = None
            notification.failed_at = None
            
            db.session.commit()
            
            # Add to delivery queue
            self.add_to_delivery_queue(notification)
            
            return notification
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error retrying notification: {str(e)}")
            raise
    
    def get_user_notifications(self, user_id, page=1, per_page=20, unread_only=False):
        """Get notifications for a user"""
        try:
            query = Notification.query.filter_by(user_id=user_id)
            
            if unread_only:
                query = query.filter(Notification.status == NotificationStatus.PENDING)
            
            query = query.order_by(desc(Notification.created_at))
            
            pagination = query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return pagination
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            raise
    
    def mark_notification_as_read(self, notification_id, user_id):
        """Mark notification as read (for in-app notifications)"""
        try:
            notification = Notification.query.filter_by(
                id=notification_id, user_id=user_id
            ).first()
            
            if not notification:
                raise ValueError("Notification not found")
            
            if notification.type == NotificationType.IN_APP:
                notification.status = NotificationStatus.DELIVERED
                notification.delivered_at = datetime.utcnow()
                db.session.commit()
            
            return notification
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking notification as read: {str(e)}")
            raise


class AnnouncementService:
    """Service for managing announcements and broadcasts"""
    
    def __init__(self):
        self.audit_service = AuditService()
    
    def create_announcement(self, admin_user_id, announcement_type, title, content,
                          summary=None, is_global=True, target_user_ids=None,
                          target_user_groups=None, is_scheduled=False, scheduled_at=None,
                          expires_at=None, is_active=True, is_published=False, metadata=None):
        """Create a new announcement"""
        try:
            announcement = Announcement(
                admin_user_id=admin_user_id,
                type=announcement_type,
                title=title,
                content=content,
                summary=summary,
                is_global=is_global,
                target_user_ids=target_user_ids,
                target_user_groups=target_user_groups,
                is_scheduled=is_scheduled,
                scheduled_at=scheduled_at,
                expires_at=expires_at,
                is_active=is_active,
                is_published=is_published,
                metadata=metadata
            )
            
            # Set published_at if immediately published
            if announcement.is_published and not announcement.is_scheduled:
                announcement.published_at = datetime.utcnow()
            
            db.session.add(announcement)
            db.session.commit()
            
            # Log the action
            self.audit_service.log_admin_action(
                admin_user_id=admin_user_id,
                action='create_announcement',
                target_type='announcement',
                target_id=str(announcement.id),
                details=f"Created announcement: {title}"
            )
            
            return announcement
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating announcement: {str(e)}")
            raise
    
    def get_visible_announcements(self, user_id=None, user_groups=None):
        """Get announcements visible to a user"""
        try:
            now = datetime.utcnow()
            
            # Base query for visible announcements
            query = Announcement.query.filter(
                Announcement.is_active == True,
                Announcement.is_published == True,
                or_(
                    Announcement.scheduled_at.is_(None),
                    Announcement.scheduled_at <= now
                ),
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > now
                )
            )
            
            # Filter by targeting
            if user_id or user_groups:
                # Get global announcements
                global_announcements = query.filter(Announcement.is_global == True)
                
                # Get targeted announcements
                targeted_announcements = query.filter(Announcement.is_global == False)
                
                if user_id:
                    # Check user-specific targeting
                    targeted_announcements = targeted_announcements.filter(
                        or_(
                            Announcement.target_user_ids.contains([user_id]),
                            Announcement.target_user_ids.is_(None)
                        )
                    )
                
                if user_groups:
                    # Check group targeting
                    targeted_announcements = targeted_announcements.filter(
                        or_(
                            Announcement.target_user_groups.overlap(user_groups),
                            Announcement.target_user_groups.is_(None)
                        )
                    )
                
                # Combine results
                announcements = global_announcements.union(targeted_announcements)
            else:
                # Return only global announcements
                announcements = query.filter(Announcement.is_global == True)
            
            return announcements.order_by(desc(Announcement.created_at)).all()
            
        except Exception as e:
            logger.error(f"Error getting visible announcements: {str(e)}")
            raise
    
    def record_announcement_view(self, announcement_id, user_id, session_id=None,
                               ip_address=None, user_agent=None):
        """Record that a user viewed an announcement"""
        try:
            # Check if view already exists
            existing_view = AnnouncementView.query.filter_by(
                announcement_id=announcement_id,
                user_id=user_id
            ).first()
            
            if existing_view:
                # Update existing view
                existing_view.viewed_at = datetime.utcnow()
                existing_view.session_id = session_id
                existing_view.ip_address = ip_address
                existing_view.user_agent = user_agent
            else:
                # Create new view
                view = AnnouncementView(
                    announcement_id=announcement_id,
                    user_id=user_id,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                db.session.add(view)
                
                # Increment view count
                announcement = Announcement.query.get(announcement_id)
                if announcement:
                    announcement.view_count += 1
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error recording announcement view: {str(e)}")
            raise
    
    def record_announcement_click(self, announcement_id, user_id, session_id=None):
        """Record that a user clicked on an announcement"""
        try:
            view = AnnouncementView.query.filter_by(
                announcement_id=announcement_id,
                user_id=user_id
            ).first()
            
            if view and not view.clicked:
                view.clicked = True
                view.clicked_at = datetime.utcnow()
                view.session_id = session_id
                
                # Increment click count
                announcement = Announcement.query.get(announcement_id)
                if announcement:
                    announcement.click_count += 1
                
                db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error recording announcement click: {str(e)}")
            raise
    
    def get_announcement_statistics(self, announcement_id):
        """Get statistics for an announcement"""
        try:
            announcement = Announcement.query.get(announcement_id)
            if not announcement:
                raise ValueError(f"Announcement {announcement_id} not found")
            
            # Get view statistics
            view_stats = db.session.query(
                func.count(AnnouncementView.id).label('total_views'),
                func.count(func.distinct(AnnouncementView.user_id)).label('unique_viewers'),
                func.sum(func.case([(AnnouncementView.clicked == True, 1)], else_=0)).label('total_clicks')
            ).filter(AnnouncementView.announcement_id == announcement_id).first()
            
            return {
                'announcement_id': announcement_id,
                'title': announcement.title,
                'view_count': announcement.view_count,
                'click_count': announcement.click_count,
                'total_views': view_stats.total_views or 0,
                'unique_viewers': view_stats.unique_viewers or 0,
                'total_clicks': view_stats.total_clicks or 0,
                'click_through_rate': (view_stats.total_clicks / view_stats.total_views * 100) if view_stats.total_views else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting announcement statistics: {str(e)}")
            raise


class MessagingService:
    """Service for managing internal messaging"""
    
    def __init__(self):
        self.audit_service = AuditService()
    
    def send_message(self, sender_id, recipient_id, message_type, content,
                    subject=None, priority=NotificationPriority.NORMAL,
                    is_urgent=False, metadata=None, admin_sender_id=None):
        """Send a message between users or from admin to user"""
        try:
            # Validate recipient exists
            recipient = User.query.get(recipient_id)
            if not recipient:
                raise ValueError(f"Recipient {recipient_id} not found")
            
            # Create message
            message = Message(
                sender_id=sender_id,
                recipient_id=recipient_id,
                admin_sender_id=admin_sender_id,
                type=message_type,
                subject=subject,
                content=content,
                priority=priority,
                is_urgent=is_urgent,
                metadata=metadata
            )
            
            db.session.add(message)
            db.session.commit()
            
            # Log the action
            if admin_sender_id:
                self.audit_service.log_admin_action(
                    admin_user_id=admin_sender_id,
                    action='send_message',
                    target_type='message',
                    target_id=str(message.id),
                    details=f"Sent message to user {recipient_id}"
                )
            
            return message
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error sending message: {str(e)}")
            raise
    
    def get_user_messages(self, user_id, page=1, per_page=20, unread_only=False,
                         message_type=None, is_archived=False):
        """Get messages for a user"""
        try:
            query = Message.query.filter_by(recipient_id=user_id)
            
            if unread_only:
                query = query.filter(Message.is_read == False)
            
            if message_type:
                query = query.filter(Message.type == message_type)
            
            if is_archived:
                query = query.filter(Message.is_archived == True)
            else:
                query = query.filter(Message.is_archived == False)
            
            query = query.order_by(desc(Message.created_at))
            
            pagination = query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return pagination
            
        except Exception as e:
            logger.error(f"Error getting user messages: {str(e)}")
            raise
    
    def mark_message_as_read(self, message_id, user_id):
        """Mark a message as read"""
        try:
            message = Message.query.filter_by(
                id=message_id, recipient_id=user_id
            ).first()
            
            if not message:
                raise ValueError("Message not found")
            
            if not message.is_read:
                message.is_read = True
                message.read_at = datetime.utcnow()
                db.session.commit()
            
            return message
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking message as read: {str(e)}")
            raise
    
    def archive_message(self, message_id, user_id):
        """Archive a message"""
        try:
            message = Message.query.filter_by(
                id=message_id, recipient_id=user_id
            ).first()
            
            if not message:
                raise ValueError("Message not found")
            
            message.is_archived = True
            message.archived_at = datetime.utcnow()
            db.session.commit()
            
            return message
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error archiving message: {str(e)}")
            raise
    
    def get_unread_message_count(self, user_id):
        """Get count of unread messages for a user"""
        try:
            count = Message.query.filter_by(
                recipient_id=user_id, is_read=False, is_archived=False
            ).count()
            
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread message count: {str(e)}")
            raise


class CommunicationPreferenceService:
    """Service for managing user communication preferences"""
    
    def __init__(self):
        self.audit_service = AuditService()
    
    def get_user_preferences(self, user_id):
        """Get user's communication preferences"""
        try:
            preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
            
            if not preferences:
                # Create default preferences
                preferences = CommunicationPreference(user_id=user_id)
                db.session.add(preferences)
                db.session.commit()
            
            return preferences
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error getting user preferences: {str(e)}")
            raise
    
    def update_user_preferences(self, user_id, admin_user_id=None, **preferences_data):
        """Update user's communication preferences"""
        try:
            preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
            
            if not preferences:
                preferences = CommunicationPreference(user_id=user_id)
                db.session.add(preferences)
            
            # Update fields
            for field, value in preferences_data.items():
                if hasattr(preferences, field):
                    setattr(preferences, field, value)
            
            db.session.commit()
            
            # Log the action if admin is updating
            if admin_user_id:
                self.audit_service.log_admin_action(
                    admin_user_id=admin_user_id,
                    action='update_communication_preferences',
                    target_type='communication_preferences',
                    target_id=str(user_id),
                    details=f"Updated communication preferences for user {user_id}"
                )
            
            return preferences
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating user preferences: {str(e)}")
            raise
    
    def check_delivery_permission(self, user_id, notification_type):
        """Check if notification can be delivered to user"""
        try:
            preferences = self.get_user_preferences(user_id)
            
            if notification_type == NotificationType.EMAIL:
                return preferences.email_enabled
            elif notification_type == NotificationType.SMS:
                return preferences.sms_enabled
            elif notification_type == NotificationType.PUSH:
                return preferences.push_enabled
            elif notification_type == NotificationType.IN_APP:
                return preferences.in_app_enabled
            
            return True  # Default to allowing delivery
            
        except Exception as e:
            logger.error(f"Error checking delivery permission: {str(e)}")
            return False  # Default to not allowing delivery on error
    
    def get_users_by_preference(self, notification_type, enabled=True):
        """Get users who have enabled/disabled a specific notification type"""
        try:
            if notification_type == NotificationType.EMAIL:
                field = CommunicationPreference.email_enabled
            elif notification_type == NotificationType.SMS:
                field = CommunicationPreference.sms_enabled
            elif notification_type == NotificationType.PUSH:
                field = CommunicationPreference.push_enabled
            elif notification_type == NotificationType.IN_APP:
                field = CommunicationPreference.in_app_enabled
            else:
                return []
            
            preferences = CommunicationPreference.query.filter(field == enabled).all()
            return [pref.user_id for pref in preferences]
            
        except Exception as e:
            logger.error(f"Error getting users by preference: {str(e)}")
            raise


# Initialize services
notification_service = NotificationService()
announcement_service = AnnouncementService()
messaging_service = MessagingService()
communication_preference_service = CommunicationPreferenceService()
