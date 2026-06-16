<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <transition name="fade" mode="out-in">
        <div v-if="!collapsed" key="full" class="logo-full">
          <img src="@/assets/img/logo.png" alt="Greenline WMS" class="logo-img" />
          <div class="logo-text">
            <span class="logo-main">Greenline</span>
            <span class="logo-sub">WMS</span>
          </div>
        </div>
        <div v-else key="icon" class="logo-icon">G</div>
      </transition>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="group in navGroups" :key="group.label" class="nav-group">
        <div v-if="!collapsed" class="nav-group-label">{{ group.label }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item) }"
          v-tooltip.right="collapsed ? item.label : null"
        >
          <i :class="['nav-icon', item.icon]" />
          <transition name="fade">
            <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          </transition>
          <span v-if="!collapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- Toggle -->
    <button class="sidebar-toggle" @click="$emit('toggle')">
      <i :class="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" />
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const route = useRoute()
const notifStore = useNotificationStore()

const navGroups = computed(() => [
  {
    label: 'ภาพรวม',
    items: [
      { to: '/dashboard', icon: 'pi pi-home', label: 'แดชบอร์ด' },
    ]
  },
  {
    label: 'Master Data',
    items: [
      { to: '/master/products',   icon: 'pi pi-box',       label: 'สินค้า / SKU' },
      { to: '/master/categories', icon: 'pi pi-tags',      label: 'ประเภทสินค้า' },
      { to: '/master/units',      icon: 'pi pi-calculator',label: 'หน่วยนับ' },
      { to: '/master/warehouses', icon: 'pi pi-building',  label: 'คลังสินค้า' },
      { to: '/master/suppliers',  icon: 'pi pi-truck',     label: 'ซัพพลายเออร์' },
    ]
  },
  {
    label: 'เอกสาร',
    items: [
      { to: '/documents',                 icon: 'pi pi-file',       label: 'รายการเอกสาร' },
      { to: '/documents/receipt/create',  icon: 'pi pi-download',   label: 'รับเข้า (GR)' },
      { to: '/documents/requisition/create', icon: 'pi pi-upload',  label: 'เบิก-จ่าย (RQ)' },
      { to: '/documents/return/create',   icon: 'pi pi-reply',      label: 'คืนสินค้า (RT)' },
    ]
  },
  {
    label: 'สต๊อก',
    items: [
      { to: '/stock/by-warehouse', icon: 'pi pi-warehouse', label: 'สต๊อกแยกคลัง' },
      { to: '/stock/lots',         icon: 'pi pi-list',      label: 'Lot Tracking' },
      { to: '/stock/hold',         icon: 'pi pi-lock',      label: 'Hold' },
      { to: '/stock/reprocess',    icon: 'pi pi-sync',      label: 'Reprocess' },
      { to: '/stock/transfer',     icon: 'pi pi-arrows-h',  label: 'ย้ายสต๊อก' },
      { to: '/stock/min-stock',    icon: 'pi pi-exclamation-triangle', label: 'ตั้ง Min Stock' },
    ]
  },
  {
    label: 'ระบบ',
    items: [
      { to: '/admin/users',    icon: 'pi pi-users',  label: 'ผู้ใช้ & สิทธิ์' },
      { to: '/notifications',  icon: 'pi pi-bell',   label: 'การแจ้งเตือน', badge: notifStore.unreadCount || null },
    ]
  }
])

function isActive(item) {
  if (item.to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(item.to)
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: var(--sidebar-w);
  background: var(--gl-sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.25s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}

.sidebar.collapsed { width: var(--sidebar-w-collapsed); }

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: var(--header-h);
}

.logo-icon {
  width: 38px; height: 38px;
  background: var(--gl-red);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(220,38,38,0.4);
}

.logo-full {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  height: 44px;
  width: auto;
  background: #fff;
  border-radius: 8px;
  padding: 5px 10px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-main { display: block; font-size: 15px; font-weight: 700; color: #fff; line-height: 1; }
.logo-sub  { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.5); letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-group { margin-bottom: 6px; }

.nav-group-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  padding: 10px 10px 4px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--gl-sidebar-text);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 400;
  margin-bottom: 1px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;
}

.nav-item:hover { background: var(--gl-sidebar-hover); color: #fff; }
.nav-item.active {
  background: var(--gl-sidebar-active);
  color: #fff;
  font-weight: 500;
  border-left: 3px solid var(--gl-red);
  padding-left: 7px;
}

.nav-icon { font-size: 14px; flex-shrink: 0; width: 18px; text-align: center; }
.nav-label { flex: 1; }

.nav-badge {
  background: var(--gl-red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: none;
  border: none;
  border-top: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-size: 13px;
  transition: color 0.15s;
}
.sidebar-toggle:hover { color: #fff; }

.fade-enter-active { transition: opacity 0.15s, width 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
