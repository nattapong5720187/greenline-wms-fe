<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ย้ายสต๊อก (Stock Transfer)</div>
        <div class="page-subtitle">ย้ายสินค้าข้ามคลัง / ข้ามห้องเย็น</div>
      </div>
      <Button label="ย้ายสต๊อก" icon="pi pi-arrows-h" class="btn-primary" @click="showDialog = true" />
    </div>

    <div class="page-card">
      <DataTable :value="stockStore.transfers" size="small" stripedRows>
        <Column field="transferNo" header="เลขที่ย้าย" style="font-family: monospace; font-size: 12px; width: 170px;" />
        <Column header="สินค้า">
          <template #body="{ data }">{{ masterStore.getProductById(data.productId)?.name }}</template>
        </Column>
        <Column header="จาก" style="width: 120px;">
          <template #body="{ data }">
            <span class="wh-from">{{ masterStore.getWarehouseById(data.fromWarehouseId)?.name }}</span>
          </template>
        </Column>
        <Column header="" style="width: 28px; text-align: center;">
          <template #body><i class="pi pi-arrow-right" style="color: var(--gl-text-muted);" /></template>
        </Column>
        <Column header="ไปยัง" style="width: 120px;">
          <template #body="{ data }">
            <span class="wh-to">{{ masterStore.getWarehouseById(data.toWarehouseId)?.name }}</span>
          </template>
        </Column>
        <Column header="จำนวน" style="width: 90px; text-align: right;">
          <template #body="{ data }"><span style="font-weight: 600;">{{ data.qty }}</span></template>
        </Column>
        <Column header="หน่วย" style="width: 70px;">
          <template #body="{ data }">{{ getUnitAbbr(masterStore.getProductById(data.productId)?.unitId) }}</template>
        </Column>
        <Column header="เหตุผล">
          <template #body="{ data }"><span style="font-size: 12px; color: var(--gl-text-muted);">{{ data.reason }}</span></template>
        </Column>
        <Column header="วันที่" style="width: 110px;">
          <template #body="{ data }">{{ formatDate(data.transferredAt) }}</template>
        </Column>
        <Column header="สถานะ" style="width: 100px;">
          <template #body="{ data }">
            <span class="status-badge status-fg">เสร็จสิ้น</span>
          </template>
        </Column>
      </DataTable>
      <div v-if="!stockStore.transfers.length" class="empty-state">
        <i class="pi pi-arrows-h" /> ยังไม่มีรายการย้ายสต๊อก
      </div>
    </div>

    <Dialog v-model:visible="showDialog" header="ย้ายสต๊อกข้ามคลัง" :modal="true" :style="{ width: '500px' }">
      <div class="dialog-form">
        <div class="form-grid">
          <div>
            <label class="field-label">จากคลัง <span class="req">*</span></label>
            <Dropdown v-model="form.fromWarehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id"
              placeholder="เลือกคลังต้นทาง" class="w-full" />
          </div>
          <div>
            <label class="field-label">ไปคลัง <span class="req">*</span></label>
            <Dropdown v-model="form.toWarehouseId"
              :options="masterStore.warehouses.filter(w => w.id !== form.fromWarehouseId)"
              optionLabel="name" optionValue="id" placeholder="เลือกคลังปลายทาง" class="w-full" />
          </div>
        </div>
        <div>
          <label class="field-label">สินค้า <span class="req">*</span></label>
          <Dropdown v-model="form.productId" :options="availableProducts" optionLabel="name" optionValue="id"
            :filter="true" placeholder="เลือกสินค้า" class="w-full" />
        </div>
        <div v-if="selectedProductStock !== null" class="stock-info">
          <i class="pi pi-info-circle" /> สต๊อกในคลังต้นทาง: <strong>{{ selectedProductStock }} {{ getUnitAbbr(selectedUnitId) }}</strong>
        </div>
        <div class="form-grid">
          <div>
            <label class="field-label">จำนวน <span class="req">*</span></label>
            <InputNumber v-model="form.qty" :min="1" :max="selectedProductStock || 99999" class="w-full" />
          </div>
          <div>
            <label class="field-label">Lot (ถ้ามี)</label>
            <Dropdown v-model="form.lotId" :options="getLots(form.productId)" optionLabel="lotNo" optionValue="id"
              placeholder="เลือก Lot" showClear class="w-full" />
          </div>
        </div>
        <div>
          <label class="field-label">เหตุผล <span class="req">*</span></label>
          <InputText v-model="form.reason" class="w-full" placeholder="เช่น ห้องเย็น WH02 เต็ม" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDialog = false" />
        <Button label="ยืนยันการย้าย" icon="pi pi-arrows-h" class="btn-primary" @click="confirmTransfer" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'

const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()

const showDialog = ref(false)
const form = ref({ fromWarehouseId: null, toWarehouseId: null, productId: null, qty: null, lotId: null, reason: '' })

const availableProducts = computed(() => {
  if (!form.value.fromWarehouseId) return masterStore.products
  return stockStore.getStockByWarehouse(form.value.fromWarehouseId)
    .filter(s => s.qty > 0)
    .map(s => masterStore.getProductById(s.productId))
    .filter(Boolean)
})

const selectedProductStock = computed(() => {
  if (!form.value.productId || !form.value.fromWarehouseId) return null
  return stockStore.getQty(form.value.productId, form.value.fromWarehouseId)
})

const selectedUnitId = computed(() => masterStore.getProductById(form.value.productId)?.unitId)

function getLots(productId) { return productId ? stockStore.getLotsForProduct(productId) : [] }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('th-TH') : '-' }

function confirmTransfer() {
  if (!form.value.fromWarehouseId || !form.value.toWarehouseId || !form.value.productId || !form.value.qty || !form.value.reason) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (form.value.fromWarehouseId === form.value.toWarehouseId) {
    toast.add({ severity: 'warn', summary: 'คลังต้นทางและปลายทางต้องไม่ใช่คลังเดียวกัน', life: 3000 })
    return
  }
  const tNo = `TRF-${new Date().toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '')}-${String(stockStore.transfers.length + 1).padStart(3, '0')}`
  stockStore.transferStock({ ...form.value, transferNo: tNo, transferredBy: authStore.user?.id })
  toast.add({ severity: 'success', summary: 'ย้ายสต๊อกสำเร็จ', life: 3000 })
  showDialog.value = false
}
</script>

<style scoped>
.empty-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--gl-text-muted); font-size: 14px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
.wh-from { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 6px; font-size: 12px; }
.wh-to   { background: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 6px; font-size: 12px; }
.stock-info { background: #EFF6FF; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #1E40AF; display: flex; align-items: center; gap: 8px; }
</style>
