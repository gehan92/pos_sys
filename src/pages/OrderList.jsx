import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Btn } from '../components/UI'
import {
  ClipboardList, ChefHat, Wine, Search, Utensils,
  AlertTriangle, MessageSquare, X, Check, Eye, Printer,
  Timer, GitMerge, ArrowRight, CheckCircle2
} from 'lucide-react'

const ACTIVE_STATUSES = ['pending', 'cooking', 'ready', 'paid']

const PAYMENT_STATUS_CFG = {
  paid:   { label: 'Paid',     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-400' },
  unpaid: { label: 'Not Paid', bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-400' },
}
const getPayCfg = (order) => PAYMENT_STATUS_CFG[order.status === 'paid' ? 'paid' : 'unpaid']

const SUB_TABS = [
  { key: 'all',     label: 'All',     Icon: ClipboardList },
  { key: 'kitchen', label: 'Kitchen', Icon: ChefHat },
  { key: 'bar',     label: 'Bar',     Icon: Wine },
]

function getElapsedMin(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const now = new Date()
  const then = new Date()
  then.setHours(h, m, 0, 0)
  if (then > now) then.setDate(then.getDate() - 1)
  return Math.max(0, Math.floor((now - then) / 60000))
}

function ElapsedBadge({ timeStr }) {
  const min = getElapsedMin(timeStr)
  if (min === null) return <span className="text-xs text-gray-400">—</span>
  const urgent  = min > 20
  const warning = min >= 10 && min <= 20
  const label   = min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${urgent ? 'text-red-600 dark:text-red-400' : warning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
      {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
      <Timer size={11} />
      {label}
    </span>
  )
}

function TableLabel({ order }) {
  const base = `Table ${order.table_number || 0}`
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className="flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-100">
        <Utensils size={13} className="text-gray-400" />{base}
      </span>
      {order.merged_from_number && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
          <GitMerge size={9} />+T{order.merged_from_number}
        </span>
      )}
      {order.transferred_from_id && !order.merged_from_number && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
          <ArrowRight size={9} />moved
        </span>
      )}
    </span>
  )
}

function TakeawayLabel({ order }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-base">🥡</span>
      <div>
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          {order.customer_name || 'Walk-in'}
        </div>
        {order.customer_name && (
          <div className="text-[10px] text-gray-400">Counter / Takeaway</div>
        )}
      </div>
    </span>
  )
}

// ── Item modifier / add modal ──────────────────────────────────────────────────
const OTH_REASONS = ['Incorrect Order', 'Customer Complaint', 'VIP / Loyalty', 'Quality Issue', 'Manager Decision', 'Other']

function OrderDetailModal({ order, onClose, navTo, tab }) {
  const { setLiveOrders, menuItems, menuCategories, addOthRecords, user, users } = useApp()
  const [items, setItems] = useState(() => order ? [...order.items] : [])
  const [newItems, setNewItems] = useState([])  // items added this session
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalCat, setModalCat] = useState('all')
  const [modalSearch, setModalSearch] = useState('')
  const [itemModal, setItemModal] = useState(null)
  const [itemModalQty, setItemModalQty] = useState(1)
  const [itemModalSelections, setItemModalSelections] = useState({})
  const [itemModalNote, setItemModalNote] = useState('')
  const [itemModalOth, setItemModalOth] = useState(false)
  const [itemModalOthReason, setItemModalOthReason] = useState('')

  if (!order) return null

  const total  = items.reduce((s, i) => s + i.price * i.qty, 0)
  const guests = order.guests ? order.guests.adults + order.guests.children : null
  const cfg    = getPayCfg(order)

  function changeQty(index, delta) {
    setItems(prev => {
      const updated = prev.map((item, i) => i === index ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0)
      setLiveOrders(orders => orders.map(o => o.id === order.id ? { ...o, items: updated } : o))
      return updated
    })
  }

  function removeItem(index) {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setLiveOrders(orders => orders.map(o => o.id === order.id ? { ...o, items: updated } : o))
      return updated
    })
  }

  function addNewItem(menuItem, qty, mods, note, comped, compReason) {
    const thisRound = (order.rounds ?? 1) + 1
    const newEntry = { id: menuItem.id, name: menuItem.name_en, price: menuItem.price, qty, mods, note, station: menuItem.station || 'kitchen', comped: !!comped, comped_reason: compReason || '', round: thisRound }
    setNewItems(prev => [...prev, newEntry])
    setItems(prev => {
      // Only merge with an existing item if it belongs to the same round and has no mods/note
      const existing = prev.findIndex(i => i.id === menuItem.id && (i.round ?? 1) === thisRound)
      let updated
      if (existing >= 0 && mods.length === 0 && !note) {
        updated = prev.map((item, i) => i === existing ? { ...item, qty: item.qty + qty } : item)
      } else {
        updated = [...prev, newEntry]
      }
      setLiveOrders(orders => orders.map(o => o.id === order.id ? { ...o, items: updated } : o))
      return updated
    })
  }

  function saveOrder() {
    if (newItems.length === 0) { onClose(); return }
    const round = (order.rounds ?? 1) + 1
    const kitchenItems = newItems.filter(i => (i.station || 'kitchen') !== 'bar')
    const barItems     = newItems.filter(i => i.station === 'bar')
    const ticket = { ...order, rounds: round }
    if (kitchenItems.length > 0) printStationTicket(ticket, kitchenItems, 'Kitchen')
    if (barItems.length > 0)     setTimeout(() => printStationTicket(ticket, barItems, 'Bar'), 400)
    setLiveOrders(prev => prev.map(o => o.id === order.id ? { ...o, rounds: round, status: 'cooking' } : o))
    onClose()
  }

  function openItemModal(menuItem) {
    setItemModal(menuItem)
    setItemModalQty(1)
    setItemModalSelections({})
    setItemModalNote('')
    setItemModalOth(false)
    setItemModalOthReason('')
  }

  const [compDialog, setCompDialog] = useState(null)   // { index, item }
  const [compReason, setCompReason] = useState('')
  const [compApprover, setCompApprover] = useState('')

  // ── Delete auth dialog ───────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState(null) // { index, item }
  const [deleteAuthVal, setDeleteAuthVal] = useState('')
  const [deleteAuthErr, setDeleteAuthErr] = useState('')

  const ALLOWED_DELETE_ROLES = ['superadmin', 'admin', 'owner', 'manager']

  function openDeleteDialog(index) {
    setDeleteDialog({ index, item: items[index] })
    setDeleteAuthVal('')
    setDeleteAuthErr('')
  }

  function confirmDelete() {
    const val = deleteAuthVal.trim()
    if (!val) { setDeleteAuthErr('Enter a password or PIN.'); return }
    // check against all authorized users: password match or PIN match
    const authorized = (users || []).find(u =>
      ALLOWED_DELETE_ROLES.includes(u.role) &&
      u.status === 'active' &&
      (u.password === val || (u.pin && u.pin === val))
    )
    if (!authorized) { setDeleteAuthErr('Incorrect password or PIN. Access denied.'); return }
    removeItem(deleteDialog.index)
    setDeleteDialog(null)
  }

  function openCompDialog(index) {
    const item = items[index]
    if (item.comped) {
      // un-comp immediately
      setItems(prev => {
        const updated = prev.map((it, i) => i === index ? { ...it, comped: false, comped_reason: '' } : it)
        setLiveOrders(orders => orders.map(o => o.id === order.id ? { ...o, items: updated } : o))
        return updated
      })
    } else {
      setCompDialog({ index, item })
      setCompReason('')
      setCompApprover('')
    }
  }

  function confirmComp() {
    if (!compReason || !compDialog) return
    const { index, item } = compDialog
    // index === -1 means this is a new item being added via the item modifier modal
    if (index === -1) {
      setItemModalOth(true)
      setItemModalOthReason(compReason)
      setCompDialog(null)
      return
    }
    setItems(prev => {
      const updated = prev.map((it, i) => i === index ? { ...it, comped: true, comped_reason: compReason } : it)
      setLiveOrders(orders => orders.map(o => o.id === order.id ? { ...o, items: updated } : o))
      return updated
    })
    addOthRecords([{
      id: `oth_${Date.now()}_${index}`,
      order_number: order.order_number,
      invoice_ref: `INV-${order.order_number}`,
      item_name: item.name || item.name_en,
      quantity: item.qty,
      original_price: item.price,
      total_value: item.price * item.qty,
      approved_by: compApprover.trim() || user?.full_name || '—',
      reason: compReason,
      table_label: order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_number}`,
      created_at: new Date().toISOString(),
    }])
    setCompDialog(null)
  }

  const updatedOrder = { ...order, items }

  function toggleMod(group, choice) {
    setItemModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function confirmAddItem() {
    const mods = Object.values(itemModalSelections).flat().filter(Boolean)
    addNewItem(itemModal, itemModalQty, mods, itemModalNote.trim(), itemModalOth, itemModalOthReason)
    if (itemModalOth && itemModalOthReason) {
      addOthRecords([{
        id: `oth_${Date.now()}_${itemModal.id}`,
        order_number: order.order_number,
        invoice_ref: `INV-${order.order_number}`,
        item_name: itemModal.name_en,
        quantity: itemModalQty,
        original_price: itemModal.price,
        total_value: itemModal.price * itemModalQty,
        approved_by: user?.full_name || '—',
        reason: itemModalOthReason,
        table_label: order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_number}`,
        created_at: new Date().toISOString(),
      }])
    }
    setItemModal(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                {order.order_type === 'takeaway'
                  ? <><span className="text-base">🥡</span>{order.customer_name || 'Walk-in'}</>
                  : <>
                      <Utensils size={14} className="text-gray-400" />Table {order.table_number || 0}
                      {order.merged_from_number && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold ml-1">
                          <GitMerge size={9} />+T{order.merged_from_number}
                        </span>
                      )}
                    </>
                }
              </div>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                {cfg.label || order.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Waiter', order.waiter || '—'],
              ['Guests', guests != null && guests > 0 ? `${guests} guest${guests !== 1 ? 's' : ''}` : '—'],
              ['Start Time', order.created_at || '—'],
              ['Elapsed', <ElapsedBadge key="el" timeStr={order.created_at} />],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{val}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items Ordered</div>
            {items.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No items</div>
            ) : (
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {items.map((item, i) => (
                  <div key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate flex items-center gap-1.5">
                          {item.name || item.name_en}
                          {item.comped && <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">🎁 OTH</span>}
                        </div>
                        {item.mods?.length > 0 && <div className="text-[11px] text-indigo-500 mt-0.5">+ {item.mods.join(' · ')}</div>}
                        {item.note && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            <MessageSquare size={10} />{item.note}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openCompDialog(i)}
                        title={item.comped ? 'Remove OTH' : 'Pre-flag as Comp'}
                        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base transition-colors ${item.comped ? 'bg-amber-100 dark:bg-amber-900/40' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-300 hover:text-amber-500'}`}
                      >🎁</button>
                      <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                        <button onClick={() => changeQty(i, -1)} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold transition-colors">−</button>
                        <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                        <button onClick={() => changeQty(i, 1)} className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold transition-colors">+</button>
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-14 text-right flex-shrink-0">€{(item.price * item.qty).toFixed(2)}</span>
                      <button onClick={() => openDeleteDialog(i)} title="Remove item" className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                        <X size={12} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setModalCat('all'); setModalSearch(''); setShowAddModal(true) }}
            className="w-full py-2 rounded-xl text-xs font-bold border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
          >+ Add New Item</button>

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

        {/* Total */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total</span>
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
        </div>

        {/* ── Delete Auth Dialog ── */}
        {deleteDialog && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteDialog(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                  <X size={18} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">Remove Item</div>
                  <div className="text-xs text-gray-400 mt-0.5">Requires manager permission</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2.5 mb-4">
                <div className="text-xs text-gray-400 mb-0.5">Item</div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {deleteDialog.item?.name || deleteDialog.item?.name_en}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  x{deleteDialog.item?.qty} · €{((deleteDialog.item?.price || 0) * (deleteDialog.item?.qty || 1)).toFixed(2)}
                </div>
              </div>

              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                Manager / Admin / Owner password or PIN
              </label>
              <input
                autoFocus
                type="password"
                value={deleteAuthVal}
                onChange={e => { setDeleteAuthVal(e.target.value); setDeleteAuthErr('') }}
                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                placeholder="Enter password or PIN"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-2"
              />
              {deleteAuthErr && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl px-3 py-2 mb-3">
                  {deleteAuthErr}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setDeleteDialog(null)}
                  className="py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item modal */}
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
                  <input autoFocus value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="Search items…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                    if (tab === 'kitchen' && item.station === 'bar') return false
                    if (tab === 'bar' && (item.station || 'kitchen') !== 'bar') return false
                    const q = modalSearch.trim().toLowerCase()
                    return (modalCat === 'all' || item.category_id === modalCat) && (!q || item.name_en.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q))
                  }).map(item => {
                    const inOrder = items.find(i => i.id === item.id)
                    return (
                      <button key={item.id} onClick={() => { setShowAddModal(false); openItemModal(item) }}
                        className="relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">€{item.price.toFixed(2)}</div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                        {inOrder && <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">{inOrder.qty}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <Btn variant="primary" fullWidth size="lg" onClick={() => setShowAddModal(false)}>Done</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Item Modifier */}
        {itemModal && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setItemModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">{itemModal.name_en}</h2>
                  <div className="text-sm text-indigo-600 font-bold">€{itemModal.price.toFixed(2)}</div>
                </div>
                <button onClick={() => setItemModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setItemModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                    <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{itemModalQty}</span>
                    <button onClick={() => setItemModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                    <span className="text-sm text-gray-400 ml-2">= €{(itemModal.price * itemModalQty).toFixed(2)}</span>
                  </div>
                </div>
                {(itemModal.modifierGroups || []).map(group => (
                  <div key={group.label}>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{group.label} {group.multi ? <span className="normal-case font-normal text-gray-400">(select multiple)</span> : <span className="normal-case font-normal text-gray-400">(choose one)</span>}</div>
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
                <div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
                  <textarea value={itemModalNote} onChange={e => setItemModalNote(e.target.value)} placeholder="e.g. No onion, allergen request…" rows={2} className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>

                {/* OTH button */}
                <button
                  type="button"
                  onClick={() => { setItemModalOth(false); setItemModalOthReason(''); setCompDialog({ index: -1, item: { ...itemModal, qty: itemModalQty } }) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${itemModalOth ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:border-amber-300'}`}
                >
                  <span className="text-xl">🎁</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">Pre-flag as Comp</div>
                    {itemModalOth
                      ? <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{itemModalOthReason} — will be comped at billing</div>
                      : <div className="text-xs text-gray-400 mt-0.5">Mark this item as On the House</div>
                    }
                  </div>
                  {itemModalOth && <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">ON</span>}
                </button>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <Btn fullWidth onClick={() => setItemModal(null)}>Cancel</Btn>
                <Btn variant="success" fullWidth onClick={confirmAddItem}>
                  Save{itemModalOth ? ' 🎁' : ''} — €{(itemModal.price * itemModalQty).toFixed(2)}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Pre-flag as Comp dialog */}
        {compDialog && (
          <div className={`fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm ${compDialog.index === -1 ? 'z-[80]' : 'z-[60]'}`} onClick={() => setCompDialog(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎁</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Pre-flag as Comp</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[200px]">{compDialog.item.name || compDialog.item.name_en}</p>
                  </div>
                </div>
                <button onClick={() => setCompDialog(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
              </div>
              <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Will be comped at billing</div>
                  <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300">€{(compDialog.item.price * compDialog.item.qty).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">×{compDialog.item.qty} @ €{compDialog.item.price.toFixed(2)}</div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Applied automatically</div>
                </div>
              </div>
              <div className="px-5 pt-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {OTH_REASONS.map(r => (
                    <button key={r} onClick={() => setCompReason(r)}
                      className={`text-xs font-semibold px-2.5 py-2 rounded-xl border-2 text-left transition-all ${compReason === r ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Approved By</label>
                <input value={compApprover} onChange={e => setCompApprover(e.target.value)}
                  placeholder={`Default: ${user?.full_name || 'Current user'}`}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                <button onClick={() => setCompDialog(null)}
                  className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >Cancel</button>
                <button onClick={confirmComp} disabled={!compReason}
                  className="py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]"
                >Flag as Comp</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 pb-5 pt-3 flex gap-2">
          <Btn onClick={onClose}>Close</Btn>
          <Btn variant="primary" fullWidth disabled={newItems.length === 0} onClick={saveOrder}>
            Save{newItems.length > 0 ? ` (${newItems.length} new)` : ''}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Station ticket print ───────────────────────────────────────────────────────
function printStationTicket(o, items, stationLabel) {
  const win = window.open('', '_blank', 'width=420,height=700')
  if (!win) return
  const now = new Date()
  const printDate = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  const printTime = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  const subOrderId = `${stationLabel === 'Kitchen' ? 'K' : 'B'}-${o.order_number}`
  win.document.write(`<!DOCTYPE html><html><head><title>${stationLabel} Ticket #${o.order_number}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Courier New',monospace;padding:20px;max-width:380px;margin:0 auto;font-size:13px}
    .header{text-align:center;margin-bottom:12px}.header h2{font-size:20px;letter-spacing:3px;margin:0 0 2px}
    .station-badge{display:inline-block;font-size:11px;font-weight:bold;border:2px solid #000;padding:2px 10px;letter-spacing:2px;margin-bottom:4px}
    hr{border:none;border-top:1px dashed #000;margin:10px 0}hr.solid{border-top:2px solid #000}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;margin-bottom:4px}
    .info-grid .label{color:#555;font-size:11px}.info-grid .value{font-weight:bold}
    .items-title{font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:8px 0 4px;color:#333}
    .item{margin:8px 0;overflow:hidden}.item-name{font-size:14px;font-weight:bold;display:block}
    .item-qty{font-size:16px;font-weight:bold;float:right;background:#000;color:#fff;padding:1px 6px}
    .mods{font-size:11px;color:#444;margin-top:2px}.note{font-size:11px;font-style:italic;color:#c00;margin-top:2px;padding:2px 4px;border:1px dashed #c00}
    .allergy{font-size:12px;font-weight:bold;color:#c00;padding:6px;border:2px solid #c00;margin-top:10px;text-align:center}
    .footer{text-align:center;font-size:10px;color:#777;margin-top:10px}@media print{body{padding:8px}}
  </style></head><body>
  <div class="header"><div class="station-badge">${stationLabel.toUpperCase()} TICKET</div><h2>#${o.order_number}</h2></div>
  <hr class="solid">
  <div class="info-grid">
    <div><div class="label">Date</div><div class="value">${printDate}</div></div>
    <div><div class="label">Time</div><div class="value">${printTime}</div></div>
    <div><div class="label">Order Time</div><div class="value">${o.created_at || '—'}</div></div>
    <div><div class="label">Table</div><div class="value">Table ${o.table_number || 0}${o.merged_from_number ? ` +T${o.merged_from_number}` : ''}</div></div>
    <div><div class="label">Waiter</div><div class="value">${o.waiter || '—'}</div></div>
    <div><div class="label">Sub Order</div><div class="value">${subOrderId}</div></div>
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
  <div class="footer">Printed ${printDate} ${printTime}</div>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OrderList({ navTo }) {
  const { liveOrders, setLiveOrders, user } = useApp()

  const isWaiter     = user?.role === 'waiter'
  const isCook       = user?.role === 'cook'
  const isBartender  = user?.role === 'bartender'

  const [search, setSearch] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [showAllPaid, setShowAllPaid] = useState(false)
  const [showAllTakeaway, setShowAllTakeaway] = useState(false)
  const [tab, setTab] = useState(() => {
    if (isCook)      return 'kitchen'
    if (isBartender) return 'bar'
    return 'all'
  })

  function markCooking(orderId) {
    const now = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
    setLiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cooking', started_at: now } : o))
  }

  function markReady(orderId) {
    const now = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
    setLiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready', ready_at: now } : o))
  }

  function startOrder(order) {
    const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
    const barItems     = order.items.filter(i => i.station === 'bar')
    if (kitchenItems.length > 0) printStationTicket(order, kitchenItems, 'Kitchen')
    if (barItems.length > 0) setTimeout(() => printStationTicket(order, barItems, 'Bar'), 400)
    markCooking(order.id)
  }

  const allActive = (isWaiter
    ? liveOrders.filter(o => o.waiter?.toLowerCase().includes(user.full_name?.split(' ')[0]?.toLowerCase() || ''))
    : [...liveOrders]
  ).filter(o => ACTIVE_STATUSES.includes(o.status))

  // Dine-in orders (excludes takeaway — shown in dedicated section below)
  const baseOrders = allActive.filter(o => o.order_type !== 'takeaway')

  // Takeaway orders — only active (non-paid); paid ones move to Paid Orders section below
  const takeawayOrders = allActive
    .filter(o => o.order_type === 'takeaway' && o.status !== 'paid')
    .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))

  const tabOrders = baseOrders.filter(o => {
    if (tab === 'kitchen') return o.items.some(i => (i.station || 'kitchen') !== 'bar')
    if (tab === 'bar')     return o.items.some(i => i.station === 'bar')
    return true
  })

  const filtered = tabOrders.filter(o => {
    const q = search.trim().toLowerCase()
    return o.status !== 'paid' && (!q || String(o.order_number).includes(q) || String(o.table_number).includes(q) || o.waiter?.toLowerCase().includes(q) || o.items.some(i => (i.name || i.name_en || '').toLowerCase().includes(q)))
  }).sort((a, b) => {
    if (tab !== 'all') return (a.order_number || 0) - (b.order_number || 0)
    return (b.order_number || 0) - (a.order_number || 0)
  })

  const paidOrders = allActive.filter(o => o.status === 'paid').sort((a, b) => (b.order_number || 0) - (a.order_number || 0))

  // Stats (dine-in only)
  const counts = { paid: 0, unpaid: 0 }
  baseOrders.forEach(o => { if (o.status === 'paid') counts.paid++; else counts.unpaid++ })

  const tabCounts = {
    all:     baseOrders.filter(o => o.status !== 'paid').length,
    kitchen: baseOrders.filter(o => o.status !== 'paid' && o.items.some(i => (i.station || 'kitchen') !== 'bar')).length,
    bar:     baseOrders.filter(o => o.status !== 'paid' && o.items.some(i => i.station === 'bar')).length,
  }

  return (
    <div className="flex flex-col gap-4">
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} navTo={navTo} tab={tab} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key:'unpaid', label:'Dine-in Active', Icon: AlertTriangle, iconColor:'text-red-500',   bg:'bg-red-50 dark:bg-red-900/20',     border:'border-red-200 dark:border-red-800/40' },
          { key:'paid',   label:'Dine-in Paid',   Icon: CheckCircle2,  iconColor:'text-green-500', bg:'bg-green-50 dark:bg-green-900/20', border:'border-green-200 dark:border-green-800/40' },
        ].map(({ key, label, Icon, iconColor, bg, border }) => (
          <div key={key} className={`${bg} border ${border} rounded-2xl px-3 py-3 flex items-center gap-2.5`}>
            <div className={`flex-shrink-0 ${iconColor}`}><Icon size={18} /></div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{counts[key]}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl px-3 py-3 flex items-center gap-2.5">
          <span className="text-lg flex-shrink-0">🥡</span>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{takeawayOrders.length}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Takeaway Active</div>
          </div>
        </div>
      </div>

      {/* Sub-nav + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {SUB_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0
                ${tab === t.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}
            >
              <t.Icon size={15} />
              <span>{t.label}</span>
              <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {tabCounts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56 flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Order, table, waiter…"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col items-center justify-center py-20">
          {(() => { const T = SUB_TABS.find(t => t.key === tab); return T ? <T.Icon size={40} className="text-gray-300 dark:text-gray-600 mb-3" /> : null })()}
          <div className="text-sm font-semibold text-gray-400">No active orders</div>
          <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">{search ? 'Try a different search term' : 'All quiet — waiting for new orders'}</div>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {filtered.map(order => {
              const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
              const barItems     = order.items.filter(i => i.station === 'bar')
              const stationItems = tab === 'kitchen' ? kitchenItems : tab === 'bar' ? barItems : order.items
              const cfg          = getPayCfg(order)
              const isUrgent     = (getElapsedMin(order.created_at) || 0) > 20

              return (
                <div
                  key={order.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all border-gray-100 dark:border-gray-700/60`}
                >
                  {/* Card top bar */}
                  <div className={`h-1 w-full ${order.status === 'paid' ? 'bg-green-500' : 'bg-red-400'}`} />

                  <div className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <ElapsedBadge timeStr={order.created_at} />
                    </div>

                    {/* Table + meta */}
                    <div className="flex items-start justify-between gap-2">
                      <TableLabel order={order} />
                      <span className="text-xs text-gray-400 flex-shrink-0">{order.waiter || '—'}</span>
                    </div>

                    {/* Items preview */}
                    <div className={`rounded-xl p-3 space-y-1.5 ${tab === 'kitchen' ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30' : tab === 'bar' ? 'bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30' : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/40'}`}>
                      {stationItems.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-extrabold flex-shrink-0 ${tab === 'bar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'}`}>
                            {item.qty}
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.name || item.name_en}</span>
                          {item.note && <MessageSquare size={10} className="text-amber-500 flex-shrink-0" />}
                        </div>
                      ))}
                      {stationItems.length > 3 && (
                        <div className="text-[11px] text-gray-400 pl-7">+{stationItems.length - 3} more item{stationItems.length - 3 > 1 ? 's' : ''}</div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setViewOrder(order)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-all">
                        <Eye size={13} />View
                      </button>
                      {order.status !== 'paid' && (
                        <button onClick={() => { navTo('billing', { preloadOrder: order }) }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-all">
                          Go to Billing
                        </button>
                      )}
                      {tab === 'kitchen' && (
                        <button onClick={() => printStationTicket(order, order.items, 'Kitchen')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 transition-all">
                          <Printer size={13} />
                        </button>
                      )}
                      {tab === 'bar' && (
                        <button onClick={() => printStationTicket(order, order.items, 'Bar')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 transition-all">
                          <Printer size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiter</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiting</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {filtered.map(order => {
                  const kitchenItems = order.items.filter(i => (i.station || 'kitchen') !== 'bar')
                  const barItems     = order.items.filter(i => i.station === 'bar')
                  const stationItems = tab === 'kitchen' ? kitchenItems : tab === 'bar' ? barItems : order.items
                  const cfg          = getPayCfg(order)
                  const elapsed      = getElapsedMin(order.created_at) || 0
                  const isUrgent     = elapsed > 20 && order.status !== 'paid'

                  return (
                    <tr key={order.id} className={`transition-colors ${isUrgent ? 'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/20'}`}>

                      {/* Order # */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
                          {isUrgent && <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />Urgent</span>}
                        </div>
                      </td>

                      {/* Table */}
                      <td className="px-4 py-3.5"><TableLabel order={order} /></td>

                      {/* Items */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {stationItems.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold flex-shrink-0 ${tab === 'bar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'}`}>{item.qty}</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.name || item.name_en}</span>
                              {item.note && <MessageSquare size={10} className="text-amber-500 flex-shrink-0" />}
                            </div>
                          ))}
                          {stationItems.length > 2 && <span className="text-[11px] text-gray-400 pl-6.5">+{stationItems.length - 2} more</span>}
                        </div>
                      </td>

                      {/* Waiter */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{order.waiter || '—'}</td>

                      {/* Waiting time */}
                      <td className="px-4 py-3.5 whitespace-nowrap"><ElapsedBadge timeStr={order.created_at} /></td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${order.status === 'cooking' ? 'animate-pulse' : ''}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setViewOrder(order)} title="View detail" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                            <Eye size={12} />View
                          </button>
                          {tab === 'kitchen' && (
                            <button onClick={() => printStationTicket(order, order.items, 'Kitchen')} title="Reprint kitchen chit" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition-all">
                              <Printer size={12} />Print
                            </button>
                          )}
                          {tab === 'bar' && (
                            <button onClick={() => printStationTicket(order, order.items, 'Bar')} title="Reprint bar chit" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-all">
                              <Printer size={12} />Print
                            </button>
                          )}
                          {order.status !== 'paid' && (
                            <button onClick={() => navTo('billing', { preloadOrder: order })} title="Go to Billing" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-all">
                              Go to Billing
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

      {/* ── Takeaway Orders ─────────────────────────────────────────────────── */}
      {takeawayOrders.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🥡</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Takeaway Orders</span>
            {takeawayOrders.length > 0 && (
              <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">{takeawayOrders.length} active</span>
            )}
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {(showAllTakeaway ? takeawayOrders : takeawayOrders.slice(0, 4)).map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-200 dark:border-orange-800/40 overflow-hidden transition-all">
                <div className="h-1 w-full bg-orange-400" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">#{order.order_number}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Active</span>
                    </div>
                    <ElapsedBadge timeStr={order.created_at} />
                  </div>
                  <div className="flex items-center justify-between">
                    <TakeawayLabel order={order} />
                    <span className="text-xs text-gray-400">{order.waiter || '—'}</span>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3 space-y-1.5">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-extrabold flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300">{item.qty}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.name || item.name_en}</span>
                        {item.note && <MessageSquare size={10} className="text-amber-500 flex-shrink-0" />}
                      </div>
                    ))}
                    {order.items.length > 3 && <div className="text-[11px] text-gray-400 pl-7">+{order.items.length - 3} more</div>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setViewOrder(order)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-orange-300 transition-all">
                      <Eye size={13} />View
                    </button>
                    <button onClick={() => navTo('billing', { preloadOrder: order })} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition-all">
                      Go to Billing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-orange-50/60 dark:bg-orange-900/10">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiting</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                {(showAllTakeaway ? takeawayOrders : takeawayOrders.slice(0, 8)).map(order => (
                  <tr key={order.id} className="transition-colors hover:bg-orange-50/40 dark:hover:bg-orange-900/5">
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-orange-600 dark:text-orange-400">#{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3.5"><TakeawayLabel order={order} /></td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex flex-col gap-1">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300">{item.qty}</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.name || item.name_en}</span>
                            {item.note && <MessageSquare size={10} className="text-amber-500 flex-shrink-0" />}
                          </div>
                        ))}
                        {order.items.length > 2 && <span className="text-[11px] text-gray-400 pl-6.5">+{order.items.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{order.waiter || '—'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><ElapsedBadge timeStr={order.created_at} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Active</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setViewOrder(order)} title="View detail" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all">
                          <Eye size={12} />View
                        </button>
                        <button onClick={() => navTo('billing', { preloadOrder: order })} title="Go to Billing" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition-all">
                          Billing
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {takeawayOrders.length > 8 && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center">
                <button onClick={() => setShowAllTakeaway(v => !v)} className="text-xs font-bold text-orange-500 dark:text-orange-400 hover:underline">
                  {showAllTakeaway ? 'Show less' : `Show all ${takeawayOrders.length} takeaway orders`}
                </button>
              </div>
            )}
          </div>

          {/* Mobile show-more */}
          {takeawayOrders.length > 4 && (
            <div className="lg:hidden text-center mt-2">
              <button onClick={() => setShowAllTakeaway(v => !v)} className="text-xs font-bold text-orange-500 dark:text-orange-400 hover:underline">
                {showAllTakeaway ? 'Show less' : `Show all ${takeawayOrders.length} takeaway orders`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paid Orders */}
      {paidOrders.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Paid Orders</span>
            <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{paidOrders.length}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <div className={`overflow-y-auto ${showAllPaid ? 'max-h-none' : 'max-h-[320px]'}`}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table / Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Waiter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {(showAllPaid ? paidOrders : paidOrders.slice(0, 5)).map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors opacity-75">
                      <td className="px-5 py-3">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">#{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3">{order.order_type === 'takeaway' ? <TakeawayLabel order={order} /> : <TableLabel order={order} />}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{order.waiter || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Paid
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setViewOrder(order)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <Eye size={12} />View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paidOrders.length > 5 && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center">
                <button onClick={() => setShowAllPaid(v => !v)} className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:underline">
                  {showAllPaid ? 'Show less' : `Show all ${paidOrders.length} paid orders`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
