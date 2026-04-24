// ─── Dashboard ───────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useApp, ROLES } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Card, StatCard, Badge, Table, TR, TD, Btn, Avatar, Divider, SectionLabel, statusColor, Input, Select, Textarea } from '../components/UI'
import { SAMPLE_USERS, SAMPLE_ORDERS, INVENTORY_ITEMS, TABLES, MENU_CATEGORIES, MENU_ITEMS, SAMPLE_INVOICES, SUPPLIER_INVOICES } from '../lib/mockData'
import { AlertTriangle } from 'lucide-react'

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

// ─── Waiters ──────────────────────────────────────────────────────────────────
export function Waiters() {
  const { user: currentUser, users, createUser, updateUser, deleteUser, approveUser, deactivateUser } = useApp()

  const waiters = users.filter(u => u.role === 'waiter')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', password: '', pin: '' })
  const [usernameError, setUsernameError] = useState('')
  const [editModal, setEditModal] = useState(null)   // { user } | null
  const [editForm, setEditForm] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  function handleCreate() {
    if (!form.full_name.trim() || !form.username.trim() || !form.password.trim()) return
    if (users.find(u => u.username === form.username.trim())) {
      setUsernameError('Username already taken')
      return
    }
    setUsernameError('')
    createUser({ full_name: form.full_name.trim(), username: form.username.trim().toLowerCase(), password: form.password, pin: form.pin.trim(), role: 'waiter' }, currentUser)
    setShowForm(false)
    setForm({ full_name: '', username: '', password: '', pin: '' })
  }

  function openEdit(u) {
    setEditForm({ full_name: u.full_name, pin: u.pin || '' })
    setEditModal(u)
  }

  function handleSave() {
    if (!editForm.full_name.trim()) return
    updateUser(editModal.id, { full_name: editForm.full_name.trim(), pin: editForm.pin.trim() })
    setEditModal(null)
  }

  function handleDelete(u) {
    deleteUser(u.id)
    setConfirmDelete(null)
  }

  const canManage = ['superadmin', 'admin', 'owner', 'manager'].includes(currentUser?.role)

  return (
    <div>
      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove waiter?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>{confirmDelete.full_name}</strong> will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => handleDelete(confirmDelete)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Edit Waiter</h2>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Input label="Full Name" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Maria Galea" />
              <Input label="PIN (4 digits)" value={editForm.pin} onChange={e => setEditForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="Optional 4-digit PIN" maxLength={4} />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={() => setEditModal(null)}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={handleSave} disabled={!editForm.full_name.trim()}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">Waiters</h2>
            <p className="text-xs text-gray-400 mt-0.5">{waiters.length} waiter{waiters.length !== 1 ? 's' : ''} registered</p>
          </div>
          {canManage && (
            <Btn variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setUsernameError('') }}>
              {showForm ? 'Cancel' : '+ Add Waiter'}
            </Btn>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">New waiter account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Maria Galea" />
              <div>
                <Input label="Username" value={form.username} onChange={e => { setForm(p => ({ ...p, username: e.target.value })); setUsernameError('') }} placeholder="mgalea" />
                {usernameError && <p className="text-xs text-rose-500 mt-1">{usernameError}</p>}
              </div>
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Temp@1234" />
              <Input label="PIN (4 digits, optional)" value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="e.g. 1234" maxLength={4} />
            </div>
            <div className="flex gap-2">
              <Btn variant="success" onClick={handleCreate} disabled={!form.full_name.trim() || !form.username.trim() || !form.password.trim()}>
                Create Waiter
              </Btn>
              <Btn onClick={() => { setShowForm(false); setUsernameError('') }}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Waiters table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">PIN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waiters.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No waiters yet — add one above</td></tr>
              )}
              {waiters.map(u => (
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
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.pin ? (
                      <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
                        {'•'.repeat(u.pin.length)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.status === 'active' ? 'green' : u.status === 'pending' ? 'yellow' : 'red'}>
                      {u.status === 'active' ? '✓ Active' : u.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canManage && (
                        <Btn size="sm" onClick={() => openEdit(u)}>Edit</Btn>
                      )}
                      {u.status === 'active' && canManage && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="warning" onClick={() => deactivateUser(u.id)}>Deactivate</Btn>
                      )}
                      {u.status === 'inactive' && canManage && (
                        <Btn size="sm" variant="primary" onClick={() => approveUser(u.id)}>Reactivate</Btn>
                      )}
                      {canManage && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(u)}>Delete</Btn>
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
  const { liveOrders, setLiveOrders, users } = useApp()
  const [tables, setTables] = useState(TABLES)
  const [assignModal, setAssignModal] = useState(null)  // table object
  const [guestModal, setGuestModal] = useState(null)    // { table, mode: 'open'|'edit' }
  const [guestAdults, setGuestAdults] = useState(1)
  const [guestChildren, setGuestChildren] = useState(0)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  function elapsed(ts) {
    if (!ts) return null
    const mins = Math.floor((now - ts) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const activeWaiters = users.filter(u => u.role === 'waiter' && u.status === 'active')

  // Get the active order for a table (non-paid)
  function tableOrder(tableId) {
    return liveOrders.find(o => o.table_id === tableId && !['paid'].includes(o.status))
  }

  function openEditGuests(table) {
    const order = tableOrder(table.id)
    setGuestAdults(order?.guests?.adults ?? 1)
    setGuestChildren(order?.guests?.children ?? 0)
    setGuestModal({ table, mode: 'edit' })
  }

  function selectTable(table) {
    if (table.status === 'free') {
      setGuestAdults(1)
      setGuestChildren(0)
      setGuestModal({ table, mode: 'open' })
    } else {
      const existingOrder = liveOrders.find(o => o.table_id === table.id)
      if (existingOrder) {
        setOrderContext({ tableId: table.id, tableNumber: table.number, isTakeaway: false, existingOrder })
        navTo('orders')
      }
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Assign waiter modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Table {assignModal.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Assign Waiter</div>
              </div>
              <button onClick={() => setAssignModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {activeWaiters.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No active waiters. Add waiters in the Waiters page.</p>
              ) : (
                <div className="space-y-2">
                  {activeWaiters.map(w => {
                    const order = tableOrder(assignModal.id)
                    const isAssigned = order?.waiter === w.full_name
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setTables(p => p.map(t => t.id === assignModal.id ? { ...t, assignedWaiter: w.full_name } : t))
                          setAssignModal(null)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                          isAssigned
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {w.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{w.full_name}</div>
                          <div className="text-xs text-gray-400 font-mono">@{w.username}</div>
                        </div>
                        {isAssigned && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={() => {
                  setTables(p => p.map(t => t.id === assignModal.id ? { ...t, assignedWaiter: null } : t))
                  setAssignModal(null)
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest count modal — open table or edit guests */}
      {guestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setGuestModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Table {guestModal.table.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">{guestModal.mode === 'edit' ? 'Update Guests' : 'Guest Count'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">{guestAdults + guestChildren}</div>
                  <div className="text-xs text-gray-400 mt-0.5">total</div>
                </div>
                <button onClick={() => setGuestModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-5">

              {/* Adults row */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Adults</div>
                    <div className="text-xs text-gray-400">Age 13+</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestAdults(n => Math.max(0, n - 1))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={guestAdults === 0}
                    >−</button>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white w-7 text-center tabular-nums">{guestAdults}</span>
                    <button
                      onClick={() => setGuestAdults(n => n + 1)}
                      className="w-9 h-9 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
                    >+</button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} onClick={() => setGuestAdults(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${guestAdults === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-700" />

              {/* Children row */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Children</div>
                    <div className="text-xs text-gray-400">Under 13</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestChildren(n => Math.max(0, n - 1))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={guestChildren === 0}
                    >−</button>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white w-7 text-center tabular-nums">{guestChildren}</span>
                    <button
                      onClick={() => setGuestChildren(n => n + 1)}
                      className="w-9 h-9 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
                    >+</button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setGuestChildren(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${guestChildren === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={() => setGuestModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={guestAdults + guestChildren === 0}
                onClick={() => {
                  if (guestModal.mode === 'edit') {
                    setLiveOrders(prev => prev.map(o =>
                      o.table_id === guestModal.table.id && !['paid'].includes(o.status)
                        ? { ...o, guests: { adults: guestAdults, children: guestChildren } }
                        : o
                    ))
                    setGuestModal(null)
                  } else {
                    setOrderContext({ tableId: guestModal.table.id, tableNumber: guestModal.table.number, isTakeaway: false, existingOrder: null, guests: { adults: guestAdults, children: guestChildren } })
                    setGuestModal(null)
                    navTo('orders')
                  }
                }}
                className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {guestAdults + guestChildren === 0 ? 'Select guests' : guestModal.mode === 'edit' ? `Update — ${guestAdults + guestChildren} guest${(guestAdults + guestChildren) !== 1 ? 's' : ''}` : `Open Table — ${guestAdults + guestChildren} guest${(guestAdults + guestChildren) !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Table Layout</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tap a table to open or add to an order</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              {tables.filter(t=>t.status==='free').length} Free
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
              {tables.filter(t=>t.status==='occupied').length} Occupied
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {tables.map(table => {
            const order = tableOrder(table.id)
            const waiterName = order?.waiter || table.assignedWaiter
            const waiterInitial = waiterName ? waiterName.charAt(0).toUpperCase() : null
            const totalGuests = (order?.guests?.adults || 0) + (order?.guests?.children || 0)
            const elapsedTime = order?.created_timestamp ? elapsed(order.created_timestamp) : null
            const isOccupied = table.status === 'occupied'
            return (
              <div key={table.id} className="relative">
                <button
                  onClick={() => selectTable(table)}
                  className={`w-full h-28 rounded-2xl border-2 p-3 text-left flex flex-col justify-between transition-all active:scale-[0.97] ${
                    isOccupied
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:shadow-md'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  {/* Table number + status dot */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-extrabold leading-none tabular-nums ${isOccupied ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      T{table.number}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOccupied ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                  </div>

                  {/* Always-same-height info rows */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Time</span>
                      <span className={`text-xs font-extrabold tabular-nums ${isOccupied ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'}`}>
                        {elapsedTime || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Guests</span>
                      <span className={`text-xs font-extrabold tabular-nums ${isOccupied && totalGuests > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'}`}>
                        {isOccupied && totalGuests > 0 ? totalGuests : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Waiter row — always reserving space */}
                  <div className="pt-0.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-1.5 min-h-[1.25rem]">
                    {isOccupied && waiterName ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                          {waiterInitial}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">{waiterName.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span className={`text-[10px] font-semibold ${isOccupied ? 'text-gray-300 dark:text-gray-600' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {isOccupied ? 'No waiter' : 'Available'}
                      </span>
                    )}
                  </div>
                </button>

                {/* Waiter assign badge */}
                <button
                  onClick={e => { e.stopPropagation(); setAssignModal(table) }}
                  title="Assign waiter"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center text-[10px] font-bold shadow-sm"
                >
                  {waiterInitial || '+'}
                </button>

                {/* Edit guests badge — occupied only */}
                {isOccupied && (
                  <button
                    onClick={e => { e.stopPropagation(); openEditGuests(table) }}
                    title="Update guests"
                    className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center text-[9px] font-bold shadow-sm"
                  >
                    {totalGuests || '+'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700/60">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-gray-700 font-bold text-[10px]">+</span>
            Top-right badge: assign waiter
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-gray-700 font-bold text-[10px]">G</span>
            Bottom-right badge: update guests
          </span>
        </div>
      </Card>
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-3">Active orders</h2>
        <Table headers={['Table','Waiter']}>
          {liveOrders.filter(o => !['paid'].includes(o.status)).map(o => (
            <TR key={o.id}>
              <TD className="font-medium">{`T${o.table_number || 0}`}</TD>
              <TD>
                {o.waiter ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      {o.waiter.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[5rem]">{o.waiter.split(' ')[0]}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
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
  const { lang, user, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum, markOrderServed, completeProcess, menuItems, menuCategories } = useApp()
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

    const mappedItems = newItems.map(i => ({ name: i.name_en, qty: i.qty, price: i.price, mods: i.selectedMods || [], note: i.note || '', station: i.station || 'kitchen' }))
    const hasKitchenItems = mappedItems.some(i => i.station !== 'bar')
    const hasBarItems     = mappedItems.some(i => i.station === 'bar')

    if (isAddingToExisting) {
      // Append new items to existing order
      setLiveOrders(prev => prev.map(o => {
        if (o.id !== existingOrder.id) return o
        const mergedItems = [...o.items, ...mappedItems]
        const allHasKitchen = mergedItems.some(i => (i.station || 'kitchen') !== 'bar')
        const allHasBar     = mergedItems.some(i => i.station === 'bar')
        return {
          ...o,
          items: mergedItems,
          rounds: round,
          status: 'cooking',
          kitchenStatus: allHasKitchen ? (o.kitchenStatus === 'served' ? 'cooking' : o.kitchenStatus || 'cooking') : null,
          barStatus:     allHasBar     ? (o.barStatus     === 'served' ? 'pending'  : o.barStatus     || 'pending')  : null,
        }
      }))
      alert(`Round ${round} sent!\n${newItems.length} new item(s) added to ${label}`)
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
        guests: orderContext?.guests || { adults: 0, children: 0 },
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_timestamp: Date.now(),
        items: mappedItems,
        rounds: 1,
        kitchenStatus: hasKitchenItems ? 'cooking' : null,
        barStatus:     hasBarItems     ? 'pending'  : null,
      }
      setLiveOrders(prev => [...prev, newOrder])
      setNextOrderNum(n => n + 1)
      alert(`Order #${nextOrderNum} sent!\n${newItems.length} item(s) for ${label}`)
    }

    setNewItems([])
    setNotes('')
    navTo('orders')
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Menu side */}
      <div>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{label}</h2>
              {orderContext?.guests && (orderContext.guests.adults + orderContext.guests.children) > 0 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {orderContext.guests.adults} adult{orderContext.guests.adults !== 1 ? 's' : ''}{orderContext.guests.children > 0 ? ` · ${orderContext.guests.children} child${orderContext.guests.children !== 1 ? 'ren' : ''}` : ''}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAddingToExisting && <Badge color="indigo">Round {round}</Badge>}
              <Badge color={orderContext?.isTakeaway ? 'orange' : 'blue'}>{orderContext?.isTakeaway ? 'Takeaway' : 'Dine-in'}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {menuCategories.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cat === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300'}`}>
                {c.name_en}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {catItems.map(item => (
              <button key={item.id} onClick={() => openItemModal(item)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-left hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all">
                <div className="flex items-center justify-between mb-1">
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

        {/* Allergy / Notes warning for existing orders */}
        {isAddingToExisting && existingOrder?.notes && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">⚠ Allergy / Note</div>
              <div className="text-sm text-amber-800 dark:text-amber-300 font-medium">{existingOrder.notes}</div>
            </div>
          </div>
        )}

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
          {isAddingToExisting ? `Send Round ${round}` : 'Send Order'}
        </Btn>
        <Btn fullWidth onClick={() => navTo('tables')}>Back to Tables</Btn>
      </div>
    </div>
    </>
  )
}

// ─── Shared station helpers ───────────────────────────────────────────────────
const STATE_ORDER = ['pending', 'cooking', 'ready', 'served']
function computeOverallStatus(ks, bs) {
  const active = [ks, bs].filter(s => s !== null && s !== undefined)
  if (!active.length) return 'served'
  return active.reduce((min, s) => STATE_ORDER.indexOf(s) < STATE_ORDER.indexOf(min) ? s : min, 'served')
}
function printStationTicket(o, items, stationLabel) {
  const win = window.open('', '_blank', 'width=420,height=650')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>${stationLabel} Ticket #${o.order_number}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Courier New',monospace;padding:20px;max-width:380px;margin:0 auto}
    h2{font-size:18px;margin:0 0 4px;letter-spacing:2px}
    .sub{font-size:12px;color:#555;margin-bottom:12px}
    hr{border:none;border-top:1px dashed #000;margin:12px 0}
    .item{margin:10px 0}.item-name{font-size:14px;font-weight:bold}
    .item-qty{font-size:18px;float:right;font-weight:bold}
    .mods{font-size:11px;color:#444;margin-top:2px}
    .note{font-size:11px;font-style:italic;color:#c00;margin-top:2px;padding:2px 4px;border:1px dashed #c00}
    .allergy{font-size:11px;font-weight:bold;color:#c00;padding:6px;border:2px solid #c00;margin-top:8px}
    @media print{body{padding:8px}}
  </style></head><body>
  <h2>${stationLabel.toUpperCase()}</h2>
  <div class="sub">Order #${o.order_number} &bull; ${o.order_type === 'takeaway' ? 'TAKEAWAY' : 'Table ' + o.table_number}<br>
  ${o.created_at} &bull; ${o.waiter}</div>
  <hr>
  ${items.map(i => `<div class="item">
    <span class="item-qty">&times;${i.qty}</span>
    <div class="item-name">${i.name || i.name_en}</div>
    ${i.mods?.length ? `<div class="mods">+ ${i.mods.join(' &middot; ')}</div>` : ''}
    ${i.note ? `<div class="note">&#9888; ${i.note}</div>` : ''}
  </div>`).join('<hr style="border-top:1px dotted #ccc;margin:4px 0">')}
  <hr>
  ${o.notes ? `<div class="allergy">&#9888; ALLERGY/NOTE: ${o.notes}</div>` : ''}
  </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

// ─── Kitchen ──────────────────────────────────────────────────────────────────
export function Kitchen() {
  const { liveOrders, setLiveOrders } = useApp()

  // Show orders that have kitchen items (kitchenStatus not null) and aren't kitchen-done
  // Fall back to legacy orders without kitchenStatus field
  const kitchenOrders = [...liveOrders]
    .filter(o => {
      if (o.kitchenStatus === undefined) return ['pending','cooking','ready'].includes(o.status)
      return o.kitchenStatus !== null && o.kitchenStatus !== 'served'
    })
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))

  function advance(id) {
    setLiveOrders(p => p.map(o => {
      if (o.id !== id) return o
      const ks = o.kitchenStatus ?? o.status
      const next = ks === 'pending' ? 'cooking' : ks === 'cooking' ? 'ready' : ks === 'ready' ? 'served' : ks
      const overall = computeOverallStatus(next, o.barStatus ?? null)
      return { ...o, kitchenStatus: next, status: overall }
    }))
  }

  function togglePriority(id) {
    setLiveOrders(p => p.map(o => o.id === id ? { ...o, priority: !o.priority } : o))
  }

  const borderColor = { pending: 'border-l-amber-400', cooking: 'border-l-blue-500', ready: 'border-l-green-500' }
  const btnVariant  = { pending: 'primary', cooking: 'success', ready: 'warning' }
  const btnLabel    = { pending: '▶ Start Cooking', cooking: '✓ Mark Ready', ready: '🛎 Ready — Notify Waiter' }

  if (kitchenOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="text-4xl mb-2">👨‍🍳</div>
        <div className="text-sm font-medium">No active kitchen orders</div>
        <div className="text-xs mt-1">Waiting for new orders…</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kitchenOrders.map(o => {
        const ks = o.kitchenStatus ?? o.status
        const kitchenItems = o.items.filter(i => (i.station || 'kitchen') !== 'bar')
        return (
          <div key={o.id} className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-card p-5 border-l-4 ${borderColor[ks] || 'border-l-gray-300'} ${o.priority ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}>
            {/* Order header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">#{o.order_number} · {o.created_at} · {o.waiter}{o.guests && (o.guests.adults + o.guests.children) > 0 ? ` · ${o.guests.adults + o.guests.children} guests` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePriority(o.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${o.priority ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500'}`}
                >
                  {o.priority ? '🚨 Priority' : 'Prioritise'}
                </button>
                <Badge color={statusColor(ks)}>{ks}</Badge>
              </div>
            </div>
            {/* Kitchen-only items */}
            <div className="mt-3 space-y-0">
              {kitchenItems.map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {item.name || item.name_en} <span className="text-indigo-500">×{item.qty}</span>
                  </div>
                  {item.mods?.length > 0 && (
                    <div className="text-xs text-indigo-400 mt-0.5">+ {item.mods.join(' · ')}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-0.5 inline-block">Note: {item.note}</div>
                  )}
                </div>
              ))}
            </div>
            {/* Bar items indicator */}
            {o.barStatus && o.barStatus !== 'served' && (
              <div className="mt-2 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg px-2 py-1.5">
                🍸 Drinks also sent to Bar ({o.barStatus})
              </div>
            )}
            {/* Allergy note */}
            {o.notes && (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                ⚠ Allergy / Note: {o.notes}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => printStationTicket(o, kitchenItems, 'Kitchen')}
                className="flex-none text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >🖨 Print</button>
              <Btn variant={btnVariant[ks]} fullWidth size="lg" onClick={() => advance(o.id)}>
                {btnLabel[ks]}
              </Btn>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Bar ──────────────────────────────────────────────────────────────────────
export function Bar() {
  const { liveOrders, setLiveOrders } = useApp()

  const barOrders = [...liveOrders]
    .filter(o => o.barStatus !== null && o.barStatus !== undefined && o.barStatus !== 'served')
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))

  function advance(id) {
    setLiveOrders(p => p.map(o => {
      if (o.id !== id) return o
      const bs = o.barStatus
      const next = bs === 'pending' ? 'preparing' : bs === 'preparing' ? 'ready' : bs === 'ready' ? 'served' : bs
      const overall = computeOverallStatus(o.kitchenStatus ?? null, next)
      return { ...o, barStatus: next, status: overall }
    }))
  }

  function togglePriority(id) {
    setLiveOrders(p => p.map(o => o.id === id ? { ...o, priority: !o.priority } : o))
  }

  const borderColor = { pending: 'border-l-cyan-400', preparing: 'border-l-blue-500', ready: 'border-l-green-500' }
  const btnVariant  = { pending: 'primary', preparing: 'success', ready: 'warning' }
  const btnLabel    = { pending: '▶ Start Preparing', preparing: '✓ Mark Ready', ready: '🛎 Ready — Notify Waiter' }

  if (barOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="text-4xl mb-2">🍸</div>
        <div className="text-sm font-medium">No active bar orders</div>
        <div className="text-xs mt-1">Waiting for drink orders…</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {barOrders.map(o => {
        const bs = o.barStatus
        const barItems = o.items.filter(i => i.station === 'bar')
        return (
          <div key={o.id} className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-card p-5 border-l-4 ${borderColor[bs] || 'border-l-gray-300'} ${o.priority ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}>
            {/* Order header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">#{o.order_number} · {o.created_at} · {o.waiter}{o.guests && (o.guests.adults + o.guests.children) > 0 ? ` · ${o.guests.adults + o.guests.children} guests` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePriority(o.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${o.priority ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500'}`}
                >
                  {o.priority ? '🚨 Priority' : 'Prioritise'}
                </button>
                <Badge color={statusColor(bs === 'preparing' ? 'cooking' : bs)}>{bs}</Badge>
              </div>
            </div>
            {/* Bar-only drink items */}
            <div className="mt-3 space-y-0">
              {barItems.map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {item.name || item.name_en} <span className="text-cyan-500">×{item.qty}</span>
                  </div>
                  {item.mods?.length > 0 && (
                    <div className="text-xs text-cyan-400 mt-0.5">+ {item.mods.join(' · ')}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-0.5 inline-block">Note: {item.note}</div>
                  )}
                </div>
              ))}
            </div>
            {/* Kitchen status indicator */}
            {o.kitchenStatus && o.kitchenStatus !== 'served' && (
              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 py-1.5">
                👨‍🍳 Food also sent to Kitchen ({o.kitchenStatus})
              </div>
            )}
            {/* Allergy note */}
            {o.notes && (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                ⚠ Allergy / Note: {o.notes}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => printStationTicket(o, barItems, 'Bar')}
                className="flex-none text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >🖨 Print</button>
              <Btn variant={btnVariant[bs]} fullWidth size="lg" onClick={() => advance(o.id)}>
                {btnLabel[bs]}
              </Btn>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function Billing({ orderContext }) {
  const { lang, user, company, liveOrders, openBills, finalizeBill, addToHistory, menuItems, menuCategories } = useApp()
  const vatRate = company.vat_rate / 100

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([])
  const [payMethod, setPayMethod] = useState(null)
  const [cashGiven, setCashGiven] = useState(0)
  const [receipt, setReceipt] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [billNote, setBillNote] = useState('')

  // ── Open bill tracking ──────────────────────────────────────────────────────
  const [loadedBillId, setLoadedBillId] = useState(null)    // which open bill is loaded
  const [billItems, setBillItems] = useState([])             // items from the loaded bill (read-only display)
  const [preloadLabel, setPreloadLabel] = useState('')      // label when loaded from OrderList

  // ── Product browser state ───────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [mobileBillTab, setMobileBillTab] = useState('menu')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalCat, setModalCat] = useState('all')
  const [modalSearch, setModalSearch] = useState('')
  const [showShopModal, setShowShopModal] = useState(false)
  const [billItemModal, setBillItemModal] = useState(null)
  const [billModalQty, setBillModalQty] = useState(1)
  const [billModalSelections, setBillModalSelections] = useState({})
  const [billModalNote, setBillModalNote] = useState('')
  const searchRef = useRef(null)

  // ── Filtered items ──────────────────────────────────────────────────────────
  const visibleItems = menuItems.filter(item => {
    if (!item.available) return false
    const q = search.trim().toLowerCase()
    const matchCat = activeCat === 'all' || item.category_id === activeCat
    const matchSearch = !q || item.name_en.toLowerCase().includes(q)
                            || item.code?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // ── Load an open bill into the cashier view ─────────────────────────────────
  function loadBillIntoCart(bill) {
    // Store original bill items separately (cannot be removed, for display)
    setBillItems(bill.items.map(i => ({
      id: i.id || `bill-${i.name || i.name_en}-${Math.random()}`,
      name_en: i.name || i.name_en,
      price: i.price,
      qty: i.qty,
      discount_pct: i.discount_pct || 0,
      fromBill: true,
    })))
    setCart([])  // cashier extras start empty
    setLoadedBillId(bill.id)
  }

  // ── Preload order when navigated from OrderList ─────────────────────────────
  useEffect(() => {
    const order = orderContext?.preloadOrder
    if (!order) return
    setBillItems(order.items.map(i => ({
      id: i.id || `bill-${i.name || i.name_en}-${Math.random()}`,
      name_en: i.name || i.name_en,
      price: i.price,
      qty: i.qty,
      discount_pct: 0,
      fromBill: true,
    })))
    setCart([])
    setLoadedBillId(null)
    setPreloadLabel(order.order_type === 'takeaway' ? `🥡 Takeaway — #${order.order_number}` : `🍽️ Table ${order.table_number} — #${order.order_number}`)
  }, [orderContext?.preloadOrder])

  function clearLoadedBill() {
    setBillItems([])
    setCart([])
    setLoadedBillId(null)
    setPayMethod(null)
    setCashGiven(0)
    setBillNote('')
    setPreloadLabel('')
  }

  function openBillItemModal(item) {
    setBillItemModal(item)
    setBillModalQty(1)
    setBillModalSelections({})
    setBillModalNote('')
  }

  function toggleBillMod(group, choice) {
    setBillModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) {
        return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function addToCartWithMods() {
    const flatMods = Object.values(billModalSelections).flat().filter(Boolean)
    const cartKey = `${billItemModal.id}-${Date.now()}`
    setCart(p => [...p, { ...billItemModal, qty: billModalQty, cartKey, selectedMods: flatMods, note: billModalNote.trim() }])
    setMobileBillTab('cart')
    setBillItemModal(null)
  }

  function addToCart(item) {
    setCart(p => {
      const ex = p.find(i => i.id === item.id)
      if (ex) return p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { ...item, qty: 1 }]
    })
    setMobileBillTab('cart')
  }

  function changeQty(id, delta) {
    setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  function removeFromCart(id) {
    setCart(p => p.filter(i => i.id !== id))
  }

  function changeBillItemQty(index, delta) {
    setBillItems(p => p.map((item, i) => i === index ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0))
  }

  function removeBillItem(index) {
    setBillItems(p => p.filter((_, i) => i !== index))
  }

  function setExtraNote(id, note) {
    setCart(p => p.map(i => i.id === id ? { ...i, extraNote: note } : i))
  }

  // ── Totals (bill items + cashier extras) ────────────────────────────────────
  const allCartItems = [...billItems, ...cart]
  const subtotal = allCartItems.reduce((a, i) => {
    const disc = Number(i.discount_pct || 0) / 100
    return a + (i.price * (1 - disc)) * i.qty
  }, 0)
  const totalSavings = allCartItems.reduce((a, i) => {
    const disc = Number(i.discount_pct || 0) / 100
    return a + (i.price * disc) * i.qty
  }, 0)
  const vat = subtotal * vatRate
  const total = subtotal + vat

  // ── Confirm payment & finalize ───────────────────────────────────────────────
  function confirmPayment() {
    if (!payMethod || allCartItems.length === 0) return
    const orderNum = Math.floor(Math.random() * 900) + 100
    const bill = loadedBillId ? openBills.find(b => b.id === loadedBillId) : null
    const paidAt = new Date()
    if (loadedBillId) finalizeBill(loadedBillId)

    addToHistory({
      id: `hist_${Date.now()}`,
      order_number: orderNum,
      table_label: bill?.tableLabel || 'Walk-in',
      waiter: bill?.waiter || '—',
      cashier: user?.full_name || '—',
      items: allCartItems,
      subtotal, vat, total,
      total_savings: totalSavings,
      pay_method: payMethod,
      cash_given: cashGiven,
      change: cashGiven > 0 ? Math.max(0, cashGiven - total) : 0,
      note: billNote.trim(),
      paid_at: paidAt,
    })

    setReceipt({
      items: allCartItems,
      subtotal, vat, total, totalSavings, payMethod, cashGiven,
      change: cashGiven > 0 ? Math.max(0, cashGiven - total) : 0,
      date: paidAt,
      order_number: orderNum,
      note: billNote.trim(),
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
                <div className="text-gray-700 dark:text-gray-300">{item.name_en} ×{item.qty}</div>
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
            {receipt.note && (
              <div className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                📝 {receipt.note}
              </div>
            )}
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
            <Btn variant="primary" onClick={() => alert('Sending to printer...')}>Print</Btn>
            <Btn onClick={() => alert('Share via email/WhatsApp...')}>Share</Btn>
          </div>
          <Btn variant="success" fullWidth className="mt-2" onClick={() => {
            setReceipt(null); setCart([]); setBillItems([]); setPayMethod(null); setCashGiven(0); setLoadedBillId(null); setMobileBillTab('menu'); setBillNote('')
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

    {/* Mobile tab bar - hidden on desktop */}
    <div className="flex gap-2 mb-3 lg:hidden">
      <button onClick={() => setMobileBillTab('menu')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${mobileBillTab==='menu' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
        Menu
      </button>
      <button onClick={() => setMobileBillTab('cart')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all relative ${mobileBillTab==='cart' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
        Cart{allCartItems.length > 0 ? ` (${allCartItems.reduce((s,i)=>s+i.qty,0)})` : ''}
      </button>
    </div>

    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-160px)] min-h-0">

      {/* ── LEFT: Product browser ── */}
      <div className={`flex-1 flex flex-col min-w-0 gap-3 min-h-0 ${mobileBillTab !== 'menu' ? 'hidden lg:flex' : ''}`}>

        {/* Search row */}
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
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
          >All Items ({menuItems.filter(m => m.available).length})
          </button>
          {menuCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
            >
              {cat.name_en} ({menuItems.filter(m => m.category_id === cat.id && m.available).length})
            </button>
          ))}
        </div>

        {/* Product grid — professional text tiles */}
        <div className="flex-1 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <div className="text-sm font-medium">No items found</div>
              <div className="text-xs mt-1">Try a different search or category</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-2">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => openBillItemModal(item)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 cursor-pointer
                    ${'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                >
                  <div className="flex items-start justify-between mb-1.5">
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
      <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 ${mobileBillTab !== 'cart' ? 'hidden lg:flex lg:flex-col' : ''}`}>

        {/* Bill / Cart */}
        <Card className="flex flex-col h-[38rem] lg:h-auto lg:flex-1 lg:min-h-0 !p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-sm">🧾</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Current Bill</h2>
                {loadedBillId
                  ? <div className="text-xs text-indigo-500 font-semibold mt-0.5">{openBills.find(b => b.id === loadedBillId)?.tableLabel}</div>
                  : preloadLabel
                    ? <div className="text-xs text-indigo-500 font-semibold mt-0.5">{preloadLabel}</div>
                    : <div className="text-xs text-gray-400 mt-0.5">Walk-in / Direct sale</div>
                }
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allCartItems.length > 0 && (
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  {allCartItems.reduce((s, i) => s + i.qty, 0)} items
                </span>
              )}
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-rose-400 hover:text-rose-600 font-semibold transition-colors">Clear extras</button>
              )}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1">
            {allCartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">Bill is empty</div>
                  <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">Load an open bill or add items from the menu</div>
                </div>
              </div>
            ) : (
            <>
                {/* --- From Order section (editable) --- */}
                {billItems.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-1 pb-1.5">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">From Order</div>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700"></div>
                      <span className="text-xs text-gray-400">{billItems.reduce((s,i)=>s+i.qty,0)} items</span>
                    </div>
                    {billItems.map((item, i) => (
                      <div key={`bill-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{item.name_en}</div>
                          <div className="text-xs text-gray-400 mt-0.5">€{item.price.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                          <button onClick={() => changeBillItemQty(i, -1)} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors">−</button>
                          <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                          <button onClick={() => changeBillItemQty(i, 1)} className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm transition-colors">+</button>
                        </div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 w-14 text-right flex-shrink-0">
                          €{(item.price * (1 - Number(item.discount_pct || 0) / 100) * item.qty).toFixed(2)}
                        </span>
                        <button onClick={() => removeBillItem(i)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-xs flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </>
                )}

                {/* --- Cashier Additions section (editable) --- */}
                {cart.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1.5">
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">+ Added by Cashier</div>
                      <div className="flex-1 h-px bg-indigo-100 dark:bg-indigo-900/30"></div>
                    </div>
                    {cart.map(item => (
                      <div key={item.id} className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name_en}</div>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">€{item.price.toFixed(2)} each</div>
                          </div>
                          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors">−</button>
                            <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm transition-colors">+</button>
                          </div>
                          <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 w-14 text-right">
                            €{(item.price * (1 - Number(item.discount_pct || 0) / 100) * item.qty).toFixed(2)}
                          </span>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Add items button */}
                <button
                  onClick={() => { setModalCat('all'); setModalSearch(''); setShowAddModal(true) }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                >
                  + Add Food Items
                </button>
              </>
            )}

            {/* Bill note — always visible */}
            <div className="pt-2">
              <textarea
                value={billNote}
                onChange={e => setBillNote(e.target.value)}
                placeholder="Add a note for this bill… (allergy, special request)"
                rows={2}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* Totals footer — only when bill has items */}
          {allCartItems.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700/60 px-4 py-2 flex-shrink-0 space-y-1 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-xs text-rose-500 font-semibold">
                <span>Discounts</span><span>−€{totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>VAT {company.vat_rate}%</span><span>€{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Total</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
            </div>
          </div>
          )}

          {/* Confirm + Cancel buttons — only when bill has items */}
          {allCartItems.length > 0 && (
          <div className="px-3 pb-3 pt-2 grid grid-cols-3 gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPayModal(true)}
              className="py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm transition-all"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowShopModal(true)}
              className="py-3 rounded-xl text-sm font-bold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 active:scale-[0.98] text-indigo-700 dark:text-indigo-300 transition-all"
            >
              Shop
            </button>
            <button
              onClick={() => { clearLoadedBill(); setPayMethod(null); setCashGiven(0); }}
              className="py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          </div>
          )}
        </Card>

      </div>
    </div>

    {/* ── Shop / Owner Account Confirmation Modal ── */}
    {showShopModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowShopModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Owner's Account</h3>
            <button onClick={() => setShowShopModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Bill Total</div>
                <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Charge this bill to the <span className="font-bold text-gray-900 dark:text-white">shop owner's account</span>?</p>
            <p className="text-xs text-gray-400 mb-5">This will be recorded as an internal shop payment and finalize the bill.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowShopModal(false)}
                className="py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowShopModal(false)
                  setPayMethod('shop')
                  setTimeout(() => {
                    if (loadedBillId) finalizeBill(loadedBillId)
                    const orderNum = Math.floor(Math.random() * 900) + 100
                    setReceipt({
                      items: allCartItems,
                      subtotal, vat, total, totalSavings,
                      payMethod: 'Shop Account',
                      cashGiven: 0,
                      change: 0,
                      date: new Date(),
                      order_number: orderNum,
                      note: billNote.trim(),
                    })
                  }, 0)
                }}
                className="py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all"
              >
                ✓ Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Item Modifier Modal (Billing) ── */}
    {billItemModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBillItemModal(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl">{billItemModal.emoji}</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{billItemModal.name_en}</h2>
              </div>
              <div className="text-sm text-indigo-600 font-bold">€{billItemModal.price.toFixed(2)}</div>
            </div>
            <button onClick={() => setBillItemModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setBillModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{billModalQty}</span>
                <button onClick={() => setBillModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                <span className="text-sm text-gray-400 ml-2">= €{(billItemModal.price * billModalQty).toFixed(2)}</span>
              </div>
            </div>
            {(billItemModal.modifierGroups || []).map(group => (
              <div key={group.label}>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.label} {group.multi ? <span className="normal-case font-normal text-gray-400">(select multiple)</span> : <span className="normal-case font-normal text-gray-400">(choose one)</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.choices.map(choice => {
                    const active = (billModalSelections[group.label] || []).includes(choice)
                    return (
                      <button key={choice} onClick={() => toggleBillMod(group, choice)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                        {active && '✓ '}{choice}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
              <textarea
                value={billModalNote}
                onChange={e => setBillModalNote(e.target.value)}
                placeholder="e.g. No onion, allergen request…"
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setBillItemModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
            <button onClick={addToCartWithMods} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all">
              Add {billModalQty > 1 ? `×${billModalQty}` : ''} to Bill — €{(billItemModal.price * billModalQty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Add Food Modal ── */}
    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowAddModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Add Food Items</h3>
            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          {/* Search */}
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
          {/* Category tabs */}
          <div className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0">
            <button onClick={() => setModalCat('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>All</button>
            {menuCategories.map(cat => (
              <button key={cat.id} onClick={() => setModalCat(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>{cat.name_en}</button>
            ))}
          </div>
          {/* Product grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {menuItems.filter(item => {
                if (!item.available) return false
                const q = modalSearch.trim().toLowerCase()
                const matchCat = modalCat === 'all' || item.category_id === modalCat
                const matchSearch = !q || item.name_en.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q)
                return matchCat && matchSearch
              }).map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => { setShowAddModal(false); openBillItemModal(item) }}
                    className="relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">€{item.price.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">{inCart.qty}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Done button */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all"
            >
              {cart.length > 0 ? `Done — ${cart.reduce((s,i)=>s+i.qty,0)} item${cart.reduce((s,i)=>s+i.qty,0)!==1?'s':''} added` : 'Done'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Payment Modal ── */}
    {showPayModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">💳 Payment</h3>
            <button
              onClick={() => { setShowPayModal(false); setPayMethod(null); setCashGiven(0); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold"
            >✕</button>
          </div>

          {/* Total to pay */}
          <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Total to Pay</span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Payment method */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method</div>
              <div className="grid grid-cols-3 gap-2">
                {[['💵', 'Cash', 'cash'], ['💳', 'Card', 'card'], ['📱', 'Mobile', 'mobile']].map(([icon, label, val]) => (
                  <button
                    key={val}
                    onClick={() => setPayMethod(val)}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      payMethod === val
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                    }`}
                  >
                    <div className="text-xl">{icon}</div>
                    <div className={`text-xs font-bold mt-1 ${payMethod === val ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash denominations */}
            {payMethod === 'cash' && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cash Tendered</div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[5, 10, 20, 50, 100, 200].map(a => (
                    <button
                      key={a}
                      onClick={() => setCashGiven(a)}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                        cashGiven === a
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-indigo-300'
                      }`}
                    >
                      €{a}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Change due</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">€{Math.max(0, cashGiven - total).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <button
              disabled={!payMethod}
              onClick={() => { confirmPayment(); setShowPayModal(false); }}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold transition-all bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-md shadow-emerald-200 dark:shadow-none disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {!payMethod ? 'Select a payment method' : '✅ Confirm & Print Receipt'}
            </button>
          </div>
        </div>
      </div>
    )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 mb-4 border-2 ${isClockedIn ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
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
              <div className="overflow-x-auto">
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
              </div>
            </Card>
          )}

          {/* Finished today */}
          {doneToday.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed Today</span>
              </div>
              <div className="overflow-x-auto">
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
              </div>
            </Card>
          )}

          {todayRecords.length === 0 && (
            <Card><div className="text-center py-8 text-gray-400">No clock-in records for today yet.</div></Card>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
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
          </div>
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
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 dark:border-gray-700">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt #</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Table</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Time</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium text-blue-600">RCP-{inv.invoice_number}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{inv.table}</td>
                <td className="px-4 py-3 hidden sm:table-cell"><Badge color={inv.type==='takeaway'?'orange':'blue'}>{inv.type==='takeaway'?'Takeaway':'Dine-in'}</Badge></td>
                <td className="px-4 py-3 font-medium">€{inv.total.toFixed(2)}</td>
                <td className="px-4 py-3 hidden md:table-cell">{inv.payment_method}</td>
                <td className="px-4 py-3 hidden md:table-cell">{inv.created_at}</td>
                <td className="px-4 py-3"><Btn size="sm" onClick={() => alert('Reprinting...')}>Reprint</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

// ─── Customers ────────────────────────────────────────────────────────────────
export function Customers() {
  const { customers, createCustomer, updateCustomer, deleteCustomer, user } = useApp()
  const canManage = ['superadmin','admin','owner','manager'].includes(user?.role)

  const BLANK = { name:'', phone:'', email:'', notes:'', loyalty_points:0, tags:[], orders:[] }
  const [modal, setModal] = useState(null)  // null | { mode:'add'|'edit'|'view' }
  const [form, setForm] = useState(BLANK)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [viewTab, setViewTab] = useState('details')

  const visible = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.email||'').toLowerCase().includes(q)
  })

  function openAdd() { setForm({ ...BLANK }); setModal({ mode:'add' }) }
  function openEdit(c) { setForm({ ...c }); setModal({ mode:'edit' }) }
  function openView(c) { setForm({ ...c }); setModal({ mode:'view' }); setViewTab('details') }
  function closeModal() { setModal(null) }

  function save() {
    if (!form.name.trim()) return
    const record = { ...form, loyalty_points: parseInt(form.loyalty_points) || 0 }
    if (modal.mode === 'add') createCustomer(record)
    else updateCustomer(record)
    closeModal()
  }

  const isReadOnly = modal?.mode === 'view'

  const TAG_OPTIONS = ['VIP','Regular','Allergy','Gluten-Free','Vegan','Lactose-Free','Staff Discount']

  return (
    <div>
      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove customer?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.name}"'s data will be permanently deleted.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => { deleteCustomer(confirmDelete.id); setConfirmDelete(null) }}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit / View Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {modal.mode === 'add' ? 'Add Customer' : modal.mode === 'view' ? 'Customer Details' : 'Edit Customer'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            {isReadOnly && (
              <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                {[['details','Details'],['orders',`Orders (${(form.orders||[]).length})`]].map(([key,label]) => (
                  <button key={key} onClick={() => setViewTab(key)}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all -mb-px ${viewTab===key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className={`px-6 py-5 space-y-4${isReadOnly && viewTab === 'orders' ? ' hidden' : ''}`}>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Full Name {!isReadOnly && <span className="text-rose-400">*</span>}</label>
                <input
                  value={form.name}
                  onChange={e => !isReadOnly && setForm(f => ({ ...f, name: e.target.value }))}
                  readOnly={isReadOnly}
                  placeholder="e.g. Anna Borg"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}
                />
              </div>
              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input type="tel" value={form.phone||''} onChange={e => !isReadOnly && setForm(f=>({...f,phone:e.target.value}))} readOnly={isReadOnly} placeholder="+356 ..." className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email||''} onChange={e => !isReadOnly && setForm(f=>({...f,email:e.target.value}))} readOnly={isReadOnly} placeholder="email@example.com" className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
                </div>
              </div>
              {/* Loyalty points */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Loyalty Points</label>
                <input type="number" min="0" value={form.loyalty_points||0} onChange={e => !isReadOnly && setForm(f=>({...f,loyalty_points:e.target.value}))} readOnly={isReadOnly} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => {
                    const active = (form.tags||[]).includes(tag)
                    return (
                      <button key={tag} type="button"
                        onClick={() => !isReadOnly && setForm(f => ({ ...f, tags: active ? (f.tags||[]).filter(t=>t!==tag) : [...(f.tags||[]),tag] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'} ${!isReadOnly ? 'hover:border-indigo-400 cursor-pointer' : 'cursor-default'}`}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes / Preferences</label>
                <textarea
                  value={form.notes||''}
                  onChange={e => !isReadOnly && setForm(f=>({...f,notes:e.target.value}))}
                  readOnly={isReadOnly}
                  placeholder="e.g. Nut allergy, prefers window seat, birthday in March…"
                  rows={3}
                  className={`w-full text-sm px-3.5 py-2.5 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}
                />
              </div>
            </div>
            {isReadOnly && viewTab === 'orders' && (
              <div className="px-6 py-5">
                {(form.orders||[]).length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No orders recorded for this customer yet</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {[...(form.orders||[])].reverse().map((o,i) => (
                      <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Order #{o.order_number}</span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">€{Number(o.total).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{o.date} · {o.pay_method}</div>
                        <div className="text-xs text-gray-400 mt-1">{o.items}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 px-6 pb-6">
              {isReadOnly ? (
                <Btn fullWidth onClick={closeModal}>Close</Btn>
              ) : (
                <>
                  <Btn fullWidth onClick={closeModal}>Cancel</Btn>
                  <Btn variant="success" fullWidth onClick={save} disabled={!form.name.trim()}>
                    {modal.mode === 'add' ? 'Add Customer' : 'Save Changes'}
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
          <span className="text-xs text-gray-400">{customers.length} customer{customers.length !== 1 ? 's' : ''}</span>
        </div>
        <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Customer</Btn>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          {c.name}
                          {(c.tags||[]).includes('VIP') && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">VIP</span>}
                        </div>
                        {c.notes && <div className="text-xs text-gray-400 truncate max-w-[150px]">{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags||[]).filter(t => t !== 'VIP').map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${c.loyalty_points > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                      {c.loyalty_points || 0} pts
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canManage ? (
                        <>
                          <Btn size="sm" onClick={() => openEdit(c)}>Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(c)}>Delete</Btn>
                        </>
                      ) : (
                        <Btn size="sm" onClick={() => openView(c)}>View</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  {search ? 'No customers match your search' : 'No customers yet — add your first one!'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

// ─── Order History ────────────────────────────────────────────────────────────
export function History() {
  const { orderHistory, company } = useApp()
  const [search, setSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const vatRate = company?.vat_rate ?? 18

  const filtered = orderHistory.filter(r => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      String(r.order_number).includes(q) ||
      r.table_label.toLowerCase().includes(q) ||
      r.waiter.toLowerCase().includes(q) ||
      r.cashier.toLowerCase().includes(q)
    const matchMethod = filterMethod === 'all' || r.pay_method === filterMethod
    return matchSearch && matchMethod
  })

  const todayTotal = orderHistory.filter(r => {
    const d = r.paid_at instanceof Date ? r.paid_at : new Date(r.paid_at)
    return d.toDateString() === new Date().toDateString()
  }).reduce((s, r) => s + r.total, 0)

  const methodColor = { cash: 'green', card: 'indigo', mobile: 'cyan' }
  const methodLabel = { cash: 'Cash', card: 'Card', mobile: 'Mobile' }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <div className="text-xs text-gray-400 mb-1">Total Orders</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{orderHistory.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Today's Revenue</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">€{todayTotal.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Cash Payments</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{orderHistory.filter(r => r.pay_method === 'cash').length}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Card / Mobile</div>
          <div className="text-2xl font-extrabold text-gray-700 dark:text-gray-200">{orderHistory.filter(r => r.pay_method !== 'cash').length}</div>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, table, waiter…"
            className="flex-1 min-w-[180px] text-sm px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Date & Time','Order #','Table','Waiter','Cashier','Items','Method','Total'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No records found</td></tr>
              )}
              {filtered.map(r => {
                const d = r.paid_at instanceof Date ? r.paid_at : new Date(r.paid_at)
                const isExpanded = expandedId === r.id
                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-gray-800 dark:text-gray-200">#{r.order_number}</td>
                      <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{r.table_label}</td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{r.waiter}</td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{r.cashier}</td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</td>
                      <td className="py-2.5 pr-4">
                        <Badge color={methodColor[r.pay_method] || 'gray'}>{methodLabel[r.pay_method] || r.pay_method}</Badge>
                      </td>
                      <td className="py-2.5 font-extrabold text-indigo-600 dark:text-indigo-400">€{r.total.toFixed(2)}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-detail`} className="bg-gray-50 dark:bg-gray-800/60">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Items */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Items</div>
                              <div className="space-y-1">
                                {r.items.map((item, i) => {
                                  const disc = Number(item.discount_pct || 0) / 100
                                  const line = item.price * (1 - disc) * item.qty
                                  return (
                                    <div key={i} className="flex justify-between text-xs">
                                      <span className="text-gray-700 dark:text-gray-300">
                                        <span className="font-bold text-gray-500">{item.qty}×</span> {item.name_en || item.name}
                                        {disc > 0 && <span className="ml-1 text-rose-500">−{item.discount_pct}%</span>}
                                      </span>
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">€{line.toFixed(2)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            {/* Totals + note */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Summary</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>€{r.subtotal.toFixed(2)}</span></div>
                                {r.total_savings > 0 && <div className="flex justify-between text-rose-500"><span>Savings</span><span>−€{r.total_savings.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-gray-500"><span>VAT {vatRate}%</span><span>€{r.vat.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200 pt-1 border-t border-gray-200 dark:border-gray-700"><span>Total</span><span>€{r.total.toFixed(2)}</span></div>
                                {r.pay_method === 'cash' && r.cash_given > 0 && (
                                  <>
                                    <div className="flex justify-between text-gray-400"><span>Cash given</span><span>€{r.cash_given.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Change</span><span>€{r.change.toFixed(2)}</span></div>
                                  </>
                                )}
                                {r.note && <div className="mt-2 text-gray-400 italic">Note: {r.note}</div>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
