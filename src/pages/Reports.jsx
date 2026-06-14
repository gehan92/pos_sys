import { StatCard, Card } from '../components/UI'

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

export default Reports
