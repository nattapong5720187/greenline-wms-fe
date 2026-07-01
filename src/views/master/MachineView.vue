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
      <DataTable :value="masterStore.machines" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลเครื่องจักร</div>
        </template>
        <Column field="code" header="รหัสเครื่อง" style="width: 140px; font-family: monospace" sortable />
        <Column field="name" header="ชื่อเครื่องจักร" sortable />
        <Column header="ประเภท" style="width: 180px">
          <template #body="{ data }">
            <span class="type-badge">{{ typeLabel(data.type) }}</span>
          </template>
        </Column>
        <Column header="สถานะ" style="width: 100px">
          <template #body="{ data }">
            <span :class="['status-badge', data.isActive ? 'status-fg' : 'status-hold']">
              {{ data.isActive ? "ใช้งาน" : "ระงับ" }}
            </span>
          </template>
        </Column>
        <Column header="จัดการ" style="width: 100px">
          <template #body="{ data }">
            <div class="action-btns">
              <Button icon="pi pi-pencil" size="small" text rounded @click="openDialog(data)" />
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="showDialog"
      :header="editing ? 'แก้ไขเครื่องจักร' : 'เพิ่มเครื่องจักร'"
      :modal="true"
      :style="{ width: '400px' }"
      :closable="!saving"
    >
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัสเครื่อง <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น HM-001" />
        </div>
        <div>
          <label class="field-label">ชื่อเครื่องจักร <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="เช่น Homo Mixer 1" />
        </div>
        <div>
          <label class="field-label">ประเภท <span class="req">*</span></label>
          <Dropdown
            v-model="form.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="เลือกประเภท"
          />
        </div>
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
        <Button :label="editing ? 'บันทึก' : 'เพิ่ม'" class="btn-primary" :loading="saving" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useMasterStore } from "@/stores/master";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";

const masterStore = useMasterStore();
const confirm = useConfirm();
const toast = useToast();

const typeOptions = [
  { label: "Homo Mixer", value: "HOMO_MIXER" },
  { label: "Ribbon Mixer", value: "RIBBON_MIXER" },
];
function typeLabel(value) {
  return typeOptions.find((t) => t.value === value)?.label || value;
}

const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = ref(defaultForm());

function defaultForm() {
  return { code: "", name: "", type: null, isActive: true };
}

async function fetchMachines() {
  loading.value = true;
  try {
    await masterStore.fetchMachines();
  } catch {
    toast.add({ severity: "error", summary: "โหลดข้อมูลล้มเหลว", life: 3000 });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchMachines);

function openDialog(item = null) {
  editing.value = item;
  form.value = item ? { code: item.code, name: item.name, type: item.type, isActive: item.isActive } : defaultForm();
  showDialog.value = true;
}

async function handleSave() {
  if (!form.value.code || !form.value.name || !form.value.type) {
    toast.add({ severity: "warn", summary: "กรุณากรอกข้อมูลให้ครบ", life: 3000 });
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await masterStore.updateMachine(editing.value.id, {
        code: form.value.code,
        name: form.value.name,
        type: form.value.type,
        isActive: form.value.isActive,
      });
      toast.add({ severity: "success", summary: "แก้ไขสำเร็จ", life: 3000 });
    } else {
      await masterStore.addMachine({
        code: form.value.code,
        name: form.value.name,
        type: form.value.type,
      });
      toast.add({ severity: "success", summary: "เพิ่มสำเร็จ", life: 3000 });
    }
    showDialog.value = false;
  } catch (e) {
    const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
    toast.add({ severity: "error", summary: Array.isArray(msg) ? msg.join(", ") : msg, life: 4000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item) {
  confirm.require({
    message: `ลบเครื่องจักร "${item.name}" ใช่หรือไม่?`,
    header: "ยืนยันการลบ",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await masterStore.deleteMachine(item.id);
        toast.add({ severity: "success", summary: "ลบสำเร็จ", life: 3000 });
      } catch (e) {
        const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
        toast.add({ severity: "error", summary: msg, life: 4000 });
      }
    },
  });
}
</script>
<style scoped>
.type-badge {
  background: var(--gl-bg);
  border: 1px solid var(--gl-border);
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gl-navy);
}
.action-btns {
  display: flex;
  gap: 4px;
}
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  .p-inputtext {
    width: 100%;
  }
  .p-select {
    width: 100%;
  }
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
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--gl-text-muted);
  font-size: 14px;
}
</style>
