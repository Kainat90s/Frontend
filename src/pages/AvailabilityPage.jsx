import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineClock,
    HiOutlineCalendar,
} from 'react-icons/hi'

export default function AvailabilityPage() {
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ date: '', start_time: '', end_time: '', duration_minutes: 30 })
    const [submitting, setSubmitting] = useState(false)

    const fetchSlots = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/availability/admin/slots/')
            setSlots(data.results || data)
        } catch {
            toast.error('Failed to load slots')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchSlots() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await api.post('/availability/admin/slots/', form)
            toast.success('Slots created successfully!')
            setForm({ date: '', start_time: '', end_time: '', duration_minutes: 30 })
            setShowForm(false)
            fetchSlots()
        } catch (err) {
            const msg = err.response?.data
            if (typeof msg === 'object') {
                toast.error(Object.values(msg).flat().join(', '))
            } else {
                toast.error('Failed to create slots')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this slot?')) return
        try {
            await api.delete(`/availability/admin/slots/${id}/`)
            toast.success('Slot deleted')
            fetchSlots()
        } catch {
            toast.error('Failed to delete slot')
        }
    }

    const handleDeleteDay = async (date, daySlots) => {
        const bookedCount = daySlots.filter(s => s.is_booked).length
        const msg = bookedCount > 0
            ? `Are you sure? This will delete all ${daySlots.length} slots for this day and cancel ${bookedCount} active booking(s). Clients will be notified.`
            : `Delete all ${daySlots.length} slots for this day?`
        if (!confirm(msg)) return
        try {
            const { data } = await api.delete(`/availability/admin/slots/bulk-delete/${date}/`)
            toast.success(`Deleted ${data.deleted_slots} slots` + (data.cancelled_bookings > 0 ? `, cancelled ${data.cancelled_bookings} booking(s)` : ''))
            fetchSlots()
        } catch (err) {
            const detail = err.response?.data?.detail
            toast.error(detail || `Failed to delete day slots (${err.response?.status || 'network error'})`)
        }
    }

    // Group slots by date
    const grouped = slots.reduce((acc, slot) => {
        const date = slot.date
        if (!acc[date]) acc[date] = []
        acc[date].push(slot)
        return acc
    }, {})

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-100">Availability</h1>
                    <p className="text-surface-400 mt-1">Manage your available time slots</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Add Slots
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="glass-card p-6 animate-slide-up">
                    <h2 className="text-lg font-semibold text-surface-100 mb-4">Create Availability Range</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Start Time</label>
                                <input
                                    type="time"
                                    value={form.start_time}
                                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">End Time</label>
                                <input
                                    type="time"
                                    value={form.end_time}
                                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5 flex items-center gap-1.5">
                                    Split Into (minutes)
                                    <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                                </label>
                                <select
                                    value={form.duration_minutes === null ? '' : form.duration_minutes}
                                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value === '' ? null : parseInt(e.target.value) })}
                                    className="input-field border-primary-500/50"
                                >
                                    <option value="">Flexible (Single Block) — RECOMMENDED</option>
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">1 Hour</option>
                                    <option value="90">1.5 Hours</option>
                                    <option value="120">2 Hours</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto px-10">
                                {submitting ? 'Generating...' : 'Generate Slots'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="btn-secondary w-full sm:w-auto"
                            >
                                Cancel
                            </button>
                            <span className="text-xs text-surface-500 italic">
                                * Tip: Creating from 09:00 to 12:00 with 60 mins will create 3 slots.
                            </span>
                        </div>
                    </form>
                    <p className="text-xs text-surface-500 mt-3">
                        ⚠️ Saturday & Sunday are not allowed. Overlapping slots will be rejected.
                    </p>
                </div>
            )}

            {/* Slots List */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-6 h-24" />
                    ))}
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <HiOutlineClock className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                    <p className="text-lg text-surface-400">No availability slots yet</p>
                    <p className="text-sm text-surface-500 mt-1">Click "Add Slot" to create your first time slot</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).sort().map(([date, daySlots]) => {
                        const dateObj = new Date(date + 'T00:00:00')
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

                        return (
                            <div key={date}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineCalendar className="w-5 h-5 text-primary-400" />
                                        <h3 className="text-lg font-semibold text-surface-200">{dayName}</h3>
                                        <span className="text-sm text-surface-500">{dateStr}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDay(date, daySlots)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                                   text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20
                                                   rounded-lg transition-all duration-200 border border-red-500/20"
                                    >
                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                        Delete Entire Day
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {daySlots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`glass-card-hover p-4 flex items-center justify-between ${slot.is_booked ? 'border-emerald-500/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${slot.is_booked
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-primary-500/15 text-primary-400'
                                                    }`}>
                                                    <HiOutlineClock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-surface-200">
                                                        {slot.start_time} – {slot.end_time}
                                                    </p>
                                                    <p className="text-xs text-surface-500">
                                                        {slot.duration_minutes} min · {slot.is_booked ? 'Booked' : 'Available'}
                                                    </p>
                                                </div>
                                            </div>

                                            {!slot.is_booked && (
                                                <button
                                                    onClick={() => handleDelete(slot.id)}
                                                    className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 
                                     rounded-lg transition-all duration-200"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
