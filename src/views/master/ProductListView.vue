<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">สินค้า / SKU</div>
        <div class="page-subtitle">จัดการรายการสินค้าทั้งหมด ({{ filtered.length }} รายการ)</div>
      </div>
      <RouterLink to="/master/products/create">
        <Button label="เพิ่มสินค้า" icon="pi pi-plus" class="btn-primary" />
      </RouterLink>
    </div>

    <div class="page-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหารหัส / ชื่อสินค้า..." style="padding-left: 2.2rem; width: 280px;" />
        </span>
        <Dropdown
          v-model="filterCategory"
          :options="categoryOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="ทุกประเภท"
          showClear
          style="width: 180px;"
        />
        <Dropdown
          v-model="filterWarehouse"
          :options="warehouseOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="ทุกคลัง"
          showClear
          style="width: 160px;"
        />
        <Dropdown
          v-model="filterStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="ทุกสถานะ"
          showClear
          style="width: 150px;"
        />
      </div>

      <DataTable
        :value="filtered"
        :paginator="true"
        :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}"
        size="small"
        stripedRows
        :loading="false"
      >
        <Column field="code" header="รหัส" style="width: 110px; font-family: monospace; font-size: 12px;" sortable />
        <Column field="name" header="ชื่อสินค้า" sortable />
        <Column header="ประเภท" style="width: 140px;">
          <template #body="{ data }">
            <span class="cat-badge" :style="{ background: getCatColor(data.categoryId) + '22', color: getCatColor(data.categoryId) }">
              {{ getCatName(data.categoryId) }}
            </span>
          </template>
        </Column>
        <Column header="หน่วย" style="width: 80px;">
          <template #body="{ data }">{{ getUnitAbbr(data.unitId) }}</template>
        </Column>
        <Column header="คลัง" style="width: 120px;">
          <template #body="{ data }">{{ getWhName(data.warehouseId) }}</template>
        </Column>
        <Column header="สถานะสินค้า" style="width: 120px;">
          <template #body="{ data }">
            <span :class="['status-badge', statusClass(data.stockStatus)]">{{ data.stockStatus }}</span>
          </template>
        </Column>
        <Column header="คงเหลือ" style="width: 100px; text-align: right;">
          <template #body="{ data }">
            <span :class="isLow(data) ? 'text-danger' : ''">
              {{ getCurrentQty(data) }}
            </span>
            <span style="color: var(--gl-text-muted); font-size: 11px;"> / {{ data.minStock }}</span>
          </template>
        </Column>
        <Column header="Lot" style="width: 70px; text-align: center;">
          <template #body="{ data }">
            <i :class="data.requireLot ? 'pi pi-check-circle' : 'pi pi-minus-circle'"
               :style="{ color: data.requireLot ? 'var(--gl-success)' : 'var(--gl-text-muted)' }" />
          </template>
        </Column>
        <Column header="จัดการ" style="width: 110px;">
          <template #body="{ data }">
            <div class="action-btns">
              <RouterLink :to="`/master/products/${data.id}/edit`">
                <Button icon="pi pi-pencil" size="small" text rounded />
              </RouterLink>
              <Button icon="pi pi-trash" size="small" text rounded severity="danger"
                @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const masterStore = useMasterStore()
const stockStore = useStockStore()
const confirm = useConfirm()
const toast = useToast()

const search = ref('')
const filterCategory = ref(null)
const filterWarehouse = ref(null)
const filterStatus = ref(null)

const categoryOptions = computed(() => masterStore.categories)
const warehouseOptions = computed(() => masterStore.warehouses)
const statusOptions = [
  { label: 'RM', value: 'RM' },
  { label: 'Semi', value: 'Semi' },
  { label: 'FG', value: 'FG' },
  { label: 'Hold', value: 'Hold' },
  { label: 'Reprocess', value: 'Reprocess' },
]

const filtered = computed(() =>
  masterStore.products.filter(p => {
    const q = search.value.toLowerCase()
    const matchText = !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    const matchCat = !filterCategory.value || p.categoryId === filterCategory.value
    const matchWh = !filterWarehouse.value || p.warehouseId === filterWarehouse.value
    const matchStatus = !filterStatus.value || p.stockStatus === filterStatus.value
    return matchText && matchCat && matchWh && matchStatus
  })
)

function getCatName(id) { return masterStore.getCategoryById(id)?.name || '-' }
function getCatColor(id) { return masterStore.getCategoryById(id)?.color || '#888' }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }
function getWhName(id) { return masterStore.getWarehouseById(id)?.name || '-' }
function getCurrentQty(p) { return stockStore.getAllQty(p.id) }
function isLow(p) { return p.minStock && stockStore.getAllQty(p.id) < p.minStock }

function statusClass(s) {
  return { RM: 'status-rm', Semi: 'status-semi', FG: 'status-fg', Hold: 'status-hold', Reprocess: 'status-reprocess' }[s] || ''
}

function confirmDelete(product) {
  confirm.require({
    message: `ต้องการลบสินค้า "${product.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteProduct(product.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', detail: product.name, life: 3000 })
    }
  })
}
</script>

<style scoped>
.search-wrap { display: flex; align-items: center; position: relative; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.cat-badge { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.action-btns { display: flex; gap: 4px; }
.text-danger { color: var(--gl-red); font-weight: 600; }
</style>
