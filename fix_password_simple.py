from app import create_app, db
from app.models.rbac import AdminUser
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        admin.password_hash = generate_password_hash('superadmin123')
        db.session.commit()
        print('Password updated successfully!')
        print(f'Username: {admin.username}')
        print(f'Email: {admin.email}')
        print(f'Password: superadmin123')
    else:
        print('Admin not found')
