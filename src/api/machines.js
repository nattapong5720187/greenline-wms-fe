import apiClient from './axios'

export const apiGetMachines = () => apiClient.get('/api/machines')
export const apiGetMachine = (id) => apiClient.get(`/api/machines/${id}`)
export const apiCreateMachine = (data) => apiClient.post('/api/machines', data)
export const apiUpdateMachine = (id, data) => apiClient.put(`/api/machines/${id}`, data)
export const apiDeleteMachine = (id) => apiClient.delete(`/api/machines/${id}`)
