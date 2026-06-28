import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  WAREHOUSES, CATEGORIES, UNITS, SUPPLIERS, PRODUCTS, MACHINES, MIXSIZES,
  PACKAGING_SIZES, BRANDS
} from '@/data/mockData'

function makeId(prefix) {
  return `${prefix}${Date.now()}`
}

export const useMasterStore = defineStore('master', () => {
  const warehouses = ref([...WAREHOUSES])
  const categories = ref([...CATEGORIES])
  const units = ref([...UNITS])
  const mixsizes = ref([...MIXSIZES])
  const suppliers = ref([...SUPPLIERS])
  const products = ref([...PRODUCTS])
  const machines = ref([...MACHINES])
  const packagingSizes = ref([...PACKAGING_SIZES])
  const brands = ref([...BRANDS])

  // ---- Warehouses ----
  function addWarehouse(data) {
    warehouses.value.push({ ...data, id: makeId('WH'), active: true })
  }
  function updateWarehouse(id, data) {
    const i = warehouses.value.findIndex(w => w.id === id)
    if (i !== -1) warehouses.value[i] = { ...warehouses.value[i], ...data }
  }
  function deleteWarehouse(id) {
    warehouses.value = warehouses.value.filter(w => w.id !== id)
  }

  // ---- Categories ----
  function addCategory(data) {
    categories.value.push({ ...data, id: makeId('CAT') })
  }
  function updateCategory(id, data) {
    const i = categories.value.findIndex(c => c.id === id)
    if (i !== -1) categories.value[i] = { ...categories.value[i], ...data }
  }
  function deleteCategory(id) {
    categories.value = categories.value.filter(c => c.id !== id)
  }

  // ---- Units ----
  function addUnit(data) {
    units.value.push({ ...data, id: makeId('U') })
  }
  function updateUnit(id, data) {
    const i = units.value.findIndex(u => u.id === id)
    if (i !== -1) units.value[i] = { ...units.value[i], ...data }
  }
  function deleteUnit(id) {
    units.value = units.value.filter(u => u.id !== id)
  }

  // ---- Mixsizes ----
  function addMixsize(data) {
    mixsizes.value.push({ ...data, id: makeId('MX') })
  }
  function updateMixsize(id, data) {
    const i = mixsizes.value.findIndex(m => m.id === id)
    if (i !== -1) mixsizes.value[i] = { ...mixsizes.value[i], ...data }
  }
  function deleteMixsize(id) {
    mixsizes.value = mixsizes.value.filter(m => m.id !== id)
  }
  function getMixsizeById(id) { return mixsizes.value.find(m => m.id === id) }

  // ---- Suppliers ----
  function addSupplier(data) {
    suppliers.value.push({ ...data, id: makeId('SUP'), active: true })
  }
  function updateSupplier(id, data) {
    const i = suppliers.value.findIndex(s => s.id === id)
    if (i !== -1) suppliers.value[i] = { ...suppliers.value[i], ...data }
  }
  function deleteSupplier(id) {
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  // ---- Products ----
  function addProduct(data) {
    products.value.push({ ...data, id: makeId('P'), active: true })
  }
  function updateProduct(id, data) {
    const i = products.value.findIndex(p => p.id === id)
    if (i !== -1) products.value[i] = { ...products.value[i], ...data }
  }
  function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
  }


  // ---- Machines ----
  function addMachine(data) {
    machines.value.push({ ...data, id: makeId('MC'), active: true })
  }
  function updateMachine(id, data) {
    const i = machines.value.findIndex(m => m.id === id)
    if (i !== -1) machines.value[i] = { ...machines.value[i], ...data }
  }
  function deleteMachine(id) {
    machines.value = machines.value.filter(m => m.id !== id)
  }

  // ---- Packaging Sizes ----
  function addPackagingSize(data) {
    packagingSizes.value.push({ ...data, id: makeId('PKG') })
  }
  function updatePackagingSize(id, data) {
    const i = packagingSizes.value.findIndex(p => p.id === id)
    if (i !== -1) packagingSizes.value[i] = { ...packagingSizes.value[i], ...data }
  }
  function deletePackagingSize(id) {
    packagingSizes.value = packagingSizes.value.filter(p => p.id !== id)
  }
  function getPackagingSizeById(id) { return packagingSizes.value.find(p => p.id === id) }

  // ---- Brands ----
  function addBrand(data) {
    brands.value.push({ ...data, id: makeId('BR') })
  }
  function updateBrand(id, data) {
    const i = brands.value.findIndex(b => b.id === id)
    if (i !== -1) brands.value[i] = { ...brands.value[i], ...data }
  }
  function deleteBrand(id) {
    brands.value = brands.value.filter(b => b.id !== id)
  }
  function getBrandById(id) { return brands.value.find(b => b.id === id) }

  // ---- Helpers ----
  function getCategoryById(id) { return categories.value.find(c => c.id === id) }
  function getUnitById(id) { return units.value.find(u => u.id === id) }
  function getWarehouseById(id) { return warehouses.value.find(w => w.id === id) }
  function getSupplierById(id) { return suppliers.value.find(s => s.id === id) }
  function getProductById(id) { return products.value.find(p => p.id === id) }
  function getMachineById(id) { return machines.value.find(m => m.id === id) }

  return {
    warehouses, categories, units, suppliers, products, machines, mixsizes,
    packagingSizes, brands,
    addWarehouse, updateWarehouse, deleteWarehouse,
    addCategory, updateCategory, deleteCategory,
    addUnit, updateUnit, deleteUnit,
    addMixsize, updateMixsize, deleteMixsize, getMixsizeById,
    addSupplier, updateSupplier, deleteSupplier,
    addProduct, updateProduct, deleteProduct,

    addMachine, updateMachine, deleteMachine,
    addPackagingSize, updatePackagingSize, deletePackagingSize, getPackagingSizeById,
    addBrand, updateBrand, deleteBrand, getBrandById,
    getCategoryById, getUnitById, getWarehouseById, getSupplierById, getProductById, getMachineById,
  }
})
