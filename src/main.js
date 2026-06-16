import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import 'primeicons/primeicons.css'
import '@/assets/main.css'

import App from './App.vue'
import router from './router'

const GreenlineTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '#0D2461',
      600: '#0b1f56',
      700: '#091847',
      800: '#07133a',
      900: '#040e2b',
      950: '#02091e',
    },
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: GreenlineTheme,
    options: { darkModeSelector: '.dark-mode' }
  },
  locale: {
    accept: 'ยืนยัน',
    reject: 'ยกเลิก',
    emptyMessage: 'ไม่พบข้อมูล',
  }
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
