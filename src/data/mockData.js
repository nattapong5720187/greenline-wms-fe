// ===== Greenline WMS — Mock Data =====

export const WAREHOUSES = [
  { id: 'WH01', code: 'WH01', name: 'คลังหลัก', description: 'คลังหลักโรงงาน', type: 'main', active: true },
  { id: 'WH02', code: 'WH02', name: 'ห้องเย็น 1', description: 'ห้องเย็นโรงงาน', type: 'cold', active: true },
  { id: 'WH03', code: 'WH03', name: 'ห้องเย็น 2', description: 'ห้องเย็นฝากภายนอก', type: 'cold_external', active: true },
]

export const CATEGORIES = [
  { id: 'CAT01', code: 'RM',    name: 'วัตถุดิบ',           color: '#3B82F6', requireLot: true,  hasExpiry: true  },
  { id: 'CAT02', code: 'CHEM',  name: 'สาร',                color: '#8B5CF6', requireLot: true,  hasExpiry: true  },
  { id: 'CAT03', code: 'LBL',   name: 'ฉลาก',               color: '#10B981', requireLot: false, hasExpiry: false },
  { id: 'CAT04', code: 'BOX',   name: 'กล่อง',               color: '#F59E0B', requireLot: false, hasExpiry: false },
  { id: 'CAT05', code: 'CRT',   name: 'ลัง',                 color: '#EF4444', requireLot: false, hasExpiry: false },
  { id: 'CAT06', code: 'CAN',   name: 'กระป๋อง/ฝา',          color: '#6B7280', requireLot: false, hasExpiry: false },
  { id: 'CAT07', code: 'BAG',   name: 'ถุง',                 color: '#EC4899', requireLot: false, hasExpiry: false },
  { id: 'CAT08', code: 'CHM2',  name: 'สารเคมี',             color: '#F97316', requireLot: true,  hasExpiry: true  },
  { id: 'CAT09', code: 'CONS1', name: 'สิ้นเปลืองผลิต',      color: '#14B8A6', requireLot: false, hasExpiry: false },
  { id: 'CAT10', code: 'CONS2', name: 'สิ้นเปลืองสำนักงาน',  color: '#A855F7', requireLot: false, hasExpiry: false },
  { id: 'CAT11', code: 'PM',    name: 'Premix',              color: '#84CC16', requireLot: true,  hasExpiry: true  },
]

export const UNITS = [
  { id: 'U01', code: 'KG',   name: 'กิโลกรัม',   abbr: 'kg'   },
  { id: 'U02', code: 'G',    name: 'กรัม',        abbr: 'g'    },
  { id: 'U03', code: 'L',    name: 'ลิตร',        abbr: 'L'    },
  { id: 'U04', code: 'ML',   name: 'มิลลิลิตร',   abbr: 'mL'   },
  { id: 'U05', code: 'PCS',  name: 'ชิ้น',        abbr: 'pcs'  },
  { id: 'U06', code: 'BOX',  name: 'กล่อง',       abbr: 'box'  },
  { id: 'U07', code: 'BAG',  name: 'ถุง',         abbr: 'bag'  },
  { id: 'U08', code: 'ROLL', name: 'ม้วน',        abbr: 'roll' },
  { id: 'U09', code: 'CAN',  name: 'กระป๋อง',     abbr: 'can'  },
  { id: 'U10', code: 'SET',  name: 'ชุด',         abbr: 'set'  },
]

export const MACHINES = [
  { id: 'MC01', machineId: 'HM-001', name: 'Homo Mixer 1',  type: 'homo mixer',   active: true },
  { id: 'MC02', machineId: 'HM-002', name: 'Homo Mixer 2',  type: 'homo mixer',   active: true },
  { id: 'MC03', machineId: 'RM-001', name: 'Ribbon Mixer 1', type: 'ribbon mixer', active: true },
  { id: 'MC04', machineId: 'RM-002', name: 'Ribbon Mixer 2', type: 'ribbon mixer', active: true }
]

export const MIXSIZES = [
  { id: 'MX01', size: 30, unitId: 'U01' },
  { id: 'MX02', size: 40, unitId: 'U01' },
  { id: 'MX03', size: 50, unitId: 'U01' },
]

export const SUPPLIERS = [
  { id: 'SUP001', code: 'SUP001', name: 'บริษัท อาหารสด จำกัด',       contact: 'คุณสมชาย', phone: '02-111-1111', active: true },
  { id: 'SUP002', code: 'SUP002', name: 'บริษัท เคมีภัณฑ์ไทย จำกัด',  contact: 'คุณสมหญิง', phone: '02-222-2222', active: true },
  { id: 'SUP003', code: 'SUP003', name: 'บริษัท บรรจุภัณฑ์ไทย จำกัด', contact: 'คุณมานี',   phone: '02-333-3333', active: true },
  { id: 'SUP004', code: 'SUP004', name: 'ห้างหุ้นส่วน วัตถุดิบดี',    contact: 'คุณปิติ',   phone: '089-444-4444', active: true },
  { id: 'SUP005', code: 'SUP005', name: 'บริษัท พรีมิกซ์โปร จำกัด',   contact: 'คุณพร',    phone: '081-555-5555', active: true },
]

export const PRODUCTS = [
  { id: 'P001', code: 'RM-001',  name: 'เนื้อไก่สด',             categoryId: 'CAT01', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH02', minStock: 500,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P002', code: 'RM-002',  name: 'เนื้อหมูสับ',            categoryId: 'CAT01', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH02', minStock: 300,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P003', code: 'RM-003',  name: 'แครอทหั่น',              categoryId: 'CAT01', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH02', minStock: 200,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P004', code: 'PM-001',  name: 'Premix A (สูตร 001)',     categoryId: 'CAT11', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 100,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P005', code: 'PM-002',  name: 'Premix B (สูตร 002)',     categoryId: 'CAT11', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 50,   requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P006', code: 'CHEM-001',name: 'วิตามิน C',               categoryId: 'CAT02', unitId: 'U02', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 5000, requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P007', code: 'CHEM-002',name: 'เกลือไนไตรท์',           categoryId: 'CAT02', unitId: 'U02', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 2000, requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P008', code: 'LBL-001', name: 'ฉลากสินค้า A',           categoryId: 'CAT03', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH01', minStock: 5000, requireLot: false, hasExpiry: false, active: true },
  { id: 'P009', code: 'BOX-001', name: 'กล่องบรรจุ 500g',         categoryId: 'CAT04', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH01', minStock: 1000, requireLot: false, hasExpiry: false, active: true },
  { id: 'P010', code: 'CRT-001', name: 'ลังกระดาษ (24 กล่อง)',    categoryId: 'CAT05', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH01', minStock: 500,  requireLot: false, hasExpiry: false, active: true },
  { id: 'P011', code: 'CAN-001', name: 'กระป๋อง 300g',            categoryId: 'CAT06', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH01', minStock: 2000, requireLot: false, hasExpiry: false, active: true },
  { id: 'P012', code: 'BAG-001', name: 'ถุง PE (50x70)',           categoryId: 'CAT07', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH01', minStock: 3000, requireLot: false, hasExpiry: false, active: true },
  { id: 'P013', code: 'CHM-001', name: 'น้ำยาล้างพื้น',           categoryId: 'CAT08', unitId: 'U03', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 50,   requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P014', code: 'CONS1-01',name: 'ถุงมือยาง (ผลิต)',        categoryId: 'CAT09', unitId: 'U06', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 20,   requireLot: false, hasExpiry: false, active: true },
  { id: 'P015', code: 'CONS2-01',name: 'กระดาษ A4',               categoryId: 'CAT10', unitId: 'U06', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 10,   requireLot: false, hasExpiry: false, active: true },
  { id: 'P016', code: 'SEMI-001',name: 'ซอสมะเขือเทศ (Semi)',      categoryId: 'CAT01', unitId: 'U01', stockStatus: 'Semi',      warehouseId: 'WH02', minStock: 200,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P017', code: 'FG-001',  name: 'ไก่กระป๋อง (สำเร็จรูป)', categoryId: 'CAT01', unitId: 'U05', stockStatus: 'FG',        warehouseId: 'WH02', minStock: 500,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P018', code: 'RM-004',  name: 'หัวหอมใหญ่',             categoryId: 'CAT01', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 100,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P019', code: 'RM-005',  name: 'กระเทียม',               categoryId: 'CAT01', unitId: 'U01', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 80,   requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P020', code: 'RM-006',  name: 'พริกไทย',                categoryId: 'CAT01', unitId: 'U02', stockStatus: 'RM',        warehouseId: 'WH01', minStock: 5000, requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P021', code: 'SEMI-002',name: 'ไก่ปรุงรส (Semi)',        categoryId: 'CAT01', unitId: 'U05', stockStatus: 'Semi',      warehouseId: 'WH02', minStock: 300,  requireLot: true,  hasExpiry: true,  active: true },
  { id: 'P022', code: 'SEMI-003',name: 'หมูสับผสมแครอท (Semi)',    categoryId: 'CAT01', unitId: 'U05', stockStatus: 'Semi',      warehouseId: 'WH02', minStock: 200,  requireLot: true,  hasExpiry: true,  active: true },
]

export const LOTS = [
  { id: 'LOT001', lotNo: 'LOT-2024-0601-001', productId: 'P001', supplierId: 'SUP001', receiveDate: '2024-06-01', expiryDate: '2024-06-08', qty: 800,  remaining: 320, warehouseId: 'WH02', status: 'active' },
  { id: 'LOT002', lotNo: 'LOT-2024-0605-001', productId: 'P001', supplierId: 'SUP001', receiveDate: '2024-06-05', expiryDate: '2024-06-12', qty: 600,  remaining: 600, warehouseId: 'WH02', status: 'active' },
  { id: 'LOT003', lotNo: 'LOT-2024-0601-002', productId: 'P002', supplierId: 'SUP001', receiveDate: '2024-06-01', expiryDate: '2024-06-08', qty: 400,  remaining: 180, warehouseId: 'WH02', status: 'active' },
  { id: 'LOT004', lotNo: 'LOT-2024-0603-001', productId: 'P004', supplierId: 'SUP005', receiveDate: '2024-06-03', expiryDate: '2024-09-03', qty: 200,  remaining: 145, warehouseId: 'WH01', status: 'active' },
  { id: 'LOT005', lotNo: 'LOT-2024-0603-002', productId: 'P006', supplierId: 'SUP002', receiveDate: '2024-06-03', expiryDate: '2025-06-03', qty: 10000,remaining: 8200,warehouseId: 'WH01', status: 'active' },
  { id: 'LOT006', lotNo: 'LOT-2024-0602-001', productId: 'P003', supplierId: 'SUP001', receiveDate: '2024-06-02', expiryDate: '2024-06-09', qty: 300,  remaining: 90,  warehouseId: 'WH02', status: 'active' },
  { id: 'LOT007', lotNo: 'LOT-2024-0604-001', productId: 'P013', supplierId: 'SUP002', receiveDate: '2024-06-04', expiryDate: '2025-06-04', qty: 100,  remaining: 72,  warehouseId: 'WH01', status: 'active' },
  { id: 'LOT008', lotNo: 'LOT-2024-0601-003', productId: 'P016', supplierId: null,     receiveDate: '2024-06-01', expiryDate: '2024-06-15', qty: 500,  remaining: 320, warehouseId: 'WH02', status: 'hold'   },
]

export const STOCK = [
  { id: 'S001', productId: 'P001', warehouseId: 'WH02', qty: 920,  stockStatus: 'RM'   },
  { id: 'S002', productId: 'P002', warehouseId: 'WH02', qty: 180,  stockStatus: 'RM'   },
  { id: 'S003', productId: 'P003', warehouseId: 'WH02', qty: 90,   stockStatus: 'RM'   },
  { id: 'S004', productId: 'P004', warehouseId: 'WH01', qty: 145,  stockStatus: 'RM'   },
  { id: 'S005', productId: 'P005', warehouseId: 'WH01', qty: 30,   stockStatus: 'RM'   },
  { id: 'S006', productId: 'P006', warehouseId: 'WH01', qty: 8200, stockStatus: 'RM'   },
  { id: 'S007', productId: 'P007', warehouseId: 'WH01', qty: 3500, stockStatus: 'RM'   },
  { id: 'S008', productId: 'P008', warehouseId: 'WH01', qty: 12000,stockStatus: 'FG'   },
  { id: 'S009', productId: 'P009', warehouseId: 'WH01', qty: 800,  stockStatus: 'FG'   },
  { id: 'S010', productId: 'P010', warehouseId: 'WH01', qty: 600,  stockStatus: 'FG'   },
  { id: 'S011', productId: 'P011', warehouseId: 'WH01', qty: 4500, stockStatus: 'FG'   },
  { id: 'S012', productId: 'P012', warehouseId: 'WH01', qty: 8000, stockStatus: 'FG'   },
  { id: 'S013', productId: 'P013', warehouseId: 'WH01', qty: 72,   stockStatus: 'RM'   },
  { id: 'S014', productId: 'P014', warehouseId: 'WH01', qty: 15,   stockStatus: 'RM'   },
  { id: 'S015', productId: 'P015', warehouseId: 'WH01', qty: 25,   stockStatus: 'RM'   },
  { id: 'S016', productId: 'P016', warehouseId: 'WH02', qty: 320,  stockStatus: 'Hold' },
  { id: 'S017', productId: 'P017', warehouseId: 'WH02', qty: 1200, stockStatus: 'FG'   },
  { id: 'S018', productId: 'P018', warehouseId: 'WH01', qty: 55,   stockStatus: 'RM'   },
  { id: 'S019', productId: 'P019', warehouseId: 'WH01', qty: 40,   stockStatus: 'RM'   },
  { id: 'S020', productId: 'P020', warehouseId: 'WH01', qty: 3800, stockStatus: 'RM'   },
  { id: 'S021', productId: 'P021', warehouseId: 'WH02', qty: 1500, stockStatus: 'Semi' },
  { id: 'S022', productId: 'P022', warehouseId: 'WH02', qty: 800,  stockStatus: 'Semi' },
]

export const USERS = [
  { id: 'USR001', username: 'admin',      password: '123456', name: 'ผู้ดูแลระบบ',        role: 'super_admin',     warehouseId: null,   active: true, email: 'admin@greenline.com'   },
  { id: 'USR002', username: 'wh_staff01', password: '123456', name: 'นาย สมศักดิ์ มั่นคง', role: 'warehouse_staff', warehouseId: 'WH01', active: true, email: 'staff01@greenline.com' },
  { id: 'USR003', username: 'wh_staff02', password: '123456', name: 'นางสาว รัตนา ดีใจ',   role: 'warehouse_staff', warehouseId: 'WH02', active: true, email: 'staff02@greenline.com' },
  { id: 'USR004', username: 'dc_user',    password: '123456', name: 'นาง เอมอร สุขใจ',    role: 'doc_control',     warehouseId: null,   active: true, email: 'dc@greenline.com'      },
]

let _docCounter = { GR: 5, RQ: 8, RT: 3 }
export const generateDocNo = (type) => {
  const today = new Date()
  const yy = String(today.getFullYear()).slice(2)
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const dateStr = `${yy}${mm}${dd}`
  const prefixMap = { GR: 'GR', RQ: 'RQ', RT: 'RT' }
  const prefix = prefixMap[type] || 'DOC'
  _docCounter[type] = (_docCounter[type] || 0) + 1
  return `${prefix}-${dateStr}-${String(_docCounter[type]).padStart(3, '0')}`
}

export const DOCUMENTS = [
  {
    id: 'DOC001', docNo: 'GR-240601-001', type: 'receipt', status: 'approved',
    warehouseId: 'WH02', createdBy: 'USR002', approvedBy: 'USR001',
    createdAt: '2024-06-01T08:30:00', updatedAt: '2024-06-01T09:00:00',
    remark: 'รับวัตถุดิบจาก Supplier ประจำสัปดาห์',
    items: [
      { id: 'DI001', productId: 'P001', qty: 800, unitId: 'U01', lotId: 'LOT001', supplierId: 'SUP001' },
      { id: 'DI002', productId: 'P002', qty: 400, unitId: 'U01', lotId: 'LOT003', supplierId: 'SUP001' },
    ]
  },
  {
    id: 'DOC002', docNo: 'RQ-240601-001', type: 'requisition', status: 'issued',
    warehouseId: 'WH02', createdBy: 'USR002', approvedBy: 'USR001', issuedBy: 'USR002',
    createdAt: '2024-06-01T10:00:00', updatedAt: '2024-06-01T11:00:00',
    remark: 'เบิกเนื้อไก่เพื่อผลิต Batch #001',
    items: [
      { id: 'DI003', productId: 'P001', qty: 480, unitId: 'U01', lotId: 'LOT001' },
      { id: 'DI004', productId: 'P003', qty: 210, unitId: 'U01', lotId: 'LOT006' },
    ]
  },
  {
    id: 'DOC003', docNo: 'RQ-240603-001', type: 'requisition', status: 'pending',
    warehouseId: 'WH01', createdBy: 'USR002', approvedBy: null,
    createdAt: '2024-06-03T09:00:00', updatedAt: '2024-06-03T09:00:00',
    remark: 'เบิก Premix สำหรับเครื่องผสมซอส',
    items: [
      { id: 'DI005', productId: 'P004', qty: 55, unitId: 'U01', lotId: 'LOT004' },
    ]
  },
  {
    id: 'DOC004', docNo: 'RT-240602-001', type: 'return', status: 'approved',
    warehouseId: 'WH02', createdBy: 'USR002', approvedBy: 'USR001',
    createdAt: '2024-06-02T14:00:00', updatedAt: '2024-06-02T14:30:00',
    remark: 'คืนเนื้อหมูที่เหลือจากการผลิต',
    items: [
      { id: 'DI006', productId: 'P002', qty: 50, unitId: 'U01', lotId: 'LOT003' },
    ]
  },
  {
    id: 'DOC005', docNo: 'GR-240603-001', type: 'receipt', status: 'draft',
    warehouseId: 'WH01', createdBy: 'USR004', approvedBy: null,
    createdAt: '2024-06-03T08:00:00', updatedAt: '2024-06-03T08:00:00',
    remark: 'รับ Premix และสารเคมี',
    items: [
      { id: 'DI007', productId: 'P004', qty: 200, unitId: 'U01', lotId: null, supplierId: 'SUP005' },
      { id: 'DI008', productId: 'P006', qty: 10000, unitId: 'U02', lotId: null, supplierId: 'SUP002' },
    ]
  },
]

export const HOLD_ITEMS = [
  {
    id: 'HLD001', productId: 'P016', lotId: 'LOT008', warehouseId: 'WH02',
    qty: 320, reason: 'ไม่ผ่าน Retort — หม้ออัดไอน้ำขัดข้อง',
    heldBy: 'USR001', heldAt: '2024-06-01T12:00:00', status: 'hold',
    resolvedAt: null, resolvedBy: null, resolution: null,
  },
]

export const STOCK_TRANSFERS = [
  {
    id: 'TRF001', transferNo: 'TRF-240604-001',
    fromWarehouseId: 'WH02', toWarehouseId: 'WH03',
    productId: 'P017', lotId: null, qty: 500,
    reason: 'ห้องเย็น WH02 เต็ม ฝากแช่ WH03',
    transferredBy: 'USR001', transferredAt: '2024-06-04T08:00:00', status: 'completed',
  },
]

export const NOTIFICATIONS = [
  { id: 'N001', type: 'min_stock', productId: 'P002', warehouseId: 'WH02', message: 'สต๊อก เนื้อหมูสับ ต่ำกว่าขั้นต่ำ (180 < 300 kg)', createdAt: '2024-06-03T06:00:00', read: false },
  { id: 'N002', type: 'min_stock', productId: 'P003', warehouseId: 'WH02', message: 'สต๊อก แครอทหั่น ต่ำกว่าขั้นต่ำ (90 < 200 kg)', createdAt: '2024-06-03T06:00:00', read: false },
  { id: 'N003', type: 'min_stock', productId: 'P014', warehouseId: 'WH01', message: 'สต๊อก ถุงมือยาง (ผลิต) ต่ำกว่าขั้นต่ำ (15 < 20 box)', createdAt: '2024-06-03T06:00:00', read: true  },
  { id: 'N004', type: 'min_stock', productId: 'P005', warehouseId: 'WH01', message: 'สต๊อก Premix B ต่ำกว่าขั้นต่ำ (30 < 50 kg)', createdAt: '2024-06-04T06:00:00', read: false },
  { id: 'N005', type: 'hold',      productId: 'P016', warehouseId: 'WH02', message: 'สินค้าถูก Hold: ซอสมะเขือเทศ (Semi) LOT-2024-0601-003', createdAt: '2024-06-01T12:05:00', read: true  },
]

// ===== Phase 2: Production & Formula =====

export const FORMULAS = [
  {
    id: 'FML001', code: 'FML-001', name: 'ไก่กระป๋องในซอสมะเขือเทศ', machineType: 'sauce',
    semiProductId: 'P016', outputProductId: 'P017',
    mixsizeIds: ['MX01', 'MX02'],
    bomByMixsize: {
      MX01: {
        premix: [{ productId: 'P004', qtyPerBatch: 15, unitId: 'U01' }],
        ingredients: [
          { productId: 'P001', qtyPerBatch: 80,  unitId: 'U01' },
          { productId: 'P006', qtyPerBatch: 500, unitId: 'U02' },
          { productId: 'P007', qtyPerBatch: 200, unitId: 'U02' },
        ],
      },
      MX02: {
        premix: [{ productId: 'P004', qtyPerBatch: 20, unitId: 'U01' }],
        ingredients: [
          { productId: 'P001', qtyPerBatch: 100, unitId: 'U01' },
          { productId: 'P006', qtyPerBatch: 650, unitId: 'U02' },
          { productId: 'P007', qtyPerBatch: 260, unitId: 'U02' },
        ],
      },
    },
    ingredients: [
      { productId: 'P001', qtyPerBatch: 80,  unitId: 'U01' },
      { productId: 'P004', qtyPerBatch: 15,  unitId: 'U01' },
      { productId: 'P006', qtyPerBatch: 500, unitId: 'U02' },
      { productId: 'P007', qtyPerBatch: 200, unitId: 'U02' },
    ],
    active: true, createdAt: '2024-06-01T00:00:00',
  },
  {
    id: 'FML002', code: 'FML-002', name: 'หมูสับผสมแครอท', machineType: 'meat',
    semiProductId: null, outputProductId: null,
    mixsizeIds: ['MX02'],
    bomByMixsize: {
      MX02: {
        premix: [],
        ingredients: [
          { productId: 'P002', qtyPerBatch: 60,  unitId: 'U01' },
          { productId: 'P003', qtyPerBatch: 20,  unitId: 'U01' },
          { productId: 'P020', qtyPerBatch: 300, unitId: 'U02' },
          { productId: 'P019', qtyPerBatch: 5,   unitId: 'U01' },
        ],
      },
    },
    ingredients: [
      { productId: 'P002', qtyPerBatch: 60,  unitId: 'U01' },
      { productId: 'P003', qtyPerBatch: 20,  unitId: 'U01' },
      { productId: 'P020', qtyPerBatch: 300, unitId: 'U02' },
      { productId: 'P019', qtyPerBatch: 5,   unitId: 'U01' },
    ],
    active: true, createdAt: '2024-06-02T00:00:00',
  },
  {
    id: 'FML003', code: 'FML-003', name: 'ไก่ผสมเครื่องเทศ', machineType: 'meat',
    semiProductId: null, outputProductId: null,
    mixsizeIds: ['MX01'],
    bomByMixsize: {
      MX01: {
        premix: [],
        ingredients: [
          { productId: 'P001', qtyPerBatch: 90,  unitId: 'U01' },
          { productId: 'P018', qtyPerBatch: 10,  unitId: 'U01' },
          { productId: 'P019', qtyPerBatch: 3,   unitId: 'U01' },
          { productId: 'P006', qtyPerBatch: 200, unitId: 'U02' },
        ],
      },
    },
    ingredients: [
      { productId: 'P001', qtyPerBatch: 90,  unitId: 'U01' },
      { productId: 'P018', qtyPerBatch: 10,  unitId: 'U01' },
      { productId: 'P019', qtyPerBatch: 3,   unitId: 'U01' },
      { productId: 'P006', qtyPerBatch: 200, unitId: 'U02' },
    ],
    active: true, createdAt: '2024-06-03T00:00:00',
  },
]

let _poCounter = 3
export const generatePONo = () => {
  const today = new Date()
  const yy = String(today.getFullYear()).slice(2)
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  _poCounter++
  return `PO-${yy}${mm}${dd}-${String(_poCounter).padStart(3, '0')}`
}

export const PRODUCTION_ORDERS = [
  {
    id: 'PO001', docNo: 'PO-240603-001', formulaId: 'FML001', mixsizeId: 'MX01', plannedBatches: 3,
    status: 'done',
    ingredients: [
      { productId: 'P001', qtyRequired: 240, lotAssignments: [{ lotId: 'LOT001', lotNo: 'LOT-2024-0601-001', qty: 240 }] },
      { productId: 'P004', qtyRequired: 45,  lotAssignments: [{ lotId: 'LOT004', lotNo: 'LOT-2024-0603-001', qty: 45  }] },
      { productId: 'P006', qtyRequired: 1500,lotAssignments: [{ lotId: 'LOT005', lotNo: 'LOT-2024-0603-002', qty: 1500 }] },
      { productId: 'P007', qtyRequired: 600, lotAssignments: [] },
    ],
    semiLot: { lotNo: 'SEMI-20240603-001', productId: 'P016', qty: 3000, warehouseId: 'WH02' },
    fgLot:   { lotNo: 'FG-20240603-001',   productId: 'P017', qty: 3000, warehouseId: 'WH02' },
    actualOutput: 3000,
    createdAt: '2024-06-03T08:00:00', confirmedAt: '2024-06-03T08:30:00',
    mixedAt: '2024-06-03T10:00:00', packedAt: '2024-06-03T14:00:00', completedAt: '2024-06-03T15:00:00',
    createdBy: 'USR001',
  },
  {
    id: 'PO002', docNo: 'PO-240605-001', formulaId: 'FML002', mixsizeId: 'MX02', plannedBatches: 2,
    status: 'mixing',
    ingredients: [
      { productId: 'P002', qtyRequired: 120, lotAssignments: [{ lotId: 'LOT003', lotNo: 'LOT-2024-0601-002', qty: 120 }] },
      { productId: 'P003', qtyRequired: 40,  lotAssignments: [{ lotId: 'LOT006', lotNo: 'LOT-2024-0602-001', qty: 40  }] },
      { productId: 'P020', qtyRequired: 600, lotAssignments: [] },
      { productId: 'P019', qtyRequired: 10,  lotAssignments: [] },
    ],
    semiLot: null, fgLot: null, actualOutput: null,
    createdAt: '2024-06-05T09:00:00', confirmedAt: '2024-06-05T09:30:00',
    mixedAt: null, packedAt: null, completedAt: null,
    createdBy: 'USR002',
  },
  {
    id: 'PO003', docNo: 'PO-240606-001', formulaId: 'FML001', mixsizeId: 'MX02', plannedBatches: 5,
    status: 'confirmed',
    ingredients: [
      { productId: 'P001', qtyRequired: 400, lotAssignments: [{ lotId: 'LOT002', lotNo: 'LOT-2024-0605-001', qty: 400 }] },
      { productId: 'P004', qtyRequired: 75,  lotAssignments: [{ lotId: 'LOT004', lotNo: 'LOT-2024-0603-001', qty: 75  }] },
      { productId: 'P006', qtyRequired: 2500,lotAssignments: [{ lotId: 'LOT005', lotNo: 'LOT-2024-0603-002', qty: 2500 }] },
      { productId: 'P007', qtyRequired: 1000,lotAssignments: [] },
    ],
    semiLot: null, fgLot: null, actualOutput: null,
    createdAt: '2024-06-06T08:00:00', confirmedAt: '2024-06-06T08:30:00',
    mixedAt: null, packedAt: null, completedAt: null,
    createdBy: 'USR001',
  },
]

// ===== Packing (แพ็ค): Semi → FG + Rejected =====
let _pkCounter = 2
export const generatePackNo = () => {
  const today = new Date()
  const yy = String(today.getFullYear()).slice(2)
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  _pkCounter++
  return `PK-${yy}${mm}${dd}-${String(_pkCounter).padStart(3, '0')}`
}

export const PACKINGS = [
  {
    id: 'PK001', docNo: 'PK-240610-001',
    semiProductId: 'P016', inputQty: 500, fgQty: 480, rejectedQty: 20,
    warehouseId: 'WH02', note: '', status: 'done',
    createdAt: '2024-06-10T09:00:00', createdBy: 'USR001',
  },
  {
    id: 'PK002', docNo: 'PK-240612-001',
    semiProductId: 'P021', inputQty: 300, fgQty: 295, rejectedQty: 5,
    warehouseId: 'WH02', note: 'ล็อตทดสอบ', status: 'done',
    createdAt: '2024-06-12T10:30:00', createdBy: 'USR002',
  },
]
