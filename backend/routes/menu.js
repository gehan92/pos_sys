const express = require('express')
const { getDb } = require('../database')

const router = express.Router()

// GET /api/menu/categories
router.get('/categories', (req, res) => {
  const db = getDb()
  const cats = db.prepare('SELECT * FROM menu_categories WHERE active = 1 ORDER BY sort_order').all()
  res.json(cats)
})

// GET /api/menu/items
router.get('/items', (req, res) => {
  const db = getDb()
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, name_en').all()
  const parsed = items.map(i => ({ ...i, modifier_groups: JSON.parse(i.modifier_groups || '[]') }))
  res.json(parsed)
})

// GET /api/menu/items/:id
router.get('/items/:id', (req, res) => {
  const db   = getDb()
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: 'Item not found' })
  res.json({ ...item, modifier_groups: JSON.parse(item.modifier_groups || '[]') })
})

// POST /api/menu/items
router.post('/items', (req, res) => {
  const { category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station, emoji, modifier_groups } = req.body
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO menu_items (category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station, emoji, modifier_groups)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, code, name_en, name_mt, name_it, description_en, price, barcode, station, emoji, JSON.stringify(modifier_groups || []))
  res.json({ success: true, id: result.lastInsertRowid })
})

// PUT /api/menu/items/:id
router.put('/items/:id', (req, res) => {
  const { name_en, name_mt, name_it, description_en, price, available, modifier_groups } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE menu_items SET name_en=?, name_mt=?, name_it=?, description_en=?, price=?, available=?, modifier_groups=?, synced=0
    WHERE id=?
  `).run(name_en, name_mt, name_it, description_en, price, available ? 1 : 0, JSON.stringify(modifier_groups || []), req.params.id)
  res.json({ success: true })
})

// DELETE /api/menu/items/:id
router.delete('/items/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
