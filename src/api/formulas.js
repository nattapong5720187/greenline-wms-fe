import apiClient from './axios'

export const apiGetFormulas = () => apiClient.get('/api/formulas')
export const apiGetFormula = (id) => apiClient.get(`/api/formulas/${id}`)
export const apiCreateFormula = (data) => apiClient.post('/api/formulas', data)
export const apiUpdateFormula = (id, data) => apiClient.put(`/api/formulas/${id}`, data)
export const apiDeleteFormula = (id) => apiClient.delete(`/api/formulas/${id}`)
