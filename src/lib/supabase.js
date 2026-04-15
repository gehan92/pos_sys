import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTO-CREATE ALL TABLES ───────────────────────────────────────────────────
export const DB_SETUP_SQL = `
-- Company settings
create table if not exists company (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Restaurant',
  logo text,
  address text,
  phone text,
  email text,
  currency text default 'EUR',
  vat_rate numeric default 18,
  default_language text default 'en',
  theme text default 'light',
  receipt_footer text default 'Thank you for visiting!',
  updated_at timestamptz default now()
);

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('superadmin','admin','owner','manager','cashier','supervisor','waiter','cook','supplier')),
  status text default 'pending' check (status in ('pending','active','suspended')),
  created_by uuid references users(id),
  approved_by uuid references users(id),
  last_login timestamptz,
  created_at timestamptz default now()
);

-- Restaurant tables
create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  number int unique not null,
  capacity int default 4,
  status text default 'free' check (status in ('free','occupied','reserved','cleaning')),
  floor text default 'Ground',
  updated_at timestamptz default now()
);

-- Menu categories
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_mt text,
  name_it text,
  icon text,
  sort_order int default 0,
  active boolean default true
);

-- Menu items
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories(id) on delete cascade,
  name_en text not null,
  name_mt text,
  name_it text,
  description_en text,
  price numeric not null,
  barcode text unique,
  available boolean default true,
  image_url text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  table_id uuid references restaurant_tables(id),
  waiter_id uuid references users(id),
  order_type text default 'dinein' check (order_type in ('dinein','takeaway')),
  status text default 'pending' check (status in ('pending','cooking','ready','billed','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,
  quantity int not null default 1,
  unit_price numeric not null,
  modifiers jsonb default '[]',
  status text default 'pending' check (status in ('pending','cooking','ready'))
);

-- Invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number serial,
  order_id uuid references orders(id),
  cashier_id uuid references users(id),
  subtotal numeric not null,
  vat_amount numeric not null,
  discount numeric default 0,
  total numeric not null,
  payment_method text check (payment_method in ('cash','card','mobile')),
  cash_tendered numeric,
  change_given numeric,
  paid_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Inventory
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  quantity numeric not null default 0,
  unit text default 'kg',
  min_stock numeric default 0,
  supplier_id uuid references users(id),
  updated_at timestamptz default now()
);

-- Supplier invoices
create table if not exists supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references users(id),
  items jsonb not null default '[]',
  total numeric not null,
  status text default 'pending' check (status in ('pending','approved','delivered','rejected')),
  notes text,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- Shifts
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  start_time timestamptz not null,
  end_time timestamptz,
  created_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  message_en text not null,
  message_mt text,
  message_it text,
  type text default 'info' check (type in ('info','warning','error','success')),
  module text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Audit logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  user_name text,
  role text,
  action text not null,
  module text,
  details jsonb,
  created_at timestamptz default now()
);

-- Insert default company
insert into company (name, address, currency, vat_rate)
values ('Bella Vista Malta', '123 Republic Street, Valletta, Malta', 'EUR', 18)
on conflict do nothing;

-- Insert default tables 1-16
insert into restaurant_tables (number, capacity, floor)
select n, 4, 'Ground'
from generate_series(1, 12) as n
on conflict do nothing;

-- Insert default menu categories
insert into menu_categories (name_en, name_mt, name_it, icon, sort_order) values
('Starters', 'Antipasti', 'Antipasti', '🥗', 1),
('Mains', 'Platti Ewlenin', 'Secondi', '🍽️', 2),
('Drinks', 'Xorb', 'Bevande', '🍷', 3),
('Desserts', 'Ħelu', 'Dolci', '🍮', 4)
on conflict do nothing;
`

export async function runDatabaseSetup(url, key) {
  const client = createClient(url, key)
  const { error } = await client.rpc('exec_sql', { sql: DB_SETUP_SQL })
  if (error) {
    console.warn('RPC exec_sql not available, tables may need manual creation.')
  }
  return { success: true }
}
