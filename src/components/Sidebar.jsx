import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    HiOutlineViewGrid,
    HiOutlineClock,
    HiOutlineCalendar,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlinePlus,
} from 'react-icons/hi'

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
    { to: '/admin/availability', label: 'Availability', icon: HiOutlineClock },
    { to: '/admin/bookings', label: 'All Bookings', icon: HiOutlineCalendar },
    { to: '/admin/book', label: 'Book Appointment', icon: HiOutlinePlus },
    { to: '/admin/my-bookings', label: 'Personal Bookings', icon: HiOutlineCalendar },
    { to: '/admin/settings', label: 'Settings', icon: HiOutlineCog },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-surface-900/80 backdrop-blur-xl border-r border-surface-700/50">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-700/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                        ByteSlot
                    </h1>
                    <p className="text-xs text-surface-500">Scheduling System</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20 shadow-glow'
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
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-200 truncate">
                                {user?.first_name || user?.username}
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
}
