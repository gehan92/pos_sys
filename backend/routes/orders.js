const express = require('express')
const { getDb } = require('../database')

const router = express.Router()

// GET /api/orders
router.get('/', (req, res) => {
  const db     = getDb()
  const status = req.query.status
  const orders = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()

  const withItems = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
              .map(i => ({ ...i, modifiers: JSON.parse(i.modifiers || '[]') }))
  }))
  res.json(withItems)
})

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
                  .map(i => ({ ...i, modifiers: JSON.parse(i.modifiers || '[]') }))
  res.json(order)
})

// POST /api/orders — create order
router.post('/', (req, res) => {
  const { table_id, table_number, waiter_id, waiter_name, order_type, notes, items } = req.body
  const db = getDb()

  const orderNum = (db.prepare('SELECT COUNT(*) as c FROM orders').get().c || 0) + 1

  const result = db.prepare(`
    INSERT INTO orders (order_number, table_id, table_number, waiter_id, waiter_name, order_type, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(orderNum, table_id, table_number, waiter_id, waiter_name, order_type || 'dinein', notes)

  const orderId = result.lastInsertRowid

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, modifiers)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertAll = db.transaction((items) => {
    for (const item of (items || [])) {
      insertItem.run(orderId, item.menu_item_id, item.item_name, item.quantity, item.unit_price, JSON.stringify(item.modifiers || []))
    }
  })
  insertAll(items)

  // Update table status
  if (table_id) {
    db.prepare("UPDATE restaurant_tables SET status = 'occupied', updated_at = datetime('now') WHERE id = ?").run(table_id)
  }

  res.json({ success: true, id: orderId, order_number: orderNum })
})

// PUT /api/orders/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body
  const db = getDb()
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now'), synced = 0 WHERE id = ?").run(status, req.params.id)
  res.json({ success: true })
})

// PUT /api/orders/:id/items — update items on existing order
router.put('/:id/items', (req, res) => {
  const { items } = req.body
  const db = getDb()
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id)
  const insert = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, modifiers)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertAll = db.transaction((items) => {
    for (const item of items) {
      insert.run(req.params.id, item.menu_item_id, item.item_name, item.quantity, item.unit_price, JSON.stringify(item.modifiers || []))
    }
  })
  insertAll(items)
  db.prepare("UPDATE orders SET updated_at = datetime('now'), synced = 0 WHERE id = ?").run(req.params.id)
  res.json({ success: true })
})

// DELETE /api/orders/:id — cancel order
router.delete('/:id', (req, res) => {
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  db.prepare("UPDATE orders SET status = 'cancelled', synced = 0 WHERE id = ?").run(req.params.id)

  if (order.table_id) {
    const active = db.prepare("SELECT id FROM orders WHERE table_id = ? AND status NOT IN ('billed','cancelled')").all(order.table_id)
    if (active.length === 0) {
      db.prepare("UPDATE restaurant_tables SET status = 'free', updated_at = datetime('now') WHERE id = ?").run(order.table_id)
    }
  }

  res.json({ success: true })
})

module.exports = router
