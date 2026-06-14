import { Card, Table, TR, TD, Badge } from '../components/UI'

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

export default Audit
