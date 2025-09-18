"""
Cookie-based Authentication Routes
Provides secure httpOnly cookie-based authentication endpoints
"""

import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    jwt_required, 
    get_jwt_identity,
    decode_token
)
from .. import db, bcrypt
from ..models.user import User
from ..models.rbac import AdminUser, AdminRole, UserRoleAssignment
import re

auth_cookie_bp = Blueprint('auth_cookie', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, "Password is valid"

def set_auth_cookies(response, access_token, refresh_token):
    """Set secure httpOnly cookies for authentication"""
    # Set access token cookie (short-lived)
    response.set_cookie(
        'access_token',
        access_token,
        max_age=3600,  # 1 hour
        httponly=True,
        secure=True,  # HTTPS only
        samesite='Strict'
    )
    
    # Set refresh token cookie (long-lived)
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=30 * 24 * 3600,  # 30 days
        httponly=True,
        secure=True,  # HTTPS only
        samesite='Strict'
    )
    
    return response

def clear_auth_cookies(response):
    """Clear authentication cookies"""
    response.set_cookie('access_token', '', expires=0, httponly=True, secure=True, samesite='Strict')
    response.set_cookie('refresh_token', '', expires=0, httponly=True, secure=True, samesite='Strict')
    return response

@auth_cookie_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Cookie-based login endpoint"""
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
            # Check if admin user is active
            if not admin.is_active:
                return jsonify({'error': 'Admin account is suspended. Please contact support.'}), 403
            
            # Update last login timestamp
            admin.last_login = datetime.utcnow()
            db.session.commit()

            # Create tokens
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
                roles = [role.to_dict() for role in admin.assigned_roles]
            except Exception as e:
                logging.error(f"Error serializing roles for admin {admin.id}: {e}")
                roles = []

            # Create response with user data
            user_data = {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email,
                'is_admin': True,
                'roles': roles
            }

            response = make_response(jsonify({
                'message': 'Login successful',
                'user': user_data,
                'account_type': 'admin'
            }))

            # Set secure cookies
            response = set_auth_cookies(response, access_token, refresh_token)
            return response

        # Try end-user login
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            # Check if user is active
            if not user.is_active:
                return jsonify({
                    'error': 'Account is inactive. Please complete your payment to activate your account.',
                    'subscription_required': True,
                    'redirect_to': '/subscription/select'
                }), 402
            
            user.last_login = datetime.utcnow()
            db.session.commit()

            # Create tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            # Create response with user data
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': False
            }

            response = make_response(jsonify({
                'message': 'Login successful',
                'user': user_data,
                'account_type': 'user'
            }))

            # Set secure cookies
            response = set_auth_cookies(response, access_token, refresh_token)
            return response

        # Login failed
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        logging.error(f"Login error: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': 'Login failed'}), 500

@auth_cookie_bp.route('/api/auth/validate-session', methods=['GET'])
@jwt_required()
def validate_session():
    """Validate current session and return user data"""
    try:
        user_id = get_jwt_identity()
        
        # Try admin first
        admin = AdminUser.query.filter_by(id=user_id).first()
        if admin and admin.is_active:
            roles = []
            try:
                roles = [role.to_dict() for role in admin.assigned_roles]
            except Exception as e:
                logging.error(f"Error serializing roles for admin {admin.id}: {e}")
                roles = []

            return jsonify({
                'user': {
                    'id': admin.id,
                    'username': admin.username,
                    'email': admin.email,
                    'is_admin': True,
                    'roles': roles
                },
                'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            })

        # Try regular user
        user = User.query.filter_by(id=user_id).first()
        if user and user.is_active:
            return jsonify({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': False
                },
                'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            })

        # User not found or inactive
        return jsonify({'error': 'Invalid session'}), 401

    except Exception as e:
        logging.error(f"Session validation error: {e}", exc_info=True)
        return jsonify({'error': 'Session validation failed'}), 500

@auth_cookie_bp.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user still exists and is active
        admin = AdminUser.query.filter_by(id=user_id).first()
        user = User.query.filter_by(id=user_id).first()
        
        if not ((admin and admin.is_active) or (user and user.is_active)):
            return jsonify({'error': 'User not found or inactive'}), 401

        # Create new access token
        new_access_token = create_access_token(identity=str(user_id))
        
        # Create response
        response = make_response(jsonify({
            'message': 'Token refreshed successfully',
            'user': {
                'id': user_id,
                'is_admin': bool(admin and admin.is_active)
            }
        }))

        # Update access token cookie
        response.set_cookie(
            'access_token',
            new_access_token,
            max_age=3600,  # 1 hour
            httponly=True,
            secure=True,
            samesite='Strict'
        )

        return response

    except Exception as e:
        logging.error(f"Token refresh error: {e}", exc_info=True)
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_cookie_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout and clear cookies"""
    try:
        response = make_response(jsonify({'message': 'Logout successful'}))
        
        # Clear authentication cookies
        response = clear_auth_cookies(response)
        
        return response

    except Exception as e:
        logging.error(f"Logout error: {e}", exc_info=True)
        return jsonify({'error': 'Logout failed'}), 500

@auth_cookie_bp.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint with cookie-based auth"""
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
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.email == email) | (User.username == username)
        ).first()
        if existing_user:
            if existing_user.email == email:
                return jsonify({'error': 'User with this email already exists'}), 409
            else:
                return jsonify({'error': 'Username already taken'}), 409
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            country=data.get('country'),
            is_active=False,  # Inactive until payment
            is_admin=False,
            subscription_status='pending'
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
