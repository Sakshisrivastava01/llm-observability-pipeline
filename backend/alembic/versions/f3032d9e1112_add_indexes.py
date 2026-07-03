from collections.abc import Sequence
from typing import Union

from alembic import op

revision: str = "f3032d9e1112"
down_revision: Union[str, None] = "e962b1b36952"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_span_model_name", "span", ["model_name"])
    op.create_index("ix_alert_status", "alert", ["status"])


def downgrade() -> None:
    op.drop_index("ix_span_model_name", table_name="span")
    op.drop_index("ix_alert_status", table_name="alert")
