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

    <!-- Input: Semi -->
    <div class="page-card">
      <div class="section-title"><i class="pi pi-sign-in ic-in" /> วัตถุดิบนำเข้า (Input) — สถานะ Semi</div>
      <div class="form-row">
        <div class="form-field" style="flex:2">
          <label>สินค้า Semi <span class="req">*</span></label>
          <Dropdown v-model="form.semiProductId" :options="semiOptions" optionLabel="label" optionValue="value"
            filter placeholder="เลือกสินค้าสถานะ Semi..." style="width:100%;" />
        </div>
        <div class="form-field">
          <label>จำนวนนำเข้า <span class="req">*</span></label>
          <InputNumber v-model="form.inputQty" :min="0" :maxFractionDigits="2" suffix="" style="width:100%;" />
        </div>
        <div class="form-field" style="width:160px;">
          <label>คงเหลือ Semi</label>
          <div class="readonly-box">{{ availableQty.toLocaleString() }} {{ unitAbbr }}</div>
        </div>
      </div>
    </div>

    <!-- Output: FG + Rejected -->
    <div class="page-card" style="margin-top:16px;">
      <div class="section-title"><i class="pi pi-sign-out ic-out" /> ผลผลิต (Output) — สินค้าเดียวกัน</div>

      <div v-if="!form.semiProductId" class="empty-hint">เลือกสินค้า Semi ก่อนเพื่อบันทึกผลผลิต</div>
      <template v-else>
        <div class="out-product">
          <i class="pi pi-box" />
          <div>
            <div style="font-weight:600;">{{ productName }}</div>
            <div class="code-sub">{{ productCode }}</div>
          </div>
        </div>

        <div class="out-grid">
          <div class="out-card fg">
            <div class="out-head"><span class="pk-badge fg">FG</span> สินค้าดี</div>
            <InputNumber v-model="form.fgQty" :min="0" :maxFractionDigits="2" inputClass="w-full" />
            <div class="out-unit">{{ unitAbbr }}</div>
          </div>
          <div class="out-card rejected">
            <div class="out-head"><span class="pk-badge rejected">Rejected</span> ของเสีย</div>
            <InputNumber v-model="form.rejectedQty" :min="0" :maxFractionDigits="2" inputClass="w-full" />
            <div class="out-unit">{{ unitAbbr }}</div>
          </div>
        </div>

        <div :class="['balance-bar', balanced ? 'ok' : 'warn']">
          <i :class="balanced ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" />
          นำเข้า {{ (form.inputQty || 0).toLocaleString() }} = FG {{ (form.fgQty || 0).toLocaleString() }}
          + ของเสีย {{ (form.rejectedQty || 0).toLocaleString() }}
          <strong v-if="!balanced">(รวม {{ outputTotal.toLocaleString() }} — ไม่ตรงกับจำนวนนำเข้า)</strong>
        </div>

        <div class="form-field" style="margin-top:14px;">
          <label>หมายเหตุ</label>
          <InputText v-model="form.note" placeholder="บันทึกเพิ่มเติม" style="width:100%;" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const form = ref({ semiProductId: null, inputQty: 0, fgQty: 0, rejectedQty: 0, note: '' })

const semiOptions = computed(() =>
  masterStore.products
    .filter(p => p.active && p.stockStatus === 'Semi')
    .map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))
)

const selectedProduct = computed(() =>
  form.value.semiProductId ? masterStore.getProductById(form.value.semiProductId) : null
)
const productName = computed(() => selectedProduct.value?.name || '—')
const productCode = computed(() => selectedProduct.value?.code || '—')
const unitAbbr = computed(() => masterStore.getUnitById(selectedProduct.value?.unitId)?.abbr || '')
const availableQty = computed(() =>
  form.value.semiProductId ? stockStore.getAllQty(form.value.semiProductId) : 0
)

const outputTotal = computed(() => (Number(form.value.fgQty) || 0) + (Number(form.value.rejectedQty) || 0))
const balanced = computed(() => outputTotal.value === (Number(form.value.inputQty) || 0))

function save() {
  if (!form.value.semiProductId) {
    toast.add({ severity: 'warn', summary: 'กรุณาเลือกสินค้า Semi', life: 3000 })
    return
  }
  if (!form.value.inputQty || form.value.inputQty <= 0) {
    toast.add({ severity: 'warn', summary: 'กรุณาระบุจำนวนนำเข้า', life: 3000 })
    return
  }
  if (outputTotal.value <= 0) {
    toast.add({ severity: 'warn', summary: 'กรุณาระบุผลผลิต FG หรือของเสีย', life: 3000 })
    return
  }
  const rec = packingStore.createPacking({
    semiProductId: form.value.semiProductId,
    inputQty: form.value.inputQty,
    fgQty: Number(form.value.fgQty) || 0,
    rejectedQty: Number(form.value.rejectedQty) || 0,
    warehouseId: selectedProduct.value?.warehouseId || 'WH02',
    note: form.value.note,
  })
  toast.add({ severity: 'success', summary: 'บันทึกใบแพ็คสำเร็จ', detail: rec.docNo, life: 3000 })
  router.push('/production/packing')
}
</script>

<style scoped>
.section-title { font-size: 14px; font-weight: 700; color: #1e2a3b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.ic-in { color: #3b82f6; }
.ic-out { color: #10b981; }
.form-row { display: flex; gap: 14px; align-items: flex-end; }
.form-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.form-field label { font-size: 13px; font-weight: 500; color: #374151; }
.req { color: var(--gl-red); }
.readonly-box {
  height: 42px; display: flex; align-items: center; padding: 0 14px;
  background: #f1f5f9; border-radius: 8px; font-weight: 600; color: #334155; font-size: 14px;
}
.code-sub { font-size: 11px; color: var(--gl-text-muted); font-family: monospace; }
.empty-hint { text-align: center; padding: 28px; color: var(--gl-text-muted); font-size: 13px; background: #f8fafc; border-radius: 8px; }
.out-product { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 16px; }
.out-product i { font-size: 24px; color: #84cc16; }
.out-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.out-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; position: relative; }
.out-card.fg { background: #f0fdf4; border-color: #bbf7d0; }
.out-card.rejected { background: #fef2f2; border-color: #fecaca; }
.out-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 10px; }
.out-card :deep(.p-inputnumber) { width: 100%; }
.out-card :deep(.w-full) { width: 100%; }
.out-unit { font-size: 12px; color: var(--gl-text-muted); margin-top: 6px; }
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
