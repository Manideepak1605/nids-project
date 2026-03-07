"use client";
import React, { useState, useEffect } from 'react';
import AlertsHeader from "@/components/alerts/AlertsHeader";
import AlertStatCard from "@/components/alerts/AlertStatCard";
import AlertsTable from "@/components/alerts/AlertsTable";
import LogsTimeline from "@/components/alerts/LogsTimeline";

export default function AlertsPage() {
  const [data, setData] = useState({ alerts: [], logs: [] });
  const [stats, setStats] = useState({ critical: 0, high: 0, total: 0, logs: 0 });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/alerts");
        if (response.ok) {
          const result = await response.json();
          setData(result);

          const criticalTotal = result.alerts.filter(a => a.severity.toLowerCase() === 'critical').length;
          const highTotal = result.alerts.filter(a => a.severity.toLowerCase() === 'high').length;

          setStats({
            critical: criticalTotal,
            high: highTotal,
            total: result.total_count || result.alerts.length,
            logs: result.total_count || result.logs.length
          });
        }
      } catch (err) {
        console.error("Failed to fetch live alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = () => {
    if (data.alerts.length === 0) return alert("No alerts to export.");
    const headers = "ID,Type,Severity,Time\n";
    const csvRows = data.alerts.map(a => `${a.id},${a.type},${a.severity},${a.time}`).join("\n");

    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NIDS_Alerts_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 px-6 py-20 print:p-0 print:bg-white print:text-black">
      <div className="max-w-7xl mx-auto">

        {/* Header - modified to pass export functions */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live <span className="text-violet-500">Alerts</span></h1>
            <p className="text-gray-400 text-sm">Real-time threat detection and automated response logs.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition flex items-center gap-2 text-sm font-medium">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export CSV
            </button>
            <button onClick={handleExportPDF} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14 print:hidden">
          <AlertStatCard title="Critical Alerts" value={stats.critical} color="red" />
          <AlertStatCard title="High Severity" value={stats.high} color="amber" />
          <AlertStatCard title="Total Alerts" value={stats.total} color="violet" />
          <AlertStatCard title="System Logs" value={stats.logs} color="cyan" />
        </section>

        {/* Table + Logs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
          <AlertsTable alerts={data.alerts} />
          <div className="print:hidden">
            <LogsTimeline logs={data.logs} />
          </div>
        </section>

      </div>
    </main>
  );
}
