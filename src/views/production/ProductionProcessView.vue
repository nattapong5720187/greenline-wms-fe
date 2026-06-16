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

    <!-- Step 1: ยืนยันวัตถุดิบ -->
    <div v-if="order.status === 'confirmed'" class="page-card">
      <div class="section-title">วัตถุดิบที่ต้องใช้ ({{ order.plannedBatches }} Batch)</div>
      <DataTable :value="enrichedIngredients" size="small" stripedRows>
        <Column header="#" style="width: 44px">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column header="สินค้า">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ data.productName }}</div>
            <div style="font-size: 11px; color: var(--gl-text-muted); font-family: monospace">
              {{ data.productCode }}
            </div>
          </template>
        </Column>
        <Column header="ต้องการ" style="width: 130px; text-align: right">
          <template #body="{ data }">
            <strong :class="data.isShort ? 'text-danger' : ''">
              {{ data.qtyRequired.toLocaleString() }} {{ data.unitAbbr }}
            </strong>
          </template>
        </Column>
        <Column header="คงเหลือ" style="width: 110px; text-align: right">
          <template #body="{ data }">
            <span :class="data.isShort ? 'text-danger' : 'text-ok'">
              {{ data.available.toLocaleString() }} {{ data.unitAbbr }}
            </span>
          </template>
        </Column>
        <Column header="Lot ที่ Match (FIFO)" style="width: 280px">
          <template #body="{ data }">
            <div v-if="data.lotAssignments.length === 0" style="color: var(--gl-text-muted); font-size: 12px">
              ไม่มีข้อมูล Lot
            </div>
            <div v-for="la in data.lotAssignments" :key="la.lotId" class="lot-row">
              <span class="lot-chip">{{ la.lotNo }}</span>
              <span style="font-size: 12px">{{ la.qty.toLocaleString() }} {{ data.unitAbbr }}</span>
            </div>
          </template>
        </Column>
        <Column header="สถานะ" style="width: 80px; text-align: center">
          <template #body="{ data }">
            <i v-if="!data.isShort" class="pi pi-check-circle" style="color: var(--gl-success); font-size: 16px" />
            <i v-else class="pi pi-exclamation-triangle" style="color: var(--gl-red); font-size: 16px" />
          </template>
        </Column>
      </DataTable>

      <div v-if="hasShortage" class="shortage-warn">
        <i class="pi pi-exclamation-triangle" style="margin-right: 6px" />
        สต๊อกบางรายการไม่เพียงพอ — ตรวจสอบก่อนเริ่มผสม
      </div>
      <div class="action-bar">
        <Button label="ยกเลิกใบสั่งผลิต" text severity="danger" @click="doCancel" />
        <Button
          label="เริ่มผสม / แปรรูป"
          icon="pi pi-play"
          class="btn-primary"
          :disabled="hasShortage"
          @click="doStartMixing"
        />
      </div>
    </div>

    <!-- Step 2: ผสม -->
    <div v-else-if="order.status === 'mixing'" class="page-card">
      <div class="section-title">ขั้นตอนผสม</div>
      <div class="info-box amber">
        <i class="pi pi-cog spin-icon" />
        <div>
          <div style="font-weight: 600; font-size: 15px">กำลังผสม</div>
          <div style="font-size: 13px; color: #92400e">
            วัตถุดิบถูกหักออกจากสต๊อกแล้ว · เริ่มผสม: {{ formatDt(order.mixedAt) }}
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 16px">วัตถุดิบที่ใช้ผสม ({{ order.plannedBatches }} Batch)</div>
      <DataTable :value="enrichedIngredients" size="small" stripedRows>
        <Column header="#" style="width: 44px">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column header="สินค้า / วัตถุดิบ">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ data.productName }}</div>
            <div style="font-size: 11px; color: var(--gl-text-muted); font-family: monospace">
              {{ data.productCode }}
            </div>
          </template>
        </Column>
        <Column header="ปริมาณที่ใช้" style="width: 160px; text-align: right">
          <template #body="{ data }">
            <strong>{{ data.qtyRequired.toLocaleString() }} {{ data.unitAbbr }}</strong>
          </template>
        </Column>
        <Column header="Lot ที่ใช้ (FIFO)" style="width: 280px">
          <template #body="{ data }">
            <div v-if="data.lotAssignments.length === 0" style="color: var(--gl-text-muted); font-size: 12px">—</div>
            <div v-for="la in data.lotAssignments" :key="la.lotId" class="lot-row">
              <span class="lot-chip">{{ la.lotNo }}</span>
              <span style="font-size: 12px">{{ la.qty.toLocaleString() }} {{ data.unitAbbr }}</span>
            </div>
          </template>
        </Column>
      </DataTable>

      <div class="action-bar">
        <Button
          label="ผสมเสร็จแล้ว → ไปแปรรูป"
          icon="pi pi-arrow-right"
          class="btn-primary"
          @click="doCompleteMixing"
        />
      </div>
    </div>

    <!-- Step 3: แปรรูป -->
    <div v-else-if="order.status === 'processing'" class="page-card">
      <div class="section-title">ขั้นตอนแปรรูป</div>
      <div class="info-box orange">
        <i class="pi pi-sync" style="font-size: 28px" />
        <div>
          <div style="font-weight: 600; font-size: 15px">กำลังแปรรูป</div>
          <div style="font-size: 13px; color: #9a3412">บันทึกปริมาณ Semi ที่ได้หลังแปรรูปเสร็จ</div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 16px">วัตถุดิบที่ใช้แปรรูป ({{ order.plannedBatches }} Batch)</div>
      <DataTable :value="enrichedIngredients" size="small" stripedRows>
        <Column header="#" style="width: 44px">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column header="สินค้า / วัตถุดิบ">
          <template #body="{ data }">
            <div style="font-weight: 500">{{ data.productName }}</div>
            <div style="font-size: 11px; color: var(--gl-text-muted); font-family: monospace">
              {{ data.productCode }}
            </div>
          </template>
        </Column>
        <Column header="ปริมาณที่ใช้" style="width: 160px; text-align: right">
          <template #body="{ data }">
            <strong>{{ data.qtyRequired.toLocaleString() }} {{ data.unitAbbr }}</strong>
          </template>
        </Column>
        <Column header="Lot ที่ใช้ (FIFO)" style="width: 280px">
          <template #body="{ data }">
            <div v-if="data.lotAssignments.length === 0" style="color: var(--gl-text-muted); font-size: 12px">—</div>
            <div v-for="la in data.lotAssignments" :key="la.lotId" class="lot-row">
              <span class="lot-chip">{{ la.lotNo }}</span>
              <span style="font-size: 12px">{{ la.qty.toLocaleString() }} {{ data.unitAbbr }}</span>
            </div>
          </template>
        </Column>
      </DataTable>

      <div class="sub-card" style="margin-top: 16px">
        <div class="section-title" style="margin-bottom: 12px; margin-top: 0">บันทึกปริมาณ Semi ที่ได้</div>
        <div class="inline-fields">
          <div class="form-field">
            <label>ปริมาณ Semi จริง ({{ formula?.outputUnit || "หน่วย" }}) <span class="req">*</span></label>
            <InputNumber v-model="semiQty" :min="1" style="width: 220px" />
          </div>
          <div class="form-field">
            <label>หมายเหตุ</label>
            <InputText v-model="semiNote" placeholder="บันทึกเพิ่มเติม" style="width: 280px" />
          </div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="ยืนยัน Semi เข้าคลัง" icon="pi pi-check" class="btn-primary" @click="doCompleteProcessing" />
      </div>
    </div>

    <!-- Step 3: บรรจุ -->
    <div v-else-if="order.status === 'packing'" class="page-card">
      <div class="section-title">บรรจุภัณฑ์ → FG</div>
      <div class="info-box green">
        <i class="pi pi-box" style="font-size: 28px" />
        <div>
          <div class="info-label">Semi ที่รับเข้าคลัง</div>
          <div class="info-row">
            <span>Lot No.:</span> <strong style="font-family: monospace">{{ order.semiLot?.lotNo }}</strong>
          </div>
          <div class="info-row">
            <span>ปริมาณ:</span> <strong>{{ order.semiLot?.qty?.toLocaleString() }} {{ formula?.outputUnit }}</strong>
          </div>
        </div>
      </div>
      <div class="sub-card">
        <div class="section-title" style="margin-bottom: 12px; margin-top: 0">บันทึก Output FG จริง</div>
        <div class="inline-fields">
          <div class="form-field">
            <label>จำนวน FG จริง ({{ formula?.outputUnit }}) <span class="req">*</span></label>
            <InputNumber v-model="fgQty" :min="1" style="width: 200px" />
          </div>
          <div class="form-field">
            <label>วันหมดอายุ FG</label>
            <InputText v-model="fgExpiry" type="date" style="width: 180px" />
          </div>
        </div>
      </div>
      <div class="action-bar">
        <Button label="รับ FG เข้าคลัง" icon="pi pi-inbox" class="btn-primary" @click="doCompletePacking" />
      </div>
    </div>

    <!-- Step 4: Done -->
    <div v-else-if="order.status === 'done'" class="page-card">
      <div class="done-banner">
        <i class="pi pi-check-circle" style="font-size: 40px; color: #10b981" />
        <div>
          <div style="font-size: 18px; font-weight: 700; color: #166534">เสร็จสิ้น</div>
          <div style="font-size: 13px; color: #4b7a5e">{{ formatDt(order.completedAt) }}</div>
        </div>
      </div>
      <div class="summary-grid">
        <div class="sum-card">
          <div class="sum-label">สูตรที่ใช้</div>
          <div class="sum-val">{{ formulaName }}</div>
        </div>
        <div class="sum-card">
          <div class="sum-label">จำนวน Batch</div>
          <div class="sum-val">{{ order.plannedBatches }}</div>
        </div>
        <div class="sum-card">
          <div class="sum-label">Semi Lot</div>
          <div class="sum-val mono">{{ order.semiLot?.lotNo || "—" }}</div>
        </div>
        <div class="sum-card">
          <div class="sum-label">FG Lot</div>
          <div class="sum-val mono">{{ order.fgLot?.lotNo || "—" }}</div>
        </div>
        <div class="sum-card highlight">
          <div class="sum-label">Output จริง</div>
          <div class="sum-val big">{{ order.actualOutput?.toLocaleString() }} {{ formula?.outputUnit }}</div>
        </div>
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
import { useStockStore } from "@/stores/stock";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const productionStore = useProductionStore();
const masterStore = useMasterStore();
const stockStore = useStockStore();

const semiQty = ref(0);
const semiNote = ref("");
const fgQty = ref(0);
const fgExpiry = ref("");

const order = computed(() => productionStore.orders.find((o) => o.id === route.params.id));
const formula = computed(() => (order.value ? productionStore.getFormulaById(order.value.formulaId) : null));
const formulaName = computed(() => formula.value?.name || "—");

const steps = ["ยืนยันวัตถุดิบ", "ผสม", "แปรรูป", "บรรจุ", "รับเข้า Semi"];
const stepIndex = computed(
  () => ({ confirmed: 0, mixing: 1, processing: 2, packing: 3, done: 4 })[order.value?.status] ?? 0,
);

function stepState(i) {
  const cur = stepIndex.value;
  if (i < cur) return "done";
  if (i === cur) return "active";
  return "pending";
}

const enrichedIngredients = computed(() => {
  if (!order.value) return [];
  return order.value.ingredients.map((ing) => {
    const product = masterStore.getProductById(ing.productId);
    const unit = masterStore.getUnitById(product?.unitId);
    const available = stockStore.getAllQty(ing.productId);
    return {
      ...ing,
      productName: product?.name || "—",
      productCode: product?.code || "—",
      unitAbbr: unit?.abbr || "",
      available,
      isShort: available < ing.qtyRequired,
    };
  });
});

const hasShortage = computed(() => enrichedIngredients.value.some((i) => i.isShort));

function statusLabel(s) {
  return (
    {
      confirmed: "ยืนยันแล้ว",
      mixing: "กำลังผสม",
      processing: "กำลังแปรรูป",
      packing: "กำลังบรรจุ",
      done: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
    }[s] || s
  );
}
function formatDt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

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

function doStartMixing() {
  productionStore.startMixing(order.value.id);
  const f = formula.value;
  semiQty.value = f ? f.outputQtyPerBatch * order.value.plannedBatches : 0;
  toast.add({ severity: "success", summary: "เริ่มผสมแล้ว", detail: "หักสต๊อกวัตถุดิบเรียบร้อย", life: 3000 });
}

function doCompleteMixing() {
  productionStore.completeMixing(order.value.id);
  const f = formula.value;
  semiQty.value = f ? f.outputQtyPerBatch * order.value.plannedBatches : 0;
  toast.add({ severity: "success", summary: "ผสมเสร็จแล้ว", detail: "ดำเนินการแปรรูปต่อไป", life: 3000 });
}

function doCompleteProcessing() {
  if (!semiQty.value || semiQty.value <= 0) {
    toast.add({ severity: "warn", summary: "กรุณาระบุปริมาณ Semi", life: 3000 });
    return;
  }
  productionStore.completeProcessing(order.value.id, semiQty.value);
  const f = formula.value;
  fgQty.value = f ? f.outputQtyPerBatch * order.value.plannedBatches : 0;
  toast.add({ severity: "success", summary: "รับ Semi เข้าคลังแล้ว", life: 3000 });
}

function doCompletePacking() {
  if (!fgQty.value || fgQty.value <= 0) {
    toast.add({ severity: "warn", summary: "กรุณาระบุจำนวน FG", life: 3000 });
    return;
  }
  productionStore.completePacking(order.value.id, fgQty.value, fgExpiry.value || null);
  toast.add({
    severity: "success",
    summary: "รับ FG เข้าคลังสำเร็จ!",
    detail: `${fgQty.value.toLocaleString()} ${formula.value?.outputUnit}`,
    life: 4000,
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
.step-item {
  display: flex;
  align-items: center;
}
.step-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  flex-shrink: 0;
}
.step-circle.done {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}
.step-circle.active {
  background: #1e2a3b;
  border-color: #1e2a3b;
  color: #fff;
}
.step-label {
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
  color: #94a3b8;
}
.step-label.done {
  color: #10b981;
}
.step-label.active {
  color: #1e2a3b;
  font-weight: 700;
}
.step-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 16px;
  min-width: 30px;
}
.step-line.line-done {
  background: #10b981;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e2a3b;
  margin-bottom: 14px;
}
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}
.lot-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.lot-chip {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 11px;
  font-family: monospace;
  padding: 2px 7px;
  border-radius: 4px;
}
.shortage-warn {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  color: #991b1b;
}
.text-danger {
  color: var(--gl-red);
  font-weight: 600;
}
.text-ok {
  color: #166534;
}
.info-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 13px;
}
.info-box.amber {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}
.info-box.orange {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
}
.info-box.green {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.info-box i {
  font-size: 28px;
  flex-shrink: 0;
}
.info-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 3px;
}
.info-row span {
  color: inherit;
  opacity: 0.7;
  min-width: 70px;
}
.sub-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px 20px;
}
.inline-fields {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 10px;
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
.done-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 10px;
  margin-bottom: 20px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.sum-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px;
}
.sum-card.highlight {
  background: #dcfce7;
}
.sum-label {
  font-size: 11px;
  color: var(--gl-text-muted);
  margin-bottom: 4px;
}
.sum-val {
  font-size: 15px;
  font-weight: 700;
  color: #1e2a3b;
}
.sum-val.mono {
  font-family: monospace;
  font-size: 12px;
}
.sum-val.big {
  font-size: 20px;
  color: #166534;
}
.cancelled-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  text-align: center;
}
.po-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
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
.po-badge.done {
  background: #dcfce7;
  color: #166534;
}
.po-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #1e2a3b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
</style>
