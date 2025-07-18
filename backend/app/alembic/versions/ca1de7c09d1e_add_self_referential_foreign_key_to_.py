"""Add self-referential foreign key to ScenarioVersion.parent_version_id

Revision ID: ca1de7c09d1e
Revises: 57c7e781ea1b
Create Date: 2025-06-05 22:02:31.911317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'ca1de7c09d1e'
down_revision: Union[str, None] = '57c7e781ea1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    
    # Add parent_version_id column only if it doesn't exist
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('scenarioversion')]
    
    if 'parent_version_id' not in columns:
        op.add_column('scenarioversion', sa.Column('parent_version_id', sa.Uuid(), nullable=True))
        print('✅ parent_version_id 컬럼 추가됨')
    else:
        print('ℹ️ parent_version_id 컬럼이 이미 존재함')
    
    # Add foreign key constraint if it doesn't exist
    foreign_keys = inspector.get_foreign_keys('scenarioversion')
    has_parent_fk = any('parent_version_id' in fk['constrained_columns'] for fk in foreign_keys)
    
    if not has_parent_fk:
        op.create_foreign_key(
            'fk_scenarioversion_parent_version_id', 
            'scenarioversion', 
            'scenarioversion', 
            ['parent_version_id'], 
            ['id']
        )
        print('✅ parent_version foreign key constraint 추가됨')
    else:
        print('ℹ️ parent_version foreign key constraint가 이미 존재함')
    
    op.drop_index(op.f('ix_scenariotts_node_id'), table_name='scenariotts')
    op.drop_index(op.f('ix_scenariotts_scenario_id'), table_name='scenariotts')
    op.drop_index(op.f('idx_scenarioversion_auto_generated'), table_name='scenarioversion')
    op.drop_index(op.f('idx_scenarioversion_parent'), table_name='scenarioversion')
    op.drop_index(op.f('idx_scenarioversion_scenario_status'), table_name='scenarioversion')
    op.drop_index(op.f('idx_scenarioversion_tag'), table_name='scenarioversion')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    
    # Remove parent_version_id foreign key and column safely
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    # Check and remove foreign key constraint
    foreign_keys = inspector.get_foreign_keys('scenarioversion')
    has_parent_fk = any('parent_version_id' in fk['constrained_columns'] for fk in foreign_keys)
    
    if has_parent_fk:
        op.drop_constraint('fk_scenarioversion_parent_version_id', 'scenarioversion', type_='foreignkey')
        print('✅ parent_version foreign key constraint 제거됨')
    
    # Check and remove column
    columns = [col['name'] for col in inspector.get_columns('scenarioversion')]
    if 'parent_version_id' in columns:
        op.drop_column('scenarioversion', 'parent_version_id')
        print('✅ parent_version_id 컬럼 제거됨')
    
    # Restore indexes if needed (these might not exist, so wrap in try-except would be safer)
    try:
        op.create_index(op.f('idx_scenarioversion_tag'), 'scenarioversion', ['tag'], unique=False)
        op.create_index(op.f('idx_scenarioversion_scenario_status'), 'scenarioversion', ['scenario_id', 'version_status'], unique=False)
        op.create_index(op.f('idx_scenarioversion_parent'), 'scenarioversion', ['parent_version_id'], unique=False)
        op.create_index(op.f('idx_scenarioversion_auto_generated'), 'scenarioversion', ['auto_generated'], unique=False)
        op.create_index(op.f('ix_scenariotts_scenario_id'), 'scenariotts', ['scenario_id'], unique=False)
        op.create_index(op.f('ix_scenariotts_node_id'), 'scenariotts', ['node_id'], unique=False)
    except Exception as e:
        print(f'⚠️ 인덱스 복원 중 오류 (ignored): {e}')
    # ### end Alembic commands ###
