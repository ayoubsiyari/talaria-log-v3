import sys
import os

# Ensure project root (backend) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.models.user import User

app = create_app()
with app.app_context():
    users = User.query.order_by(User.id.asc()).all()
    for u in users:
        print({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_admin': u.is_admin,
            'is_active': u.is_active,
        })
    if not users:
        print('NO_USERS')



