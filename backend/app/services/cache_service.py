import json
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from .. import db
from ..models import User, UserProfile, UserSubscription
import pickle

logger = logging.getLogger(__name__)


class CacheService:
    """Service for Redis caching of frequently accessed user data"""
    
    def __init__(self):
        self.redis_client = None
        self.cache_enabled = False
        self.default_ttl = 3600  # 1 hour default TTL
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis client if available"""
        try:
            import redis
            # Configure Redis connection
            redis_host = 'localhost'  # Configure from environment
            redis_port = 6379
            redis_db = 0
            
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Test connection
            self.redis_client.ping()
            self.cache_enabled = True
            logger.info("Redis cache connection established")
            
        except ImportError:
            logger.warning("Redis not available, caching disabled")
            self.cache_enabled = False
        except Exception as e:
            logger.error(f"Redis initialization error: {e}")
            self.cache_enabled = False
    
    def _get_user_cache_key(self, user_id: int, data_type: str = 'full') -> str:
        """Generate cache key for user data"""
        return f"user:{user_id}:{data_type}"
    
    def _get_users_list_cache_key(self, filters: Dict) -> str:
        """Generate cache key for users list"""
        # Create a hash of filters for consistent cache key
        filter_str = json.dumps(filters, sort_keys=True)
        import hashlib
        filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
        return f"users:list:{filter_hash}"
    
    def _get_user_stats_cache_key(self, days: int) -> str:
        """Generate cache key for user statistics"""
        return f"users:stats:{days}"
    
    def cache_user_data(self, user: User, data_type: str = 'full', ttl: int = None) -> bool:
        """
        Cache user data in Redis
        """
        if not self.cache_enabled:
            return False
        
        try:
            cache_key = self._get_user_cache_key(user.id, data_type)
            ttl = ttl or self.default_ttl
            
            # Prepare user data based on type
            if data_type == 'basic':
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'is_admin': user.is_admin,
                    'subscription_status': user.subscription_status,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                }
            elif data_type == 'profile':
                user_data = user.to_dict()
                if hasattr(user, 'profile') and user.profile:
                    user_data['profile'] = user.profile.to_dict()
            else:  # full
                user_data = user.to_dict()
                
                # Add profile information
                if hasattr(user, 'profile') and user.profile:
                    user_data['profile'] = user.profile.to_dict()
                
                # Add subscription information
                if hasattr(user, 'subscriptions') and user.subscriptions:
                    active_subscription = next((sub for sub in user.subscriptions if sub.is_active), None)
                    user_data['active_subscription'] = active_subscription.to_dict() if active_subscription else None
                
                # Add journal count
                if hasattr(user, 'user_journals'):
                    user_data['journal_count'] = len(user.user_journals)
            
            # Cache the data
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(user_data, default=str)
            )
            
            logger.debug(f"Cached user {user.id} data (type: {data_type})")
            return True
            
        except Exception as e:
            logger.error(f"Error caching user {user.id} data: {e}")
            return False
    
    def get_cached_user_data(self, user_id: int, data_type: str = 'full') -> Optional[Dict]:
        """
        Get cached user data from Redis
        """
        if not self.cache_enabled:
            return None
        
        try:
            cache_key = self._get_user_cache_key(user_id, data_type)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                user_data = json.loads(cached_data)
                logger.debug(f"Cache hit for user {user_id} (type: {data_type})")
                return user_data
            
            logger.debug(f"Cache miss for user {user_id} (type: {data_type})")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving cached user {user_id} data: {e}")
            return None
    
    def cache_users_list(self, users: List[User], filters: Dict, ttl: int = None) -> bool:
        """
        Cache users list with filters
        """
        if not self.cache_enabled:
            return False
        
        try:
            cache_key = self._get_users_list_cache_key(filters)
            ttl = ttl or self.default_ttl
            
            # Prepare users data
            users_data = []
            for user in users:
                user_dict = user.to_dict()
                
                # Add profile information if available
                if hasattr(user, 'profile') and user.profile:
                    user_dict['profile'] = user.profile.to_dict()
                
                # Add subscription information if available
                if hasattr(user, 'subscriptions') and user.subscriptions:
                    active_subscription = next((sub for sub in user.subscriptions if sub.is_active), None)
                    user_dict['active_subscription'] = active_subscription.to_dict() if active_subscription else None
                
                # Add journal count
                if hasattr(user, 'user_journals'):
                    user_dict['journal_count'] = len(user.user_journals)
                
                users_data.append(user_dict)
            
            # Cache the data
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(users_data, default=str)
            )
            
            logger.debug(f"Cached users list with {len(users)} users")
            return True
            
        except Exception as e:
            logger.error(f"Error caching users list: {e}")
            return False
    
    def get_cached_users_list(self, filters: Dict) -> Optional[List[Dict]]:
        """
        Get cached users list
        """
        if not self.cache_enabled:
            return None
        
        try:
            cache_key = self._get_users_list_cache_key(filters)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                users_data = json.loads(cached_data)
                logger.debug(f"Cache hit for users list")
                return users_data
            
            logger.debug(f"Cache miss for users list")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving cached users list: {e}")
            return None
    
    def cache_user_statistics(self, stats: Dict, days: int, ttl: int = None) -> bool:
        """
        Cache user statistics
        """
        if not self.cache_enabled:
            return False
        
        try:
            cache_key = self._get_user_stats_cache_key(days)
            ttl = ttl or self.default_ttl
            
            # Cache the statistics
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(stats, default=str)
            )
            
            logger.debug(f"Cached user statistics for {days} days")
            return True
            
        except Exception as e:
            logger.error(f"Error caching user statistics: {e}")
            return False
    
    def get_cached_user_statistics(self, days: int) -> Optional[Dict]:
        """
        Get cached user statistics
        """
        if not self.cache_enabled:
            return None
        
        try:
            cache_key = self._get_user_stats_cache_key(days)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                stats = json.loads(cached_data)
                logger.debug(f"Cache hit for user statistics ({days} days)")
                return stats
            
            logger.debug(f"Cache miss for user statistics ({days} days)")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving cached user statistics: {e}")
            return None
    
    def invalidate_user_cache(self, user_id: int) -> bool:
        """
        Invalidate all cache entries for a specific user
        """
        if not self.cache_enabled:
            return False
        
        try:
            # Get all keys for this user
            pattern = f"user:{user_id}:*"
            keys = self.redis_client.keys(pattern)
            
            if keys:
                self.redis_client.delete(*keys)
                logger.debug(f"Invalidated {len(keys)} cache entries for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating cache for user {user_id}: {e}")
            return False
    
    def invalidate_users_list_cache(self) -> bool:
        """
        Invalidate all users list cache entries
        """
        if not self.cache_enabled:
            return False
        
        try:
            pattern = "users:list:*"
            keys = self.redis_client.keys(pattern)
            
            if keys:
                self.redis_client.delete(*keys)
                logger.debug(f"Invalidated {len(keys)} users list cache entries")
            
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating users list cache: {e}")
            return False
    
    def invalidate_user_statistics_cache(self) -> bool:
        """
        Invalidate all user statistics cache entries
        """
        if not self.cache_enabled:
            return False
        
        try:
            pattern = "users:stats:*"
            keys = self.redis_client.keys(pattern)
            
            if keys:
                self.redis_client.delete(*keys)
                logger.debug(f"Invalidated {len(keys)} user statistics cache entries")
            
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating user statistics cache: {e}")
            return False
    
    def clear_all_cache(self) -> bool:
        """
        Clear all cache entries
        """
        if not self.cache_enabled:
            return False
        
        try:
            self.redis_client.flushdb()
            logger.info("Cleared all cache entries")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    def get_cache_stats(self) -> Dict:
        """
        Get cache statistics
        """
        if not self.cache_enabled:
            return {'enabled': False}
        
        try:
            info = self.redis_client.info()
            return {
                'enabled': True,
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', '0B'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'total_commands_processed': info.get('total_commands_processed', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'enabled': True, 'error': str(e)}


# Global cache service instance
cache_service = CacheService()

