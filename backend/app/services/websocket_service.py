import json
import logging
from typing import Dict, Set, Optional, Any
from datetime import datetime
import threading
import time

logger = logging.getLogger(__name__)


class WebSocketService:
    """Service for WebSocket connections and real-time user status updates"""
    
    def __init__(self, socketio=None):
        self.socketio = socketio
        self.connected_clients: Dict[str, Dict] = {}  # client_id -> client_info
        self.admin_rooms: Set[str] = set()  # admin room names
        self.user_status_cache: Dict[int, Dict] = {}  # user_id -> status_info
        self._start_status_monitor()
        
        if socketio:
            self._setup_event_handlers()
    
    def _setup_event_handlers(self):
        """Setup WebSocket event handlers"""
        try:
            from flask_socketio import emit, join_room, leave_room
            from flask import request
            
            @self.socketio.on('connect')
            def handle_connect():
                """Handle client connection"""
                client_id = request.sid
                self.connected_clients[client_id] = {
                    'connected_at': datetime.utcnow(),
                    'user_id': None,
                    'is_admin': False,
                    'rooms': set()
                }
                logger.info(f"Client connected: {client_id}")
                emit('connected', {'client_id': client_id})
            
            @self.socketio.on('disconnect')
            def handle_disconnect():
                """Handle client disconnection"""
                client_id = request.sid
                if client_id in self.connected_clients:
                    client_info = self.connected_clients[client_id]
                    user_id = client_info.get('user_id')
                    
                    # Update user status to offline
                    if user_id:
                        self._update_user_status(user_id, 'offline')
                    
                    # Leave all rooms
                    for room in client_info.get('rooms', []):
                        leave_room(room)
                    
                    del self.connected_clients[client_id]
                    logger.info(f"Client disconnected: {client_id}")
            
            @self.socketio.on('authenticate')
            def handle_authenticate(data):
                """Handle client authentication"""
                client_id = request.sid
                user_id = data.get('user_id')
                is_admin = data.get('is_admin', False)
                
                if client_id in self.connected_clients:
                    self.connected_clients[client_id]['user_id'] = user_id
                    self.connected_clients[client_id]['is_admin'] = is_admin
                    
                    # Join user-specific room
                    user_room = f"user_{user_id}"
                    join_room(user_room)
                    self.connected_clients[client_id]['rooms'].add(user_room)
                    
                    # Join admin room if admin
                    if is_admin:
                        admin_room = "admin_dashboard"
                        join_room(admin_room)
                        self.connected_clients[client_id]['rooms'].add(admin_room)
                        self.admin_rooms.add(admin_room)
                    
                    # Update user status to online
                    self._update_user_status(user_id, 'online')
                    
                    emit('authenticated', {
                        'user_id': user_id,
                        'is_admin': is_admin,
                        'rooms': list(self.connected_clients[client_id]['rooms'])
                    })
                    
                    logger.info(f"Client authenticated: {client_id} (user_id: {user_id}, admin: {is_admin})")
            
            @self.socketio.on('join_room')
            def handle_join_room(data):
                """Handle room joining"""
                client_id = request.sid
                room = data.get('room')
                
                if room and client_id in self.connected_clients:
                    join_room(room)
                    self.connected_clients[client_id]['rooms'].add(room)
                    emit('room_joined', {'room': room})
                    logger.debug(f"Client {client_id} joined room: {room}")
            
            @self.socketio.on('leave_room')
            def handle_leave_room(data):
                """Handle room leaving"""
                client_id = request.sid
                room = data.get('room')
                
                if room and client_id in self.connected_clients:
                    leave_room(room)
                    self.connected_clients[client_id]['rooms'].discard(room)
                    emit('room_left', {'room': room})
                    logger.debug(f"Client {client_id} left room: {room}")
            
            @self.socketio.on('user_status_request')
            def handle_user_status_request(data):
                """Handle user status request"""
                client_id = request.sid
                user_ids = data.get('user_ids', [])
                
                if client_id in self.connected_clients and self.connected_clients[client_id].get('is_admin'):
                    statuses = {}
                    for user_id in user_ids:
                        statuses[user_id] = self.user_status_cache.get(user_id, {'status': 'unknown'})
                    
                    emit('user_statuses', {'statuses': statuses})
                    
        except ImportError:
            logger.warning("Flask-SocketIO not available, WebSocket functionality disabled")
        except Exception as e:
            logger.error(f"Error setting up WebSocket handlers: {e}")
    
    def _update_user_status(self, user_id: int, status: str, additional_data: Dict = None):
        """Update user status and broadcast to admin clients"""
        try:
            # Update status cache
            self.user_status_cache[user_id] = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat(),
                **(additional_data or {})
            }
            
            # Broadcast to admin clients if SocketIO is available
            if self.socketio:
                self.socketio.emit('user_status_update', {
                    'user_id': user_id,
                    'status': status,
                    'updated_at': self.user_status_cache[user_id]['updated_at'],
                    **(additional_data or {})
                }, room='admin_dashboard')
            
            logger.debug(f"Updated user {user_id} status to: {status}")
            
        except Exception as e:
            logger.error(f"Error updating user status: {e}")
    
    def _start_status_monitor(self):
        """Start background thread to monitor user status"""
        def monitor_status():
            while True:
                try:
                    # Check for inactive users (no activity for 5 minutes)
                    current_time = datetime.utcnow()
                    inactive_threshold = 300  # 5 minutes
                    
                    for user_id, status_info in self.user_status_cache.items():
                        if status_info['status'] == 'online':
                            last_update = datetime.fromisoformat(status_info['updated_at'])
                            if (current_time - last_update).total_seconds() > inactive_threshold:
                                self._update_user_status(user_id, 'inactive')
                    
                    time.sleep(60)  # Check every minute
                    
                except Exception as e:
                    logger.error(f"Error in status monitor: {e}")
                    time.sleep(60)
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=monitor_status, daemon=True)
        monitor_thread.start()
        logger.info("Started user status monitoring thread")
    
    def broadcast_user_update(self, user_id: int, update_type: str, data: Dict):
        """Broadcast user update to admin clients"""
        try:
            message = {
                'user_id': user_id,
                'update_type': update_type,
                'timestamp': datetime.utcnow().isoformat(),
                'data': data
            }
            
            if self.socketio:
                self.socketio.emit('user_update', message, room='admin_dashboard')
                logger.info(f"Broadcasted user update: {update_type} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error broadcasting user update: {e}")
    
    def broadcast_admin_action(self, admin_user_id: int, action: str, target_type: str, target_id: str, details: Dict = None):
        """Broadcast admin action to admin clients"""
        try:
            message = {
                'admin_user_id': admin_user_id,
                'action': action,
                'target_type': target_type,
                'target_id': target_id,
                'timestamp': datetime.utcnow().isoformat(),
                'details': details or {}
            }
            
            if self.socketio:
                self.socketio.emit('admin_action', message, room='admin_dashboard')
                logger.info(f"Broadcasted admin action: {action} by admin {admin_user_id}")
            
        except Exception as e:
            logger.error(f"Error broadcasting admin action: {e}")
    
    def send_user_notification(self, user_id: int, notification_type: str, message: str, data: Dict = None):
        """Send notification to specific user"""
        try:
            notification = {
                'type': notification_type,
                'message': message,
                'timestamp': datetime.utcnow().isoformat(),
                'data': data or {}
            }
            
            if self.socketio:
                self.socketio.emit('notification', notification, room=f"user_{user_id}")
                logger.info(f"Sent notification to user {user_id}: {notification_type}")
            
        except Exception as e:
            logger.error(f"Error sending user notification: {e}")
    
    def get_connected_clients_info(self) -> Dict:
        """Get information about connected clients"""
        return {
            'total_clients': len(self.connected_clients),
            'admin_clients': len([c for c in self.connected_clients.values() if c.get('is_admin')]),
            'user_clients': len([c for c in self.connected_clients.values() if not c.get('is_admin')]),
            'online_users': len([uid for uid, status in self.user_status_cache.items() if status['status'] == 'online']),
            'inactive_users': len([uid for uid, status in self.user_status_cache.items() if status['status'] == 'inactive'])
        }
    
    def get_user_status(self, user_id: int) -> Optional[Dict]:
        """Get current status of a user"""
        return self.user_status_cache.get(user_id)
    
    def get_all_user_statuses(self) -> Dict:
        """Get status of all tracked users"""
        return self.user_status_cache.copy()


# Global WebSocket service instance (will be initialized when SocketIO is available)
websocket_service = WebSocketService()


def initialize_websocket_service(socketio=None):
    """Initialize the global WebSocket service"""
    global websocket_service
    websocket_service = WebSocketService(socketio)
    logger.info("WebSocket service initialized")
