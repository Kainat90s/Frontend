import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineLink,
    HiOutlineXCircle,
    HiOutlineRefresh,
} from 'react-icons/hi'

export default function DashboardPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [copied, setCopied] = useState(false)

    const fetchDashboard = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const [dashboardRes, profileRes] = await Promise.all([
                api.get('/core/dashboard/'),
                api.get('/accounts/profile/'),
            ])
            const res = dashboardRes.data
            setData(res)
            setProfile(profileRes.data)
        } catch (err) {
            toast.error('Failed to load dashboard data')
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [])

    useEffect(() => { fetchDashboard() }, [fetchDashboard])

    const totalWeeklyHours = useMemo(() => {
        return data?.weekly_hours
            ?.filter(d => !d.is_off)
            .reduce((sum, d) => sum + d.hours, 0) || 0
    }, [data])

    if (loading) return <DashboardSkeleton />

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const publicBookingLink = profile?.public_booking_slug ? `${origin}/book/${profile.public_booking_slug}` : ''

    const handleCopyLink = async () => {
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-100">Dashboard</h1>
                    <p className="text-surface-400 mt-1">Welcome back! Here's your weekly overview.</p>
                </div>
                <button
                    onClick={() => fetchDashboard(true)}
                    className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <HiOutlineRefresh className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={HiOutlineCalendar}
                    label="Total Bookings"
                    value={data?.stats?.total_bookings_this_week || 0}
                    color="primary"
                    subtitle="This week"
                />
                <StatCard
                    icon={HiOutlineClock}
                    label="Available Slots"
                    value={data?.stats?.available_slots_remaining || 0}
                    color="cyan"
                    subtitle="Remaining"
                />
                <StatCard
                    icon={HiOutlineCheckCircle}
                    label="Confirmed"
                    value={data?.stats?.confirmed_bookings || 0}
                    color="emerald"
                    subtitle="This week"
                />
                <StatCard
                    icon={HiOutlineXCircle}
                    label="Cancelled"
                    value={data?.stats?.cancelled_bookings || 0}
                    color="red"
                    subtitle="This week"
                />
            </div>

            {profile?.role === 'admin' && (
                <div className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                                <HiOutlineLink className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-surface-100">Public Booking Link</h2>
                                <p className="text-sm text-surface-400">Share this link to let guests book without an account</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                readOnly
                                value={publicBookingLink || 'Set your link in Settings'}
                                className="input-field min-w-0 sm:min-w-[320px]"
                            />
                            <button
                                onClick={handleCopyLink}
                                disabled={!publicBookingLink}
                                className="btn-secondary text-sm"
                            >
                                {copied ? 'Copied' : 'Copy Link'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Weekly Available Hours — takes 3 columns */}
                <div className="lg:col-span-3">
                    <WeeklyHoursCard hours={data?.weekly_hours || []} total={totalWeeklyHours} />
                </div>

                {/* Upcoming Meetings — takes 2 columns */}
                <div className="lg:col-span-2">
                    <UpcomingMeetingsCard meetings={data?.upcoming_meetings || []} />
                </div>
            </div>
        </div>
    )
}

/* ——————————— Stat Card ——————————— */
const StatCard = memo(({ icon: Icon, label, value, color, subtitle }) => {
    const colorMap = {
        primary: 'from-primary-500 to-primary-600',
        cyan: 'from-cyan-500 to-cyan-600',
        emerald: 'from-emerald-500 to-emerald-600',
        red: 'from-red-500 to-red-600',
    }
    const glowMap = {
        primary: 'shadow-primary-500/20',
        cyan: 'shadow-cyan-500/20',
        emerald: 'shadow-emerald-500/20',
        red: 'shadow-red-500/20',
    }

    return (
        <div className="stat-card group hover:border-primary-500/20 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-surface-400">{label}</p>
                    <p className="text-3xl font-bold text-surface-100 mt-2">{value}</p>
                    <p className="text-xs text-surface-500 mt-1">{subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg ${glowMap[color]}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    )
})

/* ——————————— Weekly Hours Card ——————————— */
const WeeklyHoursCard = memo(({ hours, total }) => {
    const validHours = hours.filter(d => !d.is_off).map(d => d.hours)
    const maxHours = validHours.length > 0 ? Math.max(...validHours, 1) : 1

    return (
        <div className="glass-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-surface-100">Weekly Available Hours</h2>
                    <p className="text-sm text-surface-400">Current week Mon–Sun</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                        {total.toFixed(1)}h
                    </p>
                    <p className="text-xs text-surface-500">Total available</p>
                </div>
            </div>

            <div className="space-y-3">
                {hours.map((day, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-surface-300 shrink-0">
                            {day.day.slice(0, 3)}
                            <span className="text-xs text-surface-500 ml-1.5">
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        {day.is_off ? (
                            <div className="flex-1 flex items-center">
                                <span className="badge badge-off">OFF</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 h-8 bg-surface-800/60 rounded-lg overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg transition-all duration-700 ease-out relative"
                                        style={{ width: `${Math.max((day.hours / maxHours) * 100, 2)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-surface-200 w-14 text-right">
                                    {day.hours.toFixed(1)}h
                                </span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
})

/* ——————————— Upcoming Meetings Card ——————————— */
const UpcomingMeetingsCard = memo(({ meetings }) => {
    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Upcoming Meetings</h2>

            {meetings.length === 0 ? (
                <div className="text-center py-12">
                    <HiOutlineCalendar className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-400">No upcoming meetings</p>
                    <p className="text-xs text-surface-500 mt-1">Meetings will appear here once booked</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {meetings.map((meeting, i) => (
                        <div
                            key={meeting.id}
                            className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-surface-800/40 border border-surface-700/30 
                         hover:border-primary-500/20 transition-all duration-200 animate-slide-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {/* Time badge */}
                            <div className="w-14 h-14 rounded-xl bg-primary-500/10 border border-primary-500/20 flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-medium text-primary-400">
                                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                                <span className="text-lg font-bold text-primary-300">
                                    {new Date(meeting.date).getDate()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-surface-200 truncate">{meeting.client_name}</p>
                                <p className="text-xs text-surface-400 mt-0.5">
                                    {meeting.time} · {meeting.meeting_type}
                                </p>
                                <div className="mt-2">
                                    <span className={`badge ${meeting.status === 'Confirmed' ? 'badge-confirmed' :
                                        meeting.status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending'
                                        }`}>
                                        {meeting.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
})

/* ——————————— Loading Skeleton ——————————— */
function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-10 bg-surface-800 rounded-xl w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card p-6 h-32" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 glass-card p-6 h-80" />
                <div className="lg:col-span-2 glass-card p-6 h-80" />
            </div>
        </div>
    )
}
