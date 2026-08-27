-- Migration 0003: add date of birth to elderly
-- Age is now computed on the fly from date_of_birth instead of being entered
-- manually. The old `age` column is kept (and kept in sync at write-time) for
-- backward compatibility with any row created before this migration.
-- Apply WITHOUT wiping data.
--
-- Local (dev):
--   npx wrangler d1 execute carehub_db --local --file=./db/migrations/0003_add_date_of_birth.sql
-- Remote (production):
--   npx wrangler d1 execute carehub_db --remote --file=./db/migrations/0003_add_date_of_birth.sql

ALTER TABLE elderly ADD COLUMN date_of_birth TEXT;
