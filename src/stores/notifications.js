import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { NOTIFICATIONS } from '@/data/mockData'
import { useMasterStore } from './master'
import { useStockStore } from './stock'

function makeId() { return `N${Date.now()}` }

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([...NOTIFICATIONS])

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
  }

  function addNotification(data) {
    notifications.value.unshift({ ...data, id: makeId(), createdAt: new Date().toISOString(), read: false })
  }

  // Check min stock and generate notifications
  function checkMinStock() {
    const master = useMasterStore()
    const stock = useStockStore()
    master.products.forEach(product => {
      const qty = stock.getAllQty(product.id)
      if (product.minStock && qty < product.minStock) {
        const unit = master.getUnitById(product.unitId)
        const existing = notifications.value.find(
          n => n.type === 'min_stock' && n.productId === product.id && !n.read
        )
        if (!existing) {
          addNotification({
            type: 'min_stock',
            productId: product.id,
            warehouseId: product.warehouseId,
            message: `สต๊อก ${product.name} ต่ำกว่าขั้นต่ำ (${qty} < ${product.minStock} ${unit?.abbr || ''})`,
          })
        }
      }
    })
  }

  function deleteNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications, unreadCount,
    markRead, markAllRead, addNotification, checkMinStock, deleteNotification,
  }
})
