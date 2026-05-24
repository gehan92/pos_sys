const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/inventory — manager and above
router.get('/', authMiddleware, permit('manageInventory'), (req, res) => {
  const db    = getDb()
  const items = db.prepare('SELECT * FROM inventory ORDER BY item_name').all()
  res.json(items)
})

// GET /api/inventory/low-stock — items below min_stock
router.get('/low-stock', authMiddleware, permit('manageInventory'), (req, res) => {
  const db    = getDb()
  const items = db.prepare('SELECT * FROM inventory WHERE quantity <= min_stock ORDER BY item_name').all()
  res.json(items)
})

// POST /api/inventory — add new item
router.post('/', authMiddleware, permit('manageInventory'), (req, res) => {
  const { item_name, quantity, unit, min_stock } = req.body
  const db     = getDb()
  const result = db.prepare(
    'INSERT INTO inventory (item_name, quantity, unit, min_stock) VALUES (?, ?, ?, ?)'
  ).run(item_name, quantity || 0, unit || 'kg', min_stock || 0)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'add_inventory', 'inventory', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ item_name, quantity, unit }))

  res.json({ success: true, id: result.lastInsertRowid })
})

// PUT /api/inventory/:id — update stock level
router.put('/:id', authMiddleware, permit('manageInventory'), (req, res) => {
  const { item_name, quantity, unit, min_stock } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE inventory SET item_name=?, quantity=?, unit=?, min_stock=?, updated_at=datetime('now'), synced=0 WHERE id=?
  `).run(item_name, quantity, unit, min_stock, req.params.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'update_inventory', 'inventory', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ id: req.params.id, quantity }))

  res.json({ success: true })
})

// DELETE /api/inventory/:id
router.delete('/:id', authMiddleware, permit('manageInventory'), (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
