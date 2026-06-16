<template>
  <div>
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px;">
        <Button icon="pi pi-arrow-left" text rounded @click="router.back()" />
        <div>
          <div class="page-title">{{ isEdit ? 'แก้ไขสูตร' : 'สร้างสูตรใหม่' }}</div>
          <div class="page-subtitle">{{ isEdit ? form.code : 'กรอกข้อมูลสูตรและส่วนผสม BOM' }}</div>
        </div>
      </div>
      <Button :label="isEdit ? 'บันทึก' : 'สร้างสูตร'" icon="pi pi-save" class="btn-primary" @click="save" />
    </div>

    <div class="form-grid">
      <!-- ข้อมูลทั่วไป -->
      <div class="page-card">
        <div class="section-title">ข้อมูลทั่วไป</div>
        <div class="form-row">
          <div class="form-field">
            <label>รหัสสูตร <span class="req">*</span></label>
            <InputText v-model="form.code" placeholder="เช่น FML-004" style="width:100%;" />
          </div>
          <div class="form-field" style="flex:2">
            <label>ชื่อสูตร <span class="req">*</span></label>
            <InputText v-model="form.name" placeholder="ชื่อสูตรการผลิต" style="width:100%;" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>สถานะ</label>
            <Dropdown v-model="form.active" :options="[{label:'ใช้งาน',value:true},{label:'ปิดใช้',value:false}]"
              optionLabel="label" optionValue="value" style="width:100%;" />
          </div>
        </div>
      </div>

      <!-- Output & ฉลาก -->
      <div class="page-card">
        <div class="section-title">Output & ฉลาก</div>
        <div class="form-row">
          <div class="form-field">
            <label>จำนวน Output / Batch <span class="req">*</span></label>
            <InputNumber v-model="form.outputQtyPerBatch" :min="1" style="width:100%;" />
          </div>
          <div class="form-field">
            <label>หน่วย Output</label>
            <Dropdown v-model="form.outputUnit" :options="outputUnitOptions" optionLabel="label" optionValue="value" style="width:100%;" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field" style="flex:2">
            <label>ชื่อบนฉลาก</label>
            <InputText v-model="form.labelName" placeholder="เช่น ไก่กระป๋อง 300g" style="width:100%;" />
          </div>
          <div class="form-field" style="width:110px;">
            <label>น้ำหนักฉลาก</label>
            <InputNumber v-model="form.labelWeight" :min="0" style="width:100%;" />
          </div>
          <div class="form-field" style="width:100px;">
            <label>หน่วย</label>
            <Dropdown v-model="form.labelWeightUnit" :options="['g','mg','kg','mL']" style="width:100%;" />
          </div>
        </div>
      </div>
    </div>

    <!-- BOM -->
    <div class="page-card" style="margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div class="section-title" style="margin-bottom:0">ส่วนผสม (BOM) — {{ form.ingredients.length }} รายการ</div>
        <Button label="+ เพิ่มส่วนผสม" icon="pi pi-plus" size="small" outlined @click="addIngredient" />
      </div>

      <div v-if="form.ingredients.length === 0" class="empty-bom">
        ยังไม่มีส่วนผสม — กดปุ่ม "+ เพิ่มส่วนผสม" เพื่อเริ่มต้น
      </div>
      <div v-else>
        <div class="bom-header">
          <div style="flex:2">สินค้า / วัตถุดิบ</div>
          <div style="width:140px; text-align:right;">ปริมาณ / Batch</div>
          <div style="width:120px; padding-left:12px;">หน่วย</div>
          <div style="width:48px;"></div>
        </div>
        <div v-for="(ing, idx) in form.ingredients" :key="idx" class="bom-row">
          <div style="flex:2">
            <Dropdown v-model="ing.productId" :options="productOptions" optionLabel="label" optionValue="value"
              filter placeholder="เลือกสินค้า..." style="width:100%;" />
          </div>
          <div style="width:140px;">
            <InputNumber v-model="ing.qtyPerBatch" :min="0" :minFractionDigits="0" :maxFractionDigits="3" style="width:100%;" />
          </div>
          <div style="width:120px; padding-left:12px;">
            <Dropdown v-model="ing.unitId" :options="unitOptions" optionLabel="abbr" optionValue="id" style="width:100%;" />
          </div>
          <div style="width:48px; text-align:center;">
            <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="removeIngredient(idx)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useProductionStore } from '@/stores/production'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const productionStore = useProductionStore()
const masterStore = useMasterStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  code: '', name: '', active: true,
  outputQtyPerBatch: 1000, outputUnit: 'pcs',
  labelName: '', labelWeight: 300, labelWeightUnit: 'g',
  ingredients: [],
})

const outputUnitOptions = [
  { label: 'pcs (ชิ้น)', value: 'pcs' },
  { label: 'kg (กิโลกรัม)', value: 'kg' },
  { label: 'box (กล่อง)', value: 'box' },
]

const productOptions = computed(() =>
  masterStore.products.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))
)
const unitOptions = computed(() => masterStore.units)

onMounted(() => {
  if (isEdit.value) {
    const f = productionStore.getFormulaById(route.params.id)
    if (f) form.value = { ...f, ingredients: f.ingredients.map(i => ({ ...i })) }
  }
})

function addIngredient() {
  form.value.ingredients.push({ productId: null, qtyPerBatch: 0, unitId: 'U01' })
}
function removeIngredient(idx) {
  form.value.ingredients.splice(idx, 1)
}

function save() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', detail: 'รหัสและชื่อสูตรจำเป็น', life: 3000 })
    return
  }
  const payload = {
    ...form.value,
    ingredients: form.value.ingredients.filter(i => i.productId && i.qtyPerBatch > 0),
  }
  if (isEdit.value) {
    productionStore.updateFormula(route.params.id, payload)
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', detail: form.value.name, life: 3000 })
  } else {
    productionStore.addFormula(payload)
    toast.add({ severity: 'success', summary: 'สร้างสูตรสำเร็จ', detail: form.value.name, life: 3000 })
  }
  router.push('/production/formulas')
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.section-title { font-size: 14px; font-weight: 700; color: #1e2a3b; margin-bottom: 14px; }
.form-row { display: flex; gap: 14px; margin-bottom: 14px; }
.form-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.form-field label { font-size: 13px; font-weight: 500; color: #374151; }
.req { color: var(--gl-red); }
.bom-header {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: #1e2a3b; border-radius: 8px;
  color: #fff; font-size: 12px; font-weight: 600; margin-bottom: 6px;
}
.bom-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-bottom: 1px solid #f1f5f9;
}
.bom-row:last-child { border-bottom: none; }
.empty-bom {
  text-align: center; padding: 32px; color: var(--gl-text-muted);
  font-size: 13px; background: #f8fafc; border-radius: 8px;
}
</style>
