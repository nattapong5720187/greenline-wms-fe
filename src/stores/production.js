import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { FORMULAS, PRODUCTION_ORDERS, generatePONo } from '@/data/mockData'
import { useStockStore } from './stock'
import { useMasterStore } from './master'

function makeId(prefix) { return `${prefix}${Date.now()}` }

export const useProductionStore = defineStore('production', () => {
  const formulas = ref([...FORMULAS])
  const orders = ref([...PRODUCTION_ORDERS])

  function getFormulaById(id) { return formulas.value.find(f => f.id === id) }

  function addFormula(data) {
    formulas.value.unshift({ ...data, id: makeId('FML'), createdAt: new Date().toISOString() })
  }
  function updateFormula(id, data) {
    const i = formulas.value.findIndex(f => f.id === id)
    if (i !== -1) formulas.value[i] = { ...formulas.value[i], ...data }
  }
  function deleteFormula(id) {
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

  function createOrder(formulaId, mixsizeId) {
    const ingredients = matchLotsForMixsize(formulaId, mixsizeId)
    const order = {
      id: makeId('PO'),
      docNo: generatePONo(),
      formulaId,
      mixsizeId,
      plannedBatches: 1,
      status: 'confirmed',
      ingredients,
      processData: null,
      mixData: null,
      fillingData: null,
      semiLot: null,
      fgLot: null,
      actualOutput: null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      processedAt: null,
      mixedAt: null,
      packedAt: null,
      receivedAt: null,
      completedAt: null,
      createdBy: 'USR001',
    }
    orders.value.unshift(order)
    return order
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

  // Step 1 → 2: confirm raw materials, deduct stock, move to แปรรูป (Process).
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
    order.status = 'processing'
    order.processedStartAt = new Date().toISOString()
  }

  // Step 2 → 3: record processed-meat output, move to ผสม (Mix).
  function completeProcessing(orderId, data) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'processing') return
    order.processData = data
    order.status = 'mixing'
    order.processedAt = new Date().toISOString()
    order.mixedAt = new Date().toISOString()
  }

  // Step 3 → 4: record the two mixer logs (sauce + meat), move to บรรจุ (Filling).
  function completeMixing(orderId, data) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'mixing') return
    order.mixData = data
    order.status = 'packing'
  }

  // Step 4 → 5: fill meat+sauce into packages → Semi product, move to รับเข้า Semi.
  function completeFilling(orderId, data) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'packing') return
    const formula = getFormulaById(order.formulaId)
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const lotNo = `SEMI-${d}-${String(orders.value.length).padStart(3, '0')}`
    order.fillingData = data
    order.semiLot = {
      lotNo,
      productId: formula?.semiProductId || null,
      qty: data.semiQty,
      warehouseId: 'WH02',
      expiryDate: data.expiry || null,
    }
    order.status = 'receiving'
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

  function cancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (order && ['draft', 'confirmed'].includes(order.status)) order.status = 'cancelled'
  }

  const counts = computed(() => ({
    all: orders.value.filter(o => o.status !== 'cancelled').length,
    confirmed: orders.value.filter(o => o.status === 'confirmed').length,
    inProgress: orders.value.filter(o => ['processing', 'mixing', 'packing', 'receiving'].includes(o.status)).length,
    done: orders.value.filter(o => o.status === 'done').length,
  }))

  return {
    formulas, orders, counts,
    getFormulaById, addFormula, updateFormula, deleteFormula,
    createOrder, setIngredients, startProcessing, completeProcessing, completeMixing,
    completeFilling, receiveSemi, cancelOrder,
    matchLots, matchLotsForMixsize,
  }
})
