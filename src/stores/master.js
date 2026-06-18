import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  WAREHOUSES, CATEGORIES, UNITS, SUPPLIERS, PRODUCTS, USERS, MACHINES
} from '@/data/mockData'

function makeId(prefix) {
  return `${prefix}${Date.now()}`
}

export const useMasterStore = defineStore('master', () => {
  const warehouses = ref([...WAREHOUSES])
  const categories = ref([...CATEGORIES])
  const units = ref([...UNITS])
  const suppliers = ref([...SUPPLIERS])
  const products = ref([...PRODUCTS])
  const users = ref([...USERS])
  const machines = ref([...MACHINES])

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

  // ---- Users ----
  function addUser(data) {
    users.value.push({ ...data, id: makeId('USR'), active: true })
  }
  function updateUser(id, data) {
    const i = users.value.findIndex(u => u.id === id)
    if (i !== -1) users.value[i] = { ...users.value[i], ...data }
  }
  function deleteUser(id) {
    users.value = users.value.filter(u => u.id !== id)
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

  // ---- Helpers ----
  function getCategoryById(id) { return categories.value.find(c => c.id === id) }
  function getUnitById(id) { return units.value.find(u => u.id === id) }
  function getWarehouseById(id) { return warehouses.value.find(w => w.id === id) }
  function getSupplierById(id) { return suppliers.value.find(s => s.id === id) }
  function getProductById(id) { return products.value.find(p => p.id === id) }
  function getMachineById(id) { return machines.value.find(m => m.id === id) }

  return {
    warehouses, categories, units, suppliers, products, users, machines,
    addWarehouse, updateWarehouse, deleteWarehouse,
    addCategory, updateCategory, deleteCategory,
    addUnit, updateUnit, deleteUnit,
    addSupplier, updateSupplier, deleteSupplier,
    addProduct, updateProduct, deleteProduct,
    addUser, updateUser, deleteUser,
    addMachine, updateMachine, deleteMachine,
    getCategoryById, getUnitById, getWarehouseById, getSupplierById, getProductById, getMachineById,
  }
})
