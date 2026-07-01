<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">รายการเอกสาร</div>
        <div class="page-subtitle">เบิก / จ่าย / คืน / รับเข้า</div>
      </div>
      <div style="display:flex; gap:8px;">
        <RouterLink to="/documents/receipt/create">
          <Button label="รับเข้า" icon="pi pi-download" outlined size="small" />
        </RouterLink>
        <RouterLink to="/documents/requisition/create">
          <Button label="เบิก-จ่าย" icon="pi pi-upload" outlined size="small" />
        </RouterLink>
        <RouterLink to="/documents/return/create">
          <Button label="คืน" icon="pi pi-reply" outlined size="small" />
        </RouterLink>
      </div>
    </div>

    <!-- Type tabs -->
    <div class="type-tabs">
      <button
        v-for="t in typeFilters" :key="t.value"
        :class="['type-tab', { active: activeType === t.value }]"
        @click="activeType = t.value"
      >
        <span :class="['tab-dot', t.dotClass]" />
        {{ t.label }}
        <span class="tab-count">{{ getCount(t.value) }}</span>
      </button>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหาเลขเอกสาร..." style="padding-left: 2.2rem; width: 240px;" />
        </span>
        <Dropdown
          v-model="filterStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="ทุกสถานะ"
          showClear
          style="width: 160px;"
        />
        <Dropdown
          v-model="filterWarehouse"
          :options="masterStore.warehouses"
          optionLabel="name"
          optionValue="id"
          placeholder="ทุกคลัง"
          showClear
          style="width: 150px;"
        />
      </div>

      <DataTable :value="filtered" size="small" stripedRows :paginator="true" :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}">
        <Column field="docNo" header="เลขเอกสาร" style="font-family: monospace; font-size: 12px; width: 160px;" sortable />
        <Column header="ประเภท" style="width: 120px;">
          <template #body="{ data }">
            <span :class="['status-badge', docTypeClass(data.type)]">{{ docTypeLabel(data.type) }}</span>
          </template>
        </Column>
        <Column header="คลัง" style="width: 120px;">
          <template #body="{ data }">{{ masterStore.getWarehouseById(data.warehouseId)?.name || '-' }}</template>
        </Column>
        <Column header="สถานะ" style="width: 120px;">
          <template #body="{ data }">
            <span :class="['status-badge', docStatusClass(data.status)]">{{ docStatusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="รายการ" style="width: 80px; text-align: center;">
          <template #body="{ data }">{{ data.items?.length || 0 }}</template>
        </Column>
        <Column header="สร้างเมื่อ" style="width: 130px;">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="หมายเหตุ">
          <template #body="{ data }">
            <span style="font-size: 12px; color: var(--gl-text-muted);">{{ data.remark }}</span>
          </template>
        </Column>
        <Column header="จัดการ" style="width: 130px;">
          <template #body="{ data }">
            <div class="action-btns">
              <RouterLink :to="`/documents/${data.id}`">
                <Button icon="pi pi-eye" size="small" text rounded v-tooltip="'ดูรายละเอียด'" />
              </RouterLink>
              <Button
                v-if="data.status === 'draft'"
                icon="pi pi-send"
                size="small" text rounded
                v-tooltip="'ส่งอนุมัติ'"
                @click="submitDoc(data)"
              />
              <Button
                v-if="data.status === 'pending' && authStore.isSuperAdmin"
                icon="pi pi-check"
                size="small" text rounded
                severity="success"
                v-tooltip="'อนุมัติ'"
                @click="approveDoc(data)"
              />
              <Button
                v-if="data.status === 'approved' && data.type === 'requisition'"
                icon="pi pi-arrow-right"
                size="small" text rounded
                v-tooltip="'จ่ายของ (ตัดสต๊อก)'"
                @click="issueDoc(data)"
              />
              <Button icon="pi pi-print" size="small" text rounded v-tooltip="'พิมพ์'" @click="printDoc(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useMasterStore } from '@/stores/master'
import { useDocumentStore } from '@/stores/documents'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const docStore = useDocumentStore()

const search = ref('')
const activeType = ref('all')
const filterStatus = ref(null)
const filterWarehouse = ref(null)

onMounted(() => {
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
})

const typeFilters = [
  { value: 'all',         label: 'ทั้งหมด',  dotClass: '' },
  { value: 'receipt',     label: 'รับเข้า',   dotClass: 'dot-green' },
  { value: 'requisition', label: 'เบิก-จ่าย', dotClass: 'dot-blue' },
  { value: 'return',      label: 'คืนสินค้า', dotClass: 'dot-purple' },
]

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'รออนุมัติ', value: 'pending' },
  { label: 'อนุมัติ', value: 'approved' },
  { label: 'จ่ายแล้ว', value: 'issued' },
  { label: 'ยกเลิก', value: 'cancelled' },
]

const filtered = computed(() => {
  return docStore.documents.filter(d => {
    const q = search.value.toLowerCase()
    const matchType = activeType.value === 'all' || d.type === activeType.value
    const matchText = !q || d.docNo.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || d.status === filterStatus.value
    const matchWh = !filterWarehouse.value || d.warehouseId === filterWarehouse.value
    return matchType && matchText && matchStatus && matchWh
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

function getCount(type) {
  return type === 'all' ? docStore.documents.length : docStore.documents.filter(d => d.type === type).length
}

function docTypeLabel(t) { return { receipt: 'รับเข้า', requisition: 'เบิก-จ่าย', return: 'คืนสินค้า' }[t] || t }
function docStatusLabel(s) { return { draft: 'Draft', pending: 'รออนุมัติ', approved: 'อนุมัติ', issued: 'จ่ายแล้ว', cancelled: 'ยกเลิก', rejected: 'ปฏิเสธ' }[s] || s }
function docTypeClass(t) { return { receipt: 'doc-receipt', requisition: 'doc-requisition', return: 'doc-return' }[t] || '' }
function docStatusClass(s) { return { draft: 'doc-status-draft', pending: 'doc-status-pending', approved: 'doc-status-approved', issued: 'doc-status-issued', cancelled: 'doc-status-cancelled' }[s] || '' }
function formatDate(dt) { return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }

function submitDoc(doc) {
  docStore.updateStatus(doc.id, 'pending', authStore.user?.id)
  toast.add({ severity: 'info', summary: 'ส่งอนุมัติแล้ว', detail: doc.docNo, life: 3000 })
}
function approveDoc(doc) {
  docStore.updateStatus(doc.id, 'approved', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'อนุมัติสำเร็จ', detail: doc.docNo, life: 3000 })
}
function issueDoc(doc) {
  docStore.updateStatus(doc.id, 'issued', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'จ่ายของ / ตัดสต๊อกแล้ว', detail: doc.docNo, life: 3000 })
}
function printDoc(doc) {
  toast.add({ severity: 'info', summary: 'พิมพ์เอกสาร', detail: `${doc.docNo} (demo)`, life: 3000 })
}
</script>

<style scoped>
.type-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.type-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--gl-border);
  background: var(--gl-surface); cursor: pointer; font-family: 'Kanit', sans-serif;
  font-size: 13px; color: var(--gl-text-muted); transition: all 0.15s;
}
.type-tab:hover { background: var(--gl-bg); color: var(--gl-navy); }
.type-tab.active { background: var(--gl-navy); color: #fff; border-color: var(--gl-navy); }
.tab-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.dot-green { background: var(--gl-success) !important; }
.dot-blue  { background: #3B82F6 !important; }
.dot-purple{ background: #8B5CF6 !important; }
.tab-count { background: rgba(255,255,255,0.2); border-radius: 999px; padding: 1px 7px; font-size: 11px; font-weight: 600; }
.type-tab:not(.active) .tab-count { background: var(--gl-bg); color: var(--gl-navy); }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.action-btns { display: flex; gap: 2px; }
</style>
