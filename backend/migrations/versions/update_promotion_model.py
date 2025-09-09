"""Update Promotion model

Revision ID: update_promotion_model
Revises: f3ba2b9595c6
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'update_promotion_model'
down_revision = 'f3ba2b9595c6'
branch_labels = None
depends_on = None


def upgrade():
    # Rename columns
    op.alter_column('promotions', 'discount_type', new_column_name='type')
    op.alter_column('promotions', 'discount_value', new_column_name='value')
    
    # Add new columns
    op.add_column('promotions', sa.Column('status', sa.String(20), nullable=False, server_default='active'))
    op.add_column('promotions', sa.Column('revenue', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('promotions', sa.Column('conversions', sa.Integer(), nullable=False, server_default='0'))
    
    # Update usage_limit default to None (unlimited)
    op.alter_column('promotions', 'usage_limit', nullable=True)
    
    # Remove is_active column (replaced by status)
    op.drop_column('promotions', 'is_active')


def downgrade():
    # Add back is_active column
    op.add_column('promotions', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    
    # Remove new columns
    op.drop_column('promotions', 'conversions')
    op.drop_column('promotions', 'revenue')
    op.drop_column('promotions', 'status')
    
    # Rename columns back
    op.alter_column('promotions', 'type', new_column_name='discount_type')
    op.alter_column('promotions', 'value', new_column_name='discount_value')
    
    # Update usage_limit default back to 1
    op.alter_column('promotions', 'usage_limit', nullable=False, server_default='1')
