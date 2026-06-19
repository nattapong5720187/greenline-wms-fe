<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ชื่อแบรนด์</div>
        <div class="page-subtitle">จัดการชื่อแบรนด์ ({{ masterStore.brands.length }} รายการ)</div>
      </div>
      <Button label="เพิ่มแบรนด์" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.brands" size="small" stripedRows>
        <Column field="name" header="ชื่อแบรนด์" sortable />
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์'"
      :modal="true" :style="{ width: '380px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">ชื่อแบรนด์ <span class="req">*</span></label>
          <InputText v-model="form.name" style="width:100%;" placeholder="เช่น Kandy" />
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
const form = ref({ name: '' })

function openDialog(item = null) {
  editing.value = item
  if (item) form.value = { name: item.name }
  else form.value = { name: '' }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกชื่อแบรนด์', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateBrand(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addBrand(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบแบรนด์ "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteBrand(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>

<style scoped>
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
