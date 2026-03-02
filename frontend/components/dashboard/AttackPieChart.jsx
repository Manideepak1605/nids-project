"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Target } from 'lucide-react';

export default function AttackPieChart({ data }) {
    // Only show components with actual value to keep chart clean
    const activeData = data.filter(d => d.value > 0);

    return (
        <Card glowColor="violet" className="p-4 col-span-1 h-[300px] max-h-[300px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        Threat Vectors <Target size={16} className="text-violet-400" />
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">Classification Distribution</p>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                {activeData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 font-mono text-sm">No Attack Data Available</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={activeData}
                                cx="50%"
                                cy="50%" // Centered to prevent top clipping
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {activeData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{ filter: `drop-shadow(0 0 8px ${entry.color}80)` }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: "#0f0f1acc", border: "1px solid #8b5cf640", borderRadius: "12px", backdropFilter: "blur(8px)" }}
                                itemStyle={{ color: "#fff", fontWeight: "bold" }}
                                formatter={(value, name) => [value, name]}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
