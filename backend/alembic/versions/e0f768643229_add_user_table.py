"""add_user_table

Revision ID: e0f768643229
Revises: f3032d9e1112
Create Date: 2026-06-30 16:22:10.939371

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e0f768643229"
down_revision = "f3032d9e1112"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")
