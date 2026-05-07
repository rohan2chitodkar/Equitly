import api from './axiosConfig'

export const groupApi = {
    getAll: () => api.get('/groups').then(r => {
        const data = r.data
        if (Array.isArray(data)) return data
        if (data && Array.isArray(data.content)) return data.content
        return []
    }),
    getById: (id) => api.get(`/groups/${id}`).then(r => r.data),
    create: (payload) => api.post('/groups', payload).then(r => r.data),
    update: (id, payload) => api.put(`/groups/${id}`, payload).then(r => r.data),
    delete: (id) => api.delete(`/groups/${id}`).then(r => r.data),
    addMember: (groupId, email) =>
        api.post(`/groups/${groupId}/members`, { email }).then(r => r.data),
    removeMember: (groupId, userId) =>
        api.delete(`/groups/${groupId}/members/${userId}`).then(r => r.data),
    getBalances: (groupId) =>
        api.get(`/groups/${groupId}/balances`).then(r => {
            const data = r.data
            return Array.isArray(data) ? data : []
        }),
    leave: (groupId) =>
        api.post(`/groups/${groupId}/leave`).then(r => r.data),
    checkSettled: (groupId) =>
        api.get(`/groups/${groupId}/settled`)
            .then(r => r.data)
            .catch(() => ({
                fullySettled: false,
                memberSettled: false
            }
        )
    )
}