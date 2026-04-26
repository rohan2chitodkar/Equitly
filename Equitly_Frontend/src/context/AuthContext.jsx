import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('se_token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('se_user')
    return u ? JSON.parse(u) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
        const data = await authApi.login({ email, password })
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('se_token', data.token)
        localStorage.setItem('se_user', JSON.stringify(data.user))
        return true
    } catch (err) {
        // Show exact error from backend
        const message = err.response?.data?.message
            || 'Login failed. Please try again.'
        toast.error(message)
        return false
    } finally {
        setLoading(false)
    }
}

const register = async (name, email, password) => {
    setLoading(true)
    try {
        const data = await authApi.register({ name, email, password })
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('se_token', data.token)
        localStorage.setItem('se_user', JSON.stringify(data.user))
        return true
    } catch (err) {
        const message = err.response?.data?.message
            || 'Registration failed. Please try again.'
        toast.error(message)
        return false
    } finally {
        setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('se_token')
    localStorage.removeItem('se_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
