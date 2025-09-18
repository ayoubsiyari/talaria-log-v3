import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app, db
from backend.app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    # Find the admin user
    admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    
    if admin:
        print(f'Found admin: {admin.username} - {admin.email}')
        print(f'Current password hash: {admin.password_hash}')
        
        # Set a new password using the proper method
        new_password = 'SuperAdmin123!'
        admin.set_password(new_password)
        
        db.session.commit()
        
        print(f'✅ Password updated successfully!')
        print(f'New password: {new_password}')
        
        # Test the password
        try:
            result = admin.check_password(new_password)
            print(f'Password check: {result}')
            if result:
                print('🎉 SUCCESS! Login should work now!')
            else:
                print('❌ Password check failed')
        except Exception as e:
            print(f'❌ Error testing password: {e}')
    else:
        print('❌ Admin user not found')
