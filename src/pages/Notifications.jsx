import { useApp } from '../context/AppContext'
import { Card, Btn } from '../components/UI'

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

export default Notifications
