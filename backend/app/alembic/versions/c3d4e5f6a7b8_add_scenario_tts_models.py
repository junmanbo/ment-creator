"""Add scenario TTS models

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-06-05 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    
    # Create scenario TTS table
    op.create_table('scenariotts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('text_content', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('voice_settings', sa.JSON(), nullable=True),
        sa.Column('scenario_id', sa.Uuid(), nullable=False),
        sa.Column('node_id', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('voice_actor_id', sa.Uuid(), nullable=True),
        sa.Column('tts_generation_id', sa.Uuid(), nullable=True),
        sa.Column('audio_file_path', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['user.id'], ),
        sa.ForeignKeyConstraint(['scenario_id'], ['scenario.id'], ),
        sa.ForeignKeyConstraint(['tts_generation_id'], ['ttsgeneration.id'], ),
        sa.ForeignKeyConstraint(['voice_actor_id'], ['voiceactor.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scenariotts_node_id'), 'scenariotts', ['node_id'], unique=False)
    op.create_index(op.f('ix_scenariotts_scenario_id'), 'scenariotts', ['scenario_id'], unique=False)
    
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_scenariotts_scenario_id'), table_name='scenariotts')
    op.drop_index(op.f('ix_scenariotts_node_id'), table_name='scenariotts')
    op.drop_table('scenariotts')
    # ### end Alembic commands ###
