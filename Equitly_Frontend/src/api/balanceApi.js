import api from './axiosConfig'

export const balanceApi = {
  getAll: () => api.get('/balances').then(r => r.data),
  settle: (payload) => api.post('/balances/settle', payload).then(r => r.data)
}
