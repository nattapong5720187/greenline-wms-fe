import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PACKINGS, generatePackNo } from '@/data/mockData'

function makeId(prefix) { return `${prefix}${Date.now()}` }

export const usePackingStore = defineStore('packing', () => {
  const packings = ref([...PACKINGS])

  function getById(id) { return packings.value.find(p => p.id === id) }

  function createPacking(data) {
    const rec = {
      id: makeId('PK'),
      docNo: generatePackNo(),
      semiProductId: data.semiProductId,
      inputQty: data.inputQty,
      fgQty: data.fgQty,
      rejectedQty: data.rejectedQty,
      warehouseId: data.warehouseId || 'WH02',
      note: data.note || '',
      status: 'done',
      createdAt: new Date().toISOString(),
      createdBy: 'USR001',
    }
    packings.value.unshift(rec)
    return rec
  }

  const counts = computed(() => ({
    all: packings.value.length,
    totalFg: packings.value.reduce((s, p) => s + (Number(p.fgQty) || 0), 0),
    totalRejected: packings.value.reduce((s, p) => s + (Number(p.rejectedQty) || 0), 0),
  }))

  return { packings, getById, createPacking, counts }
})
