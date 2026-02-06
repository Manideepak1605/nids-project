export default function StatCard({ title, value, color }) {
  const colorMap = {
    violet: "text-violet-400 border-violet-500/30 bg-violet-500/5",
    green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    blue: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    orange: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
  };

  return (
    <div
      className={`rounded-2xl backdrop-blur border p-6 transition-all hover:scale-[1.02] ${colorMap[color] || colorMap.blue}`}
    >
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
