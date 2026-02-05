import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Activity, ShieldAlert, Zap, Globe } from 'lucide-react';

const LiveMetrics = () => {
    const [metrics, setMetrics] = useState({
        totalEvents: 0,
        attacks: 0,
        critical: 0,
        avgFlowDuration: 0
    });

    useEffect(() => {
        const initialEvents = dataService.getRecentEvents();
        updateMetrics(initialEvents);

        const unsubscribe = dataService.subscribe(() => {
            const allEvents = dataService.getRecentEvents();
            updateMetrics(allEvents);
        });

        return () => unsubscribe();
    }, []);

    const updateMetrics = (events) => {
        const total = events.length;
        const attacks = events.filter(e => e.attack_type !== 'Normal').length;
        const critical = events.filter(e => e.severity === 'Critical').length;
        const avgFlow = events.length > 0
            ? events.reduce((acc, curr) => acc + curr.flow_duration, 0) / events.length
            : 0;

        setMetrics({
            totalEvents: total,
            attacks,
            critical,
            avgFlowDuration: avgFlow.toFixed(0)
        });
    };

    return (
        <div className="flex flex-wrap gap-4 mb-6">
            {[
                { label: 'Total Traffic', value: metrics.totalEvents, icon: Activity, color: 'purple', sub: 'Active Flow' },
                { label: 'Attacks Blocked', value: metrics.attacks, icon: ShieldAlert, color: 'purple', sub: 'Vibranium Firewall' },
                { label: 'Critical Threats', value: metrics.critical, icon: Zap, color: 'gold', sub: 'High Severity' },
                { label: 'Avg Flow (ms)', value: metrics.avgFlowDuration, icon: Globe, color: 'blue', sub: 'Global Latency' }
            ].map((slab, i) => (
                <div
                    key={slab.label}
                    className="flex-1 min-w-[200px] bg-black/60 border-2 border-wakanda-purple/20 rounded-xl p-3 flex items-center gap-4 hover:border-wakanda-accent/50 hover:bg-wakanda-purple/5 transition-all duration-300 group shadow-vibranium-glow/5"
                >
                    <div className={`p-2 rounded-lg bg-wakanda-${slab.color}/10 border border-wakanda-${slab.color}/30 group-hover:scale-110 transition-transform`}>
                        <slab.icon className={`text-wakanda-${slab.color}`} size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">{slab.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-xl font-black text-white tracking-widest leading-none">{slab.value}</h3>
                            <span className="text-[7px] font-bold text-wakanda-accent opacity-50 uppercase tracking-widest">{slab.sub}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LiveMetrics;
