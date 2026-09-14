<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</div>
        <div class="page-subtitle">{{ isEdit ? `SKU: ${form.sku}` : 'กรอกข้อมูลสินค้า/SKU' }}</div>
      </div>
      <RouterLink to="/master/products">
        <Button label="ย้อนกลับ" icon="pi pi-arrow-left" outlined />
      </RouterLink>
    </div>

    <div class="page-card">
      <form @submit.prevent="handleSave">
        <div class="form-grid">
          <div>
            <label class="field-label">SKU <span class="req">*</span></label>
            <InputText v-model="form.sku" class="w-full" placeholder="เช่น SKU-001" required />
          </div>
          <div>
            <label class="field-label">ชื่อสินค้า <span class="req">*</span></label>
            <InputText v-model="form.name" class="w-full" placeholder="ชื่อสินค้า" required />
          </div>
          <div>
            <label class="field-label">ประเภทสินค้า (หมวดหมู่) <span class="req">*</span></label>
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
            <label class="field-label">หน่วยย่อย</label>
            <Dropdown
              v-model="form.subUnitId"
              :options="masterStore.units"
              optionLabel="name"
              optionValue="id"
              placeholder="เลือกหน่วยย่อย"
              class="w-full"
              showClear
            />
          </div>
          <div>
            <label class="field-label">น้ำหนักต่อหน่วย</label>
            <!-- The sub unit is shown inside the field, so the number reads as
                 "1 KG" while it is being typed rather than as a bare 1. -->
            <InputNumber
              v-model="form.weightPerUnit"
              class="w-full"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="3"
              :suffix="weightSuffix"
              placeholder="0"
            />
            <small v-if="!form.subUnitId" class="field-hint">เลือกหน่วยย่อยเพื่อให้แสดงหน่วยต่อท้าย</small>
          </div>
          <div>
            <label class="field-label">Product Type <span class="req">*</span></label>
            <InputText v-model="form.productType" class="w-full" placeholder="เช่น FINISHED_GOOD" required />
          </div>
          <div>
            <label class="field-label">Min Stock (จำนวนขั้นต่ำ)</label>
            <InputNumber v-model="form.minStock" class="w-full" :min="0" placeholder="0" />
          </div>
          <div class="check-group">
            <label class="field-label">การตั้งค่าเพิ่มเติม</label>
            <div class="checks">
              <div class="check-item">
                <Checkbox v-model="form.hasLot" inputId="hasLot" :binary="true" />
                <label for="hasLot">บังคับใส่ Lot</label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <RouterLink to="/master/products">
            <Button label="ยกเลิก" outlined type="button" :disabled="saving" />
          </RouterLink>
          <Button :label="isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'" icon="pi pi-save" class="btn-primary" type="submit" :loading="saving" />
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
const saving = ref(false)

const form = ref({
  sku: '', name: '', categoryId: null, unitId: null,
  subUnitId: null, weightPerUnit: null,
  productType: '', minStock: 0, hasLot: false,
})

// What InputNumber appends to the value, e.g. " กิโลกรัม". The unit's `name` is
// what the dropdown above shows, so the suffix reads back the same words the
// user just picked rather than the English code. Blank until a sub unit is
// chosen — an appended unit nobody picked would be a guess.
const weightSuffix = computed(() => {
  const unit = masterStore.getUnitById(form.value.subUnitId)
  return unit ? ` ${unit.name || unit.code}` : ''
})

onMounted(async () => {
  if (!masterStore.categories.length) masterStore.fetchCategories()
  if (!masterStore.units.length) masterStore.fetchUnits()
  if (isEdit.value) {
    let p = masterStore.getProductById(route.params.id)
    if (!p) {
      await masterStore.fetchProducts()
      p = masterStore.getProductById(route.params.id)
    }
    if (p) {
      form.value = {
        sku: p.sku, name: p.name, categoryId: p.categoryId, unitId: p.unitId,
        subUnitId: p.subUnitId ?? null, weightPerUnit: p.weightPerUnit ?? null,
        productType: p.productType, minStock: p.minStock, hasLot: p.hasLot,
      }
    }
  }
})

async function handleSave() {
  if (!form.value.sku || !form.value.name || !form.value.categoryId || !form.value.unitId || !form.value.productType) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบถ้วน', life: 3000 })
    return
  }
  saving.value = true
  const payload = {
    ...form.value,
    subUnitId: form.value.subUnitId ?? null,
    weightPerUnit: form.value.weightPerUnit ?? null,
  }
  try {
    if (isEdit.value) {
      await masterStore.updateProduct(route.params.id, payload)
      toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', detail: 'แก้ไขข้อมูลสินค้าแล้ว', life: 3000 })
    } else {
      await masterStore.addProduct(payload)
      toast.add({ severity: 'success', summary: 'เพิ่มสินค้าสำเร็จ', detail: form.value.name, life: 3000 })
    }
    router.push('/master/products')
  } catch (e) {
    const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด'
    toast.add({ severity: 'error', summary: Array.isArray(msg) ? msg.join(', ') : msg, life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid var(--gl-border);
}
.field-hint { display: block; margin-top: 4px; font-size: 12px; color: var(--gl-text-subtle); }
.check-group .checks { display: flex; gap: 20px; margin-top: 8px; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
</style>
