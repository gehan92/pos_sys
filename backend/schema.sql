-- Malta POS Local Database Schema
-- SQLite

-- Company
CREATE TABLE IF NOT EXISTS company (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  name    TEXT NOT NULL DEFAULT 'Dar Is-Sajjied',
  address TEXT,
  phone   TEXT,
  email   TEXT,
  currency       TEXT DEFAULT 'EUR',
  vat_rate       REAL DEFAULT 18,
  default_language TEXT DEFAULT 'en',
  theme          TEXT DEFAULT 'light',
  receipt_footer TEXT DEFAULT 'Thank you for visiting!',
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name     TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('superadmin','admin','owner','manager','supervisor','cashier','waiter','cook','host','delivery')),
  pin           TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('pending','active','suspended')),
  created_at    TEXT DEFAULT (datetime('now')),
  last_login    TEXT,
  synced        INTEGER DEFAULT 0
);

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  number   INTEGER UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4,
  status   TEXT DEFAULT 'free' CHECK (status IN ('free','occupied','reserved','cleaning')),
  floor    TEXT DEFAULT 'Ground',
  updated_at TEXT DEFAULT (datetime('now')),
  synced   INTEGER DEFAULT 0
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name_en    TEXT NOT NULL,
  name_mt    TEXT,
  name_it    TEXT,
  icon       TEXT,
  sort_order INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1,
  synced     INTEGER DEFAULT 0
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category_id    TEXT REFERENCES menu_categories(id) ON DELETE CASCADE,
  code           TEXT,
  name_en        TEXT NOT NULL,
  name_mt        TEXT,
  name_it        TEXT,
  description_en TEXT,
  price          REAL NOT NULL,
  barcode        TEXT UNIQUE,
  available      INTEGER DEFAULT 1,
  station        TEXT DEFAULT 'kitchen',
  emoji          TEXT,
  modifier_groups TEXT DEFAULT '[]',
  created_at     TEXT DEFAULT (datetime('now')),
  synced         INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_number INTEGER,
  table_id     TEXT REFERENCES restaurant_tables(id),
  table_number INTEGER,
  waiter_id    TEXT REFERENCES users(id),
  waiter_name  TEXT,
  order_type   TEXT DEFAULT 'dinein' CHECK (order_type IN ('dinein','takeaway')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','cooking','ready','billed','cancelled')),
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now')),
  synced       INTEGER DEFAULT 0
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id     TEXT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id),
  item_name    TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit_price   REAL NOT NULL,
  modifiers    TEXT DEFAULT '[]',
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','cooking','ready')),
  synced       INTEGER DEFAULT 0
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_number INTEGER,
  order_id       TEXT REFERENCES orders(id),
  cashier_id     TEXT REFERENCES users(id),
  cashier_name   TEXT,
  subtotal       REAL NOT NULL,
  vat_amount     REAL NOT NULL,
  discount       REAL DEFAULT 0,
  total          REAL NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash','card','mobile')),
  cash_tendered  REAL,
  change_given   REAL,
  paid_at        TEXT DEFAULT (datetime('now')),
  synced         INTEGER DEFAULT 0
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT REFERENCES users(id),
  user_name  TEXT,
  role       TEXT,
  clock_in   TEXT NOT NULL,
  clock_out  TEXT,
  notes      TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  synced     INTEGER DEFAULT 0
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  item_name  TEXT NOT NULL,
  quantity   REAL NOT NULL DEFAULT 0,
  unit       TEXT DEFAULT 'kg',
  min_stock  REAL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  synced     INTEGER DEFAULT 0
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT REFERENCES users(id),
  message_en TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
  module     TEXT,
  is_read    INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  synced     INTEGER DEFAULT 0
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT,
  user_name  TEXT,
  role       TEXT,
  action     TEXT NOT NULL,
  module     TEXT,
  details    TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  synced     INTEGER DEFAULT 0
);

-- Default company
INSERT OR IGNORE INTO company (id, name, address, currency, vat_rate)
VALUES (1, 'Dar Is-Sajjied', 'Triq Ghar Dalam, Birżebbuġa, Malta', 'EUR', 18);

-- Default restaurant tables (1–12)
INSERT OR IGNORE INTO restaurant_tables (id, number, capacity, floor) VALUES
('t01',1,4,'Ground'),('t02',2,4,'Ground'),('t03',3,4,'Ground'),
('t04',4,4,'Ground'),('t05',5,4,'Ground'),('t06',6,4,'Ground'),
('t07',7,4,'Ground'),('t08',8,4,'Ground'),('t09',9,4,'Ground'),
('t10',10,4,'Ground'),('t11',11,4,'Ground'),('t12',12,4,'Ground');

-- Default menu categories
INSERT OR IGNORE INTO menu_categories (id, name_en, name_mt, name_it, icon, sort_order) VALUES
('cat1','Starters','Antipasti','Antipasti','🥗',1),
('cat2','Mains','Platti Ewlenin','Secondi','🍽️',2),
('cat3','Specials','Speċjali tal-Ġurnata','Speciali','⭐',3),
('cat4','Drinks','Xorb','Bevande','🍷',4),
('cat5','Desserts','Ħelu','Dolci','🍮',5);
