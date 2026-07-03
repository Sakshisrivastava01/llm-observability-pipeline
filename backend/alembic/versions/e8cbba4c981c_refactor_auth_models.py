"""refactor_auth_models

Revision ID: e8cbba4c981c
Revises: d3108d6f3d34
Create Date: 2026-07-03 22:46:38.523965

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e8cbba4c981c"
down_revision = "d3108d6f3d34"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop index on old user table
    op.drop_index("ix_user_email", table_name="user")

    # 2. Rename user table to users
    op.rename_table("user", "users")

    # 3. Create index on users
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 4. Add new columns
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # 5. Create password_reset_tokens table
    op.create_table(
        "password_reset_tokens",
        sa.Column(
            "id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("otp", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    # 1. Drop password_reset_tokens table
    op.drop_table("password_reset_tokens")

    # 2. Drop new columns from users
    op.drop_column("users", "created_at")
    op.drop_column("users", "is_active")

    # 3. Drop index on users
    op.drop_index("ix_users_email", table_name="users")

    # 4. Rename users back to user
    op.rename_table("users", "user")

    # 5. Create index on user
    op.create_index("ix_user_email", "user", ["email"], unique=True)
