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
        <Card className="h-64 mb-6" glowColor="purple">
            <h3 className="text-wakanda-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Attack Frequency</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                                <stop offset="50%" stopColor="#9333ea" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#581c87" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" stroke="#581c87" strokeWidth={2} opacity={0.5} />
                        <XAxis dataKey="time" stroke="#a855f7" hide />
                        <YAxis stroke="#a855f7" tick={{ fill: '#c084fc', fontSize: 10, fontWeight: 700 }} strokeWidth={2} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(10, 1, 32, 0.95)',
                                border: '2px solid #a855f7',
                                borderRadius: '8px',
                                boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                            }}
                            itemStyle={{ color: '#f0abfc', fontWeight: 700, fontSize: '12px' }}
                            labelStyle={{ color: '#c084fc', fontWeight: 700 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="attacks"
                            stroke="#a855f7"
                            strokeWidth={4}
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
