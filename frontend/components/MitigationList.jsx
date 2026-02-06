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
        <Card glowColor="violet">
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-500" />
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
                            className="flex items-center justify-between p-3 bg-white/5 border-l-2 border-amber-500 rounded-r-lg group hover:bg-violet-600/10 transition-all animate-in slide-in-from-left duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-mono font-bold text-violet-300 tracking-tight">{ip}</span>
                                <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest">Protocol: SECURE_BLOCK</span>
                            </div>
                            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-60">
                <span>TOTAL MITIGATED: {blockedIps.length}</span>
                <span className="text-violet-400">ACTIVE PROTECT</span>
            </div>
        </Card>
    );
};

export default MitigationList;
