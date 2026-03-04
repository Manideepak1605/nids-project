'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, permission = null }) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/login?redirect=${pathname}`);
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="text-violet-500 animate-spin" />
                <p className="text-gray-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                    Authenticating Session...
                </p>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    if (permission && !hasPermission(permission)) {
        router.push('/403');
        return null;
    }

    return children;
}
