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
            case 'Critical': return 'text-red-500 font-bold animate-pulse';
            case 'High': return 'text-orange-500';
            case 'Medium': return 'text-yellow-500';
            default: return 'text-wakanda-blue';
        }
    };

    return (
        <Card className="flex-1 overflow-hidden flex flex-col" glowColor="blue">
            <h3 className="text-wakanda-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Live Attack Stream</h3>
            <div className="overflow-x-auto overflow-y-auto max-h-[460px] border-2 border-wakanda-purple/40 rounded-xl shadow-vibranium-heavy">
                <table className="w-full text-left text-[10px] border-collapse bg-black/40">
                    <thead className="sticky top-0 bg-wakanda-dark text-wakanda-accent border-b-2 border-wakanda-purple/60 backdrop-blur-2xl">
                        <tr>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Timestamp</th>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Source IP</th>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Type</th>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Severity</th>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Country</th>
                            <th className="p-2 font-black uppercase tracking-[0.1em]">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-wakanda-purple/10">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-wakanda-purple/20 transition-all duration-200 group">
                                <td className="p-2 text-gray-200 font-bold font-mono">{new Date(event.timestamp).toLocaleTimeString()}</td>
                                <td className="p-2 font-mono text-wakanda-accent font-black tracking-tight group-hover:text-white">{event.source_ip}</td>
                                <td className="p-2 font-bold uppercase tracking-tight text-wakanda-purple-glow">{event.attack_type}</td>
                                <td className={`p-2 ${getSeverityColor(event.severity)} font-black uppercase drop-shadow-md`}>{event.severity}</td>
                                <td className="p-2 font-bold uppercase tracking-tight">{event.country}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded border-2 border-current text-[9px] font-black uppercase shadow-sm`}>
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
