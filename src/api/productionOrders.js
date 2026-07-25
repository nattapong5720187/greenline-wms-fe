import apiClient from './axios'

export const apiGetProductionOrders = (params) => apiClient.get('/api/production-orders', { params })
export const apiGetProductionOrder = (id) => apiClient.get(`/api/production-orders/${id}`)
export const apiCreateProductionOrder = (data) => apiClient.post('/api/production-orders', data)
export const apiUpdateProductionOrder = (id, data) => apiClient.put(`/api/production-orders/${id}`, data)
export const apiDeleteProductionOrder = (id) => apiClient.delete(`/api/production-orders/${id}`)
// Replace one stage's (1 or 2) mix records. Body is the array of records itself.
export const apiReplaceMixRecords = (id, records) => apiClient.put(`/api/production-orders/${id}/mix-record`, records)
