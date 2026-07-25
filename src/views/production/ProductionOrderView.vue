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
        :loading="productionStore.ordersLoading"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}"
        size="small"
        stripedRows
      >
        <template #empty>
          <div class="empty-state">ไม่มีข้อมูลใบสั่งผลิต</div>
        </template>
        <Column field="docNo" header="เลขที่" style="width: 160px; font-family: monospace; font-size: 12px" sortable />
        <Column header="สูตร">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ getFormulaName(data.formulaId) }}</div>
          </template>
        </Column>
        <Column header="ขนาด Mix" style="width: 110px; text-align: center">
          <template #body="{ data }">{{ mixNameFor(data.formulaId, data.mixsizeId) }}</template>
        </Column>
        <Column header="สถานะ" style="width: 140px">
          <template #body="{ data }">
            <span :class="['po-badge', statusClass(data.status)]">{{ statusLabel(data.status) }}</span>
          </template>
        </Column>
        <Column header="วันที่" style="width: 110px">
          <template #body="{ data }">{{ formatDate(data.planDate) }}</template>
        </Column>
        <Column header="จัดการ" style="width: 100px">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                :icon="data.status === 'SUCCESS' || data.status === 'CANCELED' ? 'pi pi-eye' : 'pi pi-arrow-right'"
                size="small"
                text
                rounded
                :v-tooltip="data.status === 'SUCCESS' ? 'ดูรายละเอียด' : 'ดำเนินการผลิต'"
                @click="router.push(`/production/process/${data.id}`)"
              />
              <Button
                v-if="data.status === 'ACCEPT'"
                icon="pi pi-times"
                size="small"
                text
                rounded
                severity="danger"
                @click="confirmCancel(data)"
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

        <div class="form-field">
          <label>เครื่องจักร (Machine) <span class="req">*</span></label>
          <Dropdown
            v-model="createForm.machineId"
            :options="machineOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกเครื่องจักร..."
            style="width: 100%"
          />
        </div>

        <div class="form-field">
          <label>วันที่ผลิต (Plan date) <span class="req">*</span></label>
          <InputText v-model="createForm.planDate" type="date" style="width: 100%" />
        </div>

        <div v-if="createForm.formulaId && createForm.mixsizeId" class="total-preview">
          ส่วนผสมตามสูตร: <strong>{{ getIngredientCount(createForm.formulaId, createForm.mixsizeId) }} รายการ</strong>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" text :disabled="saving" @click="showCreate = false" />
        <Button label="สร้างและยืนยัน" icon="pi pi-check" class="btn-primary" :loading="saving" @click="doCreate" />
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
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const productionStore = useProductionStore();
const masterStore = useMasterStore();

onMounted(async () => {
  if (!masterStore.machines.length) masterStore.fetchMachines().catch(() => {});
  if (!masterStore.units.length) masterStore.fetchUnits();
  // Formula list (shallow — names only) drives the create dropdown.
  await productionStore.fetchFormulas().catch(() => {});
  try {
    await productionStore.fetchOrders();
  } catch {
    toast.add({ severity: "error", summary: "โหลดข้อมูลใบสั่งผลิตล้มเหลว", life: 3000 });
  }
  // The list endpoints are shallow, so hydrate mix sizes for the formulas the
  // orders reference (GET by id) so the "ขนาด Mix" column can show a name.
  // Only hydrate formulas that still exist (are in the list) — skip deleted ones
  // to avoid 404s.
  const knownIds = new Set(productionStore.formulas.map((f) => f.id));
  const ids = [...new Set(productionStore.orders.map((o) => o.formulaId))].filter(
    (id) => knownIds.has(id) && !productionStore.getFormulaById(id)?.mixSizes?.length,
  );
  await Promise.all(ids.map((id) => productionStore.fetchFormula(id).catch(() => {})));
});

const filterStatus = ref(null);
const filterFormula = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const createForm = ref({ formulaId: null, mixsizeId: null, machineId: null, planDate: "" });

const statusOptions = [
  { label: "ยืนยันแล้ว", value: "ACCEPT" },
  { label: "กำลังผสม", value: "MIXING" },
  { label: "เสร็จสิ้น", value: "SUCCESS" },
  { label: "ยกเลิก", value: "CANCELED" },
];

const formulaOptions = computed(() =>
  productionStore.formulas.map((f) => ({ label: `${f.code || "-"} — ${f.name}`, value: f.id })),
);
const activeFormulaOptions = computed(() =>
  productionStore.formulas.filter((f) => f.active).map((f) => ({ label: `${f.code || "-"} — ${f.name}`, value: f.id })),
);
const machineOptions = computed(() =>
  masterStore.machines.map((m) => ({ label: `${m.name}${m.code ? ` (${m.code})` : ""}`, value: m.id })),
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

// Mix sizes are owned by the formula, so resolve the label from its mixSizes.
function mixNameFor(formulaId, key) {
  const ms = getFormula(formulaId)?.mixSizes?.find((m) => m.key === key);
  if (ms) return ms.name;
  const mx = masterStore.getMixsizeById(key);
  if (mx) return `${mx.size.toLocaleString()} กก.`;
  return "—";
}

const mixsizeOptions = computed(() => {
  const f = getFormula(createForm.value.formulaId);
  return (f?.mixSizes || []).map((ms) => ({ label: ms.name, value: ms.key }));
});

function getIngredientCount(formulaId, mixsizeId) {
  const bom = getFormula(formulaId)?.bomByMixsize?.[mixsizeId];
  if (bom) return (bom.premix?.length || 0) + (bom.ingredients?.length || 0);
  return getFormula(formulaId)?.ingredients?.length || 0;
}
function statusLabel(s) {
  return (
    {
      ACCEPT: "ยืนยันแล้ว",
      MIXING: "กำลังผสม",
      SUCCESS: "เสร็จสิ้น",
      CANCELED: "ยกเลิก",
    }[s] || s
  );
}
// Map the backend status to the existing badge CSS classes.
function statusClass(s) {
  return { ACCEPT: "confirmed", MIXING: "mixing", SUCCESS: "done", CANCELED: "cancelled" }[s] || "";
}
function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
// Client-side prod number; the backend enforces uniqueness (409 if taken).
function generateProdNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const suffix = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `PO-${stamp}-${suffix}`;
}

function openCreate() {
  createForm.value = { formulaId: null, mixsizeId: null, machineId: null, planDate: todayISO() };
  showCreate.value = true;
}
async function onFormulaChange() {
  createForm.value.mixsizeId = null;
  // The formula list is shallow; fetch the full formula so its mix sizes load.
  const f = productionStore.getFormulaById(createForm.value.formulaId);
  if (!f?.mixSizes?.length) {
    await productionStore.fetchFormula(createForm.value.formulaId).catch(() => {});
  }
  createForm.value.mixsizeId = mixsizeOptions.value[0]?.value ?? null;
}

async function doCreate() {
  const f = createForm.value;
  if (!f.formulaId) return toast.add({ severity: "warn", summary: "กรุณาเลือกสูตร", life: 3000 });
  if (!f.mixsizeId) return toast.add({ severity: "warn", summary: "กรุณาเลือกขนาด Mix", life: 3000 });
  if (!f.machineId) return toast.add({ severity: "warn", summary: "กรุณาเลือกเครื่องจักร", life: 3000 });
  if (!f.planDate) return toast.add({ severity: "warn", summary: "กรุณาเลือกวันที่ผลิต", life: 3000 });

  saving.value = true;
  try {
    const order = await productionStore.createOrder({
      formulaId: f.formulaId,
      mixSizeId: Number(f.mixsizeId),
      firstMachineId: f.machineId,
      prodNo: generateProdNo(),
      planDate: f.planDate,
    });
    showCreate.value = false;
    toast.add({ severity: "success", summary: "สร้างใบสั่งผลิตสำเร็จ", detail: order.docNo, life: 3000 });
  } catch (e) {
    const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
    toast.add({ severity: "error", summary: Array.isArray(msg) ? msg.join(", ") : msg, life: 4000 });
  } finally {
    saving.value = false;
  }
}

function confirmCancel(order) {
  confirm.require({
    message: `ต้องการยกเลิกใบสั่งผลิต ${order.docNo} ใช่หรือไม่?`,
    header: "ยืนยันการยกเลิก",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await productionStore.cancelOrder(order.id);
        toast.add({ severity: "info", summary: "ยกเลิกแล้ว", detail: order.docNo, life: 3000 });
      } catch (e) {
        const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
        toast.add({ severity: "error", summary: Array.isArray(msg) ? msg.join(", ") : msg, life: 4000 });
      }
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
.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--gl-text-muted);
  font-size: 14px;
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
