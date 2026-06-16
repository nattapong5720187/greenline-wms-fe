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

  function createOrder(formulaId, batches) {
    const ingredients = matchLots(formulaId, batches)
    const order = {
      id: makeId('PO'),
      docNo: generatePONo(),
      formulaId,
      plannedBatches: batches,
      status: 'confirmed',
      ingredients,
      semiLot: null,
      fgLot: null,
      actualOutput: null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      mixedAt: null,
      packedAt: null,
      completedAt: null,
      createdBy: 'USR001',
    }
    orders.value.unshift(order)
    return order
  }

  function startMixing(orderId) {
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
    order.mixedAt = new Date().toISOString()
  }

  function completeMixing(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'mixing') return
    order.status = 'processing'
    order.processedAt = new Date().toISOString()
  }

  function completeProcessing(orderId, semiQty) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'processing') return
    const stockStore = useStockStore()
    const formula = getFormulaById(order.formulaId)
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const lotNo = `SEMI-${d}-${String(orders.value.length).padStart(3, '0')}`
    if (formula?.semiProductId) {
      stockStore.addStock(formula.semiProductId, 'WH02', semiQty, 'Semi', {
        lotNo, productId: formula.semiProductId,
        receiveDate: new Date().toISOString().split('T')[0],
        expiryDate: null, warehouseId: 'WH02', status: 'active',
      })
    }
    order.semiLot = { lotNo, productId: formula?.semiProductId, qty: semiQty, warehouseId: 'WH02' }
    order.status = 'packing'
  }

  function completePacking(orderId, fgQty, fgExpiry) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== 'packing') return
    const stockStore = useStockStore()
    const formula = getFormulaById(order.formulaId)
    if (formula?.semiProductId && order.semiLot?.qty) {
      stockStore.deductStock(formula.semiProductId, 'WH02', order.semiLot.qty, null)
    }
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const lotNo = `FG-${d}-${String(orders.value.length).padStart(3, '0')}`
    if (formula?.outputProductId) {
      stockStore.addStock(formula.outputProductId, 'WH02', fgQty, 'FG', {
        lotNo, productId: formula.outputProductId,
        receiveDate: new Date().toISOString().split('T')[0],
        expiryDate: fgExpiry || null, warehouseId: 'WH02', status: 'active',
      })
    }
    order.fgLot = { lotNo, productId: formula?.outputProductId, qty: fgQty, warehouseId: 'WH02' }
    order.actualOutput = fgQty
    order.status = 'done'
    order.packedAt = new Date().toISOString()
    order.completedAt = new Date().toISOString()
  }

  function cancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId)
    if (order && ['draft', 'confirmed'].includes(order.status)) order.status = 'cancelled'
  }

  const counts = computed(() => ({
    all: orders.value.filter(o => o.status !== 'cancelled').length,
    confirmed: orders.value.filter(o => o.status === 'confirmed').length,
    inProgress: orders.value.filter(o => ['mixing', 'processing', 'packing'].includes(o.status)).length,
    done: orders.value.filter(o => o.status === 'done').length,
  }))

  return {
    formulas, orders, counts,
    getFormulaById, addFormula, updateFormula, deleteFormula,
    createOrder, startMixing, completeMixing, completeProcessing, completePacking, cancelOrder,
    matchLots,
  }
})
