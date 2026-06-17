<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ใบสั่งผลิต</div>
        <div class="page-subtitle">จัดการคำสั่งผลิตทั้งหมด</div>
      </div>
      <Button label="สร้างใบสั่งผลิต" icon="pi pi-plus" class="btn-primary" @click="openCreate" />
    </div>

    <div class="stat-chips">
      <div class="stat-chip">
        <span class="chip-num">{{ productionStore.counts.all }}</span>
        <span class="chip-label">ทั้งหมด</span>
      </div>
      <div class="stat-chip confirmed">
        <span class="chip-num">{{ productionStore.counts.confirmed }}</span>
        <span class="chip-label">ยืนยันแล้ว</span>
      </div>
      <div class="stat-chip in-progress">
        <span class="chip-num">{{ productionStore.counts.inProgress }}</span>
        <span class="chip-label">กำลังผลิต</span>
      </div>
      <div class="stat-chip done">
        <span class="chip-num">{{ productionStore.counts.done }}</span>
        <span class="chip-label">เสร็จสิ้น</span>
      </div>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสถานะ" showClear style="width:200px;" />
        <Dropdown v-model="filterFormula" :options="formulaOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสูตร" showClear style="width:250px;" filter />
      </div>

      <DataTable :value="filtered" :paginator="true" :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}" size="small" stripedRows>
        <Column field="docNo" header="เลขที่" style="width:160px; font-family:monospace; font-size:12px;" sortable />
        <Column header="สูตร">
          <template #body="{ data }">
            <div style="font-weight:500;">{{ getFormulaName(data.formulaId) }}</div>
          </template>
        </Column>
        <Column header="Batch" style="width:80px; text-align:center;">
          <template #body="{ data }">{{ data.plannedBatches }}</template>
        </Column>
        <Column header="Output รวม" style="width:130px;">
          <template #body="{ data }">
            <strong v-if="data.actualOutput" style="color:#166534">{{ data.actualOutput.toLocaleString() }}</strong>
            <span v-else style="color:var(--gl-text-muted)">—</span>
          </template>
        </Column>
        <Column header="สถานะ" style="width:140px;">
          <template #body="{ data }">
            <span :class="['po-badge', data.status]">{{ statusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="วันที่" style="width:110px;">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="จัดการ" style="width:100px;">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                :icon="data.status === 'done' || data.status === 'cancelled' ? 'pi pi-eye' : 'pi pi-arrow-right'"
                size="small" text rounded
                :v-tooltip="data.status === 'done' ? 'ดูรายละเอียด' : 'ดำเนินการผลิต'"
                @click="router.push(`/production/process/${data.id}`)" />
              <Button v-if="['draft','confirmed'].includes(data.status)"
                icon="pi pi-times" size="small" text rounded severity="danger"
                @click="confirmCancel(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="สร้างใบสั่งผลิต" :style="{ width: '480px' }" modal>
      <div class="dialog-form">
        <div class="form-field">
          <label>สูตร / Formula <span class="req">*</span></label>
          <Dropdown v-model="createForm.formulaId" :options="activeFormulaOptions"
            optionLabel="label" optionValue="value"
            filter placeholder="เลือกสูตร..." style="width:100%;" @change="onFormulaChange" />
        </div>

        <div v-if="createForm.formulaId" class="formula-preview">
          <div class="preview-row">
            <span>ส่วนผสม:</span>
            <strong>{{ getIngredientCount(createForm.formulaId) }} รายการ</strong>
          </div>
          <div class="preview-row">
            <span>Output / Batch:</span>
            <strong>{{ getOutputPerBatch(createForm.formulaId) }}</strong>
          </div>
        </div>

        <div class="form-field">
          <label>จำนวน Batch <span class="req">*</span></label>
          <InputNumber v-model="createForm.batches" :min="1" :max="100" style="width:100%;" showButtons />
        </div>

        <div v-if="createForm.formulaId && createForm.batches" class="total-preview">
          Output รวมโดยประมาณ: <strong>{{ getEstimatedOutput(createForm.formulaId, createForm.batches) }}</strong>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" text @click="showCreate = false" />
        <Button label="สร้างและยืนยัน" icon="pi pi-check" class="btn-primary" @click="doCreate" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useProductionStore } from '@/stores/production'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const productionStore = useProductionStore()

const filterStatus = ref(null)
const filterFormula = ref(null)
const showCreate = ref(false)
const createForm = ref({ formulaId: null, batches: 1 })

const statusOptions = [
  { label: 'ยืนยันแล้ว', value: 'confirmed' },
  { label: 'กำลังแปรรูป', value: 'processing' },
  { label: 'กำลังผสม', value: 'mixing' },
  { label: 'กำลังบรรจุ', value: 'packing' },
  { label: 'รอรับเข้า Semi', value: 'receiving' },
  { label: 'เสร็จสิ้น', value: 'done' },
  { label: 'ยกเลิก', value: 'cancelled' },
]

const formulaOptions = computed(() =>
  productionStore.formulas.map(f => ({ label: `${f.code} — ${f.name}`, value: f.id }))
)
const activeFormulaOptions = computed(() =>
  productionStore.formulas.filter(f => f.active).map(f => ({ label: `${f.code} — ${f.name}`, value: f.id }))
)
const filtered = computed(() =>
  productionStore.orders.filter(o => {
    const matchStatus = !filterStatus.value || o.status === filterStatus.value
    const matchFormula = !filterFormula.value || o.formulaId === filterFormula.value
    return matchStatus && matchFormula
  })
)

function getFormula(id) { return productionStore.getFormulaById(id) }
function getFormulaName(id) { return getFormula(id)?.name || '—' }
function getIngredientCount(id) { return getFormula(id)?.ingredients.length || 0 }
function getOutputPerBatch(id) {
  const f = getFormula(id)
  return f ? `${f.outputQtyPerBatch.toLocaleString()} ${f.outputUnit}` : '—'
}
function getEstimatedOutput(id, batches) {
  const f = getFormula(id)
  return f ? `${(f.outputQtyPerBatch * batches).toLocaleString()} ${f.outputUnit}` : '—'
}
function statusLabel(s) {
  return { confirmed: 'ยืนยันแล้ว', processing: 'กำลังแปรรูป', mixing: 'กำลังผสม', packing: 'กำลังบรรจุ', receiving: 'รอรับเข้า Semi', done: 'เสร็จสิ้น', cancelled: 'ยกเลิก' }[s] || s
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function openCreate() {
  createForm.value = { formulaId: null, batches: 1 }
  showCreate.value = true
}
function onFormulaChange() { createForm.value.batches = 1 }

function doCreate() {
  if (!createForm.value.formulaId) {
    toast.add({ severity: 'warn', summary: 'กรุณาเลือกสูตร', life: 3000 })
    return
  }
  const order = productionStore.createOrder(createForm.value.formulaId, createForm.value.batches)
  showCreate.value = false
  toast.add({ severity: 'success', summary: 'สร้างใบสั่งผลิตสำเร็จ', detail: order.docNo, life: 3000 })
  router.push(`/production/process/${order.id}`)
}

function confirmCancel(order) {
  confirm.require({
    message: `ต้องการยกเลิกใบสั่งผลิต ${order.docNo} ใช่หรือไม่?`,
    header: 'ยืนยันการยกเลิก',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      productionStore.cancelOrder(order.id)
      toast.add({ severity: 'info', summary: 'ยกเลิกแล้ว', detail: order.docNo, life: 3000 })
    }
  })
}
</script>

<style scoped>
.stat-chips { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-chip {
  background: #fff; border-radius: 10px; padding: 12px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08); display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.chip-num  { font-size: 22px; font-weight: 700; color: #1e2a3b; }
.chip-label { font-size: 12px; color: var(--gl-text-muted); }
.stat-chip.confirmed .chip-num  { color: #3b82f6; }
.stat-chip.in-progress .chip-num { color: #f59e0b; }
.stat-chip.done .chip-num       { color: #10b981; }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 500; }
.req { color: var(--gl-red); }
.formula-preview {
  background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px;
}
.preview-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
.total-preview {
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 10px 14px; font-size: 13px; text-align: center; color: #166534;
}
.po-badge {
  display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
}
.po-badge.confirmed { background: #dbeafe; color: #1d4ed8; }
.po-badge.mixing      { background: #fef3c7; color: #b45309; }
.po-badge.processing  { background: #ffedd5; color: #c2410c; }
.po-badge.packing     { background: #ede9fe; color: #6d28d9; }
.po-badge.receiving   { background: #cffafe; color: #0e7490; }
.po-badge.done      { background: #dcfce7; color: #166534; }
.po-badge.cancelled { background: #fee2e2; color: #991b1b; }
</style>
