import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import Card from './Card';
import { Globe, MapPin } from 'lucide-react';

const ThreatGeography = () => {
    const [topThreats, setTopThreats] = useState([]);

    useEffect(() => {
        const unsubscribe = dataService.subscribe((event) => {
            if (event.threat_stats) {
                setTopThreats(event.threat_stats);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Card glowColor="violet">
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                <Globe size={20} className="text-violet-500" />
                TOP THREAT SOURCES
            </h2>
            <div className="space-y-3">
                {topThreats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <MapPin size={30} className="mb-2" />
                        <p className="text-[10px] font-black tracking-widest uppercase">Analyzing Geography...</p>
                    </div>
                ) : (
                    topThreats.map((threat, index) => (
                        <div
                            key={threat.name}
                            className="bg-white/5 border border-white/5 rounded-xl p-4 group hover:border-violet-500/30 transition-all animate-in fade-in slide-in-from-right duration-500"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-white tracking-tight">{threat.name}</span>
                                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                                    {threat.count} ATTACKS
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-50">
                                <MapPin size={10} className="text-violet-300" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Top City: {threat.topCity}</span>
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-600 shadow-lg shadow-violet-500/20 transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (threat.count / topThreats[0].count) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] font-bold uppercase tracking-widest opacity-40 text-center">
                GLOBAL THREAT INTELLIGENCE ACTIVE
            </div>
        </Card>
    );
};

export default ThreatGeography;
