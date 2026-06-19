# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (default port 5173, configurable via PORT env)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

There is no test runner, linter, or formatter configured. The only tooling is Vite.

## Stack

Vue 3 (Composition API, `<script setup>` exclusively) · Vite · Pinia · Vue Router (hash history) · PrimeVue 4 (Aura preset) · `@vueuse/core`. The `@` alias resolves to `src/`. UI text is Thai throughout.

## Architecture

This is a **frontend-only prototype with no backend**. Every "API" is simulated in-memory.

### Mock data is the source of truth
`src/data/mockData.js` exports all seed arrays (`USERS`, `PRODUCTS`, `WAREHOUSES`, `CATEGORIES`, `UNITS`, `MACHINES`, `MIXSIZES`, `SUPPLIERS`, `STOCK`, `LOTS`, `FORMULAS`, `PRODUCTION_ORDERS`, `DOCUMENTS`, etc.) plus number generators (`generateDocNo`, `generatePONo`). Each Pinia store copies these arrays into `ref`s at init (`ref([...PRODUCTS])`) and mutates the local copy — **state is not persisted and resets on reload** (except auth, see below). New records get IDs via a `makeId(prefix)` helper using `Date.now()`. When adding a domain entity, add its seed array to `mockData.js` and follow the existing add/update/delete + `getXById` pattern in the relevant store.

### Stores (`src/stores/`) and cross-store dependencies
Each store owns one domain: `auth`, `master` (products/categories/units/warehouses/suppliers/machines/mixsizes/users), `stock`, `documents`, `production`, `packing`, `notifications`. Stores call other stores inside actions rather than at module scope — e.g. `production` and `documents` call `useStockStore()` to deduct/add stock and FIFO-match lots. Stock lots are consumed **FIFO by `receiveDate`** (`stock.getLotsForProduct`, `production.matchLots` / `matchLotsForMixsize`).

### Auth & permissions
`stores/auth.js` validates credentials against the `USERS` mock array and persists a fake token + user to `localStorage` (`gl_token`, `gl_user`) — this is the only state that survives reload. Roles: `super_admin`, `warehouse_staff`, `doc_control`. Permission checks go through `auth.can('domain.action')` (wildcard `*` for super_admin); the route guard in `src/router/index.js` enforces `meta.requiresAuth`, `meta.public`, and `meta.adminOnly` (super_admin only) in `router.beforeEach`.

### Routing & layout
`src/router/index.js` is the full route map (all views lazy-loaded). Authenticated routes are children of `components/layout/AppLayout.vue` (sidebar + header shell); `LoginView` is the only public route. Views are grouped by domain folders under `src/views/`: `master/`, `documents/`, `stock/`, `production/`, `admin/`. The app is mounted in `src/main.js`, which also registers the custom **GreenlineTheme** PrimeVue preset (indigo-based primary `#0D2461`) and the global Toast/Confirmation services consumed in `App.vue`.

### Domain notes
Products carry a `stockStatus` of `RM` (raw material), `Semi`, or `FG` (finished goods). Categories drive `requireLot` / `hasExpiry` behavior. Production flows from **formulas → production orders → process (with mixsizes/machines) → packing → report**. Documents (`receipt` / `requisition` / `return`) move stock through the stock store.
