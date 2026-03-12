import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    HiOutlineViewGrid,
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineLogout,
    HiOutlineX,
} from 'react-icons/hi'

const navItems = [
    { to: '/user/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
    { to: '/user/book', label: 'Book Appointment', icon: HiOutlineCalendar },
    { to: '/user/my-bookings', label: 'My Bookings', icon: HiOutlineClipboardList },
]

export default function UserSidebar({ variant = 'desktop', open = false, onClose = null }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const isMobile = variant === 'mobile'

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const sidebarContent = (
        <aside
            className={`${isMobile ? 'w-72 h-full' : 'w-72'} flex flex-col bg-surface-900/80 backdrop-blur-xl border-r border-surface-700/50`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-700/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                        ByteSlot
                    </h1>
                    <p className="text-xs text-surface-500">My Appointments</p>
                </div>
                {isMobile && (
                    <button
                        onClick={onClose}
                        className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-surface-800/70 transition-colors"
                        aria-label="Close menu"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User Card */}
            <div className="px-4 pb-6">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-200 truncate">
                                {user?.first_name || user?.email}
                            </p>
                            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-surface-400 
                       hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                        <HiOutlineLogout className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    )

    if (!isMobile) {
        return (
            <div className="hidden lg:flex">
                {sidebarContent}
            </div>
        )
    }

    return (
        <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`absolute right-0 top-0 h-full transform transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {sidebarContent}
            </div>
        </div>
    )
}
