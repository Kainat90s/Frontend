import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import UserSidebar from './UserSidebar'
import { HiOutlineMenu } from 'react-icons/hi'

export default function UserLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden">
            <UserSidebar variant="desktop" />
            <UserSidebar variant="mobile" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto bg-surface-950 p-6 lg:p-8">
                {/* Mobile top bar */}
                <div className="lg:hidden -mx-6 -mt-6 mb-6 px-6 py-4 bg-surface-950/90 backdrop-blur border-b border-surface-800/60 sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-surface-200 tracking-wide">
                            My Dashboard
                        </div>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl bg-surface-900/70 border border-surface-800/60 flex items-center justify-center text-surface-200"
                            aria-label="Open menu"
                        >
                            <HiOutlineMenu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
