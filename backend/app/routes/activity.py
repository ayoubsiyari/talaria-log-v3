from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..services.activity_service import activity_service
from ..services.security_service import security_service
from ..services.audit_service import audit_service
from ..services.rate_limit_service import rate_limit_admin
from ..models.activity import UserActivityLog, ActivityExport
from ..models.user import User
from .. import db
import logging
import os

logger = logging.getLogger(__name__)

activity_bp = Blueprint('activity', __name__)

# Validation rules for activity endpoints
ACTIVITY_SEARCH_VALIDATION_RULES = {
    'user_ids': 'array',
    'admin_user_ids': 'array',
    'action_types': 'array',
    'categories': 'array',
    'status': 'max:20',
    'date_from': 'date_format:Y-m-d H:M:S',
    'date_to': 'date_format:Y-m-d H:M:S',
    'ip_address': 'max:45',
    'country_code': 'max:3',
    'resource_type': 'max:50',
    'resource_id': 'integer',
    'search_text': 'max:255',
    'page': 'integer|min:1',
    'per_page': 'integer|min:1|max:100'
}

EXPORT_VALIDATION_RULES = {
    'export_type': 'required|in:user_activity,admin_activity,all_activity',
    'format': 'in:csv,json',
    'user_ids': 'array',
    'date_from': 'date_format:Y-m-d H:M:S',
    'date_to': 'date_format:Y-m-d H:M:S',
    'action_types': 'array',
    'categories': 'array'
}


@activity_bp.route('/api/admin/users/<int:user_id>/activity', methods=['GET'])
@jwt_required()
@security_service.require_permission('user_activity.read')
@rate_limit_admin
def get_user_activity(user_id):
    """Retrieve user activity history"""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        action_types = request.args.getlist('action_types')
        categories = request.args.getlist('categories')
        status = request.args.get('status')
        
        # Parse date filters
        date_from = None
        date_to = None
        if request.args.get('date_from'):
            try:
                date_from = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_from format'
                }), 400
        
        if request.args.get('date_to'):
            try:
                date_to = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_to format'
                }), 400

        # Get user activity
        result = activity_service.get_user_activity(
            user_id=user_id,
            page=page,
            per_page=per_page,
            action_types=action_types if action_types else None,
            categories=categories if categories else None,
            date_from=date_from,
            date_to=date_to,
            status=status
        )

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='user_activity',
            resource_id=user_id,
            action='read',
            ip_address=security_service.get_client_ip(request)
        )

        return jsonify({
            'success': True,
            'user_id': user_id,
            'activities': result['activities'],
            'pagination': result['pagination']
        }), 200

    except Exception as e:
        logger.error(f"Error getting user activity for user {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve user activity'
        }), 500


@activity_bp.route('/api/admin/activity/search', methods=['GET'])
@jwt_required()
@security_service.require_permission('activity.search')
@rate_limit_admin
def search_activity_logs():
    """Search activity logs with advanced filtering"""
    try:
        # Get search parameters
        search_params = {}
        
        # Parse array parameters
        for param in ['user_ids', 'admin_user_ids', 'action_types', 'categories']:
            values = request.args.getlist(param)
            if values:
                try:
                    if param in ['user_ids', 'admin_user_ids']:
                        search_params[param] = [int(v) for v in values]
                    else:
                        search_params[param] = values
                except ValueError:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid {param} format'
                    }), 400

        # Parse other parameters
        for param in ['status', 'ip_address', 'country_code', 'resource_type', 'search_text']:
            value = request.args.get(param)
            if value:
                search_params[param] = value

        # Parse resource_id
        resource_id = request.args.get('resource_id')
        if resource_id:
            try:
                search_params['resource_id'] = int(resource_id)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid resource_id format'
                }), 400

        # Parse date filters
        for param in ['date_from', 'date_to']:
            value = request.args.get(param)
            if value:
                try:
                    search_params[param] = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid {param} format'
                    }), 400

        # Parse pagination
        search_params['page'] = int(request.args.get('page', 1))
        search_params['per_page'] = min(int(request.args.get('per_page', 50)), 100)

        # Validate search parameters
        if not security_service.validate_input(search_params, ACTIVITY_SEARCH_VALIDATION_RULES):
            return jsonify({
                'success': False,
                'error': 'Invalid search parameters'
            }), 400

        # Search activity logs
        result = activity_service.search_activity_logs(search_params)

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='activity_logs',
            action='search',
            ip_address=security_service.get_client_ip(request)
        )

        return jsonify({
            'success': True,
            'activities': result['activities'],
            'pagination': result['pagination']
        }), 200

    except Exception as e:
        logger.error(f"Error searching activity logs: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to search activity logs'
        }), 500


@activity_bp.route('/api/admin/activity/analytics', methods=['GET'])
@jwt_required()
@security_service.require_permission('activity.analytics')
@rate_limit_admin
def get_activity_analytics():
    """Get activity analytics and reporting"""
    try:
        # Get query parameters
        user_id = request.args.get('user_id')
        if user_id:
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid user_id format'
                }), 400

        group_by = request.args.get('group_by', 'day')
        if group_by not in ['day', 'hour', 'week', 'month']:
            return jsonify({
                'success': False,
                'error': 'Invalid group_by parameter'
            }), 400

        # Parse date filters
        date_from = None
        date_to = None
        if request.args.get('date_from'):
            try:
                date_from = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_from format'
                }), 400
        
        if request.args.get('date_to'):
            try:
                date_to = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_to format'
                }), 400

        # Get analytics
        analytics = activity_service.get_activity_analytics(
            date_from=date_from,
            date_to=date_to,
            user_id=user_id,
            group_by=group_by
        )

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='activity_analytics',
            action='read',
            ip_address=security_service.get_client_ip(request)
        )

        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200

    except Exception as e:
        logger.error(f"Error getting activity analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve activity analytics'
        }), 500


@activity_bp.route('/api/admin/activity/export', methods=['POST'])
@jwt_required()
@security_service.require_permission('activity.export')
@rate_limit_admin
def create_activity_export():
    """Create an activity export job"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input
        if not security_service.validate_input(data, EXPORT_VALIDATION_RULES):
            return jsonify({
                'success': False,
                'error': 'Invalid input data'
            }), 400

        # Sanitize input
        sanitized_data = security_service.sanitize_input(data)

        # Parse date filters
        date_from = None
        date_to = None
        if sanitized_data.get('date_from'):
            try:
                date_from = datetime.strptime(sanitized_data['date_from'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_from format'
                }), 400
        
        if sanitized_data.get('date_to'):
            try:
                date_to = datetime.strptime(sanitized_data['date_to'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date_to format'
                }), 400

        # Create export
        admin_user_id = get_jwt_identity()
        export = activity_service.create_activity_export(
            requested_by=admin_user_id,
            export_type=sanitized_data['export_type'],
            format=sanitized_data.get('format', 'csv'),
            user_ids=sanitized_data.get('user_ids'),
            date_from=date_from,
            date_to=date_to,
            action_types=sanitized_data.get('action_types'),
            categories=sanitized_data.get('categories')
        )

        return jsonify({
            'success': True,
            'message': 'Activity export job created successfully',
            'export_id': export.id,
            'status': export.status
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error creating activity export: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create activity export'
        }), 500


@activity_bp.route('/api/admin/activity/export/<int:export_id>', methods=['GET'])
@jwt_required()
@security_service.require_permission('activity.export')
@rate_limit_admin
def get_export_status(export_id):
    """Get export job status"""
    try:
        export = activity_service.get_export_status(export_id)
        if not export:
            return jsonify({
                'success': False,
                'error': 'Export not found'
            }), 404

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='activity_export',
            resource_id=export_id,
            action='read',
            ip_address=security_service.get_client_ip(request)
        )

        return jsonify({
            'success': True,
            'export': export.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error getting export status {export_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get export status'
        }), 500


@activity_bp.route('/api/admin/activity/export/<int:export_id>/download', methods=['GET'])
@jwt_required()
@security_service.require_permission('activity.export')
@rate_limit_admin
def download_export(export_id):
    """Download completed export file"""
    try:
        export = activity_service.get_export_status(export_id)
        if not export:
            return jsonify({
                'success': False,
                'error': 'Export not found'
            }), 404

        if not export.is_completed:
            return jsonify({
                'success': False,
                'error': 'Export is not completed yet'
            }), 400

        if not export.file_path or not os.path.exists(export.file_path):
            return jsonify({
                'success': False,
                'error': 'Export file not found'
            }), 404

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='activity_export',
            resource_id=export_id,
            action='download',
            ip_address=security_service.get_client_ip(request)
        )

        # Determine MIME type
        mime_type = 'text/csv' if export.format == 'csv' else 'application/json'
        filename = os.path.basename(export.file_path)

        return send_file(
            export.file_path,
            as_attachment=True,
            download_name=filename,
            mimetype=mime_type
        )

    except Exception as e:
        logger.error(f"Error downloading export {export_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to download export'
        }), 500


@activity_bp.route('/api/admin/activity/statistics', methods=['GET'])
@jwt_required()
@security_service.require_permission('activity.statistics')
@rate_limit_admin
def get_activity_statistics():
    """Get high-level activity statistics"""
    try:
        stats = activity_service.get_activity_statistics()

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_data_access(
            admin_user_id=admin_user_id,
            resource_type='activity_statistics',
            action='read',
            ip_address=security_service.get_client_ip(request)
        )

        return jsonify({
            'success': True,
            'statistics': stats
        }), 200

    except Exception as e:
        logger.error(f"Error getting activity statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve activity statistics'
        }), 500


@activity_bp.route('/api/admin/activity/cleanup', methods=['POST'])
@jwt_required()
@security_service.require_admin
@rate_limit_admin
def cleanup_expired_exports():
    """Clean up expired export files"""
    try:
        count = activity_service.cleanup_expired_exports()

        # Log audit
        admin_user_id = get_jwt_identity()
        audit_service.log_admin_action(
            admin_user_id=admin_user_id,
            action='cleanup_expired_exports',
            resource_type='activity',
            changes={'cleaned_count': count}
        )

        return jsonify({
            'success': True,
            'message': f'Cleaned up {count} expired export files'
        }), 200

    except Exception as e:
        logger.error(f"Error cleaning up expired exports: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup expired exports'
        }), 500

