#!/usr/bin/env python3

from app import create_app, db
from sqlalchemy import text

def fix_billing_cycle():
    app = create_app()
    with app.app_context():
        print('Fixing the Enterprise plan billing cycle...')
        
        # Fix the Enterprise plan directly
        sql = "UPDATE subscription_plans SET billing_cycle = 'MONTHLY' WHERE id = 3"
        result = db.session.execute(text(sql))
        print(f'Fixed Enterprise plan: {result.rowcount} rows updated')
        
        db.session.commit()
        
        # Verify the fix
        result = db.session.execute(text('SELECT id, name, billing_cycle FROM subscription_plans WHERE id = 3'))
        plan = result.fetchone()
        if plan:
            print(f'Enterprise plan after fix: ID: {plan[0]}, Name: {plan[1]}, Billing: {plan[2]}')
        else:
            print('Plan not found')
        
        print('\nAll billing cycles should now be fixed!')

if __name__ == '__main__':
    fix_billing_cycle()

