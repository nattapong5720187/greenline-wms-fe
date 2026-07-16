import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGetFormulas, apiGetFormula, apiCreateFormula, apiUpdateFormula, apiDeleteFormula } from '@/api/formulas'
import { apiGetProductionOrders, apiGetProductionOrder, apiCreateProductionOrder, apiUpdateProductionOrder, apiDeleteProductionOrder } from '@/api/productionOrders'
import { useStockStore } from './stock'
import { useMasterStore } from './master'

// Map a backend production order to the view-model the (still mock-shaped) views
// read. `mixsizeId` is stringified to line up with a formula VM's mixSize `key`.
function toOrderVM(o) {
  return {
    id: o.id,
    docNo: o.prodNo,
    formulaId: o.formulaId,
    mixsizeId: String(o.mixSizeId),
    mixSizeId: o.mixSizeId,
    machineId: o.machineId,
    status: o.status, // ACCEPT | MIXING | SUCCESS | CANCELED
    planDate: o.planDate,
    createdAt: o.createdAt,
    createdBy: o.createdBy,
    ingredients: o.ingredients || [],
    mixRecords: o.mixRecords || [],
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

  function matchLots(formulaId, batches) {
    const stockStore = useStockStore()
    const formula = getFormulaById(formulaId)
    if (!formula) return []
    return formula.ingredients.map(ing => {
      const qtyRequired = ing.qtyPerBatch * batches
      const fifoLots = stockStore.getLotsForProduct(ing.productId)
      let remaining = qtyRequired
      const lotAssignments = []
      for (const lot of fifoLots) {
        if (remaining <= 0) break
        const take = Math.min(lot.remaining, remaining)
        if (take > 0) {
          lotAssignments.push({ lotId: lot.id, lotNo: lot.lotNo, qty: take })
          remaining -= take
        }
      }
      return { productId: ing.productId, qtyRequired, lotAssignments }
    })
  }

  // Build the raw-material list for one mix of the selected mix size, then
  // FIFO-match available lots for each item.
  function matchLotsForMixsize(formulaId, mixsizeId) {
    const stockStore = useStockStore()
    const formula = getFormulaById(formulaId)
    if (!formula) return []
    const bom = formula.bomByMixsize?.[mixsizeId]
    const items = bom ? [...(bom.premix || []), ...(bom.ingredients || [])] : (formula.ingredients || [])
    return items.map(ing => {
      const qtyRequired = ing.qtyPerBatch
      const fifoLots = stockStore.getLotsForProduct(ing.productId)
      let remaining = qtyRequired
      const lotAssignments = []
      for (const lot of fifoLots) {
        if (remaining <= 0) break
        const take = Math.min(lot.remaining, remaining)
        if (take > 0) {
          lotAssignments.push({ lotId: lot.id, lotNo: lot.lotNo, qty: take })
          remaining -= take
        }
      }
      return { productId: ing.productId, qtyRequired, lotAssignments }
    })
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

  // payload: { formulaId, mixSizeId, machineId, prodNo, planDate }
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

  // Re-match lots after the user edits / adds / removes raw materials in step 1.
  function setIngredients(orderId, list) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    const stockStore = useStockStore()
    order.ingredients = list
      .filter(it => it.productId && it.qtyRequired > 0)
      .map(it => {
        const fifoLots = stockStore.getLotsForProduct(it.productId)
        let remaining = it.qtyRequired
        const lotAssignments = []
        for (const lot of fifoLots) {
          if (remaining <= 0) break
          const take = Math.min(lot.remaining, remaining)
          if (take > 0) {
            lotAssignments.push({ lotId: lot.id, lotNo: lot.lotNo, qty: take })
            remaining -= take
          }
        }
        return { productId: it.productId, qtyRequired: it.qtyRequired, lotAssignments }
      })
  }

  // Step 1 → 2: confirm raw materials, deduct stock, move to ผสม (Mix).
  function startProcessing(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'confirmed') return
    const stockStore = useStockStore()
    const masterStore = useMasterStore()
    order.ingredients.forEach(ing => {
      const product = masterStore.getProductById(ing.productId)
      ing.lotAssignments.forEach(la => {
        const lot = stockStore.lots.find(l => l.id === la.lotId)
        const whId = lot?.warehouseId || product?.warehouseId || 'WH01'
        stockStore.deductStock(ing.productId, whId, la.qty, la.lotId)
      })
      const covered = ing.lotAssignments.reduce((s, la) => s + la.qty, 0)
      const uncovered = ing.qtyRequired - covered
      if (uncovered > 0 && product?.warehouseId) {
        stockStore.deductStock(ing.productId, product.warehouseId, uncovered, null)
      }
    })
    order.status = 'mixing'
    order.mixStartAt = new Date().toISOString()
  }

  // Step 2 → 3: record the two mixer logs (sauce + meat), create the Semi lot,
  // move to รับเข้า Semi (Receive).
  function completeMixing(orderId, data) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'mixing') return
    const formula = getFormulaById(order.formulaId)
    const semiQty = formula ? (formula.outputQtyPerBatch || 0) * order.plannedBatches : 0
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const lotNo = `SEMI-${d}-${String(orders.value.length).padStart(3, '0')}`
    order.mixData = data
    order.semiLot = {
      lotNo,
      productId: formula?.semiProductId || null,
      qty: semiQty,
      warehouseId: 'WH02',
      expiryDate: null,
    }
    order.status = 'receiving'
    order.mixedAt = new Date().toISOString()
    order.packedAt = new Date().toISOString()
  }

  // Step 5 → done: receive the Semi product into the warehouse.
  function receiveSemi(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'receiving' || !order.semiLot) return
    const stockStore = useStockStore()
    const formula = getFormulaById(order.formulaId)
    const semiProductId = formula?.semiProductId || order.semiLot.productId
    if (semiProductId) {
      stockStore.addStock(semiProductId, 'WH02', order.semiLot.qty, 'Semi', {
        lotNo: order.semiLot.lotNo, productId: semiProductId,
        receiveDate: new Date().toISOString().split('T')[0],
        expiryDate: order.semiLot.expiryDate || null, warehouseId: 'WH02', status: 'active',
      })
    }
    order.actualOutput = order.semiLot.qty
    order.status = 'done'
    order.receivedAt = new Date().toISOString()
    order.completedAt = new Date().toISOString()
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
    setIngredients, startProcessing, completeMixing, receiveSemi,
    matchLots, matchLotsForMixsize,
  }
})
