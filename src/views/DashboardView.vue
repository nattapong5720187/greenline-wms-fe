<template>
  <div class="dashboard">
    <!-- Stats row -->
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <i :class="s.icon" :style="{ color: s.color }" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <!-- Low stock alerts -->
      <div class="page-card">
        <div class="section-header">
          <div>
            <div class="section-title"><i class="pi pi-exclamation-triangle" style="color: var(--gl-red);" /> สต๊อกต่ำกว่าขั้นต่ำ</div>
            <div class="section-sub">สินค้าที่ต้องเติมสต๊อก</div>
          </div>
          <RouterLink to="/stock/min-stock" class="see-all">ดูทั้งหมด <i class="pi pi-arrow-right" /></RouterLink>
        </div>
        <DataTable :value="lowStockItems" size="small" :rows="6">
          <Column field="name" header="สินค้า" />
          <Column header="คลัง">
            <template #body="{ data }">{{ getWarehouseName(data.warehouseId) }}</template>
          </Column>
          <Column header="คงเหลือ / ขั้นต่ำ">
            <template #body="{ data }">
              <span style="color: var(--gl-red); font-weight: 600;">{{ data.qty }}</span>
              <span style="color: var(--gl-text-muted)"> / {{ data.minStock }} {{ getUnitAbbr(data.unitId) }}</span>
            </template>
          </Column>
          <Column header="สถานะ">
            <template #body>
              <span class="status-badge" style="background:#FEF2F2; color:#991B1B;">
                <i class="pi pi-exclamation-circle" /> ต่ำกว่าขั้นต่ำ
              </span>
            </template>
          </Column>
        </DataTable>
        <div v-if="!lowStockItems.length" class="empty-state">
          <i class="pi pi-check-circle" style="color: var(--gl-success);" /> สต๊อกทุกรายการอยู่ในระดับปกติ
        </div>
      </div>

      <!-- Recent documents -->
      <div class="page-card">
        <div class="section-header">
          <div>
            <div class="section-title"><i class="pi pi-file" style="color: var(--gl-navy);" /> เอกสารล่าสุด</div>
            <div class="section-sub">5 รายการล่าสุด</div>
          </div>
          <RouterLink to="/documents" class="see-all">ดูทั้งหมด <i class="pi pi-arrow-right" /></RouterLink>
        </div>
        <DataTable :value="recentDocs" size="small">
          <Column field="docNo" header="เลขเอกสาร" style="font-family: monospace; font-size: 12px;" />
          <Column header="ประเภท">
            <template #body="{ data }">
              <span :class="['status-badge', docTypeClass(data.type)]">{{ docTypeLabel(data.type) }}</span>
            </template>
          </Column>
          <Column header="สถานะ">
            <template #body="{ data }">
              <span :class="['status-badge', docStatusClass(data.status)]">{{ docStatusLabel(data.status) }}</span>
            </template>
          </Column>
          <Column header="วันที่">
            <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Warehouse stock summary -->
    <div class="page-card mt-16">
      <div class="section-header">
        <div>
          <div class="section-title"><i class="pi pi-building" style="color: var(--gl-navy);" /> สรุปสต๊อกแยกคลัง</div>
        </div>
        <RouterLink to="/stock/by-warehouse" class="see-all">ดูรายละเอียด <i class="pi pi-arrow-right" /></RouterLink>
      </div>
      <div class="wh-cards">
        <div class="wh-card" v-for="wh in warehouseSummary" :key="wh.id">
          <div class="wh-icon"><i class="pi pi-building" /></div>
          <div class="wh-name">{{ wh.name }}</div>
          <div class="wh-stat">
            <span class="wh-val">{{ wh.totalItems }}</span>
            <span class="wh-lbl">รายการ SKU</span>
          </div>
          <div class="wh-stat">
            <span class="wh-val" :class="{ 'text-red': wh.lowStock > 0 }">{{ wh.lowStock }}</span>
            <span class="wh-lbl">ต่ำกว่าขั้นต่ำ</span>
          </div>
          <div class="wh-stat">
            <span class="wh-val text-orange">{{ wh.holdItems }}</span>
            <span class="wh-lbl">Hold</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import { useDocumentStore } from '@/stores/documents'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const masterStore = useMasterStore()
const stockStore = useStockStore()
const docStore = useDocumentStore()

onMounted(() => {
  if (!masterStore.products.length) masterStore.fetchProducts()
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
  if (!masterStore.units.length) masterStore.fetchUnits()
})

const stats = computed(() => [
  {
    label: 'SKU ทั้งหมด', value: masterStore.products.length,
    icon: 'pi pi-box', bg: '#EFF6FF', color: '#1D4ED8',
  },
  {
    label: 'คลังสินค้า', value: masterStore.warehouses.length,
    icon: 'pi pi-building', bg: '#F0FDF4', color: '#15803D',
  },
  {
    label: 'เอกสารรอดำเนินการ',
    value: docStore.documents.filter(d => ['draft','pending'].includes(d.status)).length,
    icon: 'pi pi-clock', bg: '#FFFBEB', color: '#D97706',
  },
  {
    label: 'Hold', value: stockStore.holdItems.filter(h => h.status === 'hold').length,
    icon: 'pi pi-lock', bg: '#FEF2F2', color: '#DC2626',
  },
])

const lowStockItems = computed(() => {
  return masterStore.products
    .map(p => ({ ...p, qty: stockStore.getAllQty(p.id) }))
    .filter(p => p.minStock && p.qty < p.minStock)
    .slice(0, 6)
})

const recentDocs = computed(() =>
  [...docStore.documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
)

const warehouseSummary = computed(() =>
  masterStore.warehouses.map(wh => {
    const whStock = stockStore.getStockByWarehouse(wh.id)
    const lowStock = whStock.filter(s => {
      const p = masterStore.getProductById(s.productId)
      return p?.minStock && s.qty < p.minStock
    }).length
    return {
      ...wh,
      totalItems: whStock.length,
      lowStock,
      holdItems: stockStore.holdItems.filter(h => h.warehouseId === wh.id && h.status === 'hold').length,
    }
  })
)

function getWarehouseName(id) {
  return masterStore.warehouses.find(w => w.id === id)?.name || id
}
function getUnitAbbr(id) {
  return masterStore.units.find(u => u.id === id)?.abbr || ''
}
function formatDate(dt) {
  return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
}
function docTypeLabel(t) {
  return { receipt: 'รับเข้า', requisition: 'เบิก-จ่าย', return: 'คืนสินค้า' }[t] || t
}
function docStatusLabel(s) {
  return { draft: 'Draft', pending: 'รออนุมัติ', approved: 'อนุมัติ', issued: 'จ่ายแล้ว', cancelled: 'ยกเลิก' }[s] || s
}
function docTypeClass(t) {
  return { receipt: 'doc-receipt', requisition: 'doc-requisition', return: 'doc-return' }[t] || ''
}
function docStatusClass(s) {
  return { draft: 'doc-status-draft', pending: 'doc-status-pending', approved: 'doc-status-approved', issued: 'doc-status-issued', cancelled: 'doc-status-cancelled' }[s] || ''
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.section-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 14px;
}
.section-title { font-size: 15px; font-weight: 600; color: var(--gl-navy); display: flex; align-items: center; gap: 7px; }
.section-sub { font-size: 12px; color: var(--gl-text-muted); margin-top: 2px; }

.see-all {
  font-size: 12px; color: var(--gl-navy); text-decoration: none;
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 6px;
  border: 1px solid var(--gl-border);
  transition: background 0.15s;
  white-space: nowrap;
}
.see-all:hover { background: var(--gl-bg); }

.empty-state {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 0;
  font-size: 13px; color: var(--gl-text-muted);
  justify-content: center;
}

.wh-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.wh-card {
  background: var(--gl-bg);
  border-radius: 10px;
  padding: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  text-align: center;
  border: 1px solid var(--gl-border);
}

.wh-icon { font-size: 28px; color: var(--gl-navy); margin-bottom: 4px; }
.wh-name { font-size: 14px; font-weight: 600; color: var(--gl-navy); }
.wh-stat { display: flex; flex-direction: column; align-items: center; }
.wh-val { font-size: 22px; font-weight: 700; color: var(--gl-navy); line-height: 1; }
.wh-lbl { font-size: 11px; color: var(--gl-text-muted); }

.text-red { color: var(--gl-red) !important; }
.text-orange { color: var(--gl-warning) !important; }
.mt-16 { margin-top: 0; }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
  .wh-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
