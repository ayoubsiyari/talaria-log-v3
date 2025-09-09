from sqlalchemy import func, and_, or_, desc, asc
from sqlalchemy.orm import joinedload, contains_eager
from .. import db
from ..models import User, UserProfile, UserSubscription
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class UserQueryService:
    """Service for optimized user database queries and operations"""
    
    @staticmethod
    def get_users_paginated(
        page: int = 1,
        page_size: int = 25,
        status: Optional[str] = None,
        subscription_status: Optional[str] = None,
        is_verified: Optional[bool] = None,
        is_admin: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        last_login_after: Optional[datetime] = None,
        last_login_before: Optional[datetime] = None,
        sort_by: str = 'created_at',
        sort_order: str = 'desc'
    ) -> Tuple[List[User], int]:
        """
        Get paginated users with optimized queries and eager loading
        """
        # Build base query with eager loading
        query = User.query.options(
            joinedload(User.profile),
            joinedload(User.subscriptions)
        )
        
        # Apply filters
        query = UserQueryService._apply_user_filters(
            query, status, subscription_status, is_verified, is_admin,
            created_after, created_before, last_login_after, last_login_before
        )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        query = UserQueryService._apply_sorting(query, sort_by, sort_order)
        
        # Apply pagination
        users = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return users, total
    
    @staticmethod
    def search_users(
        query_text: str,
        search_type: str = 'all',
        page: int = 1,
        page_size: int = 25
    ) -> Tuple[List[User], int]:
        """
        Search users with optimized queries based on search type
        """
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
            # Optimized profile search with joins
            query = User.query.join(UserProfile).filter(
                or_(
                    UserProfile.bio.ilike(f'%{query_text}%'),
                    UserProfile.preferred_markets.ilike(f'%{query_text}%'),
                    UserProfile.investment_goals.ilike(f'%{query_text}%'),
                    UserProfile.country.ilike(f'%{query_text}%'),
                    UserProfile.city.ilike(f'%{query_text}%')
                )
            ).options(joinedload(User.profile))
        else:
            # Search across all fields
            query = User.query.filter(
                or_(
                    User.username.ilike(f'%{query_text}%'),
                    User.email.ilike(f'%{query_text}%'),
                    User.first_name.ilike(f'%{query_text}%'),
                    User.last_name.ilike(f'%{query_text}%'),
                    User.subscription_status.ilike(f'%{query_text}%')
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        
        return users, total
    
    @staticmethod
    def get_user_statistics(days: int = 30) -> Dict:
        """
        Get comprehensive user statistics with optimized queries
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Use separate queries for basic counts to avoid SQLAlchemy case syntax issues
        total_users = db.session.query(func.count(User.id)).scalar()
        active_users = db.session.query(func.count(User.id)).filter(User.is_active == True).scalar()
        verified_users = db.session.query(func.count(User.id)).filter(User.is_verified == True).scalar()
        admin_users = db.session.query(func.count(User.id)).filter(User.is_admin == True).scalar()
        never_logged_in = db.session.query(func.count(User.id)).filter(User.last_login.is_(None)).scalar()
        
        # Subscription statistics with optimized query
        subscription_stats = db.session.query(
            User.subscription_status,
            func.count(User.id).label('count')
        ).group_by(User.subscription_status).all()
        
        # Registration trends with optimized date query
        daily_registrations = []
        for i in range(days):
            date = end_date - timedelta(days=i)
            count = db.session.query(func.count(User.id)).filter(
                func.date(User.created_at) == date.date()
            ).scalar()
            daily_registrations.append({
                'date': date.date().isoformat(),
                'count': count
            })
        
        # Recent login activity
        recent_logins = db.session.query(func.count(User.id)).filter(
            User.last_login >= start_date
        ).scalar()
        
        # Profile completion statistics
        users_with_profiles = db.session.query(func.count(User.id)).join(UserProfile).scalar()
        profile_completion_rate = (users_with_profiles / total_users * 100) if total_users > 0 else 0
        
        # Geographic distribution
        geographic_stats = db.session.query(
            UserProfile.country,
            func.count(UserProfile.id).label('count')
        ).filter(
            UserProfile.country.isnot(None)
        ).group_by(UserProfile.country).order_by(
            desc(func.count(UserProfile.id))
        ).limit(10).all()
        
        return {
            'overview': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'verified_users': verified_users,
                'admin_users': admin_users,
                'profile_completion_rate': round(profile_completion_rate, 2),
                'users_with_journals': None, # Removed as per edit hint
                'total_journals': None # Removed as per edit hint
            },
            'subscriptions': {
                'breakdown': {stat.subscription_status: stat.count for stat in subscription_stats}
            },
            'activity': {
                'recent_logins': recent_logins,
                'never_logged_in': never_logged_in,
                'daily_registrations': daily_registrations
            },
            'geographic': {
                'breakdown': {stat.country: stat.count for stat in geographic_stats}
            }
        }
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get user by ID with all related data loaded
        """
        return User.query.options(
            joinedload(User.profile),
            joinedload(User.subscriptions)
        ).filter(User.id == user_id).first()
    
    @staticmethod
    def get_users_by_subscription_status(status: str) -> List[User]:
        """
        Get users by subscription status with optimized query
        """
        return User.query.filter(
            User.subscription_status == status
        ).options(
            joinedload(User.profile),
            joinedload(User.subscriptions)
        ).all()
    
    @staticmethod
    def get_active_users_with_recent_activity(days: int = 7) -> List[User]:
        """
        Get active users with recent login activity
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return User.query.filter(
            and_(
                User.is_active == True,
                User.last_login >= cutoff_date
            )
        ).options(
            joinedload(User.profile)
        ).order_by(desc(User.last_login)).all()
    
    @staticmethod
    def _apply_user_filters(query, status, subscription_status, is_verified, is_admin,
                           created_after, created_before, last_login_after, last_login_before):
        """Apply filters to user query"""
        if status == 'active':
            query = query.filter(User.is_active == True)
        elif status == 'inactive':
            query = query.filter(User.is_active == False)
        
        if subscription_status:
            query = query.filter(User.subscription_status == subscription_status)
        
        if is_verified is not None:
            query = query.filter(User.is_verified == is_verified)
        
        if is_admin is not None:
            query = query.filter(User.is_admin == is_admin)
        
        if created_after:
            query = query.filter(User.created_at >= created_after)
        
        if created_before:
            query = query.filter(User.created_at <= created_before)
        
        if last_login_after:
            query = query.filter(User.last_login >= last_login_after)
        
        if last_login_before:
            query = query.filter(User.last_login <= last_login_before)
        
        return query
    
    @staticmethod
    def _apply_sorting(query, sort_by: str, sort_order: str):
        """Apply sorting to user query"""
        allowed_sort_fields = {
            'id', 'username', 'email', 'first_name', 'last_name', 
            'created_at', 'last_login', 'subscription_status', 'is_active'
        }
        
        if sort_by in allowed_sort_fields:
            sort_column = getattr(User, sort_by)
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(User.created_at))
        
        return query

