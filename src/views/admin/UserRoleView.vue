<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ผู้ใช้งาน & สิทธิ์</div>
        <div class="page-subtitle">จัดการบัญชีผู้ใช้และระดับสิทธิ์การเข้าถึง</div>
      </div>
      <Button label="เพิ่มผู้ใช้" icon="pi pi-user-plus" class="btn-primary" @click="openDialog()" />
    </div>

    <!-- Role cards -->
    <div class="role-cards">
      <div class="role-card" v-for="r in roles" :key="r.value">
        <div class="role-icon" :style="{ background: r.color + '22', color: r.color }">
          <i :class="r.icon" />
        </div>
        <div class="role-info">
          <div class="role-name">{{ r.label }}</div>
          <div class="role-desc">{{ r.desc }}</div>
        </div>
        <div class="role-count">{{ getUserCount(r.value) }} คน</div>
      </div>
    </div>

    <div class="page-card">
      <DataTable :value="masterStore.users" size="small" stripedRows>
        <Column field="username" header="Username" style="font-family: monospace; width: 140px;" />
        <Column field="name" header="ชื่อ-นามสกุล" />
        <Column field="email" header="อีเมล" />
        <Column header="สิทธิ์">
          <template #body="{ data }">
            <span :class="['role-badge', roleClass(data.role)]">{{ roleLabel(data.role) }}</span>
          </template>
        </Column>
        <Column header="คลังที่ดูแล" style="width: 130px;">
          <template #body="{ data }">
            {{ data.warehouseId ? masterStore.getWarehouseById(data.warehouseId)?.name : 'ทั้งหมด' }}
          </template>
        </Column>
        <Column header="สถานะ" style="width: 90px;">
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
              <Button
                :icon="data.active ? 'pi pi-ban' : 'pi pi-check'"
                size="small" text rounded
                :severity="data.active ? 'danger' : 'success'"
                @click="toggleActive(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" :header="editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'"
      :modal="true" :style="{ width: '460px' }">
      <div class="dialog-form">
        <div class="form-grid">
          <div>
            <label class="field-label">Username <span class="req">*</span></label>
            <InputText v-model="form.username" class="w-full" placeholder="username" />
          </div>
          <div>
            <label class="field-label">รหัสผ่าน <span class="req">*</span></label>
            <InputText v-model="form.password" class="w-full" type="password" placeholder="password" />
          </div>
        </div>
        <div>
          <label class="field-label">ชื่อ-นามสกุล <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="ชื่อ-นามสกุล" />
        </div>
        <div>
          <label class="field-label">อีเมล</label>
          <InputText v-model="form.email" class="w-full" placeholder="email@company.com" type="email" />
        </div>
        <div>
          <label class="field-label">สิทธิ์ <span class="req">*</span></label>
          <Dropdown v-model="form.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div v-if="form.role === 'warehouse_staff'">
          <label class="field-label">คลังที่ดูแล</label>
          <Dropdown v-model="form.warehouseId" :options="masterStore.warehouses" optionLabel="name" optionValue="id"
            placeholder="เลือกคลัง" class="w-full" showClear />
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
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'

const masterStore = useMasterStore()
const toast = useToast()

const showDialog = ref(false)
const editing = ref(null)
const form = ref({ username: '', password: '', name: '', email: '', role: 'warehouse_staff', warehouseId: null, active: true })

const roles = [
  { value: 'super_admin',     label: 'Super Admin',      desc: 'เข้าถึงทุกฟังก์ชัน จัดการ User/สิทธิ์', icon: 'pi pi-shield',  color: '#DC2626' },
  { value: 'warehouse_staff', label: 'Warehouse Staff',  desc: 'เบิก/จ่าย/คืน/รับเข้า ตัดสต๊อก',         icon: 'pi pi-box',     color: '#0D2461' },
  { value: 'doc_control',     label: 'Document Control', desc: 'สร้างและดูเอกสาร Master Data read-only',  icon: 'pi pi-file',    color: '#0284C7' },
]
const roleOptions = roles.map(r => ({ label: r.label, value: r.value }))

function getUserCount(role) { return masterStore.users.filter(u => u.role === role).length }
function roleLabel(r) { return roles.find(ro => ro.value === r)?.label || r }
function roleClass(r) { return { super_admin: 'role-admin', warehouse_staff: 'role-staff', doc_control: 'role-dc' }[r] || '' }

function openDialog(item = null) {
  editing.value = item
  if (item) Object.assign(form.value, { ...item, password: '' })
  else form.value = { username: '', password: '', name: '', email: '', role: 'warehouse_staff', warehouseId: null, active: true }
  showDialog.value = true
}

function handleSave() {
  if (!form.value.username || !form.value.name || (!editing.value && !form.value.password)) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกข้อมูลให้ครบ', life: 3000 })
    return
  }
  const data = { ...form.value }
  if (editing.value && !data.password) delete data.password
  if (editing.value) {
    masterStore.updateUser(editing.value.id, data)
    toast.add({ severity: 'success', summary: 'แก้ไขสำเร็จ', life: 3000 })
  } else {
    masterStore.addUser(data)
    toast.add({ severity: 'success', summary: 'เพิ่มผู้ใช้สำเร็จ', life: 3000 })
  }
  showDialog.value = false
}

function toggleActive(user) {
  masterStore.updateUser(user.id, { active: !user.active })
  toast.add({ severity: 'info', summary: user.active ? 'ระงับผู้ใช้แล้ว' : 'เปิดใช้งานแล้ว', life: 3000 })
}
</script>

<style scoped>
.role-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.role-card { background: var(--gl-surface); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); border: 1px solid var(--gl-border); }
.role-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.role-name { font-size: 14px; font-weight: 600; color: var(--gl-navy); }
.role-desc { font-size: 12px; color: var(--gl-text-muted); margin-top: 2px; }
.role-count { margin-left: auto; font-size: 24px; font-weight: 700; color: var(--gl-navy); }
.role-badge { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.role-admin { background: #FEE2E2; color: #991B1B; }
.role-staff { background: #DBEAFE; color: #1D4ED8; }
.role-dc    { background: #E0F2FE; color: #0369A1; }
.action-btns { display: flex; gap: 4px; }
.dialog-form { display: flex; flex-direction: column; gap: 14px; }
</style>
