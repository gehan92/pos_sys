import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Btn } from '../components/UI'
import {
  ClipboardList, ChefHat, Wine, Search, ShoppingBag, Utensils,
  AlertTriangle, MessageSquare, X, Check, Eye, Printer, Play
} from 'lucide-react'

const ACTIVE_STATUSES = ['pending', 'cooking', 'ready']

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cooking: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const STATUS_LABEL = {
  pending: 'Pending',
  cooking: 'Started',
  ready:   'Ready',
}

function OrderDetailModal({ order, onClose, navTo }) {
  const { setLiveOrders, menuItems, menuCategories } = useApp()
  const [items, setItems] = useState(() => order ? [...order.items] : [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalCat, setModalCat] = useState('all')
  const [modalSearch, setModalSearch] = useState('')
  const [itemModal, setItemModal] = useState(null)
  const [itemModalQty, setItemModalQty] = useState(1)
  const [itemModalSelections, setItemModalSelections] = useState({})
  const [itemModalNote, setItemModalNote] = useState('')

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

  function addNewItem(menuItem, qty, mods, note) {
    setItems(prev => {
      const existing = prev.findIndex(i => i.id === menuItem.id)
      let updated
      if (existing >= 0 && mods.length === 0 && !note) {
        updated = prev.map((item, i) => i === existing ? { ...item, qty: item.qty + qty } : item)
      } else {
        updated = [...prev, { id: menuItem.id, name: menuItem.name_en, price: menuItem.price, qty, mods, note }]
      }
      setLiveOrders(orders => orders.map(o =>
        o.id === order.id ? { ...o, items: updated } : o
      ))
      return updated
    })
  }

  function openItemModal(menuItem) {
    setItemModal(menuItem)
    setItemModalQty(1)
    setItemModalSelections({})
    setItemModalNote('')
  }

  function toggleMod(group, choice) {
    setItemModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function confirmAddItem() {
    const flatMods = Object.values(itemModalSelections).flat().filter(Boolean)
    addNewItem(itemModal, itemModalQty, flatMods, itemModalNote.trim())
    setItemModal(null)
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
              <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                {order.order_type === 'takeaway'
                  ? <><ShoppingBag size={14} className="text-gray-400" />Takeaway</>
                  : <><Utensils size={14} className="text-gray-400" />Table {order.table_number}</>}
              </div>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${badge}`}>
                {order.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={16} /></button>
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
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-0.5"><MessageSquare size={10} />{item.note}</div>
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
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex-shrink-0"
                    ><X size={12} /></button>
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
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
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
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={16} /></button>
              </div>
              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                        onClick={() => { setShowAddModal(false); openItemModal(item) }}
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
                <Btn variant="primary" fullWidth size="lg" onClick={() => setShowAddModal(false)}>
                  Done
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Item Modifier Popup */}
        {itemModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setItemModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">{itemModal.name_en}</h2>
                  <div className="text-sm text-indigo-600 font-bold">€{itemModal.price.toFixed(2)}</div>
                </div>
                <button onClick={() => setItemModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Quantity */}
                <div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setItemModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                    <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{itemModalQty}</span>
                    <button onClick={() => setItemModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                    <span className="text-sm text-gray-400 ml-2">= €{(itemModal.price * itemModalQty).toFixed(2)}</span>
                  </div>
                </div>
                {/* Modifier groups */}
                {(itemModal.modifierGroups || []).map(group => (
                  <div key={group.label}>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {group.label} {group.multi ? <span className="normal-case font-normal text-gray-400">(select multiple)</span> : <span className="normal-case font-normal text-gray-400">(choose one)</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.choices.map(choice => {
                        const active = (itemModalSelections[group.label] || []).includes(choice)
                        return (
                          <button key={choice} onClick={() => toggleMod(group, choice)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                            {active && <Check size={11} />}{choice}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {/* Note */}
                <div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
                  <textarea
                    value={itemModalNote}
                    onChange={e => setItemModalNote(e.target.value)}
                    placeholder="e.g. No onion, allergen request…"
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <Btn fullWidth onClick={() => setItemModal(null)}>Cancel</Btn>
                <Btn variant="success" fullWidth onClick={confirmAddItem}>
                  Add {itemModalQty > 1 ? `×${itemModalQty}` : ''} to Order — €{(itemModal.price * itemModalQty).toFixed(2)}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex gap-2">
          <Btn fullWidth onClick={onClose}>Close</Btn>
          <Btn variant="success" fullWidth disabled={items.length === 0} onClick={() => { onClose(); navTo('billing', { preloadOrder: updatedOrder }) }}>
            Go to Billing
          </Btn>
        </div>
      </div>
    </div>
  )
}

function printStationTicket(o, items, stationLabel) {
  const win = window.open('', '_blank', 'width=420,height=700')
  if (!win) return
  const now = new Date()
  const printDate = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  const printTime = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  const stationPrefix = stationLabel === 'Kitchen' ? 'K' : 'B'
  const subOrderId = `${stationPrefix}-${o.order_number}`
  win.document.write(`<!DOCTYPE html><html><head><title>${stationLabel} Ticket #${o.order_number}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:20px;max-width:380px;margin:0 auto;font-size:13px}
    .header{text-align:center;margin-bottom:12px}
    .header h2{font-size:20px;letter-spacing:3px;margin:0 0 2px}
    .header .station-badge{display:inline-block;font-size:11px;font-weight:bold;border:2px solid #000;padding:2px 10px;letter-spacing:2px;margin-bottom:4px}
    hr{border:none;border-top:1px dashed #000;margin:10px 0}
    hr.solid{border-top:2px solid #000}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;margin-bottom:4px}
    .info-grid .label{color:#555;font-size:11px}
    .info-grid .value{font-weight:bold}
    .info-row{display:flex;justify-content:space-between;font-size:12px;margin:2px 0}
    .info-row .label{color:#555}
    .info-row .value{font-weight:bold}
    .items-title{font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:8px 0 4px;color:#333}
    .item{margin:8px 0;overflow:hidden}
    .item-name{font-size:14px;font-weight:bold;display:block}
    .item-qty{font-size:16px;font-weight:bold;float:right;background:#000;color:#fff;padding:1px 6px}
    .mods{font-size:11px;color:#444;margin-top:2px}
    .note{font-size:11px;font-style:italic;color:#c00;margin-top:2px;padding:2px 4px;border:1px dashed #c00}
    .allergy{font-size:12px;font-weight:bold;color:#c00;padding:6px;border:2px solid #c00;margin-top:10px;text-align:center}
    .footer{text-align:center;font-size:10px;color:#777;margin-top:10px}
    @media print{body{padding:8px}}
  </style></head><body>
  <div class="header">
    <div class="station-badge">${stationLabel.toUpperCase()} TICKET</div>
    <h2>#${o.order_number}</h2>
  </div>
  <hr class="solid">
  <div class="info-grid">
    <div><div class="label">Date</div><div class="value">${printDate}</div></div>
    <div><div class="label">Time</div><div class="value">${printTime}</div></div>
    <div><div class="label">Order Time</div><div class="value">${o.created_at || '—'}</div></div>
    <div><div class="label">Table</div><div class="value">${o.order_type === 'takeaway' ? 'TAKEAWAY' : 'Table ' + o.table_number}</div></div>
    <div><div class="label">Waiter</div><div class="value">${o.waiter || '—'}</div></div>
    <div><div class="label">Bill No.</div><div class="value">#${o.order_number}</div></div>
    <div><div class="label">Order ID</div><div class="value">${o.id || '—'}</div></div>
    <div><div class="label">Sub Order ID</div><div class="value">${subOrderId}</div></div>
  </div>
  <hr>
  <div class="items-title">Items</div>
  ${items.map(i => `<div class="item">
    <span class="item-qty">&times;${i.qty}</span>
    <span class="item-name">${i.name || i.name_en}</span>
    ${i.mods?.length ? `<div class="mods">+ ${i.mods.join(' &middot; ')}</div>` : ''}
    ${i.note ? `<div class="note">&#9888; ${i.note}</div>` : ''}
  </div>`).join('<hr style="border-top:1px dotted #ccc;margin:4px 0">')}
  <hr>
  ${o.notes ? `<div class="allergy">&#9888; ALLERGY / NOTE<br>${o.notes}</div>` : ''}
  <div class="footer">Printed ${printDate} ${printTime}</div>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

const STATION_BADGE = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cooking: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  served:  'bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400',
}

const SUB_TABS = [
  { key: 'all',     label: 'All Orders', Icon: ClipboardList },
  { key: 'kitchen', label: 'Kitchen',    Icon: ChefHat },
  { key: 'bar',     label: 'Bar',        Icon: Wine },
]

export default function OrderList({ navTo }) {
  const { liveOrders, user, setLiveOrders } = useApp()
  const [search, setSearch] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [tab, setTab] = useState('all')

  function startOrder(order) {
    const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
    const barItems = order.items.filter(i => i.station === 'bar')
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    if (kitchenItems.length > 0) printStationTicket(order, kitchenItems, 'Kitchen')
    if (barItems.length > 0) setTimeout(() => printStationTicket(order, barItems, 'Bar'), 400)
    setLiveOrders(prev => prev.map(o =>
      o.id === order.id ? { ...o, status: 'cooking', started_at: now } : o
    ))
  }

  const isWaiter = user?.role === 'waiter'
  const baseOrders = (isWaiter
    ? liveOrders.filter(o => o.waiter?.toLowerCase().includes(user.full_name?.split(' ')[0]?.toLowerCase() || ''))
    : [...liveOrders]
  ).filter(o => ACTIVE_STATUSES.includes(o.status))

  const tabOrders = baseOrders.filter(o => {
    if (tab === 'kitchen') return o.items.some(i => (i.station || 'kitchen') !== 'bar')
    if (tab === 'bar')     return o.items.some(i => i.station === 'bar')
    return true
  })

  const filtered = tabOrders.filter(o => {
    const q = search.trim().toLowerCase()
    return !q
      || String(o.order_number).includes(q)
      || (o.table_number && String(o.table_number).includes(q))
      || o.waiter?.toLowerCase().includes(q)
      || o.items.some(i => (i.name || i.name_en || '').toLowerCase().includes(q))
  }).sort((a, b) => b.order_number - a.order_number)

  return (
    <div className="flex flex-col gap-4 h-full">
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} navTo={navTo} />}

      {/* Sub-Nav: horizontal pills always */}
      <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0
              ${tab === t.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <t.Icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              {(() => { const T = SUB_TABS.find(t => t.key === tab); return T ? <T.Icon size={17} /> : null })()}
              {SUB_TABS.find(t => t.key === tab)?.label}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isWaiter ? 'Your active orders' : 'Live orders — pending, cooking & ready'}
            </p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order, table, waiter…"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col items-center justify-center py-16">
            <div className="mb-3 text-gray-300 dark:text-gray-600">{(() => { const T = SUB_TABS.find(t => t.key === tab); return T ? <T.Icon size={40} /> : null })()}</div>
            <div className="text-sm font-semibold text-gray-400">No active orders</div>
            <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">
              {search ? 'Try a different search term' : 'Waiting for new orders…'}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map(order => {
                const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
                const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
                const barItems = order.items.filter(i => i.station === 'bar')
                const stationItems = tab === 'kitchen' ? kitchenItems : tab === 'bar' ? barItems : null
                return (
                  <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 space-y-3">
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {order.order_type === 'takeaway'
                          ? <><ShoppingBag size={13} className="text-gray-400" />Takeaway</>
                          : <><Utensils size={13} className="text-gray-400" />Table {order.table_number}</>}
                      </span>
                    </div>
                    {/* Meta row */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 py-1.5">
                        <div className="text-gray-400 mb-0.5">Waiter</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-200 truncate">{order.waiter || '—'}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 py-1.5">
                        <div className="text-gray-400 mb-0.5">Time</div>
                        <div className="font-semibold text-gray-700 dark:text-gray-200">{order.created_at}</div>
                      </div>
                      {tab === 'all' && (
                        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 py-1.5">
                          <div className="text-gray-400 mb-0.5">Total</div>
                          <div className="font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {/* Status + Started row for All / Kitchen / Bar tabs */}
                    {(tab === 'all' || tab === 'kitchen' || tab === 'bar') && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 py-1.5">
                          <div className="text-gray-400 mb-0.5">Status</div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[order.status] || order.status}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 py-1.5">
                          <div className="text-gray-400 mb-0.5">Started</div>
                          <div className="font-semibold text-gray-700 dark:text-gray-200">{order.started_at || '—'}</div>
                        </div>
                      </div>
                    )}
                    {/* Items for kitchen/bar */}
                    {stationItems && stationItems.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                        {stationItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-extrabold flex-shrink-0
                              ${tab === 'kitchen' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                              {item.qty}
                            </span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.name || item.name_en}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
                      >
                        <Eye size={13} />View
                      </button>
                      {tab === 'all' && !order.started_at && (
                        <button
                          onClick={() => startOrder(order)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/60"
                        >
                          <Play size={13} />Start
                        </button>
                      )}
                      {tab === 'kitchen' && (
                        <button
                          onClick={() => printStationTicket(order, kitchenItems, 'Kitchen')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60"
                        >
                          <Printer size={13} />Print
                        </button>
                      )}
                      {tab === 'bar' && (
                        <button
                          onClick={() => printStationTicket(order, barItems, 'Bar')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60"
                        >
                          <Printer size={13} />Print
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    {tab === 'all' && (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    )}
                    {tab === 'all' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    )}
                    {tab === 'all' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started</th>
                    )}
                    {tab === 'kitchen' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Food Items</th>
                    )}
                    {tab === 'bar' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Drink Items</th>
                    )}
                    {(tab === 'kitchen' || tab === 'bar') && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    )}
                    {(tab === 'kitchen' || tab === 'bar') && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started</th>
                    )}
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
                  {filtered.map(order => {
                    const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
                    const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
                    const barItems = order.items.filter(i => i.station === 'bar')
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          #{order.order_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {order.order_type === 'takeaway'
                              ? <><ShoppingBag size={14} className="text-gray-400" />Takeaway</>
                              : <><Utensils size={14} className="text-gray-400" />Table {order.table_number}</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {order.waiter || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {order.created_at}
                        </td>
                        {tab === 'all' && (
                          <td className="px-4 py-3 text-right font-extrabold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                            €{total.toFixed(2)}
                          </td>
                        )}
                        {tab === 'all' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABEL[order.status] || order.status}
                            </span>
                          </td>
                        )}
                        {tab === 'all' && (
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {order.started_at || '—'}
                          </td>
                        )}
                        {tab === 'kitchen' && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {kitchenItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-extrabold flex-shrink-0">
                                    {item.qty}
                                  </span>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.name || item.name_en}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        )}
                        {tab === 'bar' && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {barItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[11px] font-extrabold flex-shrink-0">
                                    {item.qty}
                                  </span>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.name || item.name_en}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        )}
                        {(tab === 'kitchen' || tab === 'bar') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABEL[order.status] || order.status}
                            </span>
                          </td>
                        )}
                        {(tab === 'kitchen' || tab === 'bar') && (
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {order.started_at || '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-all"
                            >
                              <Eye size={13} />View
                            </button>
                            {tab === 'all' && !order.started_at && (
                              <button
                                onClick={() => startOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800/60 transition-all"
                              >
                                <Play size={13} />Start
                              </button>
                            )}
                            {tab === 'kitchen' && (
                              <button
                                onClick={() => printStationTicket(order, kitchenItems, 'Kitchen')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800/60 transition-all"
                              >
                                <Printer size={13} />Print
                              </button>
                            )}
                            {tab === 'bar' && (
                              <button
                                onClick={() => printStationTicket(order, barItems, 'Bar')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-all"
                              >
                                <Printer size={13} />Print
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
