-- ============================================================
-- migration_001_workspace.sql
-- Task 14a — workspace foundation
-- Date: 2026-04-22
--
-- Adds: users, workspaces, workspace_members
-- Alters: works (adds workspace_id nullable)
--
-- Apply to existing storyos_v2 DB:
--   PG_USER=$(cd ~/bot_factory && grep ^POSTGRES_USER .env | cut -d= -f2)
--   docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
--     < ~/projects/office/backend/storyos_api_v2/migrations/migration_001_workspace.sql
--
-- For fresh installs: use schema.sql (already includes these tables).
-- For Alembic-managed upgrades: run `alembic upgrade head` instead.
-- ============================================================

BEGIN;

-- ── users ────────────────────────────────────────────────────
-- UUID prefix: 90000000-...
CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY,
    handle        varchar(64)  UNIQUE NOT NULL,
    display_name  varchar(256),
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workspaces ───────────────────────────────────────────────
-- UUID prefix: a0a00000-... (a0000000 is taken by works seed)
CREATE TABLE IF NOT EXISTS workspaces (
    id           uuid PRIMARY KEY,
    owner_id     uuid NOT NULL REFERENCES users(id),
    name         varchar(256) NOT NULL,
    is_template  boolean NOT NULL DEFAULT FALSE,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_workspaces_owner_id
    ON workspaces(owner_id);

CREATE INDEX IF NOT EXISTS ix_workspaces_is_template
    ON workspaces(is_template)
    WHERE is_template = TRUE;

-- ── workspace_members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    role          varchar(20) NOT NULL DEFAULT 'editor'
                      CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_workspace_members_user_id
    ON workspace_members(user_id);

-- ── works: add workspace_id ───────────────────────────────────
-- Nullable: existing rows are safe. Backfill via seed_001.
ALTER TABLE works
    ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);

CREATE INDEX IF NOT EXISTS ix_works_workspace_id
    ON works(workspace_id);

COMMIT;
