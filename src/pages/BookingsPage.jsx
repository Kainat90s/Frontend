import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineSearch,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineUser,
    HiOutlineExternalLink,
    HiCheck,
    HiOutlineXCircle,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
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

export default function BookingsPage() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(0)
    const [updatingId, setUpdatingId] = useState(null)

    const fetchBookings = async (silent = false, p = page) => {
        if (!silent) setLoading(true)
        try {
            const params = { page: p }
            if (filter) params.status = filter
            // Add search param to API if backend supports it, else we filter locally
            const { data } = await api.get('/bookings/', { params })

            // Handle paginated or non-paginated response
            if (data.results) {
                setBookings(data.results)
                setCount(data.count)
            } else {
                setBookings(data)
                setCount(data.length)
            }
        } catch {
            toast.error('Failed to load bookings')
        } finally {
            if (!silent) setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
        fetchBookings(false, 1)
    }, [filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            // If search is short, we might not want to fetch, but usually DRF handles it
            fetchBookings(true)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleStatusUpdate = async (id, newStatus) => {
        const booking = bookings.find(b => b.id === id)
        if (!booking) return

        // Optimistic UI update
        const previousBookings = [...bookings]
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b))
        setUpdatingId(id)

        try {
            await api.post(`/bookings/${id}/update-status/`, { status: newStatus })
            toast.success(`${booking.client_name} is now ${newStatus}`)
            await fetchBookings(true)
        } catch (err) {
            setBookings(previousBookings)
            toast.error(err.response?.data?.detail || 'Update failed')
        } finally {
            setUpdatingId(null)
        }
    }

    const handlePageChange = (newPage) => {
        setPage(newPage)
        fetchBookings(false, newPage)
    }

    // Local filtering based on search (in case backend results are paged)
    const filtered = bookings.filter(b =>
        b.client_name.toLowerCase().includes(search.toLowerCase()) ||
        b.client_email.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(count / 20)

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-surface-100">Bookings</h1>
                <p className="text-surface-400 mt-1">View and manage all bookings</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-11"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {['', 'confirmed', 'pending', 'cancelled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${filter === s
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:text-surface-200'
                                }`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings Table */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="glass-card p-5 h-20" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <HiOutlineCalendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                    <p className="text-lg text-surface-400">No bookings found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-surface-700/50">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-surface-400">Client</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-surface-400">Date & Time</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-surface-400">Type</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-surface-400">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-surface-400">Meet</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-surface-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((booking, i) => {
                                        const TypeIcon = typeIcons[booking.meeting_type] || HiOutlineUser
                                        const isUpdating = updatingId === booking.id
                                        return (
                                            <tr
                                                key={booking.id}
                                                className={`border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors animate-slide-up ${isUpdating ? 'opacity-50' : ''}`}
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-surface-200">{booking.client_name}</p>
                                                    <p className="text-xs text-surface-500">{booking.client_email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-surface-200">{booking.slot_date}</p>
                                                    <p className="text-xs text-surface-500">
                                                        {booking.slot_start_time?.slice(0, 5)} – {booking.slot_end_time?.slice(0, 5)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <TypeIcon className="w-4 h-4 text-surface-400" />
                                                        <span className="text-sm text-surface-300 capitalize">
                                                            {booking.meeting_type?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`badge ${statusColors[booking.status] || 'badge-pending'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {booking.meet_link ? (
                                                        <a
                                                            href={booking.meet_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm font-medium"
                                                        >
                                                            <HiOutlineExternalLink className="w-4 h-4" />
                                                            Join
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-surface-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {booking.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                                disabled={isUpdating}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
                                                                title="Confirm this booking"
                                                            >
                                                                <HiCheck className="w-4 h-4" />
                                                                Confirm
                                                            </button>
                                                        )}
                                                        {booking.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                                disabled={isUpdating}
                                                                className="p-1.5 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                title="Cancel Booking"
                                                            >
                                                                <HiOutlineXCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <select
                                                            value={booking.status}
                                                            onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                                                            disabled={isUpdating}
                                                            className={`bg-surface-900 border border-surface-700 text-surface-200 text-xs rounded-lg px-2 py-1.5 
                                                                       focus:ring-1 focus:ring-primary-500 outline-none transition-all cursor-pointer font-medium disabled:cursor-not-allowed
                                                                       ${booking.status === 'pending' ? 'border-amber-500/30 text-amber-400' :
                                                                    booking.status === 'confirmed' ? 'border-emerald-500/30 text-emerald-400' :
                                                                        'border-red-500/30 text-red-400'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirmed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="p-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <HiOutlineChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-surface-400">
                                Page <span className="text-surface-100">{page}</span> of <span className="text-surface-100">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <HiOutlineChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
