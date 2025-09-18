from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash
import os

app = create_app('development')
with app.app_context():
    # Delete all existing admin users
    AdminUser.query.delete()
    db.session.commit()
    print('Deleted all existing admin users')
    
    # Create a fresh super admin
    password_hash = generate_password_hash('SuperAdmin123!')
    print(f'Generated hash type: {type(password_hash)}')
    print(f'Generated hash: {password_hash}')
    
    super_admin = AdminUser(
        username='superadmin',
        email='superadmin@talaria.com',
        password_hash=password_hash,
        first_name='Super',
        last_name='Admin',
        is_active=True,
        is_super_admin=True
    )
    
    db.session.add(super_admin)
    db.session.commit()
    
    print(f'New Super Admin created with ID: {super_admin.id}')
    print(f'Username: {super_admin.username}')
    print(f'Email: {super_admin.email}')
    print(f'Password: SuperAdmin123!')
    print(f'Is active: {super_admin.is_active}')
    print(f'Is super admin: {super_admin.is_super_admin}')
    
    # Test password check
    try:
        result = super_admin.check_password('SuperAdmin123!')
        print(f'Password check result: {result}')
    except Exception as e:
        print(f'Password check error: {e}')
        print(f'Password hash in DB: {super_admin.password_hash}')
        print(f'Hash type: {type(super_admin.password_hash)}')
