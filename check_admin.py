from app import create_app, db
from app.models.rbac import AdminUser

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Admin found: {admin.username}')
        print(f'Email: {admin.email}')
        print(f'Is active: {admin.is_active}')
        print(f'Password check: {admin.check_password("SuperAdmin123!")}')
        print(f'Password hash: {admin.password_hash[:50]}...')
    else:
        print('Admin not found')
