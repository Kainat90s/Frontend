import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineSearch,
    HiOutlineXCircle,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineUser,
    HiOutlineClock,
} from 'react-icons/hi'

const statusColors = {
    confirmed: 'badge-confirmed',
    pending: 'badge-pending',
    cancelled: 'badge-cancelled',
}

const typeIcons = {
    video: HiOutlineVideoCamera,
    phone: HiOutlinePhone,
    in_person: HiOutlineUser,
}

const filters = [
    { value: '', label: 'All' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
]

export default function UserMyBookingsPage() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchBookings()
    }, [statusFilter])

    const fetchBookings = async () => {
        setLoading(true)
        try {
            const params = {}
            if (statusFilter) params.status = statusFilter
            const { data } = await api.get('/bookings/my/', { params })
            setBookings(data.results || data)
        } catch {
            toast.error('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return
        try {
            await api.post(`/bookings/${id}/cancel/`)
            toast.success('Booking cancelled')
            fetchBookings()
        } catch (err) {
            const msg = err.response?.data
            if (typeof msg === 'object') {
                toast.error(Object.values(msg).flat().join(', '))
            } else {
                toast.error('Failed to cancel')
            }
        }
    }

    const filtered = useMemo(() => {
        return bookings.filter(b => {
            if (!search) return true
            const q = search.toLowerCase()
            return (
                b.meeting_type?.toLowerCase().includes(q) ||
                b.slot_date?.includes(q) ||
                b.status?.toLowerCase().includes(q)
            )
        })
    }, [bookings, search])

    const now = new Date()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-100">My Bookings</h1>
                <p className="text-surface-400 mt-1">View and manage your appointments</p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === f.value
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 border border-surface-700/50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-9 py-2 text-sm"
                        placeholder="Search bookings..."
                    />
                </div>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-5 h-24" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <HiOutlineCalendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                    <p className="text-lg text-surface-400">No bookings found</p>
                    <p className="text-sm text-surface-500 mt-1">
                        {statusFilter ? 'Try a different filter' : 'Book your first appointment!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((booking) => {
                        const TypeIcon = typeIcons[booking.meeting_type] || HiOutlineUser
                        const dateObj = new Date(booking.slot_date + 'T00:00:00')
                        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                        const isPast = new Date(booking.slot_date + 'T' + booking.slot_end_time) < now
                        const canCancel = !isPast && booking.status !== 'cancelled'

                        return (
                            <div
                                key={booking.id}
                                className={`glass-card p-5 transition-all duration-200 ${booking.status === 'cancelled' ? 'opacity-60' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Date */}
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[10px] font-medium text-emerald-400">
                                            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-bold text-emerald-300">{dateObj.getDate()}</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-surface-200">{dateStr}</p>
                                            <span className={`badge ${statusColors[booking.status] || 'badge-pending'}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-surface-400">
                                            <span className="flex items-center gap-1">
                                                <HiOutlineClock className="w-4 h-4" />
                                                {booking.slot_start_time?.slice(0, 5)} – {booking.slot_end_time?.slice(0, 5)}
                                            </span>
                                            <span className="flex items-center gap-1 capitalize">
                                                <TypeIcon className="w-4 h-4" />
                                                {booking.meeting_type?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {booking.meet_link && booking.status !== 'cancelled' && (
                                            <a
                                                href={booking.meet_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                                                           bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                                                           rounded-lg hover:bg-emerald-500/20 transition-all"
                                            >
                                                <HiOutlineVideoCamera className="w-4 h-4" />
                                                Join Meet
                                            </a>
                                        )}
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                                                           text-red-400 hover:bg-red-500/10 border border-surface-700/50 
                                                           hover:border-red-500/20 rounded-lg transition-all"
                                            >
                                                <HiOutlineXCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        )}
                                        {isPast && booking.status !== 'cancelled' && (
                                            <span className="text-xs text-surface-500 px-2">Completed</span>
                                        )}
                                    </div>
                                </div>

                                {booking.notes && (
                                    <div className="mt-3 pt-3 border-t border-surface-700/30">
                                        <p className="text-sm text-surface-500">{booking.notes}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
