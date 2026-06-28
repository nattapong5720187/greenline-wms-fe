import apiClient from './axios'

export const apiGetRoles = () => apiClient.get('/api/roles')
export const apiGetUsers = () => apiClient.get('/api/users')
export const apiCreateUser = (data) => apiClient.post('/api/users', data)
export const apiUpdateUser = (id, data) => apiClient.put(`/api/users/${id}`, data)
export const apiDeleteUser = (id) => apiClient.delete(`/api/users/${id}`)
