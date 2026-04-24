export const MENU_CATEGORIES = [
  { id: 'cat1', name_en: 'Starters',  name_mt: 'Antipasti',        name_it: 'Antipasti', icon: '🥗' },
  { id: 'cat2', name_en: 'Mains',     name_mt: 'Platti Ewlenin',   name_it: 'Secondi',   icon: '🍽️' },
  { id: 'cat3', name_en: 'Specials',  name_mt: 'Speċjali tal-Ġurnata', name_it: 'Speciali', icon: '⭐' },
  { id: 'cat4', name_en: 'Drinks',    name_mt: 'Xorb',             name_it: 'Bevande',   icon: '🍷' },
  { id: 'cat5', name_en: 'Desserts',  name_mt: 'Ħelu',             name_it: 'Dolci',     icon: '🍮' },
]

export const MENU_ITEMS = [
  // ── Starters ─────────────────────────────────────────────────────────────────
  {
    id:'s1', code:'S001', barcode:'5990000001', category_id:'cat1', station:'kitchen',
    name_en:'Oysters Gilardeau', price:4.50, description_en:'Premium oysters, priced per piece',
    available:true, emoji:'🦪',
    modifierGroups:[
      { label:'Pieces', multi:false, choices:['×1','×2','×3','×4','×6','×12'] },
      { label:'Dressing', multi:true, choices:['Lemon','Shallot vinegar','Tobasco','Plain'] },
    ],
  },
  {
    id:'s2', code:'S002', barcode:'5990000002', category_id:'cat1', station:'kitchen',
    name_en:'Maltese Sausage', price:8.50, description_en:'Traditional Maltese sausage, grilled',
    available:true, emoji:'🌭',
    modifierGroups:[
      { label:'Cooking', multi:false, choices:['Grilled','Pan-fried'] },
      { label:'Extras', multi:true, choices:['Caramelised onions','Side bread','Extra mustard'] },
    ],
  },
  {
    id:'s3', code:'S003', barcode:'5990000003', category_id:'cat1', station:'kitchen',
    name_en:'Tuna & Gambas', price:12.00, description_en:'Fresh tuna with king prawns',
    available:true, emoji:'🐟',
    modifierGroups:[
      { label:'Extras', multi:true, choices:['Extra gambas','Sauce on side','No lemon','Gluten free'] },
    ],
  },
  {
    id:'s4', code:'S004', barcode:'5990000004', category_id:'cat1', station:'kitchen',
    name_en:'Fried Calamari', price:9.50, description_en:'Crispy fried squid rings with aioli',
    available:true, emoji:'🦑',
    modifierGroups:[
      { label:'Sauce', multi:false, choices:['Aioli','Tartare','Lemon butter'] },
      { label:'Extras', multi:true, choices:['Extra lemon','Extra sauce','No aioli'] },
    ],
  },
  {
    id:'s5', code:'S005', barcode:'5990000005', category_id:'cat1', station:'kitchen',
    name_en:'Mussels', price:11.00, description_en:'Fresh mussels in white wine & garlic',
    available:true, emoji:'🐚',
    modifierGroups:[
      { label:'Sauce', multi:false, choices:['White wine & garlic','Tomato & chili','Cream sauce'] },
      { label:'Extras', multi:true, choices:['Extra bread','No garlic','Extra sauce'] },
    ],
  },
  {
    id:'s6', code:'S006', barcode:'5990000006', category_id:'cat1', station:'kitchen',
    name_en:'Homemade Soup', price:7.00, description_en:"Chef's daily homemade soup",
    available:true, emoji:'🍲',
    modifierGroups:[
      { label:'Extras', multi:true, choices:['Side bread','Gluten free','No cream','Extra portion'] },
    ],
  },
  {
    id:'s7', code:'S007', barcode:'5990000007', category_id:'cat1', station:'kitchen',
    name_en:'Fried Flying Fish', price:10.50, description_en:'Lightly battered Maltese flying fish',
    available:true, emoji:'🐠',
    modifierGroups:[
      { label:'Sauce', multi:false, choices:['Tartare','Aioli','Lemon','No sauce'] },
      { label:'Extras', multi:true, choices:['Side salad','Extra lemon'] },
    ],
  },
  {
    id:'s8', code:'S008', barcode:'5990000008', category_id:'cat1', station:'kitchen',
    name_en:'Bruschetta', price:6.50, description_en:'Toasted bread with tomato, basil & olive oil',
    available:true, emoji:'🥖',
    modifierGroups:[
      { label:'Topping', multi:true, choices:['Add mozzarella','Add prosciutto','Extra tomato','No garlic'] },
    ],
  },

  // ── Mains ──────────────────────────────────────────────────────────────────
  {
    id:'m1', code:'M001', barcode:'5990000009', category_id:'cat2', station:'kitchen',
    name_en:'Spaghetti with Mussels', price:16.50, description_en:'Crab & prawn bisque with fresh mussels',
    available:true, emoji:'🍝',
    modifierGroups:[
      { label:'Spice level', multi:false, choices:['Mild','Medium','Spicy'] },
      { label:'Extras', multi:true, choices:['Extra mussels','Sauce on side','Gluten free pasta','No chili'] },
    ],
  },
  {
    id:'m2', code:'M002', barcode:'5990000010', category_id:'cat2', station:'kitchen',
    name_en:'Tagliatelle', price:15.50, description_en:'Artichokes, chili & tomato sauce',
    available:true, emoji:'🍝',
    modifierGroups:[
      { label:'Spice level', multi:false, choices:['Mild','Medium','Spicy'] },
      { label:'Extras', multi:true, choices:['Extra parmesan','No chili','Gluten free pasta','Add chicken'] },
    ],
  },
  {
    id:'m3', code:'M003', barcode:'5990000011', category_id:'cat2', station:'kitchen',
    name_en:'Black Angus Ribeye', price:32.00, description_en:'Premium Black Angus ribeye 300g',
    available:true, emoji:'🥩',
    modifierGroups:[
      { label:'Cooking level', multi:false, choices:['Rare','Medium Rare','Medium','Medium Well','Well Done'] },
      { label:'Sauce', multi:false, choices:['Peppercorn','Béarnaise','Garlic butter','No sauce'] },
      { label:'Side', multi:true, choices:['Extra fries','Side salad','Grilled vegetables','No side'] },
    ],
  },
  {
    id:'m4', code:'M004', barcode:'5990000012', category_id:'cat2', station:'kitchen',
    name_en:'Fried Rabbit', price:18.00, description_en:'Traditional Maltese fried rabbit with herbs',
    available:true, emoji:'🍗',
    modifierGroups:[
      { label:'Style', multi:false, choices:['Traditional','Extra crispy'] },
      { label:'Side', multi:true, choices:['Roasted potatoes','Side salad','Grilled vegetables','Extra herbs'] },
    ],
  },
  {
    id:'m5', code:'M005', barcode:'5990000013', category_id:'cat2', station:'kitchen',
    name_en:'Tagliata', price:26.00, description_en:'Sliced beef with rocket & parmesan',
    available:true, emoji:'🥩',
    modifierGroups:[
      { label:'Cooking level', multi:false, choices:['Rare','Medium Rare','Medium'] },
      { label:'Extras', multi:true, choices:['Extra parmesan','No rocket','Balsamic glaze','Side bread'] },
    ],
  },
  {
    id:'m6', code:'M006', barcode:'5990000014', category_id:'cat2', station:'kitchen',
    name_en:'Baked Salmon', price:22.00, description_en:'Salmon fillet baked with king prawns',
    available:true, emoji:'🐟',
    modifierGroups:[
      { label:'Sauce', multi:false, choices:['Lemon butter','Cream & dill','No sauce'] },
      { label:'Extras', multi:true, choices:['Extra prawns','Side salad','No capers','Gluten free'] },
    ],
  },

  // ── Specials of the Day ───────────────────────────────────────────────────
  {
    id:'sp1', code:'SP001', barcode:'5990000015', category_id:'cat3', station:'kitchen',
    name_en:'Ricotta Polpette', price:9.00, description_en:'Special starter: ricotta balls with herb crust',
    available:true, emoji:'⭐',
    modifierGroups:[
      { label:'Sauce', multi:false, choices:['Tomato basil','Cream','No sauce'] },
    ],
  },
  {
    id:'sp2', code:'SP002', barcode:'5990000016', category_id:'cat3', station:'kitchen',
    name_en:'Lamb Chops', price:28.00, description_en:'Special main: lamb chops in butter & garlic',
    available:true, emoji:'🍖',
    modifierGroups:[
      { label:'Cooking level', multi:false, choices:['Rare','Medium Rare','Medium','Well Done'] },
      { label:'Extras', multi:true, choices:['Extra garlic butter','Mint sauce','Roasted potatoes','Grilled vegetables'] },
    ],
  },

  // ── Drinks ────────────────────────────────────────────────────────────────
  {
    id:'d1', code:'D001', barcode:'5990000017', category_id:'cat4', station:'bar',
    name_en:'House Wine', price:6.00, description_en:'Red, white or rosé — 175ml',
    available:true, emoji:'🍷',
    modifierGroups:[
      { label:'Type', multi:false, choices:['Red','White','Rosé'] },
    ],
  },
  {
    id:'d2', code:'D002', barcode:'5990000018', category_id:'cat4', station:'bar',
    name_en:'Local Beer (Cisk)', price:4.50, description_en:'Maltese Cisk Lager, draught or bottle',
    available:true, emoji:'🍺',
    modifierGroups:[
      { label:'Type', multi:false, choices:['Draught','Bottle'] },
    ],
  },
  {
    id:'d3', code:'D003', barcode:'5990000019', category_id:'cat4', station:'bar',
    name_en:'Soft Drink', price:3.00, description_en:'Cola, Fanta, Water',
    available:true, emoji:'🥤',
    modifierGroups:[
      { label:'Choice', multi:false, choices:['Cola','Diet Cola','Fanta','Sparkling Water','Still Water','Orange Juice'] },
    ],
  },
  {
    id:'d4', code:'D004', barcode:'5990000020', category_id:'cat4', station:'bar',
    name_en:'Coffee', price:2.50, description_en:'Espresso, Flat White, Latte, Cappuccino',
    available:true, emoji:'☕',
    modifierGroups:[
      { label:'Type', multi:false, choices:['Espresso','Double Espresso','Flat White','Latte','Cappuccino','Americano'] },
      { label:'Extras', multi:true, choices:['Oat milk','Extra shot','Decaf','No sugar'] },
    ],
  },

  // ── Desserts ──────────────────────────────────────────────────────────────
  {
    id:'w1', code:'W001', barcode:'5990000021', category_id:'cat5', station:'kitchen',
    name_en:'Tiramisu', price:7.00, description_en:'Classic Italian tiramisu',
    available:true, emoji:'🍮', modifierGroups:[],
  },
  {
    id:'w2', code:'W002', barcode:'5990000022', category_id:'cat5', station:'kitchen',
    name_en:'Cheesecake', price:6.50, description_en:'With berry compote',
    available:true, emoji:'🍰',
    modifierGroups:[
      { label:'Extras', multi:true, choices:['Extra berries','Whipped cream','Ice cream side'] },
    ],
  },
  {
    id:'w3', code:'W003', barcode:'5990000023', category_id:'cat5', station:'kitchen',
    name_en:'Ice Cream', price:5.00, description_en:'3 scoops, choice of flavour',
    available:true, emoji:'🍦',
    modifierGroups:[
      { label:'Flavour', multi:true, choices:['Vanilla','Chocolate','Strawberry','Pistachio','Lemon sorbet'] },
    ],
  },
]

export const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`, number: i + 1, capacity: 4,
  status: [3, 4, 6, 9, 12].includes(i + 1) ? 'occupied' : 'free',
  floor: 'Ground',
}))

export const SAMPLE_ORDERS = [
  { id:'o1', order_number:47, table_id:'t3', table_number:3, order_type:'dinein',  status:'cooking', kitchenStatus:'cooking', barStatus:'pending', waiter:'Maria G.', notes:'Nut allergy. Extra napkins.', created_at:'14:32', items:[{name:'Pasta Carbonara',qty:2,price:14.50,station:'kitchen'},{name:'House Wine',qty:1,price:6.00,station:'bar'},{name:'Tiramisu',qty:1,price:7.00,station:'kitchen'}] },
  { id:'o2', order_number:48, table_id:null, table_number:null, order_type:'takeaway', status:'ready', kitchenStatus:'ready', barStatus:'pending', waiter:'John C.', notes:'',  created_at:'14:20', items:[{name:'Margherita Pizza',qty:1,price:12.00,station:'kitchen'},{name:'Local Beer (Cisk)',qty:2,price:4.50,station:'bar'}] },
  { id:'o3', order_number:49, table_id:'t7', table_number:7, order_type:'dinein',  status:'pending', kitchenStatus:'pending', barStatus:'pending', waiter:'Sam V.',  notes:'Lactose intolerant.', created_at:'14:15', items:[{name:'Grilled Sea Bass',qty:1,price:22.00,station:'kitchen'},{name:'Mixed Salad',qty:1,price:8.50,station:'kitchen'},{name:'Soft Drink',qty:2,price:3.00,station:'bar'}] },
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
