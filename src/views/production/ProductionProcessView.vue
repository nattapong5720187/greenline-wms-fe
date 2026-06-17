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
        <span class="hint">— แก้ไขปริมาณ / เพิ่ม / ลบ รายการได้</span>
      </div>

      <!-- Premix table -->
      <div class="tbl-head">
        <span class="tbl-title"><i class="pi pi-bolt" /> Premix</span>
        <Button label="เพิ่ม Premix" icon="pi pi-plus" text size="small" @click="addRow(premixRows, true)" />
      </div>
      <table class="edit-tbl">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>วัตถุดิบ (Premix)</th>
            <th style="width: 200px">ปริมาณ</th>
            <th style="width: 48px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in premixRows" :key="'pm' + idx">
            <td>{{ idx + 1 }}</td>
            <td>
              <Dropdown
                v-model="row.productId"
                :options="premixProductOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="เลือก Premix"
                style="width: 100%"
              />
            </td>
            <td>
              <div class="qty-cell">
                <InputNumber v-model="row.qtyRequired" :min="0" :maxFractionDigits="3" inputStyle="width:120px" />
                <span class="unit">{{ unitAbbrOf(row.productId) }}</span>
              </div>
            </td>
            <td><Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="premixRows.splice(idx, 1)" /></td>
          </tr>
          <tr v-if="premixRows.length === 0">
            <td colspan="4" class="empty-row">ไม่มี Premix — กด "เพิ่ม Premix"</td>
          </tr>
        </tbody>
      </table>

      <!-- Ingredient table -->
      <div class="tbl-head" style="margin-top: 22px">
        <span class="tbl-title"><i class="pi pi-box" /> วัตถุดิบ (Ingredient)</span>
        <Button label="เพิ่มวัตถุดิบ" icon="pi pi-plus" text size="small" @click="addRow(ingredientRows, false)" />
      </div>
      <table class="edit-tbl">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>วัตถุดิบ</th>
            <th style="width: 200px">ปริมาณ</th>
            <th style="width: 48px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in ingredientRows" :key="'ing' + idx">
            <td>{{ idx + 1 }}</td>
            <td>
              <Dropdown
                v-model="row.productId"
                :options="ingredientProductOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="เลือกวัตถุดิบ"
                style="width: 100%"
              />
            </td>
            <td>
              <div class="qty-cell">
                <InputNumber v-model="row.qtyRequired" :min="0" :maxFractionDigits="3" inputStyle="width:120px" />
                <span class="unit">{{ unitAbbrOf(row.productId) }}</span>
              </div>
            </td>
            <td><Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="ingredientRows.splice(idx, 1)" /></td>
          </tr>
          <tr v-if="ingredientRows.length === 0">
            <td colspan="4" class="empty-row">ไม่มีวัตถุดิบ — กด "เพิ่มวัตถุดิบ"</td>
          </tr>
        </tbody>
      </table>

      <div class="action-bar">
        <Button label="ยกเลิกใบสั่งผลิต" text severity="danger" @click="doCancel" />
        <Button label="ยืนยัน → แปรรูป" icon="pi pi-play" class="btn-primary" @click="doStartProcessing" />
      </div>
    </div>

    <!-- ===== Step 2: แปรรูป (Process) ===== -->
    <div v-else-if="order.status === 'processing'" class="page-card">
      <div class="section-title">ขั้นตอนแปรรูป (เตรียมเนื้อ)</div>
      <div class="info-box orange">
        <i class="pi pi-sync" />
        <div>
          <div style="font-weight: 600; font-size: 15px">กำลังแปรรูป</div>
          <div style="font-size: 13px; color: #9a3412">บันทึกปริมาณเนื้อที่แปรรูปได้</div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 16px">วัตถุดิบที่ใช้</div>
      <table class="edit-tbl">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>วัตถุดิบ</th>
            <th style="width: 160px; text-align: right">ปริมาณที่ใช้</th>
            <th>Lot ที่ใช้ (FIFO)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ing, idx) in order.ingredients" :key="ing.productId">
            <td>{{ idx + 1 }}</td>
            <td>
              <div style="font-weight: 500">{{ nameOf(ing.productId) }}</div>
              <div class="code-sub">{{ codeOf(ing.productId) }}</div>
            </td>
            <td style="text-align: right"><strong>{{ ing.qtyRequired.toLocaleString() }} {{ unitAbbrOf(ing.productId) }}</strong></td>
            <td>
              <span v-if="!ing.lotAssignments.length" class="code-sub">—</span>
              <span v-for="la in ing.lotAssignments" :key="la.lotId" class="lot-chip">{{ la.lotNo }} ({{ la.qty }})</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="sub-card" style="margin-top: 16px">
        <div class="section-title" style="margin: 0 0 12px">บันทึกผลแปรรูป</div>
        <div class="field-grid">
          <div class="form-field">
            <label>ปริมาณเนื้อที่แปรรูปได้ (kg) <span class="req">*</span></label>
            <InputNumber v-model="processQty" :min="0" :maxFractionDigits="2" inputClass="w-full" />
          </div>
          <div class="form-field">
            <label>อุณหภูมิเนื้อ (°C)</label>
            <InputNumber v-model="processTemp" :maxFractionDigits="1" inputClass="w-full" />
          </div>
          <div class="form-field" style="grid-column: span 2">
            <label>หมายเหตุ</label>
            <InputText v-model="processNote" placeholder="บันทึกเพิ่มเติม" />
          </div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="แปรรูปเสร็จ → ผสม" icon="pi pi-arrow-right" class="btn-primary" @click="doCompleteProcessing" />
      </div>
    </div>

    <!-- ===== Step 3: ผสม (Mix) — 2 sub-steps ===== -->
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
        <div class="sheet-title">รายงานการผสมผลิตที่เครื่อง Homo Mixer</div>
        <div class="sheet-head">
          <div class="form-field"><label>ชื่อสูตร (Name)</label><InputText v-model="sauce.name" style="width: 220px" /></div>
          <div class="form-field"><label>รหัสสูตร (Code)</label><InputText v-model="sauce.code" style="width: 150px" /></div>
          <div class="form-field"><label>Date</label><InputText v-model="sauce.date" type="date" style="width: 160px" /></div>
          <div class="form-field"><label>Mix size (kg)</label><InputNumber v-model="sauce.mixSize" :min="0" style="width: 120px" /></div>
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
                  <input v-model.number="row.values[c.key]" type="number" step="0.01" class="cell-input" />
                </td>
                <td><input v-model.number="row.end" type="number" step="0.01" class="cell-input" /></td>
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
        <div class="sheet-title">รายงานผสมผลิตภัณฑ์กันที่เครื่อง Ribbon Mixer</div>
        <div class="sheet-head">
          <div class="form-field"><label>ชื่อสูตร (Name)</label><InputText v-model="meat.name" style="width: 220px" /></div>
          <div class="form-field"><label>Code</label><InputText v-model="meat.code" style="width: 150px" /></div>
          <div class="form-field"><label>Date</label><InputText v-model="meat.date" type="date" style="width: 160px" /></div>
          <div class="form-field"><label>Mix size (kg)</label><InputNumber v-model="meat.mixSize" :min="0" style="width: 120px" /></div>
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
                  <input v-model.number="row.values[c.key]" type="number" step="0.01" class="cell-input" />
                </td>
                <td><input v-model.number="row.end" type="number" step="0.01" class="cell-input" /></td>
                <td><input v-model.number="row.temp" type="number" step="0.1" class="cell-input" /></td>
                <td class="act-col">
                  <button v-if="meat.rows.length > 1" class="row-del" title="ลบรอบนี้" @click="meat.rows.splice(idx, 1)">
                    <i class="pi pi-trash" />
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="no-col">Total</td>
                <td v-for="c in meat.columns" :key="c.key">
                  <input v-model.number="meat.totals[c.key]" type="number" step="0.01" class="cell-input" />
                </td>
                <td><input v-model.number="meat.totals.end" type="number" step="0.01" class="cell-input" /></td>
                <td class="hatch"></td>
                <td class="act-col"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button class="add-round" @click="addMeatRow"><i class="pi pi-plus" /> เพิ่มรอบ Mix</button>

        <div class="sub-card" style="margin-top: 16px">
          <div class="section-title" style="margin: 0 0 12px">ข้อมูลเพิ่มเติม</div>
          <div class="meat-extra">
            <div class="form-field"><label>ปริมาณ Topping</label><InputText v-model="meat.extra.topping" style="width: 100%" /></div>
            <div class="form-field"><label>อุณหภูมิถุงแรก (°C)</label><InputNumber v-model="meat.extra.tempFirst" :maxFractionDigits="1" style="width: 100%" /></div>
            <div class="form-field"><label>อุณหภูมิถุงสุดท้าย (°C)</label><InputNumber v-model="meat.extra.tempLast" :maxFractionDigits="1" style="width: 100%" /></div>
            <div class="form-field"><label>บรรจุภัณฑ์ : รับเข้า</label><InputNumber v-model="meat.extra.packReceive" :min="0" style="width: 100%" /></div>
            <div class="form-field"><label>ยอดรวมของดี</label><InputNumber v-model="meat.extra.totalCount" :min="0" style="width: 100%" /></div>
            <div class="form-field"><label>ของเสีย</label><InputNumber v-model="meat.extra.defect" :min="0" style="width: 100%" /></div>
            <div class="form-field"><label>รูปแบบการ ink code</label><InputText v-model="meat.extra.inkCode" style="width: 100%" /></div>
            <div class="form-field"><label>เวลาเข้า Retort</label><InputText v-model="meat.extra.retortTime" type="time" style="width: 100%" /></div>
          </div>
        </div>
        <div class="action-bar">
          <Button label="ย้อนกลับ" text icon="pi pi-arrow-left" @click="mixSub = 'sauce'" />
          <Button label="ผสมเสร็จ → บรรจุ" icon="pi pi-arrow-right" class="btn-primary" @click="doCompleteMixing" />
        </div>
      </div>
    </div>

    <!-- ===== Step 4: บรรจุ (Filling) ===== -->
    <div v-else-if="order.status === 'packing'" class="page-card">
      <div class="section-title">บรรจุ (เนื้อ + ซอส → แพ็กเกจ)</div>
      <div class="info-box green">
        <i class="pi pi-box" />
        <div>
          <div style="font-weight: 600; font-size: 15px">บรรจุลงแพ็กเกจ → Semi</div>
          <div style="font-size: 13px; color: #166534">นำเนื้อผสมซอสบรรจุลงบรรจุภัณฑ์ แล้วบันทึกปริมาณ Semi ที่ได้</div>
        </div>
      </div>
      <div class="sub-card">
        <div class="section-title" style="margin: 0 0 12px">บันทึก Semi ที่บรรจุได้</div>
        <div class="field-grid">
          <div class="form-field">
            <label>ปริมาณ Semi ({{ formula?.outputUnit || "หน่วย" }}) <span class="req">*</span></label>
            <InputNumber v-model="fillSemiQty" :min="0" inputClass="w-full" />
          </div>
          <div class="form-field">
            <label>จำนวนแพ็ก</label>
            <InputNumber v-model="fillPackCount" :min="0" inputClass="w-full" />
          </div>
          <div class="form-field">
            <label>วันหมดอายุ</label>
            <input v-model="fillExpiry" type="date" class="native-date" />
          </div>
          <div class="form-field">
            <label>หมายเหตุ</label>
            <InputText v-model="fillNote" placeholder="บันทึกเพิ่มเติม" />
          </div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="บรรจุเสร็จ → รับเข้า Semi" icon="pi pi-arrow-right" class="btn-primary" @click="doCompleteFilling" />
      </div>
    </div>

    <!-- ===== Step 5: รับเข้า Semi ===== -->
    <div v-else-if="order.status === 'receiving'" class="page-card">
      <div class="section-title">รับ Semi เข้าคลัง</div>
      <div class="info-box green">
        <i class="pi pi-inbox" />
        <div>
          <div class="info-label">Semi ที่บรรจุได้</div>
          <div class="info-row"><span>Lot No.:</span> <strong style="font-family: monospace">{{ order.semiLot?.lotNo }}</strong></div>
          <div class="info-row"><span>ปริมาณ:</span> <strong>{{ order.semiLot?.qty?.toLocaleString() }} {{ formula?.outputUnit }}</strong></div>
          <div class="info-row"><span>คลัง:</span> <strong>{{ warehouseName(order.semiLot?.warehouseId) }}</strong></div>
          <div v-if="order.semiLot?.expiryDate" class="info-row"><span>หมดอายุ:</span> <strong>{{ order.semiLot.expiryDate }}</strong></div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="ยืนยันรับ Semi เข้าคลัง" icon="pi pi-check" class="btn-primary" @click="doReceiveSemi" />
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
        <div class="sum-card"><div class="sum-label">เนื้อแปรรูป</div><div class="sum-val">{{ order.processData?.qty?.toLocaleString() || "—" }} kg</div></div>
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
import { computed, reactive, ref, watch } from "vue";
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

const steps = ["ยืนยันวัตถุดิบ", "แปรรูป", "ผสม", "บรรจุ", "รับเข้า Semi"];
const stepIndex = computed(
  () => ({ confirmed: 0, processing: 1, mixing: 2, packing: 3, receiving: 4, done: 5 })[order.value?.status] ?? 0,
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
function warehouseName(id) { return masterStore.getWarehouseById(id)?.name || id || "—"; }

const productOptionsFor = (premix) =>
  masterStore.products
    .filter((p) => p.active && (premix ? p.categoryId === "CAT11" : p.categoryId !== "CAT11"))
    .map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }));
const premixProductOptions = computed(() => productOptionsFor(true));
const ingredientProductOptions = computed(() => productOptionsFor(false));

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
function addRow(arr, _premix) { arr.push({ productId: null, qtyRequired: 0 }); }

// ---- Step 2: process ----
const processQty = ref(0);
const processTemp = ref(null);
const processNote = ref("");
function initProcess() {
  const d = order.value?.processData;
  processQty.value = d?.qty ?? (formula.value ? formula.value.outputQtyPerBatch * order.value.plannedBatches : 0);
  processTemp.value = d?.temp ?? null;
  processNote.value = d?.note ?? "";
}

// ---- Step 3: mix ----
const mixSub = ref("sauce");
const sauce = reactive({ name: "", code: "", date: "", mixSize: 50, columns: [], rows: [] });
const meat = reactive({ name: "", code: "", date: "", mixSize: 0, columns: [], rows: [], totals: {}, extra: {} });

function makeSauceRow() {
  return { values: Object.fromEntries(sauce.columns.map((c) => [c.key, null])), end: null };
}
function makeMeatRow() {
  return { values: Object.fromEntries(meat.columns.map((c) => [c.key, null])), end: null, temp: null };
}
function addSauceRow() { sauce.rows.push(makeSauceRow()); }
function addMeatRow() { meat.rows.push(makeMeatRow()); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function initMix() {
  if (!order.value) return;
  const ings = order.value.ingredients;
  const premixIngs = ings.filter((i) => isPremix(i.productId));
  const meatIngs = ings.filter((i) => !isPremix(i.productId));
  const saved = order.value.mixData;

  // sauce columns: base liquid + each premix
  const sCols = [{ key: "base", label: "น้ำ soft", target: null, unit: "kg" }];
  premixIngs.forEach((i, idx) =>
    sCols.push({ key: "p" + idx, label: nameOf(i.productId), target: i.qtyRequired, unit: unitAbbrOf(i.productId) }),
  );

  // sauce form
  sauce.name = saved?.sauce?.name ?? formula.value?.name ?? "";
  sauce.code = saved?.sauce?.code ?? formula.value?.code ?? "";
  sauce.date = saved?.sauce?.date ?? todayStr();
  sauce.mixSize = saved?.sauce?.mixSize ?? 50;
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
  meat.columns = saved?.meat?.columns ?? mCols;
  meat.rows = saved?.meat?.rows ?? [makeMeatRow()];
  meat.totals = saved?.meat?.totals ?? Object.fromEntries([...mCols.map((c) => [c.key, null]), ["end", null]]);
  meat.extra = saved?.meat?.extra ?? {
    topping: "", tempFirst: null, tempLast: null, packReceive: null,
    totalCount: null, defect: null, inkCode: "", retortTime: "",
  };
  mixSub.value = "sauce";
}

// ---- Step 4: filling ----
const fillSemiQty = ref(0);
const fillPackCount = ref(null);
const fillExpiry = ref("");
const fillNote = ref("");
function initFilling() {
  const f = order.value?.fillingData;
  fillSemiQty.value = f?.semiQty ?? order.value?.processData?.qty ??
    (formula.value ? formula.value.outputQtyPerBatch * order.value.plannedBatches : 0);
  fillPackCount.value = f?.packCount ?? null;
  fillExpiry.value = f?.expiry ?? "";
  fillNote.value = f?.note ?? "";
}

// re-init local state whenever the active step changes
watch(
  () => [order.value?.id, order.value?.status],
  () => {
    const s = order.value?.status;
    if (s === "confirmed") initConfirm();
    else if (s === "processing") initProcess();
    else if (s === "mixing") initMix();
    else if (s === "packing") initFilling();
  },
  { immediate: true },
);

// ---- labels ----
function statusLabel(s) {
  return {
    confirmed: "ยืนยันแล้ว", processing: "กำลังแปรรูป", mixing: "กำลังผสม",
    packing: "กำลังบรรจุ", receiving: "รอรับเข้า Semi", done: "เสร็จสิ้น", cancelled: "ยกเลิก",
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
  toast.add({ severity: "success", summary: "เริ่มแปรรูปแล้ว", life: 3000 });
}

function doCompleteProcessing() {
  if (!processQty.value || processQty.value <= 0) {
    toast.add({ severity: "warn", summary: "กรุณาระบุปริมาณเนื้อที่แปรรูปได้", life: 3000 });
    return;
  }
  productionStore.completeProcessing(order.value.id, {
    qty: processQty.value, temp: processTemp.value, note: processNote.value,
  });
  toast.add({ severity: "success", summary: "แปรรูปเสร็จแล้ว", detail: "ดำเนินการผสมต่อไป", life: 3000 });
}

function doCompleteMixing() {
  productionStore.completeMixing(order.value.id, {
    sauce: { name: sauce.name, code: sauce.code, date: sauce.date, mixSize: sauce.mixSize,
      columns: sauce.columns, rows: sauce.rows },
    meat: { name: meat.name, code: meat.code, date: meat.date, mixSize: meat.mixSize,
      columns: meat.columns, rows: meat.rows, totals: meat.totals, extra: meat.extra },
  });
  toast.add({ severity: "success", summary: "ผสมเสร็จแล้ว", detail: "ดำเนินการบรรจุต่อไป", life: 3000 });
}

function doCompleteFilling() {
  if (!fillSemiQty.value || fillSemiQty.value <= 0) {
    toast.add({ severity: "warn", summary: "กรุณาระบุปริมาณ Semi", life: 3000 });
    return;
  }
  productionStore.completeFilling(order.value.id, {
    semiQty: fillSemiQty.value, packCount: fillPackCount.value,
    expiry: fillExpiry.value || null, note: fillNote.value,
  });
  toast.add({ severity: "success", summary: "บรรจุเสร็จแล้ว", detail: "ไปขั้นตอนรับเข้า Semi", life: 3000 });
}

function doReceiveSemi() {
  productionStore.receiveSemi(order.value.id);
  toast.add({
    severity: "success", summary: "รับ Semi เข้าคลังสำเร็จ!",
    detail: `${order.value?.actualOutput?.toLocaleString()} ${formula.value?.outputUnit}`, life: 4000,
  });
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
.sheet-head { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 18px; }

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

/* row delete (reveals on hover) */
.mix-sheet tbody .act-col { background: #fff; }
.row-del {
  width: 30px; height: 30px; border: none; border-radius: 8px; cursor: pointer;
  background: transparent; color: #d1d9e2; display: inline-flex; align-items: center;
  justify-content: center; font-size: 13px; transition: background 0.12s, color 0.12s;
}
.mix-sheet tbody tr:hover .row-del { color: #f87171; }
.row-del:hover { background: #fef2f2; color: #dc2626; }

/* total footer band */
.mix-sheet tfoot td { padding: 0; text-align: center; background: #1e2a3b; }
.mix-sheet tfoot td:not(:last-child) { border-right: 1px solid rgba(255, 255, 255, 0.08); }
.mix-sheet tfoot .no-col { color: #fff; font-weight: 700; padding: 13px 8px; letter-spacing: 0.3px; }
.mix-sheet tfoot .cell-input { color: #fff; font-weight: 700; }
.mix-sheet tfoot .cell-input::placeholder { color: #64748b; }
.mix-sheet tfoot .cell-input:hover { background: rgba(255, 255, 255, 0.07); }
.mix-sheet tfoot .cell-input:focus {
  background: rgba(255, 255, 255, 0.1); border-color: #84cc16;
  box-shadow: inset 0 0 0 3px rgba(132, 204, 22, 0.3);
}
.mix-sheet tfoot .hatch {
  background: repeating-linear-gradient(45deg, #2a3850, #2a3850 5px, #1e2a3b 5px, #1e2a3b 10px);
}

/* add-row affordance */
.add-round {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
  padding: 9px 16px; border: 1.5px dashed #cbd5e1; border-radius: 10px; background: #fff;
  color: #475569; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: border-color 0.14s, color 0.14s, background 0.14s;
}
.add-round:hover { border-color: #84cc16; color: #4d7c0f; background: #f7fee7; }

.meat-extra { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }

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
