import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast, { Toaster } from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineUser,
    HiOutlineCheckCircle,
    HiOutlineArrowLeft,
} from 'react-icons/hi'

const meetingTypes = [
    { value: 'video', label: 'Video Call', icon: HiOutlineVideoCamera, desc: 'Google Meet link will be sent' },
    { value: 'phone', label: 'Phone Call', icon: HiOutlinePhone, desc: 'We will call you' },
    { value: 'in_person', label: 'In Person', icon: HiOutlineUser, desc: 'Visit our office' },
]

export default function UserBookingPage() {
    const { user } = useAuth()
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(1)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [booking, setBooking] = useState(null)
    const [form, setForm] = useState({
        client_name: user?.full_name || '',
        client_email: user?.email || '',
        meeting_type: 'video',
        duration: 30, // Default 30 mins
        notes: '',
        start_time: '',
        end_time: '',
    })

    useEffect(() => {
        fetchSlots()
        if (user) {
            setForm(prev => ({
                ...prev,
                client_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email,
                client_email: user.email || '',
            }))
        }
    }, [user])

    // Initialize custom times when slot is selected or duration changes
    useEffect(() => {
        if (selectedSlot && form.start_time) {
            const [h, m] = form.start_time.split(':').map(Number)
            const end = new Date(2000, 0, 1, h, m + parseInt(form.duration))
            const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

            setForm(prev => ({
                ...prev,
                end_time: endTimeStr
            }))
        } else if (selectedSlot) {
            setForm(prev => ({
                ...prev,
                start_time: selectedSlot.start_time?.slice(0, 5),
            }))
        }
    }, [selectedSlot, form.duration, form.start_time])

    const fetchSlots = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/availability/slots/')
            setSlots(data.results || data)
        } catch {
            toast.error('Failed to load available slots')
        } finally {
            setLoading(false)
        }
    }

    const handleBook = async (e) => {
        e.preventDefault()
        if (!selectedSlot) return
        setSubmitting(true)
        try {
            const { data } = await api.post('/bookings/create/', {
                slot_id: selectedSlot.id,
                ...form,
            })
            setBooking(data)
            setStep(3)
            toast.success('Booking request sent!')
        } catch (err) {
            const msg = err.response?.data
            if (typeof msg === 'object') {
                const errors = Object.values(msg).flat().join(', ')
                toast.error(errors)
            } else {
                toast.error('Booking failed. Please try again.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const grouped = useMemo(() => {
        return slots.reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = []
            acc[slot.date].push(slot)
            return acc
        }, {})
    }, [slots])

    // Helper to check if a time is within the selected slot
    const isWithinSlot = (time, type) => {
        if (!selectedSlot) return true
        const sTime = selectedSlot.start_time?.slice(0, 5)
        const eTime = selectedSlot.end_time?.slice(0, 5)
        if (type === 'start') return time >= sTime && time < eTime
        return time > sTime && time <= eTime
    }

    return (
        <div className="space-y-6">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px' },
                }}
            />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-100">Book an Appointment</h1>
                <p className="text-surface-400 mt-1">Choose a time slot and meeting type</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-3">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= s
                            ? 'bg-emerald-500 text-white'
                            : 'bg-surface-800 text-surface-500 border border-surface-700'
                            }`}>
                            {step > s ? '✓' : s}
                        </div>
                        <span className={`text-sm hidden sm:inline ${step >= s ? 'text-emerald-400' : 'text-surface-600'}`}>
                            {s === 1 ? 'Choose Slot' : s === 2 ? 'Meeting Type' : 'Request Sent'}
                        </span>
                        {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-surface-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Slot */}
            {step === 1 && (
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="glass-card p-6 h-24" />
                            ))}
                        </div>
                    ) : Object.keys(grouped).length === 0 ? (
                        <div className="glass-card p-16 text-center">
                            <HiOutlineCalendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                            <p className="text-lg text-surface-400">No available slots right now</p>
                            <p className="text-sm text-surface-500 mt-1">Please check back later</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(grouped).sort().map(([date, daySlots]) => {
                                const dateObj = new Date(date + 'T00:00:00')
                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

                                return (
                                    <div key={date}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-medium text-emerald-400">
                                                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-base font-bold text-emerald-300">{dateObj.getDate()}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-surface-200">{dayName}</h3>
                                                <p className="text-xs text-surface-500">{dateStr}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {daySlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => {
                                                        setSelectedSlot(slot)
                                                        setStep(2)
                                                    }}
                                                    className={`p-4 rounded-xl border text-left transition-all duration-200 group
                                                        hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:-translate-y-0.5
                                                        ${selectedSlot?.id === slot.id
                                                            ? 'border-emerald-500/50 bg-emerald-500/10'
                                                            : 'border-surface-700/50 bg-surface-800/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <HiOutlineClock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                        <span className="font-semibold text-surface-200">
                                                            {slot.start_time?.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-surface-500">
                                                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                                    </p>
                                                    <p className="text-xs text-emerald-400/60 mt-1">
                                                        {slot.duration_minutes} min
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Meeting Type & Time Refinement */}
            {step === 2 && selectedSlot && (
                <div className="animate-fade-in max-w-lg">
                    <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-2 text-sm text-surface-400 hover:text-emerald-400 mb-6 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Back to Slots
                    </button>

                    {/* Selected Slot Summary */}
                    <div className="glass-card p-4 mb-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-emerald-400">
                                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold text-emerald-300">
                                {new Date(selectedSlot.date + 'T00:00:00').getDate()}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-surface-200">
                                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-emerald-400/80 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                                Open from {selectedSlot.start_time?.slice(0, 5)} to {selectedSlot.end_time?.slice(0, 5)}
                            </p>
                        </div>
                    </div>

                    {/* Booking context */}
                    <div className="glass-card p-4 mb-6 border-l-4 border-l-emerald-500/50">
                        <p className="text-sm text-surface-300">
                            <HiOutlineUser className="inline w-4 h-4 mr-2 text-emerald-400" />
                            {user?.role === 'admin' ? (
                                <span className="text-emerald-400 font-bold italic underline">Admin: Booking for client below</span>
                            ) : (
                                <>Booking as <span className="text-emerald-400 font-bold">{user?.first_name || user?.email}</span></>
                            )}
                        </p>
                    </div>

                    <form onSubmit={handleBook} className="space-y-6">
                        {/* Client Info (Editable) */}
                        <div className="glass-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-surface-100 mb-2 flex items-center gap-2">
                                <HiOutlineUser className="text-emerald-400" />
                                Client Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.client_name}
                                        onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                                        className="input-field"
                                        placeholder="Client Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">Email Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.client_email}
                                        onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                                        className="input-field"
                                        placeholder="client@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Time Refinement Section */}
                        <div className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/[0.02]">
                            <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                                <HiOutlineClock className="text-emerald-400" />
                                Refine Meeting Time
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Required</span>
                            </h2>
                            <p className="text-xs text-surface-500 mb-4">You can meet for any duration within the provider's available range.</p>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Meeting Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[15, 30, 45, 60].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setForm({ ...form, duration: d })}
                                            className={`py-2 rounded-lg border text-sm font-medium transition-all ${form.duration === d
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                                                : 'border-surface-700 bg-surface-800/40 text-surface-400 hover:border-surface-600'
                                                }`}
                                        >
                                            {d}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-surface-500 mb-4">
                                Provider is available from <b>{selectedSlot.start_time?.slice(0, 5)}</b> to <b>{selectedSlot.end_time?.slice(0, 5)}</b>.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">Your Start Time</label>
                                    <input
                                        type="time"
                                        step="900"
                                        value={form.start_time}
                                        min={selectedSlot.start_time?.slice(0, 5)}
                                        max={selectedSlot.end_time?.slice(0, 5)}
                                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                        className={`input-field ${!isWithinSlot(form.start_time, 'start') ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">End Time (Auto)</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        readOnly
                                        className={`input-field opacity-70 cursor-not-allowed ${!isWithinSlot(form.end_time, 'end') ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Meeting Type Selection */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-surface-100 mb-5">Choose Meeting Type</h2>

                            {/* Meeting Type Selection */}
                            <div className="space-y-3">
                                {meetingTypes.map(({ value, label, icon: Icon, desc }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setForm({ ...form, meeting_type: value })}
                                        className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${form.meeting_type === value
                                            ? 'border-emerald-500/50 bg-emerald-500/10'
                                            : 'border-surface-700/50 bg-surface-800/40 hover:border-surface-600'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.meeting_type === value
                                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                                            : 'bg-surface-700/50 border border-surface-600/30'
                                            }`}>
                                            <Icon className={`w-5 h-5 ${form.meeting_type === value ? 'text-emerald-400' : 'text-surface-500'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${form.meeting_type === value ? 'text-emerald-300' : 'text-surface-300'}`}>{label}</p>
                                            <p className="text-xs text-surface-500">{desc}</p>
                                        </div>
                                        {form.meeting_type === value && (
                                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Notes (optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Anything you'd like us to know..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !isWithinSlot(form.start_time, 'start') || !isWithinSlot(form.end_time, 'end')}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 
                                           text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg
                                           hover:shadow-emerald-500/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                )}
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && booking && (
                <div className="animate-slide-up max-w-lg text-center mx-auto">
                    <div className="glass-card p-10">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <HiOutlineCheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-surface-100 mb-2">Booking Request Sent!</h2>
                        <p className="text-surface-400 mb-8">
                            Your appointment is <span className="text-emerald-400">pending admin approval</span>.
                        </p>

                        <div className="bg-surface-800/50 rounded-xl p-5 text-left space-y-3 mb-8">
                            <div className="flex justify-between">
                                <span className="text-sm text-surface-500">Date</span>
                                <span className="text-sm font-medium text-surface-200">{booking.slot_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-surface-500">Time</span>
                                <span className="text-sm font-medium text-surface-200">
                                    {booking.slot_start_time?.slice(0, 5)} – {booking.slot_end_time?.slice(0, 5)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-surface-500">Type</span>
                                <span className="text-sm font-medium text-surface-200 capitalize">
                                    {booking.meeting_type?.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-surface-500">Status</span>
                                <span className="badge badge-confirmed">{booking.status}</span>
                            </div>
                            {booking.status === 'confirmed' && booking.meet_link && (
                                <div className="flex justify-between items-center pt-2 border-t border-surface-700/50">
                                    <span className="text-sm text-surface-500">Google Meet</span>
                                    <a
                                        href={booking.meet_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                                    >
                                        <HiOutlineVideoCamera className="w-4 h-4" />
                                        Join Meeting
                                    </a>
                                </div>
                            )}
                            {booking.status === 'pending' && (
                                <div className="pt-2 border-t border-surface-700/50 text-center">
                                    <p className="text-xs text-surface-500 italic">
                                        Meet link will appear here once approved
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setStep(1)
                                    setSelectedSlot(null)
                                    setBooking(null)
                                    setForm({ meeting_type: 'video', notes: '' })
                                    fetchSlots()
                                }}
                                className="btn-secondary"
                            >
                                Book Another
                            </button>
                            <a href={user?.role === 'admin' ? '/admin/bookings' : '/user/my-bookings'} className="btn-primary inline-flex items-center gap-2">
                                {user?.role === 'admin' ? 'View All Bookings' : 'View My Bookings'}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
