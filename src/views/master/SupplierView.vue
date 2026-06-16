<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ซัพพลายเออร์</div>
        <div class="page-subtitle">จัดการรายชื่อผู้จำหน่าย ({{ masterStore.suppliers.length }} ราย)</div>
      </div>
      <Button label="เพิ่มซัพพลายเออร์" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหา..." style="padding-left: 2.2rem; width: 260px;" />
        </span>
      </div>
      <DataTable :value="filtered" size="small" stripedRows>
        <Column field="code" header="รหัส" style="width: 110px; font-family: monospace;" sortable />
        <Column field="name" header="ชื่อบริษัท/ผู้จำหน่าย" sortable />
        <Column field="contact" header="ผู้ติดต่อ" style="width: 140px;" />
        <Column field="phone" header="เบอร์โทร" style="width: 140px;" />
        <Column header="สถานะ" style="width: 100px;">
          <template #body="{ data }">
            <span :class="['status-badge', data.active ? 'status-fg' : 'status-hold']">
              {{ data.active ? 'ใช้งาน' : 'ระงับ' }}
            </span>
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์'"
      :modal="true" :style="{ width: '440px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัส <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น SUP006" />
        </div>
        <div>
          <label class="field-label">ชื่อบริษัท <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="ชื่อบริษัท/ผู้จำหน่าย" />
        </div>
        <div>
          <label class="field-label">ผู้ติดต่อ</label>
          <InputText v-model="form.contact" class="w-full" placeholder="ชื่อผู้ติดต่อ" />
        </div>
        <div>
          <label class="field-label">เบอร์โทร</label>
          <InputText v-model="form.phone" class="w-full" placeholder="เบอร์โทรศัพท์" />
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
import { ref, computed } from 'vue'
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
const search = ref('')
const form = ref({ code: '', name: '', contact: '', phone: '', active: true })

const filtered = computed(() =>
  masterStore.suppliers.filter(s => {
    const q = search.value.toLowerCase()
    return !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })
)

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item })
  else form.value = { code: '', name: '', contact: '', phone: '', active: true }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateSupplier(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addSupplier(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบ "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteSupplier(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>

<style scoped>
.search-wrap { position: relative; display: flex; align-items: center; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
