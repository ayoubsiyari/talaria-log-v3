import os
import sys
from dotenv import load_dotenv

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db

# Load environment variables
load_dotenv()

app = create_app('development') # Force development config

@app.shell_context_processor
def make_shell_context():
    """Add database models to Flask shell context"""
    try:
        # Import models that exist
        from app.models.user import User
        from app.models.rbac import AdminUser, AdminRole, Permission, UserRoleAssignment, RoleAuditLog
        
        context = {
            'db': db,
            'User': User,
            'AdminUser': AdminUser,
            'AdminRole': AdminRole,
            'Permission': Permission,
            'UserRoleAssignment': UserRoleAssignment,
            'RoleAuditLog': RoleAuditLog
        }
        
        # Try to import optional models
        try:
            from app.models.journal import JournalEntry, JournalTag
            context.update({'JournalEntry': JournalEntry, 'JournalTag': JournalTag})
        except ImportError:
            pass
            
        try:
            from app.models.backtest import Strategy, BacktestResult, BacktestParameter
            context.update({
                'Strategy': Strategy,
                'BacktestResult': BacktestResult,
                'BacktestParameter': BacktestParameter
            })
        except ImportError:
            pass
            
        try:
            from app.models.portfolio import Portfolio, Position
            context.update({'Portfolio': Portfolio, 'Position': Position})
        except ImportError:
            pass
            
        return context
        
    except ImportError as e:
        print(f"Warning: Could not import some models: {e}")
        return {'db': db}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)