<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Reprocess Management</div>
        <div class="page-subtitle">เอาของเสีย/Lot ค้างไปปั่นมิกซ์ใหม่ — ผลลัพธ์ต้องเป็นสถานะ Semi</div>
      </div>
      <Button label="สร้าง Reprocess" icon="pi pi-sync" class="btn-primary" @click="openDialog" />
    </div>

    <div class="info-box">
      <i class="pi pi-info-circle" />
      <span>Reprocess คือการนำสินค้าที่มีปัญหา (จากสถานะ Hold) หรือ Lot ค้าง นำมาผสมใหม่ตามสูตรเดิมหรือสูตรใหม่ ผลลัพธ์ที่ได้จะเป็นสถานะ <strong>Semi</strong> ก่อนส่งเข้ากระบวนการต่อไป</span>
    </div>

    <div class="page-card">
      <DataTable :value="reprocessItems" size="small" stripedRows>
        <Column header="สินค้าต้นทาง (Hold)">
          <template #body="{ data }">{{ masterStore.getProductById(data.productId)?.name }}</template>
        </Column>
        <Column header="Lot" style="font-family: monospace; font-size: 12px; width: 200px;">
          <template #body="{ data }">{{ getLotNo(data.lotId) }}</template>
        </Column>
        <Column header="จำนวน" style="width: 100px; text-align: right;">
          <template #body="{ data }">{{ data.qty }}</template>
        </Column>
        <Column header="คลัง" style="width: 110px;">
          <template #body="{ data }">{{ masterStore.getWarehouseById(data.warehouseId)?.name }}</template>
        </Column>
        <Column header="สถานะ" style="width: 110px;">
          <template #body="{ data }">
            <span :class="['status-badge', 'status-reprocess']">Reprocess</span>
          </template>
        </Column>
        <Column header="ส่งเมื่อ" style="width: 120px;">
          <template #body="{ data }">{{ formatDate(data.resolvedAt) }}</template>
        </Column>
      </DataTable>
      <div v-if="!reprocessItems.length" class="empty-state">
        <i class="pi pi-sync" /> ไม่มีรายการ Reprocess
      </div>
    </div>

    <Dialog v-model:visible="showDialog" header="สร้างใบ Reprocess" :modal="true" :style="{ width: '460px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">เลือกสินค้า Hold <span class="req">*</span></label>
          <Dropdown
            v-model="form.holdId"
            :options="availableHold"
            optionLabel="label"
            optionValue="id"
            placeholder="เลือกรายการ Hold"
            class="w-full"
          />
        </div>
        <div>
          <label class="field-label">สูตร/วัตถุประสงค์ <span class="req">*</span></label>
          <InputText v-model="form.formula" class="w-full" placeholder="เช่น สูตร A-001 (ผสมใหม่)" />
        </div>
        <div>
          <label class="field-label">หมายเหตุ</label>
          <Textarea v-model="form.remark" class="w-full" rows="2" placeholder="รายละเอียดการ Reprocess" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDialog = false" />
        <Button label="ยืนยัน Reprocess" icon="pi pi-sync" class="btn-primary" @click="confirm" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
import Textarea from 'primevue/textarea'

const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()

onMounted(() => {
  if (!masterStore.products.length) masterStore.fetchProducts()
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
  if (!masterStore.units.length) masterStore.fetchUnits()
})

const showDialog = ref(false)
const form = ref({ holdId: null, formula: '', remark: '' })

const reprocessItems = computed(() => stockStore.holdItems.filter(h => h.status === 'reprocess'))
const availableHold = computed(() =>
  stockStore.holdItems
    .filter(h => h.status === 'hold')
    .map(h => ({
      ...h,
      label: `${masterStore.getProductById(h.productId)?.name} — ${h.qty} ${masterStore.getUnitById(masterStore.getProductById(h.productId)?.unitId)?.abbr || ''}`,
    }))
)

function getLotNo(lotId) { return lotId ? stockStore.lots.find(l => l.id === lotId)?.lotNo || lotId : '-' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('th-TH') : '-' }

function openDialog() {
  form.value = { holdId: null, formula: '', remark: '' }
  showDialog.value = true
}

function confirm() {
  if (!form.value.holdId || !form.value.formula) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  stockStore.sendToReprocess(form.value.holdId)
  toast.add({ severity: 'success', summary: 'สร้าง Reprocess สำเร็จ', life: 3000 })
  showDialog.value = false
}
</script>

<style scoped>
.info-box {
  display: flex; align-items: flex-start; gap: 10px;
  background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;
  padding: 12px 16px; font-size: 13px; color: #1E40AF;
  margin-bottom: 12px;
}
.info-box i { font-size: 16px; margin-top: 1px; flex-shrink: 0; }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--gl-text-muted); font-size: 14px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
