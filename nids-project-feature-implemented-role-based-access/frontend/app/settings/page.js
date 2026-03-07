"use client";
import React from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Settings, Shield, Bell, Zap, Save, RefreshCcw } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = React.useState('detection');

    return (
        <ProtectedRoute permission="system_settings">
            <div className="min-h-screen bg-black text-gray-200 p-8">
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                            <Settings className="text-violet-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">System <span className="text-violet-500">Settings</span></h1>
                            <p className="text-gray-400 text-sm">Configure NIDS detection thresholds and global parameters.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar tabs */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('detection')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-3 ${activeTab === 'detection'
                                    ? 'bg-violet-600/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                <Shield size={18} /> Detection Engine
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-3 ${activeTab === 'notifications'
                                    ? 'bg-violet-600/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                <Bell size={18} /> Notifications
                            </button>
                            <button
                                onClick={() => setActiveTab('api')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-3 ${activeTab === 'api'
                                    ? 'bg-violet-600/10 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5'
                                    }`}
                            >
                                <Zap size={18} /> API & Integration
                            </button>
                        </div>

                        {/* Main Settings Form */}
                        <div className="md:col-span-2 space-y-8">
                            {activeTab === 'detection' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Detection Sensitivity</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Anomaly Threshold</label>
                                                <span className="text-violet-400 font-mono text-xs">0.85 (High Precision)</span>
                                            </div>
                                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full w-[85%] bg-gradient-to-r from-violet-600 to-fuchsia-500"></div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-relaxed italic">Lower values increase sensitivity for "Stealth" anomalies but may lead to higher false positives.</p>
                                        </div>

                                        <div className="flex items-center justify-between py-4 border-t border-white/5">
                                            <div>
                                                <p className="text-sm font-bold text-white">Hybrid-v2.4 Adaptive Learning</p>
                                                <p className="text-xs text-gray-500">Allow model to auto-adjust thresholds based on baseline traffic.</p>
                                            </div>
                                            <div className="w-12 h-6 bg-violet-600 rounded-full relative p-1 cursor-pointer">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Network Interface</h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Active Interface</label>
                                            <div className="relative group">
                                                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 appearance-none outline-none focus:border-violet-500/50 cursor-pointer">
                                                    <option>Wi-Fi (Running)</option>
                                                    <option>Ethernet (Auto-switch)</option>
                                                </select>
                                                <RefreshCcw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-violet-400 transition-colors pointer-events-none" />
                                            </div>
                                            <p className="text-[10px] text-emerald-500 font-mono flex items-center gap-1.5 mt-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                System listening on wlan0 interface
                                            </p>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'notifications' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Alert Preferences</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Critical Threat Email Alerts", desc: "Immediate notification for DoS and Brute Force attacks.", enabled: true },
                                                { label: "Daily Security Briefing", desc: "Summarized forensics report delivered every 24 hours.", enabled: false },
                                                { label: "Mobile Push Notifications", desc: "Receive alerts on the NIDS mobile terminal.", enabled: true }
                                            ].map((opt, i) => (
                                                <div key={i} className="flex items-center justify-between py-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{opt.label}</p>
                                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                                    </div>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${opt.enabled ? 'bg-violet-600' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 bottom-1 w-3 h-3 bg-white rounded-full transition-all ${opt.enabled ? 'right-1' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'api' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                        <h3 className="text-lg font-bold text-white mb-4">API Access</h3>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Master API Key</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-violet-400 flex items-center overflow-hidden">
                                                    nids_live_sk_**************************8293
                                                </div>
                                                <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10">Rotate</button>
                                            </div>
                                            <p className="text-[10px] text-gray-500 italic">Use this key to integrate NIDS logs with external SIEM tools like Splunk or ElasticSearch.</p>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors">
                                    Cancel
                                </button>
                                <button className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-violet-700 transition-shadow shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                    <Save size={18} /> Save Settings
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
