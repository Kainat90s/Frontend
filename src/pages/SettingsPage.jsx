import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    HiOutlineCog,
    HiOutlineLink,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineLockClosed,
    HiOutlineTrash,
    HiOutlinePlus,
} from 'react-icons/hi'

export default function SettingsPage() {
    const [searchParams] = useSearchParams()
    const { updateUser } = useAuth()
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [googleStatus, setGoogleStatus] = useState(null)
    const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', role: '', public_booking_slug: '' })
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '' })
    const [copied, setCopied] = useState(false)
    const [updatingLink, setUpdatingLink] = useState(false)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const publicBookingLink = profile?.public_booking_slug ? `${origin}/book/${profile.public_booking_slug}` : ''

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const [settingsRes, googleRes, profileRes] = await Promise.all([
                api.get('/core/settings/'),
                api.get('/integrations/google/status/').catch(() => ({ data: { is_connected: false } })),
                api.get('/accounts/profile/').catch(() => ({ data: { first_name: '', last_name: '', email: '', role: '' } })),
            ])
            setSettings(settingsRes.data)
            setGoogleStatus(googleRes.data)
            setProfile(profileRes.data)

        } catch (err) {
            console.error('Settings load error:', err)
            toast.error('Failed to load some settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
        const googleParam = searchParams.get('google')
        if (googleParam === 'connected') {
            toast.success('Google account connected successfully!')
        } else if (googleParam === 'invalid_grant') {
            toast.error('Google connect failed. Please try again.')
        } else if (googleParam === 'error') {
            toast.error('Google connect failed. Please try again.')
        }
    }, [searchParams])

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const { data } = await api.put('/core/settings/', settings)
            setSettings(data)
            toast.success('System settings saved!')
        } catch (err) {
            const msg = err.response?.data ? Object.values(err.response.data)[0] : 'Failed to save settings'
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateProfile = async () => {
        try {
            await api.put('/accounts/profile/', profile)
            toast.success('Profile updated!')
            updateUser(profile)
            // Refresh settings to show updated data
            fetchSettings()
        } catch (err) {
            const msg = err.response?.data ? Object.values(err.response.data)[0] : 'Failed to update profile'
            toast.error(msg)
        }
    }

    const handleChangePassword = async () => {
        try {
            await api.post('/accounts/profile/change-password/', passwords)
            toast.success('Password changed!')
            setPasswords({ old_password: '', new_password: '' })
        } catch (err) {
            // Check for specific error fields or the generic detail
            const data = err.response?.data
            const msg = data?.detail || (data ? Object.values(data)[0] : 'Failed to change password')
            toast.error(msg)
        }
    }

    const handleGoogleConnect = async () => {
        try {
            const { data } = await api.get('/integrations/google/auth/')
            window.location.href = data.auth_url
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to initiate Google OAuth'
            toast.error(msg)
        }
    }

    const handleGoogleDisconnect = async () => {
        if (!confirm('Disconnect Google account?')) return
        try {
            await api.post('/integrations/google/disconnect/')
            setGoogleStatus({ is_connected: false })
            toast.success('Google account disconnected')
        } catch {
            toast.error('Failed to disconnect')
        }
    }

    const handleGoogleReconnect = async () => {
        if (!confirm('Reconnect Google account?')) return
        try {
            await api.post('/integrations/google/disconnect/').catch(() => {})
            const { data } = await api.get('/integrations/google/auth/')
            window.location.href = data.auth_url
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to reconnect Google'
            toast.error(msg)
        }
    }

    const handleCopyPublicLink = async () => {
        if (!publicBookingLink) return
        try {
            await navigator.clipboard.writeText(publicBookingLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success('Public booking link copied!')
        } catch {
            toast.error('Failed to copy link')
        }
    }

    const handleUpdatePublicLink = async () => {
        setUpdatingLink(true)
        try {
            const payload = { public_booking_slug: profile.public_booking_slug || '' }
            const { data } = await api.patch('/accounts/profile/', payload)
            setProfile(data)
            toast.success('Public booking link updated!')
        } catch (err) {
            const msg = err.response?.data ? Object.values(err.response.data)[0] : 'Failed to update link'
            toast.error(msg)
        } finally {
            setUpdatingLink(false)
        }
    }


    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-surface-800 rounded-xl w-48" />
                <div className="glass-card p-6 h-64" />
                <div className="glass-card p-6 h-40" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-surface-100">Settings</h1>
                <p className="text-surface-400 mt-1">Manage your profile, scheduling and team</p>
            </div>

            {/* Profile & Security Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <HiOutlineUser className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-surface-100">Profile Information</h2>
                            <p className="text-sm text-surface-400">Update your personal details</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">First Name</label>
                                <input
                                    type="text"
                                    value={profile?.first_name || ''}
                                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    value={profile?.last_name || ''}
                                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <button onClick={handleUpdateProfile} className="btn-primary w-full mt-2">Update Profile</button>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <HiOutlineLockClosed className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-surface-100">Security</h2>
                            <p className="text-sm text-surface-400">Change your password</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.old_password}
                            onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                            className="input-field"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwords.new_password}
                            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                            className="input-field"
                        />
                        <button onClick={handleChangePassword} className="btn-secondary w-full mt-2">Change Password</button>
                    </div>
                </div>
            </div>

            {/* Scheduling Settings */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <HiOutlineCog className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-surface-100">Scheduling Configuration</h2>
                        <p className="text-sm text-surface-400">Manage meeting durations and buffers</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">Meeting Duration (min)</label>
                        <input
                            type="number"
                            value={settings?.meeting_duration || 30}
                            onChange={(e) => setSettings({ ...settings, meeting_duration: parseInt(e.target.value) || 30 })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">Buffer Before (min)</label>
                        <input
                            type="number"
                            value={settings?.buffer_before_minutes || 0}
                            onChange={(e) => setSettings({ ...settings, buffer_before_minutes: parseInt(e.target.value) || 0 })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">Buffer After (min)</label>
                        <input
                            type="number"
                            value={settings?.buffer_after_minutes || 0}
                            onChange={(e) => setSettings({ ...settings, buffer_after_minutes: parseInt(e.target.value) || 0 })}
                            className="input-field"
                        />
                    </div>
                </div>
                <button onClick={handleSaveSettings} disabled={saving} className="btn-primary mt-6">
                    {saving ? 'Saving...' : 'Update Scheduling Settings'}
                </button>
            </div>

            {/* Public Booking Link */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                        <HiOutlineLink className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-surface-100">Public Booking Link</h2>
                        <p className="text-sm text-surface-400">Share this link with guests to book without an account</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        readOnly
                        value={publicBookingLink || 'Public link will appear here'}
                        className="input-field flex-1"
                    />
                    <button
                        onClick={handleCopyPublicLink}
                        disabled={!publicBookingLink}
                        className="btn-secondary text-sm"
                    >
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 uppercase tracking-widest mb-2">Custom Slug</label>
                        <input
                            type="text"
                            value={profile?.public_booking_slug || ''}
                            onChange={(e) => setProfile({ ...profile, public_booking_slug: e.target.value })}
                            className="input-field"
                            placeholder="e.g. ali or team-demo"
                        />
                        <p className="text-xs text-surface-500 mt-2">Only letters, numbers, and hyphens. Leave empty to auto-generate.</p>
                    </div>
                    <button
                        onClick={handleUpdatePublicLink}
                        disabled={updatingLink}
                        className="btn-primary h-11 self-end"
                    >
                        {updatingLink ? 'Updating...' : 'Update Link'}
                    </button>
                </div>
            </div>

            {/* Email / SMTP settings */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                        <HiOutlineCog className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-surface-100">Email Delivery (SMTP)</h2>
                        <p className="text-sm text-surface-400">Configure SMTP settings for notifications</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <label className="block text-sm text-surface-400 mb-1">SMTP Host</label>
                        <input
                            type="text"
                            value={settings?.email_host || ''}
                            onChange={(e) => setSettings({ ...settings, email_host: e.target.value })}
                            className="input-field"
                            placeholder="smtp.gmail.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">Port</label>
                        <input
                            type="number"
                            value={settings?.email_port || 587}
                            onChange={(e) => setSettings({ ...settings, email_port: parseInt(e.target.value) || 587 })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">Email (User)</label>
                        <input
                            type="email"
                            value={settings?.email_host_user || ''}
                            onChange={(e) => setSettings({ ...settings, email_host_user: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">App Password</label>
                        <input
                            type="password"
                            value={settings?.email_host_password || ''}
                            onChange={(e) => setSettings({ ...settings, email_host_password: e.target.value })}
                            className="input-field"
                            placeholder="••••••••••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-surface-400 mb-1">From Email</label>
                        <input
                            type="email"
                            value={settings?.default_from_email || ''}
                            onChange={(e) => setSettings({ ...settings, default_from_email: e.target.value })}
                            className="input-field"
                        />
                    </div>
                </div>
                <button onClick={handleSaveSettings} disabled={saving} className="btn-primary mt-6">
                    {saving ? 'Saving...' : 'Update Email Settings'}
                </button>
            </div>

            {/* Google Integration */}
            <div className="glass-card p-6 text-surface-100">
                <div className="flex items-center gap-3 mb-6">
                    <HiOutlineLink className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold">Google Integration</h2>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-800/40 rounded-xl border border-surface-700/50">
                    <div>
                        <p className="font-medium">{googleStatus?.is_connected ? 'Connected to Google' : 'Not Connected'}</p>
                        {googleStatus?.is_connected && googleStatus?.owner_email && (
                            <p className="text-xs text-surface-500">Connected as {googleStatus.owner_email}</p>
                        )}
                        {googleStatus?.is_connected && (
                            <p className="text-xs text-surface-500">Connected since {googleStatus.connected_at ? new Date(googleStatus.connected_at).toLocaleDateString() : 'recently'}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {googleStatus?.is_connected && (
                            <button onClick={handleGoogleReconnect} className="btn-secondary text-sm">
                                Reconnect
                            </button>
                        )}
                        <button
                            onClick={googleStatus?.is_connected ? handleGoogleDisconnect : handleGoogleConnect}
                            className={googleStatus?.is_connected ? 'btn-danger text-sm' : 'btn-primary text-sm'}
                        >
                            {googleStatus?.is_connected ? 'Disconnect' : 'Connect Account'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}
