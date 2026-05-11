import api from './axiosConfig'

export const activityApi = {
    getAll: () =>
        api.get('/activity')
            .then(r => {
                const data = r.data
                return Array.isArray(data) ? data : []
            })
            .catch(err => {
                console.error(
                    'Failed to fetch activity:', err)
                return []
            })
}