export default function DashboardHeader() {
  return (
    <div className="mb-12 flex flex-col gap-3">
      <h1 className="text-3xl md:text-5xl font-bold text-white">
        Security <span className="text-violet-400">Dashboard</span>
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <p className="text-gray-400">
          Real-time intrusion detection and network security analytics
        </p>

        {/* Status Badge */}
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          System Active
        </span>

        {/* Timestamp */}
        <span className="text-gray-500">
          Last updated: just now
        </span>
      </div>
    </div>
  );
}
