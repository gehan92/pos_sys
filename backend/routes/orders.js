const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/orders — any authenticated user
router.get('/', authMiddleware, (req, res) => {
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
router.get('/:id', authMiddleware, (req, res) => {
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
                  .map(i => ({ ...i, modifiers: JSON.parse(i.modifiers || '[]') }))
  res.json(order)
})

// POST /api/orders — waiter, cashier, management
router.post('/', authMiddleware, permit('createOrder'), (req, res) => {
  const { table_id, table_number, waiter_id, waiter_name, order_type, notes, items } = req.body
  const db = getDb()

  const orderNum = (db.prepare('SELECT COUNT(*) as c FROM orders').get().c || 0) + 1
  const result   = db.prepare(`
    INSERT INTO orders (order_number, table_id, table_number, waiter_id, waiter_name, order_type, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(orderNum, table_id, table_number, waiter_id || req.user.id, waiter_name || req.user.full_name, order_type || 'dinein', notes)

  const orderId    = result.lastInsertRowid
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

  if (table_id)
    db.prepare("UPDATE restaurant_tables SET status='occupied', updated_at=datetime('now') WHERE id=?").run(table_id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'create_order', 'orders', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ order_number: orderNum, table_number }))

  res.json({ success: true, id: orderId, order_number: orderNum })
})

// PUT /api/orders/:id/status
router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  // Void requires special permission
  if (status === 'cancelled') {
    const { can } = require('../lib/permissions')
    if (!can(req.user, 'voidOrder'))
      return res.status(403).json({ error: 'Permission denied: voidOrder required' })

    db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
      VALUES (?, ?, ?, 'void_order', 'orders', ?)`
    ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ order_id: req.params.id }))
  }

  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now'), synced=0 WHERE id=?").run(status, req.params.id)
  res.json({ success: true })
})

// PUT /api/orders/:id/items — edit order items
router.put('/:id/items', authMiddleware, (req, res) => {
  const { items } = req.body
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  const { can } = require('../lib/permissions')
  const isOwn   = order.waiter_id === req.user.id
  if (!isOwn && !can(req.user, 'editAnyOrder'))
    return res.status(403).json({ error: 'Permission denied: editAnyOrder required' })

  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id)
  const insert  = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, modifiers)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertAll = db.transaction((items) => {
    for (const item of items)
      insert.run(req.params.id, item.menu_item_id, item.item_name, item.quantity, item.unit_price, JSON.stringify(item.modifiers || []))
  })
  insertAll(items)
  db.prepare("UPDATE orders SET updated_at=datetime('now'), synced=0 WHERE id=?").run(req.params.id)
  res.json({ success: true })
})

// PUT /api/orders/:id/comp — apply complimentary discount
router.put('/:id/comp', authMiddleware, permit('applyComp'), (req, res) => {
  const { reason } = req.body
  const db = getDb()
  db.prepare("UPDATE orders SET notes=?, updated_at=datetime('now'), synced=0 WHERE id=?")
    .run(`[COMP] ${reason || 'Complimentary'}`, req.params.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'apply_comp', 'orders', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ order_id: req.params.id, reason }))

  res.json({ success: true })
})

// DELETE /api/orders/:id
router.delete('/:id', authMiddleware, permit('voidOrder'), (req, res) => {
  const db    = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  db.prepare("UPDATE orders SET status='cancelled', synced=0 WHERE id=?").run(req.params.id)
  if (order.table_id) {
    const active = db.prepare("SELECT id FROM orders WHERE table_id=? AND status NOT IN ('billed','cancelled')").all(order.table_id)
    if (active.length === 0)
      db.prepare("UPDATE restaurant_tables SET status='free', updated_at=datetime('now') WHERE id=?").run(order.table_id)
  }

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'void_order', 'orders', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ order_id: req.params.id }))

  res.json({ success: true })
})

module.exports = router
