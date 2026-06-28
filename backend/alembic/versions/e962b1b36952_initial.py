"""initial

Revision ID: e962b1b36952
Revises:
Create Date: 2026-06-28 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e962b1b36952"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create trace table
    op.create_table(
        "trace",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trace_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("input_data", sa.JSON(), nullable=False),
        sa.Column("output_data", sa.JSON(), nullable=False),
        sa.Column("custom_metadata", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trace_trace_id"), "trace", ["trace_id"], unique=True)

    # 2. Create span table
    op.create_table(
        "span",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("span_id", sa.String(length=255), nullable=False),
        sa.Column("trace_id", sa.String(length=255), nullable=False),
        sa.Column("parent_span_id", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("span_type", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("input_data", sa.JSON(), nullable=False),
        sa.Column("output_data", sa.JSON(), nullable=False),
        sa.Column("model_name", sa.String(length=255), nullable=True),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("cost", sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("custom_metadata", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["trace_id"], ["trace.trace_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_span_span_id"), "span", ["span_id"], unique=True)
    op.create_index(op.f("ix_span_trace_id"), "span", ["trace_id"], unique=False)

    # 3. Create evaluation table
    op.create_table(
        "evaluation",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trace_id", sa.String(length=255), nullable=False),
        sa.Column("span_id", sa.String(length=255), nullable=True),
        sa.Column("metric_name", sa.String(length=255), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("feedback", sa.String(), nullable=True),
        sa.Column("custom_metadata", sa.JSON(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["span_id"], ["span.span_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["trace_id"], ["trace.trace_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_evaluation_metric_name"), "evaluation", ["metric_name"], unique=False
    )
    op.create_index(
        op.f("ix_evaluation_span_id"), "evaluation", ["span_id"], unique=False
    )
    op.create_index(
        op.f("ix_evaluation_trace_id"), "evaluation", ["trace_id"], unique=False
    )

    # 4. Create model_pricing table
    op.create_table(
        "model_pricing",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("model_name", sa.String(length=255), nullable=False),
        sa.Column(
            "input_token_price_per_1k",
            sa.Numeric(precision=10, scale=6),
            nullable=False,
        ),
        sa.Column(
            "output_token_price_per_1k",
            sa.Numeric(precision=10, scale=6),
            nullable=False,
        ),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_model_pricing_model_name"),
        "model_pricing",
        ["model_name"],
        unique=True,
    )

    # 5. Create alert table
    op.create_table(
        "alert",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("metric_name", sa.String(length=255), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=False),
        sa.Column("actual_value", sa.Float(), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_alert_metric_name"), "alert", ["metric_name"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_alert_metric_name"), table_name="alert")
    op.drop_table("alert")
    op.drop_index(op.f("ix_model_pricing_model_name"), table_name="model_pricing")
    op.drop_table("model_pricing")
    op.drop_index(op.f("ix_evaluation_trace_id"), table_name="evaluation")
    op.drop_index(op.f("ix_evaluation_span_id"), table_name="evaluation")
    op.drop_index(op.f("ix_evaluation_metric_name"), table_name="evaluation")
    op.drop_table("evaluation")
    op.drop_index(op.f("ix_span_trace_id"), table_name="span")
    op.drop_index(op.f("ix_span_span_id"), table_name="span")
    op.drop_table("span")
    op.drop_index(op.f("ix_trace_trace_id"), table_name="trace")
    op.drop_table("trace")
