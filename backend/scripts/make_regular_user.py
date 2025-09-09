import sys
import os

# Ensure project root (backend) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app, db
from app.models.user import User


def make_regular_user(username: str) -> None:
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            user.is_admin = False
            db.session.commit()
            print(f"Updated user '{username}' to regular user (not admin).")
        else:
            print(f"User '{username}' not found.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_regular_user.py <username>")
        sys.exit(1)
    username = sys.argv[1]
    make_regular_user(username)


if __name__ == "__main__":
    main()

