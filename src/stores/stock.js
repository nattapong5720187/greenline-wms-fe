import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STOCK, LOTS, HOLD_ITEMS, STOCK_TRANSFERS } from '@/data/mockData'

function makeId(prefix) { return `${prefix}${Date.now()}` }

export const useStockStore = defineStore('stock', () => {
  const stock = ref([...STOCK])
  const lots = ref([...LOTS])
  const holdItems = ref([...HOLD_ITEMS])
  const transfers = ref([...STOCK_TRANSFERS])

  // get qty for a product in a warehouse
  function getQty(productId, warehouseId) {
    const s = stock.value.find(s => s.productId === productId && s.warehouseId === warehouseId)
    return s ? s.qty : 0
  }

  function getAllQty(productId) {
    return stock.value.filter(s => s.productId === productId).reduce((sum, s) => sum + s.qty, 0)
  }

  function getStockByWarehouse(warehouseId) {
    return stock.value.filter(s => s.warehouseId === warehouseId)
  }

  function getLotsForProduct(productId) {
    return lots.value
      .filter(l => l.productId === productId && l.remaining > 0)
      .sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate)) // FIFO
  }

  // Deduct stock (when issuing)
  function deductStock(productId, warehouseId, qty, lotId) {
    const s = stock.value.find(s => s.productId === productId && s.warehouseId === warehouseId)
    if (s) {
      s.qty = Math.max(0, s.qty - qty)
    }
    if (lotId) {
      const lot = lots.value.find(l => l.id === lotId)
      if (lot) lot.remaining = Math.max(0, lot.remaining - qty)
    }
  }

  // Add stock (when receiving or returning)
  function addStock(productId, warehouseId, qty, stockStatus, lotData) {
    const s = stock.value.find(s => s.productId === productId && s.warehouseId === warehouseId)
    if (s) {
      s.qty += qty
    } else {
      stock.value.push({ id: makeId('S'), productId, warehouseId, qty, stockStatus: stockStatus || 'RM' })
    }
    if (lotData) {
      lots.value.push({ ...lotData, id: makeId('LOT'), remaining: qty })
    }
  }

  // Hold management
  function holdStock(data) {
    holdItems.value.push({ ...data, id: makeId('HLD'), status: 'hold', resolvedAt: null })
    // Deduct from regular stock
    deductStock(data.productId, data.warehouseId, data.qty, data.lotId)
  }

  function releaseHold(holdId, resolution) {
    const h = holdItems.value.find(h => h.id === holdId)
    if (h) {
      h.status = 'released'
      h.resolution = resolution
      h.resolvedAt = new Date().toISOString()
      // Add back to stock
      addStock(h.productId, h.warehouseId, h.qty, 'RM')
    }
  }

  function sendToReprocess(holdId) {
    const h = holdItems.value.find(h => h.id === holdId)
    if (h) {
      h.status = 'reprocess'
      h.resolvedAt = new Date().toISOString()
    }
  }

  // Stock transfer
  function transferStock(data) {
    const { fromWarehouseId, toWarehouseId, productId, qty, lotId } = data
    deductStock(productId, fromWarehouseId, qty, null)
    addStock(productId, toWarehouseId, qty, 'RM')
    transfers.value.push({
      ...data,
      id: makeId('TRF'),
      status: 'completed',
      transferredAt: new Date().toISOString(),
    })
  }

  // Min stock check
  const lowStockItems = computed(() => {
    return [] // computed in notification store
  })

  return {
    stock, lots, holdItems, transfers,
    getQty, getAllQty, getStockByWarehouse, getLotsForProduct,
    deductStock, addStock, holdStock, releaseHold, sendToReprocess, transferStock,
    lowStockItems,
  }
})
