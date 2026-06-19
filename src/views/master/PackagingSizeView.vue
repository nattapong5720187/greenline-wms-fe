<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ขนาดบรรจุภัณฑ์</div>
        <div class="page-subtitle">จัดการขนาดบรรจุภัณฑ์ ({{ masterStore.packagingSizes.length }} รายการ)</div>
      </div>
      <Button label="เพิ่มขนาด" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.packagingSizes" size="small" stripedRows>
        <Column header="ขนาด" sortable>
          <template #body="{ data }">
            {{ data.size.toLocaleString() }}
          </template>
        </Column>
        <Column header="หน่วย" style="width:180px;">
          <template #body="{ data }">
            {{ data.unit || '-' }}
          </template>
        </Column>
        <Column header="แสดง" style="width:140px;">
          <template #body="{ data }">
            <code class="display-badge">{{ getLabel(data) }}</code>
          </template>
        </Column>
        <Column header="จัดการ" style="width:100px;">
          <template #body="{ data }">
            <div class="action-btns">
              <Button icon="pi pi-pencil" size="small" text rounded @click="openDialog(data)" />
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขขนาดบรรจุภัณฑ์' : 'เพิ่มขนาดบรรจุภัณฑ์'"
      :modal="true" :style="{ width: '380px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">ขนาด <span class="req">*</span></label>
          <InputNumber v-model="form.size" :min="1" style="width:100%;" placeholder="เช่น 70" />
        </div>
        <div>
          <label class="field-label">หน่วย <span class="req">*</span></label>
          <InputText v-model="form.unit" style="width:100%;" placeholder="เช่น g." />
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
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ size: null, unit: 'g.' })

function getLabel(item) {
  return `${item.size.toLocaleString()} ${item.unit || ''}`.trim()
}

function openDialog(item = null) {
  editing.value = item
  if (item) form.value = { size: item.size, unit: item.unit || 'g.' }
  else form.value = { size: null, unit: 'g.' }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.size || !form.value.unit) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updatePackagingSize(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addPackagingSize(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบขนาด "${getLabel(item)}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deletePackagingSize(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>

<style scoped>
.display-badge {
  background: var(--gl-bg);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
