"""add workspace tables and works.workspace_id

Revision ID: 001
Revises:
Create Date: 2026-04-22

Adds: users, workspaces, workspace_members
Alters: works — adds workspace_id (nullable)

Down migration: removes all workspace additions cleanly.
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("handle", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("handle"),
    )

    # ── workspaces ───────────────────────────────────────────
    op.create_table(
        "workspaces",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column(
            "is_template",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workspaces_owner_id", "workspaces", ["owner_id"])
    op.create_index(
        "ix_workspaces_is_template",
        "workspaces",
        ["is_template"],
        postgresql_where=sa.text("is_template = TRUE"),
    )

    # ── workspace_members ─────────────────────────────────────
    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'editor'"),
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('owner', 'editor', 'viewer')",
            name="workspace_members_role_check",
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("workspace_id", "user_id"),
    )
    op.create_index(
        "ix_workspace_members_user_id", "workspace_members", ["user_id"]
    )

    # ── works: add workspace_id ───────────────────────────────
    op.add_column(
        "works", sa.Column("workspace_id", sa.UUID(), nullable=True)
    )
    op.create_foreign_key(
        "works_workspace_id_fkey", "works", "workspaces",
        ["workspace_id"], ["id"],
    )
    op.create_index("ix_works_workspace_id", "works", ["workspace_id"])


def downgrade() -> None:
    op.drop_index("ix_works_workspace_id", table_name="works")
    op.drop_constraint("works_workspace_id_fkey", "works", type_="foreignkey")
    op.drop_column("works", "workspace_id")

    op.drop_index("ix_workspace_members_user_id", table_name="workspace_members")
    op.drop_table("workspace_members")

    op.drop_index("ix_workspaces_is_template", table_name="workspaces")
    op.drop_index("ix_workspaces_owner_id", table_name="workspaces")
    op.drop_table("workspaces")

    op.drop_table("users")
