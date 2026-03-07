"use client";
import { Activity, ShieldAlert, BarChart3, Fingerprint, ActivitySquare, ServerCrash, RefreshCw } from "lucide-react";
import Card from "../ui/Card";
import AnimatedCounter from "../ui/AnimatedCounter";
export default function KpiCards({ data: kpi, loading, error, handleRetry }) {
    if (!kpi) return null;

    const cards = [
        {
            title: "Total Traffic Today",
            value: kpi.totalTraffic,
            icon: Activity,
            color: "blue",
            suffix: "",
        },
        {
            title: "Attacks Blocked",
            value: kpi.totalAttacks,
            icon: ShieldAlert,
            color: "red",
        },
        {
            title: "Attack Rate",
            value: kpi.attackRate,
            icon: BarChart3,
            color: "orange",
            suffix: "%",
        },
        {
            title: "High Severity Alerts",
            value: kpi.highSeverity,
            icon: ServerCrash,
            color: "violet",
        },
        {
            title: "Unique Threat IPs",
            value: kpi.uniqueIPs,
            icon: Fingerprint,
            color: "cyan",
        },
        {
            title: "Engine Status",
            value: error ? 0 : (kpi.systemStatus === "Healthy" ? 100 : 50),
            icon: ActivitySquare,
            color: error ? "red" : (kpi.systemStatus === "Healthy" ? "green" : "orange"),
            prefix: "",
            suffix: error ? " OFFLINE" : (kpi.systemStatus === "Healthy" ? "% Uptime" : "% WARNING"),
            isStatusCard: true
        },
    ];

    const isDisconnected = !!error;

    const colorMap = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]",
        orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {cards.map((c, i) => {
                const Icon = c.icon;
                return (
                    <Card key={i} glowColor={c.color} className="p-3 lg:p-4 relative overflow-hidden group">
                        {/* Background accent line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorMap[c.color].split(' ')[0].replace('text-', 'bg-')}`}></div>

                        <div className="flex justify-between items-start mb-4">
                            <p className="text-gray-400 font-medium text-sm tracking-wide uppercase">{c.title}</p>
                            <div className={`p-2 rounded-lg border flex-shrink-0 ${colorMap[c.color]} transition-colors duration-500`}>
                                <Icon size={18} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-8 md:h-9 bg-white/5 rounded-md animate-pulse w-2/3"></div>
                        ) : (
                            <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter ${c.color === 'red' ? 'text-red-500' : 'text-gray-100'}`}>
                                {isDisconnected && !c.isStatusCard ? (
                                    <span className="text-gray-500 text-xl md:text-2xl">--</span>
                                ) : (
                                    <AnimatedCounter value={c.value} prefix={c.prefix} suffix={c.suffix} />
                                )}
                            </h3>
                        )}

                        {c.isStatusCard && (
                            <div className="mt-3 flex justify-between items-center text-xs font-mono">
                                <span className="text-gray-500">
                                    Last Updated: {kpi.lastUpdated ? kpi.lastUpdated : "--:--:--"}
                                </span>
                                {isDisconnected && (
                                    <button
                                        onClick={handleRetry}
                                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-2 py-1 rounded"
                                        title="Retry Connection"
                                    >
                                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Retry
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Soft background glow */}
                        <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorMap[c.color].split(' ')[1]}`}></div>
                    </Card>
                );
            })}
        </div>
    );
}
