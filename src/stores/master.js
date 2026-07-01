import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MIXSIZES } from '@/data/mockData'
import { apiGetMachines, apiCreateMachine, apiUpdateMachine, apiDeleteMachine } from '@/api/machines'
import { apiGetWarehouses, apiCreateWarehouse, apiUpdateWarehouse, apiDeleteWarehouse } from '@/api/warehouses'
import { apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory } from '@/api/categories'
import { apiGetUnits, apiCreateUnit, apiUpdateUnit, apiDeleteUnit } from '@/api/units'
import { apiGetSuppliers, apiCreateSupplier, apiUpdateSupplier, apiDeleteSupplier } from '@/api/suppliers'
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct } from '@/api/products'
import { apiGetPackageSizes, apiCreatePackageSize, apiUpdatePackageSize, apiDeletePackageSize } from '@/api/packagingSizes'
import { apiGetBrands, apiCreateBrand, apiUpdateBrand, apiDeleteBrand } from '@/api/brands'

function makeId(prefix) {
  return `${prefix}${Date.now()}`
}

// The backend unit model has no separate abbreviation field — `code` (e.g. 'KG')
// doubles as the short label many other views display as `.abbr`.
function normalizeUnit(u) {
  return { ...u, abbr: u.code }
}

// The backend product model has no warehouseId/stockStatus/hasExpiry/active fields.
// Alias `sku`→`code` and `hasLot`→`requireLot` so the many other (still mock-based)
// views that read those names keep working unchanged.
function normalizeProduct(p) {
  return { ...p, code: p.sku, requireLot: p.hasLot, active: true }
}

export const useMasterStore = defineStore('master', () => {
  const warehouses = ref([])
  const warehousesLoading = ref(false)
  const categories = ref([])
  const categoriesLoading = ref(false)
  const units = ref([])
  const unitsLoading = ref(false)
  const mixsizes = ref([...MIXSIZES])
  const suppliers = ref([])
  const suppliersLoading = ref(false)
  const products = ref([])
  const productsLoading = ref(false)
  const machines = ref([])
  const machinesLoading = ref(false)
  const packagingSizes = ref([])
  const packagingSizesLoading = ref(false)
  const brands = ref([])
  const brandsLoading = ref(false)

  // ---- Warehouses ----
  async function fetchWarehouses() {
    warehousesLoading.value = true
    try {
      const { data } = await apiGetWarehouses()
      warehouses.value = data
    } finally {
      warehousesLoading.value = false
    }
  }
  async function addWarehouse(data) {
    const { data: created } = await apiCreateWarehouse(data)
    warehouses.value.push(created)
    return created
  }
  async function updateWarehouse(id, data) {
    const { data: updated } = await apiUpdateWarehouse(id, data)
    const i = warehouses.value.findIndex(w => w.id === id)
    if (i !== -1) warehouses.value[i] = updated
    return updated
  }
  async function deleteWarehouse(id) {
    await apiDeleteWarehouse(id)
    warehouses.value = warehouses.value.filter(w => w.id !== id)
  }

  // ---- Categories ----
  async function fetchCategories() {
    categoriesLoading.value = true
    try {
      const { data } = await apiGetCategories()
      categories.value = data
    } finally {
      categoriesLoading.value = false
    }
  }
  async function addCategory(data) {
    const { data: created } = await apiCreateCategory(data)
    categories.value.push(created)
    return created
  }
  async function updateCategory(id, data) {
    const { data: updated } = await apiUpdateCategory(id, data)
    const i = categories.value.findIndex(c => c.id === id)
    if (i !== -1) categories.value[i] = updated
    return updated
  }
  async function deleteCategory(id) {
    await apiDeleteCategory(id)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  // ---- Units ----
  async function fetchUnits() {
    unitsLoading.value = true
    try {
      const { data } = await apiGetUnits()
      units.value = data.map(normalizeUnit)
    } finally {
      unitsLoading.value = false
    }
  }
  async function addUnit(data) {
    const { data: created } = await apiCreateUnit(data)
    const normalized = normalizeUnit(created)
    units.value.push(normalized)
    return normalized
  }
  async function updateUnit(id, data) {
    const { data: updated } = await apiUpdateUnit(id, data)
    const normalized = normalizeUnit(updated)
    const i = units.value.findIndex(u => u.id === id)
    if (i !== -1) units.value[i] = normalized
    return normalized
  }
  async function deleteUnit(id) {
    await apiDeleteUnit(id)
    units.value = units.value.filter(u => u.id !== id)
  }

  // ---- Mixsizes (still mock — not backed by an API yet) ----
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
  async function fetchSuppliers() {
    suppliersLoading.value = true
    try {
      const { data } = await apiGetSuppliers()
      suppliers.value = data
    } finally {
      suppliersLoading.value = false
    }
  }
  async function addSupplier(data) {
    const { data: created } = await apiCreateSupplier(data)
    suppliers.value.push(created)
    return created
  }
  async function updateSupplier(id, data) {
    const { data: updated } = await apiUpdateSupplier(id, data)
    const i = suppliers.value.findIndex(s => s.id === id)
    if (i !== -1) suppliers.value[i] = updated
    return updated
  }
  async function deleteSupplier(id) {
    await apiDeleteSupplier(id)
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  // ---- Products ----
  async function fetchProducts() {
    productsLoading.value = true
    try {
      const { data } = await apiGetProducts()
      products.value = data.map(normalizeProduct)
    } finally {
      productsLoading.value = false
    }
  }
  async function addProduct(data) {
    const { data: created } = await apiCreateProduct(data)
    const normalized = normalizeProduct(created)
    products.value.push(normalized)
    return normalized
  }
  async function updateProduct(id, data) {
    const { data: updated } = await apiUpdateProduct(id, data)
    const normalized = normalizeProduct(updated)
    const i = products.value.findIndex(p => p.id === id)
    if (i !== -1) products.value[i] = normalized
    return normalized
  }
  async function deleteProduct(id) {
    await apiDeleteProduct(id)
    products.value = products.value.filter(p => p.id !== id)
  }

  // ---- Machines ----
  async function fetchMachines() {
    machinesLoading.value = true
    try {
      const { data } = await apiGetMachines()
      machines.value = data
    } finally {
      machinesLoading.value = false
    }
  }
  async function addMachine(data) {
    const { data: created } = await apiCreateMachine(data)
    machines.value.push(created)
    return created
  }
  async function updateMachine(id, data) {
    const { data: updated } = await apiUpdateMachine(id, data)
    const i = machines.value.findIndex(m => m.id === id)
    if (i !== -1) machines.value[i] = updated
    return updated
  }
  async function deleteMachine(id) {
    await apiDeleteMachine(id)
    machines.value = machines.value.filter(m => m.id !== id)
  }

  // ---- Packaging Sizes ----
  async function fetchPackagingSizes() {
    packagingSizesLoading.value = true
    try {
      const { data } = await apiGetPackageSizes()
      packagingSizes.value = data
    } finally {
      packagingSizesLoading.value = false
    }
  }
  async function addPackagingSize(data) {
    const { data: created } = await apiCreatePackageSize(data)
    packagingSizes.value.push(created)
    return created
  }
  async function updatePackagingSize(id, data) {
    const { data: updated } = await apiUpdatePackageSize(id, data)
    const i = packagingSizes.value.findIndex(p => p.id === id)
    if (i !== -1) packagingSizes.value[i] = updated
    return updated
  }
  async function deletePackagingSize(id) {
    await apiDeletePackageSize(id)
    packagingSizes.value = packagingSizes.value.filter(p => p.id !== id)
  }
  function getPackagingSizeById(id) { return packagingSizes.value.find(p => p.id === id) }

  // ---- Brands ----
  async function fetchBrands() {
    brandsLoading.value = true
    try {
      const { data } = await apiGetBrands()
      brands.value = data
    } finally {
      brandsLoading.value = false
    }
  }
  async function addBrand(data) {
    const { data: created } = await apiCreateBrand(data)
    brands.value.push(created)
    return created
  }
  async function updateBrand(id, data) {
    const { data: updated } = await apiUpdateBrand(id, data)
    const i = brands.value.findIndex(b => b.id === id)
    if (i !== -1) brands.value[i] = updated
    return updated
  }
  async function deleteBrand(id) {
    await apiDeleteBrand(id)
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

  // Load all backend-driven master data as soon as the store is created so any
  // view referencing masterStore.<resource> has data without an explicit fetch.
  fetchWarehouses().catch((e) => console.error('Failed to load warehouses', e))
  fetchCategories().catch((e) => console.error('Failed to load categories', e))
  fetchUnits().catch((e) => console.error('Failed to load units', e))
  fetchSuppliers().catch((e) => console.error('Failed to load suppliers', e))
  fetchProducts().catch((e) => console.error('Failed to load products', e))
  fetchMachines().catch((e) => console.error('Failed to load machines', e))
  fetchPackagingSizes().catch((e) => console.error('Failed to load packaging sizes', e))
  fetchBrands().catch((e) => console.error('Failed to load brands', e))

  return {
    warehouses, warehousesLoading, categories, categoriesLoading, units, unitsLoading,
    suppliers, suppliersLoading, products, productsLoading, machines, machinesLoading, mixsizes,
    packagingSizes, packagingSizesLoading, brands, brandsLoading,

    fetchWarehouses, addWarehouse, updateWarehouse, deleteWarehouse,
    fetchCategories, addCategory, updateCategory, deleteCategory,
    fetchUnits, addUnit, updateUnit, deleteUnit,
    addMixsize, updateMixsize, deleteMixsize, getMixsizeById,
    fetchSuppliers, addSupplier, updateSupplier, deleteSupplier,
    fetchProducts, addProduct, updateProduct, deleteProduct,

    fetchMachines, addMachine, updateMachine, deleteMachine,
    fetchPackagingSizes, addPackagingSize, updatePackagingSize, deletePackagingSize, getPackagingSizeById,
    fetchBrands, addBrand, updateBrand, deleteBrand, getBrandById,
    getCategoryById, getUnitById, getWarehouseById, getSupplierById, getProductById, getMachineById,
  }
})
