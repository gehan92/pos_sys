// Seed demo users — runs only on first startup when users table is empty
const bcrypt = require('bcryptjs')
const { getDb } = require('./database')

const DEMO_PASSWORD = bcrypt.hashSync('Admin@1234', 10)

const DEMO_USERS = [
  { id: 'u1', full_name: 'Super Admin',  username: 'superadmin', role: 'superadmin' },
  { id: 'u2', full_name: 'Admin User',   username: 'admin',      role: 'admin'      },
  { id: 'u3', full_name: 'Restaurant Manager', username: 'manager', role: 'manager' },
  { id: 'u4', full_name: 'Head Cashier', username: 'cashier',    role: 'cashier'    },
  { id: 'u5', full_name: 'Head Waiter',  username: 'waiter',     role: 'waiter'     },
  { id: 'u6', full_name: 'Head Cook',    username: 'cook',       role: 'cook'       },
  { id: 'u7', full_name: 'Supervisor',   username: 'supervisor', role: 'supervisor' },
]

const db = getDb()
const insert = db.prepare(`
  INSERT OR IGNORE INTO users (id, full_name, username, password_hash, role, status)
  VALUES (@id, @full_name, @username, @password_hash, @role, 'active')
`)

const seedAll = db.transaction(() => {
  for (const u of DEMO_USERS) {
    insert.run({ ...u, password_hash: DEMO_PASSWORD })
  }
})

seedAll()
