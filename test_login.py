from app import create_app, db
from app.models.rbac import AdminUser

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Admin found: {admin.username}')
        print(f'Password hash type: {type(admin.password_hash)}')
        print(f'Password hash: {admin.password_hash}')
        
        # Test password check with manual conversion
        if isinstance(admin.password_hash, bytes):
            password_hash = admin.password_hash.decode('utf-8')
        else:
            password_hash = admin.password_hash
            
        from werkzeug.security import check_password_hash
        result = check_password_hash(password_hash, 'SuperAdmin123!')
        print(f'Manual password check: {result}')
    else:
        print('Admin not found')
