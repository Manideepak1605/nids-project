"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Search, Hexagon, ShieldCheck } from "lucide-react";
import Badge from '../ui/Badge';
import { apiService } from "@/services/api";

export default function TopNavbar() {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                await apiService.getStats();
                setIsConnected(true);
            } catch {
                setIsConnected(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);
    return (
        <nav className="h-14 md:h-16 border-b border-white/10 bg-[#0f0f1a]/80 backdrop-blur-md sticky top-0 z-30 ml-0 md:ml-64 px-4 md:px-6 flex items-center justify-between print:hidden">

            {/* Left side info */}
            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-white/5">
                    <Hexagon size={14} className="text-violet-400" />
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Model Engine:</span>
                    <span className="text-[10px] font-mono font-bold text-white">Hybrid-v2.4</span>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <div className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Analysis</span>
                </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden sm:flex relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search IPs, alerts, rules..."
                        className="bg-black/40 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-gray-200 w-48 lg:w-64 transition-all"
                    />
                </div>

                {/* System Status Badge */}
                <Badge
                    label={isConnected ? "NIDS Active" : "Disconnected"}
                    variant={isConnected ? "ONLINE" : "OFFLINE"}
                    className="hidden sm:flex"
                />

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-[#0f0f1a]"></span>
                </button>

                {/* Profile/Admin */}
                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full bg-[#0a0a14] rounded-full flex items-center justify-center">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                    </div>
                    <div className="hidden lg:block text-left">
                        <p className="text-xs font-bold text-white uppercase">SecOps Lead</p>
                        <p className="text-[10px] text-gray-400 font-mono">admin@nids.local</p>
                    </div>
                </div>
            </div>

        </nav>
    );
}
