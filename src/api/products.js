import apiClient from './axios'

// GET /products is paginated: params { page, limit, title, sku, categoryIds, isDelete }.
// `categoryIds` is sent CSV (e.g. "1,2") — the backend accepts CSV or repeated.
// `isDelete` is TRI-STATE: true = only deleted, false = only live, omitted =
// both. Omitting it is not the same as "live only", so every caller has to be
// explicit about which it wants.
export const apiGetProducts = (params) => apiClient.get('/api/products', { params })
export const apiCreateProduct = (data) => apiClient.post('/api/products', data)
export const apiUpdateProduct = (id, data) => apiClient.put(`/api/products/${id}`, data)
export const apiDeleteProduct = (id) => apiClient.delete(`/api/products/${id}`)
// Undo a soft delete. 409 when a live product has taken the sku meanwhile —
// sku is unique among live products only, so deleting one frees its sku.
// The empty object matters: Fastify rejects a JSON content-type with no body,
// and axios sets that content-type for PATCH.
export const apiRestoreProduct = (id) => apiClient.patch(`/api/products/${id}/restore`, {})
