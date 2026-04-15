import { createContext, useContext, useState, useEffect } from 'react'
import { SAMPLE_ORDERS } from '../lib/mockData'

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
  superadmin: ['dashboard','company','users','reports','settings','audit'],
  admin:      ['dashboard','users','tables','orders','billing','inventory','menu','reports','settings'],
  owner:      ['dashboard','reports','users','billing','settings'],
  manager:    ['dashboard','users','shifts','inventory','orders'],
  cashier:    ['billing','orders','receipts'],
  supervisor: ['dashboard','supervisor','orders','reports'],
  waiter:     ['tables','orders'],
  cook:       ['kitchen'],
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
  const [company, setCompany] = useState({ name: 'Bella Vista Malta', address: '123 Republic Street, Valletta', currency: 'EUR', vat_rate: 18, receipt_footer: 'Thank you — Grazzi — Grazie' })
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

  return (
    <AppContext.Provider value={{ user, login, logout, lang, setLang, theme, setTheme, company, setCompany, notifications, markAllRead, unreadCount, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
