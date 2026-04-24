import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const ACTIVE_STATUSES = ['pending', 'cooking', 'ready']

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cooking: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function OrderDetailModal({ order, onClose, navTo }) {
  const { setLiveOrders, menuItems, menuCategories } = useApp()
  const [items, setItems] = useState(() => order ? [...order.items] : [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalCat, setModalCat] = useState('all')
  const [modalSearch, setModalSearch] = useState('')

  useEffect(() => {
    if (order) setItems([...order.items])
  }, [order?.id])

  if (!order) return null

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const guests = order.guests ? order.guests.adults + order.guests.children : null
  const badge = STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'

  function changeQty(index, delta) {
    setItems(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, qty: item.qty + delta } : item
      ).filter(item => item.qty > 0)
      setLiveOrders(orders => orders.map(o =>
        o.id === order.id ? { ...o, items: updated } : o
      ))
      return updated
    })
  }

  function removeItem(index) {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setLiveOrders(orders => orders.map(o =>
        o.id === order.id ? { ...o, items: updated } : o
      ))
      return updated
    })
  }

  function addNewItem(menuItem) {
    setItems(prev => {
      const existing = prev.findIndex(i => i.id === menuItem.id)
      let updated
      if (existing >= 0) {
        updated = prev.map((item, i) => i === existing ? { ...item, qty: item.qty + 1 } : item)
      } else {
        updated = [...prev, { id: menuItem.id, name: menuItem.name_en, price: menuItem.price, qty: 1 }]
      }
      setLiveOrders(orders => orders.map(o =>
        o.id === order.id ? { ...o, items: updated } : o
      ))
      return updated
    })
  }

  const updatedOrder = { ...order, items }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                {order.order_type === 'takeaway' ? '🥡 Takeaway' : `🍽️ Table ${order.table_number}`}
              </div>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${badge}`}>
                {order.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
        </div>

        {/* Detail rows */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">Waiter</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{order.waiter || '—'}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">Guests</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {guests != null && guests > 0
                  ? `${guests} guest${guests !== 1 ? 's' : ''}${order.guests?.adults ? ` (${order.guests.adults}A${order.guests.children ? ` · ${order.guests.children}C` : ''})` : ''}`
                  : '—'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">Start Time</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{order.created_at || '—'}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">End Time</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {order.completed_at || (order.status === 'ready' ? 'Ready now' : '—')}
              </div>
            </div>
          </div>

          {/* Items — editable */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items Ordered</div>
            {items.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                No items — all removed
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name || item.name_en}</div>
                      {item.mods?.length > 0 && (
                        <div className="text-[11px] text-indigo-500 mt-0.5">+ {item.mods.join(' · ')}</div>
                      )}
                      {item.note && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">📝 {item.note}</div>
                      )}
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => changeQty(i, -1)}
                        className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors"
                      >−</button>
                      <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                      <button
                        onClick={() => changeQty(i, 1)}
                        className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm transition-colors"
                      >+</button>
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-14 text-right flex-shrink-0">€{(item.price * item.qty).toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(i)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-xs flex-shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new item button */}
          <button
            onClick={() => { setModalCat('all'); setModalSearch(''); setShowAddModal(true) }}
            className="w-full py-2 rounded-xl text-xs font-bold border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all mt-2"
          >
            + Add New Item
          </button>

          {/* Allergy note */}
          {order.notes && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2.5">
              <span className="text-base mt-0.5">⚠️</span>
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">Allergy / Notes</div>
                <div className="text-xs text-amber-700 dark:text-amber-300">{order.notes}</div>
              </div>
            </div>
          )}
        </div>

        {/* Total footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total</span>
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Add Item to Order</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
              </div>
              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    autoFocus
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search items…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0">
                <button onClick={() => setModalCat('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>All</button>
                {menuCategories.map(cat => (
                  <button key={cat.id} onClick={() => setModalCat(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>{cat.name_en}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {menuItems.filter(item => {
                    if (!item.available) return false
                    const q = modalSearch.trim().toLowerCase()
                    const matchCat = modalCat === 'all' || item.category_id === modalCat
                    const matchSearch = !q || item.name_en.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q)
                    return matchCat && matchSearch
                  }).map(item => {
                    const inOrder = items.find(i => i.id === item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => addNewItem(item)}
                        className="relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">€{item.price.toFixed(2)}</div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                        {inOrder && (
                          <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">{inOrder.qty}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
          <button
            disabled={items.length === 0}
            onClick={() => { onClose(); navTo('billing', { preloadOrder: updatedOrder }) }}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white transition-all disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            💳 Go to Billing
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderList({ navTo }) {
  const { liveOrders, user } = useApp()
  const [search, setSearch] = useState('')
  const [viewOrder, setViewOrder] = useState(null)

  const isWaiter = user?.role === 'waiter'
  const baseOrders = (isWaiter
    ? liveOrders.filter(o => o.waiter?.toLowerCase().includes(user.full_name?.split(' ')[0]?.toLowerCase() || ''))
    : [...liveOrders]
  ).filter(o => ACTIVE_STATUSES.includes(o.status))

  const filtered = baseOrders.filter(o => {
    const q = search.trim().toLowerCase()
    return !q
      || String(o.order_number).includes(q)
      || (o.table_number && String(o.table_number).includes(q))
      || o.waiter?.toLowerCase().includes(q)
      || o.items.some(i => (i.name || i.name_en || '').toLowerCase().includes(q))
  }).sort((a, b) => b.order_number - a.order_number)

  return (
    <div className="space-y-4">
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} navTo={navTo} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">Order List</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isWaiter ? 'Your active orders' : 'Live orders — pending, cooking & ready'}
          </p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order, table, waiter, item…"
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-semibold text-gray-400">No active orders</div>
            <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              {search ? 'Try a different search term' : 'Waiting for new orders…'}
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
              {filtered.map(order => {
                const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      #{order.order_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                      {order.order_type === 'takeaway' ? '🥡 Takeaway' : `🍽️ Table ${order.table_number}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {order.waiter || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((it, i) => (
                          <span key={i} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-2 py-0.5 text-[11px]">
                            {it.name || it.name_en} ×{it.qty}
                          </span>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">⚠ {order.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {order.created_at}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                      €{total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-all"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
