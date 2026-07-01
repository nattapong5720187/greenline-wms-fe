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
      <DataTable :value="masterStore.categories" :loading="loading" size="small" stripedRows>
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลประเภทสินค้า</div>
        </template>
        <Column field="code" header="รหัส" style="width: 100px; font-family: monospace" />
        <Column field="name" header="ชื่อประเภท" />
        <Column header="ประเภทหลัก" style="width: 160px">
          <template #body="{ data }">
            {{ data.parentId ? masterStore.getCategoryById(data.parentId)?.name || "-" : "-" }}
          </template>
        </Column>
        <Column header="จำนวน SKU" style="width: 110px">
          <template #body="{ data }">
            <span class="count-badge">{{ getProductCount(data.id) }}</span>
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
      :header="editing ? 'แก้ไขประเภท' : 'เพิ่มประเภทสินค้า'"
      :modal="true"
      :style="{ width: '420px' }"
      :closable="!saving"
    >
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
          <label class="field-label">ประเภทหลัก (ถ้ามี)</label>
          <Dropdown
            v-model="form.parentId"
            :options="parentOptions"
            optionLabel="name"
            optionValue="id"
            class="w-full"
            placeholder="ไม่มี (เป็นประเภทหลัก)"
            showClear
          />
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
const form = ref(defaultForm());

function defaultForm() {
  return { code: "", name: "", parentId: null };
}

const parentOptions = computed(() => masterStore.categories.filter((c) => c.id !== editing.value?.id));

function getProductCount(catId) {
  return masterStore.products.filter((p) => p.categoryId === catId).length;
}

async function fetchCategories() {
  loading.value = true;
  try {
    await masterStore.fetchCategories();
  } catch {
    toast.add({ severity: "error", summary: "โหลดข้อมูลล้มเหลว", life: 3000 });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCategories();
  if (!masterStore.products.length) masterStore.fetchProducts();
});

function openDialog(item = null) {
  editing.value = item;
  form.value = item ? { code: item.code, name: item.name, parentId: item.parentId } : defaultForm();
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
      await masterStore.updateCategory(editing.value.id, { ...form.value });
      toast.add({ severity: "success", summary: "แก้ไขสำเร็จ", life: 3000 });
    } else {
      await masterStore.addCategory({ ...form.value });
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
    message: `ลบประเภท "${item.name}" ใช่หรือไม่?`,
    header: "ยืนยันการลบ",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await masterStore.deleteCategory(item.id);
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
.count-badge {
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
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--gl-text-muted);
  font-size: 14px;
}
</style>
