<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">สร้างใบคืนสินค้า (RT)</div>
        <div class="page-subtitle">คืนสินค้าที่เหลือจากการผลิตกลับเข้าคลัง</div>
      </div>
      <RouterLink to="/documents">
        <Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined />
      </RouterLink>
    </div>

    <div class="page-card">
      <div class="form-grid">
        <div>
          <label class="field-label">คลังที่รับคืน <span class="req">*</span></label>
          <Dropdown v-model="form.warehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id"
            placeholder="เลือกคลัง" class="w-full" />
        </div>
        <div>
          <label class="field-label">หมายเหตุ</label>
          <InputText v-model="form.remark" class="w-full" placeholder="เหตุผลการคืน" />
        </div>
      </div>

      <div class="divider" />

      <div class="items-header">
        <h3 class="items-title">รายการสินค้าที่คืน</h3>
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
        <Column header="จำนวนคืน *" style="width: 130px;">
          <template #body="{ data }"><InputNumber v-model="data.qty" :min="1" class="w-full" /></template>
        </Column>
        <Column header="หน่วย" style="width: 80px;">
          <template #body="{ data }">{{ getUnitAbbr(getProduct(data.productId)?.unitId) }}</template>
        </Column>
        <Column header="Lot" style="width: 200px;">
          <template #body="{ data }">
            <Dropdown v-model="data.lotId" :options="getLots(data.productId)" optionLabel="lotNo" optionValue="id"
              :disabled="!data.productId || !getProduct(data.productId)?.requireLot"
              placeholder="เลือก Lot" class="w-full" />
          </template>
        </Column>
        <Column header="หมายเหตุ">
          <template #body="{ data }">
            <InputText v-model="data.itemRemark" class="w-full" placeholder="เหตุผล..." />
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()
const docStore = useDocumentStore()

const form = ref({ warehouseId: null, remark: '', items: [] })
const canSave = computed(() => form.value.warehouseId && form.value.items.length > 0)

function addItem() { form.value.items.push({ productId: null, qty: 1, unitId: null, lotId: null, itemRemark: '' }) }
function onProductChange(item) {
  const p = masterStore.getProductById(item.productId)
  if (p) item.unitId = p.unitId
}
function getProduct(id) { return masterStore.getProductById(id) }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }
function getLots(productId) { return productId ? stockStore.getLotsForProduct(productId) : [] }

function saveDraft() {
  docStore.createReturn({ ...form.value, createdBy: authStore.user?.id })
  toast.add({ severity: 'success', summary: 'บันทึก Draft', life: 3000 })
  router.push('/documents')
}
function submitDoc() {
  const d = docStore.createReturn({ ...form.value, createdBy: authStore.user?.id })
  docStore.updateStatus(d.id, 'pending', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'ส่งอนุมัติสำเร็จ', detail: d.docNo, life: 3000 })
  router.push('/documents')
}
</script>

<style scoped>
.divider { height: 1px; background: var(--gl-border); margin: 20px 0; }
.items-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.items-title { font-size: 15px; font-weight: 600; color: var(--gl-navy); }
.empty-items { text-align: center; padding: 24px; color: var(--gl-text-muted); display: flex; align-items: center; justify-content: center; gap: 8px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--gl-border); }
</style>
