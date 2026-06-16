import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DOCUMENTS, generateDocNo } from '@/data/mockData'
import { useStockStore } from './stock'

function makeId(prefix) { return `${prefix}${Date.now()}` }

export const useDocumentStore = defineStore('documents', () => {
  const documents = ref([...DOCUMENTS])

  const stockStore = useStockStore

  function getAll() { return documents.value }

  function getById(id) { return documents.value.find(d => d.id === id) }

  function getByType(type) { return documents.value.filter(d => d.type === type) }

  function getByWarehouse(warehouseId) {
    return documents.value.filter(d => d.warehouseId === warehouseId)
  }

  // Create receipt
  function createReceipt(data) {
    const doc = {
      ...data,
      id: makeId('DOC'),
      docNo: generateDocNo('GR'),
      type: 'receipt',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    documents.value.unshift(doc)
    return doc
  }

  // Create requisition
  function createRequisition(data) {
    const doc = {
      ...data,
      id: makeId('DOC'),
      docNo: generateDocNo('RQ'),
      type: 'requisition',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    documents.value.unshift(doc)
    return doc
  }

  // Create return
  function createReturn(data) {
    const doc = {
      ...data,
      id: makeId('DOC'),
      docNo: generateDocNo('RT'),
      type: 'return',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    documents.value.unshift(doc)
    return doc
  }

  function updateStatus(id, status, userId) {
    const doc = documents.value.find(d => d.id === id)
    if (!doc) return
    doc.status = status
    doc.updatedAt = new Date().toISOString()

    if (status === 'approved') {
      doc.approvedBy = userId
      // For receipts: add stock
      if (doc.type === 'receipt') {
        const stock = useStockStore()
        doc.items?.forEach(item => {
          stock.addStock(item.productId, doc.warehouseId, item.qty, null)
        })
      }
    }

    if (status === 'issued') {
      doc.issuedBy = userId
      // Deduct stock
      const stock = useStockStore()
      doc.items?.forEach(item => {
        stock.deductStock(item.productId, doc.warehouseId, item.qty, item.lotId)
      })
    }

    if (status === 'approved' && doc.type === 'return') {
      const stock = useStockStore()
      doc.items?.forEach(item => {
        stock.addStock(item.productId, doc.warehouseId, item.qty, null)
      })
    }
  }

  function deleteDocument(id) {
    documents.value = documents.value.filter(d => d.id !== id)
  }

  const counts = computed(() => ({
    all: documents.value.length,
    receipt: documents.value.filter(d => d.type === 'receipt').length,
    requisition: documents.value.filter(d => d.type === 'requisition').length,
    return: documents.value.filter(d => d.type === 'return').length,
    pending: documents.value.filter(d => d.status === 'pending').length,
    draft: documents.value.filter(d => d.status === 'draft').length,
  }))

  return {
    documents, counts,
    getAll, getById, getByType, getByWarehouse,
    createReceipt, createRequisition, createReturn,
    updateStatus, deleteDocument,
  }
})
