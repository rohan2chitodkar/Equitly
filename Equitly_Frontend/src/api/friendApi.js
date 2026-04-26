export const friendApi = {
    getAll: () => api.get('/friends').then(r => {
        const data = r.data
        return Array.isArray(data) ? data : []
    }),
    add: (email) => api.post('/friends', { email }).then(r => r.data),
    remove: (friendId) => api.delete(`/friends/${friendId}`).then(r => r.data)
}