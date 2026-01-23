CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('normal', 'watch', 'urgent')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
