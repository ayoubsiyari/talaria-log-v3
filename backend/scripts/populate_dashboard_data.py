#!/usr/bin/env python3
"""
Script to populate sample data for the dashboard charts and metrics.
This will create realistic data for testing the chart-based dashboard.
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.rbac import AdminUser, AdminRole, UserRoleAssignment
from app.models.activity import UserActivityLog
from app.models.subscription import RevenueSnapshot, SubscriptionMetrics
from sqlalchemy import func

def create_sample_users():
    """Create sample users with realistic registration dates"""
    print("Creating sample users...")
    
    # Create users over the last 8 months
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=240)
    
    # Generate realistic user growth pattern
    base_users = 100
    growth_rate = 1.15  # 15% monthly growth
    
    current_date = start_date
    cumulative_users = base_users
    
    while current_date <= end_date:
        # Create users for this month
        new_users_this_month = int(cumulative_users * (growth_rate - 1))
        
        for i in range(new_users_this_month):
            # Random date within the month
            random_day = random.randint(1, 28)
            user_date = current_date.replace(day=random_day)
            
            # Create user
            user = User(
                email=f"user_{cumulative_users + i}@example.com",
                username=f"user_{cumulative_users + i}",
                first_name=f"User{cumulative_users + i}",
                last_name="Example",
                is_active=random.choice([True, True, True, False]),  # 75% active
                created_at=user_date,
                updated_at=user_date
            )
            db.session.add(user)
        
        cumulative_users += new_users_this_month
        current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    
    db.session.commit()
    print(f"Created {cumulative_users} sample users")

def create_sample_roles():
    """Create sample roles and assign them to users"""
    print("Creating sample roles...")
    
    roles = [
        {"name": "Regular User", "description": "Standard user role"},
        {"name": "Premium User", "description": "Premium subscription user"},
        {"name": "Moderator", "description": "Content moderator"},
        {"name": "Support Agent", "description": "Customer support agent"},
        {"name": "Analyst", "description": "Data analyst"}
    ]
    
    created_roles = []
    for role_data in roles:
        role = AdminRole(**role_data)
        db.session.add(role)
        created_roles.append(role)
    
    db.session.commit()
    
    # Assign roles to users
    users = User.query.filter(~User.email.like('deleted_%')).all()
    
    for user in users:
        # 70% get regular user role, 20% get premium, 10% get other roles
        rand = random.random()
        if rand < 0.7:
            role = created_roles[0]  # Regular User
        elif rand < 0.9:
            role = created_roles[1]  # Premium User
        else:
            role = random.choice(created_roles[2:])  # Other roles
        
        assignment = UserRoleAssignment(
            user_id=user.id,
            role_id=role.id,
            is_active=True,
            assigned_at=user.created_at
        )
        db.session.add(assignment)
    
    db.session.commit()
    print("Created roles and assignments")

def create_sample_activity():
    """Create sample activity logs"""
    print("Creating sample activity logs...")
    
    users = User.query.filter(~User.email.like('deleted_%')).all()
    
    # Create activity for the last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    action_types = ['login', 'logout', 'create_journal', 'update_profile', 'view_dashboard']
    action_categories = ['authentication', 'journal', 'profile', 'dashboard']
    
    for user in users:
        # Each user has some activity
        activity_count = random.randint(1, 20)
        
        for _ in range(activity_count):
            # Random date within the last 30 days
            random_days = random.randint(0, 30)
            activity_date = end_date - timedelta(days=random_days)
            
            # Random hour of the day
            random_hour = random.randint(0, 23)
            activity_date = activity_date.replace(hour=random_hour, minute=random.randint(0, 59))
            
            action_type = random.choice(action_types)
            action_category = random.choice(action_categories)
            
            # 95% success rate
            status = 'success' if random.random() < 0.95 else 'failed'
            
            activity = UserActivityLog(
                user_id=user.id,
                action_type=action_type,
                action_category=action_category,
                action_subcategory=None,
                session_id=f"session_{random.randint(1000, 9999)}",
                request_id=f"req_{random.randint(10000, 99999)}",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                country_code="US",
                city="New York",
                resource_type="user",
                resource_id=user.id,
                resource_name=user.username,
                description=f"User {action_type}",
                status=status,
                created_at=activity_date,
                updated_at=activity_date
            )
            db.session.add(activity)
    
    db.session.commit()
    print("Created sample activity logs")

def create_sample_revenue_data():
    """Create sample revenue and subscription data"""
    print("Creating sample revenue data...")
    
    # Create revenue snapshots for the last 8 months
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=240)
    
    current_date = start_date
    base_revenue = 50000
    growth_rate = 1.12  # 12% monthly growth
    
    while current_date <= end_date:
        # Monthly revenue snapshot
        revenue = base_revenue * (growth_rate ** ((current_date - start_date).days / 30))
        
        snapshot = RevenueSnapshot(
            snapshot_date=current_date,
            period_type='monthly',
            total_revenue=revenue,
            recurring_revenue=revenue * 0.85,
            one_time_revenue=revenue * 0.15,
            refunds=revenue * 0.02,
            net_revenue=revenue * 0.98,
            mrr=revenue * 0.85,
            arr=revenue * 0.85 * 12,
            revenue_by_plan={
                'basic': revenue * 0.3,
                'premium': revenue * 0.5,
                'enterprise': revenue * 0.2
            },
            revenue_by_region={
                'US': revenue * 0.6,
                'EU': revenue * 0.25,
                'Asia': revenue * 0.15
            },
            created_at=current_date
        )
        db.session.add(snapshot)
        
        # Subscription metrics
        total_users = User.query.filter(~User.email.like('deleted_%')).count()
        active_subscriptions = int(total_users * 0.7)  # 70% subscription rate
        
        metrics = SubscriptionMetrics(
            date=current_date,
            total_subscriptions=total_users,
            active_subscriptions=active_subscriptions,
            cancelled_subscriptions=int(total_users * 0.1),
            new_subscriptions=int(total_users * 0.15),
            churned_subscriptions=int(total_users * 0.05),
            mrr=revenue * 0.85,
            arr=revenue * 0.85 * 12,
            total_revenue=revenue,
            churn_rate=0.05,
            growth_rate=0.15,
            trial_conversion_rate=0.25,
            average_revenue_per_user=revenue / total_users if total_users > 0 else 0,
            lifetime_value=revenue / total_users * 12 if total_users > 0 else 0,
            created_at=current_date
        )
        db.session.add(metrics)
        
        current_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
    
    db.session.commit()
    print("Created sample revenue and subscription data")

def main():
    """Main function to populate all sample data"""
    app = create_app()
    
    with app.app_context():
        print("Starting to populate dashboard sample data...")
        
        # Check if data already exists
        user_count = User.query.filter(~User.email.like('deleted_%')).count()
        if user_count > 10:
            print(f"Found {user_count} existing users. Skipping data population.")
            return
        
        create_sample_users()
        create_sample_roles()
        create_sample_activity()
        create_sample_revenue_data()
        
        print("Dashboard sample data population completed!")

if __name__ == "__main__":
    main()
