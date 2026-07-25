import apiClient from './axios'

// GET /products is paginated: params { page, limit, title, sku, categoryIds }.
// `categoryIds` is sent CSV (e.g. "1,2") — the backend accepts CSV or repeated.
export const apiGetProducts = (params) => apiClient.get('/api/products', { params })
export const apiCreateProduct = (data) => apiClient.post('/api/products', data)
export const apiUpdateProduct = (id, data) => apiClient.put(`/api/products/${id}`, data)
export const apiDeleteProduct = (id) => apiClient.delete(`/api/products/${id}`)
