import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app, db
from backend.app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash
import os

app = create_app('development')
with app.app_context():
    # Delete all admin users
    AdminUser.query.delete()
    db.session.commit()
    print('Deleted all admin users')
    
    # Create a working super admin
    password = 'SuperAdmin123!'
    password_hash = generate_password_hash(password).decode('utf-8')
    
    print(f'Creating admin with password: {password}')
    print(f'Password hash: {password_hash}')
    
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
    
    print(f'✅ Super Admin created!')
    print(f'Username: {super_admin.username}')
    print(f'Email: {super_admin.email}')
    print(f'Password: {password}')
    
    # Test the password
    try:
        result = super_admin.check_password(password)
        print(f'Password check: {result}')
        if result:
            print('🎉 SUCCESS! Login should work now!')
        else:
            print('❌ Password check failed')
    except Exception as e:
        print(f'❌ Error: {e}')
