const express = require('express')
const { getDb } = require('../database')

const router = express.Router()

// GET /api/tables
router.get('/', (req, res) => {
  const db     = getDb()
  const tables = db.prepare('SELECT * FROM restaurant_tables ORDER BY number').all()
  res.json(tables)
})

// PUT /api/tables/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body
  const db = getDb()
  db.prepare("UPDATE restaurant_tables SET status = ?, updated_at = datetime('now'), synced = 0 WHERE id = ?").run(status, req.params.id)
  res.json({ success: true })
})

// POST /api/tables — add a new table
router.post('/', (req, res) => {
  const { number, capacity, floor } = req.body
  const db = getDb()
  try {
    db.prepare('INSERT INTO restaurant_tables (number, capacity, floor) VALUES (?, ?, ?)').run(number, capacity || 4, floor || 'Ground')
    res.json({ success: true })
  } catch {
    res.status(409).json({ error: 'Table number already exists' })
  }
})

// DELETE /api/tables/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM restaurant_tables WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
