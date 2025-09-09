import sys
import os
from typing import Optional

# Ensure project root (backend) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app, db, bcrypt
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment


def create_or_update_admin(username: str, email: str, password: str, first_name: Optional[str] = None, last_name: Optional[str] = None):
    app = create_app()
    with app.app_context():
        # Ensure a 'Super Admin' role exists
        super_admin_role = AdminRole.query.filter_by(name='Super Admin').first()
        if not super_admin_role:
            print("Creating 'Super Admin' role...")
            super_admin_role = AdminRole(
                name='Super Admin',
                description='Full access to all system features.',
                is_system_role=True,
                is_active=True
            )
            db.session.add(super_admin_role)
            db.session.commit()

        # Check for an existing admin user
        admin_user = AdminUser.query.filter_by(username=username).first()
        if admin_user:
            print(f"Updating existing admin user '{username}'...")
            admin_user.email = email
            admin_user.is_active = True
            if first_name:
                admin_user.first_name = first_name
            if last_name:
                admin_user.last_name = last_name
            if password:
                admin_user.set_password(password)
        else:
            print(f"Creating new admin user '{username}'...")
            admin_user = AdminUser(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_super_admin=True
            )
            admin_user.set_password(password)
            db.session.add(admin_user)
            db.session.commit()

        # Ensure the admin user is assigned the 'Super Admin' role
        assignment = UserRoleAssignment.query.filter_by(
            admin_user_id=admin_user.id,
            role_id=super_admin_role.id
        ).first()

        if not assignment:
            print(f"Assigning 'Super Admin' role to '{username}'...")
            assignment = UserRoleAssignment(
                admin_user_id=admin_user.id,
                role_id=super_admin_role.id,
                assigned_by=admin_user.id,
                is_active=True
            )
            db.session.add(assignment)
        else:
            print(f"'{username}' already has 'Super Admin' role.")

        db.session.commit()
        print(f"Admin user '{username}' is configured successfully.")
    return app

def run_diagnostics(app, username):
    with app.app_context():
        print("\n--- Running Database Diagnostics ---")
        admin_user = AdminUser.query.filter_by(username=username).first()
        if not admin_user:
            print(f"DIAGNOSTIC ERROR: Admin user '{username}' not found.")
            return
        print(f"DIAGNOSTIC SUCCESS: Found AdminUser: id={admin_user.id}, username='{admin_user.username}'")

        super_admin_role = AdminRole.query.filter_by(name='Super Admin').first()
        if not super_admin_role:
            print("DIAGNOSTIC ERROR: 'Super Admin' role not found.")
            return
        print(f"DIAGNOSTIC SUCCESS: Found AdminRole: id={super_admin_role.id}, name='{super_admin_role.name}'")

        assignment = UserRoleAssignment.query.filter_by(admin_user_id=admin_user.id, role_id=super_admin_role.id).first()
        if not assignment:
            print("DIAGNOSTIC ERROR: No 'Super Admin' role assignment found for the admin user.")
            return
        print(f"DIAGNOSTIC SUCCESS: Found UserRoleAssignment linking admin user to 'Super Admin' role.")

        assigned_roles = admin_user.assigned_roles
        if not assigned_roles:
            print("DIAGNOSTIC ERROR: The `assigned_roles` property on the AdminUser object is empty.")
        else:
            print(f"DIAGNOSTIC SUCCESS: The `assigned_roles` property returns: {[role.name for role in assigned_roles]}")
        print("--- Diagnostics Complete ---")

def main():
    if len(sys.argv) < 4:
        print("Usage: python scripts/create_admin.py <username> <email> <password> [first_name] [last_name]")
        sys.exit(1)
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    first_name = sys.argv[4] if len(sys.argv) > 4 else None
    last_name = sys.argv[5] if len(sys.argv) > 5 else None
    app = create_or_update_admin(username, email, password, first_name, last_name)
    if app:
        run_diagnostics(app, username)

if __name__ == "__main__":
    main()
