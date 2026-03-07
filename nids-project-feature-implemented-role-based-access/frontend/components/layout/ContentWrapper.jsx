'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import ProtectedRoute from "../auth/ProtectedRoute";

export default function ContentWrapper({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <main>{children}</main>;
    }

    return (
        <ProtectedRoute>
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area (offset by Sidebar width on MD+ screens) */}
            <div className="relative z-10 md:ml-64 print:ml-0 flex flex-col min-h-screen transition-all duration-300">
                <TopNavbar />
                <div className="flex-1 p-4 md:p-6 print:p-0">
                    {children}
                </div>
            </div>
        </ProtectedRoute>
    );
}
