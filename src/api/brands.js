import apiClient from './axios'

export const apiGetBrands = () => apiClient.get('/api/brands')
export const apiCreateBrand = (data) => apiClient.post('/api/brands', data)
export const apiUpdateBrand = (id, data) => apiClient.put(`/api/brands/${id}`, data)
export const apiDeleteBrand = (id) => apiClient.delete(`/api/brands/${id}`)
