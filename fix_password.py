from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Current hash: {admin.password_hash}')
        # Generate new hash
        new_hash = generate_password_hash('SuperAdmin123!')
        print(f'New hash: {new_hash}')
        print(f'Type: {type(new_hash)}')
        # Update password
        admin.password_hash = new_hash
        db.session.commit()
        print('Password updated successfully')
        
        # Test the password
        print(f'Password check: {admin.check_password("SuperAdmin123!")}')
    else:
        print('Admin not found')
