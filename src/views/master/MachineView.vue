<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">เครื่องจักร</div>
        <div class="page-subtitle">จัดการเครื่องจักรที่ใช้ในการผลิต ({{ masterStore.machines.length }} เครื่อง)</div>
      </div>
      <Button label="เพิ่มเครื่องจักร" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.machines" size="small" stripedRows>
        <Column field="machineId" header="รหัสเครื่อง" style="width: 140px; font-family: monospace;" sortable />
        <Column field="name" header="ชื่อเครื่องจักร" sortable />
        <Column field="type" header="ประเภท" style="width: 180px;">
          <template #body="{ data }">
            <span class="type-badge">{{ typeLabel(data.type) }}</span>
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขเครื่องจักร' : 'เพิ่มเครื่องจักร'"
      :modal="true" :style="{ width: '400px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัสเครื่อง <span class="req">*</span></label>
          <InputText v-model="form.machineId" class="w-full" placeholder="เช่น HM-001" />
        </div>
        <div>
          <label class="field-label">ชื่อเครื่องจักร <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="เช่น Homo Mixer 1" />
        </div>
        <div>
          <label class="field-label">ประเภท <span class="req">*</span></label>
          <Dropdown v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value"
            class="w-full" placeholder="เลือกประเภท" />
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
import Dropdown from 'primevue/dropdown'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const typeOptions = [
  { label: 'Homo Mixer', value: 'homo mixer' },
  { label: 'Ribbon Mixer', value: 'ribbon mixer' },
]
function typeLabel(value) {
  return typeOptions.find(t => t.value === value)?.label || value
}

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ machineId: '', name: '', type: null })

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item })
  else form.value = { machineId: '', name: '', type: null }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.machineId || !form.value.name || !form.value.type) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateMachine(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addMachine(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบเครื่องจักร "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteMachine(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>
<style scoped>
.type-badge { background: var(--gl-bg); border: 1px solid var(--gl-border); border-radius: 6px; padding: 2px 10px; font-size: 13px; font-weight: 600; color: var(--gl-navy); }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
