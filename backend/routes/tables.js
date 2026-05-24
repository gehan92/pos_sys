const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/tables — any authenticated user
router.get('/', authMiddleware, (req, res) => {
  const db     = getDb()
  const tables = db.prepare('SELECT * FROM restaurant_tables ORDER BY number').all()
  res.json(tables)
})

// PUT /api/tables/:id/status — waiter and above
router.put('/:id/status', authMiddleware, permit('reserveTable'), (req, res) => {
  const { status } = req.body
  const db = getDb()
  db.prepare("UPDATE restaurant_tables SET status=?, updated_at=datetime('now'), synced=0 WHERE id=?").run(status, req.params.id)
  res.json({ success: true })
})

// POST /api/tables — manager and above
router.post('/', authMiddleware, permit('addTable'), (req, res) => {
  const { number, capacity, floor } = req.body
  const db = getDb()
  try {
    db.prepare('INSERT INTO restaurant_tables (number, capacity, floor) VALUES (?, ?, ?)').run(number, capacity || 4, floor || 'Ground')

    db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
      VALUES (?, ?, ?, 'add_table', 'tables', ?)`
    ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ number }))

    res.json({ success: true })
  } catch {
    res.status(409).json({ error: 'Table number already exists' })
  }
})

// PUT /api/tables/:id — edit table details
router.put('/:id', authMiddleware, permit('editTable'), (req, res) => {
  const { capacity, floor } = req.body
  const db = getDb()
  db.prepare("UPDATE restaurant_tables SET capacity=?, floor=?, updated_at=datetime('now'), synced=0 WHERE id=?")
    .run(capacity, floor, req.params.id)
  res.json({ success: true })
})

// DELETE /api/tables/:id — manager and above
router.delete('/:id', authMiddleware, permit('deleteTable'), (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM restaurant_tables WHERE id = ?').run(req.params.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'delete_table', 'tables', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ table_id: req.params.id }))

  res.json({ success: true })
})

module.exports = router
