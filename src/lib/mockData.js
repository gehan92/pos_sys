export const MENU_CATEGORIES = [
  { id: 'cat1', name_en: 'Starters', name_mt: 'Antipasti', name_it: 'Antipasti', icon: '🥗' },
  { id: 'cat2', name_en: 'Mains',    name_mt: 'Platti Ewlenin', name_it: 'Secondi', icon: '🍽️' },
  { id: 'cat3', name_en: 'Drinks',   name_mt: 'Xorb',     name_it: 'Bevande', icon: '🍷' },
  { id: 'cat4', name_en: 'Desserts', name_mt: 'Ħelu',     name_it: 'Dolci',   icon: '🍮' },
]

const _UX = (id, w=400) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&auto=format&q=85`

export const MENU_ITEMS = [
  { id:'m1',  code:'S001', barcode:'5990000001', category_id:'cat1', name_en:'Bruschetta',        price:7.50,  description_en:'Tomato & basil on grilled bread', available:true, emoji:'🥖', image_url: _UX('1572695157366-5e585ab2b69f') },
  { id:'m2',  code:'S002', barcode:'5990000002', category_id:'cat1', name_en:'Calamari',          price:9.00,  description_en:'Crispy fried squid rings',         available:true, emoji:'🦑', image_url: _UX('1599487488170-d11ec9c172f0') },
  { id:'m3',  code:'S003', barcode:'5990000003', category_id:'cat1', name_en:"Chef's Soup",       price:6.00,  description_en:'Daily special soup',               available:true, emoji:'🍲', image_url: _UX('1547592180-85f173990554') },
  { id:'m4',  code:'S004', barcode:'5990000004', category_id:'cat1', name_en:'Mixed Salad',       price:8.50,  description_en:'Fresh garden greens',              available:true, emoji:'🥗', image_url: _UX('1512621776951-a57141f2eefd') },
  { id:'m5',  code:'M001', barcode:'5990000005', category_id:'cat2', name_en:'Pasta Carbonara',   price:14.50, description_en:'Creamy pancetta & egg sauce',      available:true, emoji:'🍝', image_url: _UX('1473093295043-cdd812d0e601') },
  { id:'m6',  code:'M002', barcode:'5990000006', category_id:'cat2', name_en:'Grilled Sea Bass',  price:22.00, description_en:'With lemon butter & herbs',        available:true, emoji:'🐟', image_url: _UX('1467003909585-2f8a72700288') },
  { id:'m7',  code:'M003', barcode:'5990000007', category_id:'cat2', name_en:'Beef Burger',       price:13.50, description_en:'Brioche bun, lettuce, tomato',     available:true, emoji:'🍔', image_url: _UX('1568901346375-23c9450c58cd') },
  { id:'m8',  code:'M004', barcode:'5990000008', category_id:'cat2', name_en:'Margherita Pizza',  price:12.00, description_en:'Classic tomato & mozzarella',      available:true, emoji:'🍕', image_url: _UX('1565299624946-b28f40a0ae38') },
  { id:'m9',  code:'M005', barcode:'5990000009', category_id:'cat2', name_en:'Lamb Chops',        price:24.00, description_en:'Maltese herbs & rosemary',         available:true, emoji:'🍖', image_url: _UX('1544025162-d76538147789') },
  { id:'m10', code:'M006', barcode:'5990000010', category_id:'cat2', name_en:'Seasonal Risotto',  price:15.00, description_en:'Creamy vegetable risotto',         available:true, emoji:'🍚', image_url: _UX('1476124369491-e7addf5db371') },
  { id:'m11', code:'D001', barcode:'5990000011', category_id:'cat3', name_en:'House Wine',        price:6.00,  description_en:'Red or white, 175ml',              available:true, emoji:'🍷', image_url: _UX('1510812431401-41d2bd2722f3') },
  { id:'m12', code:'D002', barcode:'5990000012', category_id:'cat3', name_en:'Local Beer (Cisk)', price:4.50,  description_en:'Maltese Cisk Lager',               available:true, emoji:'🍺', image_url: _UX('1535958636474-b021ee887b13') },
  { id:'m13', code:'D003', barcode:'5990000013', category_id:'cat3', name_en:'Soft Drink',        price:3.00,  description_en:'Cola, Fanta, Water',               available:true, emoji:'🥤', image_url: _UX('1554866585-cd94860890b7') },
  { id:'m14', code:'D004', barcode:'5990000014', category_id:'cat3', name_en:'Coffee',            price:2.50,  description_en:'Espresso, Flat White, Latte',      available:true, emoji:'☕', image_url: _UX('1509042239860-f55ce3369de5') },
  { id:'m15', code:'W001', barcode:'5990000015', category_id:'cat4', name_en:'Tiramisu',          price:7.00,  description_en:'Classic Italian dessert',          available:true, emoji:'🍮', image_url: _UX('1571877227200-a0d98ea607e9') },
  { id:'m16', code:'W002', barcode:'5990000016', category_id:'cat4', name_en:'Cheesecake',        price:6.50,  description_en:'With berry compote',               available:true, emoji:'🍰', image_url: _UX('1533134242443-d4fd215305ad') },
  { id:'m17', code:'W003', barcode:'5990000017', category_id:'cat4', name_en:'Ice Cream',         price:5.00,  description_en:'3 scoops, choice of flavour',      available:true, emoji:'🍦', image_url: _UX('1497034825429-c343d7c6a68f') },
]

export const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`, number: i + 1, capacity: 4,
  status: [3, 4, 6, 9, 12].includes(i + 1) ? 'occupied' : 'free',
  floor: 'Ground',
}))

export const SAMPLE_ORDERS = [
  { id:'o1', order_number:47, table_id:'t3', table_number:3, order_type:'dinein',  status:'cooking', waiter:'Maria G.', notes:'Nut allergy. Extra napkins.', created_at:'14:32', items:[{name:'Pasta Carbonara',qty:2,price:14.50},{name:'House Wine',qty:1,price:6.00},{name:'Tiramisu',qty:1,price:7.00}] },
  { id:'o2', order_number:48, table_id:null, table_number:null, order_type:'takeaway', status:'ready', waiter:'John C.', notes:'',  created_at:'14:20', items:[{name:'Margherita Pizza',qty:1,price:12.00},{name:'Local Beer (Cisk)',qty:2,price:4.50}] },
  { id:'o3', order_number:49, table_id:'t7', table_number:7, order_type:'dinein',  status:'pending', waiter:'Sam V.',  notes:'Lactose intolerant.', created_at:'14:15', items:[{name:'Grilled Sea Bass',qty:1,price:22.00},{name:'Mixed Salad',qty:1,price:8.50},{name:'Soft Drink',qty:2,price:3.00}] },
]

export const SAMPLE_USERS = [
  { id:'u1', full_name:'Maria Galea',    username:'mgalea',  role:'waiter',   status:'pending',  created_by:'Manager' },
  { id:'u2', full_name:'John Camilleri', username:'jcam',    role:'cashier',  status:'active',   created_by:'Admin' },
  { id:'u3', full_name:'Anna Borg',      username:'aborg',   role:'manager',  status:'active',   created_by:'Owner' },
  { id:'u4', full_name:'Tony Farrugia',  username:'tfarr',   role:'cook',     status:'active',   created_by:'Manager' },
  { id:'u5', full_name:'Sam Vella',      username:'svella',  role:'supervisor',status:'active',  created_by:'Admin' },
  { id:'u6', full_name:'Rita Pace',      username:'rpace',   role:'supplier', status:'active',   created_by:'Admin' },
]

export const INVENTORY_ITEMS = [
  { id:'inv1', item_name:'Pasta',       quantity:12, unit:'kg',  min_stock:5  },
  { id:'inv2', item_name:'Olive Oil',   quantity:1,  unit:'L',   min_stock:5  },
  { id:'inv3', item_name:'Sea Bass',    quantity:8,  unit:'kg',  min_stock:3  },
  { id:'inv4', item_name:'House Wine',  quantity:3,  unit:'btl', min_stock:10 },
  { id:'inv5', item_name:'Flour',       quantity:1,  unit:'kg',  min_stock:5  },
  { id:'inv6', item_name:'Tomatoes',    quantity:15, unit:'kg',  min_stock:8  },
  { id:'inv7', item_name:'Beef',        quantity:6,  unit:'kg',  min_stock:4  },
  { id:'inv8', item_name:'Coffee Beans',quantity:2,  unit:'kg',  min_stock:5  },
]

export const SAMPLE_INVOICES = [
  { id:'inv1', invoice_number:312, order_number:43, table:'Table 4', type:'dinein', subtotal:60.59, vat:10.91, total:72.50, payment_method:'card', created_at:'14:28' },
  { id:'inv2', invoice_number:311, order_number:42, table:'Takeaway', type:'takeaway', subtotal:17.80, vat:3.20, total:21.00, payment_method:'cash', created_at:'14:05' },
  { id:'inv3', invoice_number:310, order_number:41, table:'Table 7', type:'dinein', subtotal:35.59, vat:6.41, total:42.00, payment_method:'mobile', created_at:'13:48' },
]

export const SUPPLIER_INVOICES = [
  { id:'si1', invoice_ref:'INV-088', supplier:'Tony Borg Supplies', items:'Olive Oil x10L, Flour x20kg', total:145.00, status:'pending', date:'Today' },
  { id:'si2', invoice_ref:'INV-087', supplier:'Fresh Farm Malta', items:'Beef x15kg, Tomatoes x20kg', total:210.00, status:'approved', date:'Yesterday' },
  { id:'si3', invoice_ref:'INV-086', supplier:'Wine Depot Malta', items:'House Wine x24btl', total:180.00, status:'delivered', date:'Apr 12' },
]
