import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
        || 'http://localhost:8081/api'
})

// ── Add JWT token to every request ──
api.interceptors.request.use(config => {
    const token = localStorage.getItem('se_token')
    if (token) {
        config.headers.Authorization =
            `Bearer ${token}`
    }
    return config
}, error => Promise.reject(error))

// ── Handle 401/403 responses ──
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 ||
            error.response?.status === 403) {
            // Clear token and redirect to login
            localStorage.removeItem('se_token')
            localStorage.removeItem('se_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api