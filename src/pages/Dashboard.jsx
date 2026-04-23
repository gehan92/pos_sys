// ─── Dashboard ───────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useApp, ROLES } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Card, StatCard, Badge, Table, TR, TD, Btn, Avatar, Divider, SectionLabel, statusColor, Input, Select, Textarea } from '../components/UI'
import { SAMPLE_USERS, SAMPLE_ORDERS, INVENTORY_ITEMS, TABLES, MENU_CATEGORIES, MENU_ITEMS, SAMPLE_INVOICES, SUPPLIER_INVOICES } from '../lib/mockData'

export function Dashboard({ navTo }) {
  const { user, lang, users, approveUser } = useApp()
  const isManagement = ['superadmin','admin','owner','manager','supervisor'].includes(user?.role)
  const canApprove = ['superadmin','admin'].includes(user?.role)
  const pendingUsers = users.filter(u => u.status === 'pending')

  return (
    <div>
      {isManagement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Today's sales" value="€2,840" sub="+12% vs yesterday" />
          <StatCard label="Orders" value="47" sub="8 pending" />
          <StatCard label="Tables" value="9/12" sub="75% occupied" />
          <StatCard label="Low stock" value="3" sub="Restock needed" subColor="text-red-500" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900 dark:text-white text-sm">Recent activity</h2>
            <Badge color="blue">Live</Badge>
          </div>
          <Table headers={['Time','Action','User','Status']}>
            {[['14:32','Order #047 placed','Maria G.','cooking'],['14:28','Invoice #312 paid','John C.','paid'],['14:15','New user request','Manager','pending'],['13:55','Stock updated','Supplier','active'],['13:40','Table 6 cleared','Waiter','free']].map(([time,action,u,s]) => (
              <TR key={time}>
                <TD>{time}</TD><TD>{action}</TD><TD>{u}</TD>
                <TD><Badge color={statusColor(s)}>{s}</Badge></TD>
              </TR>
            ))}
          </Table>
        </Card>
        <div className="space-y-4">
          {isManagement && canApprove && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-gray-900 dark:text-white text-sm">Pending approvals</h2>
                <Badge color={pendingUsers.length > 0 ? 'red' : 'green'}>{pendingUsers.length}</Badge>
              </div>
              {pendingUsers.length === 0
                ? <p className="text-sm text-gray-400 text-center py-3">All users approved</p>
                : pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.full_name} />
                    <div>
                      <div className="text-sm text-gray-800 dark:text-gray-200">{u.full_name}</div>
                      <div className="text-xs text-gray-400">{ROLES[u.role]?.label} · by {u.created_by}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Btn size="sm" variant="success" onClick={() => approveUser(u.id)}>Approve</Btn>
                    <Btn size="sm" onClick={() => navTo('users')}>View all</Btn>
                  </div>
                </div>
                ))
              }
            </Card>
          )}
          <Card>
            <h2 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Low stock alerts</h2>
            {INVENTORY_ITEMS.filter(i => i.quantity < i.min_stock).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.item_name}</span>
                <span className="text-xs text-red-500">{item.quantity}{item.unit} / min {item.min_stock}{item.unit}</span>
              </div>
            ))}
            <Btn size="sm" variant="primary" className="mt-3" onClick={() => navTo('inventory')}>View Inventory</Btn>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function Users() {
  const { lang, user: currentUser, users, createUser, approveUser, deactivateUser } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name:'', username:'', role:'waiter', password:'' })
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [usernameError, setUsernameError] = useState('')

  // Which roles the current user is allowed to create
  const CREATABLE_ROLES = {
    superadmin: ['superadmin','admin','owner','manager','cashier','supervisor','waiter','cook','supplier'],
    admin:      ['admin','owner','manager','cashier','supervisor','waiter','cook','supplier'],
    owner:      ['manager','cashier','supervisor','waiter','cook'],
    manager:    ['cashier','waiter','cook'],
  }
  const allowedRoles = CREATABLE_ROLES[currentUser?.role] || []

  // Only superadmin & admin can approve
  const canApprove = ['superadmin','admin'].includes(currentUser?.role)

  function handleCreate() {
    if (!form.full_name.trim() || !form.username.trim() || !form.password.trim()) return
    if (!allowedRoles.includes(form.role)) return
    // Check username uniqueness
    if (users.find(u => u.username === form.username.trim())) {
      setUsernameError('Username already taken')
      return
    }
    setUsernameError('')
    createUser({ ...form, username: form.username.trim().toLowerCase() }, currentUser)
    setShowForm(false)
    setForm({ full_name:'', username:'', role: allowedRoles[0] || 'waiter', password:'' })
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div>
      {/* Confirm deactivate dialog */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Deactivate account?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>{confirmDeactivate.full_name}</strong> will no longer be able to log in.
            </p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDeactivate(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => { deactivateUser(confirmDeactivate.id); setConfirmDeactivate(null) }}>Deactivate</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals banner */}
      {pendingCount > 0 && canApprove && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">⏳ {pendingCount} account{pendingCount > 1 ? 's' : ''} awaiting your approval</span>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">Staff accounts</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allowedRoles.length > 0
                ? <>You can create: <span className="font-semibold text-indigo-500">{allowedRoles.map(r => ROLES[r]?.label).join(', ')}</span></>
                : 'You do not have permission to create accounts'}
            </p>
          </div>
          {allowedRoles.length > 0 && (
            <Btn variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setUsernameError('') }}>
              {showForm ? 'Cancel' : '+ Add User'}
            </Btn>
          )}
        </div>

        {/* Create account form */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">New staff account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Full Name" value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} placeholder="e.g. Maria Galea" />
              <div>
                <Input label="Username" value={form.username} onChange={e => { setForm(p=>({...p,username:e.target.value})); setUsernameError('') }} placeholder="mgalea" />
                {usernameError && <p className="text-xs text-rose-500 mt-1">{usernameError}</p>}
              </div>
              <Select label="Role" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                {allowedRoles.map(k => <option key={k} value={k}>{ROLES[k]?.label}</option>)}
              </Select>
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Temp@1234" />
            </div>
            {/* Status notice */}
            {['manager','owner'].includes(currentUser?.role) ? (
              <div className="flex items-start gap-2 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                ⚠ This account will be <strong className="mx-1">pending approval</strong> — an Admin or Super Admin must activate it before the user can log in.
              </div>
            ) : (
              <div className="flex items-start gap-2 mb-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                ✅ Account will be <strong className="mx-1">immediately active</strong> — the user can log in right away.
              </div>
            )}
            <div className="flex gap-2">
              <Btn variant="success" onClick={handleCreate} disabled={!form.full_name.trim() || !form.username.trim() || !form.password.trim()}>
                Create Account
              </Btn>
              <Btn onClick={() => { setShowForm(false); setUsernameError('') }}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Created by</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} />
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{u.full_name}</div>
                        <div className="text-xs text-gray-400 font-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor(u.role)}>{ROLES[u.role]?.label || u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{u.created_by || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.status==='active'?'green':u.status==='pending'?'yellow':'red'}>
                      {u.status === 'active' ? '✓ Active' : u.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {u.status === 'pending' && canApprove && (
                        <Btn size="sm" variant="success" onClick={() => approveUser(u.id)}>Approve</Btn>
                      )}
                      {u.status === 'active' && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="danger" onClick={() => setConfirmDeactivate(u)}>Deactivate</Btn>
                      )}
                      {u.status === 'inactive' && canApprove && (
                        <Btn size="sm" variant="primary" onClick={() => approveUser(u.id)}>Reactivate</Btn>
                      )}
                      {u.id === currentUser?.id && (
                        <span className="text-xs text-gray-400 italic px-2">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Tables ───────────────────────────────────────────────────────────────────
export function Tables({ navTo, setOrderContext }) {
  const { liveOrders } = useApp()
  const [tables, setTables] = useState(TABLES)

  function selectTable(table) {
    if (table.status === 'free') {
      setOrderContext({ tableId: table.id, tableNumber: table.number, isTakeaway: false, existingOrder: null })
      navTo('orders')
    } else {
      // Occupied — open existing order to add items
      const existingOrder = liveOrders.find(o => o.table_id === table.id)
      if (existingOrder) {
        setOrderContext({ tableId: table.id, tableNumber: table.number, isTakeaway: false, existingOrder })
        navTo('orders')
      }
    }
  }

  function takeaway() {
    setOrderContext({ tableId: null, tableNumber: null, isTakeaway: true, existingOrder: null })
    navTo('orders')
  }

  function addToOrder(order) {
    setOrderContext({
      tableId: order.table_id,
      tableNumber: order.table_number,
      isTakeaway: order.order_type === 'takeaway',
      existingOrder: order,
    })
    navTo('orders')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 dark:text-white">Table layout</h2>
          <div className="flex gap-2">
            <Badge color="green">Free: {tables.filter(t=>t.status==='free').length}</Badge>
            <Badge color="red">Occ: {tables.filter(t=>t.status==='occupied').length}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {tables.map(table => (
            <button key={table.id} onClick={() => selectTable(table)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                table.status === 'free'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:border-indigo-500 cursor-pointer'
              }`}>
              <span className="text-lg font-bold">{table.number}</span>
              <span className="text-xs opacity-70">{table.status === 'free' ? 'Free' : '+ Add'}</span>
            </button>
          ))}
        </div>
        <Btn variant="warning" fullWidth size="lg" onClick={takeaway}>🛍 Takeaway Order</Btn>
      </Card>
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-3">Active orders</h2>
        <Table headers={['Table','Type','Status','Action']}>
          {liveOrders.map(o => (
            <TR key={o.id}>
              <TD className="font-medium">{o.order_type === 'takeaway' ? 'Takeaway' : `T${o.table_number}`}</TD>
              <TD><Badge color={o.order_type==='takeaway'?'orange':'blue'}>{o.order_type==='takeaway'?'Takeaway':'Dine-in'}</Badge></TD>
              <TD><Badge color={statusColor(o.status)}>{o.status}</Badge></TD>
              <TD>
                <div className="flex gap-1.5">
                  {o.status === 'ready'
                    ? <Btn size="sm" variant="primary" onClick={() => navTo('billing')}>Bill</Btn>
                    : null
                  }
                  <Btn size="sm" variant="success" onClick={() => addToOrder(o)}>+ Add</Btn>
                </div>
              </TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  )
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export function Orders({ navTo, orderContext }) {
  const { lang, user, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum, requestBill, menuItems, menuCategories } = useApp()
  const [newItems, setNewItems] = useState([])
  const [cat, setCat] = useState('cat1')
  const [notes, setNotes] = useState('')

  // ── Item modifier modal ──────────────────────────────────────────────────────
  const [itemModal, setItemModal] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalSelections, setModalSelections] = useState({}) // { groupLabel: string[] }
  const [modalNote, setModalNote] = useState('')

  function openItemModal(item) {
    setItemModal(item)
    setModalQty(1)
    setModalSelections({})
    setModalNote('')
  }

  function toggleMod(group, choice) {
    setModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) {
        return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function addItemWithMods() {
    const flatMods = Object.values(modalSelections).flat().filter(Boolean)
    const cartKey = `${itemModal.id}-${Date.now()}`
    setNewItems(p => [...p, { ...itemModal, qty: modalQty, cartKey, selectedMods: flatMods, note: modalNote.trim() }])
    setItemModal(null)
  }

  const isAddingToExisting = !!orderContext?.existingOrder
  const existingOrder = orderContext?.existingOrder || null
  const existingItems = existingOrder?.items || []
  const round = isAddingToExisting ? (existingOrder.rounds ?? 1) + 1 : 1

  const label = orderContext?.isTakeaway ? 'Takeaway' : orderContext?.tableNumber ? `Table ${orderContext.tableNumber}` : 'New Order'
  const catItems = menuItems.filter(m => m.category_id === cat && m.available)

  const existingSubtotal = existingItems.reduce((a, i) => a + i.price * i.qty, 0)
  const newSubtotal = newItems.reduce((a, i) => a + i.price * i.qty, 0)
  const grandTotal = existingSubtotal + newSubtotal

  function addItem(item) {
    setNewItems(p => {
      const ex = p.find(i => i.id === item.id)
      if (ex) return p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { ...item, qty: 1 }]
    })
  }

  function changeQty(key, delta) {
    setNewItems(p => p.map(i => (i.cartKey || i.id) === key ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  function sendKitchen() {
    if (!newItems.length) return

    if (isAddingToExisting) {
      // Append new items to existing order
      setLiveOrders(prev => prev.map(o =>
        o.id === existingOrder.id
          ? { ...o, items: [...o.items, ...newItems.map(i => ({ name: i.name_en, qty: i.qty, price: i.price, mods: i.selectedMods || [], note: i.note || '' }))], rounds: round, status: 'cooking' }
          : o
      ))
      alert(`Round ${round} sent to kitchen!\n${newItems.length} new item(s) added to ${label}`)
    } else {
      // New order
      const newOrder = {
        id: `o${Date.now()}`,
        order_number: nextOrderNum,
        table_id: orderContext?.tableId || null,
        table_number: orderContext?.tableNumber || null,
        order_type: orderContext?.isTakeaway ? 'takeaway' : 'dinein',
        status: 'cooking',
        waiter: user?.full_name || 'Staff',
        notes,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: newItems.map(i => ({ name: i.name_en, qty: i.qty, price: i.price, mods: i.selectedMods || [], note: i.note || '' })),
        rounds: 1,
      }
      setLiveOrders(prev => [...prev, newOrder])
      setNextOrderNum(n => n + 1)
      alert(`Order #${nextOrderNum} sent to kitchen!\n${newItems.length} item(s) for ${label}`)
    }

    setNewItems([])
    setNotes('')
    navTo('tables')
  }

  // Active orders sidebar data
  const activeOrders = liveOrders.filter(o => !['served', 'paid'].includes(o.status))
  const statusLabel = { pending: 'Pending', cooking: 'Cooking', ready: 'Ready', bill_requested: 'Bill Req.' }
  const statusBadge = { pending: 'yellow', cooking: 'blue', ready: 'green', bill_requested: 'orange' }

  return (
    <>
    {/* ── Item Modifier Modal ── */}
    {itemModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setItemModal(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl">{itemModal.emoji}</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{itemModal.name_en}</h2>
              </div>
              <div className="text-sm text-indigo-600 font-bold">€{itemModal.price.toFixed(2)}</div>
            </div>
            <button onClick={() => setItemModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
          </div>
          <div className="p-5 space-y-5">
            {/* Quantity */}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{modalQty}</span>
                <button onClick={() => setModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                <span className="text-sm text-gray-400 ml-2">= €{(itemModal.price * modalQty).toFixed(2)}</span>
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
                    const active = (modalSelections[group.label] || []).includes(choice)
                    return (
                      <button key={choice} onClick={() => toggleMod(group, choice)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                        {active && '✓ '}{choice}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {/* Free text note */}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
              <textarea
                value={modalNote}
                onChange={e => setModalNote(e.target.value)}
                placeholder="e.g. No onion, allergen request, cook medium..."
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
          {/* Footer buttons */}
          <div className="flex gap-2 px-5 pb-5">
            <Btn fullWidth onClick={() => setItemModal(null)}>Cancel</Btn>
            <Btn variant="success" fullWidth onClick={addItemWithMods}>
              Add {modalQty > 1 ? `×${modalQty}` : ''} to Order — €{(itemModal.price * modalQty).toFixed(2)}
            </Btn>
          </div>
        </div>
      </div>
    )}
    <div className="flex gap-3">

      {/* ── Left sidebar: all active orders ── */}
      <div className="w-52 flex-shrink-0 hidden md:flex flex-col gap-2">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-1">Active Orders</div>
        {activeOrders.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4">No active orders</div>
        )}
        {activeOrders.map(o => {
          const isCurrentOrder = orderContext?.existingOrder?.id === o.id
          return (
            <div key={o.id} className={`rounded-xl border p-2.5 space-y-1.5 transition-all ${isCurrentOrder ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {o.order_type === 'takeaway' ? '🛍 Takeaway' : `🍽 T${o.table_number}`}
                </span>
                <Badge color={statusBadge[o.status] || 'gray'}>{statusLabel[o.status] || o.status}</Badge>
              </div>
              <div className="text-xs text-gray-400">{o.items.length} item(s) • #{o.order_number}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Waiter: {o.waiter}</div>
              <div className="flex flex-col gap-1 pt-1">
                {o.status === 'ready' && (
                  <Btn size="sm" variant="warning" onClick={() => requestBill(o)}>🧾 Request Bill</Btn>
                )}
                {o.status === 'bill_requested' && (
                  <div className="text-xs text-center text-amber-600 dark:text-amber-400 font-semibold py-1">⏳ Waiting cashier…</div>
                )}
                {!['ready', 'bill_requested'].includes(o.status) && (
                  <Btn size="sm" onClick={() => navTo('orders', { tableId: o.table_id, tableNumber: o.table_number, isTakeaway: o.order_type === 'takeaway', existingOrder: o })}>+ Add Items</Btn>
                )}
              </div>
            </div>
          )
        })}
        <Btn size="sm" variant="ghost" fullWidth onClick={() => navTo('tables')}>← Tables</Btn>
      </div>

      {/* ── Right: order builder ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Menu side */}
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">{label}</h2>
            <div className="flex items-center gap-2">
              {isAddingToExisting && <Badge color="indigo">Round {round}</Badge>}
              <Badge color={orderContext?.isTakeaway ? 'orange' : 'blue'}>{orderContext?.isTakeaway ? 'Takeaway' : 'Dine-in'}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {menuCategories.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cat === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300'}`}>
                {c.icon} {c.name_en}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {catItems.map(item => (
              <button key={item.id} onClick={() => openItemModal(item)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-left hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{item.emoji}</span>
                  {item.modifierGroups?.length > 0 && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">+ options</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{item.name_en}</div>
                <div className="text-sm text-indigo-600 font-bold mt-1">€{item.price.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{item.description_en}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Order side */}
      <div className="space-y-3">

        {/* Already ordered (existing rounds) */}
        {isAddingToExisting && existingItems.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-500 dark:text-gray-400 text-sm">
                Already ordered
                {existingOrder.rounds > 1 && <span className="ml-1 text-xs">({existingOrder.rounds} round{existingOrder.rounds > 1 ? 's' : ''})</span>}
              </h2>
              <Badge color="gray">€{existingSubtotal.toFixed(2)}</Badge>
            </div>
            {existingItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 opacity-60">
                <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="text-xs text-gray-400 mr-3">x{item.qty}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-14 text-right">€{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </Card>
        )}

        {/* New items being added */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              {isAddingToExisting ? `Round ${round} — adding now` : 'Order summary'}
            </h2>
            {newItems.length > 0 && <Badge color="indigo">+€{newSubtotal.toFixed(2)}</Badge>}
          </div>
          {newItems.length === 0
            ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">
                  {isAddingToExisting ? 'Select items to add to this order' : 'No items added yet'}
                </p>
              </div>
            )
            : newItems.map(item => (
              <div key={item.cartKey || item.id} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800 dark:text-gray-200">{item.name_en}</span>
                    {item.selectedMods?.length > 0 && (
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">+ {item.selectedMods.join(' · ')}</div>
                    )}
                    {item.note && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">📝 {item.note}</div>
                    )}
                  </div>
                  <button onClick={() => changeQty(item.cartKey || item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold">−</button>
                  <span className="text-sm font-bold w-5 text-center text-gray-800 dark:text-gray-200">{item.qty}</span>
                  <button onClick={() => changeQty(item.cartKey || item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold">+</button>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-14 text-right">€{(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))
          }
          {newItems.length > 0 && (
            <>
              <Divider />
              <div className="space-y-1">
                {isAddingToExisting && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Previous total</span>
                    <span className="text-gray-400">€{existingSubtotal.toFixed(2)}</span>
                  </div>
                )}
                {isAddingToExisting && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Round {round} adds</span>
                    <span className="text-indigo-600 font-semibold">+€{newSubtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-200">{isAddingToExisting ? 'Running total' : 'Subtotal'}</span>
                  <span className="text-gray-900 dark:text-white text-base">€{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Notes (only for new orders) */}
        {!isAddingToExisting && (
          <Card>
            <Textarea label="Notes / Allergies" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Nut allergy, no garlic..." />
            <div className="flex flex-wrap gap-1.5">
              {['Nut allergy','Gluten free','Lactose','Vegan','No spice'].map(tag => (
                <button key={tag} onClick={() => setNotes(p => p ? p+'. '+tag : tag)}
                  className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        )}

        <Btn
          variant="success"
          fullWidth
          size="lg"
          onClick={sendKitchen}
          disabled={newItems.length === 0}
        >
          {isAddingToExisting ? `Send Round ${round} to Kitchen` : 'Send to Kitchen'}
        </Btn>
        <Btn fullWidth onClick={() => navTo('tables')}>Back to Tables</Btn>
      </div>
      </div>
    </div>
    </>
  )
}

// ─── Kitchen ──────────────────────────────────────────────────────────────────
export function Kitchen() {
  const { liveOrders, setLiveOrders } = useApp()

  const kitchenOrders = [...liveOrders]
    .filter(o => ['pending', 'cooking', 'ready'].includes(o.status))
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))

  function advance(id) {
    setLiveOrders(p => p.map(o => {
      if (o.id !== id) return o
      if (o.status === 'pending') return { ...o, status: 'cooking' }
      if (o.status === 'cooking') return { ...o, status: 'ready' }
      if (o.status === 'ready')   return { ...o, status: 'served' }
      return o
    }))
  }

  function togglePriority(id) {
    setLiveOrders(p => p.map(o => o.id === id ? { ...o, priority: !o.priority } : o))
  }

  const borderColor = { pending: 'border-l-amber-400', cooking: 'border-l-blue-500', ready: 'border-l-green-500' }
  const btnVariant  = { pending: 'primary', cooking: 'success', ready: 'warning' }
  const btnLabel    = { pending: '▶ Start Cooking', cooking: '✓ Mark Ready', ready: '✓ Served — Clear' }

  if (kitchenOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="text-4xl mb-2">👨‍🍳</div>
        <div className="text-sm font-medium">No active orders</div>
        <div className="text-xs mt-1">Waiting for new orders…</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kitchenOrders.map(o => (
        <div key={o.id} className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-card p-5 border-l-4 ${borderColor[o.status] || 'border-l-gray-300'} ${o.priority ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}>
          {/* Order header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">#{o.order_number} · {o.created_at} · {o.waiter}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePriority(o.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${o.priority ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500'}`}
              >
                {o.priority ? '🚨 Priority' : 'Prioritise'}
              </button>
              <Badge color={statusColor(o.status)}>{o.status}</Badge>
            </div>
          </div>
          {/* Items */}
          <div className="mt-3 space-y-0">
            {o.items.map((item, i) => (
              <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {item.name || item.name_en} <span className="text-indigo-500">×{item.qty}</span>
                </div>
                {item.mods?.length > 0 && (
                  <div className="text-xs text-indigo-400 dark:text-indigo-400 mt-0.5">+ {item.mods.join(' · ')}</div>
                )}
                {item.note && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-0.5 inline-block">📝 {item.note}</div>
                )}
              </div>
            ))}
          </div>
          {/* Allergy note on order level */}
          {o.notes && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
              ⚠ {o.notes}
            </div>
          )}
          <Btn variant={btnVariant[o.status]} fullWidth size="lg" className="mt-4" onClick={() => advance(o.id)}>
            {btnLabel[o.status]}
          </Btn>
        </div>
      ))}
    </div>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function Billing() {
  const { lang, company, liveOrders, billQueue, clearBillRequest, menuItems, menuCategories } = useApp()
  const vatRate = company.vat_rate / 100

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([])
  const [payMethod, setPayMethod] = useState(null)
  const [cashGiven, setCashGiven] = useState(0)
  const [receipt, setReceipt] = useState(null)

  // ── Product browser state ───────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeFlash, setBarcodeFlash] = useState(null) // item id that was just scanned
  const [loadedOrderId, setLoadedOrderId] = useState(null)
  const searchRef = useRef(null)
  const barcodeRef = useRef(null)

  // ── Filtered items ──────────────────────────────────────────────────────────
  const visibleItems = menuItems.filter(item => {
    if (!item.available) return false
    const q = search.trim().toLowerCase()
    const matchCat = activeCat === 'all' || item.category_id === activeCat
    const matchSearch = !q || item.name_en.toLowerCase().includes(q)
                            || item.code?.toLowerCase().includes(q)
                            || item.barcode?.includes(q)
    return matchCat && matchSearch
  })

  // ── Cart helpers ────────────────────────────────────────────────────────────
  function loadOrderIntoCart(billEntry) {
    const items = billEntry.items.map(i => ({
      id: i.id || `loaded-${i.name}`,
      name_en: i.name || i.name_en,
      emoji: i.emoji || '🍽️',
      price: i.price,
      qty: i.qty,
      extraNote: '',
    }))
    setCart(items)
    setLoadedOrderId(billEntry.orderId)
    clearBillRequest(billEntry.orderId)
  }

  function addToCart(item) {
    setBarcodeFlash(item.id)
    setTimeout(() => setBarcodeFlash(null), 500)
    setCart(p => {
      const ex = p.find(i => i.id === item.id)
      if (ex) return p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { ...item, qty: 1 }]
    })
  }

  function changeQty(id, delta) {
    setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  function removeFromCart(id) {
    setCart(p => p.filter(i => i.id !== id))
  }

  function setExtraNote(id, note) {
    setCart(p => p.map(i => i.id === id ? { ...i, extraNote: note } : i))
  }

  // ── Barcode scanner ─────────────────────────────────────────────────────────
  // Barcode scanners act as keyboard — they type fast and press Enter
  function handleBarcodeKey(e) {
    if (e.key === 'Enter') {
      const val = barcodeInput.trim()
      const found = menuItems.find(m => m.barcode === val || m.code === val || m.id === val)
      if (found) {
        addToCart(found)
        setBarcodeInput('')
        setSearch('')
        setActiveCat('all')
      } else {
        // Fall through to search
        setSearch(val)
        setBarcodeInput('')
      }
    }
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((a, i) => {
    const disc = Number(i.discount_pct || 0) / 100
    return a + (i.price * (1 - disc)) * i.qty
  }, 0)
  const totalSavings = cart.reduce((a, i) => {
    const disc = Number(i.discount_pct || 0) / 100
    return a + (i.price * disc) * i.qty
  }, 0)
  const vat = subtotal * vatRate
  const total = subtotal + vat

  // ── Confirm payment ─────────────────────────────────────────────────────────
  function confirmPayment() {
    if (!payMethod || cart.length === 0) return
    setReceipt({
      items: cart,
      subtotal, vat, total, totalSavings, payMethod, cashGiven,
      change: cashGiven > 0 ? Math.max(0, cashGiven - total) : 0,
      date: new Date(),
      order_number: Math.floor(Math.random() * 900) + 100,
    })
  }

  // ── Receipt view ─────────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div className="max-w-sm mx-auto">
        <Card>
          <div className="text-center pb-4 border-b-2 border-dashed border-gray-200 dark:border-gray-600 mb-4">
            <div className="text-base font-bold text-gray-900 dark:text-white">{company.name}</div>
            <div className="text-xs text-gray-400">{company.address}</div>
            <div className="text-xs text-gray-400 mt-1">
              {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <Badge color="green" dot>Paid</Badge>
              <Badge color="indigo">#{receipt.order_number}</Badge>
            </div>
          </div>
          {receipt.items.map((item, i) => {
            const disc = Number(item.discount_pct||0)
            const lineTotal = item.price * (1 - disc/100) * item.qty
            return (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-gray-700 dark:text-gray-300">{item.emoji} {item.name_en} ×{item.qty}</div>
                {disc > 0 && <div className="text-xs text-rose-400">-{disc}% discount</div>}
              </div>
              <span className="font-medium text-gray-800 dark:text-gray-200">€{lineTotal.toFixed(2)}</span>
            </div>
            )
          })}
          <Divider />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>€{receipt.subtotal.toFixed(2)}</span></div>
            {receipt.totalSavings > 0 && <div className="flex justify-between text-rose-500 font-semibold"><span>Discounts saved</span><span>-€{receipt.totalSavings.toFixed(2)}</span></div>}
            <div className="flex justify-between text-gray-500"><span>VAT {company.vat_rate}%</span><span>€{receipt.vat.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t-2 border-gray-200 dark:border-gray-600">
              <span>Total</span><span>€{receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 capitalize"><span>Payment</span><span>{receipt.payMethod}</span></div>
            {receipt.change > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Change</span><span>€{receipt.change.toFixed(2)}</span>
              </div>
            )}
          </div>
          {/* Barcode */}
          <div className="flex flex-col items-center mt-5 mb-3">
            <div className="text-2xl tracking-widest font-mono text-gray-700 dark:text-gray-300">▌▌▐▌▌▐▌▐▌▌▐</div>
            <div className="text-xs text-gray-400 mt-1 font-mono">#{receipt.order_number}</div>
          </div>
          <div className="text-center text-xs text-gray-400 mb-5 italic">{company.receipt_footer}</div>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="primary" onClick={() => alert('Sending to printer...')}>🖨 Print</Btn>
            <Btn onClick={() => alert('Share via email/WhatsApp...')}>📤 Share</Btn>
          </div>
          <Btn variant="success" fullWidth className="mt-2" onClick={() => {
            setReceipt(null); setCart([]); setPayMethod(null); setCashGiven(0); setLoadedOrderId(null)
          }}>
            New Sale
          </Btn>
        </Card>
      </div>
    )
  }

  // ── Main POS layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* ── Bill request notifications ── */}
      {billQueue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {billQueue.map(b => (
            <div key={b.orderId} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-2.5">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">🧾 {b.tableLabel}</span>
              <span className="text-xs text-amber-700 dark:text-amber-300">Waiter: {b.waiter}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">€{b.total.toFixed(2)}</span>
              <Btn size="sm" variant="warning" onClick={() => loadOrderIntoCart(b)}>Load & Bill</Btn>
              <button onClick={() => clearBillRequest(b.orderId)} className="text-amber-400 hover:text-amber-600 text-xs ml-1">✕</button>
            </div>
          ))}
        </div>
      )}

    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-160px)] min-h-0">

      {/* ── LEFT: Product browser ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-3 min-h-0">

        {/* Search + Barcode row */}
        <div className="flex gap-2">
          {/* Text / code search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code (M001, S002…)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          {/* Barcode scanner input */}
          <div className="relative w-40 sm:w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">📷</span>
            <input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKey}
              placeholder="Scan barcode…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
          >
            🍴 All Items ({menuItems.filter(m => m.available).length})
          </button>
          {menuCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
            >
              {cat.icon} {cat.name_en} ({menuItems.filter(m => m.category_id === cat.id && m.available).length})
            </button>
          ))}
        </div>

        {/* Product grid — professional text tiles */}
        <div className="flex-1 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-sm font-medium">No items found</div>
              <div className="text-xs mt-1">Try a different search or category</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-2">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 cursor-pointer
                    ${barcodeFlash === item.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-2xl leading-none">{item.emoji}</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">€{item.price.toFixed(2)}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{item.code}</div>
                  {cart.find(c => c.id === item.id) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {cart.find(c => c.id === item.id).qty}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart + Payment ── */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3">

        {/* Cart */}
        <Card className="flex-1 flex flex-col min-h-0 !p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Cart</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:text-rose-600 font-semibold">Clear all</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600 py-8">
                <div className="text-4xl mb-2">🛒</div>
                <div className="text-sm">Cart is empty</div>
                <div className="text-xs mt-1 text-center">Tap a product or scan a barcode</div>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="py-2 px-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name_en}</div>
                    <div className="text-xs text-indigo-600 font-bold">€{item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30">−</button>
                    <span className="text-xs font-bold w-4 text-center text-gray-800 dark:text-gray-200">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-sm flex items-center justify-center hover:bg-indigo-200">+</button>
                  </div>
                  <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 w-12 text-right">€{(item.price*(1-Number(item.discount_pct||0)/100)*item.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-rose-500 text-xs ml-0.5">✕</button>
                </div>
                <input
                  value={item.extraNote || ''}
                  onChange={e => setExtraNote(item.id, e.target.value)}
                  placeholder="Extra request (e.g. extra cheese)"
                  className="mt-1 w-full text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            ))}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <>
              <Divider />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
                {totalSavings > 0 && <div className="flex justify-between text-rose-500 font-semibold"><span>Discounts</span><span>-€{totalSavings.toFixed(2)}</span></div>}
                <div className="flex justify-between text-gray-400"><span>VAT {company.vat_rate}%</span><span>€{vat.toFixed(2)}</span></div>
                <div className="flex justify-between font-extrabold text-lg text-gray-900 dark:text-white pt-1 border-t-2 border-indigo-100 dark:border-indigo-900/40">
                  <span>Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Payment */}
        <Card className="!p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['💵', 'Cash', 'cash'], ['💳', 'Card', 'card'], ['📱', 'Mobile', 'mobile']].map(([icon, label, val]) => (
              <button
                key={val}
                onClick={() => setPayMethod(val)}
                className={`py-3 rounded-xl border-2 text-center transition-all ${
                  payMethod === val
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl">{icon}</div>
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{label}</div>
              </button>
            ))}
          </div>

          {/* Cash denomination quick-buttons */}
          {payMethod === 'cash' && (
            <div className="mb-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cash tendered</div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[5, 10, 20, 50, 100, 200].map(a => (
                  <button
                    key={a}
                    onClick={() => setCashGiven(a)}
                    className={`py-1.5 rounded-lg text-sm font-bold border transition-all ${cashGiven === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    €{a}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Change</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  €{Math.max(0, cashGiven - total).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Btn
            variant="success"
            fullWidth
            size="lg"
            disabled={!payMethod || cart.length === 0}
            onClick={confirmPayment}
            className="text-base"
          >
            ✅ Confirm & Print Receipt
          </Btn>
        </Card>
      </div>
    </div>
    </div>
  )
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export function Inventory() {
  const { inventoryItems, setInventoryItems } = useApp()
  const BLANK = { id:'', item_name:'', quantity:'', unit:'kg', min_stock:'', category:'', supplier:'' }
  const [modal, setModal]   = useState(null)   // null | { mode:'add'|'edit' }
  const [form, setForm]     = useState(BLANK)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [adjustId, setAdjustId] = useState(null)  // item being adjusted
  const [adjustDelta, setAdjustDelta] = useState('')
  const [search, setSearch] = useState('')

  const visible = inventoryItems.filter(i => !search || i.item_name.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setForm({ ...BLANK, id: `inv${Date.now()}` }); setModal({ mode:'add' }) }
  function openEdit(item) { setForm({ ...item }); setModal({ mode:'edit' }) }
  function closeModal() { setModal(null) }

  function saveItem() {
    if (!form.item_name.trim()) return
    const item = { ...form, quantity: parseFloat(form.quantity)||0, min_stock: parseFloat(form.min_stock)||0 }
    if (modal.mode === 'add') {
      setInventoryItems(p => [...p, item])
    } else {
      setInventoryItems(p => p.map(i => i.id === item.id ? item : i))
    }
    closeModal()
  }

  function deleteItem(id) {
    setInventoryItems(p => p.filter(i => i.id !== id))
    setConfirmDelete(null)
  }

  function applyAdjust(id) {
    const delta = parseFloat(adjustDelta)
    if (isNaN(delta)) return
    setInventoryItems(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
    setAdjustId(null)
    setAdjustDelta('')
  }

  const lowCount = inventoryItems.filter(i => i.quantity < i.min_stock).length

  return (
    <div>
      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete stock item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.item_name}" will be removed from inventory.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => deleteItem(confirmDelete.id)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modal.mode === 'add' ? 'Add Stock Item' : 'Edit Stock Item'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Input label="Item Name" value={form.item_name} onChange={e => setForm(f=>({...f,item_name:e.target.value}))} placeholder="e.g. Olive Oil" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Current Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} placeholder="0" />
                <Input label="Unit" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} placeholder="kg / L / pcs" />
                <Input label="Min Stock Level" type="number" min="0" step="0.01" value={form.min_stock} onChange={e => setForm(f=>({...f,min_stock:e.target.value}))} placeholder="Reorder at this level" />
                <Input label="Category" value={form.category||''} onChange={e => setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. Dairy, Meat, Produce" />
              </div>
              <Input label="Supplier (optional)" value={form.supplier||''} onChange={e => setForm(f=>({...f,supplier:e.target.value}))} placeholder="Supplier name" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={closeModal}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={saveItem} disabled={!form.item_name.trim()}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {lowCount > 0 && (
            <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
              ⚠ {lowCount} item{lowCount!==1?'s':''} low on stock
            </span>
          )}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
        </div>
        <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Item</Btn>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Unit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Min Stock</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Level</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(item => {
              const pct = item.min_stock > 0 ? Math.min(100, Math.round((item.quantity / item.min_stock) * 100)) : 100
              const barColor = pct < 50 ? 'bg-red-500' : pct < 100 ? 'bg-amber-400' : 'bg-emerald-500'
              const statusColor = pct < 50 ? 'red' : pct < 100 ? 'yellow' : 'green'
              return (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.item_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    {adjustId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="0.01"
                          value={adjustDelta}
                          onChange={e => setAdjustDelta(e.target.value)}
                          placeholder="±qty"
                          autoFocus
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-indigo-400 focus:outline-none text-gray-900 dark:text-white dark:bg-gray-700"
                        />
                        <button onClick={() => applyAdjust(item.id)} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold">✓</button>
                        <button onClick={() => { setAdjustId(null); setAdjustDelta('') }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    ) : (
                      <span
                        className={`font-bold cursor-pointer hover:underline ${item.quantity < item.min_stock ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}
                        onClick={() => { setAdjustId(item.id); setAdjustDelta('') }}
                        title="Click to adjust quantity"
                      >
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.unit}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.min_stock}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                      <div className={`h-full rounded-full ${barColor}`} style={{width:`${pct}%`}} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{pct}%</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor}>{pct<50?'Low':pct<100?'OK':'Good'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Btn size="sm" onClick={() => openEdit(item)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(item)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No stock items found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function Reports() {
  const bars = [65,80,45,90,70,110,85,95,60,100,75,88,92,78]
  const maxBar = Math.max(...bars)
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="This month" value="€48,200" sub="+8% vs last month" />
        <StatCard label="Total orders" value="1,284" sub="avg €37.50 each" />
        <StatCard label="Top seller" value="Pasta Carbonara" sub="312 sold" />
        <StatCard label="Staff active" value="14" sub="All shifts covered" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Daily sales — April</h2>
          <div className="flex items-end gap-1 h-28">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-w-0"
                style={{ height: `${(h / maxBar) * 100}%` }} title={`Apr ${i+1}: €${(h*40).toFixed(0)}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">Apr 1</span>
            <span className="text-xs text-gray-400">Apr 14</span>
          </div>
        </Card>
        <Card>
          <h2 className="font-medium text-gray-900 dark:text-white mb-3">Top items this month</h2>
          {[['Pasta Carbonara',312,'€4,524'],['Grilled Sea Bass',198,'€4,356'],['Margherita Pizza',245,'€2,940'],['Tiramisu',289,'€2,023'],['House Wine',401,'€2,406']].map(([name,count,rev]) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{count}x</span>
                <span className="text-sm font-medium text-blue-600">{rev}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function Settings() {
  const { company, setCompany, lang } = useApp()
  const [form, setForm] = useState({ ...company })
  function save() { setCompany(form); alert(t('settingsSaved', lang)) }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-4">Company details</h2>
        <Input label="Company name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
        <Input label="Address" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
        <Select label="Currency" value={form.currency} onChange={e => setForm(p=>({...p,currency:e.target.value}))}>
          <option value="EUR">EUR — Euro</option>
          <option value="USD">USD — US Dollar</option>
          <option value="GBP">GBP — British Pound</option>
        </Select>
        <Input label="VAT rate (%)" type="number" value={form.vat_rate} onChange={e => setForm(p=>({...p,vat_rate:Number(e.target.value)}))} />
        <Textarea label="Receipt footer" value={form.receipt_footer} onChange={e => setForm(p=>({...p,receipt_footer:e.target.value}))} />
        <Btn variant="success" onClick={save}>Save Changes</Btn>
      </Card>
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-4">System info</h2>
        <div className="space-y-2 text-sm">
          {[['System','Malta POS v1.0'],['Languages','English, Maltese, Italian'],['Database','Supabase (PostgreSQL)'],['VAT Region','Malta — 18%'],['Currency','EUR — Euro']].map(([k,v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">{k}</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Company (Super Admin) ────────────────────────────────────────────────────
export function Company() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">All restaurants</h2>
        <Btn variant="primary" size="sm">+ Add Restaurant</Btn>
      </div>
      <Table headers={['Name','Location','Admin','Status','Action']}>
        {[['Bella Vista Malta','Valletta','admin@bellavista.mt','active'],['Sea View Bistro','Sliema','admin@seaview.mt','active'],['Gozo Kitchen','Victoria','admin@gozo.mt','pending']].map(([name,loc,admin,status]) => (
          <TR key={name}>
            <TD className="font-medium">{name}</TD>
            <TD>{loc}</TD>
            <TD className="text-blue-600">{admin}</TD>
            <TD><Badge color={statusColor(status)}>{status}</Badge></TD>
            <TD><Btn size="sm">Manage</Btn></TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export function Audit() {
  const logs = [
    {time:'14:32',user:'Maria G.',role:'waiter',action:'Created order #047',module:'Orders'},
    {time:'14:28',user:'John C.',role:'cashier',action:'Printed invoice #312',module:'Billing'},
    {time:'14:15',user:'Anna B.',role:'manager',action:'Created user account',module:'Users'},
    {time:'13:55',user:'Tony S.',role:'supplier',action:'Updated stock levels',module:'Inventory'},
    {time:'13:40',user:'Owner',role:'owner',action:'Approved 2 users',module:'Users'},
    {time:'13:20',user:'Sam V.',role:'supervisor',action:'Generated shift report',module:'Reports'},
  ]
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Audit log</h2>
        <input placeholder="Search logs..." className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40" />
      </div>
      <Table headers={['Time','User','Role','Action','Module']}>
        {logs.map((log,i) => (
          <TR key={i}>
            <TD>{log.time}</TD>
            <TD>{log.user}</TD>
            <TD><Badge color="gray">{log.role}</Badge></TD>
            <TD>{log.action}</TD>
            <TD>{log.module}</TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function Notifications() {
  const { notifications, markAllRead } = useApp()
  const typeColor = { warning:'yellow', error:'red', info:'blue', success:'green' }
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Notifications</h2>
        <Btn size="sm" onClick={markAllRead}>Mark all read</Btn>
      </div>
      {notifications.map(n => (
        <div key={n.id} className={`flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${!n.is_read ? '' : 'opacity-60'}`}>
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : typeColor[n.type]==='yellow'?'bg-amber-400':typeColor[n.type]==='red'?'bg-red-500':'bg-blue-500'}`} />
          <div className="flex-1">
            <div className="text-sm text-gray-800 dark:text-gray-200">{n.message_en}</div>
            <div className="text-xs text-gray-400 mt-1">{n.module}</div>
          </div>
        </div>
      ))}
    </Card>
  )
}

// ─── Supervisor ───────────────────────────────────────────────────────────────
export function Supervisor() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Staff on duty" value="8" sub="All present" />
        <StatCard label="Orders today" value="47" sub="8 active" />
        <StatCard label="Avg order time" value="18m" sub="Target: 20m" />
        <StatCard label="Issues flagged" value="1" sub="Late order T5" subColor="text-amber-500" />
      </div>
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-3">Staff performance today</h2>
        <Table headers={['Name','Role','Orders','Avg time','Status']}>
          {[['Maria Galea','Waiter',12,'16m','on-duty'],['John Camilleri','Cashier',18,'4m','on-duty'],['Tony Farrugia','Cook',31,'14m','on-duty'],['Sam Vella','Waiter',9,'19m','break']].map(([n,r,o,time,s]) => (
            <TR key={n}>
              <TD><div className="flex items-center gap-2"><Avatar name={n} />{n}</div></TD>
              <TD>{r}</TD><TD>{o}</TD><TD>{time}</TD>
              <TD><Badge color={statusColor(s)}>{s}</Badge></TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  )
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
export function Shifts() {
  const { clockRecords, user, clockIn, clockOut, isClockedIn } = useApp()
  const [tab, setTab] = useState('today') // 'today' | 'history'
  const [now, setNow] = useState(new Date())

  // Live clock update every minute
  useState(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  })

  const todayStr = now.toDateString()

  // Today's records
  const todayRecords = clockRecords.filter(r => r.clockIn.toDateString() === todayStr)
  // All past records (clocked out)
  const historyRecords = [...clockRecords].sort((a, b) => b.clockIn - a.clockIn)

  function fmtTime(date) {
    if (!date) return '—'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDuration(clockIn, clockOut) {
    const end = clockOut || now
    const mins = Math.round((end - clockIn) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  }

  function fmtDate(date) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const activeNow = todayRecords.filter(r => r.clockOut === null)
  const doneToday = todayRecords.filter(r => r.clockOut !== null)

  return (
    <div>
      {/* My status card */}
      <div className={`flex items-center justify-between rounded-2xl px-5 py-4 mb-4 border-2 ${isClockedIn ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isClockedIn ? 'bg-emerald-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
            {isClockedIn ? '🟢' : '⚫'}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">{user?.full_name}</div>
            {isClockedIn ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Clocked in · {fmtTime(clockRecords.find(r => r.userId === user?.id && r.clockOut === null)?.clockIn)} ·&nbsp;
                <span className="font-semibold">
                  {fmtDuration(clockRecords.find(r => r.userId === user?.id && r.clockOut === null)?.clockIn, null)}
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Not clocked in today</div>
            )}
          </div>
        </div>
        <button
          onClick={isClockedIn ? clockOut : clockIn}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            isClockedIn
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
          }`}
        >
          {isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[['today', `Today (${todayRecords.length})`], ['history', 'Full History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${tab === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="space-y-4">
          {/* Currently clocked in */}
          {activeNow.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Currently On Shift</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60">
                    {['Staff','Role','Clocked In','Duration'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeNow.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{r.userName}</td>
                      <td className="px-4 py-3"><Badge color="indigo">{r.role}</Badge></td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{fmtTime(r.clockIn)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{fmtDuration(r.clockIn, null)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Finished today */}
          {doneToday.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed Today</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60">
                    {['Staff','Role','In','Out','Total Hours'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doneToday.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{r.userName}</td>
                      <td className="px-4 py-3"><Badge color="gray">{r.role}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockIn)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockOut)}</td>
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{fmtDuration(r.clockIn, r.clockOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {todayRecords.length === 0 && (
            <Card><div className="text-center py-8 text-gray-400">No clock-in records for today yet.</div></Card>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {['Date','Staff','Role','Clock In','Clock Out','Total Hours','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyRecords.map(r => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{fmtDate(r.clockIn)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{r.userName}</td>
                  <td className="px-4 py-3"><Badge color="gray">{r.role}</Badge></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockIn)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.clockOut ? fmtTime(r.clockOut) : <span className="text-emerald-500 font-semibold">Active</span>}</td>
                  <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{fmtDuration(r.clockIn, r.clockOut)}</td>
                  <td className="px-4 py-3">
                    {r.clockOut
                      ? <Badge color="green">Completed</Badge>
                      : <Badge color="emerald" dot>On Shift</Badge>}
                  </td>
                </tr>
              ))}
              {historyRecords.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No shift history yet</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
export function Receipts() {
  return (
    <Card>
      <h2 className="font-medium text-gray-900 dark:text-white mb-4">Receipt history</h2>
      <Table headers={['Receipt #','Table','Type','Total','Payment','Time','Action']}>
        {SAMPLE_INVOICES.map(inv => (
          <TR key={inv.id}>
            <TD className="font-medium text-blue-600">RCP-{inv.invoice_number}</TD>
            <TD>{inv.table}</TD>
            <TD><Badge color={inv.type==='takeaway'?'orange':'blue'}>{inv.type==='takeaway'?'Takeaway':'Dine-in'}</Badge></TD>
            <TD className="font-medium">€{inv.total.toFixed(2)}</TD>
            <TD>{inv.payment_method}</TD>
            <TD>{inv.created_at}</TD>
            <TD><Btn size="sm" onClick={() => alert('Reprinting...')}>Reprint</Btn></TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Supplier Invoices ────────────────────────────────────────────────────────
export function Invoices() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Supplier invoices</h2>
        <Btn variant="primary" size="sm">+ Submit Invoice</Btn>
      </div>
      <Table headers={['Invoice #','Supplier','Items','Total','Status','Date']}>
        {SUPPLIER_INVOICES.map(inv => (
          <TR key={inv.id}>
            <TD className="font-medium text-blue-600">{inv.invoice_ref}</TD>
            <TD>{inv.supplier}</TD>
            <TD className="text-gray-500 text-xs">{inv.items}</TD>
            <TD className="font-medium">€{inv.total.toFixed(2)}</TD>
            <TD><Badge color={statusColor(inv.status)}>{inv.status}</Badge></TD>
            <TD>{inv.date}</TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Menu Management ──────────────────────────────────────────────────────────
export function MenuManagement() {
  const { menuItems, setMenuItems, menuCategories } = useApp()

  const BLANK_ITEM = { id:'', code:'', barcode:'', category_id: menuCategories[0]?.id || '', name_en:'', price:'', cost_price:'', tax_rate:'18', discount_pct:'0', image_url:'', description_en:'', available:true, emoji:'🍽️', dietary_tags:[], modifierGroups:[] }
  const DIETARY_OPTIONS = ['Vegan','Vegetarian','Vegan Option','Halal','Gluten-Free','Dairy-Free','Contains Nuts','Spicy']
  const [modal, setModal]   = useState(null)   // null | { mode:'add'|'edit', item }
  const [form, setForm]     = useState(BLANK_ITEM)
  const [modInput, setModInput] = useState({ label:'', multi:false, choices:'' })
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Search + filter ────────────────────────────────────────────────────────
  const visible = menuItems.filter(i => {
    const matchCat = filterCat === 'all' || i.category_id === filterCat
    const q = search.toLowerCase()
    const matchSearch = !q || i.name_en.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function openAdd() {
    setForm({ ...BLANK_ITEM, id: `m${Date.now()}`, code: `C${menuItems.length + 1}`.padStart(4,'0') })
    setModal({ mode:'add' })
  }
  function openEdit(item) {
    setForm({ ...item })
    setModal({ mode:'edit' })
  }
  function closeModal() { setModal(null) }

  function saveItem() {
    if (!form.name_en.trim() || !form.price) return
    const item = { ...form, price: parseFloat(form.price) }
    if (modal.mode === 'add') {
      setMenuItems(p => [...p, item])
    } else {
      setMenuItems(p => p.map(i => i.id === item.id ? item : i))
    }
    closeModal()
  }

  function deleteItem(id) {
    setMenuItems(p => p.filter(i => i.id !== id))
    setConfirmDelete(null)
  }

  function toggleAvailable(id) {
    setMenuItems(p => p.map(i => i.id === id ? { ...i, available: !i.available } : i))
  }

  // ── Modifier group helpers ─────────────────────────────────────────────────
  function addModGroup() {
    if (!modInput.label.trim() || !modInput.choices.trim()) return
    const choices = modInput.choices.split(',').map(c => c.trim()).filter(Boolean)
    setForm(f => ({ ...f, modifierGroups: [...(f.modifierGroups || []), { label: modInput.label, multi: modInput.multi, choices }] }))
    setModInput({ label:'', multi:false, choices:'' })
  }
  function removeModGroup(idx) {
    setForm(f => ({ ...f, modifierGroups: f.modifierGroups.filter((_,i) => i !== idx) }))
  }

  return (
    <div>
      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.name_en}" will be permanently removed from the menu.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => deleteItem(confirmDelete.id)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modal.mode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Item Name" value={form.name_en} onChange={e => setForm(f=>({...f,name_en:e.target.value}))} placeholder="e.g. Grilled Sea Bass" />
                <Input label="Selling Price (€)" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="0.00" />
                <Input label="Cost Price (€)" type="number" step="0.01" min="0" value={form.cost_price||''} onChange={e => setForm(f=>({...f,cost_price:e.target.value}))} placeholder="Your cost" />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Profit Margin</label>
                  <div className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/30 text-emerald-600 dark:text-emerald-400 font-bold">
                    {form.price && form.cost_price && parseFloat(form.cost_price) > 0
                      ? `${Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100)}%`
                      : '— %'}
                  </div>
                </div>
                <Input label="Discount (%)" type="number" step="1" min="0" max="100" value={form.discount_pct||'0'} onChange={e => setForm(f=>({...f,discount_pct:e.target.value}))} placeholder="0" />
                <Input label="Tax / VAT Rate (%)" type="number" step="1" min="0" value={form.tax_rate||'18'} onChange={e => setForm(f=>({...f,tax_rate:e.target.value}))} placeholder="18" />
                <Input label="Item Code" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="M001" />
                <Input label="Barcode" value={form.barcode} onChange={e => setForm(f=>({...f,barcode:e.target.value}))} placeholder="5990000001" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Category" value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}>
                  {menuCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_en}</option>)}
                </Select>
                <Input label="Emoji" value={form.emoji} onChange={e => setForm(f=>({...f,emoji:e.target.value}))} placeholder="🍽️" />
              </div>
              <Input label="Image URL (optional)" value={form.image_url||''} onChange={e => setForm(f=>({...f,image_url:e.target.value}))} placeholder="https://... (leave blank for emoji tile)" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
                <input value={form.description_en} onChange={e => setForm(f=>({...f,description_en:e.target.value}))} placeholder="Short description shown to waiter & cashier" className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {/* Dietary tags */}
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Dietary Tags</div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => {
                    const active = (form.dietary_tags||[]).includes(tag)
                    return (
                      <button key={tag} type="button"
                        onClick={() => setForm(f => ({ ...f, dietary_tags: active ? (f.dietary_tags||[]).filter(t=>t!==tag) : [...(f.dietary_tags||[]), tag] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400'}`}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Available on menu</label>
                <button onClick={() => setForm(f=>({...f,available:!f.available}))} className={`relative w-11 h-6 rounded-full transition-colors ${form.available ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.available ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">{form.available ? 'Visible to staff' : 'Hidden from menu'}</span>
              </div>

              {/* Modifier groups */}
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Modifier / Option Groups</div>
                {(form.modifierGroups || []).map((g, i) => (
                  <div key={i} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{g.label} <span className="font-normal text-gray-400">({g.multi ? 'multi' : 'single'})</span></div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{g.choices.join(' · ')}</div>
                    </div>
                    <button onClick={() => removeModGroup(i)} className="text-rose-400 hover:text-rose-600 text-xs ml-2 flex-shrink-0">Remove</button>
                  </div>
                ))}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={modInput.label} onChange={e => setModInput(p=>({...p,label:e.target.value}))} placeholder="Group name (e.g. Cooking level)" className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <input value={modInput.choices} onChange={e => setModInput(p=>({...p,choices:e.target.value}))} placeholder="Choices comma-separated (Rare, Medium...)" className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={modInput.multi} onChange={e => setModInput(p=>({...p,multi:e.target.checked}))} className="rounded" />
                      Allow multiple selections
                    </label>
                    <Btn size="sm" variant="primary" onClick={addModGroup}>+ Add Group</Btn>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={closeModal}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={saveItem} disabled={!form.name_en.trim() || !form.price}>
                {modal.mode === 'add' ? 'Add to Menu' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat==='all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>All ({menuItems.length})</button>
          {menuCategories.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat===c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
              {c.icon} {c.name_en} ({menuItems.filter(i=>i.category_id===c.id).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
          <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Item</Btn>
        </div>
      </div>

      {/* ── Table ── */}
      <Card padding={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tags &amp; Mods</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(item => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{item.name_en}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{item.description_en}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{menuCategories.find(c=>c.id===item.category_id)?.name_en || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">€{Number(item.price).toFixed(2)}</span>
                    {Number(item.discount_pct) > 0 && <span className="ml-1 text-xs text-rose-500 font-semibold">-{item.discount_pct}%</span>}
                    {item.cost_price && <div className="text-xs text-emerald-500 font-medium">{Math.round(((Number(item.price)-Number(item.cost_price))/Number(item.price))*100)}% margin</div>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{item.code}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(item.dietary_tags||[]).map(t => <span key={t} className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">{t}</span>)}
                    {(item.modifierGroups||[]).length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs">{item.modifierGroups.length} mod(s)</span>}
                    {!(item.dietary_tags||[]).length && !(item.modifierGroups||[]).length && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAvailable(item.id)} className={`relative w-10 h-5 rounded-full transition-colors ${item.available ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.available ? 'translate-x-5' : ''}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Btn size="sm" onClick={() => openEdit(item)}>Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(item)}>Delete</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No items found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
