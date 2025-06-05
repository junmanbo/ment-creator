"""Enhanced scenario version management

Revision ID: e4f5a6b7c8d9
Revises: d275b7deb242
Create Date: 2025-06-05 15:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, None] = 'd275b7deb242'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create new enum types
    version_status = postgresql.ENUM('draft', 'stable', 'release', 'deprecated', name='versionstatus')
    version_status.create(op.get_bind())
    
    change_type = postgresql.ENUM('added', 'modified', 'deleted', 'moved', name='changetype')
    change_type.create(op.get_bind())
    
    # Add new columns to scenario_version table
    op.add_column('scenarioversion', sa.Column('version_status', sa.Enum('draft', 'stable', 'release', 'deprecated', name='versionstatus'), nullable=False, server_default='draft'))
    op.add_column('scenarioversion', sa.Column('tag', sa.String(length=50), nullable=True))
    op.add_column('scenarioversion', sa.Column('parent_version_id', sa.UUID(), nullable=True))
    op.add_column('scenarioversion', sa.Column('change_summary', sa.JSON(), nullable=True))
    op.add_column('scenarioversion', sa.Column('auto_generated', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('scenarioversion', sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Add foreign key constraint for parent_version_id
    op.create_foreign_key(
        'fk_scenarioversion_parent_version',
        'scenarioversion', 
        'scenarioversion',
        ['parent_version_id'], 
        ['id']
    )
    
    # Create index for better performance
    op.create_index('idx_scenarioversion_scenario_status', 'scenarioversion', ['scenario_id', 'version_status'])
    op.create_index('idx_scenarioversion_tag', 'scenarioversion', ['tag'])
    op.create_index('idx_scenarioversion_auto_generated', 'scenarioversion', ['auto_generated'])
    op.create_index('idx_scenarioversion_parent', 'scenarioversion', ['parent_version_id'])

def downgrade() -> None:
    # Drop indices
    op.drop_index('idx_scenarioversion_parent')
    op.drop_index('idx_scenarioversion_auto_generated')
    op.drop_index('idx_scenarioversion_tag')
    op.drop_index('idx_scenarioversion_scenario_status')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_scenarioversion_parent_version', 'scenarioversion', type_='foreignkey')
    
    # Drop columns
    op.drop_column('scenarioversion', 'updated_at')
    op.drop_column('scenarioversion', 'auto_generated')
    op.drop_column('scenarioversion', 'change_summary')
    op.drop_column('scenarioversion', 'parent_version_id')
    op.drop_column('scenarioversion', 'tag')
    op.drop_column('scenarioversion', 'version_status')
    
    # Drop enum types
    version_status = postgresql.ENUM('draft', 'stable', 'release', 'deprecated', name='versionstatus')
    version_status.drop(op.get_bind())
    
    change_type = postgresql.ENUM('added', 'modified', 'deleted', 'moved', name='changetype')
    change_type.drop(op.get_bind())
