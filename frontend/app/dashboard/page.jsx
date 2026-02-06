"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { dataService } from "@/services/dataService";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import TrafficPieChart from "@/components/dashboard/TrafficPieChart";
import AttackBarChart from "@/components/dashboard/AttackBarChart";
import AttackLineChart from "@/components/dashboard/AttackLineChart";
import AlertsTable from "@/components/dashboard/AlertsTable";
import ThreatSummary from "@/components/dashboard/ThreatSummary";
import ThreatGeography from "@/components/ThreatGeography";
import MitigationList from "@/components/MitigationList";
import Card from "@/components/Card";
import { Database, Settings, Shield, Activity } from "lucide-react";
import { DATA_MODE } from "@/config/dataMode";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let statsSynced = false;

    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/stats");
        const data = await response.json();
        setStats(data);

        // Sync dataService global stats once
        if (!statsSynced) {
          dataService.globalStats = {
            total_analyzed: data.total_analyzed,
            allowed: data.allowed,
            blocked: data.blocked,
            attack_types: { ...data.attack_types }
          };
          statsSynced = true;
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    dataService.start();

    const unsubscribe = dataService.subscribe((event) => {
      if (event.global_stats) {
        setStats(prev => ({
          ...prev,
          total_analyzed: event.global_stats.total_analyzed,
          allowed: event.global_stats.allowed,
          blocked: event.global_stats.blocked,
          attack_types: { ...event.global_stats.attack_types }
        }));
      }
    });

    // Refresh every 30 seconds for full consistency check (less frequent since we have WS)
    const interval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
      unsubscribe();
      // We don't stop dataService here because other pages (Live Traffic) might need it
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 px-6 py-20">
      <div className="max-w-7xl mx-auto">

        <DashboardHeader />

        <div className="bg-violet-900/20 border border-violet-500/30 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Real-Time Monitoring</h2>
            <p className="text-gray-400 text-sm">Switch to the Live Traffic hub for real-time network capture and instant threat detection.</p>
          </div>
          <Link
            href="/live-traffic"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition shadow-lg shadow-violet-600/20 font-semibold text-center whitespace-nowrap"
          >
            Launch Live Hub
          </Link>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          <StatCard
            title="Total Traffic Analyzed"
            value={stats?.total_analyzed?.toLocaleString() || "0"}
            color="blue"
          />
          <StatCard
            title="Normal Traffic"
            value={stats?.allowed?.toLocaleString() || "0"}
            color="green"
          />
          <StatCard
            title="Attacks Detected"
            value={stats?.blocked?.toLocaleString() || "0"}
            color="violet"
          />
          <StatCard
            title="Risk Level"
            value={stats?.risk_level || "LOW"}
            color={stats?.risk_level === "CRITICAL" ? "red" : stats?.risk_level === "HIGH" ? "orange" : "blue"}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
          <TrafficPieChart
            normal={stats?.allowed || 0}
            attack={stats?.blocked || 0}
          />

          <AttackBarChart
            attackTypes={stats?.attack_types || {}}
          />

          <AttackLineChart />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <ThreatGeography />
          <MitigationList />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <ThreatSummary riskLevel={stats?.risk_level} />
          <AlertsTable />
        </section>

        {/* System Intelligence Sections (Migrated from Live Traffic Sidebar) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <Card glowColor="violet">
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Database size={20} className="text-violet-500" />
              REGIONAL DATA ARCHIVE
            </h2>
            <div className="h-[250px] flex items-center justify-center border border-white/5 rounded-xl bg-white/[0.02]">
              <div className="text-center">
                <Database className="mx-auto mb-3 text-violet-500/50 animate-pulse" size={32} />
                <p className="text-violet-400/60 font-bold tracking-widest text-[10px] uppercase">Connecting to Secure Storage...</p>
              </div>
            </div>
          </Card>

          <Card glowColor="violet">
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Settings size={20} className="text-violet-500" />
              CORE SYSTEM CONFIG
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-violet-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Detection Mode</span>
                </div>
                <span className={`text-[10px] px-3 py-1 rounded-md border ${DATA_MODE === 'MOCK' ? 'border-violet-500/50 text-violet-400 bg-violet-500/10' : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'} font-bold`}>
                  {DATA_MODE} ENGINE
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-violet-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Sentinel Protocol</span>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-md border border-amber-500/50 text-amber-400 bg-amber-500/10 font-bold uppercase">
                  Level 5 Active
                </span>
              </div>
              <div className="pt-2 text-[9px] text-gray-500 uppercase tracking-widest text-center opacity-50">
                System Latency: 4ms | Network: Stable
              </div>
            </div>
          </Card>
        </section>

      </div>
    </main>
  );
}
