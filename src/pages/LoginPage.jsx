import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
    const { login, register, loading, updateUser } = useAuth()
    const navigate = useNavigate()
    const [googleLoading, setGoogleLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const getRedirectPath = (userData) => {
        return userData?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
    }

    useEffect(() => {
        const hash = window.location.hash || ''
        if (!hash.startsWith('#')) return

        const params = new URLSearchParams(hash.slice(1))
        const access = params.get('access')
        const refresh = params.get('refresh')

        if (!access || !refresh) return

        localStorage.setItem('tokens', JSON.stringify({ access, refresh }))
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)

        api.get('/accounts/profile/')
            .then(({ data }) => {
                localStorage.setItem('user', JSON.stringify(data))
                updateUser(data)
                navigate(getRedirectPath(data))
            })
            .catch(() => {
                localStorage.removeItem('tokens')
                localStorage.removeItem('user')
                toast.error('Google login failed')
            })
            .finally(() => {
                setGoogleLoading(false)
            })
    }, [navigate, updateUser])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isRegister) {
            const result = await register(form)
            if (result.success) {
                toast.success('Account created successfully!')
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
                navigate(getRedirectPath(savedUser))
            } else {
                const msg = typeof result.error === 'string'
                    ? result.error
                    : Object.values(result.error).flat().join(', ')
                toast.error(msg)
            }
        } else {
            const result = await login(form.username, form.password)
            if (result.success) {
                toast.success('Welcome back!')
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
                navigate(getRedirectPath(savedUser))
            } else {
                toast.error(result.error)
            }
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        try {
            const res = await fetch('/api/integrations/google/login/', { redirect: 'manual' })
            const contentType = res.headers.get('content-type') || ''

            if (res.ok && contentType.includes('application/json')) {
                const data = await res.json()
                const url = data.auth_url || data.url || data.authorization_url
                if (url) {
                    window.location.href = url
                    return
                }
            }

            const location = res.headers.get('location')
            if (location) {
                window.location.href = location
                return
            }
        } catch {
            // ignore and fall back to direct navigation
        }

        window.location.href = '/api/integrations/google/login/'
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-lg mb-4">
                        <span className="text-3xl font-bold text-white">B</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-purple-400 bg-clip-text text-transparent">
                        ByteSlot
                    </h1>
                    <p className="text-surface-400 mt-1">
                        {isRegister ? 'Create your account' : 'Sign in to your account'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isRegister && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">First Name</label>
                                    <input
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Last Name</label>
                                    <input
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">Username</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    className="input-field pl-11"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="input-field pl-11"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-surface-300">Password</label>
                                {!isRegister && (
                                    <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input-field pl-11"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        name="password_confirm"
                                        type="password"
                                        value={form.password_confirm}
                                        onChange={handleChange}
                                        className="input-field pl-11"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    {!isRegister && (
                        <div className="mt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-surface-800 flex-1" />
                                <span className="text-xs text-surface-500">or continue with</span>
                                <div className="h-px bg-surface-800 flex-1" />
                            </div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading || loading}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-surface-700 bg-surface-900/60 px-4 py-2.5 text-sm font-medium text-surface-200 hover:bg-surface-900 transition-colors disabled:opacity-50"
                            >
                                <FcGoogle className="w-4 h-4" />
                                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                        </button>
                    </div>
            </div>
        </div>
    </div>
    )
}

