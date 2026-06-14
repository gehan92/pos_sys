import { StatCard, Card, Table, TR, TD, Badge, Avatar, statusColor } from '../components/UI'

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

export default Supervisor
