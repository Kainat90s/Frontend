import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import UserLayout from './components/UserLayout'

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage'))
const UserDashboardPage = lazy(() => import('./pages/user/UserDashboardPage'))
const UserBookingPage = lazy(() => import('./pages/user/UserBookingPage'))
const UserMyBookingsPage = lazy(() => import('./pages/user/UserMyBookingsPage'))

function ProtectedRoute({ children, requiredRole }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />

    if (requiredRole && user.role !== requiredRole) {
        if (requiredRole === 'client' && user.role === 'admin') {
            return children
        }
        return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />
    }
    return children
}

function RoleRedirect() {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />
}

export default function App() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/book" element={<PublicBookingPage />} />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="availability" element={<AvailabilityPage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="book" element={<UserBookingPage />} />
                    <Route path="my-bookings" element={<UserMyBookingsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* User Routes */}
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute requiredRole="client">
                            <UserLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/user/dashboard" replace />} />
                    <Route path="dashboard" element={<UserDashboardPage />} />
                    <Route path="book" element={<UserBookingPage />} />
                    <Route path="my-bookings" element={<UserMyBookingsPage />} />
                </Route>

                {/* Root & catch-all redirect based on role */}
                <Route path="/" element={<RoleRedirect />} />
                <Route path="*" element={<RoleRedirect />} />
            </Routes>
        </Suspense>
    )
}

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-surface-400 font-medium animate-pulse">Loading ByteSlot...</p>
        </div>
    )
}
