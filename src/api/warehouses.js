import apiClient from './axios'

export const apiGetWarehouses = () => apiClient.get('/api/warehouses')
export const apiCreateWarehouse = (data) => apiClient.post('/api/warehouses', data)
export const apiUpdateWarehouse = (id, data) => apiClient.put(`/api/warehouses/${id}`, data)
export const apiDeleteWarehouse = (id) => apiClient.delete(`/api/warehouses/${id}`)
