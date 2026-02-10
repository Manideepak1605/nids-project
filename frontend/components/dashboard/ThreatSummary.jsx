export default function ThreatSummary({ riskLevel = "LOW" }) {
  const settings = {
    LOW: {
      color: "emerald",
      label: "LOW RISK",
      message: "The system is currently stable. No significant threats have been detected recently. Continuous monitoring is active.",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400"
    },
    MEDIUM: {
      color: "blue",
      label: "MODERATE RISK",
      message: "Some suspicious activities have been flagged. While no immediate breach is identified, we recommend reviewing the recent alerts.",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400"
    },
    HIGH: {
      color: "orange",
      label: "HIGH RISK",
      message: "Multiple high-severity intrusion attempts detected. Probing and potential DoS signatures found. Immediate investigation recommended.",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400"
    },
    CRITICAL: {
      color: "red",
      label: "CRITICAL RISK",
      message: "Massive attack detected! Persistent intrusion attempts in progress. Mitigation protocols should be activated immediately.",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400"
    }
  };

  const current = settings[riskLevel] || settings.LOW;

  return (
    <div className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm ${current.bg} ${current.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${current.text}`}>
          Threat Summary
        </h3>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${current.bg} ${current.text}`}>
          {current.label}
        </span>
      </div>

      <p className="text-gray-300 text-sm leading-relaxed">
        {current.message}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-emerald-400">● Stable Monitoring</span>
          <span className="text-gray-400">● Real-time Analysis</span>
        </div>
        <a
          href="/alerts"
          className={`flex items-center gap-1.5 text-xs font-bold ${current.text} hover:underline decoration-2 underline-offset-4`}
        >
          View latest alerts
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
        </a>
      </div>
    </div>
  );
}
