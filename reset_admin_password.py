from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
import getpass

app = create_app('development')

# Safety check to prevent accidental production runs
if app.config.get('ENV') != 'development':
    print('This script should only run in development environment')
    exit(1)

with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        # Get password securely
        new_password = getpass.getpass('Enter new admin password: ')
        # Reset password with correct hashing (decode if needed)
        hashed = generate_password_hash(new_password)
        if isinstance(hashed, bytes):
            hashed = hashed.decode('utf-8')
        admin.password_hash = hashed
        db.session.commit()
        print(f'Password reset for admin: {admin.username}')
        print(f'New password check: {admin.check_password(new_password)}')
    else:
        print('Admin not found')
