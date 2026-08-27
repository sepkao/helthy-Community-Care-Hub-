-- Migration 0002: add age + national ID to elderly
-- Apply WITHOUT wiping data.
--
-- Local (dev):
--   npx wrangler d1 execute carehub_db --local --file=./db/migrations/0002_add_age_and_national_id.sql
-- Remote (production):
--   npx wrangler d1 execute carehub_db --remote --file=./db/migrations/0002_add_age_and_national_id.sql

ALTER TABLE elderly ADD COLUMN age INTEGER;
ALTER TABLE elderly ADD COLUMN national_id TEXT;
