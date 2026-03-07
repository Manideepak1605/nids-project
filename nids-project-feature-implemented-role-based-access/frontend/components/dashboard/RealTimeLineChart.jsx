"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Radio } from 'lucide-react';

export default function RealTimeLineChart({ data }) {
    return (
        <Card glowColor="cyan" className="p-4 col-span-1 xl:col-span-2 h-[300px] max-h-[300px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        Live Traffic Flow <Radio size={16} className="text-cyan-400 animate-pulse" />
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">Packets/sec (Last 20 pings)</p>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            fontSize={10}
                            tickMargin={10}
                            tick={{ fill: "#6b7280" }}
                            axisLine={{ stroke: "#ffffff15" }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tick={{ fill: "#6b7280" }}
                            axisLine={{ stroke: "#ffffff15" }}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#0f0f1acc", border: "1px solid #8b5cf640", borderRadius: "12px", backdropFilter: "blur(8px)" }}
                            itemStyle={{ fontSize: "14px", fontWeight: "bold" }}
                            labelStyle={{ color: "#9ca3af", marginBottom: "4px", fontSize: "12px" }}
                            cursor={{ stroke: "#ffffff20", strokeWidth: 1, strokeDasharray: "5 5" }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: "12px", paddingBottom: "20px" }}
                        />

                        {/* Glow Drop Shadows for Lines are native in modern Recharts via CSS filters, but we use standard strokes here */}
                        <Line
                            type="monotone"
                            dataKey="benign"
                            name="Normal Traffic"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#10b981", stroke: "#000", strokeWidth: 2 }}
                            isAnimationActive={false} // Disable to make scrolling continuous without stutter
                        />
                        <Line
                            type="monotone"
                            dataKey="attack"
                            name="Detected Attacks"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#ef4444", stroke: "#000", strokeWidth: 2, className: "animate-pulse" }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
