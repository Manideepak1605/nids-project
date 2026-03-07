import { motion } from "framer-motion";

export default function DashboardHeader({ source = "Real-time monitor" }) {
  return (
    <div className="mb-12 flex flex-col gap-3">
      <h1 className="text-3xl md:text-5xl font-bold text-white">
        Security <span className="text-violet-400">Dashboard</span>
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
        <p className="text-gray-400 font-medium">
          Real-time intrusion detection and network security analytics
        </p>

        {/* Status Badge with Pulse */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
          />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
            System Active
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-l border-white/10 pl-4">
          <span>Source: <span className="text-violet-400">{source}</span></span>
          <span className="w-1 h-1 rounded-full bg-white/10"></span>
          <span>Last updated: just now</span>
        </div>
      </div>
    </div>
  );
}
