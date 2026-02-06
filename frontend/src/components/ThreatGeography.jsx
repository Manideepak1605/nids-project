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
        <Card glowColor="blue">
            <h2 className="text-xl font-black text-wakanda-accent mb-4 tracking-tighter flex items-center gap-2">
                <Globe size={20} className="text-wakanda-blue" />
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
                            className="bg-black/40 border border-wakanda-blue/20 rounded-lg p-3 group hover:border-wakanda-blue/50 transition-all animate-in fade-in slide-in-from-right duration-500"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-black text-white italic tracking-tighter">{threat.name}</span>
                                <span className="text-[10px] font-bold text-wakanda-blue bg-wakanda-blue/10 px-2 py-0.5 rounded border border-wakanda-blue/30">
                                    {threat.count} ATTACKS
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <MapPin size={10} className="text-wakanda-accent" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Top City: {threat.topCity}</span>
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="mt-2 h-1 w-full bg-wakanda-blue/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-wakanda-blue shadow-vibranium-glow transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (threat.count / topThreats[0].count) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-3 border-t-2 border-wakanda-blue/20 text-[9px] font-black uppercase tracking-widest opacity-60 text-center">
                GLOBAL THREAT INTELLIGENCE ACTIVE
            </div>
        </Card>
    );
};

export default ThreatGeography;
