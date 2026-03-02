"use client";
import React from "react";
import { useLiveData } from "@/hooks/useLiveData";
import KpiCards from "@/components/dashboard/KpiCards";
import RealTimeLineChart from "@/components/dashboard/RealTimeLineChart";
import AttackPieChart from "@/components/dashboard/AttackPieChart";
import ThreatFeed from "@/components/dashboard/ThreatFeed";
import { Clock } from "lucide-react";

export default function DashboardPage() {
  const { kpi, timeSeries, attackDist, recentAlerts, lastUpdated, hasNewAttack, isConnected, isLoading } = useLiveData();

  return (
    <div className="min-h-screen bg-[#07070a] text-gray-200">

      {/* Top Background Glows */}
      <div className="fixed top-0 left-64 w-[500px] h-[300px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <main className="p-3 md:p-4 lg:p-6 max-w-screen-2xl mx-auto min-h-screen">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-400">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm uppercase tracking-widest">Initializing Telemetry...</p>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 border-b border-white/5 pb-4">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase">
                  Security Overview
                </h1>
                <p className="text-sm font-mono text-gray-400 mt-1">Core Telemetry & Live Threat Vectors</p>
              </div>

              <div className="flex items-center gap-3 bg-black/40 border border-white/5 py-2 px-4 rounded-xl">
                <Clock size={14} className="text-violet-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold leading-tight">Last Sync (5s)</span>
                  <span className="text-xs font-mono text-white leading-tight">{lastUpdated}</span>
                </div>
                {!isConnected && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded font-bold uppercase">Fallback Mode</span>
                )}
              </div>
            </div>

            {/* Level 1: KPIs */}
            <KpiCards />

            {/* Level 2: Charts (Line + Pie) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-6">
              <RealTimeLineChart data={timeSeries} />
              <AttackPieChart data={attackDist} />
            </div>

            {/* Level 3: Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <ThreatFeed alerts={recentAlerts} hasNewAttack={hasNewAttack} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
