import { createContext, useContext, useState, useEffect } from 'react'
import { SAMPLE_ORDERS, MENU_ITEMS, MENU_CATEGORIES, INVENTORY_ITEMS } from '../lib/mockData'

const AppContext = createContext(null)

export const ROLES = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
  admin:      { label: 'Admin',       color: 'bg-amber-100 text-amber-800' },
  owner:      { label: 'Owner',       color: 'bg-green-100 text-green-800' },
  manager:    { label: 'Manager',     color: 'bg-blue-100 text-blue-800' },
  cashier:    { label: 'Cashier',     color: 'bg-pink-100 text-pink-800' },
  supervisor: { label: 'Supervisor',  color: 'bg-sky-100 text-sky-800' },
  waiter:     { label: 'Waiter',      color: 'bg-cyan-100 text-cyan-800' },
  cook:       { label: 'Kitchen Cook',color: 'bg-orange-100 text-orange-800' },
  supplier:   { label: 'Supplier',    color: 'bg-teal-100 text-teal-800' },
}

export const ROLE_NAV = {
  superadmin: ['dashboard','company','users','customers','inventory','menu','reports','settings','audit','notifications'],
  admin:      ['dashboard','users','customers','tables','billing','inventory','menu','reports','settings','notifications'],
  owner:      ['dashboard','reports','users','customers','billing','inventory','menu','settings','notifications'],
  manager:    ['dashboard','users','customers','shifts','inventory','menu','notifications'],
  cashier:    ['billing','receipts','customers','shifts','notifications'],
  supervisor: ['dashboard','supervisor','reports','shifts','notifications'],
  waiter:     ['tables','orders','customers','shifts','notifications'],
  cook:       ['kitchen','shifts','notifications'],
  supplier:   ['inventory','invoices','notifications'],
}

export const NAV_ICONS = {
  dashboard:'🏠', company:'🏢', users:'👥', reports:'📊', settings:'⚙️', audit:'🔒',
  tables:'🍽️', orders:'📋', billing:'💰', inventory:'📦', menu:'🗂️',
  cashier:'💰', receipts:'🖨️', supervisor:'👁️', shifts:'🗓️', kitchen:'👨‍🍳',
  invoices:'📄', notifications:'🔔', customers:'👤',
}

const INITIAL_USERS = [
  { id:'1', full_name:'Super Admin',   username:'superadmin', password:'Admin@1234', role:'superadmin', status:'active',   created_by:'System' },
  { id:'2', full_name:'Admin User',    username:'admin',      password:'Admin@1234', role:'admin',      status:'active',   created_by:'System' },
  { id:'3', full_name:'Anna Owner',    username:'owner',      password:'Admin@1234', role:'owner',      status:'active',   created_by:'System' },
  { id:'4', full_name:'Marco Manager', username:'manager',    password:'Admin@1234', role:'manager',    status:'active',   created_by:'System' },
  { id:'5', full_name:'John Cashier',  username:'cashier',    password:'Admin@1234', role:'cashier',    status:'active',   created_by:'System' },
  { id:'6', full_name:'Sam Supervisor',username:'supervisor', password:'Admin@1234', role:'supervisor', status:'active',   created_by:'System' },
  { id:'7', full_name:'Maria Waiter',  username:'waiter',     password:'Admin@1234', role:'waiter',     status:'active',   created_by:'System' },
  { id:'8', full_name:'Tony Cook',     username:'cook',       password:'Admin@1234', role:'cook',       status:'active',   created_by:'System' },
  { id:'9', full_name:'Rita Supplier', username:'supplier',   password:'Admin@1234', role:'supplier',   status:'active',   created_by:'System' },
]

const INITIAL_CUSTOMERS = [
  { id:'cust1', name:'Anna Borg',       phone:'+356 9912 3456', email:'anna.borg@gmail.com', notes:'Prefers window seat. Nut allergy.',    loyalty_points:120, tags:['VIP','Allergy'],  created_at:'15/03/2026' },
  { id:'cust2', name:'Mark Camilleri',  phone:'+356 9934 5678', email:'mark.c@hotmail.com',  notes:'Regular Thursday lunch customer.',    loyalty_points:45,  tags:['Regular'],        created_at:'02/01/2026' },
  { id:'cust3', name:'Sophie Farrugia', phone:'+356 7756 7890', email:'',                    notes:'Vegan — no dairy or meat.',           loyalty_points:88,  tags:['Vegan'],          created_at:'20/02/2026' },
  { id:'cust4', name:'Joseph Vella',    phone:'+356 9978 1234', email:'j.vella@business.mt', notes:'Corporate client. Prefers booth.',    loyalty_points:210, tags:['VIP'],            created_at:'10/11/2025' },
  { id:'cust5', name:'Claire Zammit',   phone:'+356 7712 3456', email:'claire.z@gmail.com',  notes:'Gluten intolerance.',                loyalty_points:33,  tags:['Gluten-Free'],    created_at:'08/04/2026' },
]

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [lang, setLang]           = useState('en')
  const [theme, setTheme]         = useState('light')
  const [users, setUsers]         = useState(INITIAL_USERS)
  const [liveOrders, setLiveOrders] = useState(SAMPLE_ORDERS)
  const [nextOrderNum, setNextOrderNum] = useState(50)
  const [menuItems, setMenuItems] = useState(MENU_ITEMS)
  const [menuCategories, setMenuCategories] = useState(MENU_CATEGORIES)
  const [inventoryItems, setInventoryItems] = useState(INVENTORY_ITEMS)
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [company, setCompany] = useState({ name: 'Bella Vista Malta', address: '123 Republic Street, Valletta', currency: 'EUR', vat_rate: 18, receipt_footer: 'Thank you — Grazzi — Grazie' })
  const [billQueue, setBillQueue] = useState([]) // { orderId, tableLabel, waiter, items, total }
  const [clockRecords, setClockRecords] = useState([
    // seed: Tony Cook clocked in today as example
    { id:'cr1', userId:'8', userName:'Tony Cook', role:'cook', clockIn: new Date(new Date().setHours(8,30,0,0)), clockOut: null },
  ])
  const [notifications, setNotifications] = useState([
    { id:1, message_en:'Low stock: Olive Oil below minimum', type:'warning', module:'Inventory', is_read:false, created_at: new Date() },
    { id:2, message_en:'New user request: Maria Galea', type:'info', module:'Users', is_read:false, created_at: new Date() },
    { id:3, message_en:'Order #047 sent to kitchen', type:'info', module:'Orders', is_read:true, created_at: new Date() },
  ])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  function login(username, password) {
    const found = users.find(u =>
      u.username === username &&
      u.password === password &&
      u.status === 'active'
    )
    if (found) { setUser(found); return { success: true } }
    const exists = users.find(u => u.username === username)
    if (exists && exists.status === 'pending') return { success: false, error: 'Account pending approval' }
    if (exists && exists.status === 'inactive') return { success: false, error: 'Account deactivated' }
    return { success: false, error: 'Invalid username or password' }
  }

  function logout() { setUser(null) }

  // ── User management ────────────────────────────────────────────────────────
  function createUser(newUser, createdByUser) {
    const isImmediate = ['superadmin','admin'].includes(createdByUser?.role)
    const record = {
      ...newUser,
      id: `u${Date.now()}`,
      status: isImmediate ? 'active' : 'pending',
      created_by: createdByUser?.full_name || 'Unknown',
    }
    setUsers(p => [...p, record])
    if (!isImmediate) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message_en: `New account pending approval: ${newUser.full_name} (${ROLES[newUser.role]?.label})`,
        type: 'info',
        module: 'Users',
        is_read: false,
        created_at: new Date(),
      }])
    }
    return record
  }

  function approveUser(id) {
    setUsers(p => p.map(u => u.id === id ? { ...u, status: 'active' } : u))
  }

  function deactivateUser(id) {
    setUsers(p => p.map(u => u.id === id ? { ...u, status: 'inactive' } : u))
  }

  // ── Customer management ─────────────────────────────────────────────────────
  function createCustomer(record) {
    setCustomers(p => [...p, { ...record, id: `cust${Date.now()}`, created_at: new Date().toLocaleDateString() }])
  }

  function updateCustomer(record) {
    setCustomers(p => p.map(c => c.id === record.id ? record : c))
  }

  function deleteCustomer(id) {
    setCustomers(p => p.filter(c => c.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function requestBill(order) {
    setBillQueue(p => {
      if (p.find(b => b.orderId === order.id)) return p
      const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
      return [...p, {
        orderId: order.id,
        tableLabel: order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table_number}`,
        waiter: order.waiter,
        items: order.items,
        total,
      }]
    })
    setLiveOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'bill_requested' } : o))
  }

  function clearBillRequest(orderId) {
    setBillQueue(p => p.filter(b => b.orderId !== orderId))
  }

  // ── Clock In / Out ─────────────────────────────────────────────────────────
  function clockIn() {
    if (!user) return
    // prevent double clock-in (open record already exists for today)
    const todayOpen = clockRecords.find(r =>
      r.userId === user.id && r.clockOut === null &&
      r.clockIn.toDateString() === new Date().toDateString()
    )
    if (todayOpen) return
    setClockRecords(p => [...p, {
      id: `cr${Date.now()}`,
      userId: user.id,
      userName: user.full_name,
      role: user.role,
      clockIn: new Date(),
      clockOut: null,
    }])
  }

  function clockOut() {
    if (!user) return
    setClockRecords(p => p.map(r =>
      r.userId === user.id && r.clockOut === null
        ? { ...r, clockOut: new Date() }
        : r
    ))
  }

  // Is the current user currently clocked in?
  const isClockedIn = user
    ? clockRecords.some(r => r.userId === user.id && r.clockOut === null && r.clockIn.toDateString() === new Date().toDateString())
    : false

  return (
    <AppContext.Provider value={{ user, login, logout, lang, setLang, theme, setTheme, company, setCompany, users, createUser, approveUser, deactivateUser, notifications, markAllRead, unreadCount, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum, billQueue, requestBill, clearBillRequest, menuItems, setMenuItems, menuCategories, setMenuCategories, inventoryItems, setInventoryItems, customers, createCustomer, updateCustomer, deleteCustomer, clockRecords, clockIn, clockOut, isClockedIn }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
