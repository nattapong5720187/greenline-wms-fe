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
          <InputText v-model="search" placeholder="ค้นหา..." style="padding-left: 2.2rem; width: 260px" />
        </span>
      </div>
      <DataTable :value="filtered" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลซัพพลายเออร์</div>
        </template>
        <Column field="code" header="รหัส" style="width: 110px; font-family: monospace" sortable />
        <Column field="name" header="ชื่อบริษัท/ผู้จำหน่าย" sortable />
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
      :header="editing ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์'"
      :modal="true"
      :style="{ width: '440px' }"
      :closable="!saving"
    >
      <div class="dialog-form">
        <div>
          <label class="field-label">รหัส <span class="req">*</span></label>
          <InputText v-model="form.code" class="w-full" placeholder="เช่น SUP006" />
        </div>
        <div>
          <label class="field-label">ชื่อบริษัท <span class="req">*</span></label>
          <InputText v-model="form.name" class="w-full" placeholder="ชื่อบริษัท/ผู้จำหน่าย" />
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
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref } from "vue";

const masterStore = useMasterStore();
const confirm = useConfirm();
const toast = useToast();

const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const editing = ref(null);
const search = ref("");
const form = ref({ code: "", name: "" });

const filtered = computed(() =>
  masterStore.suppliers.filter((s) => {
    const q = search.value.toLowerCase();
    return !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  }),
);

async function fetchSuppliers() {
  loading.value = true;
  try {
    await masterStore.fetchSuppliers();
  } catch {
    toast.add({ severity: "error", summary: "โหลดข้อมูลล้มเหลว", life: 3000 });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSuppliers);

function openDialog(item = null) {
  editing.value = item;
  form.value = item ? { code: item.code, name: item.name } : { code: "", name: "" };
  showDialog.value = true;
}

async function handleSave() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: "warn", summary: "กรุณากรอกข้อมูลให้ครบ", life: 3000 });
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await masterStore.updateSupplier(editing.value.id, { ...form.value });
      toast.add({ severity: "success", summary: "แก้ไขสำเร็จ", life: 3000 });
    } else {
      await masterStore.addSupplier({ ...form.value });
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
    message: `ลบ "${item.name}" ใช่หรือไม่?`,
    header: "ยืนยันการลบ",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await masterStore.deleteSupplier(item.id);
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
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-wrap i {
  position: absolute;
  left: 0.75rem;
  z-index: 1;
  color: var(--gl-text-muted);
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
}
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--gl-text-muted);
  font-size: 14px;
}
</style>
