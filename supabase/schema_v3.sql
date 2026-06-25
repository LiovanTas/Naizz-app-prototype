-- ============================================================================
-- Naizz v3 — profile pictures. Run AFTER schema.sql and schema_v2.sql.
-- ============================================================================

alter table public.profiles add column if not exists avatar_path text;
