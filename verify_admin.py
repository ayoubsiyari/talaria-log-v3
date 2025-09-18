from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Admin found: {admin.username}')
        print(f'Email: {admin.email}')
        print(f'Is active: {admin.is_active}')
        print(f'Is super admin: {admin.is_super_admin}')
        print(f'Password hash type: {type(admin.password_hash)}')
        print(f'Password hash: {admin.password_hash[:50]}...')
        
        # Test password check
        try:
            result = admin.check_password('SuperAdmin123!')
            print(f'Password check result: {result}')
        except Exception as e:
            print(f'Password check error: {e}')
            
        # If password check fails, reset it
        if not admin.check_password('SuperAdmin123!'):
            print('Resetting password...')
            admin.password_hash = generate_password_hash('SuperAdmin123!').decode('utf-8')
            db.session.commit()
            print('Password reset successfully')
            print(f'New password check: {admin.check_password("SuperAdmin123!")}')
    else:
        print('Admin not found')
