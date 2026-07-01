<template>
  <div v-if="order">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px">
        <Button icon="pi pi-arrow-left" text rounded @click="router.push('/production/orders')" />
        <div>
          <div class="page-title">{{ order.docNo }}</div>
          <div class="page-subtitle">{{ formulaName }} — {{ order.plannedBatches }} Batch</div>
        </div>
      </div>
      <span :class="['po-badge', order.status]">{{ statusLabel(order.status) }}</span>
    </div>

    <!-- Stepper -->
    <div class="stepper-card">
      <div v-for="(step, i) in steps" :key="i" class="step-item">
        <div :class="['step-circle', stepState(i)]">
          <i v-if="stepState(i) === 'done'" class="pi pi-check" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div :class="['step-label', stepState(i)]">{{ step }}</div>
        <div v-if="i < steps.length - 1" :class="['step-line', stepState(i) === 'done' ? 'line-done' : '']" />
      </div>
    </div>

    <!-- ===== Step 1: ยืนยันวัตถุดิบ ===== -->
    <div v-if="order.status === 'confirmed'" class="page-card">
      <div class="section-title">
        วัตถุดิบที่ต้องใช้ ({{ order.plannedBatches }} Batch)
        <span class="hint">— ตามสูตร {{ formulaName }} (ตรวจสอบและยืนยัน)</span>
      </div>

      <!-- Premix table (read-only) -->
      <div class="tbl-head">
        <span class="tbl-title"><i class="pi pi-bolt" /> Premix</span>
      </div>
      <table class="edit-tbl">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>วัตถุดิบ (Premix)</th>
            <th style="width: 200px; text-align: right">ปริมาณ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in premixRows" :key="'pm' + idx">
            <td>{{ idx + 1 }}</td>
            <td>
              <div style="font-weight: 500">{{ nameOf(row.productId) }}</div>
              <div class="code-sub">{{ codeOf(row.productId) }}</div>
            </td>
            <td style="text-align: right"><strong>{{ row.qtyRequired.toLocaleString() }} {{ unitAbbrOf(row.productId) }}</strong></td>
          </tr>
          <tr v-if="premixRows.length === 0">
            <td colspan="3" class="empty-row">ไม่มี Premix ในสูตรนี้</td>
          </tr>
        </tbody>
      </table>

      <!-- Ingredient table (read-only) -->
      <div class="tbl-head" style="margin-top: 22px">
        <span class="tbl-title"><i class="pi pi-box" /> วัตถุดิบ (Ingredient)</span>
      </div>
      <table class="edit-tbl">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>วัตถุดิบ</th>
            <th style="width: 200px; text-align: right">ปริมาณ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in ingredientRows" :key="'ing' + idx">
            <td>{{ idx + 1 }}</td>
            <td>
              <div style="font-weight: 500">{{ nameOf(row.productId) }}</div>
              <div class="code-sub">{{ codeOf(row.productId) }}</div>
            </td>
            <td style="text-align: right"><strong>{{ row.qtyRequired.toLocaleString() }} {{ unitAbbrOf(row.productId) }}</strong></td>
          </tr>
          <tr v-if="ingredientRows.length === 0">
            <td colspan="3" class="empty-row">ไม่มีวัตถุดิบในสูตรนี้</td>
          </tr>
        </tbody>
      </table>

      <div class="action-bar">
        <Button label="ยกเลิกใบสั่งผลิต" text severity="danger" @click="doCancel" />
        <Button label="ยืนยัน → ผสม" icon="pi pi-play" class="btn-primary" @click="doStartProcessing" />
      </div>
    </div>

    <!-- ===== Step 2: ผสม (Mix) — 2 sub-steps ===== -->
    <div v-else-if="order.status === 'mixing'" class="page-card">
      <div class="section-title">ขั้นตอนผสม</div>
      <div class="substep-tabs">
        <button :class="['substep', mixSub === 'sauce' ? 'on' : '']" @click="mixSub = 'sauce'">
          <span class="substep-no">1</span> ผสม Premix → ซอส
        </button>
        <div class="substep-arrow"><i class="pi pi-angle-right" /></div>
        <button :class="['substep', mixSub === 'meat' ? 'on' : '']" @click="mixSub = 'meat'">
          <span class="substep-no">2</span> ผสมซอส + เนื้อแปรรูป
        </button>
      </div>

      <!-- Sub-step 1: Homo Mixer (สร้างซอส) -->
      <div v-show="mixSub === 'sauce'">
        <div class="sheet-title-bar">
          <div class="sheet-title">รายงานการผสมผลิตที่เครื่อง Homo Mixer</div>
          <Button label="ดาวน์โหลดเอกสาร" icon="pi pi-download" outlined size="small" class="dl-btn"
            @click="downloadMixReport('sauce')" />
        </div>
        <div class="sheet-head">
          <div class="form-field"><label>ชื่อสูตร (Name)</label><InputText v-model="sauce.name" disabled style="width: 220px" /></div>
          <div class="form-field"><label>รหัสสูตร (Code)</label><InputText v-model="sauce.code" disabled style="width: 150px" /></div>
          <div class="form-field"><label>Date</label><InputText v-model="sauce.date" type="date" style="width: 160px" /></div>
          <div class="form-field"><label>Mix size (kg)</label><InputNumber v-model="sauce.mixSize" :min="0" disabled style="width: 120px" /></div>
          <div class="form-field">
            <label>เครื่องจักร (Machine)</label>
            <Dropdown v-model="sauce.machineId" :options="homoMixerOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกเครื่องจักร" style="width: 220px" />
          </div>
        </div>

        <div class="mix-scroll">
          <table class="mix-sheet">
            <thead>
              <tr>
                <th class="no-col">ครั้งที่ Mix</th>
                <th v-for="c in sauce.columns" :key="c.key">
                  {{ c.label }}<div class="target" v-if="c.target != null">{{ c.target.toLocaleString() }} {{ c.unit }}</div>
                </th>
                <th class="end-col">End</th>
                <th class="act-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in sauce.rows" :key="idx">
                <td class="no-col">{{ idx + 1 }}</td>
                <td v-for="c in sauce.columns" :key="c.key">
                  <div
                    :class="['cell-time-btn', { locked: !!row.starts[c.key] }]"
                    @click.stop="togglePicker(`sauce-${idx}-${c.key}`, row, c.key, $event)"
                  >
                    <span>{{ row.starts[c.key] || '--:--' }}</span>
                    <i v-if="!row.starts[c.key]" class="pi pi-clock" />
                  </div>
                </td>
                <td>
                  <div
                    :class="['cell-time-btn', { 'has-value': !!row.end }]"
                    @click.stop="toggleEndPicker(`sauce-end-${idx}`, row, $event)"
                  >
                    <span>{{ row.end || '--:--' }}</span>
                    <i :class="row.end ? 'pi pi-pencil' : 'pi pi-clock'" />
                  </div>
                </td>
                <td class="act-col">
                  <button v-if="sauce.rows.length > 1" class="row-del" title="ลบรอบนี้" @click="sauce.rows.splice(idx, 1)">
                    <i class="pi pi-trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="add-round" @click="addSauceRow"><i class="pi pi-plus" /> เพิ่มรอบ Mix</button>
        <div class="action-bar">
          <Button label="ถัดไป → ผสมเนื้อ" icon="pi pi-arrow-right" class="btn-primary" @click="mixSub = 'meat'" />
        </div>
      </div>

      <!-- Sub-step 2: Ribbon Mixer (เนื้อ + ซอส) -->
      <div v-show="mixSub === 'meat'">
        <div class="sheet-title-bar">
          <div class="sheet-title">รายงานผสมผลิตภัณฑ์กันที่เครื่อง Ribbon Mixer</div>
          <Button label="ดาวน์โหลดเอกสาร" icon="pi pi-download" outlined size="small" class="dl-btn"
            @click="downloadMixReport('meat')" />
        </div>
        <div class="sheet-head">
          <div class="form-field"><label>ชื่อสูตร (Name)</label><InputText v-model="meat.name" disabled style="width: 220px" /></div>
          <div class="form-field"><label>Code</label><InputText v-model="meat.code" disabled style="width: 150px" /></div>
          <div class="form-field"><label>Date</label><InputText v-model="meat.date" type="date" style="width: 160px" /></div>
          <div class="form-field"><label>Mix size (kg)</label><InputNumber v-model="meat.mixSize" :min="0" disabled style="width: 120px" /></div>
          <div class="form-field">
            <label>เครื่องจักร (Machine)</label>
            <Dropdown v-model="meat.machineId" :options="ribbonMixerOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกเครื่องจักร" style="width: 220px" />
          </div>
        </div>

        <div class="mix-scroll">
          <table class="mix-sheet">
            <thead>
              <tr>
                <th class="no-col">ครั้งที่ Mix</th>
                <th v-for="c in meat.columns" :key="c.key">
                  {{ c.label }}<div class="target" v-if="c.target != null">{{ c.target.toLocaleString() }} {{ c.unit }}</div>
                </th>
                <th class="end-col">End</th>
                <th class="end-col">อุณหภูมิ</th>
                <th class="act-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in meat.rows" :key="idx">
                <td class="no-col">{{ idx + 1 }}</td>
                <td v-for="c in meat.columns" :key="c.key">
                  <div
                    :class="['cell-time-btn', { locked: !!row.starts[c.key] }]"
                    @click.stop="togglePicker(`meat-${idx}-${c.key}`, row, c.key, $event)"
                  >
                    <span>{{ row.starts[c.key] || '--:--' }}</span>
                    <i v-if="!row.starts[c.key]" class="pi pi-clock" />
                  </div>
                </td>
                <td>
                  <div
                    :class="['cell-time-btn', { 'has-value': !!row.end }]"
                    @click.stop="toggleEndPicker(`meat-end-${idx}`, row, $event)"
                  >
                    <span>{{ row.end || '--:--' }}</span>
                    <i :class="row.end ? 'pi pi-pencil' : 'pi pi-clock'" />
                  </div>
                </td>
                <td><input v-model.number="row.temp" type="number" step="0.1" class="cell-input" /></td>
                <td class="act-col">
                  <button v-if="meat.rows.length > 1" class="row-del" title="ลบรอบนี้" @click="meat.rows.splice(idx, 1)">
                    <i class="pi pi-trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="add-round" @click="addMeatRow"><i class="pi pi-plus" /> เพิ่มรอบ Mix</button>

        <div class="action-bar">
          <Button label="ย้อนกลับ" text icon="pi pi-arrow-left" @click="mixSub = 'sauce'" />
          <Button label="ผสมเสร็จ → รับเข้า Semi" icon="pi pi-arrow-right" class="btn-primary" @click="doCompleteMixing" />
        </div>
      </div>
    </div>

    <!-- ===== Step 3: รับเข้า Semi ===== -->
    <div v-else-if="order.status === 'receiving'" class="page-card">
      <div class="done-banner">
        <i class="pi pi-check-circle" style="font-size: 40px; color: #10b981" />
        <div>
          <div style="font-size: 18px; font-weight: 700; color: #166534">สำเร็จ</div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="ดำเนินการต่อ" icon="pi pi-arrow-right" class="btn-primary" @click="doReceiveSemi" />
      </div>
    </div>

    <!-- ===== Done ===== -->
    <div v-else-if="order.status === 'done'" class="page-card">
      <div class="done-banner">
        <i class="pi pi-check-circle" style="font-size: 40px; color: #10b981" />
        <div>
          <div style="font-size: 18px; font-weight: 700; color: #166534">เสร็จสิ้น</div>
          <div style="font-size: 13px; color: #4b7a5e">{{ formatDt(order.completedAt) }}</div>
        </div>
      </div>
      <div class="summary-grid">
        <div class="sum-card"><div class="sum-label">สูตรที่ใช้</div><div class="sum-val">{{ formulaName }}</div></div>
        <div class="sum-card"><div class="sum-label">จำนวน Batch</div><div class="sum-val">{{ order.plannedBatches }}</div></div>
        <div class="sum-card"><div class="sum-label">Semi Lot</div><div class="sum-val mono">{{ order.semiLot?.lotNo || "—" }}</div></div>
        <div class="sum-card highlight"><div class="sum-label">Semi เข้าคลัง</div><div class="sum-val big">{{ order.actualOutput?.toLocaleString() }} {{ formula?.outputUnit }}</div></div>
      </div>
    </div>

    <!-- Cancelled -->
    <div v-else-if="order.status === 'cancelled'" class="page-card cancelled-card">
      <i class="pi pi-times-circle" style="font-size: 36px; color: var(--gl-red)" />
      <div style="font-size: 16px; font-weight: 600; color: #7f1d1d">ใบสั่งผลิตถูกยกเลิก</div>
      <Button label="กลับไปรายการ" icon="pi pi-arrow-left" outlined @click="router.push('/production/orders')" />
    </div>
  </div>

  <div v-else class="page-card" style="text-align: center; padding: 40px; color: var(--gl-text-muted)">
    ไม่พบใบสั่งผลิต
  </div>

  <!-- Time picker dropdown (teleported to body to escape table overflow) -->
  <Teleport to="body">
    <div
      v-if="openPickerId"
      class="time-drop"
      :style="{ top: pickerPos.top + 'px', left: pickerPos.left + 'px' }"
      @click.stop
    >
      <div class="td-label">เวลาปัจจุบัน</div>
      <div class="td-time">{{ liveTime }}</div>
      <button class="td-save-btn" @click="saveTime">
        <i class="pi pi-check" /> บันทึก
      </button>
      <template v-if="pickerMode === 'end'">
        <div class="td-divider">หรือเลือกเวลา</div>
        <div class="td-manual">
          <input v-model="manualEndTime" type="time" class="td-time-input" @click.stop />
          <button class="td-confirm-btn" @click="saveManualTime">
            <i class="pi pi-check" /> ยืนยัน
          </button>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup>
import { useMasterStore } from "@/stores/master";
import { useProductionStore } from "@/stores/production";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const productionStore = useProductionStore();
const masterStore = useMasterStore();

const order = computed(() => productionStore.orders.find((o) => o.id === route.params.id));
const formula = computed(() => (order.value ? productionStore.getFormulaById(order.value.formulaId) : null));
const formulaName = computed(() => formula.value?.name || "—");

const steps = ["ยืนยันวัตถุดิบ", "ผสม", "สำเร็จ"];
const stepIndex = computed(
  () => ({ confirmed: 0, mixing: 1, receiving: 2, done: 3 })[order.value?.status] ?? 0,
);

function stepState(i) {
  const cur = stepIndex.value;
  if (i < cur) return "done";
  if (i === cur) return "active";
  return "pending";
}

// ---- product helpers ----
function isPremix(productId) {
  return masterStore.getProductById(productId)?.categoryId === "CAT11";
}
function nameOf(id) { return masterStore.getProductById(id)?.name || "—"; }
function codeOf(id) { return masterStore.getProductById(id)?.code || "—"; }
function unitAbbrOf(id) {
  const p = masterStore.getProductById(id);
  return masterStore.getUnitById(p?.unitId)?.abbr || "";
}

// ---- machine options ----
const machineOptionsByType = (type) =>
  masterStore.machines
    .filter((m) => m.isActive && m.type === type)
    .map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }));
const homoMixerOptions = computed(() => machineOptionsByType("HOMO_MIXER"));
const ribbonMixerOptions = computed(() => machineOptionsByType("RIBBON_MIXER"));

// ---- Step 1: confirm (editable) ----
const premixRows = ref([]);
const ingredientRows = ref([]);
function initConfirm() {
  premixRows.value = [];
  ingredientRows.value = [];
  for (const i of order.value?.ingredients || []) {
    const row = { productId: i.productId, qtyRequired: i.qtyRequired };
    if (isPremix(i.productId)) premixRows.value.push(row);
    else ingredientRows.value.push(row);
  }
}

// ---- Step 2: mix ----
const mixSub = ref("sauce");
const sauce = reactive({ name: "", code: "", date: "", mixSize: 50, machineId: null, columns: [], rows: [] });
const meat = reactive({ name: "", code: "", date: "", mixSize: 0, machineId: null, columns: [], rows: [] });

function makeSauceRow() {
  return {
    starts: Object.fromEntries(sauce.columns.map((c) => [c.key, ""])),
    end: "",
  };
}
function makeMeatRow() {
  return {
    starts: Object.fromEntries(meat.columns.map((c) => [c.key, ""])),
    end: "",
    temp: null,
  };
}
function addSauceRow() { sauce.rows.push(makeSauceRow()); }
function addMeatRow() { meat.rows.push(makeMeatRow()); }

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---- time picker dropdown ----
const openPickerId = ref(null);
const liveTime = ref('');
const pickerPos = reactive({ top: 0, left: 0 });
const pickerMode = ref('start'); // 'start' | 'end'
const manualEndTime = ref('');
let liveTimer = null;
let _activeRow = null;
let _activeKey = null;

function _openPicker(id, event) {
  const rect = event.currentTarget.getBoundingClientRect();
  pickerPos.top = rect.bottom + 6;
  pickerPos.left = rect.left + rect.width / 2;
  openPickerId.value = id;
  liveTime.value = nowHHMM();
  liveTimer = setInterval(() => { liveTime.value = nowHHMM(); }, 1000);
}

function togglePicker(id, row, key, event) {
  if (row.starts[key]) return; // already locked, ignore
  if (openPickerId.value === id) { closePicker(); return; }
  _activeRow = row;
  _activeKey = key;
  pickerMode.value = 'start';
  _openPicker(id, event);
}

function toggleEndPicker(id, row, event) {
  if (openPickerId.value === id) { closePicker(); return; }
  _activeRow = row;
  _activeKey = 'end';
  pickerMode.value = 'end';
  manualEndTime.value = row.end || '';
  _openPicker(id, event);
}

function closePicker() {
  openPickerId.value = null;
  liveTime.value = '';
  pickerMode.value = 'start';
  manualEndTime.value = '';
  _activeRow = null;
  _activeKey = null;
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
}

function saveTime() {
  if (_activeRow) {
    if (pickerMode.value === 'end') _activeRow.end = nowHHMM();
    else if (_activeKey) _activeRow.starts[_activeKey] = nowHHMM();
  }
  closePicker();
}

function saveManualTime() {
  if (_activeRow && manualEndTime.value) _activeRow.end = manualEndTime.value;
  closePicker();
}

onMounted(() => document.addEventListener('click', closePicker));
onUnmounted(() => { document.removeEventListener('click', closePicker); closePicker(); });

onMounted(() => {
  if (!masterStore.products.length) masterStore.fetchProducts();
  if (!masterStore.units.length) masterStore.fetchUnits();
  if (!masterStore.machines.length) masterStore.fetchMachines();
});

function initMix() {
  if (!order.value) return;
  const ings = order.value.ingredients;
  const premixIngs = ings.filter((i) => isPremix(i.productId));
  const meatIngs = ings.filter((i) => !isPremix(i.productId));
  const saved = order.value.mixData;

  // base soft-water amount (a part of premix) — shown like Premix targets
  const baseWater = saved?.sauce?.mixSize ?? 50;

  // sauce columns: base liquid + each premix
  const sCols = [{ key: "base", label: "น้ำ soft", target: baseWater, unit: "kg" }];
  premixIngs.forEach((i, idx) =>
    sCols.push({ key: "p" + idx, label: nameOf(i.productId), target: i.qtyRequired, unit: unitAbbrOf(i.productId) }),
  );

  // sauce form
  sauce.name = saved?.sauce?.name ?? formula.value?.name ?? "";
  sauce.code = saved?.sauce?.code ?? formula.value?.code ?? "";
  sauce.date = saved?.sauce?.date ?? todayStr();
  sauce.mixSize = saved?.sauce?.mixSize ?? 50;
  sauce.machineId = saved?.sauce?.machineId ?? homoMixerOptions.value[0]?.value ?? null;
  sauce.columns = saved?.sauce?.columns ?? sCols;
  sauce.rows = saved?.sauce?.rows ?? [makeSauceRow()];

  // meat columns: each non-premix ingredient
  const mCols = meatIngs.map((i, idx) => ({
    key: "m" + idx, label: nameOf(i.productId), target: i.qtyRequired, unit: unitAbbrOf(i.productId),
  }));

  // meat form
  meat.name = saved?.meat?.name ?? formula.value?.name ?? "";
  meat.code = saved?.meat?.code ?? formula.value?.code ?? "";
  meat.date = saved?.meat?.date ?? todayStr();
  meat.mixSize = saved?.meat?.mixSize ?? (formula.value?.outputQtyPerBatch ?? 0);
  meat.machineId = saved?.meat?.machineId ?? ribbonMixerOptions.value[0]?.value ?? null;
  meat.columns = saved?.meat?.columns ?? mCols;
  meat.rows = saved?.meat?.rows ?? [makeMeatRow()];
  mixSub.value = "sauce";
}

// re-init local state whenever the active step changes
watch(
  () => [order.value?.id, order.value?.status],
  () => {
    const s = order.value?.status;
    if (s === "confirmed") initConfirm();
    else if (s === "mixing") initMix();
  },
  { immediate: true },
);

// ---- labels ----
function statusLabel(s) {
  return {
    confirmed: "ยืนยันแล้ว", processing: "กำลังแปรรูป", mixing: "กำลังผสม",
    packing: "กำลังบรรจุ", receiving: "สำเร็จ", done: "เสร็จสิ้น", cancelled: "ยกเลิก",
  }[s] || s;
}
function formatDt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

// ---- actions ----
function doCancel() {
  confirm.require({
    message: "ต้องการยกเลิกใบสั่งผลิตนี้ใช่หรือไม่?",
    header: "ยืนยันการยกเลิก",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => {
      productionStore.cancelOrder(order.value.id);
      toast.add({ severity: "info", summary: "ยกเลิกแล้ว", life: 3000 });
    },
  });
}

function doStartProcessing() {
  const list = [...premixRows.value, ...ingredientRows.value].filter((r) => r.productId && r.qtyRequired > 0);
  if (!list.length) {
    toast.add({ severity: "warn", summary: "กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ", life: 3000 });
    return;
  }
  productionStore.setIngredients(order.value.id, list);
  productionStore.startProcessing(order.value.id);
  toast.add({ severity: "success", summary: "ยืนยันวัตถุดิบแล้ว", detail: "ดำเนินการผสมต่อไป", life: 3000 });
}

function doCompleteMixing() {
  productionStore.completeMixing(order.value.id, {
    sauce: { name: sauce.name, code: sauce.code, date: sauce.date, mixSize: sauce.mixSize,
      machineId: sauce.machineId, columns: sauce.columns, rows: sauce.rows },
    meat: { name: meat.name, code: meat.code, date: meat.date, mixSize: meat.mixSize,
      machineId: meat.machineId, columns: meat.columns, rows: meat.rows },
  });
  toast.add({ severity: "success", summary: "ผสมเสร็จแล้ว", detail: "ไปขั้นตอนรับเข้า Semi", life: 3000 });
}

function machineLabel(id) {
  const m = masterStore.getMachineById(id);
  return m ? `${m.code} — ${m.name}` : "—";
}

function downloadMixReport(type) {
  const sheet = type === "meat" ? meat : sauce;
  const title =
    type === "meat"
      ? "รายงานผสมผลิตภัณฑ์กันที่เครื่อง Ribbon Mixer"
      : "รายงานการผสมผลิตที่เครื่อง Homo Mixer";
  const esc = (v) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const cols = sheet.columns || [];
  const isMeat = type === "meat";

  const headCells = [
    "ครั้งที่ Mix",
    ...cols.map((c) => esc(c.label) + (c.target != null ? ` (${c.target} ${esc(c.unit)})` : "")),
    "End",
    ...(isMeat ? ["อุณหภูมิ"] : []),
  ];
  const bodyRows = (sheet.rows || []).map((r, i) => {
    const ingCells = cols.map((c) => `<td>${esc(r.starts?.[c.key])}</td>`);
    const cells = [
      `<td class="no">${i + 1}</td>`,
      ...ingCells,
      `<td>${esc(r.end)}</td>`,
      ...(isMeat ? [`<td>${esc(r.temp)}</td>`] : []),
    ];
    return `<tr>${cells.join("")}</tr>`;
  });

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<title>${esc(title)} — ${esc(order.value?.docNo || "")}</title>
<style>
  body { font-family: 'Kanit', 'Sarabun', sans-serif; color: #1e2a3b; padding: 28px; }
  h1 { text-align: center; font-size: 18px; border-bottom: 2px solid #1e2a3b; padding-bottom: 10px; }
  .meta { display: flex; flex-wrap: wrap; gap: 18px 32px; margin: 16px 0 20px; font-size: 13px; }
  .meta b { display: block; color: #64748b; font-weight: 500; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1e2a3b; color: #fff; padding: 8px; text-align: center; }
  td { border: 1px solid #e2e8f0; padding: 7px 8px; text-align: center; }
  td.no { background: #f8fafc; font-weight: 700; }
  .foot { margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: right; }
</style></head><body>
<h1>${esc(title)}</h1>
<div class="meta">
  <div><b>เลขที่ใบสั่งผลิต</b>${esc(order.value?.docNo || "—")}</div>
  <div><b>ชื่อสูตร (Name)</b>${esc(sheet.name || "—")}</div>
  <div><b>Code</b>${esc(sheet.code || "—")}</div>
  <div><b>Date</b>${esc(sheet.date || "—")}</div>
  <div><b>Mix size (kg)</b>${esc(sheet.mixSize ?? "—")}</div>
  <div><b>เครื่องจักร (Machine)</b>${esc(machineLabel(sheet.machineId))}</div>
</div>
<table>
  <thead><tr>${headCells.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${bodyRows.join("")}</tbody>
</table>
<div class="foot">พิมพ์เมื่อ ${new Date().toLocaleString("th-TH")}</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.value?.docNo || "mix"}-${type === "meat" ? "ribbon-mixer" : "homo-mixer"}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.add({ severity: "success", summary: "ดาวน์โหลดเอกสารแล้ว", life: 2500 });
}

function doReceiveSemi() {
  productionStore.receiveSemi(order.value.id);
  toast.add({
    severity: "success", summary: "รับ Semi เข้าคลังสำเร็จ!",
    detail: `${order.value?.actualOutput?.toLocaleString()} ${formula.value?.outputUnit}`, life: 4000,
  });
  router.push("/production/orders");
}
</script>

<style scoped>
.stepper-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 20px 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}
.step-item { display: flex; align-items: center; }
.step-circle {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  border: 2px solid #e2e8f0; background: #f8fafc; color: #94a3b8; flex-shrink: 0;
}
.step-circle.done { background: #10b981; border-color: #10b981; color: #fff; }
.step-circle.active { background: #1e2a3b; border-color: #1e2a3b; color: #fff; }
.step-label { font-size: 12px; font-weight: 500; margin-left: 8px; white-space: nowrap; color: #94a3b8; }
.step-label.done { color: #10b981; }
.step-label.active { color: #1e2a3b; font-weight: 700; }
.step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 16px; min-width: 24px; }
.step-line.line-done { background: #10b981; }
.section-title { font-size: 14px; font-weight: 700; color: #1e2a3b; margin-bottom: 14px; }
.section-title .hint { font-weight: 400; color: var(--gl-text-muted); font-size: 12px; }
.action-bar {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;
}

/* editable tables */
.tbl-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tbl-title { font-size: 13px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 6px; }
.tbl-title i { color: #84cc16; }
.edit-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.edit-tbl th {
  background: #1e2a3b; color: #fff; font-size: 12px; font-weight: 600;
  padding: 8px 10px; text-align: left;
}
.edit-tbl td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.edit-tbl tbody tr:nth-child(even) { background: #fafbfc; }
.qty-cell { display: flex; align-items: center; gap: 6px; }
.qty-cell .unit { color: var(--gl-text-muted); font-size: 12px; }
.empty-row { text-align: center; color: var(--gl-text-muted); padding: 16px; font-style: italic; }
.code-sub { font-size: 11px; color: var(--gl-text-muted); font-family: monospace; }
.lot-chip {
  display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px;
  font-family: monospace; padding: 2px 7px; border-radius: 4px; margin: 0 4px 4px 0;
}

/* sub-step tabs */
.substep-tabs { display: flex; align-items: center; gap: 4px; margin-bottom: 18px; }
.substep {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b;
  padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
}
.substep.on { background: #1e2a3b; border-color: #1e2a3b; color: #fff; }
.substep-no {
  width: 22px; height: 22px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.substep:not(.on) .substep-no { background: #cbd5e1; color: #fff; }
.substep-arrow { color: #cbd5e1; }

/* mixer sheet */
.sheet-title {
  font-size: 14px; font-weight: 700; text-align: center; color: #1e2a3b;
  margin: 4px 0 14px; padding-bottom: 8px; border-bottom: 2px solid #1e2a3b;
}
.sheet-title-bar { position: relative; }
.sheet-title-bar .sheet-title { margin-right: 0; }
.sheet-title-bar .dl-btn { position: absolute; right: 0; top: -2px; }
.sheet-head { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 18px; }
.sheet-head :deep(.p-inputtext),
.sheet-head :deep(.p-inputnumber),
.sheet-head :deep(.p-inputnumber-input),
.sheet-head :deep(.p-dropdown) { height: 42px; }
.sheet-head :deep(.p-inputnumber-input) { width: 100%; }
.sheet-head :deep(.p-dropdown) { display: inline-flex; align-items: center; }

/* ===== modern mix data-grid ===== */
.mix-scroll {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.mix-sheet { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }

/* header band */
.mix-sheet thead th {
  background: #1e2a3b; color: #fff; font-weight: 600; font-size: 12px;
  padding: 13px 10px; text-align: center; min-width: 112px; white-space: nowrap;
}
.mix-sheet thead th:not(:last-child) { border-right: 1px solid rgba(255, 255, 255, 0.08); }
.mix-sheet .target {
  display: inline-block; margin-top: 5px; font-size: 10.5px; font-weight: 600;
  color: #fcd34d; background: rgba(251, 191, 36, 0.14); padding: 1px 9px; border-radius: 999px;
}

/* body */
.mix-sheet tbody td { padding: 0; text-align: center; border-bottom: 1px solid #eef2f6; }
.mix-sheet tbody td:not(:last-child) { border-right: 1px solid #f3f6f9; }
.mix-sheet tbody tr:hover td { background: #fafdf5; }

/* shared column sizing */
.mix-sheet .no-col { width: 100px; min-width: 100px; }
.mix-sheet .end-col { width: 110px; }
.mix-sheet .act-col { width: 52px; min-width: 52px; }

/* round-number column */
.mix-sheet tbody .no-col { background: #f8fafc; font-weight: 700; color: #475569; border-right: 1px solid #e2e8f0; }

/* in-cell number inputs */
.cell-input {
  width: 100%; box-sizing: border-box; border: 1.5px solid transparent; background: transparent;
  text-align: center; font-size: 13px; padding: 13px 8px; outline: none; color: #1e2a3b;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
  -moz-appearance: textfield;
}
.cell-input::-webkit-outer-spin-button, .cell-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.cell-input::placeholder { color: #cbd5e1; }
.cell-input:hover { background: #f1f5f9; }
.cell-input:focus {
  background: #fff; border-color: #84cc16;
  box-shadow: inset 0 0 0 3px rgba(132, 204, 22, 0.13); border-radius: 8px;
}
/* start-time cell trigger */
.cell-time-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; padding: 13px 8px; cursor: pointer;
  font-size: 13px; color: #94a3b8; user-select: none; transition: background 0.12s;
}
.cell-time-btn:hover { background: #f8fafc; }
.cell-time-btn .pi-clock { font-size: 11px; }
.cell-time-btn.locked {
  color: #166534; font-weight: 700; background: #f0fdf4; cursor: default;
}
.cell-time-btn.locked:hover { background: #f0fdf4; }
.cell-time-btn.has-value {
  color: #166534; font-weight: 700; background: #f0fdf4;
}
.cell-time-btn.has-value:hover { background: #dcfce7; }
.cell-time-btn.has-value .pi-pencil { font-size: 10px; opacity: 0.55; }

/* row delete (reveals on hover) */
.mix-sheet tbody .act-col { background: #fff; }
.row-del {
  width: 30px; height: 30px; border: none; border-radius: 8px; cursor: pointer;
  background: transparent; color: #d1d9e2; display: inline-flex; align-items: center;
  justify-content: center; font-size: 13px; transition: background 0.12s, color 0.12s;
}
.mix-sheet tbody tr:hover .row-del { color: #f87171; }
.row-del:hover { background: #fef2f2; color: #dc2626; }

/* add-row affordance */
.add-round {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
  padding: 9px 16px; border: 1.5px dashed #cbd5e1; border-radius: 10px; background: #fff;
  color: #475569; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: border-color 0.14s, color 0.14s, background 0.14s;
}
.add-round:hover { border-color: #84cc16; color: #4d7c0f; background: #f7fee7; }


/* form grid — prevents field overlap, inputs fill their cell */
.field-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-top: 10px;
}
.field-grid .p-inputnumber,
.field-grid .p-inputtext,
.field-grid .w-full { width: 100%; }
.native-date {
  width: 100%; box-sizing: border-box; height: 42px; padding: 0 12px;
  border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
  color: #1e2a3b; background: #fff; font-family: inherit;
}
.native-date:focus { outline: none; border-color: #84cc16; box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.2); }

/* shared */
.shortage-warn {
  margin-top: 12px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 8px; font-size: 13px; color: #991b1b;
}
.text-danger { color: var(--gl-red); font-weight: 600; }
.text-ok { color: #166534; }
.info-box { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; }
.info-box.amber { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.info-box.orange { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
.info-box.green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.info-box i { font-size: 28px; flex-shrink: 0; }
.info-label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
.info-row { display: flex; gap: 8px; margin-bottom: 3px; }
.info-row span { color: inherit; opacity: 0.7; min-width: 70px; }
.sub-card { background: #f8fafc; border-radius: 10px; padding: 16px 20px; }
.inline-fields { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 500; }
.req { color: var(--gl-red); }
.done-banner { display: flex; align-items: center; gap: 16px; padding: 20px; background: #f0fdf4; border-radius: 10px; margin-bottom: 20px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.sum-card { background: #f8fafc; border-radius: 8px; padding: 14px 16px; }
.sum-card.highlight { background: #dcfce7; }
.sum-label { font-size: 11px; color: var(--gl-text-muted); margin-bottom: 4px; }
.sum-val { font-size: 15px; font-weight: 700; color: #1e2a3b; }
.sum-val.mono { font-family: monospace; font-size: 12px; }
.sum-val.big { font-size: 20px; color: #166534; }
.cancelled-card { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; text-align: center; }
.po-badge { display: inline-block; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.po-badge.confirmed { background: #dbeafe; color: #1d4ed8; }
.po-badge.processing { background: #ffedd5; color: #c2410c; }
.po-badge.mixing { background: #fef3c7; color: #b45309; }
.po-badge.packing { background: #ede9fe; color: #6d28d9; }
.po-badge.receiving { background: #cffafe; color: #0e7490; }
.po-badge.done { background: #dcfce7; color: #166534; }
.po-badge.cancelled { background: #fee2e2; color: #991b1b; }
</style>

<style>
/* Teleported time-picker dropdown — global so it escapes scoped */
.time-drop {
  position: fixed;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14);
  padding: 18px 22px;
  z-index: 9999;
  min-width: 180px;
  text-align: center;
}
.td-label {
  font-size: 11px; color: #64748b; font-weight: 600;
  letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 8px;
}
.td-time {
  font-size: 34px; font-weight: 800; color: #1e2a3b;
  letter-spacing: 4px; margin-bottom: 16px;
  font-family: 'Courier New', monospace;
}
.td-save-btn {
  width: 100%; padding: 10px 14px;
  background: #1e2a3b; color: #fff;
  border: none; border-radius: 9px; cursor: pointer;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: background 0.12s;
}
.td-save-btn:hover { background: #0f172a; }
.td-divider {
  font-size: 11px; color: #94a3b8; margin: 14px 0 10px;
  display: flex; align-items: center; gap: 8px;
}
.td-divider::before, .td-divider::after {
  content: ''; flex: 1; height: 1px; background: #e2e8f0;
}
.td-manual { display: flex; gap: 8px; align-items: center; }
.td-time-input {
  flex: 1; height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  padding: 0 8px; font-size: 14px; color: #1e2a3b; outline: none; font-family: inherit;
  min-width: 0;
}
.td-time-input:focus { border-color: #84cc16; box-shadow: 0 0 0 2px rgba(132,204,22,0.15); }
.td-confirm-btn {
  height: 36px; padding: 0 12px; background: #64748b; color: #fff;
  border: none; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; gap: 5px; white-space: nowrap;
  transition: background 0.12s; flex-shrink: 0;
}
.td-confirm-btn:hover { background: #475569; }
</style>
