import React, { useEffect, useState, useRef } from 'react';
import { dataService } from '../services/dataService';
import Card from './Card';

const AttackTable = () => {
    const [events, setEvents] = useState([]);
    const tableRef = useRef(null);

    useEffect(() => {
        // Initial events
        setEvents(dataService.getRecentEvents());

        const unsubscribe = dataService.subscribe((newEvent) => {
            setEvents(prev => [newEvent, ...prev].slice(0, 50));
        });

        return () => unsubscribe();
    }, []);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'text-red-400 font-bold';
            case 'High': return 'text-amber-500';
            case 'Medium': return 'text-yellow-400';
            default: return 'text-violet-400';
        }
    };

    return (
        <Card className="flex-1 overflow-hidden flex flex-col" glowColor="violet">
            <h3 className="text-violet-400 text-[11px] uppercase tracking-widest font-bold mb-4">Live Attack Stream</h3>
            <div className="overflow-x-auto overflow-y-auto max-h-[460px] border border-white/5 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse bg-black/20">
                    <thead className="sticky top-0 bg-[#0b0b14] text-violet-300 border-b border-white/10 backdrop-blur-3xl z-10">
                        <tr>
                            <th className="p-3 font-bold uppercase tracking-widest">Timestamp</th>
                            <th className="p-3 font-bold uppercase tracking-widest">Source IP</th>
                            <th className="p-3 font-bold uppercase tracking-widest">Type</th>
                            <th className="p-3 font-bold uppercase tracking-widest">Severity</th>
                            <th className="p-3 font-bold uppercase tracking-widest">Country</th>
                            <th className="p-3 font-bold uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-white/[0.03] transition-all duration-200 group">
                                <td className="p-3 text-gray-400 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</td>
                                <td className="p-3 font-mono text-violet-400 font-bold group-hover:text-violet-300">{event.source_ip}</td>
                                <td className="p-3 font-bold uppercase text-gray-300">{event.attack_type}</td>
                                <td className={`p-3 ${getSeverityColor(event.severity)} font-bold uppercase`}>{event.severity}</td>
                                <td className="p-3 font-medium uppercase text-gray-400">{event.country}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded border border-current text-[10px] font-bold uppercase opacity-80`}>
                                        {event.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AttackTable;
