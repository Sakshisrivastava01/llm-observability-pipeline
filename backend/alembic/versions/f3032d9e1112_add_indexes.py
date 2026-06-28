"""add indexes

Revision ID: f3032d9e1112
Revises: e962b1b36952
Create Date: 2026-06-28 14:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3032d9e1112"
down_revision: Union[str, None] = "e962b1b36952"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add indexes for spans
    op.create_index("ix_span_model_name", "span", ["model_name"])
    # Add index for alerts
    op.create_index("ix_alert_status", "alert", ["status"])


def downgrade() -> None:
    op.drop_index("ix_span_model_name", table_name="span")
    op.drop_index("ix_alert_status", table_name="alert")
