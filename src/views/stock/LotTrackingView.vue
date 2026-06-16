<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Lot Tracking (FIFO)</div>
        <div class="page-subtitle">ติดตาม Lot สินค้า — ใช้ของเก่าก่อน (First In First Out)</div>
      </div>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหา Lot No. / สินค้า..." style="padding-left: 2.2rem; width: 280px;" />
        </span>
        <Dropdown v-model="filterProduct" :options="masterStore.products.filter(p => p.requireLot)" optionLabel="name" optionValue="id"
          placeholder="ทุกสินค้า" showClear style="width: 220px;" :filter="true" />
        <Dropdown v-model="filterStatus" :options="lotStatusOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสถานะ" showClear style="width: 140px;" />
      </div>

      <DataTable :value="filteredLots" size="small" stripedRows
        :paginator="true" :rows="20"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}"
        :rowClass="rowClass">
        <Column header="FIFO" style="width: 60px; text-align: center;">
          <template #body="{ data }">
            <span v-if="data.fifoOrder <= 3" class="fifo-badge" :class="`fifo-${data.fifoOrder}`">
              #{{ data.fifoOrder }}
            </span>
          </template>
        </Column>
        <Column header="Lot No." style="width: 200px; font-family: monospace; font-size: 12px;" sortable field="lotNo">
          <template #body="{ data }">
            <span class="lot-no">{{ data.lotNo }}</span>
          </template>
        </Column>
        <Column header="สินค้า">
          <template #body="{ data }">{{ getProductName(data.productId) }}</template>
        </Column>
        <Column header="Supplier" style="width: 160px;">
          <template #body="{ data }">{{ getSupplierName(data.supplierId) }}</template>
        </Column>
        <Column header="วันรับเข้า" style="width: 110px;" sortable field="receiveDate">
          <template #body="{ data }">{{ formatDate(data.receiveDate) }}</template>
        </Column>
        <Column header="วันหมดอายุ" style="width: 110px;" sortable field="expiryDate">
          <template #body="{ data }">
            <span :class="isExpired(data.expiryDate) ? 'text-red' : isNearExpiry(data.expiryDate) ? 'text-orange' : ''">
              {{ data.expiryDate ? formatDate(data.expiryDate) : '-' }}
            </span>
          </template>
        </Column>
        <Column header="จำนวนเดิม" style="width: 100px; text-align: right;" field="qty" />
        <Column header="คงเหลือ" style="width: 100px; text-align: right;">
          <template #body="{ data }">
            <span :class="data.remaining === 0 ? 'text-muted' : 'qty-ok'">{{ data.remaining }}</span>
          </template>
        </Column>
        <Column header="คลัง" style="width: 110px;">
          <template #body="{ data }">{{ getWhName(data.warehouseId) }}</template>
        </Column>
        <Column header="สถานะ" style="width: 100px;">
          <template #body="{ data }">
            <span :class="['status-badge', lotStatusClass(data.status)]">{{ lotStatusLabel(data.status) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const masterStore = useMasterStore()
const stockStore = useStockStore()

const search = ref('')
const filterProduct = ref(null)
const filterStatus = ref(null)

const lotStatusOptions = [
  { label: 'ใช้งาน', value: 'active' },
  { label: 'Hold', value: 'hold' },
  { label: 'ใช้หมดแล้ว', value: 'depleted' },
]

const enrichedLots = computed(() => {
  const byProduct = {}
  stockStore.lots.forEach(lot => {
    if (!byProduct[lot.productId]) byProduct[lot.productId] = []
    byProduct[lot.productId].push(lot)
  })
  Object.values(byProduct).forEach(lots => {
    lots.sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate))
    lots.forEach((lot, i) => { lot.fifoOrder = i + 1 })
  })
  return stockStore.lots
})

const filteredLots = computed(() => {
  return enrichedLots.value.filter(lot => {
    const q = search.value.toLowerCase()
    const textMatch = !q || lot.lotNo.toLowerCase().includes(q) || getProductName(lot.productId).toLowerCase().includes(q)
    const prodMatch = !filterProduct.value || lot.productId === filterProduct.value
    const statusMatch = !filterStatus.value || lot.status === filterStatus.value
    return textMatch && prodMatch && statusMatch
  })
})

function getProductName(id) { return masterStore.getProductById(id)?.name || '-' }
function getSupplierName(id) { return id ? masterStore.getSupplierById(id)?.name || '-' : '-' }
function getWhName(id) { return masterStore.getWarehouseById(id)?.name || '-' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('th-TH') : '-' }
function isExpired(d) { return d && new Date(d) < new Date() }
function isNearExpiry(d) {
  if (!d) return false
  const diff = (new Date(d) - new Date()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}
function lotStatusLabel(s) { return { active: 'ใช้งาน', hold: 'Hold', depleted: 'ใช้หมด' }[s] || s }
function lotStatusClass(s) { return { active: 'status-fg', hold: 'status-hold', depleted: 'doc-status-draft' }[s] || '' }
function rowClass(data) { return data.fifoOrder === 1 ? 'row-fifo-first' : '' }
</script>

<style scoped>
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.lot-no { font-family: monospace; font-size: 12px; color: var(--gl-navy); font-weight: 600; }
.fifo-badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.fifo-1 { background: #DCFCE7; color: #14532D; border: 1px solid #86EFAC; }
.fifo-2 { background: #FEF9C3; color: #713F12; border: 1px solid #FDE047; }
.fifo-3 { background: #FEF2F2; color: #7F1D1D; border: 1px solid #FCA5A5; }
.qty-ok { font-weight: 600; color: var(--gl-navy); }
.text-red { color: var(--gl-red); font-weight: 600; }
.text-orange { color: var(--gl-warning); font-weight: 600; }
.text-muted { color: var(--gl-text-muted); }
</style>
