import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from .. import db, bcrypt
from ..models.user import User
from ..models.rbac import AdminUser, AdminRole, UserRoleAssignment
from ..services import login_history_service
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, "Password is valid"

@auth_bp.route('/register', methods=['POST'])
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
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/check-availability', methods=['POST'])
def check_availability():
    """Check if username or email is available"""
    try:
        data = request.get_json()
        
        if not data or 'field' not in data or 'value' not in data:
            return jsonify({'error': 'Field and value are required'}), 400
        
        field = data['field']
        value = data['value'].strip()
        
        if field not in ['username', 'email']:
            return jsonify({'error': 'Invalid field. Must be username or email'}), 400
        
        if field == 'email':
            value = value.lower()
            if not validate_email(value):
                return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user exists (excluding current user if editing)
        exclude_user_id = data.get('excludeUserId')
        
        if field == 'email':
            query = User.query.filter_by(email=value)
        else:  # username
            query = User.query.filter_by(username=value)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        existing_user = query.first()
        
        return jsonify({
            'available': existing_user is None,
            'field': field,
            'value': value
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to check availability'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User or Admin login endpoint"""
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
                # Log failed login attempt for suspended admin
                login_history_service.log_login_attempt(
                    user_id=admin.id,
                    is_successful=False,
                    failure_reason='Admin account suspended'
                )
                return jsonify({'error': 'Admin account is suspended. Please contact support.'}), 403
            # Update last login timestamp if present
            from datetime import datetime
            admin.last_login = datetime.utcnow()
            db.session.commit()

            # Log successful login
            login_history_service.log_login_attempt(
                user_id=admin.id,
                is_successful=True
            )

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
            except Exception:
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
            # Add retry logic for race conditions after payment
            if not user.is_active:
                # Check if user has recent payment - might be race condition
                from ..models.payment import Order
                recent_paid_orders = Order.query.filter(
                    Order.customer_email == email,
                    Order.status == 'paid',
                    Order.payment_status == 'paid'
                ).order_by(Order.created_at.desc()).limit(1).all()
                
                if recent_paid_orders:
                    # User has recent payment, force refresh and retry
                    print(f"🔄 User {email} has recent payment but is_active=False - checking for race condition")
                    db.session.expire(user)  # Force fresh query
                    user = User.query.filter_by(email=email).first()
                    
                    if user.is_active:
                        print(f"✅ Race condition resolved - user {email} is now active")
                    else:
                        # Still inactive, but has payment - manually activate
                        print(f"🔄 Manually activating user {email} due to payment verification")
                        user.is_active = True
                        user.subscription_status = 'active'
                        user.subscription_plan = 'premium'  # Default plan
                        user.is_admin = False
                        db.session.commit()
                        print(f"✅ User {email} manually activated after payment verification")
                
                # Block login for inactive users - they must complete payment first
                if not user.is_active:
                    # Log failed login attempt for inactive user
                    login_history_service.log_login_attempt(
                        user_id=user.id,
                        is_successful=False,
                        failure_reason='Account inactive - payment required'
                    )
                    return jsonify({
                        'error': 'Account is inactive. Please complete your payment to activate your account.',
                        'subscription_required': True,
                        'redirect_to': '/subscription/select'
                    }), 402
            from datetime import datetime
            user.last_login = datetime.utcnow()
            db.session.commit()

            # Check if user has admin role assignments (only actual admin roles, not regular user roles)
            has_admin_roles = False
            admin_roles = []
            
            # Get user's role assignments
            user_assignments = UserRoleAssignment.query.filter_by(
                user_id=user.id,
                is_active=True
            ).all()
            
            # Check if user has actual admin roles (not just any roles)
            if user_assignments:
                for assignment in user_assignments:
                    if assignment.role and assignment.role.is_active:
                        # Check if this role has admin permissions
                        role_permissions = [perm.name for perm in assignment.role.permissions]
                        admin_permissions = [
                            'user_management.users.view', 'user_management.users.create',
                            'rbac_management.roles.view', 'system_admin.settings.view',
                            'analytics.view', 'subscription_management.subscriptions.view'
                        ]
                        if any(perm in role_permissions for perm in admin_permissions):
                            has_admin_roles = True
                            admin_roles.append({
                                'id': assignment.role.id,
                                'name': assignment.role.name,
                                'display_name': assignment.role.display_name
                            })
            
            # Also check the rbac_role_assignments relationship if it exists
            if hasattr(user, 'rbac_role_assignments') and user.rbac_role_assignments:
                for assignment in user.rbac_role_assignments:
                    if assignment.is_active and assignment.role and assignment.role.is_active:
                        # Check if this role has admin permissions
                        role_permissions = [perm.name for perm in assignment.role.permissions]
                        admin_permissions = [
                            'user_management.users.view', 'user_management.users.create',
                            'rbac_management.roles.view', 'system_admin.settings.view',
                            'analytics.view', 'subscription_management.subscriptions.view'
                        ]
                        if any(perm in role_permissions for perm in admin_permissions):
                            has_admin_roles = True
                            admin_roles.append(assignment.role.name)

            # If an AdminUser exists for this email, treat as admin; otherwise, auto-provision if user.is_admin or has admin roles
            provisioned_admin = None
            existing_admin = AdminUser.query.filter_by(email=user.email).first()
            if existing_admin:
                provisioned_admin = existing_admin
            elif getattr(user, 'is_admin', False) or has_admin_roles:
                provisioned_admin = AdminUser(
                    username=user.username or user.email,
                    email=user.email,
                    first_name=getattr(user, 'first_name', None),
                    last_name=getattr(user, 'last_name', None),
                    is_active=True,
                    is_super_admin=False,
                )
                # Reuse password hash so credentials remain valid
                provisioned_admin.password_hash = user.password_hash
                db.session.add(provisioned_admin)
                db.session.commit()

            # Log successful login attempt
            login_history_service.log_login_attempt(
                user_id=user.id,
                is_successful=True
            )

            # If we have an admin identity (provisioned or existing), issue admin token
            if provisioned_admin:
                access_token = create_access_token(identity=str(provisioned_admin.id))
                refresh_token = create_refresh_token(identity=str(provisioned_admin.id))
                return jsonify({
                    'message': 'Login successful',
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': {
                        'id': provisioned_admin.id,
                        'username': provisioned_admin.username,
                        'email': provisioned_admin.email,
                        'is_admin': True,
                        'admin_roles': admin_roles
                    },
                    'account_type': 'admin'
                }), 200

            # Else, standard user token
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
                    'is_admin': user.is_admin,
                    'is_active': user.is_active,
                    'subscription_status': user.subscription_status,
                    'subscription_plan': user.subscription_plan,
                    'admin_roles': admin_roles if has_admin_roles else []
                },
                'account_type': 'user'
            }), 200

        # Log failed login attempt when neither user nor admin matched
        login_history_service.log_login_attempt(
            user_id=None,
            is_successful=False,
            failure_reason='Invalid credentials'
        )
        return jsonify({'error': 'Invalid email or password'}), 401
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=str(current_user))
        
        return jsonify({
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    try:
        # In a real application, you might want to blacklist the token
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information (for end-users)."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is active (not suspended)
        if not user.is_active:
            return jsonify({'error': 'Account is suspended. Please contact support.'}), 403
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user information'}), 500 

@auth_bp.route('/post-payment-login', methods=['POST'])
def post_payment_login():
    """Authenticate user after successful payment using order verification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(key in data for key in ['email', 'order_id']):
            return jsonify({'error': 'Email and order_id are required'}), 400
        
        email = data.get('email', '').strip().lower()
        order_id = data.get('order_id')
        
        # Find the user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify the order exists and is paid
        from ..models.payment import Order
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order.status != 'paid' or order.payment_status != 'paid':
            return jsonify({'error': 'Order not paid'}), 400
        
        if order.customer_email != email:
            return jsonify({'error': 'Order email mismatch'}), 400
        
        # Check if user is active (should be after payment)
        if not user.is_active:
            return jsonify({'error': 'User account not activated'}), 400
        
        # Create tokens for the user
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Log successful login
        login_history_service.log_login_attempt(
            user_id=user.id,
            is_successful=True
        )
        
        return jsonify({
            'message': 'Post-payment login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'subscription_status': user.subscription_status,
                'subscription_plan': user.subscription_plan
            },
            'account_type': 'user'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Post-payment login failed'}), 500

@auth_bp.route('/mock-payment-login', methods=['POST'])
def mock_payment_login():
    """Authenticate user after successful mock payment using session verification"""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['user_id', 'session_id']):
            return jsonify({'error': 'user_id and session_id are required'}), 400
        
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has an active subscription (from mock payment)
        if not user.is_active:
            return jsonify({'error': 'User account not activated'}), 400
        
        # Verify that the user has a recent subscription (within last 5 minutes)
        from ..models.subscription import UserSubscription
        recent_subscription = UserSubscription.query.filter_by(
            user_id=user.id,
            payment_provider_id=session_id
        ).first()
        
        if not recent_subscription:
            return jsonify({'error': 'No recent subscription found'}), 400
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        login_history_service.log_login_attempt(
            user_id=user.id,
            is_successful=True
        )
        
        return jsonify({
            'message': 'Mock payment login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'subscription_status': user.subscription_status,
                'subscription_plan': user.subscription_plan
            },
            'account_type': 'user'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Mock payment login failed'}), 500

@auth_bp.route('/admin/me', methods=['GET'])
@jwt_required()
def get_current_admin():
    """Get current admin information (for admin accounts)."""
    try:
        current_admin_id = get_jwt_identity()
        admin = AdminUser.query.get(int(current_admin_id))
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404
        
        # Check if admin is active (not suspended)
        if not admin.is_active:
            return jsonify({'error': 'Admin account is suspended. Please contact support.'}), 403
        
        # Refresh the admin user to get latest role assignments
        db.session.refresh(admin)
        roles = [
            assignment.role.to_dict()
            for assignment in admin.user_assignments
            if assignment.is_active and assignment.role.is_active
        ]
        return jsonify({
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email,
                'full_name': admin.full_name,
                'is_active': admin.is_active,
                'is_super_admin': admin.is_super_admin,
                'roles': roles
            }
        }), 200
    except Exception:
        return jsonify({'error': 'Failed to get admin information'}), 500