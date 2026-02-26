export default function AlertsHeader() {
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-5xl font-bold text-white">
        Alerts & <span className="text-violet-400">Logs</span>
      </h1>
      <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
        <span className="text-gray-500 border-r border-white/10 pr-3">Severity Legend</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
          <span className="text-gray-400">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span>
          <span className="text-gray-400">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
          <span className="text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></span>
          <span className="text-gray-400">Low</span>
        </div>
      </div>
    </div>
  );
}
