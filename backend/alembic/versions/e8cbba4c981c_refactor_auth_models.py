import sqlalchemy as sa
from alembic import op

revision = "e8cbba4c981c"
down_revision = "d3108d6f3d34"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_user_email", table_name="user")

    op.rename_table("user", "users")

    op.create_index("ix_users_email", "users", ["email"], unique=True)

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
    op.drop_table("password_reset_tokens")

    op.drop_column("users", "created_at")
    op.drop_column("users", "is_active")

    op.drop_index("ix_users_email", table_name="users")

    op.rename_table("users", "user")

    op.create_index("ix_user_email", "user", ["email"], unique=True)
