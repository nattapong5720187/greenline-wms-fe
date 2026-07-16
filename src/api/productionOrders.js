import apiClient from './axios'

export const apiGetProductionOrders = (params) => apiClient.get('/api/production-orders', { params })
export const apiGetProductionOrder = (id) => apiClient.get(`/api/production-orders/${id}`)
export const apiCreateProductionOrder = (data) => apiClient.post('/api/production-orders', data)
export const apiUpdateProductionOrder = (id, data) => apiClient.put(`/api/production-orders/${id}`, data)
export const apiDeleteProductionOrder = (id) => apiClient.delete(`/api/production-orders/${id}`)
