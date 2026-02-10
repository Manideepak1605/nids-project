"use client";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import TrafficPieChart from "@/components/dashboard/TrafficPieChart";
import AttackBarChart from "@/components/dashboard/AttackBarChart";
import AttackLineChart from "@/components/dashboard/AttackLineChart";
import AlertsTable from "@/components/dashboard/AlertsTable";
import ThreatSummary from "@/components/dashboard/ThreatSummary";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("Live Stream");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // First check localStorage for recent upload/sample results
        const saved = localStorage.getItem('last_analysis');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.results) {
            const allowed = data.results.filter(r => r.Status === "ALLOW").length;
            const blocked = data.results.filter(r => r.Status === "BLOCK").length;
            const total = data.results.length;

            // Map types for the bar chart
            const attack_types = data.results
              .filter(r => r.Status === "BLOCK")
              .reduce((acc, curr) => {
                acc[curr.Classification] = (acc[curr.Classification] || 0) + 1;
                return acc;
              }, {});

            setStats({
              total_analyzed: total,
              allowed: allowed,
              blocked: blocked,
              risk_level: blocked > 10 ? "CRITICAL" : blocked > 5 ? "HIGH" : blocked > 0 ? "MEDIUM" : "LOW",
              attack_types: attack_types
            });
            setDataSource("Captured Dataset");
            setLoading(false);
            return;
          }
        }

        // Fallback or Real-time polling
        const response = await fetch("http://localhost:5000/stats");
        const data = await response.json();
        setStats(data);
        setDataSource("Real-time Monitor");
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
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

        <DashboardHeader source={dataSource} />

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          <StatCard
            title="Total Traffic Analyzed"
            value={stats?.total_analyzed?.toLocaleString() || "0"}
            color="blue"
            href="/alerts"
          />
          <StatCard
            title="Normal Traffic"
            value={stats?.allowed?.toLocaleString() || "0"}
            color="green"
            href="/alerts"
          />
          <StatCard
            title="Attacks Detected"
            value={stats?.blocked?.toLocaleString() || "0"}
            color="violet"
            href="/alerts"
          />
          <StatCard
            title="Risk Level"
            value={stats?.risk_level || "LOW"}
            color={stats?.risk_level === "CRITICAL" ? "red" : stats?.risk_level === "HIGH" ? "orange" : "blue"}
            href="/alerts?severity=high"
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

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThreatSummary riskLevel={stats?.risk_level} />
          <AlertsTable />
        </section>

      </div>
    </main>
  );
}
