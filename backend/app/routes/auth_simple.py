import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from .. import db, bcrypt
from ..models.user import User
from ..models.rbac import AdminUser, AdminRole, UserRoleAssignment
import re

auth_simple_bp = Blueprint('auth_simple', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, "Password is valid"

@auth_simple_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(key in data for key in ['username', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists (email or username)
        existing_user = User.query.filter(
            (User.email == email) | (User.username == username)
        ).first()
        if existing_user:
            if existing_user.email == email:
                return jsonify({'error': 'User with this email already exists'}), 409
            else:
                return jsonify({'error': 'Username already taken'}), 409
        
        # Create new user (inactive until payment completion)
        new_user = User(
            username=username,
            email=email,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            country=data.get('country'),
            is_active=False,  # User is inactive until payment is completed
            is_admin=False,   # Explicitly set as regular user (not admin)
            subscription_status='pending'  # Pending payment completion
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'first_name': new_user.first_name,
                'last_name': new_user.last_name,
                'phone': new_user.phone,
                'country': new_user.country
            }
        }), 201
        
    except Exception as e:
        logging.error(f"Registration error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@auth_simple_bp.route('/login', methods=['POST'])
def login():
    """Simplified login endpoint without login_history_service"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(key in data for key in ['email', 'password']):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Prefer admin login first
        admin = AdminUser.query.filter_by(email=email).first()
        if admin and admin.check_password(password):
            # Check if admin user is active (not suspended)
            if not admin.is_active:
                return jsonify({'error': 'Admin account is suspended. Please contact support.'}), 403
            
            # Update last login timestamp if present
            from datetime import datetime
            admin.last_login = datetime.utcnow()
            db.session.commit()

            # Create tokens for admin; identity must be a string for some JWT setups
            access_token = create_access_token(identity=str(admin.id))
            refresh_token = create_refresh_token(identity=str(admin.id))

            # Bootstrap: ensure admin has at least one role
            try:
                active_assignments = UserRoleAssignment.query.filter_by(admin_user_id=admin.id, is_active=True).count()
                if active_assignments == 0:
                    role = AdminRole.query.filter_by(name='super_admin', is_active=True).first()
                    if not role:
                        role = AdminRole.query.filter_by(name='admin', is_active=True).first()
                    if role:
                        assignment = UserRoleAssignment(
                            admin_user_id=admin.id,
                            role_id=role.id,
                            assigned_by=admin.id,
                            is_active=True
                        )
                        db.session.add(assignment)
                        db.session.commit()
            except Exception as e:
                logging.error(f"Error in role assignment: {e}")
                db.session.rollback()

            # Get user's roles
            roles = []
            try:
                # Use the assigned_roles property which handles the filtering
                roles = [role.to_dict() for role in admin.assigned_roles]
                logging.info(f"Admin {admin.id} has {len(roles)} roles: {[r.get('name', 'unknown') for r in roles]}")
            except Exception as e:
                logging.error(f"Error serializing roles for admin {admin.id}: {e}", exc_info=True)
                # Don't fail login, just return empty roles
                roles = []

            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': admin.id,
                    'username': admin.username,
                    'email': admin.email,
                    'is_admin': True,
                    'roles': roles
                },
                'account_type': 'admin'
            }), 200

        # Try end-user login
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            # Check if user is active (not suspended)
            if not user.is_active:
                return jsonify({
                    'error': 'Account is inactive. Please complete your payment to activate your account.',
                    'subscription_required': True,
                    'redirect_to': '/subscription/select'
                }), 402
            
            from datetime import datetime
            user.last_login = datetime.utcnow()
            db.session.commit()

            # Create tokens for user
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': False
                },
                'account_type': 'user'
            }), 200

        # Login failed
        return jsonify({'error': 'Login failed'}), 401
        
    except Exception as e:
        logging.error(f"Login error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Login failed'}), 500
