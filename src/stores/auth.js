import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { USERS } from '@/data/mockData'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('gl_user') || 'null'))
  const token = ref(localStorage.getItem('gl_token') || null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
  const isWarehouseStaff = computed(() => user.value?.role === 'warehouse_staff')

  function login(username, password) {
    const found = USERS.find(u => u.username === username && u.password === password && u.active)
    if (!found) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    const { password: _, ...safeUser } = found
    user.value = safeUser
    token.value = `mock-token-${Date.now()}`
    localStorage.setItem('gl_user', JSON.stringify(safeUser))
    localStorage.setItem('gl_token', token.value)
    return safeUser
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('gl_user')
    localStorage.removeItem('gl_token')
  }

  function can(permission) {
    const rolePerms = {
      super_admin: ['*'],
      warehouse_staff: ['documents.read', 'documents.create', 'stock.read', 'stock.issue', 'stock.receipt', 'stock.return'],
      doc_control: ['documents.read', 'documents.create', 'master.read'],
    }
    const perms = rolePerms[user.value?.role] || []
    return perms.includes('*') || perms.includes(permission)
  }

  return { user, token, isAuthenticated, isSuperAdmin, isWarehouseStaff, login, logout, can }
})
