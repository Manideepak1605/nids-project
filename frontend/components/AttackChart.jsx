import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dataService } from '../services/dataService';
import Card from './Card';

const AttackChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const unsubscribe = dataService.subscribe((newEvent) => {
            setData(prev => {
                const timestamp = new Date().toLocaleTimeString();
                const lastMinute = prev.slice(-20);

                // Count attacks in this snapshot
                const attackCount = newEvent.attack_type !== 'Normal' ? 1 : 0;

                return [...lastMinute, { time: timestamp, attacks: attackCount }];
            });
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="h-64 mb-6" glowColor="violet">
            <h3 className="text-violet-400 text-[11px] uppercase tracking-widest font-bold mb-4">Attack Frequency</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis
                            stroke="#ffffff"
                            opacity={0.3}
                            tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 500 }}
                            strokeWidth={1}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(11, 11, 20, 0.9)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#a78bfa', fontWeight: 600, fontSize: '11px' }}
                            labelStyle={{ color: '#ffffff', opacity: 0.5, fontWeight: 500, fontSize: '10px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="attacks"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorAttacks)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default AttackChart;
