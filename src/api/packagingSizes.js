import apiClient from './axios'

export const apiGetPackageSizes = () => apiClient.get('/api/package-sizes')
export const apiCreatePackageSize = (data) => apiClient.post('/api/package-sizes', data)
export const apiUpdatePackageSize = (id, data) => apiClient.put(`/api/package-sizes/${id}`, data)
export const apiDeletePackageSize = (id) => apiClient.delete(`/api/package-sizes/${id}`)
