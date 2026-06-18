<template>
  <div>
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px;">
        <Button icon="pi pi-arrow-left" text rounded @click="router.push('/production/packing')" />
        <div>
          <div class="page-title">สร้างใบแพ็ค</div>
          <div class="page-subtitle">เลือกสินค้า Semi เพื่อแปลงเป็น FG และของเสีย</div>
        </div>
      </div>
      <Button label="บันทึกใบแพ็ค" icon="pi pi-save" class="btn-primary" @click="save" />
    </div>

    <!-- Input: Semi (multiple) -->
    <div class="page-card">
      <div class="section-title">
        <i class="pi pi-sign-in ic-in" /> วัตถุดิบนำเข้า (Input) — สถานะ Semi
        <Button label="เพิ่ม Semi" icon="pi pi-plus" text size="small" class="add-btn" @click="addInput" />
      </div>
      <table class="pk-tbl">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>สินค้า Semi</th>
            <th style="width:150px; text-align:right;">คงเหลือ</th>
            <th style="width:180px;">จำนวนนำเข้า</th>
            <th style="width:48px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in form.inputs" :key="'in' + idx">
            <td>{{ idx + 1 }}</td>
            <td>
              <Dropdown v-model="row.semiProductId" :options="semiOptions" optionLabel="label" optionValue="value"
                filter placeholder="เลือกสินค้า Semi..." style="width:100%;" />
            </td>
            <td style="text-align:right;">{{ availableOf(row.semiProductId).toLocaleString() }} {{ unitOf(row.semiProductId) }}</td>
            <td>
              <div class="qty-cell">
                <InputNumber v-model="row.inputQty" :min="0" :maxFractionDigits="2" inputStyle="width:110px" />
                <span class="unit">{{ unitOf(row.semiProductId) }}</span>
              </div>
            </td>
            <td>
              <Button icon="pi pi-trash" text rounded severity="danger" size="small"
                :disabled="form.inputs.length === 1" @click="removeInput(idx)" />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="tbl-total">รวมนำเข้า: <strong>{{ totalInput.toLocaleString() }}</strong></div>
    </div>

    <!-- Output: FG + Rejected (auto-mirrored from Semi inputs) -->
    <div class="page-card" style="margin-top:16px;">
      <div class="section-title">
        <i class="pi pi-sign-out ic-out" /> ผลผลิต (Output) — FG / ของเสีย
        <span class="hint">— สร้างอัตโนมัติตามสินค้า Semi นำเข้า</span>
      </div>

      <div v-if="!outputRows.length" class="empty-hint">เลือกสินค้า Semi นำเข้าก่อนเพื่อบันทึกผลผลิต</div>
      <table v-else class="pk-tbl">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>สินค้า</th>
            <th style="width:200px;"><span class="pk-badge fg">FG</span> สินค้าดี</th>
            <th style="width:200px;"><span class="pk-badge rejected">Rejected</span> ของเสีย</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in outputRows" :key="row.productId">
            <td>{{ idx + 1 }}</td>
            <td>
              <div style="font-weight:500;">{{ row.name }}</div>
              <div class="code-sub">{{ row.code }}</div>
            </td>
            <td>
              <div class="qty-cell">
                <InputNumber v-model="outputQty[row.productId].fgQty" :min="0" :maxFractionDigits="2" inputStyle="width:120px" />
                <span class="unit">{{ unitOf(row.productId) }}</span>
              </div>
            </td>
            <td>
              <div class="qty-cell">
                <InputNumber v-model="outputQty[row.productId].rejectedQty" :min="0" :maxFractionDigits="2" inputStyle="width:120px" />
                <span class="unit">{{ unitOf(row.productId) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div :class="['balance-bar', balanced ? 'ok' : 'warn']">
        <i :class="balanced ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" />
        นำเข้า {{ totalInput.toLocaleString() }} = FG {{ totalFg.toLocaleString() }}
        + ของเสีย {{ totalRejected.toLocaleString() }}
        <strong v-if="!balanced">(รวมผลผลิต {{ outputTotal.toLocaleString() }} — ไม่ตรงกับจำนวนนำเข้า)</strong>
      </div>

      <div class="form-field" style="margin-top:14px;">
        <label>หมายเหตุ</label>
        <InputText v-model="form.note" placeholder="บันทึกเพิ่มเติม" style="width:100%;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePackingStore } from '@/stores/packing'
import { useMasterStore } from '@/stores/master'
import { useStockStore } from '@/stores/stock'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'

const router = useRouter()
const toast = useToast()
const packingStore = usePackingStore()
const masterStore = useMasterStore()
const stockStore = useStockStore()

const form = ref({
  inputs: [{ semiProductId: null, inputQty: 0 }],
  note: '',
})
// FG / Rejected quantities keyed by product id, mirrored from the Semi inputs
const outputQty = ref({})

const semiOptions = computed(() =>
  masterStore.products
    .filter(p => p.active && p.stockStatus === 'Semi')
    .map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))
)

function unitOf(id) {
  const p = id ? masterStore.getProductById(id) : null
  return masterStore.getUnitById(p?.unitId)?.abbr || ''
}
function availableOf(id) {
  const q = id ? stockStore.getAllQty(id) : 0
  return Number.isFinite(q) ? q : 0
}

function addInput() { form.value.inputs.push({ semiProductId: null, inputQty: 0 }) }
function removeInput(idx) { if (form.value.inputs.length > 1) form.value.inputs.splice(idx, 1) }

// Output rows auto-mirror the distinct Semi products selected as inputs.
const outputProductIds = computed(() =>
  [...new Set(form.value.inputs.map(i => i.semiProductId).filter(Boolean))]
)
const outputRows = computed(() =>
  outputProductIds.value.map(id => {
    const p = masterStore.getProductById(id)
    return { productId: id, name: p?.name || '—', code: p?.code || '—' }
  })
)

// keep the qty map in sync as Semi inputs are added / changed / removed
watch(outputProductIds, (ids) => {
  ids.forEach(id => { if (!outputQty.value[id]) outputQty.value[id] = { fgQty: 0, rejectedQty: 0 } })
  Object.keys(outputQty.value).forEach(id => { if (!ids.includes(id)) delete outputQty.value[id] })
}, { immediate: true })

const totalInput = computed(() => form.value.inputs.reduce((s, i) => s + (Number(i.inputQty) || 0), 0))
const totalFg = computed(() => outputProductIds.value.reduce((s, id) => s + (Number(outputQty.value[id]?.fgQty) || 0), 0))
const totalRejected = computed(() => outputProductIds.value.reduce((s, id) => s + (Number(outputQty.value[id]?.rejectedQty) || 0), 0))
const outputTotal = computed(() => totalFg.value + totalRejected.value)
const balanced = computed(() => outputTotal.value === totalInput.value)

function save() {
  const validInputs = form.value.inputs.filter(i => i.semiProductId && Number(i.inputQty) > 0)
  if (!validInputs.length) {
    toast.add({ severity: 'warn', summary: 'กรุณาเพิ่มสินค้า Semi นำเข้าอย่างน้อย 1 รายการ', life: 3000 })
    return
  }
  const outputs = outputProductIds.value
    .map(id => ({
      productId: id,
      fgQty: Number(outputQty.value[id]?.fgQty) || 0,
      rejectedQty: Number(outputQty.value[id]?.rejectedQty) || 0,
    }))
    .filter(o => o.fgQty > 0 || o.rejectedQty > 0)
  if (!outputs.length) {
    toast.add({ severity: 'warn', summary: 'กรุณาระบุผลผลิต FG หรือของเสียอย่างน้อย 1 รายการ', life: 3000 })
    return
  }
  const firstProduct = masterStore.getProductById(validInputs[0].semiProductId)
  const rec = packingStore.createPacking({
    inputs: validInputs.map(i => ({ semiProductId: i.semiProductId, inputQty: Number(i.inputQty) || 0 })),
    outputs,
    warehouseId: firstProduct?.warehouseId || 'WH02',
    note: form.value.note,
  })
  toast.add({ severity: 'success', summary: 'บันทึกใบแพ็คสำเร็จ', detail: rec.docNo, life: 3000 })
  router.push('/production/packing')
}
</script>

<style scoped>
.section-title { font-size: 14px; font-weight: 700; color: #1e2a3b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-title .add-btn { margin-left: auto; }
.section-title .hint { font-weight: 400; color: var(--gl-text-muted); font-size: 12px; }
.ic-in { color: #3b82f6; }
.ic-out { color: #10b981; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 500; color: #374151; }
.req { color: var(--gl-red); }

.pk-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.pk-tbl th {
  background: #1e2a3b; color: #fff; font-size: 12px; font-weight: 600;
  padding: 8px 10px; text-align: left; white-space: nowrap;
}
.pk-tbl td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.pk-tbl tbody tr:nth-child(even) { background: #fafbfc; }
.qty-cell { display: flex; align-items: center; gap: 6px; }
.qty-cell .unit { color: var(--gl-text-muted); font-size: 12px; }
.tbl-total { text-align: right; margin-top: 10px; font-size: 13px; color: #334155; }

.code-sub { font-size: 11px; color: var(--gl-text-muted); font-family: monospace; }
.empty-hint { text-align: center; padding: 28px; color: var(--gl-text-muted); font-size: 13px; background: #f8fafc; border-radius: 8px; }
.pk-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.pk-badge.fg { background: #dcfce7; color: #166534; }
.pk-badge.rejected { background: #fee2e2; color: #991b1b; }
.balance-bar {
  margin-top: 16px; padding: 11px 16px; border-radius: 8px; font-size: 13px;
  display: flex; align-items: center; gap: 8px;
}
.balance-bar.ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.balance-bar.warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
</style>
