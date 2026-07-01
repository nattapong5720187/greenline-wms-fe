<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? `เอกสาร ${doc?.docNo}` : 'สร้างใบเบิก-จ่าย (RQ)' }}</div>
        <div class="page-subtitle">{{ isEdit ? 'รายละเอียดเอกสาร' : 'เบิกสินค้าจากคลัง — คลังกด "จ่าย" เพื่อตัดสต๊อก' }}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <RouterLink to="/documents">
          <Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined />
        </RouterLink>
        <Button v-if="isEdit && doc?.status === 'approved'" label="จ่ายของ (ตัดสต๊อก)" icon="pi pi-check-circle" class="btn-primary" @click="issueDoc" />
        <Button v-if="isEdit" icon="pi pi-print" label="พิมพ์" outlined @click="printDoc" />
      </div>
    </div>

    <!-- View mode (existing doc) -->
    <template v-if="isEdit && doc">
      <div class="page-card">
        <div class="doc-info-grid">
          <div class="doc-info-item">
            <span class="di-label">เลขเอกสาร</span>
            <span class="di-val mono">{{ doc.docNo }}</span>
          </div>
          <div class="doc-info-item">
            <span class="di-label">ประเภท</span>
            <span :class="['status-badge', 'doc-requisition']">เบิก-จ่าย</span>
          </div>
          <div class="doc-info-item">
            <span class="di-label">สถานะ</span>
            <span :class="['status-badge', docStatusClass(doc.status)]">{{ docStatusLabel(doc.status) }}</span>
          </div>
          <div class="doc-info-item">
            <span class="di-label">คลัง</span>
            <span class="di-val">{{ masterStore.getWarehouseById(doc.warehouseId)?.name }}</span>
          </div>
          <div class="doc-info-item">
            <span class="di-label">วันที่สร้าง</span>
            <span class="di-val">{{ formatDate(doc.createdAt) }}</span>
          </div>
          <div class="doc-info-item form-full">
            <span class="di-label">หมายเหตุ</span>
            <span class="di-val">{{ doc.remark || '-' }}</span>
          </div>
        </div>
        <div class="divider" />
        <DataTable :value="doc.items" size="small">
          <Column header="#"><template #body="{ index }">{{ index + 1 }}</template></Column>
          <Column header="สินค้า"><template #body="{ data }">{{ masterStore.getProductById(data.productId)?.name }}</template></Column>
          <Column header="รหัส" style="font-family: monospace; font-size: 12px;"><template #body="{ data }">{{ masterStore.getProductById(data.productId)?.code }}</template></Column>
          <Column field="qty" header="จำนวน" />
          <Column header="หน่วย"><template #body="{ data }">{{ masterStore.getUnitById(masterStore.getProductById(data.productId)?.unitId)?.abbr }}</template></Column>
          <Column header="Lot" style="font-family: monospace; font-size: 12px;"><template #body="{ data }">{{ data.lotId || '-' }}</template></Column>
        </DataTable>
      </div>
    </template>

    <!-- Create mode -->
    <template v-else>
      <div class="page-card">
        <div class="form-grid">
          <div>
            <label class="field-label">คลังที่เบิก <span class="req">*</span></label>
            <Dropdown v-model="form.warehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id" placeholder="เลือกคลัง" class="w-full" />
          </div>
          <div>
            <label class="field-label">หมายเหตุ/วัตถุประสงค์</label>
            <InputText v-model="form.remark" class="w-full" placeholder="เช่น เบิกสำหรับ Batch #001" />
          </div>
        </div>

        <div class="divider" />

        <div class="items-header">
          <h3 class="items-title">รายการสินค้าที่ขอเบิก</h3>
          <Button label="เพิ่มรายการ" icon="pi pi-plus" size="small" class="btn-primary" @click="addItem" />
        </div>

        <DataTable :value="form.items" size="small">
          <Column header="#"><template #body="{ index }">{{ index + 1 }}</template></Column>
          <Column header="สินค้า *" style="min-width: 220px;">
            <template #body="{ data }">
              <Dropdown v-model="data.productId" :options="masterStore.products" optionLabel="name" optionValue="id"
                :filter="true" filterPlaceholder="ค้นหา..." placeholder="เลือกสินค้า" class="w-full"
                @change="onProductChange(data)" />
            </template>
          </Column>
          <Column header="จำนวน *" style="width: 120px;">
            <template #body="{ data }"><InputNumber v-model="data.qty" :min="1" class="w-full" /></template>
          </Column>
          <Column header="หน่วย" style="width: 80px;">
            <template #body="{ data }">{{ getUnitAbbr(getProduct(data.productId)?.unitId) }}</template>
          </Column>
          <Column header="Lot (FIFO)" style="width: 200px;">
            <template #body="{ data }">
              <Dropdown
                v-model="data.lotId"
                :options="getLots(data.productId)"
                optionLabel="lotNo"
                optionValue="id"
                :disabled="!data.productId || !getProduct(data.productId)?.requireLot"
                placeholder="เลือก Lot"
                class="w-full"
              >
                <template #option="{ option }">
                  <div style="font-size: 12px;">
                    <div style="font-family: monospace;">{{ option.lotNo }}</div>
                    <div style="color: var(--gl-text-muted);">คงเหลือ {{ option.remaining }}</div>
                  </div>
                </template>
              </Dropdown>
            </template>
          </Column>
          <Column style="width: 48px;">
            <template #body="{ index }">
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="form.items.splice(index, 1)" />
            </template>
          </Column>
        </DataTable>

        <div v-if="!form.items.length" class="empty-items">
          <i class="pi pi-inbox" /> กดปุ่ม "เพิ่มรายการ" เพื่อเพิ่มสินค้า
        </div>

        <div class="form-actions">
          <RouterLink to="/documents"><Button label="ยกเลิก" outlined /></RouterLink>
          <Button label="บันทึก Draft" icon="pi pi-save" outlined @click="saveDraft" :disabled="!canSave" />
          <Button label="ส่งอนุมัติ" icon="pi pi-send" class="btn-primary" @click="submitDoc" :disabled="!canSave" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import { useDocumentStore } from '@/stores/documents'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()
const docStore = useDocumentStore()

const isEdit = computed(() => !!route.params.id)
const doc = computed(() => route.params.id ? docStore.getById(route.params.id) : null)

const form = ref({ warehouseId: null, remark: '', items: [] })
const canSave = computed(() => form.value.warehouseId && form.value.items.length > 0)

onMounted(() => {
  if (!masterStore.warehouses.length) masterStore.fetchWarehouses()
  if (!masterStore.products.length) masterStore.fetchProducts()
  if (!masterStore.units.length) masterStore.fetchUnits()
})

function addItem() { form.value.items.push({ productId: null, qty: 1, unitId: null, lotId: null }) }

function onProductChange(item) {
  const p = masterStore.getProductById(item.productId)
  if (p) item.unitId = p.unitId
}

function getProduct(id) { return masterStore.getProductById(id) }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }
function getLots(productId) {
  if (!productId) return []
  return stockStore.getLotsForProduct(productId)
}

function formatDate(dt) { return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
function docStatusLabel(s) { return { draft: 'Draft', pending: 'รออนุมัติ', approved: 'อนุมัติ', issued: 'จ่ายแล้ว' }[s] || s }
function docStatusClass(s) { return { draft: 'doc-status-draft', pending: 'doc-status-pending', approved: 'doc-status-approved', issued: 'doc-status-issued' }[s] || '' }

function saveDraft() {
  docStore.createRequisition({ ...form.value, createdBy: authStore.user?.id })
  toast.add({ severity: 'success', summary: 'บันทึก Draft', life: 3000 })
  router.push('/documents')
}
function submitDoc() {
  const d = docStore.createRequisition({ ...form.value, createdBy: authStore.user?.id })
  docStore.updateStatus(d.id, 'pending', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'ส่งอนุมัติสำเร็จ', detail: d.docNo, life: 3000 })
  router.push('/documents')
}
function issueDoc() {
  docStore.updateStatus(doc.value.id, 'issued', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'จ่ายของ / ตัดสต๊อกแล้ว', detail: doc.value.docNo, life: 3000 })
}
function printDoc() {
  toast.add({ severity: 'info', summary: 'พิมพ์เอกสาร', detail: '(demo)', life: 3000 })
}
</script>

<style scoped>
.divider { height: 1px; background: var(--gl-border); margin: 20px 0; }
.items-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.items-title { font-size: 15px; font-weight: 600; color: var(--gl-navy); }
.empty-items { text-align: center; padding: 24px; color: var(--gl-text-muted); display: flex; align-items: center; justify-content: center; gap: 8px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--gl-border); }
.doc-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.doc-info-item { display: flex; flex-direction: column; gap: 4px; }
.di-label { font-size: 11px; color: var(--gl-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.di-val { font-size: 14px; font-weight: 500; color: var(--gl-text); }
.mono { font-family: monospace; }
</style>
