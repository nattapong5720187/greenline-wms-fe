<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">ใบสั่งผลิต</div>
        <div class="page-subtitle">จัดการคำสั่งผลิตทั้งหมด</div>
      </div>
      <Button label="สร้างใบสั่งผลิต" icon="pi pi-plus" class="btn-primary" @click="openCreate" />
    </div>

    <div class="stat-chips">
      <div class="stat-chip">
        <span class="chip-num">{{ productionStore.counts.all }}</span>
        <span class="chip-label">ทั้งหมด</span>
      </div>
      <div class="stat-chip confirmed">
        <span class="chip-num">{{ productionStore.counts.confirmed }}</span>
        <span class="chip-label">ยืนยันแล้ว</span>
      </div>
      <div class="stat-chip in-progress">
        <span class="chip-num">{{ productionStore.counts.inProgress }}</span>
        <span class="chip-label">กำลังผลิต</span>
      </div>
      <div class="stat-chip done">
        <span class="chip-num">{{ productionStore.counts.done }}</span>
        <span class="chip-label">เสร็จสิ้น</span>
      </div>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <Dropdown
          v-model="filterStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="ทุกสถานะ"
          showClear
          style="width: 200px"
        />
        <Dropdown
          v-model="filterFormula"
          :options="formulaOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="ทุกสูตร"
          showClear
          style="width: 250px"
          filter
        />
      </div>

      <DataTable
        :value="filtered"
        :paginator="true"
        :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}"
        size="small"
        stripedRows
      >
        <Column field="docNo" header="เลขที่" style="width: 160px; font-family: monospace; font-size: 12px" sortable />
        <Column header="สูตร">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ getFormulaName(data.formulaId) }}</div>
          </template>
        </Column>
        <Column header="ขนาด Mix" style="width: 110px; text-align: center">
          <template #body="{ data }">{{ mixsizeLabel(data.mixsizeId) }}</template>
        </Column>
        <Column header="สถานะ" style="width: 140px">
          <template #body="{ data }">
            <span :class="['po-badge', data.status]">{{ statusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="วันที่" style="width: 110px">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="จัดการ" style="width: 100px">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                :icon="data.status === 'done' || data.status === 'cancelled' ? 'pi pi-eye' : 'pi pi-arrow-right'"
                size="small"
                text
                rounded
                :v-tooltip="data.status === 'done' ? 'ดูรายละเอียด' : 'ดำเนินการผลิต'"
                @click="router.push(`/production/process/${data.id}`)"
              />
              <Button
                v-if="['draft', 'confirmed'].includes(data.status)"
                icon="pi pi-times"
                size="small"
                text
                rounded
                severity="danger"
                @click="confirmCancel(data)"
              />
              <Button
                v-if="data.status === 'done'"
                icon="pi pi-print"
                size="small"
                text
                rounded
                :v-tooltip="'รายงานการผสมผลิตที่เครื่อง Homo Mixer'"
              />
              <Button
                v-if="data.status === 'done'"
                icon="pi pi-file-export"
                size="small"
                text
                rounded
                :v-tooltip="'รายงานผสมผลิตภัณฑ์กันที่เครื่อง Ribbon Mixer'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="สร้างใบสั่งผลิต" :style="{ width: '480px' }" modal>
      <div class="dialog-form">
        <div class="form-field">
          <label>สูตร / Formula <span class="req">*</span></label>
          <Dropdown
            v-model="createForm.formulaId"
            :options="activeFormulaOptions"
            optionLabel="label"
            optionValue="value"
            filter
            placeholder="เลือกสูตร..."
            style="width: 100%"
            @change="onFormulaChange"
          />
        </div>

        <div class="form-field">
          <label>ขนาด Mix (Mix size) <span class="req">*</span></label>
          <Dropdown
            v-model="createForm.mixsizeId"
            :options="mixsizeOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="!createForm.formulaId"
            placeholder="เลือกขนาด Mix..."
            style="width: 100%"
          />
        </div>

        <div v-if="createForm.formulaId && createForm.mixsizeId" class="total-preview">
          ส่วนผสมตามสูตร: <strong>{{ getIngredientCount(createForm.formulaId, createForm.mixsizeId) }} รายการ</strong>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" text @click="showCreate = false" />
        <Button label="สร้างและยืนยัน" icon="pi pi-check" class="btn-primary" @click="doCreate" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useMasterStore } from "@/stores/master";
import { useProductionStore } from "@/stores/production";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const productionStore = useProductionStore();
const masterStore = useMasterStore();

const filterStatus = ref(null);
const filterFormula = ref(null);
const showCreate = ref(false);
const createForm = ref({ formulaId: null, mixsizeId: null });

const statusOptions = [
  { label: "ยืนยันแล้ว", value: "confirmed" },
  { label: "กำลังผสม", value: "mixing" },
  { label: "รอรับเข้า Semi", value: "receiving" },
  { label: "เสร็จสิ้น", value: "done" },
  { label: "ยกเลิก", value: "cancelled" },
];

const formulaOptions = computed(() =>
  productionStore.formulas.map((f) => ({ label: `${f.code} — ${f.name}`, value: f.id })),
);
const activeFormulaOptions = computed(() =>
  productionStore.formulas.filter((f) => f.active).map((f) => ({ label: `${f.code} — ${f.name}`, value: f.id })),
);
const filtered = computed(() =>
  productionStore.orders.filter((o) => {
    const matchStatus = !filterStatus.value || o.status === filterStatus.value;
    const matchFormula = !filterFormula.value || o.formulaId === filterFormula.value;
    return matchStatus && matchFormula;
  }),
);

function getFormula(id) {
  return productionStore.getFormulaById(id);
}
function getFormulaName(id) {
  return getFormula(id)?.name || "—";
}

function mixsizeLabel(id) {
  const mx = masterStore.getMixsizeById(id);
  if (!mx) return "—";
  return `${mx.size.toLocaleString()} ${masterStore.getUnitById(mx.unitId)?.abbr || ""}`.trim();
}

const mixsizeOptions = computed(() => {
  const f = getFormula(createForm.value.formulaId);
  return (f?.mixsizeIds || []).map((id) => ({ label: mixsizeLabel(id), value: id }));
});

function getIngredientCount(formulaId, mixsizeId) {
  const bom = getFormula(formulaId)?.bomByMixsize?.[mixsizeId];
  if (bom) return (bom.premix?.length || 0) + (bom.ingredients?.length || 0);
  return getFormula(formulaId)?.ingredients?.length || 0;
}
function statusLabel(s) {
  return (
    {
      confirmed: "ยืนยันแล้ว",
      mixing: "กำลังผสม",
      receiving: "รอรับเข้า Semi",
      done: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
    }[s] || s
  );
}
function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function openCreate() {
  createForm.value = { formulaId: null, mixsizeId: null };
  showCreate.value = true;
}
function onFormulaChange() {
  // default to the formula's first mix size, if any
  createForm.value.mixsizeId = mixsizeOptions.value[0]?.value ?? null;
}

function doCreate() {
  if (!createForm.value.formulaId) {
    toast.add({ severity: "warn", summary: "กรุณาเลือกสูตร", life: 3000 });
    return;
  }
  if (!createForm.value.mixsizeId) {
    toast.add({ severity: "warn", summary: "กรุณาเลือกขนาด Mix", life: 3000 });
    return;
  }
  const order = productionStore.createOrder(createForm.value.formulaId, createForm.value.mixsizeId);
  showCreate.value = false;
  toast.add({ severity: "success", summary: "สร้างใบสั่งผลิตสำเร็จ", detail: order.docNo, life: 3000 });
  router.push(`/production/process/${order.id}`);
}

function confirmCancel(order) {
  confirm.require({
    message: `ต้องการยกเลิกใบสั่งผลิต ${order.docNo} ใช่หรือไม่?`,
    header: "ยืนยันการยกเลิก",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => {
      productionStore.cancelOrder(order.id);
      toast.add({ severity: "info", summary: "ยกเลิกแล้ว", detail: order.docNo, life: 3000 });
    },
  });
}
</script>

<style scoped>
.stat-chips {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.stat-chip {
  background: #fff;
  border-radius: 10px;
  padding: 12px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.chip-num {
  font-size: 22px;
  font-weight: 700;
  color: #1e2a3b;
}
.chip-label {
  font-size: 12px;
  color: var(--gl-text-muted);
}
.stat-chip.confirmed .chip-num {
  color: #3b82f6;
}
.stat-chip.in-progress .chip-num {
  color: #f59e0b;
}
.stat-chip.done .chip-num {
  color: #10b981;
}
.action-btns {
  display: flex;
  gap: 4px;
}
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 13px;
  font-weight: 500;
}
.req {
  color: var(--gl-red);
}
.formula-preview {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px 16px;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 3px 0;
}
.total-preview {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  text-align: center;
  color: #166534;
}
.po-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.po-badge.confirmed {
  background: #dbeafe;
  color: #1d4ed8;
}
.po-badge.mixing {
  background: #fef3c7;
  color: #b45309;
}
.po-badge.processing {
  background: #ffedd5;
  color: #c2410c;
}
.po-badge.packing {
  background: #ede9fe;
  color: #6d28d9;
}
.po-badge.receiving {
  background: #cffafe;
  color: #0e7490;
}
.po-badge.done {
  background: #dcfce7;
  color: #166534;
}
.po-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}
</style>
