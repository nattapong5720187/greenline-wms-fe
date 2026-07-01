import apiClient from './axios'

export const apiGetCategories = () => apiClient.get('/api/categories')
export const apiCreateCategory = (data) => apiClient.post('/api/categories', data)
export const apiUpdateCategory = (id, data) => apiClient.put(`/api/categories/${id}`, data)
export const apiDeleteCategory = (id) => apiClient.delete(`/api/categories/${id}`)
