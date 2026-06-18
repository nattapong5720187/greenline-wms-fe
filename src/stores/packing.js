import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PACKINGS, generatePackNo } from '@/data/mockData'

function makeId(prefix) { return `${prefix}${Date.now()}` }

export const usePackingStore = defineStore('packing', () => {
  const packings = ref([...PACKINGS])

  function getById(id) { return packings.value.find(p => p.id === id) }

  function createPacking(data) {
    // Support both the multi-row shape ({ inputs, outputs }) and the legacy
    // single-row shape ({ semiProductId, inputQty, fgQty, rejectedQty }).
    const inputs = (data.inputs && data.inputs.length)
      ? data.inputs.map(i => ({ semiProductId: i.semiProductId, inputQty: Number(i.inputQty) || 0 }))
      : [{ semiProductId: data.semiProductId, inputQty: Number(data.inputQty) || 0 }]
    const outputs = (data.outputs && data.outputs.length)
      ? data.outputs.map(o => ({
          productId: o.productId, fgQty: Number(o.fgQty) || 0, rejectedQty: Number(o.rejectedQty) || 0,
        }))
      : [{ productId: data.semiProductId, fgQty: Number(data.fgQty) || 0, rejectedQty: Number(data.rejectedQty) || 0 }]

    const inputQty = inputs.reduce((s, i) => s + i.inputQty, 0)
    const fgQty = outputs.reduce((s, o) => s + o.fgQty, 0)
    const rejectedQty = outputs.reduce((s, o) => s + o.rejectedQty, 0)

    const rec = {
      id: makeId('PK'),
      docNo: generatePackNo(),
      inputs,
      outputs,
      // aggregate fields kept for list/counts and backward compatibility
      semiProductId: inputs[0]?.semiProductId || null,
      inputQty,
      fgQty,
      rejectedQty,
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
