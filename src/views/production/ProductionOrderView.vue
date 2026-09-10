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
        <Column header="สูตรซอส (SAUCE)">
          <template #body="{ data }">
            <template v-if="data.sauceFormulaId">
              <div style="font-weight: 500">{{ formulaName(data.sauceFormulaId) }}</div>
              <div class="mix-sub">
                {{ mixNameFor(data.sauceFormulaId, data.sauceMixsizeKey) }} ·
                {{ machineName(data.sauceMachineId) }}
              </div>
            </template>
            <span v-else class="muted">— ไม่มีสูตรซอส</span>
          </template>
        </Column>
        <Column header="สูตรแปรรูป (SEMI)">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ formulaName(data.semiFormulaId) }}</div>
            <div class="mix-sub">
              {{ mixNameFor(data.semiFormulaId, data.semiMixsizeKey) }} ·
              {{ machineName(data.semiMachineId) }}
            </div>
          </template>
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

    <Dialog v-model:visible="showCreate" header="สร้างใบสั่งผลิต" :style="{ width: '560px' }" modal>
      <div class="dialog-form">
        <!-- Step 1 — the sauce half, mixed first (Homo mixer). -->
        <div class="stage-block">
          <div class="stage-head">
            <span class="stage-no">1</span>
            <div>
              <div class="stage-title">สูตรซอส (SAUCE)</div>
              <div class="stage-sub">ผสม Premix → ซอส</div>
            </div>
          </div>
          <div class="form-field">
            <label>สูตร / Formula</label>
            <Dropdown
              v-model="createForm.sauceFormulaId"
              :options="sauceFormulaOptions"
              optionLabel="label"
              optionValue="value"
              filter
              showClear
              :emptyMessage="emptyFormulaMessage('SAUCE')"
              placeholder="เลือกสูตรซอส..."
              style="width: 100%"
              @change="onSauceFormulaChange"
            />
          </div>
          <div class="form-row-2">
            <div class="form-field">
              <label>ขนาด Mix (Mix size) <span v-if="createForm.sauceFormulaId" class="req">*</span></label>
              <Dropdown
                v-model="createForm.sauceMixsizeId"
                :options="sauceMixsizeOptions"
                optionLabel="label"
                optionValue="value"
                :disabled="!createForm.sauceFormulaId"
                placeholder="เลือกขนาด Mix..."
                style="width: 100%"
              />
            </div>
            <div class="form-field">
              <label>เครื่องจักร (Machine)</label>
              <Dropdown
                v-model="createForm.sauceMachineId"
                :options="machineOptions"
                optionLabel="label"
                optionValue="value"
                showClear
                :disabled="!createForm.sauceFormulaId"
                placeholder="เลือกเครื่องจักร..."
                style="width: 100%"
              />
            </div>
          </div>
          <div v-if="sauceIngredientCount !== null" class="stage-preview">
            ส่วนผสมตามสูตร: <strong>{{ sauceIngredientCount }} รายการ</strong>
          </div>
        </div>

        <!-- Step 2 — the semi half, which the API requires. -->
        <div class="stage-block">
          <div class="stage-head">
            <span class="stage-no">2</span>
            <div>
              <div class="stage-title">สูตรแปรรูป (SEMI) <span class="req">*</span></div>
              <div class="stage-sub">ผสมซอส + เนื้อแปรรูป</div>
            </div>
          </div>
          <div class="form-field">
            <label>สูตร / Formula <span class="req">*</span></label>
            <Dropdown
              v-model="createForm.semiFormulaId"
              :options="semiFormulaOptions"
              optionLabel="label"
              optionValue="value"
              filter
              :emptyMessage="emptyFormulaMessage('SEMI')"
              placeholder="เลือกสูตรแปรรูป..."
              style="width: 100%"
              @change="onSemiFormulaChange"
            />
          </div>
          <div class="form-row-2">
            <div class="form-field">
              <label>ขนาด Mix (Mix size) <span class="req">*</span></label>
              <Dropdown
                v-model="createForm.semiMixsizeId"
                :options="semiMixsizeOptions"
                optionLabel="label"
                optionValue="value"
                :disabled="!createForm.semiFormulaId"
                placeholder="เลือกขนาด Mix..."
                style="width: 100%"
              />
            </div>
            <div class="form-field">
              <label>เครื่องจักร (Machine)</label>
              <Dropdown
                v-model="createForm.semiMachineId"
                :options="machineOptions"
                optionLabel="label"
                optionValue="value"
                showClear
                placeholder="เลือกเครื่องจักร..."
                style="width: 100%"
              />
            </div>
          </div>
          <div v-if="semiIngredientCount !== null" class="stage-preview">
            ส่วนผสมตามสูตร: <strong>{{ semiIngredientCount }} รายการ</strong>
          </div>
        </div>

        <div class="form-field">
          <label>วันที่ผลิต (Plan date) <span class="req">*</span></label>
          <InputText v-model="createForm.planDate" type="date" style="width: 100%" />
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
  const referenced = productionStore.orders.flatMap((o) => [o.semiFormulaId, o.sauceFormulaId]);
  const ids = [...new Set(referenced)].filter(
    (id) => id && knownIds.has(id) && !productionStore.getFormulaById(id)?.mixSizes?.length,
  );
  await Promise.all(ids.map((id) => productionStore.fetchFormula(id).catch(() => {})));
});

const filterStatus = ref(null);
const filterFormula = ref(null);
const showCreate = ref(false);
const saving = ref(false);
/*
 * An order pairs two formulas. The sauce half is optional on the API but
 * indivisible — a sauce formula without its mix size is a 400 — so the form
 * keeps the two together and clears them together.
 */
function emptyCreateForm() {
  return {
    sauceFormulaId: null,
    sauceMixsizeId: null,
    sauceMachineId: null,
    semiFormulaId: null,
    semiMixsizeId: null,
    semiMachineId: null,
    planDate: "",
  };
}
const createForm = ref(emptyCreateForm());

const statusOptions = [
  { label: "ยืนยันแล้ว", value: "ACCEPT" },
  { label: "กำลังผสม", value: "MIXING" },
  { label: "เสร็จสิ้น", value: "SUCCESS" },
  { label: "ยกเลิก", value: "CANCELED" },
];

const formulaOptions = computed(() =>
  productionStore.formulas.map((f) => ({ label: `${f.code || "-"} — ${f.name}`, value: f.id })),
);
// Each side of the order offers only formulas of its own type. A formula with no
// type predates the semi/sauce split and belongs to neither list — it would
// snapshot the wrong lines into the order.
function formulaOptionsOfType(type) {
  return productionStore.formulas
    .filter((f) => f.active && f.type === type)
    .map((f) => ({ label: `${f.code || "-"} — ${f.name}`, value: f.id }));
}
const sauceFormulaOptions = computed(() => formulaOptionsOfType("SAUCE"));
const semiFormulaOptions = computed(() => formulaOptionsOfType("SEMI"));
function emptyFormulaMessage(type) {
  const label = type === "SAUCE" ? "ซอส (SAUCE)" : "แปรรูป (SEMI)";
  return `ยังไม่มีสูตรประเภท${label} — สร้างที่หน้า สูตร / BOM ก่อน`;
}
const machineOptions = computed(() =>
  masterStore.machines.map((m) => ({ label: `${m.name}${m.code ? ` (${m.code})` : ""}`, value: m.id })),
);
const filtered = computed(() =>
  productionStore.orders.filter((o) => {
    const matchStatus = !filterStatus.value || o.status === filterStatus.value;
    // An order is matched by either of its formulas.
    const matchFormula =
      !filterFormula.value ||
      o.semiFormulaId === filterFormula.value ||
      o.sauceFormulaId === filterFormula.value;
    return matchStatus && matchFormula;
  }),
);

function getFormula(id) {
  return productionStore.getFormulaById(id);
}
// The list read embeds both formulas, so prefer the store's copy and fall back
// to the id itself only when a formula has since been deleted.
function formulaName(id) {
  if (!id) return "—";
  return getFormula(id)?.name || "—";
}
function machineName(id) {
  const m = id && masterStore.getMachineById(id);
  return m ? `${m.name}${m.code ? ` (${m.code})` : ""}` : "ไม่ระบุเครื่องจักร";
}

// Mix sizes are owned by the formula, so resolve the label from its mixSizes.
function mixNameFor(formulaId, key) {
  const ms = getFormula(formulaId)?.mixSizes?.find((m) => m.key === key);
  if (ms) return ms.name;
  const mx = masterStore.getMixsizeById(key);
  if (mx) return `${mx.size.toLocaleString()} กก.`;
  return "—";
}

function mixsizeOptionsFor(formulaId) {
  const f = getFormula(formulaId);
  return (f?.mixSizes || []).map((ms) => ({ label: ms.name, value: ms.key }));
}
const sauceMixsizeOptions = computed(() => mixsizeOptionsFor(createForm.value.sauceFormulaId));
const semiMixsizeOptions = computed(() => mixsizeOptionsFor(createForm.value.semiFormulaId));

// How many lines the order would snapshot from that mix size — null while the
// pair is incomplete, so the caller can hide the line rather than show "0".
function ingredientCount(formulaId, mixsizeId) {
  if (!formulaId || !mixsizeId) return null;
  const bom = getFormula(formulaId)?.bomByMixsize?.[mixsizeId];
  if (bom) return (bom.premix?.length || 0) + (bom.ingredients?.length || 0);
  return getFormula(formulaId)?.ingredients?.length ?? null;
}
const sauceIngredientCount = computed(() =>
  ingredientCount(createForm.value.sauceFormulaId, createForm.value.sauceMixsizeId),
);
const semiIngredientCount = computed(() =>
  ingredientCount(createForm.value.semiFormulaId, createForm.value.semiMixsizeId),
);
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
  createForm.value = { ...emptyCreateForm(), planDate: todayISO() };
  showCreate.value = true;
}

// The formula list is shallow, so a chosen formula has to be fetched in full
// before its mix sizes exist to pick from.
async function hydrateFormula(id) {
  if (!id) return;
  const f = productionStore.getFormulaById(id);
  if (!f?.mixSizes?.length) await productionStore.fetchFormula(id).catch(() => {});
}
async function onSauceFormulaChange() {
  createForm.value.sauceMixsizeId = null;
  // Clearing the sauce formula clears the whole half: the API rejects a partial
  // sauce side, and a machine for a stage that no longer exists is meaningless.
  if (!createForm.value.sauceFormulaId) {
    createForm.value.sauceMachineId = null;
    return;
  }
  await hydrateFormula(createForm.value.sauceFormulaId);
  createForm.value.sauceMixsizeId = sauceMixsizeOptions.value[0]?.value ?? null;
}
async function onSemiFormulaChange() {
  createForm.value.semiMixsizeId = null;
  await hydrateFormula(createForm.value.semiFormulaId);
  createForm.value.semiMixsizeId = semiMixsizeOptions.value[0]?.value ?? null;
}

async function doCreate() {
  const f = createForm.value;
  const warn = (summary) => toast.add({ severity: "warn", summary, life: 3000 });
  if (!f.semiFormulaId) return warn("กรุณาเลือกสูตรแปรรูป (SEMI)");
  if (!f.semiMixsizeId) return warn("กรุณาเลือกขนาด Mix ของสูตรแปรรูป");
  // The sauce half is all-or-nothing on the API; say so here rather than let it
  // come back as a 400.
  if (f.sauceFormulaId && !f.sauceMixsizeId) return warn("กรุณาเลือกขนาด Mix ของสูตรซอส");
  if (!f.planDate) return warn("กรุณาเลือกวันที่ผลิต");

  saving.value = true;
  try {
    const payload = {
      semiFormulaId: f.semiFormulaId,
      semiMixSizeId: Number(f.semiMixsizeId),
      prodNo: generateProdNo(),
      planDate: f.planDate,
    };
    if (f.semiMachineId) payload.semiMachineId = f.semiMachineId;
    if (f.sauceFormulaId) {
      payload.sauceFormulaId = f.sauceFormulaId;
      payload.sauceMixSizeId = Number(f.sauceMixsizeId);
      if (f.sauceMachineId) payload.sauceMachineId = f.sauceMachineId;
    }
    const order = await productionStore.createOrder(payload);
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
/* The dialog mirrors the order: two numbered halves, then the date that applies
   to both. Boxing each half is what keeps three near-identical dropdown trios
   from reading as one long list. */
.stage-block {
  border: 1px solid var(--gl-border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stage-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stage-no {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gl-navy);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stage-title {
  font-size: 13px;
  font-weight: 700;
}
.stage-sub {
  font-size: 12px;
  color: var(--gl-text-subtle);
}
.stage-preview {
  font-size: 12px;
  color: var(--gl-text-muted);
}
.form-row-2 {
  display: flex;
  gap: 12px;
}
.form-row-2 .form-field {
  flex: 1;
  min-width: 0;
}
.mix-sub {
  font-size: 12px;
  color: var(--gl-text-subtle);
}

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
