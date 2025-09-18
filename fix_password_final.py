from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Admin found: {admin.username}')
        print(f'Current password hash type: {type(admin.password_hash)}')
        
        # Convert password hash to string
        admin.password_hash = generate_password_hash('SuperAdmin123!').decode('utf-8')
        db.session.commit()
        
        print('Password hash updated to string format')
        print(f'New password hash type: {type(admin.password_hash)}')
        
        # Test password check
        result = admin.check_password('SuperAdmin123!')
        print(f'Password check result: {result}')
        
        if result:
            print('✅ Login should work now!')
        else:
            print('❌ Login still not working')
    else:
        print('Admin not found')
