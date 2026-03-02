"use client";

const SEVERITY_STYLES = {
    CRITICAL: "bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_8px_-2px_rgba(239,68,68,0.5)]",
    HIGH: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    MEDIUM: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    LOW: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    ONLINE: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    OFFLINE: "bg-red-500/15 text-red-400 border border-red-500/30",
    DEMO: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

export default function Badge({ label, variant = "MEDIUM", className = "" }) {
    const styles = SEVERITY_STYLES[variant] ?? SEVERITY_STYLES.MEDIUM;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${styles} ${className}`}>
            {label}
        </span>
    );
}
