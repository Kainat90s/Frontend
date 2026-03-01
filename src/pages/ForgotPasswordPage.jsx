import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineKey, HiOutlineCheckCircle, HiOutlineShieldCheck, HiOutlineX } from 'react-icons/hi'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // 1: Request Email, 2: Email Sent, 3: Magic Link Arrived, 4: Enter New Password
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [form, setForm] = useState({
        token: '',
        new_password: '',
        password_confirm: '',
    })

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        const emailParam = searchParams.get('email')

        if (tokenParam && emailParam) {
            setEmail(emailParam)
            setForm(prev => ({ ...prev, token: tokenParam }))
            setStep(3) // Jump to the "Yes, it's me" confirmation step
        }
    }, [searchParams])

    const handleRequestReset = async (e) => {
        e.preventDefault()
        if (!email) {
            toast.error('Please enter your email')
            return
        }
        setLoading(true)
        try {
            await api.post('/accounts/password-reset/request/', { email })
            toast.success('Reset code sent to your email!')
            setStep(2) // Jump to the "Email Sent" confirmation step
        } catch (error) {
            toast.error(error.response?.data?.detail || error.response?.data?.email?.[0] || 'Failed to request reset')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmReset = async (e) => {
        e.preventDefault()
        if (form.new_password !== form.password_confirm) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await api.post('/accounts/password-reset/confirm/', {
                email,
                ...form
            })
            toast.success('Password reset successfully! You can now log in.')
            navigate('/login')
        } catch (error) {
            // Usually this occurs if they click the button twice or the token is expired/invalid
            toast.error(error.response?.data?.detail || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    // Helper to render titles based on step
    const getHeader = () => {
        switch (step) {
            case 1: return { title: 'Reset your password', desc: 'Enter your email to receive a secure link' }
            case 2: return { title: 'Check your email', desc: 'We sent a reset link to your inbox' }
            case 3: return { title: 'Verify request', desc: 'Did you request this password reset?' }
            case 4: return { title: 'Create new password', desc: 'Enter your new credentials below' }
            default: return { title: 'ByteSlot', desc: '' }
        }
    }

    const header = getHeader()

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-surface-950">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo and Dynamic Headers */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-lg mb-4">
                        <span className="text-3xl font-bold text-white">B</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-purple-400 bg-clip-text text-transparent mb-2">
                        {header.title}
                    </h1>
                    <p className="text-surface-400">
                        {header.desc}
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">

                    {/* STEP 1: Enter Email */}
                    {step === 1 && (
                        <form onSubmit={handleRequestReset} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-11"
                                        placeholder="Enter your registered email"
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
                                Send Magic Link
                            </button>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-sm text-surface-400 hover:text-surface-300 transition-colors">
                                    ← Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Email Sent UI */}
                    {step === 2 && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <HiOutlineCheckCircle className="w-20 h-20 text-green-500 animate-slide-up" />
                            </div>
                            <div>
                                <p className="text-surface-300 mb-2">We sent a magic link to:</p>
                                <p className="text-lg font-medium text-white">{email}</p>
                            </div>
                            <p className="text-sm text-surface-400">
                                Click the link in the email to safely reset your password. The link will expire in 15 minutes.
                            </p>
                            <Link
                                to="/login"
                                className="btn-secondary w-full flex items-center justify-center block"
                            >
                                Return to Sign In
                            </Link>
                        </div>
                    )}

                    {/* STEP 3: "Yes, it's me" prompt */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <HiOutlineShieldCheck className="w-20 h-20 text-primary-500 animate-slide-up" />
                            </div>
                            <div>
                                <p className="text-surface-300 text-sm">You arrived via a magic link for:</p>
                                <p className="text-lg font-medium text-white mt-1">{email}</p>
                            </div>
                            <div className="flex flex-col gap-3 mt-8">
                                <button
                                    onClick={() => setStep(4)}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                    Yes, it's me
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="btn-danger-outline w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium transition-all"
                                >
                                    <HiOutlineX className="w-5 h-5" />
                                    No, ignore this
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Enter New Password */}
                    {step === 4 && (
                        <form onSubmit={handleConfirmReset} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="password"
                                        value={form.new_password}
                                        onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                                        className="input-field pl-11"
                                        placeholder="••••••••"
                                        minLength="8"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm New Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="password"
                                        value={form.password_confirm}
                                        onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                                        className="input-field pl-11"
                                        placeholder="••••••••"
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
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
