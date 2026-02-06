const alerts = [
  { type: "DoS Attack", severity: "High", time: "10:32 AM", color: "red" },
  { type: "Probe Activity", severity: "Medium", time: "11:10 AM", color: "amber" },
  { type: "R2L Attempt", severity: "Low", time: "12:05 PM", color: "cyan" },
  { type: "U2R Attack", severity: "Critical", time: "12:45 PM", color: "violet" },
];

export default function AlertsTable() {
  const colorMap = {
    red: "text-red-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4">
        Detected Alerts
      </h3>

      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-white/10">
          <tr>
            <th className="py-2 text-left">Attack Type</th>
            <th className="py-2 text-left">Severity</th>
            <th className="py-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-3 text-white">{alert.type}</td>
              <td className={`py-3 font-semibold ${colorMap[alert.color]}`}>
                ● {alert.severity}
              </td>
              <td className="py-3 text-gray-400">{alert.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
