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
      <DataTable :value="masterStore.brands" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลแบรนด์</div>
        </template>
        <Column field="name" header="ชื่อแบรนด์" sortable />
        <Column header="สถานะ" style="width:100px;">
          <template #body="{ data }">
            <span :class="['status-badge', data.isActive ? 'status-fg' : 'status-hold']">
              {{ data.isActive ? 'ใช้งาน' : 'ระงับ' }}
            </span>
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์'"
      :modal="true" :style="{ width: '380px' }" :closable="!saving">
      <div class="dialog-form">
        <div>
          <label class="field-label">ชื่อแบรนด์ <span class="req">*</span></label>
          <InputText v-model="form.name" style="width:100%;" placeholder="เช่น Kandy" />
        </div>
        <div v-if="editing" class="active-row">
          <label class="field-label" style="margin: 0">สถานะ</label>
          <div class="active-toggle">
            <ToggleSwitch v-model="form.isActive" inputId="isActive" />
            <label for="isActive" style="font-size: 13px; cursor: pointer">
              {{ form.isActive ? 'ใช้งาน' : 'ระงับการใช้งาน' }}
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDialog = false" :disabled="saving" />
        <Button :label="editing ? 'บันทึก' : 'เพิ่ม'" class="btn-primary" :loading="saving" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const editing = ref(null)
const form = ref({ name: '', isActive: true })

async function fetchBrands() {
  loading.value = true
  try {
    await masterStore.fetchBrands()
  } catch {
    toast.add({ severity: 'error', summary: 'โหลดข้อมูลล้มเหลว', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(fetchBrands)

function openDialog(item = null) {
  editing.value = item
  form.value = item ? { name: item.name, isActive: item.isActive } : { name: '', isActive: true }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกชื่อแบรนด์', life: 3000 })
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await masterStore.updateBrand(editing.value.id, { name: form.value.name, isActive: form.value.isActive })
      toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
    } else {
      await masterStore.addBrand({ name: form.value.name })
      toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
    }
    showDialog.value = false
  } catch (e) {
    const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด'
    toast.add({ severity: 'error', summary: Array.isArray(msg) ? msg.join(', ') : msg, life: 4000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบแบรนด์ "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await masterStore.deleteBrand(item.id)
        toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
      } catch (e) {
        const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด'
        toast.add({ severity: 'error', summary: msg, life: 4000 })
      }
    }
  })
}
</script>

<style scoped>
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
.active-row { display: flex; align-items: center; gap: 16px; }
.active-toggle { display: flex; align-items: center; gap: 8px; }
.empty-state { text-align: center; padding: 24px; color: var(--gl-text-muted); font-size: 14px; }
</style>
