<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">หน่วยนับ</div>
        <div class="page-subtitle">จัดการหน่วยนับสินค้า ({{ masterStore.units.length }} หน่วย)</div>
      </div>
      <Button label="เพิ่มหน่วย" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.units" size="small" stripedRows>
        <Column field="code" header="รหัส" style="width: 100px; font-family: monospace;" sortable />
        <Column field="name" header="ชื่อหน่วย" sortable />
        <Column field="abbr" header="ตัวย่อ" style="width: 100px;">
          <template #body="{ data }">
            <code style="background: var(--gl-bg); padding: 2px 8px; border-radius: 4px; font-size: 12px;">{{ data.abbr }}</code>
          </template>
        </Column>
        <Column header="ใช้งาน (SKU)" style="width: 120px;">
          <template #body="{ data }">
            <span class="count-badge">{{ getUsageCount(data.id) }}</span>
          </template>
        </Column>
        <Column header="จัดการ" style="width: 100px;">
          <template #body="{ data }">
            <div class="action-btns">
              <Button icon="pi pi-pencil" size="small" text rounded @click="openDialog(data)" />
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขหน่วย' : 'เพิ่มหน่วยนับ'"
      :modal="true" :style="{ width: '360px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัส <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น KG" />
        </div>
        <div>
          <label class="field-label">ชื่อหน่วย <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="เช่น กิโลกรัม" />
        </div>
        <div>
          <label class="field-label">ตัวย่อ <span class="req">*</span></label>
          <InputText v-model="form.abbr" class="w-full" placeholder="เช่น kg" />
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
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ code: '', name: '', abbr: '' })

function getUsageCount(unitId) { return masterStore.products.filter(p => p.unitId === unitId).length }

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item })
  else form.value = { code: '', name: '', abbr: '' }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.code || !form.value.name || !form.value.abbr) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateUnit(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addUnit(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบหน่วย "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteUnit(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>
<style scoped>
.count-badge { background: var(--gl-bg); border: 1px solid var(--gl-border); border-radius: 6px; padding: 2px 10px; font-size: 13px; font-weight: 600; color: var(--gl-navy); }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
