"use client";
import { useRouter } from "next/navigation";

const alerts = [
  { id: "ALR-001", type: "DoS Attack", severity: "High", time: "10:32 AM", color: "red" },
  { id: "ALR-002", type: "Probe Activity", severity: "Medium", time: "11:10 AM", color: "amber" },
  { id: "ALR-003", type: "R2L Attempt", severity: "Low", time: "12:05 PM", color: "cyan" },
  { id: "ALR-004", type: "U2R Attack", severity: "Critical", time: "12:45 PM", color: "violet" },
];

export default function AlertsTable() {
  const router = useRouter();
  const colorMap = {
    red: "text-red-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-semibold">
          Detected Alerts
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full border border-white/5">
          <svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Latest First
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-white/10 text-[11px] uppercase tracking-wider">
          <tr>
            <th className="py-2 text-left font-bold">Attack Type</th>
            <th className="py-2 text-left font-bold">Severity</th>
            <th className="py-2 text-left font-bold">Time</th>
            <th className="py-2 text-right font-bold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {alerts.map((alert, i) => (
            <tr
              key={i}
              onClick={() => router.push(`/xai?event=${alert.id}`)}
              className="cursor-pointer group hover:bg-white/[0.03] transition-colors"
            >
              <td className="py-4 text-white font-medium group-hover:text-violet-400 transition-colors">
                {alert.type}
              </td>
              <td className={`py-4 font-bold ${colorMap[alert.color]}`}>
                ● {alert.severity}
              </td>
              <td className="py-4 text-gray-400 font-mono text-xs italic">{alert.time}</td>
              <td className="py-4 text-right">
                <span className="text-[10px] uppercase font-bold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                  View XAI <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
