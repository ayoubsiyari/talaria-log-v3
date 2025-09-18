from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    # Get the super admin
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if admin:
        print(f'Found admin: {admin.username}')
        print(f'Current password hash: {admin.password_hash}')
        print(f'Hash type: {type(admin.password_hash)}')
        
        # Generate a new password hash as string
        new_hash = generate_password_hash('SuperAdmin123!').decode('utf-8')
        print(f'New hash: {new_hash}')
        
        # Update the password
        admin.password_hash = new_hash
        db.session.commit()
        
        print('✅ Password updated successfully!')
        
        # Test the password
        try:
            result = admin.check_password('SuperAdmin123!')
            print(f'✅ Password check result: {result}')
            if result:
                print('🎉 Login should work now!')
            else:
                print('❌ Password check failed')
        except Exception as e:
            print(f'❌ Password check error: {e}')
    else:
        print('Admin not found')
