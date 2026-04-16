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
  superadmin: ['dashboard','company','users','inventory','menu','reports','settings','audit'],
  admin:      ['dashboard','users','tables','billing','inventory','menu','reports','settings'],
  owner:      ['dashboard','reports','users','billing','inventory','menu','settings'],
  manager:    ['dashboard','users','shifts','inventory','menu'],
  cashier:    ['billing','receipts','shifts'],
  supervisor: ['dashboard','supervisor','reports','shifts'],
  waiter:     ['tables','orders','shifts'],
  cook:       ['kitchen','shifts'],
  supplier:   ['inventory','invoices'],
}

export const NAV_ICONS = {
  dashboard:'🏠', company:'🏢', users:'👥', reports:'📊', settings:'⚙️', audit:'🔒',
  tables:'🍽️', orders:'📋', billing:'💰', inventory:'📦', menu:'🗂️',
  cashier:'💰', receipts:'🖨️', supervisor:'👁️', shifts:'🗓️', kitchen:'👨‍🍳',
  invoices:'📄', notifications:'🔔',
}

const DEMO_USERS = [
  { id:'1', full_name:'Super Admin', username:'superadmin', password:'Admin@1234', role:'superadmin', status:'active' },
  { id:'2', full_name:'Admin User',  username:'admin',      password:'Admin@1234', role:'admin',      status:'active' },
  { id:'3', full_name:'Anna Owner',  username:'owner',      password:'Admin@1234', role:'owner',      status:'active' },
  { id:'4', full_name:'Marco Manager',username:'manager',   password:'Admin@1234', role:'manager',    status:'active' },
  { id:'5', full_name:'John Cashier',username:'cashier',    password:'Admin@1234', role:'cashier',    status:'active' },
  { id:'6', full_name:'Sam Supervisor',username:'supervisor',password:'Admin@1234',role:'supervisor', status:'active' },
  { id:'7', full_name:'Maria Waiter', username:'waiter',    password:'Admin@1234', role:'waiter',     status:'active' },
  { id:'8', full_name:'Tony Cook',   username:'cook',       password:'Admin@1234', role:'cook',       status:'active' },
  { id:'9', full_name:'Rita Supplier',username:'supplier',  password:'Admin@1234', role:'supplier',   status:'active' },
]

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [lang, setLang]           = useState('en')
  const [theme, setTheme]         = useState('light')
  const [liveOrders, setLiveOrders] = useState(SAMPLE_ORDERS)
  const [nextOrderNum, setNextOrderNum] = useState(50)
  const [menuItems, setMenuItems] = useState(MENU_ITEMS)
  const [menuCategories, setMenuCategories] = useState(MENU_CATEGORIES)
  const [inventoryItems, setInventoryItems] = useState(INVENTORY_ITEMS)
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

  function login(username, password, role) {
    const found = DEMO_USERS.find(u => u.username === username || u.role === role)
    if (found) { setUser(found); return { success: true } }
    return { success: false, error: 'Invalid credentials' }
  }

  function logout() { setUser(null) }

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
    <AppContext.Provider value={{ user, login, logout, lang, setLang, theme, setTheme, company, setCompany, notifications, markAllRead, unreadCount, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum, billQueue, requestBill, clearBillRequest, menuItems, setMenuItems, menuCategories, setMenuCategories, inventoryItems, setInventoryItems, clockRecords, clockIn, clockOut, isClockedIn }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
