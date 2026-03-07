"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { rolesInfo, permissionMatrix } from '@/data/roles';

export default function RolesPage() {
    const [currentRole, setCurrentRole] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('nids_role') || rolesInfo.currentUser;
        }
        return rolesInfo.currentUser;
    });

    React.useEffect(() => {
        localStorage.setItem('nids_role', currentRole);
        // Refresh the page to apply new permissions across the app
        window.dispatchEvent(new Event('storage'));
    }, [currentRole]);

    const [toast, setToast] = useState(null);

    const showRestrictedToast = (message = "Access restricted to Admin role") => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const hasPermission = (permission) => {
        return rolesInfo.permissions[currentRole]?.includes(permission);
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 p-8 pt-12 relative overflow-hidden">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-8 z-[200]">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-3 font-bold text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        {toast}
                    </motion.div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Access <span className="text-violet-500">Governance</span></h1>
                        <p className="text-gray-400">Switch between system roles to test Role-Based Access Control (RBAC).</p>
                    </div>

                    <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 px-3">Simulate Role:</span>
                        <div className="flex gap-1">
                            {rolesInfo.roles.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setCurrentRole(role)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRole === role
                                        ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                                        : 'bg-transparent text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Permission Matrix Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white">Permissions Matrix</h3>
                                <p className="text-xs text-gray-500">Current access breakdown for {currentRole}.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                                            <th className="px-6 py-4">Module / Feature</th>
                                            {['Admin', 'Analyst', 'User'].map(role => (
                                                <th
                                                    key={role}
                                                    className={`px-6 py-4 transition-colors duration-300 ${currentRole === role ? 'text-violet-400 bg-violet-500/5' : ''}`}
                                                >
                                                    {role}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {permissionMatrix.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-medium text-white group-hover:text-violet-300 transition-colors uppercase text-xs">{item.module}</td>

                                                {/* Admin Column */}
                                                <td className={`px-6 py-4 transition-all duration-300 ${currentRole === 'Admin' ? 'bg-violet-500/10' : ''}`}>
                                                    <div className="flex items-center justify-center">
                                                        {item.admin ? (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-800 opacity-30" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Analyst Column */}
                                                <td className={`px-6 py-4 transition-all duration-300 ${currentRole === 'Analyst' ? 'bg-fuchsia-500/10' : ''}`}>
                                                    <div className="flex items-center justify-center">
                                                        {item.analyst ? (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-800 opacity-30" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* User Column */}
                                                <td className={`px-6 py-4 transition-all duration-300 ${currentRole === 'User' ? 'bg-amber-500/10' : ''}`}>
                                                    <div className="flex items-center justify-center">
                                                        {item.user ? (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-800 opacity-30" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RBAC Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-violet-900/10 border border-violet-500/30 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                When you change the role above, the system stores your choice in local storage and updates the global permission engine.
                            </p>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                <p className="text-xs font-bold text-violet-400 uppercase">Current Security Level:</p>
                                <p className="text-lg font-mono text-white">{currentRole.toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 italic">Deployment Note</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                This simulation allows you to test different user experiences. In production, roles are assigned via secure JWT tokens issued by the authentication server.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
