import apiClient from './axios'

export const apiGetProducts = () => apiClient.get('/api/products')
export const apiCreateProduct = (data) => apiClient.post('/api/products', data)
export const apiUpdateProduct = (id, data) => apiClient.put(`/api/products/${id}`, data)
export const apiDeleteProduct = (id) => apiClient.delete(`/api/products/${id}`)
