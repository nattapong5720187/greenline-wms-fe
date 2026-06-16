<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ประเภทสินค้า</div>
        <div class="page-subtitle">จัดการประเภท/หมวดหมู่สินค้า ({{ masterStore.categories.length }} ประเภท)</div>
      </div>
      <Button label="เพิ่มประเภท" icon="pi pi-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.categories" size="small" stripedRows>
        <Column field="code" header="รหัส" style="width: 100px; font-family: monospace;" />
        <Column header="ชื่อประเภท">
          <template #body="{ data }">
            <span class="cat-chip" :style="{ background: data.color + '22', color: data.color, borderColor: data.color + '44' }">
              {{ data.name }}
            </span>
          </template>
        </Column>
        <Column header="บังคับ Lot" style="width: 100px; text-align: center;">
          <template #body="{ data }">
            <i :class="data.requireLot ? 'pi pi-check-circle' : 'pi pi-times-circle'"
               :style="{ color: data.requireLot ? 'var(--gl-success)' : '#cbd5e1', fontSize: '16px' }" />
          </template>
        </Column>
        <Column header="มีวันหมดอายุ" style="width: 120px; text-align: center;">
          <template #body="{ data }">
            <i :class="data.hasExpiry ? 'pi pi-check-circle' : 'pi pi-times-circle'"
               :style="{ color: data.hasExpiry ? 'var(--gl-success)' : '#cbd5e1', fontSize: '16px' }" />
          </template>
        </Column>
        <Column header="จำนวน SKU" style="width: 110px;">
          <template #body="{ data }">
            <span class="count-badge">{{ getProductCount(data.id) }}</span>
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

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขประเภท' : 'เพิ่มประเภทสินค้า'"
      :modal="true" :style="{ width: '420px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัส <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น RM" />
        </div>
        <div>
          <label class="field-label">ชื่อประเภท <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="ชื่อประเภท" />
        </div>
        <div>
          <label class="field-label">สี</label>
          <div class="color-row">
            <input type="color" v-model="form.color" class="color-input" />
            <span style="font-size: 13px; color: var(--gl-text-muted);">{{ form.color }}</span>
          </div>
        </div>
        <div class="check-row">
          <div class="check-item">
            <Checkbox v-model="form.requireLot" inputId="cl_rl" :binary="true" />
            <label for="cl_rl">บังคับ Lot</label>
          </div>
          <div class="check-item">
            <Checkbox v-model="form.hasExpiry" inputId="cl_he" :binary="true" />
            <label for="cl_he">มีวันหมดอายุ</label>
          </div>
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
import Checkbox from 'primevue/checkbox'

const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ code: '', name: '', color: '#3B82F6', requireLot: false, hasExpiry: false })

function getProductCount(catId) {
  return masterStore.products.filter(p => p.categoryId === catId).length
}

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item })
  else form.value = { code: '', name: '', color: '#3B82F6', requireLot: false, hasExpiry: false }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  if (editing.value) {
    masterStore.updateCategory(editing.value.id, form.value)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addCategory(form.value)
    toast.add({ severity: 'success', summary: 'เพิ่มสำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบประเภท "${item.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      masterStore.deleteCategory(item.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 3000 })
    }
  })
}
</script>

<style scoped>
.cat-chip { padding: 3px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; border: 1px solid; }
.count-badge { background: var(--gl-bg); border: 1px solid var(--gl-border); border-radius: 6px; padding: 2px 10px; font-size: 13px; font-weight: 600; color: var(--gl-navy); }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
.color-row { display: flex; align-items: center; gap: 10px; }
.color-input { width: 48px; height: 36px; border-radius: 8px; border: 1px solid var(--gl-border); cursor: pointer; padding: 2px; }
.check-row { display: flex; gap: 20px; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
</style>
