"""
Support System API Routes
Handles support tickets, categories, messages, and attachments
"""

from functools import wraps
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_, desc, asc
from datetime import datetime, timedelta
import logging
import os
import uuid
from werkzeug.utils import secure_filename

from ..models.support import (
    SupportTicket, SupportCategory, SupportMessage, SupportAttachment,
    TicketStatus, TicketPriority
)
from ..models.rbac import AdminUser
from ..models.user import User
from .. import db
from ..services.ai_service import ai_service
from ..services.realtime_chat_service import realtime_chat_service
# Simple admin permission decorator
def require_admin_permission(permission=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            
            # Check both AdminUser and User models for admin access
            admin_user = AdminUser.query.get(current_user_id)
            regular_user = User.query.get(current_user_id)
            
            # Check if user has admin privileges
            is_admin = False
            if admin_user:
                is_admin = True
            elif regular_user and regular_user.is_admin:
                is_admin = True
            
            if not is_admin:
                return jsonify({'error': 'Admin access required'}), 403
            
            # For now, skip permission check for User model admins
            if permission and admin_user:
                if not admin_user.has_permission(permission):
                    return jsonify({'error': f'Permission {permission} required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Create blueprint
support_bp = Blueprint('support', __name__)
logger = logging.getLogger(__name__)

# Allowed file extensions for attachments
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@support_bp.route('/support/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    """Get support tickets with filtering and pagination"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        status = request.args.get('status')
        priority = request.args.get('priority')
        category_id = request.args.get('category_id', type=int)
        assigned_to = request.args.get('assigned_to')
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        user_only = request.args.get('user_only', 'false').lower() == 'true'
        
        # Check if user is admin with support permissions or support agent
        admin_user = AdminUser.query.get(current_user_id)
        can_see_all_tickets = False
        
        if admin_user:
            # Check if user has support permissions or is support agent
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_see_all_tickets = (
                admin_user.has_permission('support.tickets.view') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles)
            )
        
        # Build query
        query = SupportTicket.query
        
        # Filter by user if not admin/support or if user_only is requested
        if not can_see_all_tickets or user_only:
            # For regular users, only show their own tickets
            regular_user = User.query.get(current_user_id)
            if regular_user:
                query = query.filter(SupportTicket.user_email == regular_user.email)
                # Hide tickets that have been closed for more than 24 hours
                query = query.filter(or_(
                    SupportTicket.hidden_from_user_at.is_(None),
                    SupportTicket.hidden_from_user_at > datetime.utcnow()
                ))
            elif admin_user:
                # If admin but user_only requested, show tickets they created
                query = query.filter(SupportTicket.user_email == admin_user.email)
                # Hide tickets that have been closed for more than 24 hours
                query = query.filter(or_(
                    SupportTicket.hidden_from_user_at.is_(None),
                    SupportTicket.hidden_from_user_at > datetime.utcnow()
                ))
        
        # Apply filters
        if status:
            query = query.filter(SupportTicket.status == TicketStatus(status))
        if priority:
            query = query.filter(SupportTicket.priority == TicketPriority(priority))
        if category_id:
            query = query.filter(SupportTicket.category_id == category_id)
        if assigned_to:
            if assigned_to == 'me':
                # Show tickets assigned to current user
                query = query.filter(SupportTicket.assigned_to == current_user_id)
            else:
                # Show tickets assigned to specific user ID
                try:
                    assigned_to_id = int(assigned_to)
                    query = query.filter(SupportTicket.assigned_to == assigned_to_id)
                except ValueError:
                    pass  # Invalid assigned_to parameter
        if search:
            query = query.filter(or_(
                SupportTicket.subject.ilike(f'%{search}%'),
                SupportTicket.description.ilike(f'%{search}%'),
                SupportTicket.ticket_number.ilike(f'%{search}%'),
                SupportTicket.user_email.ilike(f'%{search}%'),
                SupportTicket.user_name.ilike(f'%{search}%')
            ))
        
        # Apply sorting
        if hasattr(SupportTicket, sort_by):
            order_func = desc if sort_order == 'desc' else asc
            query = query.order_by(order_func(getattr(SupportTicket, sort_by)))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        tickets = pagination.items
        
        return jsonify({
            'success': True,
            'tickets': [ticket.to_dict() for ticket in tickets],
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
        logger.error(f"Error fetching tickets: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch tickets'}), 500


@support_bp.route('/support/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    """Create a new support ticket"""
    try:
        from .. import db
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Check if user is admin or regular user
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        # Determine user info
        if admin_user and data.get('user_email') and data.get('user_name'):
            # Admin creating ticket for someone else
            if not admin_user.has_permission('support.tickets.create'):
                return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
            
            user_email = data['user_email']
            user_name = data['user_name']
            user_id = data.get('user_id')
        elif regular_user:
            # Regular user creating their own ticket - no permission check needed
            user_email = regular_user.email
            user_name = regular_user.full_name or regular_user.username
            user_id = regular_user.id
        elif admin_user:
            # Admin creating ticket for themselves
            user_email = admin_user.email
            user_name = admin_user.full_name or admin_user.username
            user_id = None  # Admin users don't have user_id
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Validate required fields
        if not data.get('subject') or not data.get('description'):
            return jsonify({'success': False, 'error': 'Subject and description are required'}), 400
        
        # Create ticket
        ticket = SupportTicket(
            subject=data['subject'],
            description=data['description'],
            user_email=user_email,
            user_name=user_name,
            user_id=user_id,
            priority=TicketPriority(data.get('priority', 'medium')),
            category_id=data.get('category_id'),
            assigned_to=data.get('assigned_to') if admin_user else None  # Only admins can assign
        )
        
        # Generate ticket number
        ticket.ticket_number = ticket.generate_ticket_number()
        
        # Ensure unique ticket number
        while SupportTicket.query.filter_by(ticket_number=ticket.ticket_number).first():
            ticket.ticket_number = ticket.generate_ticket_number()
        
        db.session.add(ticket)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Support ticket created successfully',
            'ticket': ticket.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating ticket: {str(e)}")
        try:
            db.session.rollback()
        except:
            pass
        return jsonify({'success': False, 'error': 'Failed to create ticket'}), 500


@support_bp.route('/support/assignments', methods=['GET'])
@jwt_required()
@require_admin_permission('support.tickets.view')
def get_assignment_history():
    """Get assignment history for staff log (super admin only)"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        status = request.args.get('status')
        assigned_to = request.args.get('assigned_to')
        assigned_by = request.args.get('assigned_by')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query for tickets with assignment history
        query = SupportTicket.query.filter(
            SupportTicket.assigned_to.isnot(None)
        )
        
        # Apply filters
        if status:
            if isinstance(status, list):
                query = query.filter(SupportTicket.status.in_(status))
            else:
                query = query.filter(SupportTicket.status == status)
        
        if assigned_to:
            query = query.filter(SupportTicket.assigned_to == assigned_to)
        
        if assigned_by:
            # This would need to be tracked in assignment history
            # For now, we'll filter by tickets created by specific admin
            pass
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(SupportTicket.updated_at >= date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(SupportTicket.updated_at <= date_to_obj)
            except ValueError:
                pass
        
        # Get total count
        total = query.count()
        
        # Apply pagination and sorting
        query = query.order_by(desc(SupportTicket.updated_at))
        tickets = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Format response
        assignments = []
        for ticket in tickets:
            # Calculate response time
            response_time = None
            if ticket.messages:
                first_message = min(ticket.messages, key=lambda m: m.created_at)
                first_admin_reply = next((m for m in ticket.messages if m.admin_user_id is not None), None)
                
                if first_admin_reply and first_message.created_at < first_admin_reply.created_at:
                    time_diff = first_admin_reply.created_at - first_message.created_at
                    hours = int(time_diff.total_seconds() // 3600)
                    minutes = int((time_diff.total_seconds() % 3600) // 60)
                    response_time = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            # Calculate resolution time
            resolution_time = None
            if ticket.status in ['resolved', 'closed'] and ticket.updated_at:
                # This is simplified - would need more sophisticated tracking
                pass
            
            # Get assigned user email
            assigned_user_email = None
            if ticket.assigned_to:
                # Try to find admin user first
                assigned_admin = AdminUser.query.get(ticket.assigned_to)
                if assigned_admin:
                    assigned_user_email = assigned_admin.email
                else:
                    # Try to find regular user
                    assigned_user = User.query.get(ticket.assigned_to)
                    if assigned_user:
                        assigned_user_email = assigned_user.email
            
            assignment = {
                'id': ticket.id,
                'ticket_id': f"TKT-{ticket.id:03d}",
                'ticket_subject': ticket.subject,
                'assigned_by': 'System',  # Would need to track this in assignment history
                'assigned_to': assigned_user_email or f"User ID: {ticket.assigned_to}",
                'assigned_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
                'status': ticket.status.value if ticket.status else None,
                'priority': ticket.priority.value if ticket.priority else None,
                'response_time': response_time,
                'resolution_time': resolution_time,
                'customer_rating': ticket.user_rating,
                'category': ticket.category.name if ticket.category else None
            }
            assignments.append(assignment)
        
        return jsonify({
            'success': True,
            'assignments': assignments,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
        
    except Exception as e:
        logger.error(f"Error getting assignment history: {str(e)}")
        return jsonify({'error': 'Failed to get assignment history'}), 500

@support_bp.route('/support/tickets/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get a specific support ticket with messages"""
    try:
        current_user_id = get_jwt_identity()
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        # Check permissions - users can only see their own tickets unless they're support/admin
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        can_view_ticket = False
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_view_ticket = (
                admin_user.has_permission('support.tickets.view') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles) or
                ticket.user_email == admin_user.email  # Admins can see their own tickets
            )
        elif regular_user:
            can_view_ticket = ticket.user_email == regular_user.email
        
        if not can_view_ticket:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        ticket_data = ticket.to_dict()
        ticket_data['messages'] = [msg.to_dict() for msg in ticket.messages]
        ticket_data['attachments'] = [att.to_dict() for att in ticket.attachments]
        
        return jsonify({
            'success': True,
            'ticket': ticket_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch ticket'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
@require_admin_permission('support.tickets.update')
def update_ticket(ticket_id):
    """Update a support ticket"""
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'subject' in data:
            ticket.subject = data['subject']
        if 'description' in data:
            ticket.description = data['description']
        if 'status' in data:
            new_status = TicketStatus(data['status'])
            if new_status != ticket.status:
                ticket.status = new_status
                if new_status == TicketStatus.RESOLVED:
                    ticket.resolved_at = datetime.utcnow()
                elif new_status == TicketStatus.CLOSED:
                    ticket.closed_at = datetime.utcnow()
                    # Set hidden_from_user_at to 24 hours from now
                    from datetime import timedelta
                    ticket.hidden_from_user_at = datetime.utcnow() + timedelta(hours=24)
        if 'priority' in data:
            ticket.priority = TicketPriority(data['priority'])
        if 'assigned_to' in data:
            ticket.assigned_to = data['assigned_to']
        if 'category_id' in data:
            ticket.category_id = data['category_id']
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Broadcast ticket update in real-time
        try:
            update_data = {
                'status': ticket.status.value if ticket.status else None,
                'priority': ticket.priority.value if ticket.priority else None,
                'assigned_to': ticket.assigned_to,
                'category_id': ticket.category_id,
                'resolved_at': ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                'closed_at': ticket.closed_at.isoformat() if ticket.closed_at else None
            }
            realtime_chat_service.broadcast_ticket_update(ticket_id, 'ticket_updated', update_data)
            logger.info(f"Broadcasted ticket update for ticket {ticket_id}")
        except Exception as e:
            logger.error(f"Error broadcasting ticket update: {e}")
            # Don't fail the request if broadcasting fails
        
        return jsonify({
            'success': True,
            'message': 'Ticket updated successfully',
            'ticket': ticket.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update ticket'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/messages', methods=['POST'])
@jwt_required()
def add_message(ticket_id):
    """Add a message/reply to a support ticket"""
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Check permissions - users can only reply to their own tickets unless they're support/admin
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        can_reply = False
        is_admin_reply = False
        author_name = ''
        author_email = ''
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_reply = (
                admin_user.has_permission('support.tickets.reply') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles) or
                ticket.user_email == admin_user.email
            )
            is_admin_reply = admin_user.has_permission('support.tickets.reply') or 'support_agent' in user_roles
            author_name = admin_user.full_name or admin_user.username
            author_email = admin_user.email
        elif regular_user:
            can_reply = ticket.user_email == regular_user.email
            is_admin_reply = False
            author_name = regular_user.full_name or regular_user.username
            author_email = regular_user.email
        
        if not can_reply:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Check if ticket is closed or resolved and prevent user replies
        if (ticket.status == TicketStatus.CLOSED or ticket.status == TicketStatus.RESOLVED) and regular_user:
            return jsonify({'success': False, 'error': 'Cannot reply to closed or resolved tickets'}), 400
        
        if not data.get('message'):
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        # Create message
        message = SupportMessage(
            ticket_id=ticket_id,
            message=data['message'],
            is_internal=data.get('is_internal', False) and is_admin_reply,  # Only admins can create internal messages
            admin_user_id=current_user_id if admin_user else None,
            user_id=current_user_id if regular_user else None,
            author_name=author_name,
            author_email=author_email
        )
        

        
        db.session.add(message)
        
        # Update ticket status if needed
        if ticket.status == TicketStatus.OPEN:
            ticket.status = TicketStatus.IN_PROGRESS
        
        # If this is an admin reply, mark all user messages in this ticket as read
        if is_admin_reply:
            logger.info(f"Admin reply detected for ticket {ticket_id}, marking user messages as read")
            user_messages = SupportMessage.query.filter(
                and_(
                    SupportMessage.ticket_id == ticket_id,
                    SupportMessage.admin_user_id.is_(None)  # Only user messages (not admin replies)
                )
            ).all()
            
            logger.info(f"Found {len(user_messages)} user messages to mark as read")
            for user_message in user_messages:
                user_message.read_at = datetime.utcnow()
                logger.info(f"Marked message {user_message.id} as read at {user_message.read_at}")
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Broadcast new message in real-time
        try:
            message_data = message.to_dict()
            message_data['is_admin_reply'] = is_admin_reply
            realtime_chat_service.broadcast_new_message(ticket_id, message_data)
            logger.info(f"Broadcasted new message for ticket {ticket_id}")
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
            # Don't fail the request if broadcasting fails
        
        return jsonify({
            'success': True,
            'message': 'Reply added successfully',
            'reply': message.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding message to ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to add message'}), 500


@support_bp.route('/support/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all support categories"""
    try:
        from .. import db
        categories = SupportCategory.query.filter_by(is_active=True).all()
        
        return jsonify({
            'success': True,
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch categories'}), 500


@support_bp.route('/support/categories', methods=['POST'])
@jwt_required()
@require_admin_permission('support.categories.create')
def create_category():
    """Create a new support category"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'success': False, 'error': 'Category name is required'}), 400
        
        # Check if category exists
        existing = SupportCategory.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'success': False, 'error': 'Category already exists'}), 400
        
        category = SupportCategory(
            name=data['name'],
            description=data.get('description', ''),
            color=data.get('color', '#3b82f6')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create category'}), 500


@support_bp.route('/support/stats', methods=['GET'])
@jwt_required()
@require_admin_permission('support.stats.read')
def get_support_stats():
    """Get support system statistics"""
    try:
        # Basic counts
        total_tickets = SupportTicket.query.count()
        open_tickets = SupportTicket.query.filter_by(status=TicketStatus.OPEN).count()
        in_progress_tickets = SupportTicket.query.filter_by(status=TicketStatus.IN_PROGRESS).count()
        resolved_tickets = SupportTicket.query.filter_by(status=TicketStatus.RESOLVED).count()
        closed_tickets = SupportTicket.query.filter_by(status=TicketStatus.CLOSED).count()
        
        # Priority breakdown
        urgent_tickets = SupportTicket.query.filter_by(priority=TicketPriority.URGENT).count()
        high_tickets = SupportTicket.query.filter_by(priority=TicketPriority.HIGH).count()
        medium_tickets = SupportTicket.query.filter_by(priority=TicketPriority.MEDIUM).count()
        low_tickets = SupportTicket.query.filter_by(priority=TicketPriority.LOW).count()
        
        # Overdue tickets
        overdue_tickets = len([t for t in SupportTicket.query.all() if t.is_overdue])
        
        # Unassigned tickets
        unassigned_tickets = SupportTicket.query.filter_by(assigned_to=None).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'in_progress_tickets': in_progress_tickets,
                'resolved_tickets': resolved_tickets,
                'closed_tickets': closed_tickets,
                'urgent_tickets': urgent_tickets,
                'high_tickets': high_tickets,
                'medium_tickets': medium_tickets,
                'low_tickets': low_tickets,
                'overdue_tickets': overdue_tickets,
                'unassigned_tickets': unassigned_tickets
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching support stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch statistics'}), 500


@support_bp.route('/support/agents', methods=['GET'])
@jwt_required()
@require_admin_permission('support.agents.read')
def get_support_agents():
    """Get list of support agents (admin users who can handle tickets)"""
    try:
        # Get admin users with support permissions
        agents = AdminUser.query.filter_by(is_active=True).all()
        
        agent_list = []
        for agent in agents:
            # Count assigned tickets
            assigned_count = SupportTicket.query.filter_by(assigned_to=agent.id).count()
            open_assigned = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
                )
            ).count()
            
            agent_list.append({
                'id': agent.id,
                'username': agent.username,
                'email': agent.email,
                'full_name': agent.full_name,
                'assigned_tickets': assigned_count,
                'open_assigned_tickets': open_assigned
            })
        
        return jsonify({
            'success': True,
            'agents': agent_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching support agents: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch agents'}), 500


@support_bp.route('/support/tickets/unread-count', methods=['GET'])
@jwt_required()
def get_unread_message_count():
    """Get unread message count for regular users"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is regular user
        regular_user = User.query.get(current_user_id)
        if not regular_user:
            return jsonify({'success': False, 'error': 'Regular user access required'}), 403
        
        # Count unread messages for this user's tickets
        unread_count = db.session.query(SupportMessage).join(SupportTicket).filter(
            and_(
                SupportTicket.user_email == regular_user.email,
                SupportMessage.admin_user_id.isnot(None),  # Admin replies only
                SupportMessage.created_at > regular_user.last_message_read_at if regular_user.last_message_read_at else True
            )
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get unread count'}), 500


@support_bp.route('/support/tickets/new-replies', methods=['GET'])
@jwt_required()
def get_tickets_with_new_replies():
    """Get tickets with new replies for support staff"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is admin with support permissions
        admin_user = AdminUser.query.get(current_user_id)
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        # Check if user has support permissions
        user_roles = [role.name for role in admin_user.assigned_roles]
        has_support_access = (
            admin_user.has_permission('support.tickets.view') or 
            'support_agent' in user_roles or
            'support_team' in user_roles or
            any('admin' in role.lower() for role in user_roles)
        )
        
        if not has_support_access:
            return jsonify({'success': False, 'error': 'Support access required'}), 403
        
        # Get tickets with new replies (messages from regular users that haven't been read)
        tickets_with_replies = db.session.query(SupportTicket).join(SupportMessage).filter(
            and_(
                SupportMessage.admin_user_id.is_(None),  # User replies only (not admin)
                SupportMessage.read_at.is_(None)  # Only unread messages
            )
        ).distinct().all()
        
        ticket_list = []
        for ticket in tickets_with_replies:
            # Get the latest message time
            latest_message = db.session.query(SupportMessage).filter(
                SupportMessage.ticket_id == ticket.id
            ).order_by(SupportMessage.created_at.desc()).first()
            
            ticket_list.append({
                'id': ticket.id,
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'latest_message_time': latest_message.created_at.isoformat() if latest_message else None
            })
        
        logger.info(f"Found {len(ticket_list)} tickets with new replies for admin {admin_user.username} with roles: {user_roles}")
        
        return jsonify({
            'success': True,
            'tickets': ticket_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting tickets with new replies: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get tickets with new replies'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/rate', methods=['POST'])
@jwt_required()
def rate_ticket(ticket_id):
    """Rate a support ticket (user only)"""
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        # Only allow users to rate their own tickets
        current_user_id = get_jwt_identity()
        regular_user = User.query.get(current_user_id)
        
        if not regular_user or ticket.user_email != regular_user.email:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Only allow rating for closed or resolved tickets
        if ticket.status not in [TicketStatus.CLOSED, TicketStatus.RESOLVED]:
            return jsonify({'success': False, 'error': 'Can only rate closed or resolved tickets'}), 400
        
        # Check if already rated
        if ticket.user_rating is not None:
            return jsonify({'success': False, 'error': 'Ticket already rated'}), 400
        
        data = request.get_json()
        rating = data.get('rating')
        feedback = data.get('feedback', '').strip()
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'success': False, 'error': 'Rating must be between 1 and 5'}), 400
        
        # Update ticket with rating
        ticket.user_rating = rating
        ticket.user_feedback = feedback
        ticket.rated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rating submitted successfully',
            'rating': rating,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        logger.error(f"Error rating ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to submit rating'}), 500


@support_bp.route('/support/agents/stats', methods=['GET'])
@jwt_required()
@require_admin_permission('support.tickets.view')
def get_support_agent_stats():
    """Get support agent performance statistics"""
    try:
        # Get support agents - users who have handled support tickets
        from ..models.user import User
        
        # Get all users who have been assigned support tickets
        agents_with_tickets = db.session.query(User).join(SupportTicket, User.id == SupportTicket.assigned_to).distinct().all()
        
        # Also include admin users who might be support agents
        admin_users = User.query.filter_by(is_admin=True).all()
        
        # Combine and deduplicate
        all_potential_agents = list(set(agents_with_tickets + admin_users))
        
        support_agents = []
        
        for agent in all_potential_agents:
            # Get tickets assigned to this agent
            assigned_tickets = SupportTicket.query.filter(
                SupportTicket.assigned_to == agent.id
            ).all()
            
            # Only include agents who have actually handled tickets
            if len(assigned_tickets) > 0:
                # Calculate statistics
                total_tickets = len(assigned_tickets)
                closed_tickets = len([t for t in assigned_tickets if t.status == TicketStatus.CLOSED])
                resolved_tickets = len([t for t in assigned_tickets if t.status == TicketStatus.RESOLVED])
                rated_tickets = len([t for t in assigned_tickets if t.user_rating is not None])
                
                # Calculate average rating
                total_rating = sum(t.user_rating for t in assigned_tickets if t.user_rating is not None)
                avg_rating = round(total_rating / rated_tickets, 2) if rated_tickets > 0 else 0
                
                # Get recent ratings (last 30 days)
                thirty_days_ago = datetime.utcnow() - timedelta(days=30)
                recent_rated_tickets = [t for t in assigned_tickets 
                                      if t.user_rating is not None and t.rated_at and t.rated_at >= thirty_days_ago]
                recent_avg_rating = 0
                if recent_rated_tickets:
                    recent_total = sum(t.user_rating for t in recent_rated_tickets)
                    recent_avg_rating = round(recent_total / len(recent_rated_tickets), 2)
                
                # Calculate total rating points (sum of all ratings)
                total_rating_points = sum(t.user_rating for t in assigned_tickets if t.user_rating is not None)
                
                # Calculate rating breakdown
                rating_breakdown = {
                    '5_star': len([t for t in assigned_tickets if t.user_rating == 5]),
                    '4_star': len([t for t in assigned_tickets if t.user_rating == 4]),
                    '3_star': len([t for t in assigned_tickets if t.user_rating == 3]),
                    '2_star': len([t for t in assigned_tickets if t.user_rating == 2]),
                    '1_star': len([t for t in assigned_tickets if t.user_rating == 1])
                }
                
                support_agents.append({
                    'id': agent.id,
                    'username': agent.username,
                    'full_name': agent.full_name or agent.username,
                    'email': agent.email,
                    'total_tickets': total_tickets,
                    'closed_tickets': closed_tickets,
                    'resolved_tickets': resolved_tickets,
                    'rated_tickets': rated_tickets,
                    'total_rating_points': total_rating_points,
                    'average_rating': avg_rating,
                    'recent_average_rating': recent_avg_rating,
                    'completion_rate': round((closed_tickets + resolved_tickets) / total_tickets * 100, 1) if total_tickets > 0 else 0,
                    'rating_breakdown': rating_breakdown,
                    'excellence_score': round((avg_rating / 5) * 100, 1) if avg_rating > 0 else 0
                })
        
        # Sort by total rating points (descending) to show best performers first
        support_agents.sort(key=lambda x: x['total_rating_points'], reverse=True)
        
        return jsonify({
            'success': True,
            'agents': support_agents
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting support agent stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get support agent statistics'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_ticket_as_read(ticket_id):
    """Mark a ticket as read by admin"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is admin
        admin_user = AdminUser.query.get(current_user_id)
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        # Check if user has support permissions
        user_roles = [role.name for role in admin_user.assigned_roles]
        has_support_access = (
            admin_user.has_permission('support.tickets.view') or 
            'support_agent' in user_roles or
            'support_team' in user_roles or
            any('admin' in role.lower() for role in user_roles)
        )
        
        if not has_support_access:
            return jsonify({'success': False, 'error': 'Support access required'}), 403
        
        # Get the ticket
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        # Mark all user messages in this ticket as read by updating their read_at timestamp
        user_messages = SupportMessage.query.filter(
            and_(
                SupportMessage.ticket_id == ticket_id,
                SupportMessage.admin_user_id.is_(None)  # Only user messages (not admin replies)
            )
        ).all()
        
        for message in user_messages:
            message.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket marked as read'
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking ticket as read: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to mark ticket as read'}), 500


@support_bp.route('/support/tickets/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Mark all messages as read for regular user or admin"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is regular user or admin
        regular_user = User.query.get(current_user_id)
        admin_user = AdminUser.query.get(current_user_id)
        
        if regular_user:
            # For regular users: update their last message read time
            regular_user.last_message_read_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'All messages marked as read'
            }), 200
            
        elif admin_user:
            # For admin users: mark all user messages as read
            user_messages = SupportMessage.query.filter(
                SupportMessage.admin_user_id.is_(None)  # Only user messages (not admin replies)
            ).all()
            
            for message in user_messages:
                message.read_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'All tickets marked as read'
            }), 200
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
    except Exception as e:
        logger.error(f"Error marking all as read: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to mark all as read'}), 500


# File Upload Endpoints
@support_bp.route('/support/tickets/<int:ticket_id>/attachments', methods=['POST'])
@jwt_required()
def upload_attachment(ticket_id):
    """Upload file attachment to a support ticket"""
    try:
        # Check if ticket exists
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - users can only upload to their own tickets unless they're support/admin
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        can_upload = False
        is_admin_upload = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_upload = (
                admin_user.has_permission('support.tickets.reply') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles) or
                ticket.user_email == admin_user.email
            )
            is_admin_upload = admin_user.has_permission('support.tickets.reply') or 'support_agent' in user_roles
        elif regular_user:
            can_upload = ticket.user_email == regular_user.email
            is_admin_upload = False
        
        if not can_upload:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Check file size (10MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            return jsonify({'success': False, 'error': 'File too large. Maximum size is 10MB'}), 400
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'attachments')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Create attachment record
        attachment = SupportAttachment(
            ticket_id=ticket_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or 'application/octet-stream',
            uploaded_by_admin=current_user_id if is_admin_upload else None,
            uploaded_by_user=current_user_id if not is_admin_upload else None
        )
        
        db.session.add(attachment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'attachment': attachment.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error uploading attachment to ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to upload file'}), 500


@support_bp.route('/support/attachments/<int:attachment_id>', methods=['GET'])
@jwt_required()
def download_attachment(attachment_id):
    """Download a file attachment"""
    try:
        attachment = SupportAttachment.query.get(attachment_id)
        if not attachment:
            return jsonify({'success': False, 'error': 'Attachment not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - users can only download from their own tickets unless they're support/admin
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        can_download = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_download = (
                admin_user.has_permission('support.tickets.view') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles) or
                attachment.ticket.user_email == admin_user.email
            )
        elif regular_user:
            can_download = attachment.ticket.user_email == regular_user.email
        
        if not can_download:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Check if file exists
        if not os.path.exists(attachment.file_path):
            return jsonify({'success': False, 'error': 'File not found on server'}), 404
        
        return send_file(
            attachment.file_path,
            as_attachment=True,
            download_name=attachment.original_filename,
            mimetype=attachment.mime_type
        )
        
    except Exception as e:
        logger.error(f"Error downloading attachment {attachment_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to download file'}), 500


@support_bp.route('/support/attachments/<int:attachment_id>', methods=['DELETE'])
@jwt_required()
def delete_attachment(attachment_id):
    """Delete a file attachment"""
    try:
        attachment = SupportAttachment.query.get(attachment_id)
        if not attachment:
            return jsonify({'success': False, 'error': 'Attachment not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - only the uploader or support admin can delete
        admin_user = AdminUser.query.get(current_user_id)
        regular_user = User.query.get(current_user_id)
        
        can_delete = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_delete = (
                admin_user.has_permission('support.tickets.reply') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles) or
                attachment.uploaded_by_admin == current_user_id
            )
        elif regular_user:
            can_delete = attachment.uploaded_by_user == current_user_id
        
        if not can_delete:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Delete file from disk
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
        
        # Delete from database
        db.session.delete(attachment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Attachment deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting attachment {attachment_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to delete attachment'}), 500


# ============================================================================
# AI-POWERED SUPPORT ASSISTANT ENDPOINTS
# ============================================================================

@support_bp.route('/support/ai/smart-replies/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_smart_replies(ticket_id):
    """Get AI-generated smart reply suggestions for a ticket"""
    try:
        # Get ticket
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - only support agents and admins can get suggestions
        admin_user = AdminUser.query.get(current_user_id)
        can_get_suggestions = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_get_suggestions = (
                admin_user.has_permission('support.tickets.reply') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles)
            )
        
        if not can_get_suggestions:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get conversation history
        messages = SupportMessage.query.filter_by(ticket_id=ticket_id).order_by(SupportMessage.created_at).all()
        
        # Convert to list of dicts for AI service
        conversation_history = []
        for msg in messages:
            conversation_history.append({
                'message': msg.message,
                'is_admin_reply': msg.is_admin_reply,
                'created_at': msg.created_at.isoformat()
            })
        
        # Get smart replies from AI service
        suggestions = ai_service.generate_smart_replies(
            ticket_subject=ticket.subject,
            conversation_history=conversation_history,
            ticket_category=ticket.category.name if ticket.category else None
        )
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting smart replies for ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to generate suggestions'}), 500


@support_bp.route('/support/ai/analyze-sentiment', methods=['POST'])
@jwt_required()
def analyze_message_sentiment():
    """Analyze sentiment of a message"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - only support agents and admins can analyze sentiment
        admin_user = AdminUser.query.get(current_user_id)
        can_analyze = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_analyze = (
                admin_user.has_permission('support.tickets.view') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles)
            )
        
        if not can_analyze:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Analyze sentiment
        sentiment_result = ai_service.analyze_sentiment(message)
        
        return jsonify({
            'success': True,
            'sentiment': sentiment_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to analyze sentiment'}), 500


@support_bp.route('/support/ai/summarize-ticket/<int:ticket_id>', methods=['GET'])
@jwt_required()
def summarize_ticket(ticket_id):
    """Generate AI summary of a ticket conversation"""
    try:
        # Get ticket
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        current_user_id = get_jwt_identity()
        
        # Check permissions - only support agents and admins can get summaries
        admin_user = AdminUser.query.get(current_user_id)
        can_get_summary = False
        
        if admin_user:
            user_roles = [role.name for role in admin_user.assigned_roles]
            can_get_summary = (
                admin_user.has_permission('support.tickets.view') or 
                'support_agent' in user_roles or
                any('admin' in role.lower() for role in user_roles)
            )
        
        if not can_get_summary:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get conversation history
        messages = SupportMessage.query.filter_by(ticket_id=ticket_id).order_by(SupportMessage.created_at).all()
        
        # Convert to list of dicts for AI service
        conversation_history = []
        for msg in messages:
            conversation_history.append({
                'message': msg.message,
                'is_admin_reply': msg.is_admin_reply,
                'created_at': msg.created_at.isoformat()
            })
        
        # Generate summary
        summary = ai_service.summarize_ticket(conversation_history)
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        logger.error(f"Error summarizing ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to generate summary'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/assign', methods=['POST'])
@jwt_required()
@require_admin_permission('support.tickets.assign')
def assign_ticket(ticket_id):
    """Assign a ticket to a specific admin user"""
    try:
        current_admin_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'assigned_to' not in data:
            return jsonify({'success': False, 'error': 'assigned_to field is required'}), 400
        
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        # Check if admin user exists and is active
        assigned_admin = AdminUser.query.get(data['assigned_to'])
        if not assigned_admin or not assigned_admin.is_active:
            return jsonify({'success': False, 'error': 'Invalid admin user'}), 400
        
        # Check if admin has support permissions
        if not assigned_admin.has_permission('support.tickets.view'):
            return jsonify({'success': False, 'error': 'Admin user does not have support permissions'}), 400
        
        # Store previous assignment for history
        previous_assignment = ticket.assigned_to
        
        # Update assignment
        ticket.assigned_to = data['assigned_to']
        ticket.updated_at = datetime.utcnow()
        
        # Create assignment history record
        from ..models.support import TicketAssignmentHistory
        assignment_history = TicketAssignmentHistory(
            ticket_id=ticket.id,
            assigned_to=data['assigned_to'],
            assigned_by=current_admin_id,
            assigned_at=datetime.utcnow(),
            previous_assignment=previous_assignment,
            reason=data.get('reason', 'Manual assignment')
        )
        
        db.session.add(assignment_history)
        db.session.commit()
        
        # Send notifications
        try:
            from ..services.ticket_notification_service import TicketNotificationService
            notification_service = TicketNotificationService()
            notification_service.notify_ticket_assigned(ticket.id, data['assigned_to'])
        except Exception as e:
            logger.warning(f"Failed to send assignment notification: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'Ticket assigned to {assigned_admin.full_name}',
            'ticket': ticket.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error assigning ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to assign ticket'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/unassign', methods=['POST'])
@jwt_required()
@require_admin_permission('support.tickets.assign')
def unassign_ticket(ticket_id):
    """Unassign a ticket from current admin user"""
    try:
        current_admin_id = get_jwt_identity()
        data = request.get_json()
        
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        if not ticket.assigned_to:
            return jsonify({'success': False, 'error': 'Ticket is not assigned'}), 400
        
        # Store previous assignment for history
        previous_assignment = ticket.assigned_to
        
        # Unassign ticket
        ticket.assigned_to = None
        ticket.updated_at = datetime.utcnow()
        
        # Create assignment history record
        from ..models.support import TicketAssignmentHistory
        assignment_history = TicketAssignmentHistory(
            ticket_id=ticket.id,
            assigned_to=None,
            assigned_by=current_admin_id,
            assigned_at=datetime.utcnow(),
            previous_assignment=previous_assignment,
            reason=data.get('reason', 'Manual unassignment')
        )
        
        db.session.add(assignment_history)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ticket unassigned successfully',
            'ticket': ticket.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error unassigning ticket {ticket_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to unassign ticket'}), 500


@support_bp.route('/support/tickets/bulk-assign', methods=['POST'])
@jwt_required()
@require_admin_permission('support.tickets.assign')
def bulk_assign_tickets():
    """Bulk assign multiple tickets to an admin user"""
    try:
        current_admin_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'ticket_ids' not in data or 'assigned_to' not in data:
            return jsonify({'success': False, 'error': 'ticket_ids and assigned_to fields are required'}), 400
        
        ticket_ids = data['ticket_ids']
        assigned_to = data['assigned_to']
        
        if not isinstance(ticket_ids, list) or len(ticket_ids) == 0:
            return jsonify({'success': False, 'error': 'ticket_ids must be a non-empty list'}), 400
        
        # Check if admin user exists and is active
        assigned_admin = AdminUser.query.get(assigned_to)
        if not assigned_admin or not assigned_admin.is_active:
            return jsonify({'success': False, 'error': 'Invalid admin user'}), 400
        
        # Check if admin has support permissions
        if not assigned_admin.has_permission('support.tickets.view'):
            return jsonify({'success': False, 'error': 'Admin user does not have support permissions'}), 400
        
        # Get tickets
        tickets = SupportTicket.query.filter(SupportTicket.id.in_(ticket_ids)).all()
        if len(tickets) != len(ticket_ids):
            return jsonify({'success': False, 'error': 'Some tickets not found'}), 404
        
        assigned_count = 0
        for ticket in tickets:
            # Store previous assignment for history
            previous_assignment = ticket.assigned_to
            
            # Update assignment
            ticket.assigned_to = assigned_to
            ticket.updated_at = datetime.utcnow()
            
            # Create assignment history record
            from ..models.support import TicketAssignmentHistory
            assignment_history = TicketAssignmentHistory(
                ticket_id=ticket.id,
                assigned_to=assigned_to,
                assigned_by=current_admin_id,
                assigned_at=datetime.utcnow(),
                previous_assignment=previous_assignment,
                reason=data.get('reason', 'Bulk assignment')
            )
            
            db.session.add(assignment_history)
            assigned_count += 1
        
        db.session.commit()
        
        # Send notifications for each assigned ticket
        try:
            from ..services.ticket_notification_service import TicketNotificationService
            notification_service = TicketNotificationService()
            for ticket in tickets:
                try:
                    notification_service.notify_ticket_assigned(ticket.id, assigned_to)
                except Exception as notification_error:
                    logger.warning(f"Failed to send notification for ticket {ticket.id}: {str(notification_error)}")
                    # Continue with other notifications even if one fails
        except Exception as e:
            logger.warning(f"Failed to initialize notification service: {str(e)}")
            # Don't fail the assignment if notifications fail
        
        return jsonify({
            'success': True,
            'message': f'{assigned_count} tickets assigned to {assigned_admin.full_name}',
            'assigned_count': assigned_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error bulk assigning tickets: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to bulk assign tickets'}), 500


@support_bp.route('/support/tickets/bulk-delete', methods=['POST'])
@jwt_required()
@require_admin_permission('support.tickets.delete')
def bulk_delete_tickets():
    """Bulk delete multiple tickets"""
    try:
        current_admin_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'ticket_ids' not in data:
            return jsonify({'success': False, 'error': 'Ticket IDs are required'}), 400
        
        ticket_ids = data['ticket_ids']
        if not isinstance(ticket_ids, list) or len(ticket_ids) == 0:
            return jsonify({'success': False, 'error': 'At least one ticket ID is required'}), 400
        
        # Get tickets to delete
        tickets = SupportTicket.query.filter(SupportTicket.id.in_(ticket_ids)).all()
        
        if not tickets:
            return jsonify({'success': False, 'error': 'No tickets found to delete'}), 404
        
        deleted_count = 0
        for ticket in tickets:
            try:
                # Delete related records first
                from ..models.support import SupportMessage, SupportAttachment
                
                # Delete messages
                SupportMessage.query.filter_by(ticket_id=ticket.id).delete()
                
                # Delete attachments
                SupportAttachment.query.filter_by(ticket_id=ticket.id).delete()
                
                # Delete assignment history
                from ..models.support import TicketAssignmentHistory
                TicketAssignmentHistory.query.filter_by(ticket_id=ticket.id).delete()
                
                # Delete the ticket
                db.session.delete(ticket)
                deleted_count += 1
                
            except Exception as ticket_error:
                logger.error(f"Error deleting ticket {ticket.id}: {str(ticket_error)}")
                continue
        
        # Commit all changes
        db.session.commit()
        
        logger.info(f"Bulk deleted {deleted_count} tickets by admin {current_admin_id}")
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {deleted_count} ticket(s)',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error bulk deleting tickets: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to bulk delete tickets'}), 500


@support_bp.route('/support/tickets/<int:ticket_id>/assignment-history', methods=['GET'])
@jwt_required()
@require_admin_permission('support.tickets.view')
def get_ticket_assignment_history(ticket_id):
    """Get assignment history for a specific ticket"""
    try:
        ticket = SupportTicket.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'error': 'Ticket not found'}), 404
        
        # Get assignment history
        from ..models.support import TicketAssignmentHistory
        history = TicketAssignmentHistory.query.filter_by(ticket_id=ticket_id).order_by(
            TicketAssignmentHistory.assigned_at.desc()
        ).all()
        
        history_list = []
        for record in history:
            assigned_by_admin = AdminUser.query.get(record.assigned_by)
            assigned_to_admin = AdminUser.query.get(record.assigned_to) if record.assigned_to else None
            previous_admin = AdminUser.query.get(record.previous_assignment) if record.previous_assignment else None
            
            history_list.append({
                'id': record.id,
                'assigned_to': record.assigned_to,
                'assigned_to_name': assigned_to_admin.full_name if assigned_to_admin else 'Unassigned',
                'assigned_by': record.assigned_by,
                'assigned_by_name': assigned_by_admin.full_name if assigned_by_admin else 'Unknown',
                'previous_assignment': record.previous_assignment,
                'previous_assignment_name': previous_admin.full_name if previous_admin else 'Unassigned',
                'assigned_at': record.assigned_at.isoformat() if record.assigned_at else None,
                'reason': record.reason
            })
        
        return jsonify({
            'success': True,
            'history': history_list
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting assignment history for ticket {ticket_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get assignment history'}), 500


@support_bp.route('/support/tickets/auto-assign', methods=['POST'])
@jwt_required()
@require_admin_permission('support.tickets.assign')
def auto_assign_tickets():
    """Auto-assign unassigned tickets based on workload and availability"""
    try:
        current_admin_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Get unassigned tickets
        unassigned_tickets = SupportTicket.query.filter_by(assigned_to=None).filter(
            SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
        ).all()
        
        if not unassigned_tickets:
            return jsonify({
                'success': True,
                'message': 'No unassigned tickets to assign',
                'assigned_count': 0
            }), 200
        
        # Get available support agents
        available_agents = AdminUser.query.filter_by(is_active=True).all()
        support_agents = [
            agent for agent in available_agents 
            if agent.has_permission('support.tickets.view')
        ]
        
        if not support_agents:
            return jsonify({'success': False, 'error': 'No support agents available'}), 400
        
        # Calculate workload for each agent
        agent_workload = {}
        for agent in support_agents:
            open_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.OPEN
                )
            ).count()
            
            in_progress_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.IN_PROGRESS
                )
            ).count()
            
            resolved_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.RESOLVED
                )
            ).count()
            
            closed_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.CLOSED
                )
            ).count()
            
            total_assigned = open_tickets + in_progress_tickets + resolved_tickets + closed_tickets
            
            # Calculate average response time (last 30 days)
            from datetime import timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            recent_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.created_at >= thirty_days_ago
                )
            ).all()
            
            total_response_time = 0
            tickets_with_responses = 0
            
            for ticket in recent_tickets:
                first_response = SupportMessage.query.filter(
                    and_(
                        SupportMessage.ticket_id == ticket.id,
                        SupportMessage.admin_user_id.isnot(None)
                    )
                ).order_by(SupportMessage.created_at.asc()).first()
                
                if first_response:
                    response_time = (first_response.created_at - ticket.created_at).total_seconds() / 3600  # hours
                    total_response_time += response_time
                    tickets_with_responses += 1
            
            avg_response_time = total_response_time / tickets_with_responses if tickets_with_responses > 0 else 0
            
            agent_workload[agent.id] = open_tickets + in_progress_tickets
        
        # Sort agents by workload (least loaded first)
        sorted_agents = sorted(support_agents, key=lambda x: agent_workload[x.id])
        
        assigned_count = 0
        for ticket in unassigned_tickets:
            # Assign to least loaded agent
            assigned_agent = sorted_agents[assigned_count % len(sorted_agents)]
            
            # Store previous assignment for history
            previous_assignment = ticket.assigned_to
            
            # Update assignment
            ticket.assigned_to = assigned_agent.id
            ticket.updated_at = datetime.utcnow()
            
            # Create assignment history record
            from ..models.support import TicketAssignmentHistory
            assignment_history = TicketAssignmentHistory(
                ticket_id=ticket.id,
                assigned_to=assigned_agent.id,
                assigned_by=current_admin_id,
                assigned_at=datetime.utcnow(),
                previous_assignment=previous_assignment,
                reason='Auto-assignment based on workload'
            )
            
            db.session.add(assignment_history)
            assigned_count += 1
            
            # Update workload for this agent
            agent_workload[assigned_agent.id] += 1
        
        db.session.commit()
        
        # Send notifications for each assigned ticket
        try:
            from ..services.ticket_notification_service import TicketNotificationService
            notification_service = TicketNotificationService()
            for ticket in unassigned_tickets[:assigned_count]:
                notification_service.notify_ticket_assigned(ticket.id, ticket.assigned_to)
        except Exception as e:
            logger.warning(f"Failed to send auto-assignment notifications: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'{assigned_count} tickets auto-assigned',
            'assigned_count': assigned_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error auto-assigning tickets: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to auto-assign tickets'}), 500


@support_bp.route('/support/agents/workload', methods=['GET'])
@jwt_required()
@require_admin_permission('support.agents.read')
def get_agent_workload():
    """Get workload statistics for all support agents"""
    try:
        # Get all active support agents
        agents = AdminUser.query.filter_by(is_active=True).all()
        support_agents = [
            agent for agent in agents 
            if agent.has_permission('support.tickets.view')
        ]
        
        workload_data = []
        for agent in support_agents:
            # Count tickets by status
            open_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.OPEN
                )
            ).count()
            
            in_progress_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.IN_PROGRESS
                )
            ).count()
            
            resolved_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.RESOLVED
                )
            ).count()
            
            closed_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.status == TicketStatus.CLOSED
                )
            ).count()
            
            total_assigned = open_tickets + in_progress_tickets + resolved_tickets + closed_tickets
            
            # Calculate average response time (last 30 days)
            from datetime import timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            recent_tickets = SupportTicket.query.filter(
                and_(
                    SupportTicket.assigned_to == agent.id,
                    SupportTicket.created_at >= thirty_days_ago
                )
            ).all()
            
            total_response_time = 0
            tickets_with_responses = 0
            
            for ticket in recent_tickets:
                first_response = SupportMessage.query.filter(
                    and_(
                        SupportMessage.ticket_id == ticket.id,
                        SupportMessage.admin_user_id.isnot(None)
                    )
                ).order_by(SupportMessage.created_at.asc()).first()
                
                if first_response:
                    response_time = (first_response.created_at - ticket.created_at).total_seconds() / 3600  # hours
                    total_response_time += response_time
                    tickets_with_responses += 1
            
            avg_response_time = total_response_time / tickets_with_responses if tickets_with_responses > 0 else 0
            
            workload_data.append({
                'agent_id': agent.id,
                'agent_name': agent.full_name,
                'agent_username': agent.username,
                'agent_email': agent.email,
                'open_tickets': open_tickets,
                'in_progress_tickets': in_progress_tickets,
                'resolved_tickets': resolved_tickets,
                'closed_tickets': closed_tickets,
                'total_assigned': total_assigned,
                'active_workload': open_tickets + in_progress_tickets,
                'avg_response_time_hours': round(avg_response_time, 2),
                'tickets_last_30_days': len(recent_tickets)
            })
        
        # Sort by active workload (highest first)
        workload_data.sort(key=lambda x: x['active_workload'], reverse=True)
        
        return jsonify({
            'success': True,
            'workload': workload_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting agent workload: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get agent workload'}), 500
