const alerts = [
  { name: "DoS Attack", severity: "High", progress: 90, color: "red" },
  { name: "Probe Activity", severity: "Medium", progress: 60, color: "amber" },
  { name: "R2L Attempt", severity: "Low", progress: 30, color: "cyan" },
];

export default function AlertsTable() {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4">
        Attack Surface Overview
      </h3>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.name}>
            <div className="flex justify-between text-sm text-gray-300">
              <span>{alert.name}</span>
              <span className="text-gray-400">{alert.severity}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 mt-2">
              <div
                className={`h-2 rounded-full bg-${alert.color}-400`}
                style={{ width: `${alert.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
