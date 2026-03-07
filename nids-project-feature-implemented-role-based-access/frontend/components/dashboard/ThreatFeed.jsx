"use client";
import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { CopyX, Zap, Clock } from "lucide-react";

export default function ThreatFeed({ alerts, hasNewAttack }) {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (hasNewAttack) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 800);
            return () => clearTimeout(timer);
        }
    }, [hasNewAttack]);

    return (
        <Card
            glowColor="red"
            className={`p-4 col-span-1 xl:col-span-3 h-[300px] max-h-[300px] flex flex-col transition-all duration-300 ${flash ? "shadow-[0_0_40px_-5px_rgba(239,68,68,0.7)] border-red-500/80 bg-red-500/10" : ""
                }`}
        >
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        Priority Threat Feed <CopyX size={16} className={flash ? "text-red-400 animate-spin" : "text-violet-400"} />
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">Latest identified hostile actions</p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${flash ? "bg-red-500 animate-ping" : "bg-emerald-500"}`}></div>
                    <span className="text-[10px] font-mono text-gray-300 uppercase">Live Socket</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {alerts.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 font-mono text-sm">No threats in buffer.</p>
                    </div>
                ) : (
                    alerts.map((alert, idx) => (
                        <div
                            key={`${alert.id}-${idx}`}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors gap-4 ${idx === 0 && flash ? "animate-pulse ring-1 ring-red-500/50" : ""
                                }`}
                        >

                            {/* Left Side: Type & Time */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white tracking-wide">{alert.label}</p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mt-1">
                                        <Clock size={10} />
                                        <span>{alert.timestamp}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: IPs */}
                            <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-mono max-w-sm">
                                <div className="bg-black/30 p-2 rounded border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Source</p>
                                    <p className="text-gray-300 truncate">{alert.src_ip}</p>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Target</p>
                                    <p className="text-gray-300 truncate">{alert.dst_ip}</p>
                                </div>
                            </div>

                            {/* Right Side: Badges */}
                            <div className="flex items-center gap-4 justify-end min-w-[150px]">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">Fusion Score</p>
                                    <p className="text-xs font-mono text-violet-400">{alert.fusion_score?.toFixed(3) || "N/A"}</p>
                                </div>
                                <Badge label={alert.severity} variant={alert.severity} />
                            </div>

                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4c1d9540; border-radius: 20px; }
      `}</style>
        </Card>
    );
}
