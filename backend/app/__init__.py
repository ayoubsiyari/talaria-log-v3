import os
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_socketio import SocketIO
from celery import Celery
from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
mail = Mail()
socketio = SocketIO()
# limiter = Limiter(key_func=get_remote_address)
# celery = Celery(__name__)

def create_app(config_name='default'):
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    app.config.from_object(config[config_name])
    app.config.from_pyfile('config.py', silent=True) # Load instance config if it exists

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    # limiter.init_app(app)

    # Import models here to prevent circular dependencies
    from . import models

    # Get CORS origins based on environment
    if config_name == 'production':
        # Production: Only allow HTTPS domains, no IP addresses
        cors_origins = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [
            # Add your production domain here - example:
            # "https://yourdomain.com", "https://www.yourdomain.com"
        ]
        # Ensure all production origins use HTTPS
        cors_origins = [origin for origin in cors_origins if origin.startswith('https://')]
    else:
        # Development: Allow localhost and local IPs for development
        cors_origins = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [
            "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", 
            "http://localhost:5176", "http://localhost:3000", "http://127.0.0.1:5173",
            "http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:3000",
            "http://127.0.0.1:8080", "http://127.0.0.1:8081"
        ]
    
    # Use the same origins as configured for CORS
    socketio.init_app(app, cors_allowed_origins=cors_origins)
    print(f"SocketIO initialized: {socketio is not None}")
    
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "X-Client-Version", "X-Client-Timestamp"],
            "supports_credentials": True
        }
    })

    # celery.conf.update(app.config)

    from .middleware.rbac_middleware import RBACMiddleware
    from .middleware.security_headers_middleware import security_headers_middleware
    
    RBACMiddleware(app)
    security_headers_middleware.init_app(app)

    from .routes.auth_simple import auth_simple_bp as auth_bp
    from .routes.auth_cookie import auth_cookie_bp
    from .routes.user import user_bp
    from .routes.admin import admin_bp
    from .routes.journal import journal_bp
    from .routes.profile import profile_bp
    from .routes.backtest import backtest_bp
    # from .routes.activity import activity_bp
    # from .routes.communication import communication_bp
    from .routes.health import health_bp
    from .routes.rbac import rbac_bp
    from .routes.admin_rbac import admin_rbac_bp
    from .routes.admin_users import admin_users_bp
    from .routes.promotions import promotions_bp
    from .routes.user_settings import user_settings_bp
    from .routes.payments import payments_bp
    from .routes.subscription_routes import subscription_bp
    from .routes.dashboard import dashboard_bp
    from .routes.admin_user_management import admin_user_mgmt_bp
    from .routes.support import support_bp
    from .routes.user_subscription import user_subscription_bp
    from .routes.protected_content import protected_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(auth_cookie_bp)  # Cookie-based auth routes
    app.register_blueprint(promotions_bp, url_prefix='/api/admin/promotions')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(journal_bp, url_prefix='/api/journal')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(backtest_bp, url_prefix='/api/backtest')
    # app.register_blueprint(activity_bp, url_prefix='/api/activity')
    # app.register_blueprint(communication_bp, url_prefix='/api/communication')
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(rbac_bp)
    app.register_blueprint(admin_rbac_bp, url_prefix='/api/admin/rbac')
    app.register_blueprint(admin_users_bp, url_prefix='/api/admin/users')
    app.register_blueprint(user_settings_bp, url_prefix='/api/user')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(admin_user_mgmt_bp, url_prefix='/api/admin')
    app.register_blueprint(support_bp, url_prefix='/api')
    app.register_blueprint(user_subscription_bp, url_prefix='/api')
    app.register_blueprint(protected_bp, url_prefix='/api/protected')
    
    # Register realtime routes
    from .routes.realtime_routes import realtime_bp
    app.register_blueprint(realtime_bp, url_prefix='/api/realtime')

    # Add CORS preflight handler
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        response = app.make_default_options_response()
        # Use the same CORS origins as configured above
        origin = request.headers.get('Origin')
        if origin in cors_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            # For development, allow localhost origins
            if origin and ('localhost' in origin or '127.0.0.1' in origin):
                response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Client-Version, X-Client-Timestamp'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Register error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    # Initialize real-time chat service
    try:
        from .services.realtime_chat_service import initialize_realtime_chat_service
        print(f"Passing SocketIO to chat service: {socketio is not None} (type: {type(socketio).__name__})")
        initialize_realtime_chat_service(socketio)
        print("✅ Real-time chat service initialized")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize real-time chat service: {e}")
        import traceback
        traceback.print_exc()
    
    return app