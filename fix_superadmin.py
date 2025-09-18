from app import create_app, db
from app.models.rbac import AdminUser
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    # Delete all existing admin users
    AdminUser.query.delete()
    db.session.commit()
    print('Deleted all existing admin users')
    
    # Create a fresh super admin with proper password hash
    password_hash = generate_password_hash('SuperAdmin123!')
    print(f'Generated password hash: {password_hash}')
    print(f'Hash type: {type(password_hash)}')
    
    super_admin = AdminUser(
        username='superadmin',
        email='superadmin@talaria.com',
        password_hash=password_hash,  # This will be bytes
        first_name='Super',
        last_name='Admin',
        is_active=True,
        is_super_admin=True
    )
    
    db.session.add(super_admin)
    db.session.commit()
    
    print(f'✅ Super Admin created successfully!')
    print(f'ID: {super_admin.id}')
    print(f'Username: {super_admin.username}')
    print(f'Email: {super_admin.email}')
    print(f'Password: SuperAdmin123!')
    print(f'Is active: {super_admin.is_active}')
    print(f'Is super admin: {super_admin.is_super_admin}')
    
    # Test the password
    try:
        result = super_admin.check_password('SuperAdmin123!')
        print(f'✅ Password check result: {result}')
        if result:
            print('🎉 Login should work now!')
        else:
            print('❌ Password check failed')
    except Exception as e:
        print(f'❌ Password check error: {e}')
        # If it fails, convert to string
        super_admin.password_hash = password_hash.decode('utf-8')
        db.session.commit()
        print('Converting password hash to string...')
        result = super_admin.check_password('SuperAdmin123!')
        print(f'✅ Password check after conversion: {result}')
