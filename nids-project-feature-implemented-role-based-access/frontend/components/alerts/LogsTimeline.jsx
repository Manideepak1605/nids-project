export default function LogsTimeline({ logs = [] }) {
  const colorMap = {
    red: "bg-red-400",
    amber: "bg-amber-400",
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4">
        System Logs
      </h3>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className={`w-2 h-2 mt-2 rounded-full ${colorMap[log.color]}`}
            ></span>
            <div>
              <p className="text-gray-300 text-sm">{log.message}</p>
              <p className="text-gray-500 text-xs">{log.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
