from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        # Just update the password hash to be a string
        admin.password_hash = generate_password_hash('SuperAdmin123!').decode('utf-8')
        db.session.commit()
        print('Password updated successfully')
        print(f'Password check: {admin.check_password("SuperAdmin123!")}')
    else:
        print('Admin not found')
