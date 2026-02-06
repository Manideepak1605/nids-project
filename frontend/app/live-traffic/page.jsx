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
import LiveTrafficHeader from '@/components/live-traffic/LiveTrafficHeader'

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
        <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 px-6 py-20 overflow-y-auto">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
                <LiveTrafficHeader lastEventId={lastEvent?.id} />

                <div className="flex flex-col gap-6">
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
            </div>
        </main>
    );
}
