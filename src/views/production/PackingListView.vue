<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">แพ็ค</div>
        <div class="page-subtitle">แปลงสินค้า Semi เป็นสินค้าสำเร็จรูป (FG) และของเสีย</div>
      </div>
      <Button label="สร้างใบแพ็ค" icon="pi pi-plus" class="btn-primary" @click="router.push('/production/packing/create')" />
    </div>

    <div class="stat-chips">
      <div class="stat-chip">
        <span class="chip-num">{{ packingStore.counts.all }}</span>
        <span class="chip-label">ใบแพ็คทั้งหมด</span>
      </div>
      <div class="stat-chip fg">
        <span class="chip-num">{{ packingStore.counts.totalFg.toLocaleString() }}</span>
        <span class="chip-label">FG รวม</span>
      </div>
      <div class="stat-chip rejected">
        <span class="chip-num">{{ packingStore.counts.totalRejected.toLocaleString() }}</span>
        <span class="chip-label">ของเสียรวม</span>
      </div>
    </div>

    <div class="page-card">
      <DataTable :value="packingStore.packings" :paginator="true" :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}" size="small" stripedRows>
        <Column field="docNo" header="เลขที่" style="width:160px; font-family:monospace; font-size:12px;" sortable />
        <Column header="สินค้า Semi (Input)">
          <template #body="{ data }">
            <div style="font-weight:500;">{{ productName(data.semiProductId) }}</div>
            <div class="code-sub">{{ productCode(data.semiProductId) }}</div>
          </template>
        </Column>
        <Column header="นำเข้า" style="width:120px; text-align:right;">
          <template #body="{ data }">{{ data.inputQty.toLocaleString() }} {{ unitOf(data.semiProductId) }}</template>
        </Column>
        <Column header="FG (ดี)" style="width:120px; text-align:right;">
          <template #body="{ data }">
            <strong style="color:#166534">{{ data.fgQty.toLocaleString() }}</strong>
          </template>
        </Column>
        <Column header="ของเสีย (Rejected)" style="width:150px; text-align:right;">
          <template #body="{ data }">
            <span :style="{ color: data.rejectedQty > 0 ? '#b91c1c' : 'var(--gl-text-muted)' }">
              {{ data.rejectedQty.toLocaleString() }}
            </span>
          </template>
        </Column>
        <Column header="สถานะ" style="width:120px;">
          <template #body>
            <span class="pk-badge done">เสร็จสิ้น</span>
          </template>
        </Column>
        <Column header="วันที่" style="width:110px;">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { usePackingStore } from '@/stores/packing'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()
const packingStore = usePackingStore()
const masterStore = useMasterStore()

function productName(id) { return masterStore.getProductById(id)?.name || '—' }
function productCode(id) { return masterStore.getProductById(id)?.code || '—' }
function unitOf(id) {
  const p = masterStore.getProductById(id)
  return masterStore.getUnitById(p?.unitId)?.abbr || ''
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
.stat-chip.fg .chip-num       { color: #10b981; }
.stat-chip.rejected .chip-num { color: #ef4444; }
.code-sub { font-size: 11px; color: var(--gl-text-muted); font-family: monospace; }
.pk-badge {
  display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
}
.pk-badge.done { background: #dcfce7; color: #166534; }
</style>
