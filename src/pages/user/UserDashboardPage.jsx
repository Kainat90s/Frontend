import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineUser,
    HiOutlineArrowRight,
} from 'react-icons/hi'

const typeIcons = {
    video: HiOutlineVideoCamera,
    phone: HiOutlinePhone,
    in_person: HiOutlineUser,
}

export default function UserDashboardPage() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyBookings()
    }, [])

    const fetchMyBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my/')
            setBookings(data.results || data)
        } catch {
            toast.error('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }

    const now = new Date()
    const upcoming = bookings.filter(b => {
        if (b.status === 'cancelled') return false
        const bDate = new Date(b.slot_date + 'T' + b.slot_start_time)
        return bDate >= now
    })
    const completed = bookings.filter(b => {
        const bDate = new Date(b.slot_date + 'T' + b.slot_end_time)
        return bDate < now && b.status !== 'cancelled'
    })

    const greeting = () => {
        const h = now.getHours()
        if (h < 12) return 'Good Morning'
        if (h < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">
                        {greeting()}, {user?.first_name || user?.email} 👋
                    </h1>
                    <p className="text-surface-400 mt-1">Here's your appointment overview</p>
                </div>
                <Link
                    to="/user/book"
                    className="btn-primary inline-flex items-center gap-2 w-fit"
                >
                    <HiOutlineCalendar className="w-5 h-5" />
                    Book Appointment
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <HiOutlineCalendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Total Bookings</p>
                            <p className="text-2xl font-bold text-surface-100">{bookings.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                            <HiOutlineClock className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Upcoming</p>
                            <p className="text-2xl font-bold text-surface-100">{upcoming.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <HiOutlineCheckCircle className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Completed</p>
                            <p className="text-2xl font-bold text-surface-100">{completed.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-surface-100">Upcoming Meetings</h2>
                    <Link to="/user/my-bookings" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                        View All <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-surface-800/50 rounded-xl" />
                        ))}
                    </div>
                ) : upcoming.length === 0 ? (
                    <div className="text-center py-12">
                        <HiOutlineCalendar className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                        <p className="text-surface-400">No upcoming meetings</p>
                        <Link to="/user/book" className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-block">
                            Book your first appointment →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.slice(0, 5).map((booking) => {
                            const TypeIcon = typeIcons[booking.meeting_type] || HiOutlineUser
                            const dateObj = new Date(booking.slot_date + 'T00:00:00')
                            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

                            return (
                                <div
                                    key={booking.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-surface-700/50 bg-surface-800/30 
                                               hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[10px] font-medium text-emerald-400">
                                            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-base font-bold text-emerald-300">{dateObj.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-surface-200">{dateStr}</p>
                                        <p className="text-sm text-surface-400">
                                            {booking.slot_start_time?.slice(0, 5)} – {booking.slot_end_time?.slice(0, 5)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TypeIcon className="w-4 h-4 text-surface-500" />
                                        <span className="text-xs text-surface-500 capitalize">{booking.meeting_type?.replace('_', ' ')}</span>
                                    </div>
                                    {booking.meet_link && (
                                        <a
                                            href={booking.meet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                        >
                                            <HiOutlineVideoCamera className="w-4 h-4" />
                                            Join
                                        </a>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
