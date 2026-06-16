<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</div>
        <div class="page-subtitle">{{ isEdit ? `รหัส: ${form.code}` : 'กรอกข้อมูลสินค้า/SKU' }}</div>
      </div>
      <RouterLink to="/master/products">
        <Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined />
      </RouterLink>
    </div>

    <div class="page-card">
      <form @submit.prevent="handleSave">
        <div class="form-grid">
          <div>
            <label class="field-label">รหัสสินค้า <span class="req">*</span></label>
            <InputText v-model="form.code" class="w-full" placeholder="เช่น RM-001" required />
          </div>
          <div>
            <label class="field-label">ชื่อสินค้า <span class="req">*</span></label>
            <InputText v-model="form.name" class="w-full" placeholder="ชื่อสินค้า" required />
          </div>
          <div>
            <label class="field-label">ประเภทสินค้า <span class="req">*</span></label>
            <Dropdown
              v-model="form.categoryId"
              :options="masterStore.categories"
              optionLabel="name"
              optionValue="id"
              placeholder="เลือกประเภท"
              class="w-full"
              required
            />
          </div>
          <div>
            <label class="field-label">หน่วยนับ <span class="req">*</span></label>
            <Dropdown
              v-model="form.unitId"
              :options="masterStore.units"
              optionLabel="name"
              optionValue="id"
              placeholder="เลือกหน่วย"
              class="w-full"
              required
            />
          </div>
          <div>
            <label class="field-label">คลังที่เก็บ <span class="req">*</span></label>
            <Dropdown
              v-model="form.warehouseId"
              :options="masterStore.warehouses"
              optionLabel="name"
              optionValue="id"
              placeholder="เลือกคลัง"
              class="w-full"
              required
            />
          </div>
          <div>
            <label class="field-label">สถานะสินค้า <span class="req">*</span></label>
            <Dropdown
              v-model="form.stockStatus"
              :options="stockStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสถานะ"
              class="w-full"
            />
          </div>
          <div>
            <label class="field-label">Min Stock (จำนวนขั้นต่ำ)</label>
            <InputNumber v-model="form.minStock" class="w-full" :min="0" placeholder="0" />
          </div>
          <div class="check-group">
            <label class="field-label">การตั้งค่าเพิ่มเติม</label>
            <div class="checks">
              <div class="check-item">
                <Checkbox v-model="form.requireLot" inputId="requireLot" :binary="true" />
                <label for="requireLot">บังคับใส่ Lot</label>
              </div>
              <div class="check-item">
                <Checkbox v-model="form.hasExpiry" inputId="hasExpiry" :binary="true" />
                <label for="hasExpiry">มีวันหมดอายุ</label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <RouterLink to="/master/products">
            <Button label="ยกเลิก" outlined type="button" />
          </RouterLink>
          <Button :label="isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'" icon="pi pi-save" class="btn-primary" type="submit" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const masterStore = useMasterStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  code: '', name: '', categoryId: null, unitId: null,
  warehouseId: null, stockStatus: 'RM', minStock: 0,
  requireLot: false, hasExpiry: false, active: true,
})

const stockStatusOptions = [
  { label: 'RM (วัตถุดิบ)', value: 'RM' },
  { label: 'Semi (กึ่งสำเร็จรูป)', value: 'Semi' },
  { label: 'FG (สินค้าสำเร็จรูป)', value: 'FG' },
]

onMounted(() => {
  if (isEdit.value) {
    const p = masterStore.getProductById(route.params.id)
    if (p) Object.assign(form.value, { ...p })
  }
})

function handleSave() {
  if (!form.value.code || !form.value.name || !form.value.categoryId || !form.value.unitId || !form.value.warehouseId) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบถ้วน', life: 3000 })
    return
  }
  if (isEdit.value) {
    masterStore.updateProduct(route.params.id, form.value)
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', detail: 'แก้ไขข้อมูลสินค้าแล้ว', life: 3000 })
  } else {
    masterStore.addProduct(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสินค้าสำเร็จ', detail: form.value.name, life: 3000 })
  }
  router.push('/master/products')
}
</script>

<style scoped>
.form-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid var(--gl-border);
}
.check-group .checks { display: flex; gap: 20px; margin-top: 8px; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
</style>
