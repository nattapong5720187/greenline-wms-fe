<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">สูตร / BOM</div>
        <div class="page-subtitle">จัดการสูตรการผลิตทั้งหมด ({{ filtered.length }} สูตร)</div>
      </div>
      <RouterLink to="/production/formulas/create">
        <Button label="เพิ่มสูตร" icon="pi pi-plus" class="btn-primary" />
      </RouterLink>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <span class="p-input-icon-left search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="ค้นหารหัส / ชื่อสูตร..." style="padding-left:2.2rem; width:280px;" />
        </span>
        <Dropdown v-model="filterActive" :options="activeOptions" optionLabel="label" optionValue="value"
          placeholder="ทุกสถานะ" showClear style="width:150px;" />
      </div>

      <DataTable :value="filtered" :paginator="true" :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first}–{last} จาก {totalRecords}" size="small" stripedRows>
        <Column field="code" header="รหัส" style="width:120px; font-family:monospace; font-size:12px;" sortable />
        <Column field="name" header="ชื่อสูตร" sortable />
        <Column header="ส่วนผสม" style="width:100px; text-align:center;">
          <template #body="{ data }">{{ data.ingredients.length }} รายการ</template>
        </Column>
        <Column header="Mixsize" style="width:200px;">
          <template #body="{ data }">
            <span v-if="!data.mixsizeIds || data.mixsizeIds.length === 0" style="color:var(--gl-text-muted); font-size:12px;">-</span>
            <div v-else style="display:flex; flex-wrap:wrap; gap:4px;">
              <span v-for="id in data.mixsizeIds" :key="id" class="mixsize-chip">
                {{ getMixsizeLabel(id) }}
              </span>
            </div>
          </template>
        </Column>
        <Column header="สถานะ" style="width:100px;">
          <template #body="{ data }">
            <span :class="['status-badge', data.active ? 'status-fg' : 'status-hold']">
              {{ data.active ? 'ใช้งาน' : 'ปิดใช้' }}
            </span>
          </template>
        </Column>
        <Column header="จัดการ" style="width:110px;">
          <template #body="{ data }">
            <div class="action-btns">
              <RouterLink :to="`/production/formulas/${data.id}/edit`">
                <Button icon="pi pi-pencil" size="small" text rounded />
              </RouterLink>
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useProductionStore } from '@/stores/production'
import { useMasterStore } from '@/stores/master'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const productionStore = useProductionStore()
const masterStore = useMasterStore()
const confirm = useConfirm()
const toast = useToast()

onMounted(() => {
  if (!masterStore.units.length) masterStore.fetchUnits()
})

function getMixsizeLabel(mixsizeId) {
  const mx = masterStore.getMixsizeById(mixsizeId)
  if (!mx) return mixsizeId
  const unit = masterStore.getUnitById(mx.unitId)
  return `${mx.size.toLocaleString()} ${unit?.abbr || ''}`
}

const search = ref('')
const filterActive = ref(null)

const activeOptions = [
  { label: 'ใช้งาน', value: true },
  { label: 'ปิดใช้', value: false },
]

const filtered = computed(() =>
  productionStore.formulas.filter(f => {
    const q = search.value.toLowerCase()
    const matchText = !q || f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
    const matchActive = filterActive.value === null || f.active === filterActive.value
    return matchText && matchActive
  })
)

function confirmDelete(formula) {
  confirm.require({
    message: `ต้องการลบสูตร "${formula.name}" ใช่หรือไม่?`,
    header: 'ยืนยันการลบ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      productionStore.deleteFormula(formula.id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', detail: formula.name, life: 3000 })
    }
  })
}
</script>

<style scoped>
.search-wrap { display: flex; align-items: center; position: relative; }
.search-wrap i { position: absolute; left: 0.75rem; z-index: 1; color: var(--gl-text-muted); }
.action-btns { display: flex; gap: 4px; }
.mixsize-chip {
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
