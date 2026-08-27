-- Migration 0001: add elderly photo + diseases
-- Apply to the existing D1 database WITHOUT wiping data.
--
-- Local (dev):
--   npx wrangler d1 execute carehub_db --local --file=./db/migrations/0001_add_photo_and_diseases.sql
-- Remote (production):
--   npx wrangler d1 execute carehub_db --remote --file=./db/migrations/0001_add_photo_and_diseases.sql

-- 1) store the recipient photo directly in D1 as a base64 data URI
ALTER TABLE elderly ADD COLUMN photo TEXT;

-- 2) one recipient can have many diseases / chronic conditions
CREATE TABLE IF NOT EXISTS elderly_diseases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elderly_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (elderly_id) REFERENCES elderly(id)
);
