import pytest
import tempfile
import os
from app import create_app
from app.models import db as _db
from app.models.user import User
from app.models.admin import Admin
from app.models.subscription import Subscription
from app.models.journal import JournalEntry
from app.models.portfolio import Portfolio
from app.models.strategy import Strategy


@pytest.fixture
def app():
    """Create application for the tests."""
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture
def db(app):
    """Create a database for the tests."""
    with app.app_context():
        yield _db


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing."""
    admin = Admin(
        username='testadmin',
        email='admin@test.com',
        password_hash='hashed_password',
        role='super_admin',
        is_active=True
    )
    db.session.add(admin)
    db.session.commit()
    return admin


@pytest.fixture
def regular_user(db):
    """Create a regular user for testing."""
    user = User(
        username='testuser',
        email='user@test.com',
        password_hash='hashed_password',
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def subscription(db, regular_user):
    """Create a subscription for testing."""
    subscription = Subscription(
        user_id=regular_user.id,
        plan_type='premium',
        status='active',
        start_date='2024-01-01',
        end_date='2024-12-31'
    )
    db.session.add(subscription)
    db.session.commit()
    return subscription


@pytest.fixture
def journal_entry(db, regular_user):
    """Create a journal entry for testing."""
    entry = JournalEntry(
        user_id=regular_user.id,
        title='Test Entry',
        content='Test content',
        trade_date='2024-01-01',
        symbol='AAPL',
        entry_price=150.0,
        exit_price=155.0,
        quantity=100,
        trade_type='long'
    )
    db.session.add(entry)
    db.session.commit()
    return entry


@pytest.fixture
def portfolio(db, regular_user):
    """Create a portfolio for testing."""
    portfolio = Portfolio(
        user_id=regular_user.id,
        name='Test Portfolio',
        description='Test portfolio description',
        initial_balance=10000.0,
        current_balance=10500.0
    )
    db.session.add(portfolio)
    db.session.commit()
    return portfolio


@pytest.fixture
def strategy(db, regular_user):
    """Create a strategy for testing."""
    strategy = Strategy(
        user_id=regular_user.id,
        name='Test Strategy',
        description='Test strategy description',
        is_active=True
    )
    db.session.add(strategy)
    db.session.commit()
    return strategy
