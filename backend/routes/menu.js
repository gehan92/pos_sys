const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/menu/categories — any authenticated user
router.get('/categories', authMiddleware, (req, res) => {
  const db   = getDb()
  const cats = db.prepare('SELECT * FROM menu_categories WHERE active = 1 ORDER BY sort_order').all()
  res.json(cats)
})

// GET /api/menu/items — any authenticated user
router.get('/items', authMiddleware, (req, res) => {
  const db    = getDb()
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, name_en').all()
  res.json(items.map(i => ({ ...i, modifier_groups: JSON.parse(i.modifier_groups || '[]') })))
})

// GET /api/menu/items/:id
router.get('/items/:id', authMiddleware, (req, res) => {
  const db   = getDb()
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  res.json({ ...item, modifier_groups: JSON.parse(item.modifier_groups || '[]') })
})

// POST /api/menu/items — manager and above
router.post('/items', authMiddleware, permit('manageMenu'), (req, res) => {
  const { category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station, emoji, modifier_groups } = req.body
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO menu_items (category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station, emoji, modifier_groups)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station || 'kitchen', emoji, JSON.stringify(modifier_groups || []))

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'add_menu_item', 'menu', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ name_en, price }))

  res.json({ success: true, id: result.lastInsertRowid })
})

// PUT /api/menu/items/:id — manager and above
router.put('/items/:id', authMiddleware, permit('manageMenu'), (req, res) => {
  const { name_en, name_mt, name_it, description_en, price, available, modifier_groups } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE menu_items SET name_en=?, name_mt=?, name_it=?, description_en=?, price=?, available=?, modifier_groups=?, synced=0
    WHERE id=?
  `).run(name_en, name_mt, name_it, description_en, price, available ? 1 : 0, JSON.stringify(modifier_groups || []), req.params.id)
  res.json({ success: true })
})

// PUT /api/menu/items/:id/toggle — toggle availability
router.put('/items/:id/toggle', authMiddleware, permit('manageMenu'), (req, res) => {
  const db   = getDb()
  const item = db.prepare('SELECT available FROM menu_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  db.prepare('UPDATE menu_items SET available=?, synced=0 WHERE id=?').run(item.available ? 0 : 1, req.params.id)
  res.json({ success: true, available: !item.available })
})

// DELETE /api/menu/items/:id — manager and above
router.delete('/items/:id', authMiddleware, permit('manageMenu'), (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/menu/categories — manager and above
router.post('/categories', authMiddleware, permit('manageMenu'), (req, res) => {
  const { name_en, name_mt, name_it, icon, sort_order } = req.body
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO menu_categories (name_en, name_mt, name_it, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(name_en, name_mt, name_it, icon, sort_order || 0)
  res.json({ success: true, id: result.lastInsertRowid })
})

module.exports = router
