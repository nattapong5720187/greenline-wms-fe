<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ผู้ใช้งาน & สิทธิ์</div>
        <div class="page-subtitle">จัดการบัญชีผู้ใช้และระดับสิทธิ์การเข้าถึง</div>
      </div>
      <Button label="เพิ่มผู้ใช้" icon="pi pi-user-plus" class="btn-primary" @click="openCreate" />
    </div>

    <!-- Role summary cards -->
    <div class="role-cards">
      <div class="role-card" v-for="r in ROLE_DEFS" :key="r.code">
        <div class="role-icon" :style="{ background: r.color + '22', color: r.color }">
          <i :class="r.icon" />
        </div>
        <div class="role-info">
          <div class="role-name">{{ r.label }}</div>
          <div class="role-desc">{{ r.desc }}</div>
        </div>
        <div class="role-count">{{ getUserCount(r.code) }} คน</div>
      </div>
    </div>

    <div class="page-card">
      <DataTable :value="users" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลผู้ใช้</div>
        </template>
        <Column field="username" header="Username" style="font-family: monospace; width: 150px" />
        <Column field="fullName" header="ชื่อ-นามสกุล" />
        <Column header="สิทธิ์">
          <template #body="{ data }">
            <div class="role-badges">
              <span v-for="role in data.roles" :key="role.id" :class="['role-badge', roleBadgeClass(role.code)]">
                {{ role.name }}
              </span>
              <span v-if="!data.roles?.length" class="role-badge role-none">ไม่มีสิทธิ์</span>
            </div>
          </template>
        </Column>
        <Column header="สถานะ" style="width: 90px">
          <template #body="{ data }">
            <span :class="['status-badge', data.isActive ? 'status-fg' : 'status-hold']">
              {{ data.isActive ? "ใช้งาน" : "ระงับ" }}
            </span>
          </template>
        </Column>
        <Column header="จัดการ" style="width: 100px">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                rounded
                :disabled="isSelf(data)"
                v-tooltip="isSelf(data) ? 'ไม่สามารถแก้ไขตัวเองได้' : 'แก้ไข'"
                @click="openEdit(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                text
                rounded
                severity="danger"
                :disabled="isSelf(data)"
                v-tooltip="isSelf(data) ? 'ไม่สามารถลบตัวเองได้' : 'ลบ'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create / Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'"
      :modal="true"
      :style="{ width: 'min(500px, 92vw)' }"
      :closable="!saving"
    >
      <div class="dialog-form">
        <div class="form-grid">
          <!-- ชื่อ-นามสกุล -->
          <div>
            <label class="field-label">ชื่อ-นามสกุล <span class="req">*</span></label>
            <InputText v-model="form.fullName" class="w-full" placeholder="ชื่อ-นามสกุล" />
          </div>

          <!-- สิทธิ์ -->
          <div>
            <label class="field-label">สิทธิ์ <span class="req">*</span></label>
            <MultiSelect
              v-model="form.roleIds"
              :options="roleOptions"
              optionValue="id"
              optionLabel="name"
              optionDisabled="disabled"
              display="chip"
              placeholder="เลือกสิทธิ์"
              class="w-full"
              :showToggleAll="false"
              @change="onRoleChange"
            >
              <template #option="{ option }">
                <div class="role-option-item">
                  <span :class="['role-badge', roleBadgeClass(option.code)]">{{ option.name }}</span>
                  <span class="role-option-desc">{{ getRoleDef(option.code)?.desc }}</span>
                </div>
              </template>
              <template #chip="{ value }">
                <span :class="['role-chip', roleBadgeClass(getRoleById(value)?.code)]">
                  {{ getRoleById(value)?.name }}
                </span>
              </template>
            </MultiSelect>
            <div v-if="isSuperAdminSelected" class="super-admin-hint">
              <i class="pi pi-info-circle" /> Super Admin มีสิทธิ์ครอบคลุมทุกฟังก์ชัน
            </div>
          </div>

          <!-- Username -->
          <div>
            <label class="field-label">Username <span class="req">*</span></label>
            <InputText v-model="form.username" class="w-full" placeholder="username" :disabled="!!editing" />
          </div>

          <!-- รหัสผ่าน -->
          <div>
            <label class="field-label">
              รหัสผ่าน <span class="req" v-if="!editing">*</span>
              <span class="optional" v-else>(เว้นว่างถ้าไม่เปลี่ยน)</span>
            </label>
            <InputText
              v-model="form.password"
              class="w-full"
              :class="{ 'pw-invalid': form.password && !isPasswordValid }"
              type="password"
              placeholder="password"
            />
          </div>
        </div>

        <!-- Password rules — full width ใต้ grid -->
        <div v-if="!editing || form.password" class="pw-rules">
          <div v-for="rule in passwordRules" :key="rule.key" :class="['pw-rule', rule.pass ? 'pass' : 'fail']">
            <i :class="rule.pass ? 'pi pi-check-circle' : 'pi pi-circle'" />
            {{ rule.label }}
          </div>
        </div>

        <!-- isActive toggle (edit only) -->
        <div v-if="editing" class="active-row">
          <label class="field-label" style="margin: 0">สถานะ</label>
          <div class="active-toggle">
            <ToggleSwitch v-model="form.isActive" inputId="isActive" />
            <label for="isActive" style="font-size: 13px; cursor: pointer">
              {{ form.isActive ? "ใช้งาน" : "ระงับการใช้งาน" }}
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDialog = false" :disabled="saving" />
        <Button
          :label="editing ? 'บันทึก' : 'เพิ่ม'"
          class="btn-primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="handleSave"
        />
      </template>
    </Dialog>

    <!-- Delete confirm dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="ยืนยันการลบ"
      :modal="true"
      :style="{ width: '380px' }"
      :closable="!deleting"
    >
      <div class="delete-confirm">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #dc2626" />
        <div>
          <div style="font-weight: 600; margin-bottom: 4px">ลบผู้ใช้ "{{ deleteTarget?.fullName }}"?</div>
          <div style="font-size: 13px; color: var(--gl-text-muted)">การลบไม่สามารถย้อนกลับได้</div>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showDeleteDialog = false" :disabled="deleting" />
        <Button label="ลบ" severity="danger" :loading="deleting" @click="executeDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { apiCreateUser, apiDeleteUser, apiGetRoles, apiGetUsers, apiUpdateUser } from "@/api/users";
import { useAuthStore } from "@/stores/auth";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref } from "vue";

const toast = useToast();
const authStore = useAuthStore();

// ─── State ────────────────────────────────────────────────────────────────────
const users = ref([]);
const availableRoles = ref([]);
const loading = ref(false);

const showDialog = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = ref(defaultForm());
const originalForm = ref(null);

const showDeleteDialog = ref(false);
const deleting = ref(false);
const deleteTarget = ref(null);

// ─── Role definitions (UI metadata) ──────────────────────────────────────────
const ROLE_DEFS = [
  {
    code: "SUPER_ADMIN",
    label: "Super Admin",
    desc: "เข้าถึงทุกฟังก์ชัน จัดการ User/สิทธิ์",
    icon: "pi pi-shield",
    color: "#DC2626",
  },
  {
    code: "WAREHOUSE_STAFF",
    label: "Warehouse Staff",
    desc: "เบิก/จ่าย/คืน/รับเข้า ตัดสต๊อก",
    icon: "pi pi-box",
    color: "#0D2461",
  },
  {
    code: "PRODUCTION_STAFF",
    label: "Production Staff",
    desc: "จัดการการผลิต สูตร/BOM ใบสั่งผลิต",
    icon: "pi pi-cog",
    color: "#7C3AED",
  },
  {
    code: "DOC_CONTROL",
    label: "Document Control",
    desc: "สร้างและดูเอกสาร Master Data read-only",
    icon: "pi pi-file",
    color: "#0284C7",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function defaultForm() {
  return { username: "", password: "", fullName: "", roleIds: [], isActive: true };
}

function isSelf(user) {
  return user.id === authStore.user?.id;
}
function getRoleDef(code) {
  return ROLE_DEFS.find((r) => r.code === code);
}
function getRoleById(id) {
  return availableRoles.value.find((r) => r.id === id);
}
function getUserCount(code) {
  return users.value.filter((u) => u.roles?.some((r) => r.code === code)).length;
}
function roleBadgeClass(code) {
  return (
    { SUPER_ADMIN: "role-admin", WAREHOUSE_STAFF: "role-staff", PRODUCTION_STAFF: "role-prod", DOC_CONTROL: "role-dc" }[
      code
    ] || "role-none"
  );
}

// ─── Password validation ──────────────────────────────────────────────────────
const passwordRules = computed(() => {
  const pw = form.value.password;
  return [
    { key: "lower", label: "มีตัวอักษรภาษาอังกฤษพิมพ์เล็ก (a-z)", pass: /[a-z]/.test(pw) },
    { key: "upper", label: "มีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ (A-Z)", pass: /[A-Z]/.test(pw) },
    { key: "number", label: "มีตัวเลข (0-9)", pass: /[0-9]/.test(pw) },
    { key: "special", label: "มีอักขระพิเศษ เช่น !@#$%^&*", pass: /[^a-zA-Z0-9]/.test(pw) },
    { key: "length", label: "ความยาวอย่างน้อย 8 ตัวอักษร", pass: pw.length >= 8 },
  ];
});

const isPasswordValid = computed(() => passwordRules.value.every((r) => r.pass));

// เช็คว่ามีการแก้ไขจาก original หรือเปล่า (เฉพาะ mode edit)
const hasChanges = computed(() => {
  if (!editing.value || !originalForm.value) return true; // create mode กดได้เสมอ
  const f = form.value;
  const o = originalForm.value;
  if (f.fullName.trim() !== o.fullName) return true;
  if (f.isActive !== o.isActive) return true;
  if (f.password) return true;
  const sortedNew = [...f.roleIds].sort().join(",");
  const sortedOld = [...o.roleIds].sort().join(",");
  if (sortedNew !== sortedOld) return true;
  return false;
});

const superAdminId = computed(() => availableRoles.value.find((r) => r.code === "SUPER_ADMIN")?.id);
const isSuperAdminSelected = computed(() => !!superAdminId.value && form.value.roleIds.includes(superAdminId.value));

// Options for MultiSelect — mark others as disabled when SUPER_ADMIN is selected
const roleOptions = computed(() =>
  availableRoles.value.map((r) => ({
    ...r,
    disabled: isSuperAdminSelected.value && r.code !== "SUPER_ADMIN",
  })),
);

// When SUPER_ADMIN is selected → keep only SUPER_ADMIN in selection
function onRoleChange() {
  if (isSuperAdminSelected.value && form.value.roleIds.length > 1) {
    form.value.roleIds = [superAdminId.value];
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function fetchRoles() {
  try {
    const { data } = await apiGetRoles();
    const order = ROLE_DEFS.map((d) => d.code);
    availableRoles.value = [...data].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
  } catch {
    // ไม่ block หน้า ถ้า roles load ไม่ได้
  }
}

async function fetchUsers() {
  loading.value = true;
  try {
    const { data } = await apiGetUsers();
    users.value = data;
  } catch {
    toast.add({ severity: "error", summary: "โหลดข้อมูลล้มเหลว", life: 3000 });
  } finally {
    loading.value = false;
  }
}

onMounted(() => Promise.all([fetchUsers(), fetchRoles()]));

// ─── Dialog open ──────────────────────────────────────────────────────────────
function openCreate() {
  editing.value = null;
  form.value = defaultForm();
  showDialog.value = true;
}

function openEdit(user) {
  editing.value = user;
  const snapshot = {
    username: user.username,
    password: "",
    fullName: user.fullName,
    roleIds: user.roles?.map((r) => r.id) ?? [],
    isActive: user.isActive,
  };
  form.value = { ...snapshot };
  originalForm.value = { ...snapshot };
  showDialog.value = true;
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!form.value.fullName.trim()) {
    toast.add({ severity: "warn", summary: "กรุณากรอกชื่อ-นามสกุล", life: 3000 });
    return;
  }
  if (!editing.value && !form.value.username.trim()) {
    toast.add({ severity: "warn", summary: "กรุณากรอก Username", life: 3000 });
    return;
  }
  if (!editing.value && !form.value.password) {
    toast.add({ severity: "warn", summary: "กรุณากรอกรหัสผ่าน", life: 3000 });
    return;
  }
  if (form.value.password && !isPasswordValid.value) {
    toast.add({ severity: "warn", summary: "รหัสผ่านไม่ตรงตามเงื่อนไขที่กำหนด", life: 3000 });
    return;
  }

  saving.value = true;
  try {
    if (editing.value) {
      const updateBody = { fullName: form.value.fullName, isActive: form.value.isActive, roleIds: form.value.roleIds };
      if (form.value.password) updateBody.password = form.value.password;
      await apiUpdateUser(editing.value.id, updateBody);
      toast.add({ severity: "success", summary: "แก้ไขสำเร็จ", life: 3000 });
    } else {
      await apiCreateUser({
        username: form.value.username.trim(),
        password: form.value.password,
        fullName: form.value.fullName.trim(),
        roleIds: form.value.roleIds,
      });
      toast.add({ severity: "success", summary: "เพิ่มผู้ใช้สำเร็จ", life: 3000 });
    }
    showDialog.value = false;
    await fetchUsers();
  } catch (e) {
    const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
    toast.add({ severity: "error", summary: Array.isArray(msg) ? msg.join(", ") : msg, life: 4000 });
  } finally {
    saving.value = false;
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete(user) {
  deleteTarget.value = user;
  showDeleteDialog.value = true;
}

async function executeDelete() {
  deleting.value = true;
  try {
    await apiDeleteUser(deleteTarget.value.id);
    toast.add({ severity: "success", summary: "ลบผู้ใช้สำเร็จ", life: 3000 });
    showDeleteDialog.value = false;
    await fetchUsers();
  } catch (e) {
    const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
    toast.add({ severity: "error", summary: msg, life: 4000 });
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.role-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.role-card {
  background: var(--gl-surface);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--gl-border);
}
.role-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.role-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gl-navy);
}
.role-desc {
  font-size: 12px;
  color: var(--gl-text-muted);
  margin-top: 2px;
}
.role-count {
  margin-left: auto;
  font-size: 24px;
  font-weight: 700;
  color: var(--gl-navy);
}

.role-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.role-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.role-admin {
  background: #fee2e2;
  color: #991b1b;
}
.role-staff {
  background: #dbeafe;
  color: #1d4ed8;
}
.role-prod {
  background: #ede9fe;
  color: #6d28d9;
}
.role-dc {
  background: #e0f2fe;
  color: #0369a1;
}
.role-none {
  background: #f3f4f6;
  color: #6b7280;
}

/* MultiSelect chip colors */
.role-chip {
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
}

/* MultiSelect dropdown item */
.role-option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}
.role-option-desc {
  font-size: 12px;
  color: var(--gl-text-muted);
}

.super-admin-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-btns {
  display: flex;
  gap: 4px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px 16px;
}
.optional {
  font-size: 11px;
  font-weight: 400;
  color: var(--gl-text-muted);
  margin-left: 4px;
}

.pw-rules {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--gl-bg);
  border: 1px solid var(--gl-border);
  border-radius: 8px;
}
.pw-rule {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--gl-text-muted);
  transition: color 0.2s;
}
.pw-rule.pass {
  color: #16a34a;
}
.pw-rule.fail {
  color: var(--gl-text-muted);
}
.pw-rule.pass i {
  color: #16a34a;
}
.pw-rule.fail i {
  color: #d1d5db;
}

:deep(.pw-invalid.p-inputtext) {
  border-color: #dc2626 !important;
}

.active-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.active-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-confirm {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--gl-text-muted);
  font-size: 14px;
}
</style>
