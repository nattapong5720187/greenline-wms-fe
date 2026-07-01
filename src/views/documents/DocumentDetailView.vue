<template>
  <div v-if="doc">
    <!-- Screen view -->
    <div class="page-header no-print">
      <div>
        <div class="page-title">{{ doc.docNo }}</div>
        <div class="page-subtitle">รายละเอียดเอกสาร</div>
      </div>
      <div style="display:flex; gap:8px;">
        <RouterLink to="/documents"><Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined /></RouterLink>
        <Button v-if="doc.status === 'draft'" label="ส่งอนุมัติ" icon="pi pi-send" outlined @click="submitDoc" />
        <Button v-if="doc.status === 'pending' && authStore.isSuperAdmin" label="อนุมัติ" icon="pi pi-check" class="btn-primary" @click="approveDoc" />
        <Button v-if="doc.status === 'approved' && doc.type === 'requisition'" label="จ่ายของ (ตัดสต๊อก)" icon="pi pi-check-circle" class="btn-primary" @click="issueDoc" />
        <Button icon="pi pi-print" label="พิมพ์" outlined @click="handlePrint" />
      </div>
    </div>

    <div class="page-card no-print">
      <div class="doc-meta-grid">
        <div class="meta-item">
          <span class="meta-label">เลขเอกสาร</span>
          <span class="meta-val mono">{{ doc.docNo }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">ประเภท</span>
          <span :class="['status-badge', docTypeClass(doc.type)]">{{ docTypeLabel(doc.type) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">สถานะ</span>
          <span :class="['status-badge', docStatusClass(doc.status)]">{{ docStatusLabel(doc.status) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">คลัง</span>
          <span class="meta-val">{{ masterStore.getWarehouseById(doc.warehouseId)?.name }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">สร้างโดย</span>
          <span class="meta-val">{{ getUsername(doc.createdBy) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">วันที่สร้าง</span>
          <span class="meta-val">{{ formatDate(doc.createdAt) }}</span>
        </div>
        <div v-if="doc.approvedBy" class="meta-item">
          <span class="meta-label">อนุมัติโดย</span>
          <span class="meta-val">{{ getUsername(doc.approvedBy) }}</span>
        </div>
        <div class="meta-item" style="grid-column: 1/-1;" v-if="doc.remark">
          <span class="meta-label">หมายเหตุ</span>
          <span class="meta-val">{{ doc.remark }}</span>
        </div>
      </div>

      <div class="divider" />

      <h4 class="section-label">รายการสินค้า</h4>
      <DataTable :value="doc.items" size="small">
        <Column header="#" style="width: 44px;"><template #body="{ index }">{{ index + 1 }}</template></Column>
        <Column header="รหัสสินค้า" style="font-family: monospace; font-size: 12px; width: 110px;">
          <template #body="{ data }">{{ masterStore.getProductById(data.productId)?.code }}</template>
        </Column>
        <Column header="ชื่อสินค้า">
          <template #body="{ data }">{{ masterStore.getProductById(data.productId)?.name }}</template>
        </Column>
        <Column header="จำนวน" style="width: 90px; text-align: right;" field="qty" />
        <Column header="หน่วย" style="width: 70px;">
          <template #body="{ data }">
            {{ masterStore.getUnitById(masterStore.getProductById(data.productId)?.unitId)?.abbr }}
          </template>
        </Column>
        <Column header="Lot" style="width: 180px; font-family: monospace; font-size: 12px;">
          <template #body="{ data }">{{ data.lotId || '-' }}</template>
        </Column>
        <Column header="หมายเหตุ" style="width: 160px;">
          <template #body="{ data }">{{ data.itemRemark || '-' }}</template>
        </Column>
      </DataTable>

      <div class="signature-row">
        <div class="sig-box"><div class="sig-line" />ผู้เบิก/ผู้ขอ</div>
        <div class="sig-box"><div class="sig-line" />ผู้อนุมัติ</div>
        <div class="sig-box"><div class="sig-line" />ผู้จ่าย/ผู้รับ</div>
      </div>
    </div>

    <!-- ===== Print Layout ===== -->
    <div id="printDoc">
      <div class="pd-top">
        <img src="@/assets/img/logo.png" alt="Greenline" class="pd-logo" />
        <div class="pd-title-wrap">
          <div class="pd-title">{{ printTitle }}</div>
        </div>
        <div class="pd-docno">{{ doc.docNo }}</div>
      </div>

      <table class="pd-info-table">
        <tr>
          <td>ฝ่ายที่ขอเบิก: <strong>{{ warehouseName }}</strong></td>
          <td>รหัสฝ่าย: <strong>{{ warehouseCode }}</strong></td>
          <td>วันที่ขอเบิก: <strong>{{ formatDatePrint(doc.createdAt) }}</strong></td>
        </tr>
      </table>

      <table class="pd-table">
        <thead>
          <tr>
            <th v-for="col in printColumns" :key="col" :class="col === 'รายการ' ? 'col-wide' : ''">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in doc.items" :key="item.productId">
            <td class="mono-cell">{{ getProductCode(item.productId) }}</td>
            <td>{{ getProductName(item.productId) }}</td>
            <td class="center-cell">{{ item.qty }}</td>
            <td class="center-cell">{{ doc.status === 'issued' ? item.qty : '' }}</td>
            <td class="mono-cell">{{ item.lotId || '' }}</td>
            <td class="center-cell">{{ formatDateTimePrint(doc.createdAt) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pd-notes">
        <p><strong>หมายเหตุ</strong>  1.กรณีเบิกคนและประเภทให้แยกใบเบิก  2.ต้นฉบับให้ฝ่ายคลัง และสำเนาเก็บไว้ที่ฝ่ายผู้เบิก</p>
        <p v-if="doc.remark" style="margin-top:4px;">{{ doc.remark }}</p>
      </div>

      <div class="pd-sigs">
        <div class="pd-sig-left">ผู้ขอเบิก: {{ getUsername(doc.createdBy) }}&nbsp;&nbsp;&nbsp;วันที่:</div>
        <div class="pd-sig-right">ผู้จ่าย:...................................วันที่......./......./.......</div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">ไม่พบเอกสาร</div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useMasterStore } from '@/stores/master'
import { useDocumentStore } from '@/stores/documents'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const docStore = useDocumentStore()

onMounted(() => {
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
  if (!masterStore.products.length) masterStore.fetchProducts()
  if (!masterStore.units.length) masterStore.fetchUnits()
})

const doc = computed(() => docStore.getById(route.params.id))

const warehouseName = computed(() => masterStore.getWarehouseById(doc.value?.warehouseId)?.name || '-')
const warehouseCode = computed(() => {
  const name = warehouseName.value
  if (name.includes('ห้องเย็น 1')) return 'CL1'
  if (name.includes('ห้องเย็น 2')) return 'CL2'
  return 'MN'
})

const printTitle = computed(() => ({
  receipt: 'ใบรับเข้าสินค้า',
  requisition: 'ใบเบิก-จ่ายสินค้า',
  return: 'ใบคืนสินค้า',
}[doc.value?.type] || 'เอกสาร'))

const printColumns = computed(() => {
  if (doc.value?.type === 'receipt') return ['Code', 'รายการ', 'จำนวนรับ', 'หน่วย', 'Lot', 'หมายเหตุ']
  if (doc.value?.type === 'return') return ['Code', 'รายการ', 'จำนวนคืน', 'หน่วย', 'Lot', 'หมายเหตุ']
  return ['Code', 'รายการ', 'จำนวนเบิก', 'จำนวนจ่าย', 'Lot', 'วันที่ต้องการ']
})

function docTypeLabel(t) { return { receipt: 'ใบรับเข้า (GR)', requisition: 'ใบเบิก-จ่าย (RQ)', return: 'ใบคืนสินค้า (RT)' }[t] || t }
function docStatusLabel(s) { return { draft: 'Draft', pending: 'รออนุมัติ', approved: 'อนุมัติ', issued: 'จ่ายแล้ว', cancelled: 'ยกเลิก' }[s] || s }
function docTypeClass(t) { return { receipt: 'doc-receipt', requisition: 'doc-requisition', return: 'doc-return' }[t] || '' }
function docStatusClass(s) { return { draft: 'doc-status-draft', pending: 'doc-status-pending', approved: 'doc-status-approved', issued: 'doc-status-issued' }[s] || '' }
function formatDate(dt) { return new Date(dt).toLocaleString('th-TH') }
function getUsername(id) { return masterStore.users.find(u => u.id === id)?.name || id }
function getProductCode(id) { return masterStore.getProductById(id)?.code || id }
function getProductName(id) { return masterStore.getProductById(id)?.name || id }

function formatDatePrint(dt) {
  const d = new Date(dt)
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const yr = d.getFullYear()
  return `${day}/${mon}/${yr}`
}

function formatDateTimePrint(dt) {
  const d = new Date(dt)
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const yr = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${day}/${mon}/${yr} ${hh}:${mm}:${ss}`
}

function submitDoc() {
  docStore.updateStatus(doc.value.id, 'pending', authStore.user?.id)
  toast.add({ severity: 'info', summary: 'ส่งอนุมัติแล้ว', life: 3000 })
}
function approveDoc() {
  docStore.updateStatus(doc.value.id, 'approved', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'อนุมัติสำเร็จ', life: 3000 })
}
function issueDoc() {
  docStore.updateStatus(doc.value.id, 'issued', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'จ่ายของ / ตัดสต๊อกแล้ว', life: 3000 })
}
function handlePrint() { window.print() }
</script>

<style scoped>
.doc-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.meta-item { display: flex; flex-direction: column; gap: 3px; }
.meta-label { font-size: 11px; color: var(--gl-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.meta-val { font-size: 14px; font-weight: 500; }
.mono { font-family: monospace; }
.divider { height: 1px; background: var(--gl-border); margin: 18px 0; }
.section-label { font-size: 14px; font-weight: 600; color: var(--gl-navy); margin-bottom: 10px; }
.not-found { text-align: center; padding: 48px; color: var(--gl-text-muted); font-size: 16px; }
.signature-row { display: flex; gap: 24px; margin-top: 40px; justify-content: flex-end; }
.sig-box { width: 160px; text-align: center; font-size: 12px; color: var(--gl-text-muted); }
.sig-line { height: 1px; background: var(--gl-text-muted); margin-bottom: 6px; margin-top: 32px; }

/* Hide print doc on screen */
#printDoc { display: none; }
</style>

<style>
/* Print styles — unscoped to reach layout elements */
@media print {
  #printDoc {
    display: block !important;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    color: #000;
    padding: 12mm 14mm;
  }

  /* Header: logo | title | docno */
  .pd-top {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 12px;
  }
  .pd-logo {
    height: 60px;
    width: auto;
    flex-shrink: 0;
  }
  .pd-title-wrap {
    flex: 1;
    text-align: center;
  }
  .pd-title {
    font-size: 16px;
    font-weight: 700;
  }
  .pd-docno {
    font-size: 11px;
    text-align: right;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Info table */
  .pd-info-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    margin-bottom: 10px;
    font-size: 12px;
  }
  .pd-info-table td {
    padding: 5px 10px;
    border: 1px solid #000;
    width: 33.3%;
  }

  /* Items table */
  .pd-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    font-size: 12px;
    margin-bottom: 14px;
  }
  .pd-table th {
    border: 1px solid #000;
    padding: 5px 8px;
    text-align: center;
    font-weight: 600;
    background: #fff;
  }
  .pd-table td {
    border: 1px solid #000;
    padding: 6px 8px;
    vertical-align: middle;
  }
  .pd-table .col-wide { min-width: 160px; }
  .pd-table .center-cell { text-align: center; }
  .pd-table .mono-cell { font-family: monospace; font-size: 11px; }
  .pd-table tbody tr { min-height: 28px; }

  /* Notes */
  .pd-notes {
    font-size: 11px;
    margin-bottom: 20px;
    line-height: 1.7;
  }

  /* Signatures */
  .pd-sigs {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 16px;
  }
}
</style>
