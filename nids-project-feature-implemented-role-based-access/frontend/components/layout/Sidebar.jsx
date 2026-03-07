"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Activity, LayoutTemplate, ShieldAlert, Settings, CopyX } from "lucide-react";
import { usePermission } from "@/context/PermissionContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { hasPermission } = usePermission();

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
        { href: "/alerts", label: "Live Alerts", icon: Radio, permission: "view_alerts" },
        { href: "/traffic", label: "Traffic Monitor", icon: Activity, permission: "view_live_traffic" },
        { href: "/forensics", label: "Forensics", icon: LayoutTemplate, permission: "view_logs" },
        { href: "/xai", label: "Explainable AI (XAI)", icon: Activity, permission: "view_logs" },
        { href: "/roles", label: "Access Control", icon: ShieldAlert, permission: "manage_roles" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "system_settings" },
    ];

    const filteredItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0a14] border-r border-violet-500/10 flex flex-col z-40 hidden md:flex print:hidden">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(139,92,246,0.6)]">
                        <CopyX size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-widest uppercase">NIDS<span className="text-violet-500">.</span></span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                <p className="px-2 text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-4">Core System</p>

                {filteredItems.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${isActive
                                ? "bg-violet-500/10 text-violet-400"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
                            )}
                            <Icon size={18} className={`transition-colors ${isActive ? "text-violet-400" : "group-hover:text-white"}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-white/5 bg-black/40 space-y-3">
                {hasPermission('developer_override') && (
                    <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-2.5 animate-pulse">
                        <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1.5">
                            <ShieldAlert size={12} />
                            Developer Mode Active
                        </p>
                        <p className="text-[9px] text-amber-200/60 leading-tight mt-1">
                            Full system access enabled inside tenant boundary.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                    <div>
                        <p className="text-xs font-bold text-white uppercase">System Secure</p>
                        <p className="text-[10px] text-gray-500 font-mono">Sensors: Active</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
