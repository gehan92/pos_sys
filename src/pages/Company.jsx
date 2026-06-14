import { Card, Table, TR, TD, Badge, Btn, statusColor } from '../components/UI'

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

export default Company
