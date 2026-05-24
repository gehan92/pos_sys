const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

const ALLOWED_TABLES = [
  'company', 'users', 'restaurant_tables', 'menu_categories', 'menu_items',
  'orders', 'order_items', 'invoices', 'shifts', 'inventory', 'notifications', 'audit_logs'
]

function superadminOnly(req, res, next) {
  if (req.user?.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' })
  next()
}

// GET /api/dbviewer — all tables with row counts
router.get('/', authMiddleware, superadminOnly, (req, res) => {
  const db = getDb()
  const tables = ALLOWED_TABLES.map(name => {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get()
      return { name, count: row.count }
    } catch {
      return { name, count: 0 }
    }
  })
  res.json(tables)
})

// GET /api/dbviewer/:table — paginated rows
router.get('/:table', authMiddleware, superadminOnly, (req, res) => {
  const { table } = req.params
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' })

  const db     = getDb()
  const limit  = Math.min(parseInt(req.query.limit)  || 100, 500)
  const offset = parseInt(req.query.offset) || 0

  const rows  = db.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).all(limit, offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get()

  res.json({ rows, total: total.count, limit, offset })
})

// DELETE /api/dbviewer/:table/:id — delete a row
router.delete('/:table/:id', authMiddleware, superadminOnly, (req, res) => {
  const { table, id } = req.params
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' })
  if (table === 'company') return res.status(400).json({ error: 'Cannot delete company record' })

  const db = getDb()
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details) VALUES (?, ?, ?, 'db_delete', ?, ?)`)
    .run(req.user.id, req.user.full_name, req.user.role, table, JSON.stringify({ deleted_id: id }))

  res.json({ success: true })
})

module.exports = router
