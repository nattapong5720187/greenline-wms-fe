<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Hold Management</div>
        <div class="page-subtitle">จัดการสินค้าที่ถูก Hold (QC/QA, ไฟดับ, ไม่ผ่าน Retort, สนิม)</div>
      </div>
      <Button label="Hold สินค้า" icon="pi pi-lock" class="btn-danger" @click="openHoldDialog" />
    </div>

    <!-- Summary chips -->
    <div class="summary-row">
      <div class="sum-chip red"><i class="pi pi-lock" /> Hold: {{ holdCount }}</div>
      <div class="sum-chip orange"><i class="pi pi-sync" /> Reprocess: {{ reprocessCount }}</div>
      <div class="sum-chip green"><i class="pi pi-check" /> Released: {{ releasedCount }}</div>
    </div>

    <div class="page-card">
      <DataTable :value="stockStore.holdItems" size="small" stripedRows>
        <Column header="สินค้า">
          <template #body="{ data }">{{ masterStore.getProductById(data.productId)?.name }}</template>
        </Column>
        <Column header="Lot" style="font-family: monospace; font-size: 12px; width: 200px;">
          <template #body="{ data }">{{ getLotNo(data.lotId) }}</template>
        </Column>
        <Column header="จำนวน Hold" style="width: 110px; text-align: right;">
          <template #body="{ data }"><span class="text-red">{{ data.qty }}</span></template>
        </Column>
        <Column header="หน่วย" style="width: 70px;">
          <template #body="{ data }">{{ getUnitAbbr(masterStore.getProductById(data.productId)?.unitId) }}</template>
        </Column>
        <Column header="คลัง" style="width: 110px;">
          <template #body="{ data }">{{ masterStore.getWarehouseById(data.warehouseId)?.name }}</template>
        </Column>
        <Column header="เหตุผล">
          <template #body="{ data }">
            <span style="font-size: 13px; color: var(--gl-text-muted);">{{ data.reason }}</span>
          </template>
        </Column>
        <Column header="Hold เมื่อ" style="width: 120px;">
          <template #body="{ data }">{{ formatDate(data.heldAt) }}</template>
        </Column>
        <Column header="สถานะ" style="width: 100px;">
          <template #body="{ data }">
            <span :class="['status-badge', holdStatusClass(data.status)]">{{ holdStatusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="จัดการ" style="width: 150px;">
          <template #body="{ data }">
            <div class="action-btns" v-if="data.status === 'hold'">
              <Button label="ปลดล็อก" icon="pi pi-unlock" size="small" outlined severity="success"
                @click="releaseItem(data)" />
              <Button label="Reprocess" icon="pi pi-sync" size="small" outlined severity="warning"
                @click="sendReprocess(data)" />
            </div>
            <span v-else style="color: var(--gl-text-muted); font-size: 12px;">{{ holdStatusLabel(data.status) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Hold dialog -->
    <Dialog v-model:visible="showHoldDialog" header="Hold สินค้า" :modal="true" :style="{ width: '460px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">สินค้า <span class="req">*</span></label>
          <Dropdown v-model="holdForm.productId" :options="masterStore.products" optionLabel="name" optionValue="id"
            :filter="true" placeholder="เลือกสินค้า" class="w-full" />
        </div>
        <div>
          <label class="field-label">Lot</label>
          <Dropdown v-model="holdForm.lotId" :options="getLots(holdForm.productId)" optionLabel="lotNo" optionValue="id"
            placeholder="เลือก Lot" class="w-full" :disabled="!holdForm.productId" />
        </div>
        <div>
          <label class="field-label">คลัง <span class="req">*</span></label>
          <Dropdown v-model="holdForm.warehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id"
            placeholder="เลือกคลัง" class="w-full" />
        </div>
        <div>
          <label class="field-label">จำนวน <span class="req">*</span></label>
          <InputNumber v-model="holdForm.qty" :min="1" class="w-full" placeholder="จำนวน" />
        </div>
        <div>
          <label class="field-label">เหตุผล <span class="req">*</span></label>
          <Textarea v-model="holdForm.reason" class="w-full" rows="2" placeholder="เหตุผลการ Hold เช่น ไฟดับ, ไม่ผ่าน Retort" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showHoldDialog = false" />
        <Button label="Hold สินค้า" icon="pi pi-lock" class="btn-danger" @click="confirmHold" />
      </template>
    </Dialog>

    <!-- Release dialog -->
    <Dialog v-model:visible="showReleaseDialog" header="ปลดล็อก Hold" :modal="true" :style="{ width: '380px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">ผลการตรวจสอบ <span class="req">*</span></label>
          <Textarea v-model="releaseReason" class="w-full" rows="3" placeholder="ผ่าน QC เนื่องจาก..." />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showReleaseDialog = false" />
        <Button label="ปลดล็อก" icon="pi pi-unlock" class="btn-primary" @click="confirmRelease" />
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
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()

const showHoldDialog = ref(false)
const showReleaseDialog = ref(false)
const releaseTargetId = ref(null)
const releaseReason = ref('')
const holdForm = ref({ productId: null, lotId: null, warehouseId: null, qty: null, reason: '' })

const holdCount = computed(() => stockStore.holdItems.filter(h => h.status === 'hold').length)
const reprocessCount = computed(() => stockStore.holdItems.filter(h => h.status === 'reprocess').length)
const releasedCount = computed(() => stockStore.holdItems.filter(h => h.status === 'released').length)

function getLots(productId) { return productId ? stockStore.getLotsForProduct(productId) : [] }
function getLotNo(lotId) { return lotId ? stockStore.lots.find(l => l.id === lotId)?.lotNo || lotId : '-' }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('th-TH') : '-' }
function holdStatusLabel(s) { return { hold: 'Hold', released: 'ปลดล็อกแล้ว', reprocess: 'Reprocess' }[s] || s }
function holdStatusClass(s) { return { hold: 'status-hold', released: 'status-fg', reprocess: 'status-reprocess' }[s] || '' }

function openHoldDialog() {
  holdForm.value = { productId: null, lotId: null, warehouseId: null, qty: null, reason: '' }
  showHoldDialog.value = true
}

function confirmHold() {
  if (!holdForm.value.productId || !holdForm.value.warehouseId || !holdForm.value.qty || !holdForm.value.reason) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  stockStore.holdStock({ ...holdForm.value, heldBy: authStore.user?.id, heldAt: new Date().toISOString() })
  toast.add({ severity: 'success', summary: 'Hold สินค้าแล้ว', life: 3000 })
  showHoldDialog.value = false
}

function releaseItem(item) {
  releaseTargetId.value = item.id
  releaseReason.value = ''
  showReleaseDialog.value = true
}
function confirmRelease() {
  if (!releaseReason.value) { toast.add({ severity: 'warn', summary: 'กรุณาระบุผลการตรวจสอบ', life: 3000 }); return }
  stockStore.releaseHold(releaseTargetId.value, releaseReason.value)
  toast.add({ severity: 'success', summary: 'ปลดล็อกสำเร็จ', life: 3000 })
  showReleaseDialog.value = false
}
function sendReprocess(item) {
  stockStore.sendToReprocess(item.id)
  toast.add({ severity: 'info', summary: 'ส่ง Reprocess แล้ว', life: 3000 })
}
</script>

<style scoped>
.summary-row { display: flex; gap: 10px; margin-bottom: 12px; }
.sum-chip { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 7px; }
.sum-chip.red { background: #FEE2E2; color: #991B1B; }
.sum-chip.orange { background: #FEF3C7; color: #92400E; }
.sum-chip.green { background: #D1FAE5; color: #065F46; }
.action-btns { display: flex; gap: 4px; }
.text-red { color: var(--gl-red); font-weight: 700; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
