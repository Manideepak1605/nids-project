"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Wifi, WifiOff, Clock, Zap, Target, RefreshCw } from 'lucide-react';

const LiveAlertMonitor = () => {
    const [alerts, setAlerts] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [reconnectCount, setReconnectCount] = useState(0);
    const ws = useRef(null);
    const scrollRef = useRef(null);
    const MAX_ALERTS = 200;
    const AUTH_TOKEN = "nids_secure_access_2026";

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const connect = () => {
        // 1. WebSocket with Auth Token as Query Parameter
        const socketUrl = `ws://localhost:8000/ws/alerts?token=${AUTH_TOKEN}`;
        console.log(`Connecting to NIDS Gateway [Attempt ${reconnectCount + 1}]...`);

        ws.current = new WebSocket(socketUrl);

        ws.current.onopen = () => {
            setIsConnected(true);
            setReconnectCount(0);
            console.log("Connected to Secure WebSocket Gateway");
        };

        ws.current.onclose = (event) => {
            setIsConnected(false);

            // 2. Exponential Backoff Reconnect (Max 30s)
            const timeout = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
            console.log(`Disconnected. Reconnecting in ${timeout / 1000}s...`);

            setTimeout(() => {
                setReconnectCount(prev => prev + 1);
                connect();
            }, timeout);
        };

        ws.current.onerror = (event) => {
            // Silently ignored — onclose fires immediately after with the reason.
            // Avoids Next.js dev overlay false-positive.
        };

        ws.current.onmessage = (event) => {
            if (isPaused) return;

            try {
                const payload = JSON.parse(event.data);
                const incoming = Array.isArray(payload) ? payload : [payload];

                // 1. Throttled Animation Logic: Only animate the first alert in a batch
                const newAlerts = incoming.map((alert, index) => ({
                    ...alert,
                    shouldAnimate: index === 0 // Critical performance refinement
                }));

                setAlerts(prev => {
                    const updated = [...newAlerts, ...prev];
                    return updated.slice(0, MAX_ALERTS);
                });

                if (newAlerts.some(a => a.severity === 'CRITICAL')) {
                    if ('vibrate' in navigator) navigator.vibrate(200);
                }
            } catch (err) {
                console.error("Payload parse error:", err);
            }
        };
    };

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'border-red-500/50 bg-red-500/10 text-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)] animate-pulse';
            case 'HIGH': return 'border-orange-500/50 bg-orange-500/10 text-orange-500';
            case 'MEDIUM': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500';
            default: return 'border-blue-500/50 bg-blue-500/10 text-blue-500';
        }
    };

    return (
        <div className="bg-[#0f0f1a] border border-violet-500/20 rounded-2xl overflow-hidden flex flex-col h-[500px] max-h-[500px] shadow-2xl relative w-full overflow-x-auto">
            {/* Connection Overlay for Disconnects */}
            {!isConnected && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 text-center p-6">
                    <RefreshCw className="text-violet-500 animate-spin" size={48} />
                    <h3 className="text-xl font-bold text-white">Gateway Disconnected</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                        The Live Monitor service might be offline. Attempting secure reconnect ({reconnectCount})...
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="px-6 py-4 bg-[#141424] border-b border-violet-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            Live Intrusion Feed
                            {isConnected && <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping"></span>}
                        </h2>
                        <p className="text-xs text-gray-500 font-mono">SECURE TUNNEL ACTIVE</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${isPaused
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : 'bg-violet-500/20 text-violet-400 border-violet-500/40 hover:bg-violet-500/30'
                            }`}
                    >
                        {isPaused ? 'RESUME STREAM' : 'PAUSE FEED'}
                    </button>
                    <div className="text-xs text-violet-400/60 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-violet-500/10">
                        BUFFER: {alerts.length}/{MAX_ALERTS}
                    </div>
                </div>
            </div>

            {/* Alert Feed */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-3 space-y-2 custom-scrollbar" ref={scrollRef}>
                <div className="min-w-[500px] space-y-2">
                    {alerts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-40">
                            <Activity size={48} className="animate-pulse" />
                            <p className="text-sm italic">Waiting for incoming network flow signatures...</p>
                        </div>
                    ) : (
                        alerts.map((alert, idx) => (
                            <div
                                key={`${alert.timestamp}-${idx}`}
                                className={`p-4 rounded-xl border transition-all duration-300 ${getSeverityStyles(alert.severity)} ${alert.shouldAnimate ? 'animate-in fade-in slide-in-from-top-4 duration-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded bg-black/40">
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm tracking-tight">{alert.label}</h3>
                                            <p className="text-[10px] opacity-70 font-mono">{alert.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-black/40 uppercase tracking-widest">
                                            {alert.severity}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] opacity-50 uppercase font-bold mb-0.5">Source</p>
                                        <p className="text-xs font-mono truncate">{alert.src_ip}:{alert.src_port}</p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] opacity-50 uppercase font-bold mb-0.5">Target</p>
                                        <p className="text-xs font-mono truncate">{alert.dst_ip}:{alert.dst_port}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono opacity-80 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Target size={12} className="text-violet-400" />
                                        <span>Z: {alert.fusion_score.toFixed(3)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={12} className="text-violet-400" />
                                        <span>H: {alert.entropy.toFixed(3)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-violet-400" />
                                        <span>{alert.latency.toFixed(1)}ms</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="px-6 py-3 bg-black/40 border-t border-violet-500/10 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span className="flex items-center gap-1 uppercase tracking-tighter">
                    <ShieldAlert size={10} className="text-violet-500" />
                    Production Environment V2
                </span>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4c1d95; border-radius: 20px; }
      `}</style>
        </div>
    );
};

export default LiveAlertMonitor;
