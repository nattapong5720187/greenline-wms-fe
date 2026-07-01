import apiClient from './axios'

export const apiGetUnits = () => apiClient.get('/api/units')
export const apiCreateUnit = (data) => apiClient.post('/api/units', data)
export const apiUpdateUnit = (id, data) => apiClient.put(`/api/units/${id}`, data)
export const apiDeleteUnit = (id) => apiClient.delete(`/api/units/${id}`)
