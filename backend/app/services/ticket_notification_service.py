"""
Enhanced Ticket Notification Service
Handles all notification types for the support ticket system
"""

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
    Notification, NotificationTemplate, NotificationType, NotificationPriority, 
    NotificationStatus, CommunicationPreference
)
from app.models.support import SupportTicket, SupportMessage, TicketStatus, TicketPriority
from app.models.user import User
from app.models.rbac import AdminUser
from app.services.audit_service import AuditService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TicketNotificationService:
    """Enhanced service for managing ticket-related notifications"""
    
    def __init__(self):
        self.audit_service = AuditService()
        self.delivery_queue = []
        self.is_processing = False
        self.notification_templates = self._load_notification_templates()
    
    def _load_notification_templates(self):
        """Load notification templates for different ticket events"""
        return {
            'ticket_created': {
                'email': {
                    'subject': 'Support Ticket Created - #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    Your support ticket has been created successfully.
                    
                    Ticket Details:
                    - Ticket Number: {ticket_number}
                    - Subject: {subject}
                    - Priority: {priority}
                    - Status: {status}
                    
                    We will review your request and respond within 24 hours.
                    You can track your ticket status in your dashboard.
                    
                    Thank you for your patience.
                    '''
                },
                'sms': {
                    'body': 'Support ticket #{ticket_number} created. We\'ll respond within 24h.'
                },
                'push': {
                    'title': 'Ticket Created',
                    'body': 'Your support ticket #{ticket_number} has been created successfully.'
                }
            },
            'ticket_assigned': {
                'email': {
                    'subject': 'Support Ticket Assigned - #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    Your support ticket has been assigned to our support team.
                    
                    Ticket Details:
                    - Ticket Number: {ticket_number}
                    - Subject: {subject}
                    - Assigned To: {assigned_to}
                    
                    We are working on your request and will provide an update soon.
                    '''
                },
                'sms': {
                    'body': 'Ticket #{ticket_number} assigned to support team. Update coming soon.'
                },
                'push': {
                    'title': 'Ticket Assigned',
                    'body': 'Your ticket #{ticket_number} has been assigned to our support team.'
                }
            },
            'ticket_reply': {
                'email': {
                    'subject': 'New Reply to Ticket #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    A new reply has been added to your support ticket.
                    
                    Ticket: {ticket_number}
                    Subject: {subject}
                    
                    Reply Preview: {reply_preview}
                    
                    Please log in to your dashboard to view the full reply.
                    '''
                },
                'sms': {
                    'body': 'New reply to ticket #{ticket_number}. Check your dashboard.'
                },
                'push': {
                    'title': 'New Reply',
                    'body': 'You have a new reply to ticket #{ticket_number}.'
                }
            },
            'ticket_status_changed': {
                'email': {
                    'subject': 'Ticket Status Updated - #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    The status of your support ticket has been updated.
                    
                    Ticket: {ticket_number}
                    Subject: {subject}
                    New Status: {new_status}
                    Previous Status: {previous_status}
                    
                    {status_message}
                    '''
                },
                'sms': {
                    'body': 'Ticket #{ticket_number} status changed to {new_status}.'
                },
                'push': {
                    'title': 'Status Updated',
                    'body': 'Ticket #{ticket_number} status: {new_status}.'
                }
            },
            'ticket_resolved': {
                'email': {
                    'subject': 'Ticket Resolved - #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    Your support ticket has been resolved.
                    
                    Ticket: {ticket_number}
                    Subject: {subject}
                    
                    Please rate your experience and provide feedback.
                    Your input helps us improve our service.
                    
                    Thank you for choosing our platform.
                    '''
                },
                'sms': {
                    'body': 'Ticket #{ticket_number} resolved. Please rate your experience.'
                },
                'push': {
                    'title': 'Ticket Resolved',
                    'body': 'Your ticket #{ticket_number} has been resolved. Please rate us!'
                }
            },
            'ticket_urgent': {
                'email': {
                    'subject': 'URGENT: High Priority Ticket #{ticket_number}',
                    'body': '''
                    Dear {user_name},
                    
                    Your support ticket has been marked as urgent priority.
                    
                    Ticket: {ticket_number}
                    Subject: {subject}
                    
                    We are prioritizing your request and will respond within 2 hours.
                    '''
                },
                'sms': {
                    'body': 'URGENT: Ticket #{ticket_number} marked high priority. Response within 2h.'
                },
                'push': {
                    'title': 'Urgent Ticket',
                    'body': 'Your ticket #{ticket_number} is marked urgent. Quick response guaranteed.'
                }
            }
        }
    
    def notify_ticket_created(self, ticket_id):
        """Send notifications when a ticket is created"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            user = User.query.filter_by(email=ticket.user_email).first()
            if not user:
                return False
            
            # Prepare notification data
            notification_data = {
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'priority': ticket.priority.value,
                'status': ticket.status.value,
                'user_name': ticket.user_name,
                'user_email': ticket.user_email
            }
            
            # Send notifications based on user preferences
            self._send_notifications(
                user_id=user.id,
                notification_type='ticket_created',
                notification_data=notification_data,
                priority=NotificationPriority.NORMAL
            )
            
            # Notify support team about new ticket
            self._notify_support_team_new_ticket(ticket)
            
            logger.info(f"Notifications sent for ticket creation: {ticket.ticket_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending ticket creation notifications: {str(e)}")
            return False
    
    def notify_ticket_assigned(self, ticket_id, assigned_admin_id):
        """Send notifications when a ticket is assigned"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            user = User.query.filter_by(email=ticket.user_email).first()
            if not user:
                return False
            
            assigned_admin = AdminUser.query.get(assigned_admin_id)
            if not assigned_admin:
                return False
            
            # Prepare notification data
            notification_data = {
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'assigned_to': assigned_admin.full_name or assigned_admin.username,
                'user_name': ticket.user_name,
                'user_email': ticket.user_email
            }
            
            # Send notifications to user
            self._send_notifications(
                user_id=user.id,
                notification_type='ticket_assigned',
                notification_data=notification_data,
                priority=NotificationPriority.NORMAL
            )
            
            # Send notification to assigned admin
            self._send_admin_notification(
                admin_id=assigned_admin_id,
                title=f"New Ticket Assigned: {ticket.ticket_number}",
                message=f"You have been assigned ticket {ticket.ticket_number}: {ticket.subject}",
                priority=NotificationPriority.HIGH
            )
            
            logger.info(f"Notifications sent for ticket assignment: {ticket.ticket_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending ticket assignment notifications: {str(e)}")
            return False
    
    def notify_ticket_reply(self, ticket_id, message_id, is_admin_reply=True):
        """Send notifications when a reply is added to a ticket"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            message = SupportMessage.query.get(message_id)
            if not message:
                return False
            
            if is_admin_reply:
                # Notify user about admin reply
                user = User.query.filter_by(email=ticket.user_email).first()
                if user:
                    notification_data = {
                        'ticket_number': ticket.ticket_number,
                        'subject': ticket.subject,
                        'reply_preview': message.message[:100] + '...' if len(message.message) > 100 else message.message,
                        'user_name': ticket.user_name,
                        'user_email': ticket.user_email
                    }
                    
                    self._send_notifications(
                        user_id=user.id,
                        notification_type='ticket_reply',
                        notification_data=notification_data,
                        priority=NotificationPriority.HIGH
                    )
            else:
                # Notify support team about user reply
                self._notify_support_team_user_reply(ticket, message)
            
            logger.info(f"Notifications sent for ticket reply: {ticket.ticket_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending ticket reply notifications: {str(e)}")
            return False
    
    def notify_ticket_status_change(self, ticket_id, previous_status, new_status):
        """Send notifications when ticket status changes"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            user = User.query.filter_by(email=ticket.user_email).first()
            if not user:
                return False
            
            # Prepare status-specific messages
            status_messages = {
                TicketStatus.IN_PROGRESS: "We are now working on your request.",
                TicketStatus.PENDING: "We are waiting for additional information.",
                TicketStatus.RESOLVED: "Your issue has been resolved. Please confirm if this meets your needs.",
                TicketStatus.CLOSED: "This ticket has been closed. Thank you for using our support."
            }
            
            notification_data = {
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'new_status': new_status.value,
                'previous_status': previous_status.value,
                'status_message': status_messages.get(new_status, ""),
                'user_name': ticket.user_name,
                'user_email': ticket.user_email
            }
            
            # Send notifications
            self._send_notifications(
                user_id=user.id,
                notification_type='ticket_status_changed',
                notification_data=notification_data,
                priority=NotificationPriority.NORMAL
            )
            
            # Special handling for resolved tickets
            if new_status == TicketStatus.RESOLVED:
                self._send_notifications(
                    user_id=user.id,
                    notification_type='ticket_resolved',
                    notification_data=notification_data,
                    priority=NotificationPriority.HIGH
                )
            
            logger.info(f"Notifications sent for status change: {ticket.ticket_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending status change notifications: {str(e)}")
            return False
    
    def notify_urgent_ticket(self, ticket_id):
        """Send urgent notifications for high-priority tickets"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            user = User.query.filter_by(email=ticket.user_email).first()
            if not user:
                return False
            
            notification_data = {
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'user_name': ticket.user_name,
                'user_email': ticket.user_email
            }
            
            # Send urgent notifications
            self._send_notifications(
                user_id=user.id,
                notification_type='ticket_urgent',
                notification_data=notification_data,
                priority=NotificationPriority.HIGH
            )
            
            # Notify all support team members about urgent ticket
            self._notify_support_team_urgent_ticket(ticket)
            
            logger.info(f"Urgent notifications sent for ticket: {ticket.ticket_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending urgent ticket notifications: {str(e)}")
            return False
    
    def _send_notifications(self, user_id, notification_type, notification_data, priority=NotificationPriority.NORMAL):
        """Send notifications through all enabled channels"""
        try:
            # Get user communication preferences
            preferences = CommunicationPreference.query.filter_by(user_id=user_id).first()
            if not preferences:
                # Create default preferences
                preferences = CommunicationPreference(user_id=user_id)
                db.session.add(preferences)
                db.session.commit()
            
            template = self.notification_templates.get(notification_type, {})
            
            # Send email notification
            if preferences.email_enabled:
                self._send_email_notification(user_id, template.get('email', {}), notification_data, priority)
            
            # Send SMS notification
            if preferences.sms_enabled:
                self._send_sms_notification(user_id, template.get('sms', {}), notification_data, priority)
            
            # Send push notification
            if preferences.push_enabled:
                self._send_push_notification(user_id, template.get('push', {}), notification_data, priority)
            
            # Always send in-app notification
            self._send_in_app_notification(user_id, notification_type, notification_data, priority)
            
        except Exception as e:
            logger.error(f"Error sending notifications: {str(e)}")
    
    def _send_email_notification(self, user_id, template, data, priority):
        """Send email notification"""
        try:
            user = User.query.get(user_id)
            if not user or not user.email:
                return False
            
            # Format template
            subject = template.get('subject', '').format(**data)
            body = template.get('body', '').format(**data)
            
            # Create notification record
            notification = Notification(
                user_id=user_id,
                type=NotificationType.EMAIL,
                priority=priority,
                title=subject,
                message=body,
                status=NotificationStatus.PENDING
            )
            
            db.session.add(notification)
            db.session.commit()
            
            # Send email (placeholder - integrate with your email service)
            logger.info(f"Email notification queued for user {user_id}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return False
    
    def _send_sms_notification(self, user_id, template, data, priority):
        """Send SMS notification"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            # Format template
            body = template.get('body', '').format(**data)
            
            # Create notification record
            notification = Notification(
                user_id=user_id,
                type=NotificationType.SMS,
                priority=priority,
                title="SMS Notification",
                message=body,
                status=NotificationStatus.PENDING
            )
            
            db.session.add(notification)
            db.session.commit()
            
            # Send SMS (placeholder - integrate with your SMS service)
            logger.info(f"SMS notification queued for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            return False
    
    def _send_push_notification(self, user_id, template, data, priority):
        """Send push notification"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            # Format template
            title = template.get('title', '').format(**data)
            body = template.get('body', '').format(**data)
            
            # Create notification record
            notification = Notification(
                user_id=user_id,
                type=NotificationType.PUSH,
                priority=priority,
                title=title,
                message=body,
                status=NotificationStatus.PENDING
            )
            
            db.session.add(notification)
            db.session.commit()
            
            # Send push notification (placeholder - integrate with Firebase/OneSignal)
            logger.info(f"Push notification queued for user {user_id}: {title}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return False
    
    def _send_in_app_notification(self, user_id, notification_type, data, priority):
        """Send in-app notification"""
        try:
            # Create in-app notification
            notification = Notification(
                user_id=user_id,
                type=NotificationType.IN_APP,
                priority=priority,
                title=f"Ticket Update: {data.get('ticket_number', '')}",
                message=self._get_in_app_message(notification_type, data),
                status=NotificationStatus.PENDING,
                notification_metadata={
                    'notification_type': notification_type,
                    'ticket_id': data.get('ticket_id'),
                    'ticket_number': data.get('ticket_number')
                }
            )
            
            db.session.add(notification)
            db.session.commit()
            
            logger.info(f"In-app notification created for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending in-app notification: {str(e)}")
            return False
    
    def _get_in_app_message(self, notification_type, data):
        """Get in-app notification message"""
        messages = {
            'ticket_created': f"Your ticket {data.get('ticket_number')} has been created successfully.",
            'ticket_assigned': f"Your ticket {data.get('ticket_number')} has been assigned to our support team.",
            'ticket_reply': f"You have a new reply to ticket {data.get('ticket_number')}.",
            'ticket_status_changed': f"Ticket {data.get('ticket_number')} status changed to {data.get('new_status')}.",
            'ticket_resolved': f"Your ticket {data.get('ticket_number')} has been resolved. Please rate your experience.",
            'ticket_urgent': f"Your ticket {data.get('ticket_number')} is marked as urgent priority."
        }
        return messages.get(notification_type, "You have a ticket update.")
    
    def _send_admin_notification(self, admin_id, title, message, priority=NotificationPriority.NORMAL):
        """Send notification to admin user"""
        try:
            # Create in-app notification for admin
            notification = Notification(
                user_id=admin_id,
                type=NotificationType.IN_APP,
                priority=priority,
                title=title,
                message=message,
                status=NotificationStatus.PENDING
            )
            
            db.session.add(notification)
            db.session.commit()
            
            logger.info(f"Admin notification sent to {admin_id}: {title}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending admin notification: {str(e)}")
            return False
    
    def _notify_support_team_new_ticket(self, ticket):
        """Notify support team about new ticket"""
        try:
            # Get all support agents and admins
            support_users = AdminUser.query.join(AdminUser.assigned_roles).filter(
                or_(
                    AdminUser.assigned_roles.any(name='support_agent'),
                    AdminUser.assigned_roles.any(name='support_team'),
                    AdminUser.assigned_roles.any(name='admin')
                )
            ).all()
            
            for admin in support_users:
                self._send_admin_notification(
                    admin_id=admin.id,
                    title=f"New Ticket: {ticket.ticket_number}",
                    message=f"New {ticket.priority.value} priority ticket: {ticket.subject}",
                    priority=NotificationPriority.HIGH if ticket.priority == TicketPriority.URGENT else NotificationPriority.NORMAL
                )
            
            logger.info(f"Support team notified about new ticket: {ticket.ticket_number}")
            
        except Exception as e:
            logger.error(f"Error notifying support team: {str(e)}")
    
    def _notify_support_team_user_reply(self, ticket, message):
        """Notify support team about user reply"""
        try:
            # Get assigned admin or all support team if no assignment
            if ticket.assigned_to:
                admins = [AdminUser.query.get(ticket.assigned_to)]
            else:
                admins = AdminUser.query.join(AdminUser.assigned_roles).filter(
                    or_(
                        AdminUser.assigned_roles.any(name='support_agent'),
                        AdminUser.assigned_roles.any(name='support_team'),
                        AdminUser.assigned_roles.any(name='admin')
                    )
                ).all()
            
            for admin in admins:
                if admin:
                    self._send_admin_notification(
                        admin_id=admin.id,
                        title=f"User Reply: {ticket.ticket_number}",
                        message=f"New reply from {ticket.user_name}: {message.message[:50]}...",
                        priority=NotificationPriority.HIGH
                    )
            
            logger.info(f"Support team notified about user reply: {ticket.ticket_number}")
            
        except Exception as e:
            logger.error(f"Error notifying support team about user reply: {str(e)}")
    
    def _notify_support_team_urgent_ticket(self, ticket):
        """Notify support team about urgent ticket"""
        try:
            # Get all support agents and admins
            support_users = AdminUser.query.join(AdminUser.assigned_roles).filter(
                or_(
                    AdminUser.assigned_roles.any(name='support_agent'),
                    AdminUser.assigned_roles.any(name='support_team'),
                    AdminUser.assigned_roles.any(name='admin')
                )
            ).all()
            
            for admin in support_users:
                self._send_admin_notification(
                    admin_id=admin.id,
                    title=f"URGENT: {ticket.ticket_number}",
                    message=f"Urgent priority ticket requires immediate attention: {ticket.subject}",
                    priority=NotificationPriority.HIGH
                )
            
            logger.info(f"Support team notified about urgent ticket: {ticket.ticket_number}")
            
        except Exception as e:
            logger.error(f"Error notifying support team about urgent ticket: {str(e)}")
    
    def get_user_notifications(self, user_id, limit=50, offset=0):
        """Get user's notifications"""
        try:
            notifications = Notification.query.filter_by(user_id=user_id).order_by(
                desc(Notification.created_at)
            ).offset(offset).limit(limit).all()
            
            return [notification.to_dict() for notification in notifications]
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            return []
    
    def mark_notification_read(self, notification_id, user_id):
        """Mark notification as read"""
        try:
            notification = Notification.query.filter_by(
                id=notification_id, user_id=user_id
            ).first()
            
            if notification:
                notification.status = NotificationStatus.DELIVERED
                notification.delivered_at = datetime.utcnow()
                db.session.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    def mark_all_notifications_read(self, user_id):
        """Mark all user notifications as read"""
        try:
            notifications = Notification.query.filter_by(
                user_id=user_id,
                status=NotificationStatus.PENDING
            ).all()
            
            for notification in notifications:
                notification.status = NotificationStatus.DELIVERED
                notification.delivered_at = datetime.utcnow()
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return False


# Initialize the service
ticket_notification_service = TicketNotificationService()
