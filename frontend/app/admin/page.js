"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminData } from "../../data/admin";

export default function AdminPage() {
    const [currentRole, setCurrentRole] = useState("Admin");
    const [sensitivity, setSensitivity] = useState(75);
    const [scanInterval, setScanInterval] = useState(5);
    const [users, setUsers] = useState(adminData.users);
    const [logs, setLogs] = useState(adminData.auditLogs);
    const [selectedLog, setSelectedLog] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'DEPLOY' | 'SHUTDOWN', input: '' }

    useEffect(() => {
        const role = localStorage.getItem('nids_role') || "Admin";
        setCurrentRole(role);
    }, []);

    const handleConfirmAction = () => {
        if (confirmAction?.input === "CONFIRM") {
            alert(`Success: ${confirmAction.type === 'DEPLOY' ? 'Production model re-deployed' : 'Cluster shut down sequence initiated'}.`);
            setConfirmAction(null);
        }
    };

    if (currentRole !== "Admin") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white/5 border border-red-500/30 rounded-3xl p-10 text-center backdrop-blur-xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full translate-y-1/2"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2zm-7-3a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Shielded Network: Access Restricted</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Your current role (<span className="text-red-400 font-mono font-bold uppercase">{currentRole}</span>) does not have authorization to access the Infrastructure Governance Hub.
                        </p>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">
                            Security Protocol: 403_FORBIDDEN
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-gray-200 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">System <span className="text-violet-500">Management</span></h1>
                        <p className="text-gray-400 font-medium italic">Administrative Hub: Infrastructure Control & Governance</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end text-green-400 text-xs font-mono mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                            Node Cluster: ONLINE
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Uptime: 142d 11h 04m</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Management */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Identity Access Management</h3>
                                    <p className="text-xs text-gray-500">Manage organizational accounts and access levels.</p>
                                </div>
                                <button className="px-4 py-2 bg-violet-600/20 text-violet-400 rounded-lg text-xs font-bold border border-violet-500/30 hover:bg-violet-600/30 transition-all">
                                    + Invite User
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                                            <th className="px-6 py-4">User Identity</th>
                                            <th className="px-6 py-4">Current Role</th>
                                            <th className="px-6 py-4">Network Node (IP)</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-[10px] font-bold text-violet-200">
                                                            {user.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium text-sm">{user.name}</div>
                                                            <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded ${user.role === 'Admin' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                                                        user.role === 'Analyst' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{user.ip}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-700'}`}></span>
                                                        <span className={`text-[10px] font-bold uppercase ${user.status === 'Active' ? 'text-green-500' : 'text-gray-600'}`}>
                                                            {user.status}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Audit Logs */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white uppercase tracking-widest text-sm">System Audit Activity</h3>
                                <span className="text-[10px] text-violet-400 font-mono">LIVE_STREAM_ACTIVE</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {logs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedLog(selectedLog?.time === log.time ? null : log)}
                                        className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${selectedLog?.time === log.time ? 'bg-violet-500/10 border-violet-500/50' : 'bg-black/40 border-white/5 hover:border-violet-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-mono text-gray-600">{log.time}</span>
                                                <div className="text-xs">
                                                    <span className="text-violet-400 font-bold">{log.user}</span>
                                                    <span className="text-gray-400"> performed: </span>
                                                    <span className="text-white font-medium">{log.action}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-500/70">{log.status}</span>
                                        </div>
                                        <AnimatePresence>
                                            {selectedLog?.time === log.time && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] uppercase font-bold text-gray-600 mb-1">Impact Scope</p>
                                                            <p className="text-xs text-gray-400 italic">Entire Node Cluster (v24.1)</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] uppercase font-bold text-gray-600 mb-1">Policy Diff</p>
                                                            <p className="text-xs text-green-400 font-mono">+ model_threshold: 0.85</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-violet-900/10 border border-violet-500/30 rounded-2xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-16 h-16 text-violet-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-6">Security Engine Overrides</h3>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Model Sensitivity</label>
                                        <span className="text-violet-400 font-mono font-bold text-sm">{sensitivity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={sensitivity}
                                        onChange={(e) => setSensitivity(e.target.value)}
                                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                    />
                                    <p className="text-[9px] text-gray-600 italic">Adjusting this affects the False-Positive rate of the Autoencoder.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Traffic Scan Interval</label>
                                        <span className="text-fuchsia-400 font-mono font-bold text-sm">{scanInterval}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={scanInterval}
                                        onChange={(e) => setScanInterval(e.target.value)}
                                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 shadow-[0_0_10px_rgba(192,38,211,0.3)]"
                                    />
                                    <p className="text-[9px] text-gray-600 italic">Determines the frequency of real-time packet inspection cycles.</p>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={() => setConfirmAction({ type: 'DEPLOY', input: '' })}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-violet-100 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        Push Deployment [v2.4.1]
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction({ type: 'SHUTDOWN', input: '' })}
                                        className="w-full py-3 bg-transparent text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-500/10 transition-all text-xs active:scale-95"
                                    >
                                        Emergency Shutdown Cluster
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Infrastructure Health</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'CPU Cluster', val: '24%', color: 'bg-green-500' },
                                    { label: 'Neural Buffer', val: '88%', color: 'bg-yellow-500' },
                                    { label: 'Packet Bus', val: '12%', color: 'bg-green-500' }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500 uppercase font-bold">{item.label}</span>
                                            <span className="text-white font-mono">{item.val}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmAction && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmAction(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">Dangerous Operation</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                                You are about to initiate {confirmAction.type === 'DEPLOY' ? 'a production model re-deployment' : 'an emergency cluster shutdown'}. This will impact all live nodes.
                                <br /><br />
                                Please type <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">CONFIRM</span> below to execute.
                            </p>
                            <input
                                type="text"
                                value={confirmAction.input}
                                onChange={(e) => setConfirmAction({ ...confirmAction, input: e.target.value })}
                                placeholder="Type CONFIRM"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 outline-none focus:border-violet-500 font-mono tracking-widest text-center"
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={confirmAction.input !== "CONFIRM"}
                                    onClick={handleConfirmAction}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${confirmAction.input === 'CONFIRM' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
                                >
                                    Authorize
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
