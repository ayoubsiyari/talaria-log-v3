"""
Real-time chat service for ticket messages
"""

import json
import logging
from typing import Dict, Set, Optional, Any, List
from datetime import datetime
import threading
import time

logger = logging.getLogger(__name__)

class RealtimeChatService:
    """Service for real-time chat functionality in support tickets"""
    
    def __init__(self, socketio=None):
        logger.info(f"Creating RealtimeChatService with SocketIO: {socketio is not None} (type: {type(socketio).__name__ if socketio else 'None'})")
        self.socketio = socketio
        self._lock = threading.RLock()  # Use RLock for nested locking
        self.connected_clients: Dict[str, Dict] = {}  # client_id -> client_info
        self.ticket_rooms: Dict[int, Set[str]] = {}  # ticket_id -> set of client_ids
        self.user_rooms: Dict[int, Set[str]] = {}  # user_id -> set of client_ids
        self.admin_rooms: Set[str] = set()  # admin room names
        self.typing_users: Dict[int, Dict] = {}  # ticket_id -> {user_id: typing_info}
        self.message_status: Dict[str, str] = {}  # message_id -> status (sent, delivered, read)
        self._cleanup_timer = None  # Background cleanup timer
        
        if socketio:
            logger.info("Setting up SocketIO event handlers...")
            self._setup_event_handlers()
            # Start periodic cleanup with threading timer
            self._start_periodic_cleanup()
            logger.info("SocketIO event handlers and cleanup setup complete")
        else:
            logger.warning("No SocketIO provided - real-time features will be disabled")
    
    def _setup_event_handlers(self):
        """Setup WebSocket event handlers for chat"""
        try:
            from flask_socketio import emit, join_room, leave_room
            from flask import request
            
            @self.socketio.on('connect')
            def handle_connect():
                """Handle client connection"""
                client_id = request.sid
                with self._lock:
                    self.connected_clients[client_id] = {
                        'connected_at': datetime.utcnow(),
                        'user_id': None,
                        'is_admin': False,
                        'rooms': set(),
                        'ticket_rooms': set()
                    }
                logger.info(f"Chat client connected: {client_id}")
                emit('chat_connected', {'client_id': client_id})
            
            @self.socketio.on('disconnect')
            def handle_disconnect():
                """Handle client disconnection"""
                client_id = request.sid
                with self._lock:
                    if client_id in self.connected_clients:
                        client_info = self.connected_clients[client_id]
                        user_id = client_info.get('user_id')
                        
                        # Remove from all rooms
                        for room in client_info.get('rooms', set()):
                            leave_room(room)
                        
                        # Remove from ticket rooms
                        for ticket_id in client_info.get('ticket_rooms', set()):
                            if ticket_id in self.ticket_rooms:
                                self.ticket_rooms[ticket_id].discard(client_id)
                                if not self.ticket_rooms[ticket_id]:
                                    del self.ticket_rooms[ticket_id]
                        
                        # Remove from user rooms
                        if user_id and user_id in self.user_rooms:
                            self.user_rooms[user_id].discard(client_id)
                            if not self.user_rooms[user_id]:
                                del self.user_rooms[user_id]
                        
                        # Remove from admin rooms
                        for room in client_info.get('rooms', set()):
                            if room.startswith('admin_'):
                                self.admin_rooms.discard(room)
                        
                        # Clean up client info
                        del self.connected_clients[client_id]
                
                logger.info(f"Chat client disconnected: {client_id}")
            
            @self.socketio.on('chat_authenticate')
            def handle_chat_authenticate(data):
                """Handle chat authentication"""
                client_id = request.sid
                token = data.get('token')
                
                if not token:
                    emit('error', {'message': 'Authentication token required'})
                    return
                
                # Verify JWT token and extract user info
                try:
                    from flask_jwt_extended import decode_token
                    from app.models.admin import AdminUser
                        
                    decoded = decode_token(token)
                    user_id = decoded.get('sub')  # or 'identity' depending on your JWT structure
                        
                    # Check if user is admin from database
                    is_admin = AdminUser.query.filter_by(id=user_id).first() is not None
                except Exception as e:
                    emit('error', {'message': 'Invalid authentication token'})
                    logger.error(f"Authentication failed: {e}")
                    return
                
                if client_id in self.connected_clients:
                    self.connected_clients[client_id].update({
                        'user_id': user_id,
                        'is_admin': is_admin,
                        'authenticated_at': datetime.utcnow()
                    })
                    
                    # Add to user room
                    if user_id:
                        if user_id not in self.user_rooms:
                            self.user_rooms[user_id] = set()
                        self.user_rooms[user_id].add(client_id)
                    
                    # Add to admin room if admin
                    if is_admin:
                        admin_room = 'admin_support'
                        join_room(admin_room)
                        self.admin_rooms.add(admin_room)
                        self.connected_clients[client_id]['rooms'].add(admin_room)
                    
                    emit('chat_authenticated', {
                        'user_id': user_id,
                        'is_admin': is_admin,
                        'client_id': client_id
                    })
                    
                    logger.info(f"Chat client authenticated: {client_id} (user_id: {user_id}, admin: {is_admin})")
            
            @self.socketio.on('join_ticket_chat')
            def handle_join_ticket_chat(data):
                """Handle joining a ticket chat room"""
                client_id = request.sid
                ticket_id = data.get('ticket_id')
                user_id = data.get('user_id')
                
                # Validate inputs
                if not ticket_id or not user_id:
                    emit('error', {'message': 'Missing ticket_id or user_id'})
                    return
                
                try:
                    ticket_id = int(ticket_id)
                    user_id = int(user_id)
                    if ticket_id <= 0 or user_id <= 0:
                        raise ValueError("IDs must be positive")
                except (ValueError, TypeError):
                    emit('error', {'message': 'Invalid ticket_id or user_id'})
                    return
                
                # Verify user has access to this ticket
                if not self._verify_ticket_access(ticket_id, user_id, client_id):
                    emit('error', {'message': 'Access denied to ticket'})
                    return
                
                # Join ticket room
                room_name = f'ticket_{ticket_id}'
                join_room(room_name)
                
                with self._lock:
                    if ticket_id not in self.ticket_rooms:
                        self.ticket_rooms[ticket_id] = set()
                    self.ticket_rooms[ticket_id].add(client_id)
                    
                    self.connected_clients[client_id]['ticket_rooms'].add(ticket_id)
                    self.connected_clients[client_id]['rooms'].add(room_name)
                    
                    participants_count = len(self.ticket_rooms[ticket_id])
                
                emit('ticket_chat_joined', {
                    'ticket_id': ticket_id,
                    'room': room_name,
                    'participants': participants_count
                })
                
                logger.info(f"Client {client_id} joined ticket chat {ticket_id}")
            
            @self.socketio.on('leave_ticket_chat')
            def handle_leave_ticket_chat(data):
                """Handle leaving a ticket chat room"""
                client_id = request.sid
                ticket_id = data.get('ticket_id')
                
                if ticket_id and client_id in self.connected_clients:
                    room_name = f'ticket_{ticket_id}'
                    leave_room(room_name)
                    
                    with self._lock:
                        if ticket_id in self.ticket_rooms:
                            self.ticket_rooms[ticket_id].discard(client_id)
                            if not self.ticket_rooms[ticket_id]:
                                del self.ticket_rooms[ticket_id]
                        
                        self.connected_clients[client_id]['ticket_rooms'].discard(ticket_id)
                        self.connected_clients[client_id]['rooms'].discard(room_name)
                    
                    emit('ticket_chat_left', {
                        'ticket_id': ticket_id,
                        'room': room_name
                    })
                    
                    logger.info(f"Client {client_id} left ticket chat {ticket_id}")
            
            @self.socketio.on('typing_start')
            def handle_typing_start(data):
                """Handle typing start indicator"""
                client_id = request.sid
                ticket_id = data.get('ticket_id')
                user_id = data.get('user_id')
                user_name = data.get('user_name', 'Someone')
                
                if not ticket_id or not user_id:
                    return
                
                # Update typing status
                with self._lock:
                    if ticket_id not in self.typing_users:
                        self.typing_users[ticket_id] = {}
                    
                    self.typing_users[ticket_id][user_id] = {
                        'user_name': user_name,
                        'started_at': datetime.utcnow(),
                        'client_id': client_id
                    }
                
                # Broadcast to other users in the ticket
                self.socketio.emit('user_typing', {
                    'ticket_id': ticket_id,
                    'user_id': user_id,
                    'user_name': user_name,
                    'is_typing': True
                }, room=f'ticket_{ticket_id}', include_self=False)
            
            @self.socketio.on('typing_stop')
            def handle_typing_stop(data):
                """Handle typing stop indicator"""
                client_id = request.sid
                ticket_id = data.get('ticket_id')
                user_id = data.get('user_id')
                
                if not ticket_id or not user_id:
                    return
                
                # Remove typing status
                with self._lock:
                    if ticket_id in self.typing_users and user_id in self.typing_users[ticket_id]:
                        del self.typing_users[ticket_id][user_id]
                        if not self.typing_users[ticket_id]:
                            del self.typing_users[ticket_id]
                
                # Broadcast to other users in the ticket
                self.socketio.emit('user_typing', {
                    'ticket_id': ticket_id,
                    'user_id': user_id,
                    'is_typing': False
                }, room=f'ticket_{ticket_id}', include_self=False)
            
            @self.socketio.on('mark_messages_read')
            def handle_mark_messages_read(data):
                """Handle marking messages as read"""
                client_id = request.sid
                ticket_id = data.get('ticket_id')
                user_id = data.get('user_id')
                message_ids = data.get('message_ids', [])
                
                if not ticket_id or not user_id:
                    return
                
                # Update message status
                with self._lock:
                    for message_id in message_ids:
                        self.message_status[message_id] = 'read'
                
                # Broadcast read status to other users
                self.socketio.emit('messages_read', {
                    'ticket_id': ticket_id,
                    'user_id': user_id,
                    'message_ids': message_ids
                }, room=f'ticket_{ticket_id}', include_self=False)
            
        except Exception as e:
            logger.error(f"Error setting up event handlers: {e}")
    
    def _verify_ticket_access(self, ticket_id: int, user_id: int, client_id: str) -> bool:
        """Verify if user has access to the ticket"""
        try:
            from app.models.support import SupportTicket
            from app.models.user import User
            from app.models.admin import AdminUser
            
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False
            
            # Get client info to check if this is an admin session
            client_info = self.connected_clients.get(client_id, {})
            is_admin = client_info.get('is_admin', False)
            
            # Check if user is admin
            if is_admin:
                admin_user = AdminUser.query.get(user_id)
                if admin_user:
                    # Admin users can access any ticket
                    return True
            
            # Check if user is the ticket owner
            regular_user = User.query.get(user_id)
            if regular_user and ticket.user_email == regular_user.email:
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error verifying ticket access: {e}")
            return False
    
    def broadcast_new_message(self, ticket_id: int, message_data: Dict[str, Any]):
        """Broadcast a new message to all users in the ticket"""
        if not self.socketio:
            logger.debug(f"No SocketIO available, skipping broadcast for ticket {ticket_id}")
            return
        
        try:
            room_name = f'ticket_{ticket_id}'
            
            # Add message status
            message_id = message_data.get('id')
            if message_id:
                with self._lock:
                    self.message_status[message_id] = 'sent'
            
            # Broadcast to all users in the ticket room
            self.socketio.emit('new_message', {
                'ticket_id': ticket_id,
                'message': message_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room_name)
            
            # Also broadcast to admin room for notifications
            self.socketio.emit('ticket_message_notification', {
                'ticket_id': ticket_id,
                'message': message_data,
                'is_admin_reply': message_data.get('is_admin_reply', False)
            }, room='admin_support')
            
            logger.info(f"Broadcasted new message for ticket {ticket_id}")
        except Exception as e:
            logger.error(f"Error broadcasting message for ticket {ticket_id}: {e}")
    
    def broadcast_message_status(self, ticket_id: int, message_id: str, status: str):
        """Broadcast message status update"""
        if not self.socketio:
            return
        
        with self._lock:
            self.message_status[message_id] = status
        
        room_name = f'ticket_{ticket_id}'
        self.socketio.emit('message_status_update', {
            'ticket_id': ticket_id,
            'message_id': message_id,
            'status': status,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name)
    
    def broadcast_ticket_update(self, ticket_id: int, update_type: str, data: Dict[str, Any]):
        """Broadcast ticket status/assignment updates"""
        if not self.socketio:
            return
        
        room_name = f'ticket_{ticket_id}'
        self.socketio.emit('ticket_update', {
            'ticket_id': ticket_id,
            'update_type': update_type,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name)
        
        # Also broadcast to admin room
        self.socketio.emit('ticket_update_notification', {
            'ticket_id': ticket_id,
            'update_type': update_type,
            'data': data
        }, room='admin_support')
    
    def get_typing_users(self, ticket_id: int) -> List[Dict[str, Any]]:
        """Get current typing users for a ticket"""
        with self._lock:
            if ticket_id not in self.typing_users:
                return []
            
            typing_list = []
            current_time = datetime.utcnow()
            
            for user_id, typing_info in self.typing_users[ticket_id].items():
                # Remove stale typing indicators (older than 10 seconds)
                if (current_time - typing_info['started_at']).total_seconds() > 10:
                    del self.typing_users[ticket_id][user_id]
                    continue
                
                typing_list.append({
                    'user_id': user_id,
                    'user_name': typing_info['user_name'],
                    'started_at': typing_info['started_at'].isoformat()
                })
        
        return typing_list
    
    def get_connected_users(self, ticket_id: int) -> List[Dict[str, Any]]:
        """Get connected users for a ticket"""
        with self._lock:
            if ticket_id not in self.ticket_rooms:
                return []
            
            connected_users = []
            for client_id in self.ticket_rooms[ticket_id]:
                if client_id in self.connected_clients:
                    client_info = self.connected_clients[client_id]
                    connected_users.append({
                        'user_id': client_info.get('user_id'),
                        'is_admin': client_info.get('is_admin', False),
                        'connected_at': client_info.get('connected_at').isoformat() if client_info.get('connected_at') else None
                    })
        
        return connected_users
    
    def cleanup_stale_connections(self):
        """Clean up stale connections and typing indicators"""
        current_time = datetime.utcnow()
        
        with self._lock:
            # Clean up stale typing indicators
            for ticket_id in list(self.typing_users.keys()):
                for user_id in list(self.typing_users[ticket_id].keys()):
                    if (current_time - self.typing_users[ticket_id][user_id]['started_at']).total_seconds() > 30:
                        del self.typing_users[ticket_id][user_id]
                if not self.typing_users[ticket_id]:
                    del self.typing_users[ticket_id]
    
    def _start_periodic_cleanup(self, interval: int = 30):
        """Start periodic cleanup with threading timer"""
        def cleanup_task():
            try:
                self.cleanup_stale_connections()
                logger.debug("Performed periodic cleanup of stale connections")
                # Schedule next cleanup
                self._cleanup_timer = threading.Timer(interval, cleanup_task)
                self._cleanup_timer.daemon = True
                self._cleanup_timer.start()
            except Exception as e:
                logger.error(f"Error in periodic cleanup task: {e}")
        
        # Start first cleanup
        self._cleanup_timer = threading.Timer(interval, cleanup_task)
        self._cleanup_timer.daemon = True
        self._cleanup_timer.start()
    
    def stop(self):
        """Stop the service and cancel background tasks"""
        if self._cleanup_timer:
            self._cleanup_timer.cancel()
            self._cleanup_timer = None
            logger.info("Real-time chat service stopped")
    
    def close(self):
        """Alias for stop method for compatibility"""
        self.stop()


# Global real-time chat service instance (initialized without SocketIO initially)
realtime_chat_service = RealtimeChatService(None)


def initialize_realtime_chat_service(socketio=None):
    """Initialize the global real-time chat service"""
    global realtime_chat_service
    try:
        logger.info(f"Initializing chat service with SocketIO: {socketio is not None} (type: {type(socketio).__name__ if socketio else 'None'})")
        
        if socketio is None:
            logger.warning("No SocketIO instance provided to realtime chat service")
            # Still create a service but with no SocketIO for graceful degradation
            realtime_chat_service = RealtimeChatService(None)
            return
        
        # Stop existing service if running
        if hasattr(realtime_chat_service, 'stop'):
            realtime_chat_service.stop()
        
        realtime_chat_service = RealtimeChatService(socketio)
        logger.info("Real-time chat service initialized successfully with SocketIO")
        
        # Verify the assignment worked
        if realtime_chat_service.socketio is not None:
            logger.info("✅ SocketIO successfully assigned to chat service")
        else:
            logger.warning("⚠️ SocketIO assignment failed - service will work without real-time features")
            
    except Exception as e:
        logger.error(f"Failed to initialize real-time chat service: {e}")
        # Create a dummy service for graceful degradation
        realtime_chat_service = RealtimeChatService(None)

