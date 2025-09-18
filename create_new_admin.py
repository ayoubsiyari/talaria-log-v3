from app import create_app, db
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment
from flask_bcrypt import generate_password_hash

app = create_app('development')
with app.app_context():
    # Delete existing super admin
    existing_admin = AdminUser.query.filter_by(email='superadmin@talaria.com').first()
    if existing_admin:
        db.session.delete(existing_admin)
        db.session.commit()
        print('Deleted existing admin')
    
    # Create new super admin with correct password format
    super_admin = AdminUser(
        username='superadmin',
        email='superadmin@talaria.com',
        password_hash=generate_password_hash('SuperAdmin123!').decode('utf-8'),
        first_name='Super',
        last_name='Admin',
        is_active=True,
        is_super_admin=True
    )
    
    db.session.add(super_admin)
    db.session.commit()
    
    print(f'New Super Admin created with ID: {super_admin.id}')
    print(f'Username: {super_admin.username}')
    print(f'Email: {super_admin.email}')
    print(f'Password: SuperAdmin123!')
    print(f'Password check: {super_admin.check_password("SuperAdmin123!")}')
    
    # Assign super_admin role
    super_admin_role = AdminRole.query.filter_by(name='super_admin').first()
    if super_admin_role:
        assignment = UserRoleAssignment(
            user_id=super_admin.id,
            role_id=super_admin_role.id,
            assigned_by=super_admin.id
        )
        db.session.add(assignment)
        db.session.commit()
        print('Super admin role assigned')
