export default function AlertStatCard({ title, value, color }) {
  const colors = {
    red: "text-red-400 shadow-red-600/30",
    amber: "text-amber-400 shadow-amber-600/30",
    violet: "text-violet-400 shadow-violet-600/30",
    cyan: "text-cyan-400 shadow-cyan-600/30",
  };

  return (
    <div
      className={`rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg ${colors[color]}`}
    >
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
