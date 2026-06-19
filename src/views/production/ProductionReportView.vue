<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">รายงานการผลิต</div>
        <div class="page-subtitle">สรุปผลการผลิตทั้งหมด</div>
      </div>
    </div>

    <div class="summary-row">
      <div class="sum-card">
        <div class="sum-icon" style="background:#dbeafe; color:#2563eb"><i class="pi pi-list-check" /></div>
        <div><div class="sum-num">{{ allOrders.length }}</div><div class="sum-label">ใบสั่งผลิตทั้งหมด</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon" style="background:#dcfce7; color:#16a34a"><i class="pi pi-check-circle" /></div>
        <div><div class="sum-num">{{ doneOrders.length }}</div><div class="sum-label">เสร็จสิ้น</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon" style="background:#fef3c7; color:#d97706"><i class="pi pi-cog" /></div>
        <div><div class="sum-num">{{ inProgressOrders.length }}</div><div class="sum-label">กำลังผลิต</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon" style="background:#f3e8ff; color:#9333ea"><i class="pi pi-box" /></div>
        <div><div class="sum-num">{{ totalOutput.toLocaleString() }}</div><div class="sum-label">Output รวม (หน่วย)</div></div>
      </div>
      <div class="sum-card">
        <div class="sum-icon" style="background:#fce7f3; color:#db2777"><i class="pi pi-book" /></div>
        <div><div class="sum-num">{{ totalBatches }}</div><div class="sum-label">Batch รวม</div></div>
      </div>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <Dropdown v-model="filterFormula" :options="formulaOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสูตร" showClear style="width:260px;" filter />
        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสถานะ" showClear style="width:180px;" />
      </div>

      <DataTable :value="filtered" :paginator="true" :rows="20"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}" size="small" stripedRows>
        <Column field="docNo" header="เลขที่" style="width:160px; font-family:monospace; font-size:12px;" sortable />
        <Column header="สูตร">
          <template #body="{ data }">
            <div style="font-weight:500;">{{ getFormulaName(data.formulaId) }}</div>
          </template>
        </Column>
        <Column header="Batch" style="width:70px; text-align:center;">
          <template #body="{ data }">{{ data.plannedBatches }}</template>
        </Column>
        <Column header="Output จริง" style="width:130px;">
          <template #body="{ data }">
            <strong v-if="data.actualOutput" style="color:#166534">{{ data.actualOutput.toLocaleString() }}</strong>
            <span v-else style="color:var(--gl-text-muted)">—</span>
          </template>
        </Column>
        <Column header="FG Lot" style="width:190px;">
          <template #body="{ data }">
            <span v-if="data.fgLot?.lotNo" class="fg-lot-badge">{{ data.fgLot.lotNo }}</span>
            <span v-else style="color:var(--gl-text-muted)">—</span>
          </template>
        </Column>
        <Column header="สถานะ" style="width:130px;">
          <template #body="{ data }">
            <span :class="['po-badge', data.status]">{{ statusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="วันที่เสร็จ" style="width:140px;">
          <template #body="{ data }">{{ data.completedAt ? formatDt(data.completedAt) : '—' }}</template>
        </Column>
        <Column style="width:56px;">
          <template #body="{ data }">
            <Button icon="pi pi-eye" size="small" text rounded
              @click="router.push(`/production/process/${data.id}`)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductionStore } from '@/stores/production'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()
const productionStore = useProductionStore()

const filterFormula = ref(null)
const filterStatus = ref(null)

const allOrders = computed(() => productionStore.orders.filter(o => o.status !== 'cancelled'))
const doneOrders = computed(() => productionStore.orders.filter(o => o.status === 'done'))
const inProgressOrders = computed(() => productionStore.orders.filter(o => ['mixing', 'receiving'].includes(o.status)))
const totalOutput = computed(() => doneOrders.value.reduce((s, o) => s + (o.actualOutput || 0), 0))
const totalBatches = computed(() => allOrders.value.reduce((s, o) => s + o.plannedBatches, 0))

const statusOptions = [
  { label: 'ยืนยันแล้ว', value: 'confirmed' },
  { label: 'กำลังผสม', value: 'mixing' },
  { label: 'รอรับเข้า Semi', value: 'receiving' },
  { label: 'เสร็จสิ้น', value: 'done' },
  { label: 'ยกเลิก', value: 'cancelled' },
]
const formulaOptions = computed(() =>
  productionStore.formulas.map(f => ({ label: `${f.code} — ${f.name}`, value: f.id }))
)
const filtered = computed(() =>
  productionStore.orders.filter(o => {
    const matchFormula = !filterFormula.value || o.formulaId === filterFormula.value
    const matchStatus  = !filterStatus.value || o.status === filterStatus.value
    return matchFormula && matchStatus
  })
)

function getFormula(id) { return productionStore.getFormulaById(id) }
function getFormulaName(id) { return getFormula(id)?.name || '—' }
function statusLabel(s) {
  return { confirmed: 'ยืนยันแล้ว', mixing: 'กำลังผสม', receiving: 'รอรับเข้า Semi', done: 'เสร็จสิ้น', cancelled: 'ยกเลิก' }[s] || s
}
function formatDt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.summary-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.sum-card {
  background: #fff; border-radius: 10px; padding: 14px 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08); display: flex; align-items: center; gap: 14px; flex: 1; min-width: 150px;
}
.sum-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.sum-num   { font-size: 22px; font-weight: 700; color: #1e2a3b; }
.sum-label { font-size: 12px; color: var(--gl-text-muted); }
.fg-lot-badge { background: #f0fdf4; color: #166534; font-family: monospace; font-size: 12px; padding: 2px 7px; border-radius: 4px; }
.po-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.po-badge.confirmed { background: #dbeafe; color: #1d4ed8; }
.po-badge.mixing      { background: #fef3c7; color: #b45309; }
.po-badge.processing  { background: #ffedd5; color: #c2410c; }
.po-badge.packing     { background: #ede9fe; color: #6d28d9; }
.po-badge.done      { background: #dcfce7; color: #166534; }
.po-badge.cancelled { background: #fee2e2; color: #991b1b; }
</style>
