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
