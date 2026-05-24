const express = require('express')
const { getDb } = require('../database')

const router = express.Router()

// GET /api/shifts
router.get('/', (req, res) => {
  const db     = getDb()
  const shifts = db.prepare('SELECT * FROM shifts ORDER BY clock_in DESC').all()
  res.json(shifts)
})

// POST /api/shifts/clock-in
router.post('/clock-in', (req, res) => {
  const { user_id, user_name, role } = req.body
  const db = getDb()

  // Check if already clocked in
  const open = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND clock_out IS NULL').get(user_id)
  if (open) return res.status(409).json({ error: 'Already clocked in' })

  const result = db.prepare(`
    INSERT INTO shifts (user_id, user_name, role, clock_in) VALUES (?, ?, ?, datetime('now'))
  `).run(user_id, user_name, role)

  res.json({ success: true, id: result.lastInsertRowid })
})

// PUT /api/shifts/:id/clock-out
router.put('/:id/clock-out', (req, res) => {
  const db = getDb()
  db.prepare("UPDATE shifts SET clock_out = datetime('now'), synced = 0 WHERE id = ?").run(req.params.id)
  res.json({ success: true })
})

// PUT /api/shifts/clock-out-by-user/:userId — clock out active shift for a user
router.put('/clock-out-by-user/:userId', (req, res) => {
  const db   = getDb()
  const open = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND clock_out IS NULL').get(req.params.userId)
  if (!open) return res.status(404).json({ error: 'No active shift found' })
  db.prepare("UPDATE shifts SET clock_out = datetime('now'), synced = 0 WHERE id = ?").run(open.id)
  res.json({ success: true })
})

module.exports = router
