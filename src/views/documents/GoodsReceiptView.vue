<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">สร้างใบรับเข้า (Goods Receipt)</div>
        <div class="page-subtitle">บันทึกการรับสินค้าเข้าคลัง</div>
      </div>
      <RouterLink to="/documents">
        <Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined />
      </RouterLink>
    </div>

    <div class="page-card">
      <!-- Header info -->
      <div class="form-grid">
        <div>
          <label class="field-label">คลังที่รับเข้า <span class="req">*</span></label>
          <Dropdown v-model="form.warehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id"
            placeholder="เลือกคลัง" class="w-full" />
        </div>
        <div>
          <label class="field-label">Supplier</label>
          <Dropdown v-model="form.supplierId" :options="masterStore.suppliers" optionLabel="name" optionValue="id"
            placeholder="เลือก Supplier" class="w-full" showClear />
        </div>
        <div class="form-full">
          <label class="field-label">หมายเหตุ</label>
          <Textarea v-model="form.remark" class="w-full" rows="2" placeholder="หมายเหตุ..." />
        </div>
      </div>

      <div class="divider" />

      <!-- Items -->
      <div class="items-header">
        <h3 class="items-title">รายการสินค้า</h3>
        <Button label="เพิ่มรายการ" icon="pi pi-plus" size="small" class="btn-primary" @click="addItem" />
      </div>

      <DataTable :value="form.items" size="small" class="items-table">
        <Column header="#" style="width: 44px;">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column header="สินค้า *" style="min-width: 220px;">
          <template #body="{ data, index }">
            <Dropdown
              v-model="data.productId"
              :options="masterStore.products"
              optionLabel="name"
              optionValue="id"
              :filter="true"
              filterPlaceholder="ค้นหา..."
              placeholder="เลือกสินค้า"
              class="w-full"
              @change="onProductChange(data, index)"
            />
          </template>
        </Column>
        <Column header="จำนวน *" style="width: 120px;">
          <template #body="{ data }">
            <InputNumber v-model="data.qty" :min="1" class="w-full" />
          </template>
        </Column>
        <Column header="หน่วย" style="width: 80px;">
          <template #body="{ data }">
            <span style="font-size:13px;">{{ getUnitAbbr(data.unitId) }}</span>
          </template>
        </Column>
        <Column header="Lot No." style="width: 180px;">
          <template #body="{ data, index }">
            <InputText
              v-model="data.lotNo"
              :disabled="!getProduct(data.productId)?.requireLot"
              :placeholder="getProduct(data.productId)?.requireLot ? 'บังคับ' : 'ไม่ใช้'"
              class="w-full"
            />
          </template>
        </Column>
        <Column header="วันหมดอายุ" style="width: 150px;">
          <template #body="{ data }">
            <Calendar
              v-model="data.expiryDate"
              :disabled="!getProduct(data.productId)?.hasExpiry"
              dateFormat="dd/mm/yy"
              placeholder="วด/ดือ/ปี"
              class="w-full"
            />
          </template>
        </Column>
        <Column style="width: 48px;">
          <template #body="{ index }">
            <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="removeItem(index)" />
          </template>
        </Column>
      </DataTable>

      <div v-if="!form.items.length" class="empty-items">
        <i class="pi pi-inbox" /> กดปุ่ม "เพิ่มรายการ" เพื่อเพิ่มสินค้า
      </div>

      <div class="form-actions">
        <RouterLink to="/documents">
          <Button label="ยกเลิก" outlined />
        </RouterLink>
        <Button label="บันทึก Draft" icon="pi pi-save" outlined @click="saveDraft" :disabled="!form.warehouseId || !form.items.length" />
        <Button label="ส่งอนุมัติ" icon="pi pi-send" class="btn-primary" @click="submit" :disabled="!form.warehouseId || !form.items.length" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useMasterStore } from '@/stores/master'
import { useDocumentStore } from '@/stores/documents'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const masterStore = useMasterStore()
const docStore = useDocumentStore()

const form = ref({
  warehouseId: null, supplierId: null, remark: '',
  items: [],
})

function addItem() {
  form.value.items.push({ productId: null, qty: 1, unitId: null, lotNo: '', expiryDate: null, supplierId: form.value.supplierId })
}
function removeItem(i) { form.value.items.splice(i, 1) }

function onProductChange(item, index) {
  const p = masterStore.getProductById(item.productId)
  if (p) item.unitId = p.unitId
}

function getProduct(id) { return masterStore.getProductById(id) }
function getUnitAbbr(id) { return masterStore.getUnitById(id)?.abbr || '-' }

function validate() {
  if (!form.value.warehouseId) { toast.add({ severity: 'warn', summary: 'เลือกคลังก่อน', life: 3000 }); return false }
  if (!form.value.items.length) { toast.add({ severity: 'warn', summary: 'กรุณาเพิ่มรายการสินค้า', life: 3000 }); return false }
  for (const item of form.value.items) {
    if (!item.productId || !item.qty) { toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลรายการให้ครบ', life: 3000 }); return false }
    const p = masterStore.getProductById(item.productId)
    if (p?.requireLot && !item.lotNo) { toast.add({ severity: 'warn', summary: `${p.name} ต้องระบุ Lot No.`, life: 3000 }); return false }
  }
  return true
}

function saveDraft() {
  if (!validate()) return
  docStore.createReceipt({ ...form.value, createdBy: authStore.user?.id })
  toast.add({ severity: 'success', summary: 'บันทึก Draft สำเร็จ', life: 3000 })
  router.push('/documents')
}

function submit() {
  if (!validate()) return
  const doc = docStore.createReceipt({ ...form.value, createdBy: authStore.user?.id })
  docStore.updateStatus(doc.id, 'pending', authStore.user?.id)
  toast.add({ severity: 'success', summary: 'ส่งอนุมัติสำเร็จ', detail: doc.docNo, life: 3000 })
  router.push('/documents')
}
</script>

<style scoped>
.divider { height: 1px; background: var(--gl-border); margin: 20px 0; }
.items-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.items-title { font-size: 15px; font-weight: 600; color: var(--gl-navy); }
.empty-items { text-align: center; padding: 24px; color: var(--gl-text-muted); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--gl-border); }
</style>
