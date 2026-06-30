"""add_performance_indexes

Revision ID: d3108d6f3d34
Revises: e0f768643229
Create Date: 2026-06-30 16:39:53.758851

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d3108d6f3d34"
down_revision = "e0f768643229"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_trace_start_time", "trace", ["start_time"])
    op.create_index("ix_span_span_type", "span", ["span_type"])
    op.create_index("ix_evaluation_timestamp", "evaluation", ["timestamp"])
    op.create_index("ix_alert_timestamp", "alert", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_alert_timestamp", table_name="alert")
    op.drop_index("ix_evaluation_timestamp", table_name="evaluation")
    op.drop_index("ix_span_span_type", table_name="span")
    op.drop_index("ix_trace_start_time", table_name="trace")
