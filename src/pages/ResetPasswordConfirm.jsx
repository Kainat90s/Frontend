import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { HiOutlineLockClosed } from 'react-icons/hi'

export default function ResetPasswordConfirm() {
    const { uid, token } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        new_password1: '',
        new_password2: '',
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.new_password1 !== form.new_password2) {
            toast.error('Passwords do not match')
            return
        }
        if (!uid || !token) {
            toast.error('Invalid reset link')
            return
        }
        setLoading(true)
        try {
            await axios.post(
                `http://localhost:8000/api/accounts/password-reset-confirm/${uid}/${token}/`,
                {
                    new_password1: form.new_password1,
                    new_password2: form.new_password2,
                }
            )
            toast.success('Password reset successful. Please log in.')
            navigate('/login')
        } catch (error) {
            const msg =
                error.response?.data?.new_password2?.[0] ||
                error.response?.data?.new_password1?.[0] ||
                error.response?.data?.detail ||
                'Failed to reset password'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-surface-950">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-lg mb-4">
                        <span className="text-3xl font-bold text-white">B</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-purple-400 bg-clip-text text-transparent mb-2">
                        Create new password
                    </h1>
                    <p className="text-surface-400">
                        Choose a strong password for your ByteSlot account
                    </p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type="password"
                                    value={form.new_password1}
                                    onChange={(e) => setForm({ ...form, new_password1: e.target.value })}
                                    className="input-field pl-11"
                                    placeholder="********"
                                    minLength="8"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type="password"
                                    value={form.new_password2}
                                    onChange={(e) => setForm({ ...form, new_password2: e.target.value })}
                                    className="input-field pl-11"
                                    placeholder="********"
                                    minLength="8"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Update Password
                        </button>

                        <div className="mt-4 text-center">
                            <Link to="/login" className="text-sm text-surface-400 hover:text-surface-300 transition-colors">
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
