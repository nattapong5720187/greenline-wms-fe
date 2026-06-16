<template>
  <div class="app-layout">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <div class="app-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <AppHeader />
      <main class="page-body">
        <transition name="fade" mode="out-in">
          <RouterView :key="route.fullPath" />
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const sidebarCollapsed = ref(false)
const route = useRoute()
</script>

<style scoped>
.app-header-spacer { height: var(--header-h); }
</style>
