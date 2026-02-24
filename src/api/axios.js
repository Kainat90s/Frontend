import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')
    if (tokens.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`
    }
    return config
})

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')
            if (tokens.refresh) {
                try {
                    const { data } = await axios.post('/api/accounts/token/refresh/', {
                        refresh: tokens.refresh,
                    })
                    localStorage.setItem('tokens', JSON.stringify({
                        ...tokens,
                        access: data.access,
                    }))
                    originalRequest.headers.Authorization = `Bearer ${data.access}`
                    return api(originalRequest)
                } catch {
                    localStorage.removeItem('tokens')
                    localStorage.removeItem('user')
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

export default api
