from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    users = User.query.filter_by(is_active=True).all()
    print('Active users:')
    for u in users:
        print(f'  {u.email} - is_active: {u.is_active}, subscription_status: {u.subscription_status}')
    
    print('\nAll users:')
    all_users = User.query.all()
    for u in all_users:
        print(f'  {u.email} - is_active: {u.is_active}, subscription_status: {u.subscription_status}')
