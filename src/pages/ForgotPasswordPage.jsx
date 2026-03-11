import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineCheckCircle } from 'react-icons/hi'

export default function ForgotPasswordPage() {
    // 1: Request Email, 2: Email Sent
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')

    const handleRequestReset = async (e) => {
        e.preventDefault()
        if (!email) {
            toast.error('Please enter your email')
            return
        }
        setLoading(true)
        try {
            await axios.post('http://localhost:8000/api/accounts/password-reset/', { email })
            toast.success('Reset link sent to your email!')
            setStep(2) // Jump to the "Email Sent" confirmation step
        } catch (error) {
            const msg = error.response?.data?.email?.[0] || error.response?.data?.detail || 'Email not found'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    // Helper to render titles based on step
    const getHeader = () => {
        switch (step) {
            case 1: return { title: 'Reset your password', desc: 'Enter your email to receive a secure link' }
            case 2: return { title: 'Check your email', desc: 'We sent a reset link to your inbox' }
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
                                Click the link in the email to safely reset your password. The link will expire soon.
                            </p>
                            <Link
                                to="/login"
                                className="btn-secondary w-full flex items-center justify-center block"
                            >
                                Return to Sign In
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
