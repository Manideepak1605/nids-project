'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [csrfToken, setCsrfToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.user);
            setPermissions(data.user.permissions || []);
            // CSRF might be issued on 'me' or refresh
            if (data.csrfToken) setCsrfToken(data.csrfToken);
        } catch (error) {
            setUser(null);
            setPermissions([]);
            setCsrfToken(null);
            // Only redirect if not on login page
            if (pathname !== '/login') {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const hasPermission = (permissionName) => {
        return permissions.includes(permissionName);
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data.user);
            setPermissions(data.user.permissions || []);
            setCsrfToken(data.csrfToken);
            router.push('/dashboard');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Login failed.'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
            setPermissions([]);
            setCsrfToken(null);
            router.push('/login');
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__CSRF_TOKEN__ = csrfToken;
        }
    }, [csrfToken]);

    return (
        <AuthContext.Provider value={{ user, permissions, csrfToken, setCsrfToken, loading, hasPermission, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Alias for transition/backward compatibility with PermissionContext components
export const usePermission = useAuth;
