import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import Card from './Card';
import { ShieldAlert, Terminal } from 'lucide-react';

const MitigationList = () => {
    const [blockedIps, setBlockedIps] = useState([]);

    useEffect(() => {
        const unsubscribe = dataService.subscribe((event) => {
            if (event.blocked_ips) {
                setBlockedIps(event.blocked_ips);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Card glowColor="purple">
            <h2 className="text-xl font-black text-wakanda-accent mb-4 tracking-tighter flex items-center gap-2">
                <ShieldAlert size={20} className="text-wakanda-gold" />
                MITIGATED ADDRESSES
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {blockedIps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <Terminal size={30} className="mb-2" />
                        <p className="text-[10px] font-black tracking-widest uppercase">No Active Blocks</p>
                    </div>
                ) : (
                    blockedIps.map((ip, index) => (
                        <div
                            key={ip}
                            className="flex items-center justify-between p-3 bg-black/40 border-l-4 border-wakanda-gold rounded-r-lg group hover:bg-wakanda-purple/10 transition-all animate-in slide-in-from-left duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-mono font-black text-wakanda-accent tracking-tighter">{ip}</span>
                                <span className="text-[8px] text-wakanda-gold font-bold uppercase tracking-widest">Protocol: VIBRANIUM_BLOCK</span>
                            </div>
                            <div className="h-2 w-2 bg-wakanda-gold rounded-full animate-pulse shadow-vibranium-glow"></div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-3 border-t-2 border-wakanda-purple/20 flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                <span>TOTAL MITIGATED: {blockedIps.length}</span>
                <span className="text-wakanda-accent">ACTIVE PROTECT</span>
            </div>
        </Card>
    );
};

export default MitigationList;
