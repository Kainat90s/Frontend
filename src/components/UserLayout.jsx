import { Outlet } from 'react-router-dom'
import UserSidebar from './UserSidebar'

export default function UserLayout() {
    return (
        <div className="flex h-screen overflow-hidden">
            <UserSidebar />
            <main className="flex-1 overflow-y-auto bg-surface-950 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
