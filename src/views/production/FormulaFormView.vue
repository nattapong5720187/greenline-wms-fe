<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px">
        <Button icon="pi pi-arrow-left" text rounded @click="router.back()" />
        <div>
          <div class="page-title">{{ isEdit ? "แก้ไขสูตร" : "สร้างสูตรใหม่" }}</div>
          <div class="page-subtitle">{{ isEdit ? form.code : "กรอกข้อมูลสูตรและส่วนผสม BOM" }}</div>
        </div>
      </div>
      <Button :label="isEdit ? 'บันทึก' : 'สร้างสูตร'" icon="pi pi-save" class="btn-primary" @click="save" />
    </div>

    <!-- ข้อมูลทั่วไป -->
    <div class="page-card">
      <div class="section-title">ข้อมูลทั่วไป</div>
      <div class="form-row">
        <div class="form-field">
          <label>รหัสสูตร <span class="req">*</span></label>
          <InputText v-model="form.code" placeholder="เช่น FML-004" style="width: 100%" />
        </div>
        <div class="form-field" style="flex: 2">
          <label>ชื่อสูตร <span class="req">*</span></label>
          <InputText v-model="form.name" placeholder="ชื่อสูตรการผลิต" style="width: 100%" />
        </div>
        <div class="form-field">
          <label>รหัสสินค้า</label>
          <InputText v-model="form.productCode" placeholder="เช่น SKU-001" style="width: 100%" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>ประเภทอาหาร</label>
          <Dropdown
            v-model="form.animalType"
            :options="animalTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกประเภทอาหาร"
            style="width: 100%"
            showClear
          />
        </div>
        <div class="form-field">
          <label>ประเภทบรรจุภัณฑ์</label>
          <Dropdown
            v-model="form.packagingType"
            :options="packagingTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกประเภทบรรจุภัณฑ์"
            style="width: 100%"
            showClear
          />
        </div>
        <div class="form-field">
          <label>ขนาดบรรจุภัณฑ์</label>
          <Dropdown
            v-model="form.packagingSize"
            :options="packagingSizeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกขนาด"
            style="width: 100%"
            showClear
          />
        </div>
        <div class="form-field">
          <label>ชื่อแบรนด์</label>
          <Dropdown
            v-model="form.brand"
            :options="brandOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกแบรนด์"
            style="width: 100%"
            showClear
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Mixsize <span class="req">*</span></label>
          <MultiSelect
            ref="mixselectRef"
            v-model="form.mixsizeIds"
            :options="mixsizeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือก Mixsize..."
            display="chip"
            style="width: 100%"
            :pt="{ header: { style: 'display:none' } }"
          >
            <template #header>
              <div class="ms-select-all" @click="toggleAll">
                <Checkbox :modelValue="allSelected" :binary="true" :indeterminate="someSelected" tabindex="-1" />
                <span>เลือกทั้งหมด</span>
              </div>
            </template>
            <template #footer>
              <div class="ms-footer">
                <Button
                  label="เพิ่ม Mixsize"
                  icon="pi pi-plus"
                  text
                  size="small"
                  style="width: 100%"
                  @click="openAddMixsizeDialog"
                />
              </div>
            </template>
          </MultiSelect>
        </div>
        <div class="form-field">
          <label>สถานะ</label>
          <Dropdown
            v-model="form.active"
            :options="[
              { label: 'ใช้งาน', value: true },
              { label: 'ปิดใช้', value: false },
            ]"
            optionLabel="label"
            optionValue="value"
            style="width: 100%"
          />
        </div>
      </div>
    </div>

    <!-- Add Mixsize inline dialog -->
    <Dialog v-model:visible="showAddMixsize" header="เพิ่ม Mixsize" :modal="true" :style="{ width: '380px' }">
      <div class="dialog-form">
        <div>
          <label class="field-label">ขนาด Mixsize <span class="req">*</span></label>
          <InputNumber v-model="addForm.size" :min="1" style="width: 100%" placeholder="เช่น 30" />
        </div>
        <div>
          <label class="field-label">หน่วย <span class="req">*</span></label>
          <Dropdown
            v-model="addForm.unitId"
            :options="masterStore.units"
            optionLabel="name"
            optionValue="id"
            placeholder="เลือกหน่วย"
            style="width: 100%"
          >
            <template #option="{ option }">{{ option.name }} ({{ option.abbr }})</template>
            <template #value="slotProps">
              <span v-if="slotProps.value">
                {{ masterStore.getUnitById(slotProps.value)?.name }} ({{
                  masterStore.getUnitById(slotProps.value)?.abbr
                }})
              </span>
              <span v-else class="p-placeholder">เลือกหน่วย</span>
            </template>
          </Dropdown>
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" outlined @click="showAddMixsize = false" />
        <Button label="เพิ่ม" class="btn-primary" @click="handleAddMixsize" />
      </template>
    </Dialog>

    <!-- BOM Tabs -->
    <div v-if="form.mixsizeIds.length > 0" class="page-card" style="margin-top: 16px">
      <div class="tab-nav">
        <button
          v-for="mixId in form.mixsizeIds"
          :key="mixId"
          :class="['tab-btn', { active: activeMixsizeId === mixId }]"
          @click="activeMixsizeId = mixId"
        >
          {{ getMixsizeLabel(mixId) }}
        </button>
      </div>

      <template v-if="activeMixsizeId">
        <!-- Premix -->
        <div class="bom-section-head">
          <div class="section-title" style="margin-bottom: 0">
            <i class="pi pi-bolt ic-premix" /> Premix — {{ getBom(activeMixsizeId).premix.length }} รายการ
          </div>
          <Button label="เพิ่ม Premix" icon="pi pi-plus" size="small" outlined @click="addPremix(activeMixsizeId)" />
        </div>
        <div v-if="getBom(activeMixsizeId).premix.length === 0" class="empty-bom">
          ยังไม่มี Premix — กดปุ่ม "เพิ่ม Premix" เพื่อเริ่มต้น
        </div>
        <div v-else>
          <div class="bom-header">
            <div style="flex: 2">Premix</div>
            <div style="width: 140px; text-align: right">ปริมาณ / Batch</div>
            <div style="width: 120px; padding-left: 12px">หน่วย</div>
            <div style="width: 48px"></div>
          </div>
          <div v-for="(ing, idx) in getBom(activeMixsizeId).premix" :key="'pm' + idx" class="bom-row">
            <div style="flex: 2">
              <Dropdown
                v-model="ing.productId"
                :options="premixOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="เลือก Premix..."
                style="width: 100%"
              />
            </div>
            <div style="width: 140px">
              <InputNumber
                v-model="ing.qtyPerBatch"
                :min="0"
                :minFractionDigits="0"
                :maxFractionDigits="3"
                style="width: 100%"
              />
            </div>
            <div style="width: 120px; padding-left: 12px">
              <Dropdown
                v-model="ing.unitId"
                :options="unitOptions"
                optionLabel="abbr"
                optionValue="id"
                style="width: 100%"
              />
            </div>
            <div style="width: 48px; text-align: center">
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                @click="removePremix(activeMixsizeId, idx)"
              />
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div class="bom-section-head" style="margin-top: 20px">
          <div class="section-title" style="margin-bottom: 0">
            <i class="pi pi-box ic-ingredient" /> ส่วนผสม / วัตถุดิบ —
            {{ getBom(activeMixsizeId).ingredients.length }} รายการ
          </div>
          <Button
            label="เพิ่มวัตถุดิบ"
            icon="pi pi-plus"
            size="small"
            outlined
            @click="addIngredient(activeMixsizeId)"
          />
        </div>
        <div v-if="getBom(activeMixsizeId).ingredients.length === 0" class="empty-bom">
          ยังไม่มีวัตถุดิบ — กดปุ่ม "เพิ่มวัตถุดิบ" เพื่อเริ่มต้น
        </div>
        <div v-else>
          <div class="bom-header">
            <div style="flex: 2">สินค้า / วัตถุดิบ</div>
            <div style="width: 140px; text-align: right">ปริมาณ / Batch</div>
            <div style="width: 120px; padding-left: 12px">หน่วย</div>
            <div style="width: 48px"></div>
          </div>
          <div v-for="(ing, idx) in getBom(activeMixsizeId).ingredients" :key="'ing' + idx" class="bom-row">
            <div style="flex: 2">
              <Dropdown
                v-model="ing.productId"
                :options="ingredientOptions"
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="เลือกสินค้า..."
                style="width: 100%"
              />
            </div>
            <div style="width: 140px">
              <InputNumber
                v-model="ing.qtyPerBatch"
                :min="0"
                :minFractionDigits="0"
                :maxFractionDigits="3"
                style="width: 100%"
              />
            </div>
            <div style="width: 120px; padding-left: 12px">
              <Dropdown
                v-model="ing.unitId"
                :options="unitOptions"
                optionLabel="abbr"
                optionValue="id"
                style="width: 100%"
              />
            </div>
            <div style="width: 48px; text-align: center">
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                @click="removeIngredient(activeMixsizeId, idx)"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="page-card" style="margin-top: 16px">
      <div class="empty-bom">กรุณาเลือก Mixsize เพื่อกรอกข้อมูล BOM</div>
    </div>
  </div>
</template>

<script setup>
import { useMasterStore } from "@/stores/master";
import { useProductionStore } from "@/stores/production";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const productionStore = useProductionStore();
const masterStore = useMasterStore();

const isEdit = computed(() => !!route.params.id);

const form = ref({
  code: "",
  name: "",
  productCode: "",
  active: true,
  animalType: null,
  packagingType: null,
  packagingSize: null,
  brand: null,
  mixsizeIds: [],
});

const animalTypeOptions = [
  { label: "หมา", value: "dog" },
  { label: "แมว", value: "cat" },
];
const packagingTypeOptions = [
  { label: "Can", value: "can" },
  { label: "Spout pouch", value: "spout_pouch" },
];
const packagingSizeOptions = computed(() =>
  masterStore.packagingSizes.map((p) => ({
    label: p.label,
    value: p.id,
  })),
);
const brandOptions = computed(() =>
  masterStore.brands.map((b) => ({ label: b.name, value: b.id })),
);

// ── BOM per-mixsize state ──────────────────────────────────
const activeMixsizeId = ref(null);
const bomRows = ref({}); // { [mixsizeId]: { premix: [], ingredients: [] } }

function getBom(mixsizeId) {
  if (!bomRows.value[mixsizeId]) {
    bomRows.value[mixsizeId] = { premix: [], ingredients: [] };
  }
  return bomRows.value[mixsizeId];
}

watch(
  () => form.value.mixsizeIds,
  (newIds) => {
    newIds.forEach((id) => {
      if (!bomRows.value[id]) bomRows.value[id] = { premix: [], ingredients: [] };
    });
    if (!newIds.includes(activeMixsizeId.value)) {
      activeMixsizeId.value = newIds[0] || null;
    }
  },
  { deep: true },
);

// ── Mixsize multiselect ────────────────────────────────────
const mixselectRef = ref(null);
const showAddMixsize = ref(false);
const addForm = ref({ size: null, unitId: null });

const mixsizeOptions = computed(() =>
  masterStore.mixsizes.map((mx) => {
    const unit = masterStore.getUnitById(mx.unitId);
    return { label: `${mx.size.toLocaleString()} ${unit?.abbr || ""}`, value: mx.id };
  }),
);

function getMixsizeLabel(mixsizeId) {
  const mx = masterStore.getMixsizeById(mixsizeId);
  if (!mx) return mixsizeId;
  const unit = masterStore.getUnitById(mx.unitId);
  return `${mx.size.toLocaleString()} ${unit?.abbr || ""}`;
}

const allSelected = computed(
  () => mixsizeOptions.value.length > 0 && form.value.mixsizeIds.length === mixsizeOptions.value.length,
);
const someSelected = computed(
  () => form.value.mixsizeIds.length > 0 && form.value.mixsizeIds.length < mixsizeOptions.value.length,
);

function toggleAll() {
  form.value.mixsizeIds = allSelected.value ? [] : mixsizeOptions.value.map((o) => o.value);
}

function openAddMixsizeDialog() {
  mixselectRef.value?.hide();
  addForm.value = { size: null, unitId: null };
  showAddMixsize.value = true;
}

function handleAddMixsize() {
  if (!addForm.value.size || !addForm.value.unitId) {
    toast.add({ severity: "warn", summary: "กรุณากรอกข้อมูลให้ครบ", life: 3000 });
    return;
  }
  masterStore.addMixsize(addForm.value);
  toast.add({ severity: "success", summary: "เพิ่ม Mixsize สำเร็จ", life: 3000 });
  showAddMixsize.value = false;
}

// ── BOM options ────────────────────────────────────────────
const premixOptions = computed(() =>
  masterStore.products
    .filter((p) => p.categoryId === "CAT11")
    .map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
);
const ingredientOptions = computed(() =>
  masterStore.products
    .filter((p) => p.categoryId !== "CAT11")
    .map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
);
const unitOptions = computed(() => masterStore.units);

function addPremix(mixsizeId) {
  getBom(mixsizeId).premix.push({ productId: null, qtyPerBatch: 0, unitId: "U01" });
}
function removePremix(mixsizeId, idx) {
  getBom(mixsizeId).premix.splice(idx, 1);
}
function addIngredient(mixsizeId) {
  getBom(mixsizeId).ingredients.push({ productId: null, qtyPerBatch: 0, unitId: "U01" });
}
function removeIngredient(mixsizeId, idx) {
  getBom(mixsizeId).ingredients.splice(idx, 1);
}

// ── Edit mode load ─────────────────────────────────────────
function isPremix(productId) {
  return masterStore.getProductById(productId)?.categoryId === "CAT11";
}

onMounted(() => {
  if (isEdit.value) {
    const f = productionStore.getFormulaById(route.params.id);
    if (f) {
      form.value = {
        code: f.code,
        name: f.name,
        productCode: f.productCode || "",
        active: f.active,
        animalType: f.animalType || null,
        packagingType: f.packagingType || null,
        packagingSize: f.packagingSize || null,
        brand: f.brand || null,
        mixsizeIds: [...(f.mixsizeIds || [])],
      };
      bomRows.value = {};
      if (f.bomByMixsize) {
        Object.entries(f.bomByMixsize).forEach(([mixId, bom]) => {
          bomRows.value[mixId] = {
            premix: (bom.premix || []).map((i) => ({ ...i })),
            ingredients: (bom.ingredients || []).map((i) => ({ ...i })),
          };
        });
      } else if (f.ingredients) {
        const firstMixId = (f.mixsizeIds || [])[0];
        if (firstMixId) {
          const ings = f.ingredients.map((i) => ({ ...i }));
          bomRows.value[firstMixId] = {
            premix: ings.filter((i) => isPremix(i.productId)),
            ingredients: ings.filter((i) => !isPremix(i.productId)),
          };
        }
      }
      activeMixsizeId.value = form.value.mixsizeIds[0] || null;
    }
  }
});

// ── Save ───────────────────────────────────────────────────
function save() {
  if (!form.value.code || !form.value.name) {
    toast.add({ severity: "warn", summary: "กรุณากรอกข้อมูลให้ครบ", detail: "รหัสและชื่อสูตรจำเป็น", life: 3000 });
    return;
  }
  const bomByMixsize = {};
  const allIngredients = [];
  form.value.mixsizeIds.forEach((mixId) => {
    const bom = getBom(mixId);
    const premix = bom.premix.filter((i) => i.productId && i.qtyPerBatch > 0);
    const ingredients = bom.ingredients.filter((i) => i.productId && i.qtyPerBatch > 0);
    bomByMixsize[mixId] = { premix, ingredients };
    allIngredients.push(...premix, ...ingredients);
  });
  const payload = { ...form.value, bomByMixsize, ingredients: allIngredients };
  if (isEdit.value) {
    productionStore.updateFormula(route.params.id, payload);
    toast.add({ severity: "success", summary: "บันทึกสำเร็จ", detail: form.value.name, life: 3000 });
  } else {
    productionStore.addFormula(payload);
    toast.add({ severity: "success", summary: "สร้างสูตรสำเร็จ", detail: form.value.name, life: 3000 });
  }
  router.push("/production/formulas");
}
</script>

<style scoped>
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e2a3b;
  margin-bottom: 14px;
}
.form-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.req {
  color: var(--gl-red);
}

/* Tab */
.tab-nav {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 20px;
}
.tab-btn {
  padding: 8px 20px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--gl-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  border-radius: 4px 4px 0 0;
  transition: all 0.15s;
  font-family: inherit;
}
.tab-btn:hover {
  color: var(--gl-navy);
  background: #f8fafc;
}
.tab-btn.active {
  color: var(--gl-navy);
  border-bottom-color: var(--gl-navy);
  font-weight: 600;
}

/* BOM */
.bom-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.bom-section-head .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ic-premix {
  color: #f59e0b;
}
.ic-ingredient {
  color: #84cc16;
}
.bom-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #1e2a3b;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}
.bom-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.bom-row:last-child {
  border-bottom: none;
}
.empty-bom {
  text-align: center;
  padding: 32px;
  color: var(--gl-text-muted);
  font-size: 13px;
  background: #f8fafc;
  border-radius: 8px;
}

/* Mixsize multiselect */
.ms-select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
  user-select: none;
}
.ms-select-all:hover {
  background: #f8fafc;
}
.ms-footer {
  border-top: 1px solid #f1f5f9;
  padding: 4px 8px;
}
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  display: block;
  margin-bottom: 6px;
}
</style>
