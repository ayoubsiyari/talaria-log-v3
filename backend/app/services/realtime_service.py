"""
Real-time service for broadcasting updates to users
"""

from typing import Dict, List, Any
from datetime import datetime
import json

class RealtimeService:
    """Service for managing real-time updates"""
    
    def __init__(self):
        self.subscribers = {}  # plan_id -> list of user_ids
        self.update_queue = []  # Queue of updates to broadcast
    
    def subscribe_user_to_plan(self, user_id: int, plan_id: int):
        """Subscribe a user to receive updates for a specific plan"""
        if plan_id not in self.subscribers:
            self.subscribers[plan_id] = set()
        self.subscribers[plan_id].add(user_id)
    
    def unsubscribe_user_from_plan(self, user_id: int, plan_id: int):
        """Unsubscribe a user from plan updates"""
        if plan_id in self.subscribers:
            self.subscribers[plan_id].discard(user_id)
            if not self.subscribers[plan_id]:
                del self.subscribers[plan_id]
    
    def broadcast_plan_update(self, plan_id: int, update_type: str, data: Dict[str, Any]):
        """Broadcast an update to all users subscribed to a plan"""
        if plan_id not in self.subscribers:
            return
        
        update = {
            'type': 'plan_update',
            'plan_id': plan_id,
            'update_type': update_type,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add to queue for polling
        self.update_queue.append({
            'plan_id': plan_id,
            'user_ids': list(self.subscribers[plan_id]),
            'update': update
        })
        
        # Keep only last 100 updates to prevent memory issues
        if len(self.update_queue) > 100:
            self.update_queue = self.update_queue[-100:]
    
    def get_updates_for_user(self, user_id: int, since: datetime = None):
        """Get all updates for a specific user since a given time"""
        updates = []
        
        for update_item in self.update_queue:
            if user_id in update_item['user_ids']:
                if since is None or datetime.fromisoformat(update_item['update']['timestamp']) > since:
                    updates.append(update_item['update'])
        
        return updates
    
    def get_plan_subscribers(self, plan_id: int) -> List[int]:
        """Get all user IDs subscribed to a plan"""
        return list(self.subscribers.get(plan_id, []))

# Global instance
realtime_service = RealtimeService()

