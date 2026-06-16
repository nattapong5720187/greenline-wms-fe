<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ตั้งค่า Min Stock</div>
        <div class="page-subtitle">กำหนดจำนวนสต๊อกขั้นต่ำของแต่ละ SKU — ระบบจะแจ้งเตือนเมื่อสต๊อกต่ำกว่าค่านี้</div>
      </div>
      <Button label="ตรวจสอบสต๊อกต่ำ" icon="pi pi-bell" class="btn-primary" @click="checkNow" />
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหาสินค้า..." style="padding-left: 2.2rem; width: 260px;" />
        </span>
        <div class="toolbar-right">
          <span class="low-count-badge"><i class="pi pi-exclamation-triangle" /> สต๊อกต่ำ: {{ lowCount }} รายการ</span>
        </div>
      </div>

      <DataTable :value="filteredProducts" size="small" stripedRows editMode="cell" @cell-edit-complete="onEditComplete">
        <Column field="code" header="รหัส" style="width: 110px; font-family: monospace; font-size: 12px;" />
        <Column field="name" header="ชื่อสินค้า" />
        <Column header="ประเภท" style="width: 140px;">
          <template #body="{ data }">
            <span class="cat-chip" :style="{ background: getCatColor(data.categoryId) + '22', color: getCatColor(data.categoryId) }">
              {{ getCatName(data.categoryId) }}
            </span>
          </template>
        </Column>
        <Column header="คลัง" style="width: 110px;">
          <template #body="{ data }">{{ masterStore.getWarehouseById(data.warehouseId)?.name }}</template>
        </Column>
        <Column header="คงเหลือ" style="width: 100px; text-align: right;">
          <template #body="{ data }">
            <span :class="isLow(data) ? 'qty-low' : 'qty-ok'">{{ stockStore.getAllQty(data.id).toLocaleString() }}</span>
          </template>
        </Column>
        <Column field="minStock" header="Min Stock" style="width: 130px; text-align: right;">
          <template #body="{ data }">
            <span class="min-val" @click="editMin(data)">
              {{ data.minStock || 0 }}
              <i class="pi pi-pencil edit-icon" />
            </span>
          </template>
          <template #editor="{ data, field }">
            <InputNumber v-model="data[field]" :min="0" class="w-full" autofocus />
          </template>
        </Column>
        <Column header="หน่วย" style="width: 70px;">
          <template #body="{ data }">{{ masterStore.getUnitById(data.unitId)?.abbr }}</template>
        </Column>
        <Column header="สถานะ" style="width: 130px;">
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
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import { useNotificationStore } from '@/stores/notifications'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const toast = useToast()
const masterStore = useMasterStore()
const stockStore = useStockStore()
const notifStore = useNotificationStore()

const search = ref('')

const filteredProducts = computed(() =>
  masterStore.products.filter(p => {
    const q = search.value.toLowerCase()
    return !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  })
)

const lowCount = computed(() =>
  masterStore.products.filter(p => p.minStock && stockStore.getAllQty(p.id) < p.minStock).length
)

function getCatName(id) { return masterStore.getCategoryById(id)?.name || '-' }
function getCatColor(id) { return masterStore.getCategoryById(id)?.color || '#888' }
function isLow(p) { return p.minStock && stockStore.getAllQty(p.id) < p.minStock }

function onEditComplete(e) {
  const { data, newValue, field } = e
  masterStore.updateProduct(data.id, { [field]: newValue })
  toast.add({ severity: 'success', summary: 'บันทึก Min Stock', detail: `${data.name}: ${newValue}`, life: 2000 })
}

function editMin(product) {
  // handled by DataTable cell edit
}

function checkNow() {
  notifStore.checkMinStock()
  toast.add({ severity: 'info', summary: 'ตรวจสอบสต๊อกเสร็จสิ้น', detail: `พบสต๊อกต่ำ ${lowCount.value} รายการ`, life: 3000 })
}
</script>

<style scoped>
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.cat-chip { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.qty-low { color: var(--gl-red); font-weight: 700; }
.qty-ok { color: var(--gl-navy); font-weight: 600; }
.min-val { display: flex; align-items: center; justify-content: flex-end; gap: 6px; cursor: pointer; }
.edit-icon { font-size: 11px; color: var(--gl-text-muted); opacity: 0; transition: opacity 0.15s; }
.min-val:hover .edit-icon { opacity: 1; }
.toolbar-right { margin-left: auto; }
.low-count-badge { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
</style>
