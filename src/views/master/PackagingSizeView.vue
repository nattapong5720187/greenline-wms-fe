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
      <DataTable :value="masterStore.packagingSizes" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลขนาดบรรจุภัณฑ์</div>
        </template>
        <Column header="ขนาด" sortable>
          <template #body="{ data }">
            {{ data.sizeValue.toLocaleString() }}
          </template>
        </Column>
        <Column header="หน่วย" style="width:120px;">
          <template #body="{ data }">
            {{ data.unit || '-' }}
          </template>
        </Column>
        <Column header="แสดง" style="width:160px;">
          <template #body="{ data }">
            <code class="display-badge">{{ data.label }}</code>
          </template>
        </Column>
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขขนาดบรรจุภัณฑ์' : 'เพิ่มขนาดบรรจุภัณฑ์'"
      :modal="true" :style="{ width: '380px' }" :closable="!saving">
      <div class="dialog-form">
        <div>
          <label class="field-label">ขนาด <span class="req">*</span></label>
          <InputNumber v-model="form.sizeValue" :min="0" :minFractionDigits="0" :maxFractionDigits="3" style="width:100%;" placeholder="เช่น 70" />
        </div>
        <div>
          <label class="field-label">หน่วย <span class="req">*</span></label>
          <InputText v-model="form.unit" style="width:100%;" placeholder="เช่น g" />
        </div>
        <div>
          <label class="field-label">ป้ายแสดง <span class="req">*</span></label>
          <InputText v-model="form.label" style="width:100%;" placeholder="เช่น 70g bag" />
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
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const editing = ref(null)
const form = ref(defaultForm())

function defaultForm() {
  return { sizeValue: null, unit: 'g', label: '', isActive: true }
}

async function fetchPackagingSizes() {
  loading.value = true
  try {
    await masterStore.fetchPackagingSizes()
  } catch {
    toast.add({ severity: 'error', summary: 'โหลดข้อมูลล้มเหลว', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(fetchPackagingSizes)

function openDialog(item = null) {
  editing.value = item
  form.value = item
    ? { sizeValue: item.sizeValue, unit: item.unit, label: item.label, isActive: item.isActive }
    : defaultForm()
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.sizeValue || !form.value.unit || !form.value.label) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await masterStore.updatePackagingSize(editing.value.id, {
        sizeValue: form.value.sizeValue,
        unit: form.value.unit,
        label: form.value.label,
        isActive: form.value.isActive,
      })
      toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
    } else {
      await masterStore.addPackagingSize({
        sizeValue: form.value.sizeValue,
        unit: form.value.unit,
        label: form.value.label,
      })
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
    message: `ลบขนาด "${item.label}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await masterStore.deletePackagingSize(item.id)
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
.display-badge {
  background: var(--gl-bg);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
.active-row { display: flex; align-items: center; gap: 16px; }
.active-toggle { display: flex; align-items: center; gap: 8px; }
.empty-state { text-align: center; padding: 24px; color: var(--gl-text-muted); font-size: 14px; }
</style>
