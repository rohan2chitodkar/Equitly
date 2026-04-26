import api from './axiosConfig'

export const expenseApi = {
  getAll: () => api.get('/expenses').then(r => r.data),
  getById: (id) => api.get(`/expenses/${id}`).then(r => r.data),
  getByGroup: (groupId) => api.get(`/expenses?groupId=${groupId}`).then(r => r.data),
  create: (payload) => api.post('/expenses', payload).then(r => r.data),
  update: (id, payload) => api.put(`/expenses/${id}`, payload).then(r => r.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(r => r.data),
  getActivity: () => api.get('/expenses/activity').then(r => r.data)
}
