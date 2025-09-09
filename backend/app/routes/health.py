from flask import Blueprint, jsonify
from app import db
import os
from datetime import datetime

# Try to import redis, but don't fail if it's not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    try:
        # Check Redis connection
        if REDIS_AVAILABLE:
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            r.ping()
            redis_status = 'healthy'
        else:
            redis_status = 'not available'
    except Exception as e:
        redis_status = f'unhealthy: {str(e)}'
    
    # Overall health status (database is required, Redis is optional)
    overall_healthy = db_status == 'healthy'
    
    return jsonify({
        'status': 'healthy' if overall_healthy else 'unhealthy',
        'services': {
            'database': db_status,
            'redis': redis_status
        },
        'timestamp': datetime.now().isoformat()
    }), 200 if overall_healthy else 503
