"use client";
import React, { useEffect, useState } from 'react'
import { dataService } from '@/services/dataService'
import LiveMetrics from '@/components/LiveMetrics'
import AttackChart from '@/components/AttackChart'
import AttackTable from '@/components/AttackTable'
import ThreatGeography from '@/components/ThreatGeography'
import AttackMap from '@/components/AttackMap'
import MitigationList from '@/components/MitigationList'
import Card from '@/components/Card'
import { Shield, Settings, LayoutDashboard, Database, Activity, Menu, X, ShieldAlert, Globe } from 'lucide-react'
import { DATA_MODE } from '@/config/dataMode'

export default function CyberOpsPage() {
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        dataService.start();
        const unsubscribe = dataService.subscribe((event) => {
            setLastEvent(event);
        });
        return () => {
            dataService.stop();
            unsubscribe();
        }
    }, []);



    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 relative flex overflow-hidden selection:bg-violet-600 selection:text-white">
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] animate-scanline bg-gradient-to-b from-transparent via-violet-500 to-transparent"></div>


            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-6 relative overflow-y-auto bg-transparent transition-all duration-500">
                <header className="flex justify-between items-end mb-8 px-1">
                    <div className="flex items-center gap-4">


                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right text-[9px] text-gray-500 font-black font-mono tracking-tighter opacity-60">
                            HASH: {lastEvent?.id?.substring(0, 12) || 'LINKING...'}
                        </div>
                    </div>
                </header>

                {/* Immersive Real-Time HUD */}
                <div className="max-w-[1700px] mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <LiveMetrics />
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <AttackMap />
                            <AttackChart />
                        </div>
                        <div className="flex flex-col">
                            <AttackTable />
                        </div>
                    </div>
                </div>
            </main>

            {/* Frame UI Accents */}
            <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent z-50"></div>
            <div className="fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent z-50"></div>
        </div>
    );
}
