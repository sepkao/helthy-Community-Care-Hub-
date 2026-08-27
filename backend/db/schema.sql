CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('caregiver','guardian')) NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE elderly (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  photo TEXT,
  age INTEGER,
  national_id TEXT,
  date_of_birth TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE elderly_diseases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elderly_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (elderly_id) REFERENCES elderly(id)
);
CREATE TABLE guardians (
  user_id INTEGER NOT NULL,
  elderly_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, elderly_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (elderly_id) REFERENCES elderly(id)
);
CREATE TABLE risk_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elderly_id INTEGER NOT NULL,
  caregiver_id INTEGER NOT NULL,
  risk_level TEXT CHECK(risk_level IN ('low','medium','high','critical')) NOT NULL,
  symptoms TEXT,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (elderly_id) REFERENCES elderly(id),
  FOREIGN KEY (caregiver_id) REFERENCES users(id)
);
CREATE TABLE visit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elderly_id INTEGER NOT NULL,
  caregiver_id INTEGER NOT NULL,
  note TEXT,
  visited_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (elderly_id) REFERENCES elderly(id),
  FOREIGN KEY (caregiver_id) REFERENCES users(id)
);
