import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGetFormulas, apiGetFormula, apiCreateFormula, apiUpdateFormula, apiDeleteFormula } from '@/api/formulas'
import { apiGetProductionOrders, apiGetProductionOrder, apiCreateProductionOrder, apiUpdateProductionOrder, apiDeleteProductionOrder, apiReplaceMixRecords } from '@/api/productionOrders'

/*
 * Map a backend production order to the view-model the views read.
 *
 * An order pairs TWO formulas, and which is which decides the whole screen:
 *   sauce (SAUCE) → stage 1 → "ผสม Premix → ซอส"     → Homo mixer
 *   semi  (SEMI)  → stage 2 → "ผสมซอส + เนื้อแปรรูป" → Ribbon mixer
 * That is also why `sauceMachineId` is the stage-1 machine and `semiMachineId`
 * the stage-2 one — the old `first_machine_id`/`second_machine_id` were renamed
 * to the halves they always belonged to, not swapped.
 *
 * Only the semi side is mandatory on the API, so every sauce field is nullable.
 * Mix size ids are stringified as `…MixsizeKey` to line up with a formula VM's
 * mixSize `key`.
 */
function toOrderVM(o) {
  // The detail read returns mix records split by stage; flatten them into one
  // list (each record carries its own `stage`) for the views that iterate all
  // records, while keeping the per-stage arrays available too.
  const firstStage = o.firstStageMixRecords || []
  const secondStage = o.secondStageMixRecords || []
  return {
    id: o.id,
    docNo: o.prodNo,
    // ── sauce half (stage 1) ──
    sauceFormulaId: o.sauceFormulaId ?? null,
    sauceMixSizeId: o.sauceMixSizeId ?? null,
    sauceMixsizeKey: o.sauceMixSizeId == null ? null : String(o.sauceMixSizeId),
    sauceMachineId: o.sauceMachineId ?? null,
    sauceFormula: o.sauceFormula ? toFormulaVM(o.sauceFormula) : null,
    sauceMixSize: o.sauceMixSize ?? null,
    // ── semi half (stage 2) ──
    semiFormulaId: o.semiFormulaId ?? null,
    semiMixSizeId: o.semiMixSizeId ?? null,
    semiMixsizeKey: o.semiMixSizeId == null ? null : String(o.semiMixSizeId),
    semiMachineId: o.semiMachineId ?? null,
    semiFormula: o.semiFormula ? toFormulaVM(o.semiFormula) : null,
    semiMixSize: o.semiMixSize ?? null,
    status: o.status, // ACCEPT | MIXING | SUCCESS | CANCELED
    planDate: o.planDate,
    createdAt: o.createdAt,
    createdBy: o.createdBy,
    ingredients: o.ingredients || [],
    firstStageMixRecords: firstStage,
    secondStageMixRecords: secondStage,
    mixRecords: [...firstStage, ...secondStage],
  }
}

// ── Formula API ⇄ view-model translation ───────────────────
// The backend owns mix sizes per-formula ({ sizeKg, name, ingredients }) and
// distinguishes premix vs. ingredient via `stepType`. The rest of the app reads
// the older mock-shaped fields (code/active/animalType/bomByMixsize/…), so we
// map between the two here — mirroring `normalizeProduct` in the master store.
const FOOD_TYPE_IN = { DOG: 'dog', CAT: 'cat' }
const FOOD_TYPE_OUT = { dog: 'DOG', cat: 'CAT' }
const PACK_TYPE_IN = { CAN: 'can', SPOUT_POUCH: 'spout_pouch' }
const PACK_TYPE_OUT = { can: 'CAN', spout_pouch: 'SPOUT_POUCH' }

function mapIngredientIn(i) {
  return { productId: i.productId, unitId: i.unitId, qtyPerBatch: i.quantity }
}

function toFormulaVM(f) {
  const mixSizes = (f.mixSizes || []).map(ms => {
    const sorted = [...(ms.ingredients || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    return {
      backendId: ms.id,
      key: String(ms.id),
      sizeKg: ms.sizeKg,
      name: ms.name,
      premix: sorted.filter(i => i.stepType === 'PREMIX').map(mapIngredientIn),
      ingredients: sorted.filter(i => i.stepType !== 'PREMIX').map(mapIngredientIn),
    }
  })
  const bomByMixsize = {}
  const allIngredients = []
  mixSizes.forEach(ms => {
    bomByMixsize[ms.key] = { premix: ms.premix, ingredients: ms.ingredients }
    allIngredients.push(...ms.premix, ...ms.ingredients)
  })
  return {
    id: f.id,
    code: f.formulaCode || '',
    name: f.name,
    productCode: f.productCode || '',
    // SEMI | SAUCE, or null for formulas drafted before the split existed.
    type: f.type || null,
    remark: f.remark || '',
    active: f.status !== false,
    animalType: FOOD_TYPE_IN[f.foodType] || null,
    packagingType: PACK_TYPE_IN[f.packagingType] || null,
    packagingSize: f.packageSizeId ?? null,
    brand: f.brandId ?? null,
    isConfidential: !!f.isConfidential,
    version: f.version ?? 1,
    mixSizes,
    mixsizeIds: mixSizes.map(ms => ms.key),
    bomByMixsize,
    ingredients: allIngredients,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }
}

function toFormulaPayload(vm) {
  const mixSizes = (vm.mixSizes || []).map(ms => {
    let order = 0
    const ingredients = []
    ;(ms.premix || []).forEach(i => {
      if (i.productId && i.qtyPerBatch > 0) {
        ingredients.push({ productId: i.productId, unitId: Number(i.unitId), quantity: i.qtyPerBatch, stepType: 'PREMIX', sortOrder: order++ })
      }
    })
    ;(ms.ingredients || []).forEach(i => {
      if (i.productId && i.qtyPerBatch > 0) {
        ingredients.push({ productId: i.productId, unitId: Number(i.unitId), quantity: i.qtyPerBatch, stepType: 'INGREDIENT', sortOrder: order++ })
      }
    })
    return { sizeKg: Number(ms.sizeKg), name: ms.name, ingredients }
  })
  const payload = {
    brandId: Number(vm.brand),
    packageSizeId: Number(vm.packagingSize),
    name: vm.name,
    foodType: FOOD_TYPE_OUT[vm.animalType],
    packagingType: PACK_TYPE_OUT[vm.packagingType],
    status: vm.active !== false,
    isConfidential: !!vm.isConfidential,
    mixSizes,
  }
  if (vm.code) payload.formulaCode = vm.code
  if (vm.productCode) payload.productCode = vm.productCode
  if (vm.type) payload.type = vm.type
  // The DTO validates `remark` with @IsString, so clearing the note sends an
  // empty string — null would be rejected.
  if (vm.remark !== undefined) payload.remark = vm.remark || ''
  return payload
}

export const useProductionStore = defineStore('production', () => {
  const formulas = ref([])
  const formulasLoading = ref(false)
  const orders = ref([])
  const ordersLoading = ref(false)
  const ordersMeta = ref({ page: 1, limit: 100, total: 0, totalPages: 0 })

  function getFormulaById(id) { return formulas.value.find(f => f.id === id) }

  async function fetchFormulas() {
    formulasLoading.value = true
    try {
      const { data } = await apiGetFormulas()
      formulas.value = data.map(toFormulaVM)
    } finally {
      formulasLoading.value = false
    }
  }
  async function fetchFormula(id) {
    const { data } = await apiGetFormula(id)
    const vm = toFormulaVM(data)
    const i = formulas.value.findIndex(f => f.id === id)
    if (i !== -1) formulas.value[i] = vm
    else formulas.value.unshift(vm)
    return vm
  }
  async function addFormula(data) {
    const { data: created } = await apiCreateFormula(toFormulaPayload(data))
    const vm = toFormulaVM(created)
    formulas.value.unshift(vm)
    return vm
  }
  async function updateFormula(id, data) {
    const { data: updated } = await apiUpdateFormula(id, toFormulaPayload(data))
    const vm = toFormulaVM(updated)
    const i = formulas.value.findIndex(f => f.id === id)
    if (i !== -1) formulas.value[i] = vm
    return vm
  }
  async function deleteFormula(id) {
    await apiDeleteFormula(id)
    formulas.value = formulas.value.filter(f => f.id !== id)
  }

  // ---- Production orders (API) ----
  async function fetchOrders(params = {}) {
    ordersLoading.value = true
    try {
      const { data } = await apiGetProductionOrders({ page: 1, limit: 100, ...params })
      orders.value = (data.data || []).map(toOrderVM)
      ordersMeta.value = {
        page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages,
      }
    } finally {
      ordersLoading.value = false
    }
  }

  function getOrderById(id) { return orders.value.find(o => String(o.id) === String(id)) }

  async function fetchOrder(id) {
    const { data } = await apiGetProductionOrder(id)
    const vm = toOrderVM(data)
    const i = orders.value.findIndex(o => o.id === vm.id)
    if (i !== -1) orders.value[i] = vm
    else orders.value.unshift(vm)
    return vm
  }

  // payload: { semiFormulaId, semiMixSizeId, semiMachineId, sauceFormulaId,
  //            sauceMixSizeId, sauceMachineId, prodNo, planDate } — the sauce
  // side is indivisible: formula and mix size go together or neither is sent.
  async function createOrder(payload) {
    const { data } = await apiCreateProductionOrder(payload)
    const vm = toOrderVM(data)
    orders.value.unshift(vm)
    return vm
  }

  // payload: { status?, mixRecords?, ... } — see UpdateProductionOrderDto
  async function updateOrder(id, payload) {
    const { data } = await apiUpdateProductionOrder(id, payload)
    const vm = toOrderVM(data)
    const i = orders.value.findIndex(o => o.id === vm.id)
    if (i !== -1) orders.value[i] = vm
    else orders.value.unshift(vm)
    return vm
  }

  // Replace one stage's (1=ซอส, 2=เนื้อ) mix records. Only allowed while MIXING;
  // sends the whole stage list — the backend removes and re-inserts that stage.
  async function saveMixRecords(id, records) {
    const { data } = await apiReplaceMixRecords(id, records)
    const vm = toOrderVM(data)
    const i = orders.value.findIndex(o => o.id === vm.id)
    if (i !== -1) orders.value[i] = vm
    else orders.value.unshift(vm)
    return vm
  }

  // Cancel = backend soft-delete; only orders still in ACCEPT can be cancelled.
  async function cancelOrder(orderId) {
    await apiDeleteProductionOrder(orderId)
    const order = orders.value.find(o => o.id === orderId)
    if (order) order.status = 'CANCELED'
  }

  const counts = computed(() => ({
    all: orders.value.filter(o => o.status !== 'CANCELED').length,
    confirmed: orders.value.filter(o => o.status === 'ACCEPT').length,
    inProgress: orders.value.filter(o => o.status === 'MIXING').length,
    done: orders.value.filter(o => o.status === 'SUCCESS').length,
  }))

  return {
    formulas, formulasLoading, orders, ordersLoading, ordersMeta, counts,
    getFormulaById, fetchFormulas, fetchFormula, addFormula, updateFormula, deleteFormula,
    fetchOrders, fetchOrder, getOrderById, createOrder, updateOrder, cancelOrder,
    saveMixRecords,
  }
})
