from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        # Update password hash to be a string
        admin.password_hash = generate_password_hash('SuperAdmin123!').decode('utf-8')
        db.session.commit()
        print('Password hash updated to string format')
        print(f'New hash type: {type(admin.password_hash)}')
        print(f'New hash: {admin.password_hash}')
        
        # Test password check
        result = admin.check_password('SuperAdmin123!')
        print(f'Password check result: {result}')
    else:
        print('Admin not found')
