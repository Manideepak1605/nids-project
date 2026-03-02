"use client";

export default function AlertsTable({ alerts = [] }) {
  // If no live alerts, show a placeholder or recent static alerts
  const displayAlerts = alerts.length > 0
    ? alerts.slice().reverse().filter(a => a.Status === "BLOCK") // Show only blocks, most recent first
    : [
      { Classification: "No Live Attacks Detected", Source: "System", Confidence: 1.0, timestamp: "--:--:--" },
    ];

  const getSeverityColor = (confidence) => {
    if (confidence > 0.9) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (confidence > 0.7) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  };

  return (
    <div className="rounded-2xl bg-black/40 backdrop-blur border border-gray-800 p-4 w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg">Live Detection Timeline</h3>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/50">STAGE 0-5</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto pr-2 custom-scrollbar">
        <div className="min-w-[500px] space-y-2 max-h-[250px]">
          {displayAlerts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic text-sm">
              Waiting for live traffic...
            </div>
          ) : (
            displayAlerts.map((alert, idx) => (
              <div
                key={`${alert.timestamp}-${idx}`}
                className={`p-3 rounded-lg border transition-all animate-in fade-in slide-in-from-right-4 duration-500 ${getSeverityColor(alert.Confidence)}`}
              >
                <div className="flex justify-between items-start mb-1 text-xs">
                  <span className="font-bold text-sm tracking-wide">{alert.Classification}</span>
                  <span className="text-[10px] opacity-70 font-mono">{alert.timestamp}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-medium opacity-80 mt-2 uppercase tracking-tighter">
                  <span>Source: {alert.src_ip || "Internal"}</span>
                  <span>Confidence: {(alert.Confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d2d2d;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
