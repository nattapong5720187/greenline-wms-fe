<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">คลังสินค้า</div>
        <div class="page-subtitle">จัดการ 3 คลังหลัก</div>
      </div>
      <Button label="เพิ่มคลัง" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="wh-grid">
      <div class="wh-detail-card" v-for="wh in masterStore.warehouses" :key="wh.id">
        <div class="wdc-header" :style="{ background: whTypeColor(wh.type) }">
          <i class="pi pi-building wdc-icon" />
          <div>
            <div class="wdc-name">{{ wh.name }}</div>
            <div class="wdc-code">{{ wh.code }}</div>
          </div>
          <span class="wdc-type-badge">{{ whTypeLabel(wh.type) }}</span>
        </div>
        <div class="wdc-body">
          <div class="wdc-desc">{{ wh.description }}</div>
          <div class="wdc-stats">
            <div class="wdc-stat">
              <span class="wdcs-val">{{ stockStore.getStockByWarehouse(wh.id).length }}</span>
              <span class="wdcs-lbl">SKU</span>
            </div>
            <div class="wdc-stat">
              <span class="wdcs-val">{{ totalQty(wh.id) }}</span>
              <span class="wdcs-lbl">จำนวนรวม</span>
            </div>
            <div class="wdc-stat">
              <span class="wdcs-val" :style="{ color: holdCount(wh.id) > 0 ? 'var(--gl-red)' : 'inherit' }">{{ holdCount(wh.id) }}</span>
              <span class="wdcs-lbl">Hold</span>
            </div>
          </div>
        </div>
        <div class="wdc-footer">
          <Button icon="pi pi-pencil" label="แก้ไข" text size="small" @click="openDialog(wh)" />
          <Button icon="pi pi-eye" label="ดูสต๊อก" text size="small" @click="$router.push('/stock/by-warehouse')" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขคลัง' : 'เพิ่มคลังสินค้า'"
      :modal="true" :style="{ width: '420px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัสคลัง <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น WH04" />
        </div>
        <div>
          <label class="field-label">ชื่อคลัง <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="ชื่อคลัง" />
        </div>
        <div>
          <label class="field-label">รายละเอียด</label>
          <Textarea v-model="form.description" class="w-full" rows="2" />
        </div>
        <div>
          <label class="field-label">ประเภทคลัง</label>
          <Dropdown v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDialog = false" />
        <Button :label="editing ? 'บันทึก' : 'เพิ่ม'" class="btn-primary" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'

const masterStore = useMasterStore()
const stockStore = useStockStore()
const toast = useToast()

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ code: '', name: '', description: '', type: 'main', active: true })

const typeOptions = [
  { label: 'คลังหลัก', value: 'main' },
  { label: 'ห้องเย็น (ภายใน)', value: 'cold' },
  { label: 'ห้องเย็น (ภายนอก)', value: 'cold_external' },
]

function whTypeLabel(t) { return typeOptions.find(o => o.value === t)?.label || t }
function whTypeColor(t) {
  return { main: 'linear-gradient(135deg, #0D2461, #1a3a7c)', cold: 'linear-gradient(135deg, #0369a1, #0284c7)', cold_external: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }[t] || '#0D2461'
}

function totalQty(whId) {
  return stockStore.getStockByWarehouse(whId).reduce((sum, s) => sum + s.qty, 0).toLocaleString()
}
function holdCount(whId) {
  return stockStore.holdItems.filter(h => h.warehouseId === whId && h.status === 'hold').length
}

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item })
  else form.value = { code: '', name: '', description: '', type: 'main', active: true }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateWarehouse(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addWarehouse(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}
</script>

<style scoped>
.wh-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.wh-detail-card {
  background: var(--gl-surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid var(--gl-border);
}

.wdc-header {
  padding: 20px;
  display: flex; align-items: center; gap: 12px;
  color: #fff;
}
.wdc-icon { font-size: 28px; }
.wdc-name { font-size: 16px; font-weight: 700; }
.wdc-code { font-size: 12px; opacity: 0.7; }
.wdc-type-badge { margin-left: auto; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; white-space: nowrap; }

.wdc-body { padding: 16px 20px; }
.wdc-desc { font-size: 13px; color: var(--gl-text-muted); margin-bottom: 14px; }

.wdc-stats { display: flex; gap: 16px; }
.wdc-stat { display: flex; flex-direction: column; align-items: center; flex: 1; background: var(--gl-bg); border-radius: 8px; padding: 10px; }
.wdcs-val { font-size: 20px; font-weight: 700; color: var(--gl-navy); line-height: 1; }
.wdcs-lbl { font-size: 11px; color: var(--gl-text-muted); margin-top: 4px; }

.wdc-footer { display: flex; padding: 10px 14px; border-top: 1px solid var(--gl-border); gap: 8px; }

.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
