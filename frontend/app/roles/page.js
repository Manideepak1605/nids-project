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
    }, [currentRole]);
    const [toast, setToast] = useState(null);

    const showRestrictedToast = (message = "Access restricted to Admin role") => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const hasPermission = (permission) => {
        return rolesInfo.permissions[currentRole].includes(permission);
    };

    const handleDownload = () => {
        if (!hasPermission('view_forensics')) {
            showRestrictedToast("Access restricted: Analyst/Admin only");
            return;
        }
        const saved = localStorage.getItem('last_analysis');
        if (!saved) { alert("No analysis data found."); return; }
        const data = JSON.parse(saved);
        const csvContent = "data:text/csv;charset=utf-8," + Object.keys(data.results[0]).join(",") + "\n" +
            data.results.map(row => Object.values(row).join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `NIDS_RBAC_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleModifyPermissions = () => {
        if (!hasPermission('manage_roles')) {
            showRestrictedToast("Access restricted: Admin Only");
            return;
        }
        alert("Success: Security policy updated.");
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
                        <p className="text-gray-400">Role-Based Access Control (RBAC) and permission structures.</p>
                    </div>

                    <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 px-3">Active Role:</span>
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
                                <p className="text-xs text-gray-500">System-wide module access breakdown by role.</p>
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
                                                <td className="px-6 py-4 font-medium text-white group-hover:text-violet-300 transition-colors">{item.module}</td>

                                                {/* Admin Column */}
                                                <td className={`px-6 py-4 cursor-pointer transition-all duration-300 ${currentRole === 'Admin' ? 'bg-violet-500/10' : ''}`}
                                                    onClick={() => !item.admin && showRestrictedToast("This permission is only granted to Admin")}>
                                                    <div className="flex items-center justify-center">
                                                        {item.admin ? (
                                                            <motion.div
                                                                key={`admin-active-${currentRole}`}
                                                                animate={currentRole === 'Admin' ? {
                                                                    scale: [1, 1.2, 1],
                                                                    opacity: [1, 0.7, 1],
                                                                    filter: ["drop-shadow(0 0 2px #22c55e)", "drop-shadow(0 0 10px #22c55e)", "drop-shadow(0 0 2px #22c55e)"]
                                                                } : { scale: 1, opacity: 0.5 }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                                className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                            />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-800 opacity-30" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Analyst Column */}
                                                <td className={`px-6 py-4 cursor-pointer transition-all duration-300 ${currentRole === 'Analyst' ? 'bg-violet-500/10' : ''}`}
                                                    onClick={() => !item.analyst && showRestrictedToast("Access limited to Analyst/Admin roles")}>
                                                    <div className="flex items-center justify-center">
                                                        {item.analyst ? (
                                                            <motion.div
                                                                key={`analyst-active-${currentRole}`}
                                                                animate={currentRole === 'Analyst' ? {
                                                                    scale: [1, 1.2, 1],
                                                                    opacity: [1, 0.7, 1],
                                                                    filter: ["drop-shadow(0 0 2px #22c55e)", "drop-shadow(0 0 10px #22c55e)", "drop-shadow(0 0 2px #22c55e)"]
                                                                } : { scale: 1, opacity: 0.5 }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                                className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                            />
                                                        ) : (
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-800 opacity-30" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* User Column */}
                                                <td className={`px-6 py-4 cursor-pointer transition-all duration-300 ${currentRole === 'User' ? 'bg-violet-500/10' : ''}`}
                                                    onClick={() => !item.user && showRestrictedToast("Basic Users have limited visibility")}>
                                                    <div className="flex items-center justify-center">
                                                        {item.user ? (
                                                            <motion.div
                                                                key={`user-active-${currentRole}`}
                                                                animate={currentRole === 'User' ? {
                                                                    scale: [1, 1.2, 1],
                                                                    opacity: [1, 0.7, 1],
                                                                    filter: ["drop-shadow(0 0 2px #22c55e)", "drop-shadow(0 0 10px #22c55e)", "drop-shadow(0 0 2px #22c55e)"]
                                                                } : { scale: 1, opacity: 0.5 }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                                className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                            />
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

                    {/* Role Management Simulator */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-violet-900/10 border border-violet-500/30 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">RBAC Enforcement Demo</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                Below are UI elements that react to your current role. Switch roles above to see restricted interactions.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Role Management</label>
                                    <div className="group relative">
                                        <button
                                            onClick={handleModifyPermissions}
                                            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${hasPermission('manage_roles')
                                                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                                : 'bg-white/5 text-gray-600 cursor-not-allowed grayscale'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354l1.107 3.121h2.807l-2.27 1.649.867 3.121-2.511-1.822-2.511 1.822.867-3.121-2.27-1.649h2.807L12 4.354z"></path></svg>
                                            Modify Permissions
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Forensics Report</label>
                                    <div className="group relative">
                                        <button
                                            onClick={handleDownload}
                                            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${hasPermission('view_forensics')
                                                ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-500/20 active:scale-95'
                                                : 'bg-white/5 text-gray-600 cursor-not-allowed grayscale'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                            Download Report
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 mt-6 pointer-events-none" onClick={() => currentRole !== 'Admin' && showRestrictedToast("System Settings require Admin override")}>
                                    <div className={`flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 ${currentRole !== 'Admin' ? 'opacity-50 grayscale' : ''}`}>
                                        <span className="text-xs text-gray-400">Settings Access</span>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${currentRole === 'Admin' ? 'bg-violet-600' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-1 bottom-1 w-3 rounded-full bg-white transition-all ${currentRole === 'Admin' ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 italic">Security Note</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                UI-level enforcement is only for user experience. Real NIDS installations must enforce permissions at the API and Data layer to ensure zero-trust architecture.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
