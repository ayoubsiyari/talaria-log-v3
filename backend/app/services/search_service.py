from sqlalchemy import func, and_, or_, desc, asc
from ..models import User, UserProfile, UserSubscription
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging
import json
import re

logger = logging.getLogger(__name__)


class SearchService:
    """Service for advanced search functionality with Elasticsearch integration"""
    
    def __init__(self):
        self.elasticsearch_client = None
        self.elasticsearch_enabled = False
        self._initialize_elasticsearch()
    
    def _initialize_elasticsearch(self):
        """Initialize Elasticsearch client if available"""
        try:
            from elasticsearch import Elasticsearch
            # Configure Elasticsearch connection
            es_host = 'localhost'  # Configure from environment
            es_port = 9200
            self.elasticsearch_client = Elasticsearch([{'host': es_host, 'port': es_port}])
            
            # Test connection
            if self.elasticsearch_client.ping():
                self.elasticsearch_enabled = True
                logger.info("Elasticsearch connection established")
                self._setup_indexes()
            else:
                logger.warning("Elasticsearch connection failed, falling back to database search")
                self.elasticsearch_enabled = False
        except ImportError:
            logger.warning("Elasticsearch not available, using database search")
            self.elasticsearch_enabled = False
        except Exception as e:
            logger.error(f"Elasticsearch initialization error: {e}")
            self.elasticsearch_enabled = False
    
    def _setup_indexes(self):
        """Setup Elasticsearch indexes for users"""
        if not self.elasticsearch_enabled:
            return
        
        try:
            # User index mapping
            user_mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "integer"},
                        "username": {"type": "text", "analyzer": "standard"},
                        "email": {"type": "keyword"},
                        "first_name": {"type": "text", "analyzer": "standard"},
                        "last_name": {"type": "text", "analyzer": "standard"},
                        "subscription_status": {"type": "keyword"},
                        "is_active": {"type": "boolean"},
                        "is_verified": {"type": "boolean"},
                        "is_admin": {"type": "boolean"},
                        "created_at": {"type": "date"},
                        "last_login": {"type": "date"},
                        "profile": {
                            "properties": {
                                "bio": {"type": "text", "analyzer": "standard"},
                                "trading_experience": {"type": "keyword"},
                                "preferred_markets": {"type": "text", "analyzer": "standard"},
                                "risk_tolerance": {"type": "keyword"},
                                "investment_goals": {"type": "text", "analyzer": "standard"},
                                "country": {"type": "keyword"},
                                "city": {"type": "keyword"},
                                "timezone": {"type": "keyword"}
                            }
                        },
                        "subscriptions": {
                            "properties": {
                                "plan_name": {"type": "keyword"},
                                "status": {"type": "keyword"},
                                "amount": {"type": "float"}
                            }
                        },
                        "journals": {
                            "properties": {
                                "title": {"type": "text", "analyzer": "standard"},
                                "description": {"type": "text", "analyzer": "standard"},
                                "journal_type": {"type": "keyword"},
                                "tags": {"type": "text", "analyzer": "standard"}
                            }
                        }
                    }
                }
            }
            
            # Create user index if it doesn't exist
            if not self.elasticsearch_client.indices.exists(index="users"):
                self.elasticsearch_client.indices.create(
                    index="users",
                    body=user_mapping
                )
                logger.info("Created Elasticsearch users index")
        
        except Exception as e:
            logger.error(f"Error setting up Elasticsearch indexes: {e}")
            self.elasticsearch_enabled = False
    
    def index_user(self, user: User):
        """Index a user in Elasticsearch"""
        if not self.elasticsearch_enabled:
            return
        
        try:
            # Prepare user document
            user_doc = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "subscription_status": user.subscription_status,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "is_admin": user.is_admin,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            
            # Add profile information
            if hasattr(user, 'profile') and user.profile:
                user_doc["profile"] = {
                    "bio": user.profile.bio,
                    "trading_experience": user.profile.trading_experience,
                    "preferred_markets": user.profile.preferred_markets,
                    "risk_tolerance": user.profile.risk_tolerance,
                    "investment_goals": user.profile.investment_goals,
                    "country": user.profile.country,
                    "city": user.profile.city,
                    "timezone": user.profile.timezone
                }
            
            # Add subscription information
            if hasattr(user, 'subscriptions') and user.subscriptions:
                user_doc["subscriptions"] = [
                    {
                        "plan_name": sub.plan_name,
                        "status": sub.status,
                        "amount": float(sub.amount) if sub.amount else 0
                    }
                    for sub in user.subscriptions
                ]
            
            # Add journal information
            if hasattr(user, 'user_journals') and user.user_journals:
                user_doc["journals"] = [
                    {
                        "title": journal.title,
                        "description": journal.description,
                        "journal_type": journal.journal_type,
                        "tags": journal.tags
                    }
                    for journal in user.user_journals
                ]
            
            # Index the document
            self.elasticsearch_client.index(
                index="users",
                id=user.id,
                body=user_doc
            )
            
        except Exception as e:
            logger.error(f"Error indexing user {user.id}: {e}")
    
    def search_users_elasticsearch(
        self,
        query_text: str,
        search_type: str = 'all',
        filters: Optional[Dict] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Tuple[List[int], int]:
        """
        Search users using Elasticsearch
        Returns tuple of (user_ids, total_count)
        """
        if not self.elasticsearch_enabled:
            return [], 0
        
        try:
            # Build search query
            search_body = {
                "query": {
                    "bool": {
                        "must": [],
                        "filter": []
                    }
                },
                "from": (page - 1) * page_size,
                "size": page_size,
                "sort": [{"created_at": {"order": "desc"}}]
            }
            
            # Add search query based on type
            if search_type == 'username':
                search_body["query"]["bool"]["must"].append({
                    "match": {"username": {"query": query_text, "boost": 2.0}}
                })
            elif search_type == 'email':
                search_body["query"]["bool"]["must"].append({
                    "term": {"email": {"value": query_text}}
                })
            elif search_type == 'name':
                search_body["query"]["bool"]["must"].append({
                    "multi_match": {
                        "query": query_text,
                        "fields": ["first_name^2", "last_name^2", "first_name + last_name"],
                        "type": "best_fields"
                    }
                })
            elif search_type == 'profile':
                search_body["query"]["bool"]["must"].append({
                    "nested": {
                        "path": "profile",
                        "query": {
                            "multi_match": {
                                "query": query_text,
                                "fields": [
                                    "profile.bio",
                                    "profile.preferred_markets",
                                    "profile.investment_goals",
                                    "profile.country",
                                    "profile.city"
                                ]
                            }
                        }
                    }
                })
            else:
                # Search across all fields
                search_body["query"]["bool"]["must"].append({
                    "multi_match": {
                        "query": query_text,
                        "fields": [
                            "username^2",
                            "email^2",
                            "first_name^1.5",
                            "last_name^1.5",
                            "subscription_status",
                            "profile.bio",
                            "profile.preferred_markets",
                            "journals.title",
                            "journals.description"
                        ],
                        "type": "best_fields"
                    }
                })
            
            # Add filters
            if filters:
                if filters.get('status') == 'active':
                    search_body["query"]["bool"]["filter"].append({"term": {"is_active": True}})
                elif filters.get('status') == 'inactive':
                    search_body["query"]["bool"]["filter"].append({"term": {"is_active": False}})
                
                if filters.get('subscription_status'):
                    search_body["query"]["bool"]["filter"].append({
                        "term": {"subscription_status": filters['subscription_status']}
                    })
                
                if filters.get('is_verified') is not None:
                    search_body["query"]["bool"]["filter"].append({
                        "term": {"is_verified": filters['is_verified']}
                    })
            
            # Execute search
            response = self.elasticsearch_client.search(
                index="users",
                body=search_body
            )
            
            # Extract results
            user_ids = [hit["_source"]["id"] for hit in response["hits"]["hits"]]
            total_count = response["hits"]["total"]["value"]
            
            return user_ids, total_count
            
        except Exception as e:
            logger.error(f"Elasticsearch search error: {e}")
            return [], 0
    
    def search_users(
        self,
        query_text: str,
        search_type: str = 'all',
        filters: Optional[Dict] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Tuple[List[User], int]:
        """
        Search users using Elasticsearch if available, otherwise fallback to database
        """
        # Try Elasticsearch first
        if self.elasticsearch_enabled:
            user_ids, total_count = self.search_users_elasticsearch(
                query_text, search_type, filters, page, page_size
            )
            
            if user_ids:
                # Fetch users from database using IDs
                users = User.query.filter(User.id.in_(user_ids)).all()
                # Sort by the order returned by Elasticsearch
                user_dict = {user.id: user for user in users}
                users = [user_dict[user_id] for user_id in user_ids if user_id in user_dict]
                return users, total_count
        
        # Fallback to database search
        return self._search_users_database(query_text, search_type, page, page_size)
    
    def _search_users_database(
        self,
        query_text: str,
        search_type: str = 'all',
        page: int = 1,
        page_size: int = 25
    ) -> Tuple[List[User], int]:
        """
        Fallback database search implementation
        """
        # Sanitize query
        query_text = re.escape(query_text)
        
        if search_type == 'username':
            query = User.query.filter(User.username.ilike(f'%{query_text}%'))
        elif search_type == 'email':
            query = User.query.filter(User.email.ilike(f'%{query_text}%'))
        elif search_type == 'name':
            query = User.query.filter(
                or_(
                    User.first_name.ilike(f'%{query_text}%'),
                    User.last_name.ilike(f'%{query_text}%'),
                    func.concat(User.first_name, ' ', User.last_name).ilike(f'%{query_text}%')
                )
            )
        elif search_type == 'profile':
            query = User.query.join(UserProfile).filter(
                or_(
                    UserProfile.bio.ilike(f'%{query_text}%'),
                    UserProfile.preferred_markets.ilike(f'%{query_text}%'),
                    UserProfile.investment_goals.ilike(f'%{query_text}%'),
                    UserProfile.country.ilike(f'%{query_text}%'),
                    UserProfile.city.ilike(f'%{query_text}%')
                )
            )
        else:
            query = User.query.filter(
                or_(
                    User.username.ilike(f'%{query_text}%'),
                    User.email.ilike(f'%{query_text}%'),
                    User.first_name.ilike(f'%{query_text}%'),
                    User.last_name.ilike(f'%{query_text}%'),
                    User.subscription_status.ilike(f'%{query_text}%')
                )
            )
        
        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        return users, total
    
    def reindex_all_users(self):
        """Reindex all users in Elasticsearch"""
        if not self.elasticsearch_enabled:
            return
        
        try:
            # Delete existing index
            if self.elasticsearch_client.indices.exists(index="users"):
                self.elasticsearch_client.indices.delete(index="users")
            
            # Recreate index
            self._setup_indexes()
            
            # Index all users
            users = User.query.all()
            for user in users:
                self.index_user(user)
            
            logger.info(f"Reindexed {len(users)} users in Elasticsearch")
            
        except Exception as e:
            logger.error(f"Error reindexing users: {e}")
    
    def delete_user_index(self, user_id: int):
        """Delete a user from Elasticsearch index"""
        if not self.elasticsearch_enabled:
            return
        
        try:
            self.elasticsearch_client.delete(
                index="users",
                id=user_id,
                ignore=[404]  # Ignore if document doesn't exist
            )
        except Exception as e:
            logger.error(f"Error deleting user {user_id} from index: {e}")


# Global search service instance
search_service = SearchService()

