import apiClient from './axios'

export const apiGetSuppliers = () => apiClient.get('/api/suppliers')
export const apiCreateSupplier = (data) => apiClient.post('/api/suppliers', data)
export const apiUpdateSupplier = (id, data) => apiClient.put(`/api/suppliers/${id}`, data)
export const apiDeleteSupplier = (id) => apiClient.delete(`/api/suppliers/${id}`)
