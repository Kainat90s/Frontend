import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import {
    HiOutlineCog,
    HiOutlineLink,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
} from 'react-icons/hi'

export default function SettingsPage() {
    const [searchParams] = useSearchParams()
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [googleStatus, setGoogleStatus] = useState(null)

    useEffect(() => {
        if (searchParams.get('google') === 'connected') {
            toast.success('Google account connected successfully!')
        }
    }, [searchParams])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const [settingsRes, googleRes] = await Promise.all([
                api.get('/core/settings/'),
                api.get('/integrations/google/status/').catch(() => ({ data: { is_connected: false } })),
            ])
            setSettings(settingsRes.data)
            setGoogleStatus(googleRes.data)
        } catch {
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchSettings() }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data } = await api.put('/core/settings/', settings)
            setSettings(data)
            toast.success('Settings saved!')
        } catch {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleGoogleConnect = async () => {
        try {
            const { data } = await api.get('/integrations/google/auth/')
            window.location.href = data.auth_url
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail
            toast.error(msg || 'Failed to initiate Google OAuth')
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-surface-100">Settings</h1>
                <p className="text-surface-400 mt-1">Configure scheduling and integrations</p>
            </div>

            {/* Scheduling Settings */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                        <HiOutlineCog className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-surface-100">Scheduling Configuration</h2>
                        <p className="text-sm text-surface-400">Set default meeting duration and buffer times</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">
                            Meeting Duration (min)
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="480"
                            value={settings?.meeting_duration || 30}
                            onChange={(e) =>
                                setSettings({ ...settings, meeting_duration: parseInt(e.target.value) || 30 })
                            }
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">
                            Buffer Before (min)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="120"
                            value={settings?.buffer_before_minutes || 0}
                            onChange={(e) =>
                                setSettings({ ...settings, buffer_before_minutes: parseInt(e.target.value) || 0 })
                            }
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">
                            Buffer After (min)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="120"
                            value={settings?.buffer_after_minutes || 0}
                            onChange={(e) =>
                                setSettings({ ...settings, buffer_after_minutes: parseInt(e.target.value) || 0 })
                            }
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6 p-4 rounded-xl bg-surface-800/40 border border-surface-700/30">
                    <input
                        type="checkbox"
                        id="weekend_off"
                        checked={settings?.weekend_off ?? true}
                        onChange={(e) =>
                            setSettings({ ...settings, weekend_off: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-surface-600 text-primary-500 focus:ring-primary-500/50 bg-surface-800"
                    />
                    <label htmlFor="weekend_off" className="text-sm text-surface-300">
                        Weekend off — Automatically mark Saturday & Sunday as unavailable
                    </label>
                </div>

                <div className="mt-6">
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Google Integration */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <HiOutlineLink className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-surface-100">Google Calendar Integration</h2>
                        <p className="text-sm text-surface-400">
                            Connect to automatically create Google Meet links
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-800/40 border border-surface-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {googleStatus?.is_connected ? (
                            <>
                                <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <p className="font-medium text-emerald-400">Connected</p>
                                    <p className="text-xs text-surface-500">
                                        Since {new Date(googleStatus.connected_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <HiOutlineXCircle className="w-6 h-6 text-surface-500" />
                                <div>
                                    <p className="font-medium text-surface-400">Not Connected</p>
                                    <p className="text-xs text-surface-500">
                                        Connect to enable Google Meet links
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {googleStatus?.is_connected ? (
                        <button onClick={handleGoogleDisconnect} className="btn-danger text-sm">
                            Disconnect
                        </button>
                    ) : (
                        <button onClick={handleGoogleConnect} className="btn-primary text-sm">
                            Connect Google
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
