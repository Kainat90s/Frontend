import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineUser,
    HiOutlineMail,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineCheckCircle,
    HiOutlineArrowLeft,
} from 'react-icons/hi'

const api = axios.create({ baseURL: '/api' })

const meetingTypes = [
    { value: 'video', label: 'Video Call', icon: HiOutlineVideoCamera, desc: 'Google Meet link will be generated' },
    { value: 'phone', label: 'Phone Call', icon: HiOutlinePhone, desc: 'We will call you' },
    { value: 'in_person', label: 'In Person', icon: HiOutlineUser, desc: 'Visit our office' },
]

export default function PublicBookingPage() {
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(1) // 1=select slot, 2=fill details, 3=success
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [booking, setBooking] = useState(null)
    const [form, setForm] = useState({
        client_name: '',
        client_email: '',
        meeting_type: 'video',
        duration: 30, // Default 30 mins
        notes: '',
        start_time: '',
        end_time: '',
    })


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

    const fetchSlots = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/availability/slots/')
            setSlots(data.results || data)
        } catch {
            toast.error('Failed to load available slots')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSlots()
    }, [fetchSlots])

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

    // Group slots by date - optimized with useMemo
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
        <div className="min-h-screen bg-surface-950 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' },
                }}
            />

            {/* Header */}
            <header className="relative z-10 border-b border-surface-800/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                        <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                            ByteSlot
                        </h1>
                        <p className="text-xs text-surface-500">Book Your Appointment</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= s
                                ? 'bg-primary-500 text-white shadow-glow'
                                : 'bg-surface-800 text-surface-500 border border-surface-700'
                                }`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-sm hidden sm:inline ${step >= s ? 'text-primary-400' : 'text-surface-600'}`}>
                                {s === 1 ? 'Choose Slot' : s === 2 ? 'Your Details' : 'Request Sent'}
                            </span>
                            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-surface-700'}`} />}
                        </div>
                    ))}
                </div>

                {/* ——— Step 1: Select Slot ——— */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-surface-100">Select a Time Slot</h2>
                            <p className="text-surface-400 mt-1">Choose a date and time that works for you</p>
                        </div>

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
                                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] font-medium text-primary-400">
                                                        {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                                    </span>
                                                    <span className="text-base font-bold text-primary-300">{dateObj.getDate()}</span>
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
                               hover:border-primary-500/40 hover:bg-primary-500/5 hover:-translate-y-0.5 hover:shadow-glow
                               ${selectedSlot?.id === slot.id
                                                                ? 'border-primary-500/50 bg-primary-500/10 shadow-glow'
                                                                : 'border-surface-700/50 bg-surface-800/40'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <HiOutlineClock className="w-4 h-4 text-primary-400 group-hover:scale-110 transition-transform" />
                                                            <span className="font-semibold text-surface-200">
                                                                {slot.start_time?.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-surface-500">
                                                            {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                                        </p>
                                                        <p className="text-xs text-primary-400/60 mt-1">
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

                {/* ——— Step 2: Fill Details & Refine Time ——— */}
                {step === 2 && selectedSlot && (
                    <div className="animate-fade-in max-w-lg mx-auto">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-sm text-surface-400 hover:text-primary-400 mb-6 transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4" />
                            Back to Slots
                        </button>

                        <form onSubmit={handleBook} className="space-y-6">
                            {/* Selected Slot Summary & Time Refinement */}
                            <div className="glass-card p-6 border border-primary-500/20 bg-primary-500/[0.02]">
                                <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                                    <HiOutlineClock className="text-primary-400" />
                                    Refine Meeting Time
                                </h2>

                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Meeting Duration</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {[15, 30, 45, 60, 90, 120].map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setForm({ ...form, duration: d })}
                                                className={`py-2 rounded-lg border text-xs font-medium transition-all ${form.duration === d
                                                    ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                                                    : 'border-surface-700 bg-surface-800/40 text-surface-400 hover:border-surface-600'
                                                    }`}
                                            >
                                                {d < 60 ? `${d}m` : `${d / 60}h`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-surface-500 mb-4">
                                    Provider is available from <b>{selectedSlot.start_time?.slice(0, 5)}</b> to <b>{selectedSlot.end_time?.slice(0, 5)}</b>.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">Start Time</label>
                                        <input
                                            type="time"
                                            step="900"
                                            value={form.start_time}
                                            min={selectedSlot.start_time?.slice(0, 5)}
                                            max={selectedSlot.end_time?.slice(0, 5)}
                                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                            className={`input-field ${!isWithinSlot(form.start_time, 'start') ? 'border-red-500/50' : ''}`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">End Time (Auto)</label>
                                        <input
                                            type="time"
                                            value={form.end_time}
                                            readOnly
                                            className={`input-field opacity-70 cursor-not-allowed ${!isWithinSlot(form.end_time, 'end') ? 'border-red-500/50' : ''}`}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name *</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="text"
                                        required
                                        value={form.client_name}
                                        onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                                        className="input-field pl-11"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address *</label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="email"
                                        required
                                        value={form.client_email}
                                        onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                                        className="input-field pl-11"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {/* Meeting Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Meeting Type *</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {meetingTypes.map(({ value, label, icon: Icon, desc }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setForm({ ...form, meeting_type: value })}
                                            className={`p-3 rounded-xl border text-center transition-all duration-200 ${form.meeting_type === value
                                                ? 'border-primary-500/50 bg-primary-500/10 shadow-glow'
                                                : 'border-surface-700/50 bg-surface-800/40 hover:border-surface-600'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 mx-auto mb-1 ${form.meeting_type === value ? 'text-primary-400' : 'text-surface-500'
                                                }`} />
                                            <p className={`text-xs font-medium ${form.meeting_type === value ? 'text-primary-300' : 'text-surface-400'
                                                }`}>{label}</p>
                                        </button>
                                    ))}
                                </div>
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
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                )}
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ——— Step 3: Success ——— */}
                {step === 3 && booking && (
                    <div className="animate-slide-up max-w-lg mx-auto text-center">
                        <div className="glass-card p-10">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                                <HiOutlineCheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-surface-100 mb-2">Booking Request Sent!</h2>
                            <p className="text-surface-400 mb-8">
                                Your booking is <span className="text-primary-400">pending admin approval</span>. We'll notify you at {booking.client_email} once confirmed.
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
                                {booking.meet_link && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-surface-500">Meet Link</span>
                                        <a
                                            href={booking.meet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-400 hover:text-primary-300 underline"
                                        >
                                            Join Meeting
                                        </a>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setStep(1)
                                    setSelectedSlot(null)
                                    setBooking(null)
                                    setForm({ client_name: '', client_email: '', meeting_type: 'video', notes: '', start_time: '', end_time: '' })
                                    fetchSlots()
                                }}
                                className="btn-secondary"
                            >
                                Book Another Slot
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-surface-800/50 mt-20">
                <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-surface-600">
                    Powered by ByteSlot · Scheduling made simple
                </div>
            </footer>
        </div>
    )
}
