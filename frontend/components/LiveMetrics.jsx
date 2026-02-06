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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
                { label: 'Total Traffic', value: metrics.totalEvents, icon: Activity, color: 'violet', sub: 'Active Flow' },
                { label: 'Attacks Blocked', value: metrics.attacks, icon: ShieldAlert, color: 'violet', sub: 'Vibranium Firewall' },
                { label: 'Critical Threats', value: metrics.critical, icon: Zap, color: 'amber', sub: 'High Severity' },
                { label: 'Avg Flow (ms)', value: metrics.avgFlowDuration, icon: Globe, color: 'blue', sub: 'Global Latency' }
            ].map((slab, i) => (
                <div
                    key={slab.label}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all hover:scale-[1.02] hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-600/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm font-medium">{slab.label}</p>
                        <div className={`p-2 rounded-xl bg-${slab.color}-500/10 border border-${slab.color}-500/20 group-hover:scale-110 transition-transform`}>
                            <slab.icon className={`text-${slab.color}-400`} size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{slab.value}</h3>
                        <span className="text-[10px] font-bold text-violet-400/60 uppercase tracking-widest">{slab.sub}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LiveMetrics;
