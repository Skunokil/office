-- ============================================================
-- seed_001_workspace_delta.sql
-- Task 14a — demo user + template workspace + backfill
-- Date: 2026-04-22
--
-- Idempotent: all inserts use ON CONFLICT DO NOTHING.
-- UPDATE uses WHERE workspace_id IS NULL (safe repeat).
--
-- Run AFTER migration_001_workspace.sql:
--   PG_USER=$(cd ~/bot_factory && grep ^POSTGRES_USER .env | cut -d= -f2)
--   docker exec -i bot_factory-postgres-1 psql -U "$PG_USER" -d storyos_v2 \
--     < ~/projects/office/backend/storyos_api_v2/migrations/seed_001_workspace_delta.sql
-- ============================================================

BEGIN;

-- Demo/system user (owner of the template workspace)
INSERT INTO users (id, handle, display_name)
VALUES (
    '90000000-0000-0000-0000-000000000001',
    'demo',
    'Demo User'
) ON CONFLICT (id) DO NOTHING;

-- Template workspace (is_template = TRUE — will be cloned for new users)
INSERT INTO workspaces (id, owner_id, name, is_template)
VALUES (
    'a0a00000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'Demo: Тайна голубой вазы',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Owner membership
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
    'a0a00000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'owner'
) ON CONFLICT DO NOTHING;

-- Backfill existing works into template workspace
-- Safe to repeat: WHERE workspace_id IS NULL is a no-op if already set
UPDATE works
SET workspace_id = 'a0a00000-0000-0000-0000-000000000001'
WHERE workspace_id IS NULL;

COMMIT;
