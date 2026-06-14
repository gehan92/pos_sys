import { Card, Table, TR, TD, Badge, Btn, statusColor } from '../components/UI'
import { SUPPLIER_INVOICES } from '../lib/mockData'

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

export default Invoices
