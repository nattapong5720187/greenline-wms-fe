<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">สต๊อกแยกคลัง</div>
        <div class="page-subtitle">จำนวนสินค้าคงเหลือแยกตามคลัง พร้อมสถานะ</div>
      </div>
    </div>

    <!-- Warehouse tabs -->
    <div class="wh-tabs">
      <button
        v-for="wh in allWarehousesTab" :key="wh.id"
        :class="['wh-tab', { active: activeWh === wh.id }]"
        @click="activeWh = wh.id"
      >
        <i class="pi pi-building" />
        {{ wh.name }}
        <span class="tab-count">{{ getWhItemCount(wh.id) }}</span>
      </button>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหาสินค้า..." style="padding-left: 2.2rem; width: 260px;" />
        </span>
        <Dropdown v-model="filterCategory" :options="masterStore.categories" optionLabel="name" optionValue="id"
          placeholder="ทุกประเภท" showClear style="width: 170px;" />
        <Dropdown v-model="filterStockStatus" :options="stockStatusOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสถานะ" showClear style="width: 150px;" />
        <div class="toolbar-right">
          <span class="total-badge">รวม: {{ totalQty.toLocaleString() }}</span>
        </div>
      </div>

      <DataTable :value="filteredStock" size="small" stripedRows
        :paginator="true" :rows="20"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}">
        <Column field="code" header="รหัส" style="width: 110px; font-family: monospace; font-size: 12px;" sortable />
        <Column field="name" header="ชื่อสินค้า" sortable />
        <Column header="ประเภท" style="width: 140px;">
          <template #body="{ data }">
            <span class="cat-chip" :style="{ background: getCat(data.categoryId)?.color + '22', color: getCat(data.categoryId)?.color }">
              {{ getCat(data.categoryId)?.name }}
            </span>
          </template>
        </Column>
        <Column header="สถานะสินค้า" style="width: 120px;">
          <template #body="{ data }">
            <span :class="['status-badge', stockStatusClass(data.stockStatus)]">{{ data.stockStatus }}</span>
          </template>
        </Column>
        <Column header="คงเหลือ" style="width: 100px; text-align: right;" sortable sortField="qty">
          <template #body="{ data }">
            <span :class="isLow(data) ? 'qty-low' : 'qty-ok'">{{ data.qty.toLocaleString() }}</span>
          </template>
        </Column>
        <Column header="หน่วย" style="width: 70px;">
          <template #body="{ data }">{{ getUnitAbbr(data.unitId) }}</template>
        </Column>
        <Column header="Min Stock" style="width: 90px; text-align: right;">
          <template #body="{ data }">
            <span style="color: var(--gl-text-muted);">{{ data.minStock || '-' }}</span>
          </template>
        </Column>
        <Column header="สถานะสต๊อก" style="width: 130px;">
          <template #body="{ data }">
            <span v-if="isLow(data)" class="status-badge" style="background:#FEF2F2; color:#991B1B;">
              <i class="pi pi-exclamation-circle" /> ต่ำกว่าขั้นต่ำ
            </span>
            <span v-else class="status-badge" style="background:#D1FAE5; color:#065F46;">
              <i class="pi pi-check-circle" /> ปกติ
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const masterStore = useMasterStore()
const stockStore = useStockStore()

onMounted(() => {
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
  if (!masterStore.categories.length) masterStore.fetchCategories()
  if (!masterStore.products.length) masterStore.fetchProducts()
  if (!masterStore.units.length) masterStore.fetchUnits()
})

const search = ref('')
const filterCategory = ref(null)
const filterStockStatus = ref(null)
const activeWh = ref('all')

const stockStatusOptions = [
  { label: 'RM', value: 'RM' },
  { label: 'Semi', value: 'Semi' },
  { label: 'FG', value: 'FG' },
  { label: 'Hold', value: 'Hold' },
]

const allWarehousesTab = computed(() => [
  { id: 'all', name: 'ทั้งหมด' },
  ...masterStore.warehouses,
])

function getWhItemCount(whId) {
  if (whId === 'all') return stockStore.stock.length
  return stockStore.getStockByWarehouse(whId).length
}

const enrichedStock = computed(() => {
  return stockStore.stock.map(s => {
    const p = masterStore.getProductById(s.productId)
    return p ? { ...p, ...s, qty: s.qty, productId: s.productId } : null
  }).filter(Boolean)
})

const filteredStock = computed(() => {
  return enrichedStock.value.filter(item => {
    const whMatch = activeWh.value === 'all' || item.warehouseId === activeWh.value
    const q = search.value.toLowerCase()
    const textMatch = !q || item.code?.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q)
    const catMatch = !filterCategory.value || item.categoryId === filterCategory.value
    const statusMatch = !filterStockStatus.value || item.stockStatus === filterStockStatus.value
    return whMatch && textMatch && catMatch && statusMatch
  })
})

const totalQty = computed(() => filteredStock.value.reduce((sum, s) => sum + (s.qty || 0), 0))

function getCat(id) { return masterStore.getCategoryById(id) }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }
function isLow(item) { return item.minStock && item.qty < item.minStock }
function stockStatusClass(s) {
  return { RM: 'status-rm', Semi: 'status-semi', FG: 'status-fg', Hold: 'status-hold', Reprocess: 'status-reprocess' }[s] || ''
}
</script>

<style scoped>
.wh-tabs { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.wh-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px; border-radius: 8px; border: 1px solid var(--gl-border);
  background: var(--gl-surface); cursor: pointer; font-family: 'Kanit', sans-serif;
  font-size: 13px; color: var(--gl-text-muted); transition: all 0.15s;
}
.wh-tab:hover { background: var(--gl-bg); }
.wh-tab.active { background: var(--gl-navy); color: #fff; border-color: var(--gl-navy); }
.tab-count { background: rgba(255,255,255,0.2); border-radius: 999px; padding: 1px 8px; font-size: 11px; }
.wh-tab:not(.active) .tab-count { background: var(--gl-bg); color: var(--gl-navy); }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.cat-chip { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.qty-low { color: var(--gl-red); font-weight: 700; }
.qty-ok { color: var(--gl-navy); font-weight: 600; }
.toolbar-right { margin-left: auto; }
.total-badge { background: var(--gl-navy); color: #fff; padding: 5px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }
</style>
