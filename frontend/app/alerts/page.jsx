import AlertsHeader from "@/components/alerts/AlertsHeader";
import AlertStatCard from "@/components/alerts/AlertStatCard";
import AlertsTable from "@/components/alerts/AlertsTable";
import LogsTimeline from "@/components/alerts/LogsTimeline";

export default function AlertsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200 px-6 py-20">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <AlertsHeader />

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          <AlertStatCard title="Critical Alerts" value="4" color="red" />
          <AlertStatCard title="High Severity" value="12" color="amber" />
          <AlertStatCard title="Total Alerts" value="180" color="violet" />
          <AlertStatCard title="System Logs" value="1,024" color="cyan" />
        </section>

        {/* Table + Logs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsTable />
          <LogsTimeline />
        </section>

      </div>
    </main>
  );
}
