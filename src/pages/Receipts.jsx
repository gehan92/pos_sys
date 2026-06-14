import { Card, Badge, Btn } from '../components/UI'
import { SAMPLE_INVOICES } from '../lib/mockData'

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

export default Receipts
