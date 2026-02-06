export default function AlertsHeader() {
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-5xl font-bold text-white">
        Alerts & <span className="text-violet-400">Logs</span>
      </h1>
      <p className="mt-2 text-gray-400">
        Monitor detected intrusions, alerts, and system activity logs
      </p>
    </div>
  );
}
