import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })
    const [loading, setLoading] = useState(false)

    const login = async (username, password) => {
        setLoading(true)
        try {
            const { data } = await api.post('/accounts/login/', { username, password })
            localStorage.setItem('tokens', JSON.stringify(data.tokens))
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed',
            }
        } finally {
            setLoading(false)
        }
    }

    const register = async (userData) => {
        setLoading(true)
        try {
            const { data } = await api.post('/accounts/register/', userData)
            localStorage.setItem('tokens', JSON.stringify(data.tokens))
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || 'Registration failed',
            }
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('tokens')
        localStorage.removeItem('user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
