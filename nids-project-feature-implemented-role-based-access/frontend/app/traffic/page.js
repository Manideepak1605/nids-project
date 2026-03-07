"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Activity, ArrowUpRight, ArrowDownRight, Wifi } from 'lucide-react';

export default function TrafficMonitorPage() {
    const [trafficData, setTrafficData] = useState([]);
    const [currentStats, setCurrentStats] = useState({ pps: 0, bps: 0, analyzed: 0 });

    useEffect(() => {
        const fetchTraffic = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/stats");
                if (res.ok) {
                    const data = await res.json();
                    const now = new Date().toLocaleTimeString();

                    setCurrentStats({
                        pps: data.packets_per_second || 0,
                        bps: (data.bytes_per_second || 0) / 1024, // KB/s
                        analyzed: data.total_analyzed || 0
                    });

                    setTrafficData(prev => {
                        const next = [...prev, { time: now, pps: data.packets_per_second || 0, kbps: (data.bytes_per_second || 0) / 1024 }];
                        if (next.length > 20) return next.slice(next.length - 20); // Keep last 20
                        return next;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch traffic stats", err);
            }
        };

        fetchTraffic();
        const interval = setInterval(fetchTraffic, 2000);
        return () => clearInterval(interval);
    }, []);

    // Find max values for scaling the simple bar chart
    const maxPps = Math.max(...trafficData.map(d => d.pps), 10);
    const maxKbps = Math.max(...trafficData.map(d => d.kbps), 10);

    return (
        <ProtectedRoute permission="view_dashboard">
            <div className="min-h-screen bg-black text-gray-200 p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                            <Wifi className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Live Traffic Monitor</h1>
                            <p className="text-gray-400 text-sm">Real-time network interface packet flow</p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <Activity size={16} /> Packets Per Second
                            </p>
                            <p className="text-3xl font-bold text-white">{currentStats.pps.toFixed(1)} <span className="text-sm font-normal text-gray-500">pps</span></p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <ArrowUpRight size={16} className="text-emerald-400" /> Bandwidth
                            </p>
                            <p className="text-3xl font-bold text-white">{currentStats.bps.toFixed(1)} <span className="text-sm font-normal text-gray-500">KB/s</span></p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <ArrowDownRight size={16} className="text-blue-400" /> Total Flows Analyzed
                            </p>
                            <p className="text-3xl font-bold text-white">{currentStats.analyzed.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Packet Rate History</h3>
                        <div className="h-64 flex items-end gap-2">
                            {trafficData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div
                                        className="w-full bg-cyan-500/80 rounded-t-sm transition-all duration-300 relative"
                                        style={{ height: `${(d.pps / maxPps) * 100}%`, minHeight: '4px' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                            {d.pps.toFixed(1)} pps
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono rotate-90 origin-left translate-y-4 translate-x-1/2 w-4">
                                        {d.time.split(':')[2]}s
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
