from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import joinedload
from sqlalchemy import and_, or_, desc, func, text
from .. import db
from ..models.activity import UserActivityLog, ActivityAnalytics, ActivityExport
from ..models.user import User
from ..models.rbac import AdminUser
from .security_service import security_service
from .audit_service import audit_service
import logging
import json
import csv
import os
import uuid
from threading import Thread
import time

logger = logging.getLogger(__name__)


class ActivityService:
    """Comprehensive activity logging and analytics service"""

    def __init__(self):
        self.async_queue = []  # Simple in-memory queue for async processing
        self.processing_thread = None
        self.is_running = False

    def log_activity(self, user_id: int = None, admin_user_id: int = None,
                    action_type: str = None, action_category: str = None,
                    action_subcategory: str = None, description: str = None,
                    resource_type: str = None, resource_id: int = None,
                    resource_name: str = None, details: Dict = None,
                    metadata: Dict = None, status: str = 'success',
                    error_message: str = None, duration_ms: int = None,
                    session_id: str = None, request_id: str = None,
                    user_agent: str = None, ip_address: str = None,
                    country_code: str = None, city: str = None,
                    async_logging: bool = True) -> UserActivityLog:
        """Log user activity with comprehensive tracking"""
        try:
            # Validate required parameters
            if not user_id and not admin_user_id:
                raise ValueError("Either user_id or admin_user_id must be provided")
            if not action_type:
                raise ValueError("action_type is required")
            if not action_category:
                raise ValueError("action_category is required")

            # Create activity log entry
            activity_log = UserActivityLog(
                user_id=user_id,
                admin_user_id=admin_user_id,
                action_type=action_type,
                action_category=action_category,
                action_subcategory=action_subcategory,
                description=description,
                resource_type=resource_type,
                resource_id=resource_id,
                resource_name=resource_name,
                details=details,
                activity_metadata=metadata,
                status=status,
                error_message=error_message,
                duration_ms=duration_ms,
                session_id=session_id,
                request_id=request_id,
                user_agent=user_agent,
                ip_address=ip_address,
                country_code=country_code,
                city=city
            )

            # Set partition date for future partitioning
            activity_log.set_partition_date()

            if async_logging:
                # Add to async queue for background processing
                self.async_queue.append(activity_log)
                if not self.is_running:
                    self._start_async_processing()
            else:
                # Immediate logging
                db.session.add(activity_log)
                db.session.commit()
                logger.info(f"Logged activity: {action_type} for user {user_id or admin_user_id}")

            return activity_log

        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            raise

    def get_user_activity(self, user_id: int, page: int = 1, per_page: int = 50,
                         action_types: List[str] = None, categories: List[str] = None,
                         date_from: datetime = None, date_to: datetime = None,
                         status: str = None) -> Dict:
        """Get paginated user activity history"""
        try:
            query = UserActivityLog.query.filter_by(user_id=user_id)

            # Apply filters
            if action_types:
                query = query.filter(UserActivityLog.action_type.in_(action_types))
            if categories:
                query = query.filter(UserActivityLog.action_category.in_(categories))
            if date_from:
                query = query.filter(UserActivityLog.created_at >= date_from)
            if date_to:
                query = query.filter(UserActivityLog.created_at <= date_to)
            if status:
                query = query.filter_by(status=status)

            # Order by creation date (newest first)
            query = query.order_by(desc(UserActivityLog.created_at))

            # Pagination
            pagination = query.paginate(
                page=page, per_page=per_page, error_out=False
            )

            # Format response
            activities = []
            for activity in pagination.items:
                activities.append(activity.to_dict())

            return {
                'activities': activities,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }

        except Exception as e:
            logger.error(f"Failed to get user activity for user {user_id}: {str(e)}")
            raise

    def search_activity_logs(self, search_params: Dict) -> Dict:
        """Advanced search for activity logs with multiple criteria"""
        try:
            query = UserActivityLog.query

            # Apply search filters
            if search_params.get('user_ids'):
                query = query.filter(UserActivityLog.user_id.in_(search_params['user_ids']))
            
            if search_params.get('admin_user_ids'):
                query = query.filter(UserActivityLog.admin_user_id.in_(search_params['admin_user_ids']))

            if search_params.get('action_types'):
                query = query.filter(UserActivityLog.action_type.in_(search_params['action_types']))

            if search_params.get('categories'):
                query = query.filter(UserActivityLog.action_category.in_(search_params['categories']))

            if search_params.get('status'):
                query = query.filter_by(status=search_params['status'])

            if search_params.get('date_from'):
                query = query.filter(UserActivityLog.created_at >= search_params['date_from'])

            if search_params.get('date_to'):
                query = query.filter(UserActivityLog.created_at <= search_params['date_to'])

            if search_params.get('ip_address'):
                query = query.filter(UserActivityLog.ip_address.like(f"%{search_params['ip_address']}%"))

            if search_params.get('country_code'):
                query = query.filter_by(country_code=search_params['country_code'])

            if search_params.get('resource_type'):
                query = query.filter_by(resource_type=search_params['resource_type'])

            if search_params.get('resource_id'):
                query = query.filter_by(resource_id=search_params['resource_id'])

            # Text search in description
            if search_params.get('search_text'):
                search_text = search_params['search_text']
                query = query.filter(
                    or_(
                        UserActivityLog.description.like(f"%{search_text}%"),
                        UserActivityLog.resource_name.like(f"%{search_text}%")
                    )
                )

            # Order by creation date (newest first)
            query = query.order_by(desc(UserActivityLog.created_at))

            # Pagination
            page = search_params.get('page', 1)
            per_page = search_params.get('per_page', 50)
            pagination = query.paginate(
                page=page, per_page=per_page, error_out=False
            )

            # Format response
            activities = []
            for activity in pagination.items:
                activities.append(activity.to_dict())

            return {
                'activities': activities,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }

        except Exception as e:
            logger.error(f"Failed to search activity logs: {str(e)}")
            raise

    def get_activity_analytics(self, date_from: datetime = None, date_to: datetime = None,
                             user_id: int = None, group_by: str = 'day') -> Dict:
        """Get comprehensive activity analytics and reporting"""
        try:
            # Build base query
            query = UserActivityLog.query

            # Apply date filters
            if date_from:
                query = query.filter(UserActivityLog.created_at >= date_from)
            if date_to:
                query = query.filter(UserActivityLog.created_at <= date_to)
            if user_id:
                query = query.filter_by(user_id=user_id)

            # Get basic statistics
            total_activities = query.count()
            successful_activities = query.filter_by(status='success').count()
            failed_activities = query.filter_by(status='failed').count()

            # Get action type breakdown
            action_breakdown = db.session.query(
                UserActivityLog.action_type,
                func.count(UserActivityLog.id).label('count')
            ).filter(query.whereclause).group_by(UserActivityLog.action_type).all()

            # Get category breakdown
            category_breakdown = db.session.query(
                UserActivityLog.action_category,
                func.count(UserActivityLog.id).label('count')
            ).filter(query.whereclause).group_by(UserActivityLog.action_category).all()

            # Get resource type breakdown
            resource_breakdown = db.session.query(
                UserActivityLog.resource_type,
                func.count(UserActivityLog.id).label('count')
            ).filter(query.whereclause).group_by(UserActivityLog.resource_type).all()

            # Get geographic data
            unique_ips = query.with_entities(func.count(func.distinct(UserActivityLog.ip_address))).scalar()
            unique_countries = query.with_entities(func.count(func.distinct(UserActivityLog.country_code))).scalar()

            country_breakdown = db.session.query(
                UserActivityLog.country_code,
                func.count(UserActivityLog.id).label('count')
            ).filter(query.whereclause).group_by(UserActivityLog.country_code).all()

            # Get performance metrics
            performance_stats = query.with_entities(
                func.avg(UserActivityLog.duration_ms).label('avg_duration'),
                func.max(UserActivityLog.duration_ms).label('max_duration'),
                func.min(UserActivityLog.duration_ms).label('min_duration')
            ).filter(UserActivityLog.duration_ms.isnot(None)).first()

            # Time series data if group_by is specified
            time_series = []
            if group_by == 'day':
                time_series = db.session.query(
                    func.date(UserActivityLog.created_at).label('date'),
                    func.count(UserActivityLog.id).label('count')
                ).filter(query.whereclause).group_by(
                    func.date(UserActivityLog.created_at)
                ).order_by(text('date')).all()

            return {
                'summary': {
                    'total_activities': total_activities,
                    'successful_activities': successful_activities,
                    'failed_activities': failed_activities,
                    'success_rate': (successful_activities / total_activities * 100) if total_activities > 0 else 0
                },
                'breakdowns': {
                    'action_types': {item.action_type: item.count for item in action_breakdown},
                    'categories': {item.action_category: item.count for item in category_breakdown},
                    'resource_types': {item.resource_type: item.count for item in resource_breakdown if item.resource_type},
                    'countries': {item.country_code: item.count for item in country_breakdown if item.country_code}
                },
                'geographic': {
                    'unique_ips': unique_ips or 0,
                    'unique_countries': unique_countries or 0
                },
                'performance': {
                    'avg_duration_ms': performance_stats.avg_duration if performance_stats else None,
                    'max_duration_ms': performance_stats.max_duration if performance_stats else None,
                    'min_duration_ms': performance_stats.min_duration if performance_stats else None
                },
                'time_series': [
                    {'date': str(item.date), 'count': item.count} for item in time_series
                ] if time_series else []
            }

        except Exception as e:
            logger.error(f"Failed to get activity analytics: {str(e)}")
            raise

    def create_activity_export(self, requested_by: int, export_type: str = 'all_activity',
                             format: str = 'csv', user_ids: List[int] = None,
                             date_from: datetime = None, date_to: datetime = None,
                             action_types: List[str] = None, categories: List[str] = None) -> ActivityExport:
        """Create an activity export job"""
        try:
            # Create export record
            export = ActivityExport(
                requested_by=requested_by,
                export_type=export_type,
                format=format,
                user_ids=user_ids,
                date_from=date_from,
                date_to=date_to,
                action_types=action_types,
                categories=categories,
                expires_at=datetime.utcnow() + timedelta(days=7)  # Expire after 7 days
            )

            db.session.add(export)
            db.session.commit()

            # Start background export processing
            Thread(target=self._process_export, args=(export.id,)).start()

            logger.info(f"Created activity export {export.id} for admin {requested_by}")
            return export

        except Exception as e:
            logger.error(f"Failed to create activity export: {str(e)}")
            raise

    def get_export_status(self, export_id: int) -> ActivityExport:
        """Get export job status"""
        return ActivityExport.query.get(export_id)

    def _process_export(self, export_id: int):
        """Background processing for activity exports"""
        try:
            export = ActivityExport.query.get(export_id)
            if not export:
                return

            # Update status to processing
            export.status = 'processing'
            export.started_at = datetime.utcnow()
            db.session.commit()

            # Build query based on export criteria
            query = UserActivityLog.query

            if export.export_type == 'user_activity':
                query = query.filter(UserActivityLog.user_id.isnot(None))
            elif export.export_type == 'admin_activity':
                query = query.filter(UserActivityLog.admin_user_id.isnot(None))

            if export.user_ids:
                query = query.filter(UserActivityLog.user_id.in_(export.user_ids))

            if export.date_from:
                query = query.filter(UserActivityLog.created_at >= export.date_from)

            if export.date_to:
                query = query.filter(UserActivityLog.created_at <= export.date_to)

            if export.action_types:
                query = query.filter(UserActivityLog.action_type.in_(export.action_types))

            if export.categories:
                query = query.filter(UserActivityLog.action_category.in_(export.categories))

            # Get total count for progress tracking
            total_count = query.count()
            export.record_count = total_count
            db.session.commit()

            # Create export directory if it doesn't exist
            export_dir = os.path.join(os.getcwd(), 'exports')
            os.makedirs(export_dir, exist_ok=True)

            # Generate filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"activity_export_{export_id}_{timestamp}.{export.format}"
            file_path = os.path.join(export_dir, filename)

            # Export data based on format
            if export.format == 'csv':
                self._export_to_csv(query, file_path, export)
            elif export.format == 'json':
                self._export_to_json(query, file_path, export)
            else:
                raise ValueError(f"Unsupported export format: {export.format}")

            # Update export record
            export.status = 'completed'
            export.completed_at = datetime.utcnow()
            export.file_path = file_path
            export.file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            export.progress = 100
            db.session.commit()

            logger.info(f"Completed activity export {export_id}")

        except Exception as e:
            logger.error(f"Failed to process export {export_id}: {str(e)}")
            if export:
                export.status = 'failed'
                export.error_message = str(e)
                export.completed_at = datetime.utcnow()
                db.session.commit()

    def _export_to_csv(self, query, file_path: str, export: ActivityExport):
        """Export activity data to CSV format"""
        activities = query.all()
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'id', 'user_id', 'admin_user_id', 'action_type', 'action_category',
                'action_subcategory', 'description', 'resource_type', 'resource_id',
                'resource_name', 'status', 'ip_address', 'country_code', 'city',
                'created_at', 'duration_ms'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for i, activity in enumerate(activities):
                row = {
                    'id': activity.id,
                    'user_id': activity.user_id,
                    'admin_user_id': activity.admin_user_id,
                    'action_type': activity.action_type,
                    'action_category': activity.action_category,
                    'action_subcategory': activity.action_subcategory,
                    'description': activity.description,
                    'resource_type': activity.resource_type,
                    'resource_id': activity.resource_id,
                    'resource_name': activity.resource_name,
                    'status': activity.status,
                    'ip_address': activity.ip_address,
                    'country_code': activity.country_code,
                    'city': activity.city,
                    'created_at': activity.created_at.isoformat() if activity.created_at else None,
                    'duration_ms': activity.duration_ms
                }
                writer.writerow(row)
                
                # Update progress
                if i % 100 == 0:
                    progress = min(100, int((i / len(activities)) * 100))
                    export.progress = progress
                    db.session.commit()

    def _export_to_json(self, query, file_path: str, export: ActivityExport):
        """Export activity data to JSON format"""
        activities = query.all()
        
        data = []
        for i, activity in enumerate(activities):
            data.append(activity.to_dict())
            
            # Update progress
            if i % 100 == 0:
                progress = min(100, int((i / len(activities)) * 100))
                export.progress = progress
                db.session.commit()
        
        with open(file_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(data, jsonfile, indent=2, default=str)

    def _start_async_processing(self):
        """Start background processing for async activity logging"""
        if not self.is_running:
            self.is_running = True
            self.processing_thread = Thread(target=self._process_async_queue)
            self.processing_thread.daemon = True
            self.processing_thread.start()

    def _process_async_queue(self):
        """Process the async activity logging queue"""
        while self.is_running:
            try:
                if self.async_queue:
                    # Process up to 100 items at once
                    batch = self.async_queue[:100]
                    self.async_queue = self.async_queue[100:]
                    
                    for activity_log in batch:
                        try:
                            db.session.add(activity_log)
                        except Exception as e:
                            logger.error(f"Failed to add activity log to session: {str(e)}")
                    
                    try:
                        db.session.commit()
                        logger.info(f"Processed {len(batch)} activity logs asynchronously")
                    except Exception as e:
                        logger.error(f"Failed to commit activity logs: {str(e)}")
                        db.session.rollback()
                
                time.sleep(1)  # Wait 1 second before next batch
                
            except Exception as e:
                logger.error(f"Error in async activity processing: {str(e)}")
                time.sleep(5)  # Wait longer on error

    def cleanup_expired_exports(self) -> int:
        """Clean up expired export files"""
        try:
            expired_exports = ActivityExport.query.filter(
                and_(
                    ActivityExport.expires_at < datetime.utcnow(),
                    ActivityExport.status == 'completed'
                )
            ).all()

            count = 0
            for export in expired_exports:
                try:
                    if export.file_path and os.path.exists(export.file_path):
                        os.remove(export.file_path)
                        count += 1
                        logger.info(f"Deleted expired export file: {export.file_path}")
                except Exception as e:
                    logger.error(f"Failed to delete export file {export.file_path}: {str(e)}")

            return count

        except Exception as e:
            logger.error(f"Failed to cleanup expired exports: {str(e)}")
            return 0

    def get_activity_statistics(self) -> Dict:
        """Get high-level activity statistics"""
        try:
            # Get total counts
            total_activities = UserActivityLog.query.count()
            today_activities = UserActivityLog.query.filter(
                func.date(UserActivityLog.created_at) == func.date(func.now())
            ).count()
            
            # Get user counts
            unique_users = UserActivityLog.query.with_entities(
                func.count(func.distinct(UserActivityLog.user_id))
            ).scalar()
            
            unique_admin_users = UserActivityLog.query.with_entities(
                func.count(func.distinct(UserActivityLog.admin_user_id))
            ).scalar()

            # Get recent activity
            recent_activities = UserActivityLog.query.order_by(
                desc(UserActivityLog.created_at)
            ).limit(10).all()

            recent_data = []
            for activity in recent_activities:
                recent_data.append({
                    'id': activity.id,
                    'action_type': activity.action_type,
                    'user_id': activity.user_id,
                    'admin_user_id': activity.admin_user_id,
                    'created_at': activity.created_at.isoformat() if activity.created_at else None,
                    'status': activity.status
                })

            return {
                'total_activities': total_activities,
                'today_activities': today_activities,
                'unique_users': unique_users or 0,
                'unique_admin_users': unique_admin_users or 0,
                'recent_activities': recent_data
            }

        except Exception as e:
            logger.error(f"Failed to get activity statistics: {str(e)}")
            raise


# Global activity service instance
activity_service = ActivityService()
