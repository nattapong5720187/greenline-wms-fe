import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },

      // Master Data
      { path: 'master/products', name: 'ProductList', component: () => import('@/views/master/ProductListView.vue') },
      { path: 'master/products/create', name: 'ProductCreate', component: () => import('@/views/master/ProductFormView.vue') },
      { path: 'master/products/:id/edit', name: 'ProductEdit', component: () => import('@/views/master/ProductFormView.vue') },
      { path: 'master/categories', name: 'Categories', component: () => import('@/views/master/CategoryView.vue') },
      { path: 'master/units', name: 'Units', component: () => import('@/views/master/UnitView.vue') },
      { path: 'master/warehouses', name: 'Warehouses', component: () => import('@/views/master/WarehouseView.vue') },
      { path: 'master/suppliers', name: 'Suppliers', component: () => import('@/views/master/SupplierView.vue') },

      // Admin
      { path: 'admin/users', name: 'Users', component: () => import('@/views/admin/UserRoleView.vue'), meta: { adminOnly: true } },

      // Documents
      { path: 'documents', name: 'DocumentList', component: () => import('@/views/documents/DocumentListView.vue') },
      { path: 'documents/receipt/create', name: 'ReceiptCreate', component: () => import('@/views/documents/GoodsReceiptView.vue') },
      { path: 'documents/requisition/create', name: 'RequisitionCreate', component: () => import('@/views/documents/RequisitionView.vue') },
      { path: 'documents/requisition/:id', name: 'RequisitionDetail', component: () => import('@/views/documents/RequisitionView.vue') },
      { path: 'documents/return/create', name: 'ReturnCreate', component: () => import('@/views/documents/ReturnView.vue') },
      { path: 'documents/:id', name: 'DocumentDetail', component: () => import('@/views/documents/DocumentDetailView.vue') },

      // Stock
      { path: 'stock/by-warehouse', name: 'StockByWarehouse', component: () => import('@/views/stock/StockByWarehouseView.vue') },
      { path: 'stock/lots', name: 'LotTracking', component: () => import('@/views/stock/LotTrackingView.vue') },
      { path: 'stock/hold', name: 'HoldManagement', component: () => import('@/views/stock/HoldView.vue') },
      { path: 'stock/reprocess', name: 'Reprocess', component: () => import('@/views/stock/ReprocessView.vue') },
      { path: 'stock/transfer', name: 'StockTransfer', component: () => import('@/views/stock/StockTransferView.vue') },
      { path: 'stock/min-stock', name: 'MinStock', component: () => import('@/views/stock/MinStockView.vue') },

      // Alerts
      { path: 'notifications', name: 'Notifications', component: () => import('@/views/NotificationCenterView.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'Login' }
  if (to.meta.adminOnly && !auth.isSuperAdmin) return { name: 'Dashboard' }
  if (to.path === '/login' && auth.isAuthenticated) return { name: 'Dashboard' }
})

export default router
